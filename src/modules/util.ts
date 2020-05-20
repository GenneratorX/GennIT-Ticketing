'use strict';

import express = require('express'); // eslint-disable-line no-unused-vars
import crypto = require('crypto');

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
 * Checks if the string is a valid date
 * @param date String to check
 * @returns True if string is a valid date, false otherwise
 */
export function isDate(date: string) {
  if (isNaN(Date.parse(date))) {
    return false;
  } else {
    if (date !== (new Date(date)).toISOString().substr(0, 10)) {
      return false;
    }
  }
  return true;
}
