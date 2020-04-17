'use strict';

import argon2 = require('argon2');
import nodemailer = require('nodemailer');
import ejs = require('ejs');
import Redis = require('ioredis');

import util = require('util');
import crypto = require('crypto');
import querystring = require('querystring');

import env = require('../env');
import db = require('./db');

const randomBytes = util.promisify(crypto.randomBytes);

const userRegexp = /^[a-zA-Z\d][a-zA-Z\d!?$^&*._-]{5,39}$/;
const passwordRegexp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w]).{8,}$/;
const emailRegexp = new RegExp(
  '^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+(\\.[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]' +
  '([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$');

const transporter = nodemailer.createTransport(env.EMAIL_CONFIG);
const redis = new Redis(env.REDIS_CONFIG);

/**
 * Adds a user to the database
 * @param userName Username
 * @param password Password
 * @param email E-mail address
 * @param active Account activation status [true - enabled | false - disabled]
 * @param admin Whether the user is admin [true - admin | false - not admin]
 * @returns Status of the user creation
 */
export async function createUser(userName: string, password: string, email: string, active = false, admin = false) {
  if (userRegexp.test(userName) === true) {
    if (passwordRegexp.test(password) === true) {
      if (emailRegexp.test(email) === true) {
        if ((await usernameExists(userName)) === false) {
          if ((await emailExists(email)) === false) {
            const passwordHash = argon2.hash(password, env.ARGON2_CONFIG);
            const userID = await genRandomUserID();
            await db.query(
              'INSERT INTO users VALUES ($1, $2, $3, $4, $5, DEFAULT, NULL, $6);',
              [userID, userName, await passwordHash, email.toLowerCase(), active, admin]
            );
            sendActivationEmail(userID, userName, email);
            return { response: true };
          } else {
            return { response: false, error: 'email exists' };
          }
        } else {
          return { response: false, error: 'username exists' };
        }
      } else {
        return { response: false, error: 'invalid email' };
      }
    } else {
      return { response: false, error: 'invalid password' };
    }
  } else {
    return { response: false, error: 'invalid username' };
  }
}

/**
 * Authenticates the user
 * @param userName Username
 * @param password Password
 * @returns Status of the user login
 */
export async function loginUser(userName: string, password: string) {
  const query = await db.query(
    'SELECT username, password, active FROM users WHERE LOWER(username) = LOWER($1);',
    [userName]
  );
  if (query.length === 1) {
    if (query[0].active === true) {
      if ((await argon2.verify(query[0].password, password) === true)) {
        const sessionID = (await randomBytes(128)).toString('base64');
        db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE LOWER(username) = LOWER($1)', [userName]);
        await redis.set(`session:${sessionID}`, JSON.stringify({ userName: query[0].username }), 'EX', 43200);
        return { response: true, userName: query[0].username, sessionID: sessionID };
      } else {
        return { response: false, error: 'username or password not found' };
      }
    } else {
      return { response: false, error: 'user disabled' };
    }
  } else {
    return { response: false, error: 'username or password not found' };
  }
}

/**
 * Removes the sessionID from the database
 * @param sessionID Session ID
 * @returns Status of the removal of the session ID
 */
export async function removeSessionID(sessionID: string) {
  const query = await redis.del(`session:${sessionID}`);
  if (query === 1) {
    return true;
  }
  return false;
}

/**
 * Checks if the sessionID matches the one stored in the database
 * @param sessionID Session ID
 * @returns Status of sessionID
 */
export async function verifySessionID(sessionID: string) {
  const query = await redis.get(`session:${sessionID}`);
  if (query !== null) {
    return JSON.parse(query);
  }
  return { error: 'invalid session id' };
}

/**
 * Activates the user account
 * @param activationKey Activation key
 * @returns True if the activation was successful, false otherwise
 */
export async function activateUser(activationCode: string): Promise<boolean> {
  const query = await db.query('SELECT user_id FROM users_activation WHERE activation_code = $1;', [activationCode]);
  if (query.length === 1) {
    db.query('UPDATE users SET active = true WHERE user_id = $1', [query[0].user_id]);
    db.query('DELETE FROM users_activation WHERE user_id = $1', [query[0].user_id]);
    return true;
  }
  return false;
}

/**
 * Checks if the username exists in the database
 * @param username Username
 * @returns True if the username exists, false otherwise
 */
export async function usernameExists(username: string): Promise<boolean> {
  const query = await db.query('SELECT COUNT(username) FROM users WHERE LOWER(username) = LOWER($1);', [username]);
  if (query.length === 1 && query[0].count === '1') {
    return true;
  }
  return false;
}

/**
 * Checks if the email exists in the database
 * @param email Email address
 * @returns True if the email address exists, false otherwise
 */
export async function emailExists(email: string): Promise<boolean> {
  const query = await db.query('SELECT COUNT(email) FROM users WHERE LOWER(email) = LOWER($1);', [email]);
  if (query.length === 1 && query[0].count === '1') {
    return true;
  }
  return false;
}

/**
 * Generates a unique base64 URL safe value to use as a user id
 * @returns Base64 URL safe string that is unique to the application
 */
async function genRandomUserID(): Promise<string> {
  while (true) { // eslint-disable-line no-constant-condition
    const rand = await randomBytes(9);
    const userID = rand.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    const query = await db.query('SELECT COUNT(user_id) FROM users WHERE user_id = $1;', [userID]);
    if (query.length === 1 && query[0].count === '0') {
      return userID;
    }
  }
}

/**
 * Sends an activation mail to a user
 * @param userID User ID
 * @param userName User name
 * @param email E-mail address
 */
async function sendActivationEmail(userID: string, userName: string, email: string) {
  const activationCode = (await randomBytes(128)).toString('base64');
  await db.query('INSERT INTO users_activation VALUES ($1, $2);', [userID, activationCode]);
  ejs.renderFile('app/views/emails/activation.ejs', {
    userName: userName,
    activationCode: querystring.escape(activationCode),
  }, (error, html) => {
    if (error === null) {
      transporter.sendMail({
        from: `"Gennerator" <${env.EMAIL_CONFIG.auth.user}>`,
        to: `"${userName}" <${email}>`,
        replyTo: `"Contact" <${env.EMAIL_REPLYTO}>`,
        subject: 'Confirmare creare cont',
        html: html,
      });
    } else {
      console.log(error);
    }
  });
}

