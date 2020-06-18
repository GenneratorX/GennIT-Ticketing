'use strict';

import express = require('express'); // eslint-disable-line no-unused-vars
import crypto = require('crypto');
import util = require('util');

import db = require('./db');
import { redis } from './db';

const randomBytes = util.promisify(crypto.randomBytes);

/**
 * Sets the basic security headers required for every request
 * @param req Request object
 * @param res Response object
 * @param next Next function
 */
export function securityHeaders(req: express.Request, res: express.Response, next: express.NextFunction) {
  crypto.randomBytes(16, (error, buffer) => {
    if (error === null) {
      res.locals.cspNonce = buffer.toString('base64');
      res.setHeader('Content-Security-Policy',
        `default-src 'none'; ` +
        `base-uri 'none'; ` +
        `connect-src 'self'; ` +
        `font-src https://fonts.gstatic.com/s/raleway/; ` +
        `form-action 'self'; ` +
        `frame-ancestors 'none'; ` +
        `img-src 'self' https://static.gennerator.com; ` +
        `manifest-src https://static.gennerator.com; ` +
        `media-src 'self'; ` +
        `object-src 'none'; ` +
        `report-to default; ` +
        `report-uri https://gennerator.report-uri.com/r/d/csp/enforce; ` +
        `script-src 'strict-dynamic' 'nonce-${res.locals.cspNonce}'; ` +
        `style-src 'nonce-${res.locals.cspNonce}' https://static.gennerator.com/css/ https://fonts.googleapis.com/`
      );
      res.setHeader('Feature-Policy',
        `accelerometer 'none'; ` +
        `ambient-light-sensor 'none'; ` +
        `autoplay 'none'; ` +
        `camera 'none'; ` +
        `encrypted-media 'none'; ` +
        `fullscreen 'none'; ` +
        `geolocation 'none'; ` +
        `gyroscope 'none'; ` +
        `magnetometer 'none'; ` +
        `microphone 'none'; ` +
        `midi 'none'; ` +
        `payment 'none'; ` +
        `speaker 'none'; ` +
        `sync-xhr 'none'; ` +
        `usb 'none'; ` +
        `vr 'none'`
      );
      res.setHeader('Expect-CT',
        'max-age=1209600, ' +
        'enforce, ' +
        'report-uri=https://gennerator.report-uri.com/r/d/ct/enforce'
      );
      res.setHeader('Report-To', '{' +
        '"group":"default",' +
        '"max_age":31536000,' +
        '"endpoints":[{"url":"https://gennerator.report-uri.com/a/d/g"}],' +
        '"include_subdomains":true}'
      );
      res.setHeader('Referrer-Policy', 'same-origin');
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('X-XSS-Protection', '1; mode=block; report=https://gennerator.report-uri.com/r/d/xss/enforce');
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      next();
    } else {
      next(error);
    }
  });
}

/**
 * Checks if the Content-Type header is *application/json*
 * @param req Request object
 * @param res Response object
 * @param next Next function
 */
export function checkJsonHeader(req: express.Request, res: express.Response, next: express.NextFunction) {
  const contentType = req.get('content-type');
  if (contentType === 'application/json; charset=utf-8') {
    next();
  } else {
    res.status(415).json({ error: 'wrong Content-Type header. use \'application/json; charset=utf-8\'' });
  }
}

/**
 * Sends a HTTP 405 Method not allowed on request methods other than GET/HEAD
 * @param req Request object
 * @param res Response object
 */
export function httpErrorAllowOnlyGet(req: express.Request, res: express.Response) {
  res.setHeader('Allow', 'GET, HEAD');
  res.status(405).json({ error: `request method ${req.method} is inappropriate for the URL ${req.url}` });
}

/**
 * Sends a HTTP 405 Method not allowed on request methods other than POST
 * @param req Request object
 * @param res Response object
 */
export function httpErrorAllowOnlyPost(req: express.Request, res: express.Response) {
  res.setHeader('Allow', 'POST');
  res.status(405).json({ error: `request method ${req.method} is inappropriate for the URL ${req.url}` });
}

/**
 * Sends a HTTP 405 Method not allowed on request methods other than GET/HEAD/POST
 * @param req Request object
 * @param res Response object
 */
export function httpErrorAllowOnlyGetPost(req: express.Request, res: express.Response) {
  res.setHeader('Allow', 'GET, HEAD, POST');
  res.status(405).json({ error: `request method ${req.method} is inappropriate for the URL ${req.url}` });
}

/**
 * Sends a HTTP 405 Method not allowed on request methods other than GET/HEAD/PUT
 * @param req Request object
 * @param res Response object
 */
export function httpErrorAllowOnlyGetPut(req: express.Request, res: express.Response) {
  res.setHeader('Allow', 'GET, HEAD, PUT');
  res.status(405).json({ error: `request method ${req.method} is inappropriate for the URL ${req.url}` });
}

/**
 * Generates a unique random Base64 encoded string to be used as an ID
 * @param length Length of ID in bytes
 * @param query Database query to check if the ID is unique
 * @param urlSafe Whether to generate a URL safe ID
 * @returns Unique Base64 encoded string
 */
export async function generateId(
  length: number,
  query: {
    database?: 'pg' | 'redis',
    query: string,
  },
  urlSafe?: boolean
) {
  while (true) { //eslint-disable-line no-constant-condition
    let uniqueId = (await randomBytes(length)).toString('base64');
    if (urlSafe === true) {
      uniqueId = uniqueId
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
    }

    if (query.database !== 'redis') {
      const dbQuery = await db.query(query.query, [uniqueId]);
      if (dbQuery.length === 0) {
        return uniqueId;
      }
    } else {
      const dbQuery = await redis.get(`${query.query}:${uniqueId}`);
      if (dbQuery === null) {
        return uniqueId;
      }
    }
  }
}

/**
 * Gets initials from a name or username
 * @param name Name or username
 * @returns User initials
 */
export function getUserInitials(name: string) {
  let initials: string;
  if (name.indexOf(' ') !== -1) {
    const nameSplit = name.split(' ');
    initials = `${nameSplit[0].charAt(0)}${nameSplit[1].charAt(0)}`.toUpperCase();
  } else {
    initials = name.charAt(0).toUpperCase();
  }
  return initials;
}

/**
 * Removes leading/trailing whitespace and consecutive whitespaces
 * @param text String to clean
 * @returns Clean string
 */
export function trimWhitespace(text: string) {
  return text.trim().replace(/ +/g, ' ');
}

/**
 * Removes leading and trailing newlines/spaces and consecutive newlines/spaces frpm a multiline text
 * @param text String to clean
 * @returns Clean string
 */
export function cleanMultilineText(text: string) {
  /**
   * 1. Replace multiple consecutive newlines with maximum two newlines
   * 2. Remove leading and trailing newlines
   * 3. Replace multiple consecutive spaces with only one space
   * 4. Remove leading and trailing spaces from each line
   */
  return text.replace(/\n\s*\n\s*\n/g, '\n\n').replace(/^\s+|\s+$/g, '').replace(/ +/g, ' ').replace(/^ +| +$/gm, '');
}
