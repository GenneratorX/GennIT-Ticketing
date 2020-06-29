'use strict';

import argon2 = require('argon2');
import nodemailer = require('nodemailer');
import ejs = require('ejs');

import querystring = require('querystring');

import env = require('../env');
import db = require('./db');
import util = require('./util');

import { redis } from './db';

const userRegexp = /^[a-zA-Z\d][a-zA-Z\d!?$^&*._-]{5,39}$/;
const passwordRegexp = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[^\w]).{8,}$/;
const emailRegexp = new RegExp(
  '^(?=.{1,254}$)(?=.{1,64}@)[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+(\\.[-!#$%&\'*+/0-9=?A-Z^_`a-z{|}~]+)*@[A-Za-z0-9]' +
  '([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$'
);

const transporter = nodemailer.createTransport(env.EMAIL_CONFIG);

/**
 * Adds a user to the database
 * @param userName Username
 * @param password Password
 * @param email E-mail address
 * @param active Whether the account is activated
 * @param admin Whether the user is admin
 * @returns Status of the user creation
 */
export async function createUser(userName: string, password: string, email: string, active = false, admin = false) {
  if (userRegexp.test(userName) === true) {
    if (passwordRegexp.test(password) === true) {
      if (emailRegexp.test(email) === true) {
        if ((await usernameExists(userName)) === false) {
          if ((await emailExists(email)) === false) {
            const passwordHash = argon2.hash(password, env.ARGON2_CONFIG);
            const userId = await util.generateId(9, {
              query: 'SELECT user_id FROM users WHERE user_id = $1;',
            }, true);
            await db.query(
              'INSERT INTO users VALUES ($1, $2, $3, $4, $5, DEFAULT, NULL, $6);',
              [userId, userName, await passwordHash, email.toLowerCase(), active, admin]
            );
            sendActivationEmail(userId, userName, email);
            return { status: 'success' };
          }
          return { error: 'email exists' };
        }
        return { error: 'username exists' };
      }
      return { error: 'invalid email' };
    }
    return { error: 'invalid password' };
  }
  return { error: 'invalid username' };
}

/**
 * Authenticates the user
 * @param userName Username
 * @param password Password
 * @returns Status of the user login
 */
export async function loginUser(userName: string, password: string) {
  const query = await db.query(
    'SELECT user_id, username, password, active, admin FROM users WHERE LOWER(username) = LOWER($1);',
    [userName]
  );
  if (query.length === 1) {
    if ((await argon2.verify(query[0].password, password)) === true) {
      if (query[0].active === true) {
        const sessionId = await util.generateId(128, { database: 'redis', query: 'session' });
        db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE LOWER(username) = LOWER($1);', [userName]);

        await redis.set(`session:${sessionId}`,
          JSON.stringify({
            userId: query[0].user_id,
            userName: query[0].username,
            admin: query[0].admin,
          }),
          'EX', 43200 // 12 hours
        );

        return { status: 'success', userName: query[0].username, userId: query[0].user_id, sessionId: sessionId };
      } else {
        const activationToken = await util.generateId(32, { database: 'redis', query: 'activationToken' });
        await redis.set(
          `activationToken:${activationToken}`,
          JSON.stringify({ userName: query[0].username }),
          'EX', 1800 // 30 minutes
        );
        return { error: 'user disabled', activationToken: activationToken };
      }
    }
  }
  return { error: 'username or password not found' };
}

/**
 * Removes the session ID from the database
 * @param sessionId Session ID
 * @returns Status of removal of the session ID
 */
export async function removeSessionId(sessionId: string) {
  const query = await redis.del(`session:${sessionId}`);
  if (query === 1) {
    return true;
  }
  return false;
}

/**
 * Checks if the session ID matches the one stored in the database
 * @param sessionId Session ID
 * @returns Status of session ID
 */
