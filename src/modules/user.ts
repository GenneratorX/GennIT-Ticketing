'use strict';

import db = require('./db');
import util = require('./util');

const nameRegexp = /^([a-z\u00C0-\u02AB]+((['´`,. -][a-z\u00C0-\u02AB ])?[a-z\u00C0-\u02AB]*)*){2,50}$/i;
const phoneNumberRegexp = /^[0-9]{9,15}$/;

/**
 * Gets user information based on user id
 * @param userId User id
 * @returns User information
 */
export async function getUserInfo(userId: string) {
  if (userId.length === 12) {
    const query = await db.query(
      'SELECT username, email, create_date, last_login, first_name, last_name, birth_date, gender, phone_number ' +
      'FROM users WHERE user_id = $1;',
      [userId]
    );
    if (query.length === 1) {
      return { status: 'success', userInfo: query[0] };
    }
  }
  return { error: 'invalid user id' };
}

/**
 * Changes the user information
 * @param userId User id
 * @param firstName First name
 * @param lastName Last name
 * @param birthDate Birth date
 * @param gender Gender
 * @param phoneNumber Phone number
 * @returns Status of the update
 */
export async function updateUserInfo(
  userId: string,
  firstName: string | null,
  lastName: string | null,
  birthDate: string | null,
  gender: string | null,
  phoneNumber: string | null
) {
  if (firstName === null || nameRegexp.test(firstName) === true) {
    if (lastName === null || nameRegexp.test(lastName) === true) {
      if (birthDate === null || util.isDate(birthDate) === true) {
        if (gender === null || gender === '0' || gender === '1' || gender === '2') {
          if (phoneNumber === null || phoneNumberRegexp.test(phoneNumber) === true) {
            await db.query(
              'UPDATE users SET first_name = $1, last_name = $2, birth_date = $3, gender = $4, phone_number = $5' +
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

export async function getUserList() {
  const query = await db.query('SELECT user_id AS "userId", username AS "userName" FROM users WHERE active = TRUE;');
  return query;
}
