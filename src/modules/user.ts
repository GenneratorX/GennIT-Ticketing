'use strict';

import moment = require('moment');

import db = require('./db');
import util = require('./util');

const nameRegexp = /^([a-z\u00C0-\u02AB]+((['´`,. -][a-z\u00C0-\u02AB ])?[a-z\u00C0-\u02AB]*)*){2,50}$/i;
const phoneNumberRegexp = /^[0-9]{9,15}$/;

/**
 * Gets user information based on user ID
 * @param userId User ID
 * @returns User information
 */
export async function getUserInfo(userId: string) {
  if (userId.length === 12) {
    const query = await db.query(
      'SELECT username "userName", email, create_date "createDate", last_login "lastLogin", first_name "firstName", ' +
      'last_name "lastName", birth_date "birthDate", gender, phone_number "phoneNumber", admin, ' +
      'COALESCE(first_name ||\' \'||last_name, username) "displayName"' +
      'FROM users WHERE user_id = $1;',
      [userId]
    );
    if (query.length === 1) {
      return {
        status: 'success',
        userInfo: {
          ...query[0],
          displayNameInitials: util.getUserInitials(query[0].displayName),
        },
      };
    }
    return { error: 'user id does not exist' };
  }
  return { error: 'invalid user id' };
}

/**
 * Changes the user information
 * @param requestorId Requestor user ID
 * @param userId User ID
 * @param firstName First name
 * @param lastName Last name
 * @param birthDate Birth date
 * @param gender Gender
 * @param phoneNumber Phone number
 * @returns Status of the update
 */
export async function updateUserInfo(
  requestorId: string,
  userId: string,
  firstName: string | null,
  lastName: string | null,
  birthDate: string | null,
  gender: string | null,
  phoneNumber: string | null
) {
  if (userId.length === 12) {
    if ((await userIdExists(userId)) === true) {
      if (requestorId === userId) {
        if (firstName === null || nameRegexp.test(firstName) === true) {
          if (lastName === null || nameRegexp.test(lastName) === true) {
            if (birthDate === null || moment(birthDate, 'YYYY-MM-DD', true).isValid() === true) {
              if (gender === null || gender === '0' || gender === '1' || gender === '2') {
                if (phoneNumber === null || phoneNumberRegexp.test(phoneNumber) === true) {
                  await db.query(
                    'UPDATE users SET first_name = $1,last_name = $2,birth_date = $3,gender = $4,phone_number = $5 ' +
                    'WHERE user_id = $6;',
                    [firstName, lastName, birthDate, gender, phoneNumber, userId]
                  );
                  return { status: 'success' };
                }
                return { error: 'invalid phone number' };
              }
              return { error: 'invalid gender' };
            }
            return { error: 'invalid date' };
          }
          return { error: 'invalid last name' };
        }
        return { error: 'invalid first name' };
      }
      return { error: 'not enough permissions to modify this user' };
    }
    return { error: 'user id does not exist' };
  }
  return { error: 'invalid user id' };
}

/**
 * Gets the user list
 * @retuns User list containing user IDs and user names
 */
export async function getUserList() {
  const query = await db.query(
    'SELECT user_id "userId", COALESCE(first_name||\' \'||last_name, username) "displayName" ' +
    'FROM users WHERE active = TRUE;'
  );
  return query;
}

/**
 * Checks if the user ID exists in the database
 * @param userId User ID
 * @returns Whether the user ID exists
 */
export async function userIdExists(userId: string) {
  const query = await db.query('SELECT user_id FROM users WHERE user_id = $1;', [userId]);
  if (query.length === 1) {
    return true;
  }
  return false;
}
