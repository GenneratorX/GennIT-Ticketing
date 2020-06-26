'use strict';

import pg = require('pg');
import Redis = require('ioredis');

import env = require('../env');

/**
 * Node-Postgres is parsing TIMESTAMP data types in local timezone instead of UTC. This makes sure the dates are
 * always in UTC timezone.
 */
pg.types.setTypeParser(1114, function(stringValue) {
  return new Date(Date.parse(stringValue + '+0000'));
});

const pool = new pg.Pool(env.PG_CONFIG);
export const redis = new Redis(env.REDIS_CONFIG);

/**
 * Executes a query on the database
 * @param query Query string
 * @param parameters Query parameters
 * @returns Query result if the query was successfull, false otherwise
 */
export async function query(query: string, parameters?: any[]): Promise<{ [property: string]: any }[]> {
  let connection: pg.PoolClient | undefined;
  try {
    connection = await pool.connect();
    const response = await connection.query({
      text: query,
      values: parameters,
    });
    return response.rows;
  } catch (error) {
    const display = new Error('Database - ');
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
  } finally {
    if (connection !== undefined) {
      connection.release();
    }
  }
}
