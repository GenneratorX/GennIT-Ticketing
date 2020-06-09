'use strict';

import express = require('express');

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
      req.body.policy === true
    ) {
      auth.createUser(req.body.username, req.body.password, req.body.email)
        .then(createStatus => {
          if (createStatus.status !== 'success') {
            switch (createStatus.error) {
              case 'username exists': res.status(409); break;
              case 'email exists': res.status(409); break;
              default: res.status(422);
            }
          }
          res.json(createStatus);
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
        .then(loginStatus => {
          if (loginStatus.error === undefined) {
            res.cookie('__Host-sessionID', loginStatus.sessionId, {
              signed: true,
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
            }).json({ status: 'success', userName: loginStatus.userName, userId: loginStatus.userId });
          } else {
            if (loginStatus.error === 'user disabled') {
              res.cookie('__Host-activationToken', loginStatus.activationToken, {
                signed: true,
                httpOnly: true,
                secure: true,
                sameSite: 'strict',
                maxAge: 1800000, // 30 minutes
              }).json({ error: 'user disabled' });
            } else {
              res.setHeader('WWW-Authenticate', 'gennit-auth');
              res.status(401).json(loginStatus);
            }
          }
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid request body' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/usernameExists')
  .get(function(req, res, next) {
    if (typeof req.query.username === 'string') {
      auth.usernameExists(req.query.username)
        .then(exists => {
          res.json({ exists: exists });
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid username' });
    }
  }).all(util.httpErrorAllowOnlyGet);

router.route('/emailExists')
  .get(function(req, res, next) {
    if (typeof req.query.email === 'string') {
      auth.emailExists(req.query.email)
        .then(exists => {
          res.json({ exists: exists });
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid email' });
    }
  }).all(util.httpErrorAllowOnlyGet);

router.route('/forgotPassword')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (typeof req.body.email === 'string') {
      auth.sendResetPasswordEmail(req.body.email)
        .then(() => {
          res.json({ status: 'success' });
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
          if (resetStatus.status !== 'success') {
            res.status(422);
          }
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
            if (response.status !== 'success') {
              switch (response.error) {
                case 'invalid activation token': res.status(403); break;
                case 'invalid email': res.status(422); break;
              }
            }
            res.json(response);
          })
          .catch(next);
      } else {
        res.status(403).json({ error: 'invalid activation token' });
      }
    } else {
      res.status(422).json({ error: 'invalid email' });
    }
  }).all(util.httpErrorAllowOnlyPost);

router.route('/logout')
  .post(function(req, res, next) {
    auth.removeSessionId(req.signedCookies['__Host-sessionID'])
      .then(removed => {
        if (removed === true) {
          res.clearCookie('__Host-sessionID', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: true,
          }).json({ status: 'success' });
        } else {
          res.status(404).json({ error: 'session id not found' });
        }
      })
      .catch(next);
  }).all(util.httpErrorAllowOnlyPost);
