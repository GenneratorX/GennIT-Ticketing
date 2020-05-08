'use strict';

import express = require('express');

import { app } from '../app';
import util = require('../modules/util');
import auth = require('../modules/auth');

/**
 * Authentication router
 */
export const router = express.Router();

router.route('/signup')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (
      typeof req.body.username === 'string' &&
      typeof req.body.password === 'string' &&
      typeof req.body.email === 'string' &&
      typeof req.body.policy === 'boolean' &&
      req.body.policy === true
    ) {
      auth.createUser(req.body.username, req.body.password, req.body.email)
        .then(created => {
          res.json(created);
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid request body' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/signin')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (typeof req.body.username === 'string' && typeof req.body.password === 'string') {
      auth.loginUser(req.body.username, req.body.password)
        .then(login => {
          if (login.response === true) {
            res.cookie('__Host-sessionID', login.sessionID, {
              signed: true,
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
            }).json({ response: login.response, userName: login.userName });
          } else {
            if (login.error === 'user disabled') {
              res.cookie('__Host-activationToken', login.activationToken, {
                signed: true,
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 1800000, // 30 minutes
              }).json({ response: login.response, error: login.error });
            } else {
              res.json(login);
            }
          }
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid request body' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/usernameExists')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (typeof req.body.username === 'string') {
      auth.usernameExists(req.body.username)
        .then(exists => {
          res.json({ response: exists });
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid username' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/emailExists')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (typeof req.body.email === 'string') {
      auth.emailExists(req.body.email)
        .then(exists => {
          res.json({ response: exists });
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid email' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/forgotPassword')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (typeof req.body.email === 'string') {
      auth.sendResetPasswordEmail(req.body.email)
        .then(() => {
          res.json({ response: true });
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid email' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/resetPasswordByEmail')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (typeof req.body.password === 'string' && typeof req.body.resetCode === 'string') {
      auth.resetPasswordByEmail(req.body.resetCode, req.body.password)
        .then(resetStatus => {
          res.json(resetStatus);
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid password or reset code' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/resendActivationMail')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (typeof req.body.email === 'string') {
      if (typeof req.signedCookies['__Host-activationToken'] === 'string') {
        auth.resendActivationMail(req.signedCookies['__Host-activationToken'], req.body.email)
          .then(response => {
            res.clearCookie('__Host-activationToken', {
              path: '/',
              httpOnly: true,
              secure: true,
              sameSite: true,
            });
            if (response.error === 'invalid activation token') {
              res.status(403).json(response.error);
            } else {
              res.json({ response: true });
            }
          })
          .catch(next);
      } else {
        res.status(403).json({ error: 'invalid activation token' });
      }
    } else {
      res.status(422).json({ error: 'invalid email' });
    }
  }).all(util.httpErrorAllowOnlyPost);

/**
 * Check if user is logged in and redirect him to the login page if hes not
 */
router.use(function(req, res, next) {
  if (typeof req.signedCookies['__Host-sessionID'] === 'string') {
    auth.verifySessionID(req.signedCookies['__Host-sessionID'])
      .then(session => {
        if (session.error === undefined) {
          app.locals.userName = session.userName;
          if (req.path === '/auth') {
            res.setHeader('location', '/');
            res.status(302).end();
          } else {
            next();
          }
        } else {
          // Remove invalid/expired cookie
          res.clearCookie('__Host-sessionID', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: true,
          });
          if (req.method === 'GET') {
            res.setHeader('location', '/auth');
            res.status(302).end();
          } else {
            res.setHeader('WWW-Authenticate', 'gennit-auth');
            res.status(401).json({ error: 'user not authenticated' });
          }
        }
      })
      .catch(next);
  } else {
    if (req.method === 'GET') {
      if (req.path !== '/auth') {
        res.setHeader('location', '/auth');
        res.status(302).end();
      } else {
        next();
      }
    } else {
      res.setHeader('WWW-Authenticate', 'gennit-auth');
      res.status(401).json({ error: 'user not authenticated' });
    }
  }
});

router.route('/logout')
  .post(function(req, res, next) {
    auth.removeSessionID(req.signedCookies['__Host-sessionID'])
      .then(removed => {
        if (removed === true) {
          res.clearCookie('__Host-sessionID', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: true,
          }).json({ response: true });
        } else {
          res.status(500).json({ response: false, error: 'logout failed' });
        }
      })
      .catch(next);
  }).all(util.httpErrorAllowOnlyPost);

router.route('/auth')
  .get(function(req, res, next) {
    if (typeof req.query.activation === 'string') {
      auth.activateUser(req.query.activation)
        .then(activated => {
          if (activated === true) {
            res.render('activation');
          } else {
            res.render('auth');
          }
        })
        .catch(next);
    } else {
      res.render('auth');
    }
  }).all(util.httpErrorAllowOnlyGet);
