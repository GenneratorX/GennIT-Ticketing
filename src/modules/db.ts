'use strict';

import pg = require('pg');
import env = require('../env');

const pool = new pg.Pool(env.PG_CONFIG);

/**
 * Executes a query on the database
 * @param query Query string
 * @param parameters Query parameters
 * @returns Query result if the query was successfull, false otherwise
 */
export async function query(query: string, parameters?: string[]) {
  let connection: pg.PoolClient | undefined;
  try {
    connection = await pool.connect();
    const response = await connection.query({
      text: query,
      values: parameters,
    });
    return response.rows;
  } catch (error) {
    return dbErrorHandler(error);
  } finally {
    if (connection !== undefined) {
      connection.release();
    }
  }
}

function dbErrorHandler(error: { message: string, code: string }) {
  let display = new Error('Database - ');
  switch (error.code) {
    case '28000':
      display.message += `INVALID_AUTHENTICATION - ${error.message}`;
      break;
    case '3D000':
      display.message += `INVALID_DATABASE - ${error.message}`;
      break;
    case '42601':
      display.message += `SYNTAX_ERROR - ${error.message}`;
      break;
    case 'ENOENT':
      display.message += `CONNECTION_ERROR - ${error.message}`;
      break;
    default:
      display.message += `UNDEFINED_ERROR - ${error.message}`;
      break;
  }
  throw display;
}