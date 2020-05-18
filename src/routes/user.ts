'use strict';

import express = require('express');

import { app } from '../app';
import util = require('../modules/util');
import user = require('../modules/user');

/**
 * User router
 */
export const router = express.Router();

router.route('/user')
  .get(function(req, res) {
    res.setHeader('location', '/');
    res.status(302).end();
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/user/:userId')
  .get(function(req, res, next) {
    user.getUserInfo(req.params.userId)
      .then(userInfo => {
        if (userInfo.error === undefined) {
          res.render('user', userInfo.userInfo);
        } else {
          res.setHeader('location', '/');
          res.status(302).end();
        }
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/userInfo')
  .get(function(req, res, next) {
    if (typeof req.query.userId === 'string') {
      user.getUserInfo(req.query.userId)
        .then(userInfo => {
          res.json(userInfo);
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'missing userId query parameter' });
    }
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/updateUserInfo')
  .post(util.checkJsonHeader, function(req, res, next) {
    if (
      typeof req.body.userId === 'string' &&
      (typeof req.body.firstName === 'string' || req.body.firstName === null) &&
      (typeof req.body.lastName === 'string' || req.body.lastName === null) &&
      (typeof req.body.birthDate === 'string' || req.body.birthDate === null) &&
      (typeof req.body.gender === 'string' || req.body.gender === null) &&
      (typeof req.body.phoneNumber === 'string' || req.body.phoneNumber === null)
    ) {
      if (app.locals.userData.userId === req.body.userId) {
        user.updateUserInfo(
          req.body.userId,
          req.body.firstName,
          req.body.lastName,
          req.body.birthDate,
          req.body.gender,
          req.body.phoneNumber
        )
          .then(updateStatus => {
            res.json(updateStatus);
          })
          .catch(next);
      } else {
        res.status(403).json({ error: 'not enough permissions to modify this user' });
      }
    } else {
      res.status(422).json({ error: 'invalid request body' });
    }
  })
  .all(util.httpErrorAllowOnlyPost);