export async function verifySessionId(sessionId: string) {
  const query = await redis.get(`session:${sessionId}`);
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
export async function activateUser(activationCode: string) {
  const query = await db.query('SELECT user_id FROM users_activation WHERE activation_code = $1;', [activationCode]);
  if (query.length === 1) {
    db.query('UPDATE users SET active = true WHERE user_id = $1;', [query[0].user_id]);
    db.query('DELETE FROM users_activation WHERE user_id = $1;', [query[0].user_id]);
    return true;
  }
  return false;
}

/**
 * Checks if the username exists in the database
 * @param username Username
 * @returns True if the username exists, false otherwise
 */
export async function usernameExists(username: string) {
  const query = await db.query('SELECT username FROM users WHERE LOWER(username) = LOWER($1);', [username]);
  if (query.length === 0) {
    return false;
  }
  return true;
}

/**
 * Checks if the email exists in the database
 * @param email Email address
 * @returns True if the email address exists, false otherwise
 */
export async function emailExists(email: string) {
  const query = await db.query('SELECT email FROM users WHERE LOWER(email) = LOWER($1);', [email]);
  if (query.length === 0) {
    return false;
  }
  return true;
}

/**
 * Resets a user password based on a reset code
 * @param resetCode Reset password code
 * @param newPassword New password
 * @returns Status of the reset password
 */
export async function resetPasswordByEmail(resetCode: string, newPassword: string) {
  if (passwordRegexp.test(newPassword) === true) {
    const query = await db.query('SELECT user_id, reset_code FROM users_reset WHERE reset_code = $1;', [resetCode]);
    if (query.length === 1) {
      const passwordHash = argon2.hash(newPassword, env.ARGON2_CONFIG);
      db.query('DELETE FROM users_reset WHERE reset_code = $1;', [resetCode]);
      await db.query('UPDATE users SET password = $1 WHERE user_id = $2;', [await passwordHash, query[0].user_id]);
      return { status: 'success' };
    }
    return { error: 'invalid reset code' };
  }
  return { error: 'invalid password' };
}

/**
 * Sends an activation mail to a user
 * @param userId User ID
 * @param userName User name
 * @param email E-mail address
 */
async function sendActivationEmail(userId: string, userName: string, email: string) {
  if ((await db.query('SELECT user_id FROM users_activation WHERE user_id = $1;', [userId])).length === 1) {
    await db.query('DELETE FROM users_activation WHERE user_id = $1;', [userId]);
  }
  const activationCode = await util.generateId(128, {
    query: 'SELECT activation_code FROM users_activation WHERE activation_code = $1;',
  });
  await db.query('INSERT INTO users_activation VALUES ($1, $2);', [userId, activationCode]);
  sendEmail(email, 'Confirmare creare cont', 'app/views/emails/activation.ejs', {
    userName: userName,
    activationCode: querystring.escape(activationCode),
  });
}

/**
 * Resends an activation mail
 * @param activationToken Activation token
 * @param email E-mail address
 * @returns Status of the activation mail
 */
export async function resendActivationMail(activationToken: string, email: string) {
  let query;
  query = await redis.get(`activationToken:${activationToken}`);
  if (query !== null) {
    const username = JSON.parse(query).userName;
    redis.del(`activationToken:${activationToken}`);
    query = await db.query(
      'SELECT user_id, username FROM users WHERE username = $1 AND LOWER(email) = LOWER($2);',
      [username, email]
    );
    if (query.length === 1) {
      sendActivationEmail(query[0].user_id, query[0].username, email);
      return { status: 'success' };
    }
    return { error: 'invalid email' };
  }
  return { error: 'invalid activation token' };
}

/**
 * Sends an email containing a reset password code
 * @param email Email address
 */
export async function sendResetPasswordEmail(email: string) {
  const query = await db.query('SELECT user_id, username, email, active FROM users WHERE email = $1;', [email]);
  if (query.length === 1 && query[0].active === true) {
    if ((await db.query('SELECT user_id FROM users_reset WHERE user_id = $1;', [query[0].user_id])).length === 1) {
      await db.query('DELETE FROM users_reset WHERE user_id = $1;', [query[0].user_id]);
    }

    const resetCode = await util.generateId(128, {
      query: 'SELECT reset_code FROM users_reset WHERE reset_code = $1;',
    });
    await db.query('INSERT INTO users_reset VALUES ($1, $2);', [query[0].user_id, resetCode]);

    sendEmail(email, 'Resetare parolă', 'app/views/emails/resetPassword.ejs', {
      userName: query[0].username,
      resetCode: querystring.escape(resetCode),
    });
  }
}

/**
 * Sends an e-mail to the specified address
 * @param sendTo E-mail address to send to
 * @param emailSubject E-mail subject
 * @param templatePath EJS Template file path
 * @param templateVariables EJS Template variables
 */
function sendEmail(
  sendTo: string,
  emailSubject: string,
  templatePath: string,
  templateVariables: { [variable: string]: string }
) {
  ejs.renderFile(templatePath, templateVariables, (error, html) => {
    if (error === null) {
      transporter.sendMail({
        from: `"Gennerator" <${env.EMAIL_CONFIG.auth.user}>`,
        to: `<${sendTo}>`,
        replyTo: `"Contact" <${env.EMAIL_REPLYTO}>`,
        subject: emailSubject,
        html: html,
      }).catch(error => {
        console.log(error);
      });
    } else {
      console.log(error);
    }
  });
}
