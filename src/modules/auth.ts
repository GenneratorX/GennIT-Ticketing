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
  '([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(\\.[A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*$'
);

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
            const userID = await generateCode('userID');
            await db.query(
              'INSERT INTO users VALUES ($1, $2, $3, $4, $5, DEFAULT, NULL, $6);',
              [userID, userName, await passwordHash, email.toLowerCase(), active, admin]
            );
            sendActivationEmail(userID, userName, email);
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
    'SELECT user_id, username, password, active FROM users WHERE LOWER(username) = LOWER($1);',
    [userName]
  );
  if (query.length === 1) {
    if ((await argon2.verify(query[0].password, password)) === true) {
      if (query[0].active === true) {
        const sessionID = await generateCode('sessionID');
        db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE LOWER(username) = LOWER($1);', [userName]);

        await redis.set(`session:${sessionID}`,
          JSON.stringify({
            userId: query[0].user_id,
            userName: query[0].username,
          }),
          'EX', 43200 // 12 hours
        );

        return { status: 'success', userName: query[0].username, sessionID: sessionID };
      } else {
        const activationToken = await generateCode('activationToken');
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
 * @param userID User ID
 * @param userName User name
 * @param email E-mail address
 */
async function sendActivationEmail(userID: string, userName: string, email: string) {
  if ((await db.query('SELECT user_id FROM users_activation WHERE user_id = $1;', [userID])).length === 1) {
    await db.query('DELETE FROM users_activation WHERE user_id = $1;', [userID]);
  }
  const activationCode = await generateCode('activationCode');
  await db.query('INSERT INTO users_activation VALUES ($1, $2);', [userID, activationCode]);
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
    const resetCode = await generateCode('resetPasswordCode');
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

/* eslint-disable no-constant-condition */
/**
 * Generates a unique base64 encoded string
 * @param type Type of code to generate
 * @returns Base64 encoded string that is unique to the database
 */
async function generateCode(type: 'userID' | 'sessionID' | 'activationCode' | 'activationToken' | 'resetPasswordCode') {
  switch (type) {
    case 'userID': {
      while (true) {
        const userID =
          (await randomBytes(9))
            .toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
        const query = await db.query('SELECT user_id FROM users WHERE user_id = $1;', [userID]);
        if (query.length === 0) {
          return userID;
        }
      }
    }
    case 'sessionID': {
      while (true) {
        const sessionID = (await randomBytes(128)).toString('base64');
        const query = await redis.get(`session:${sessionID}`);
        if (query === null) {
          return sessionID;
        }
      }
    }
    case 'activationCode': {
      while (true) {
        const activationCode = (await randomBytes(128)).toString('base64');
        const query = await db.query(
          'SELECT activation_code FROM users_activation WHERE activation_code = $1;',
          [activationCode]
        );
        if (query.length === 0) {
          return activationCode;
        }
      }
    }
    case 'activationToken': {
      while (true) {
        const activationToken = (await randomBytes(32)).toString('base64');
        const query = await redis.get(`activationToken:${activationToken}`);
        if (query === null) {
          return activationToken;
        }
      }
    }
    case 'resetPasswordCode': {
      while (true) {
        const resetCode = (await randomBytes(128)).toString('base64');
        const query = await db.query(
          'SELECT reset_code FROM users_reset WHERE reset_code = $1;',
          [resetCode]
        );
        if (query.length === 0) {
          return resetCode;
        }
      }
    }
  }
}
/* eslint-enable no-constant-condition */
