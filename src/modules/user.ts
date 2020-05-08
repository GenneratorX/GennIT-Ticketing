'use strict';

import db = require('./db');

/**
 * Gets user information based on user id
 * @param userId User id
 * @returns User information
 */
export async function getUserInfo(userId: string) {
  if (userId.length === 12) {
    const query = await db.query(
      'SELECT username, email, create_date, last_login FROM users WHERE user_id = $1;',
      [userId]
    );
    if (query.length === 1) {
      return { response: true, userInfo: query[0] };
    } else {
      return { response: false, error: 'invalid user id' };
    }
  } else {
    return { response: false, error: 'invalid user id' };
  }
}
