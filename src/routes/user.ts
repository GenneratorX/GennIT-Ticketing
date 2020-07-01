'use strict';

import express = require('express');

import util = require('../modules/util');
import user = require('../modules/user');

/**
 * User router
 */
export const router = express.Router();

router.route('/list')
  .get(function(req, res, next) {
    user.getUserList()
      .then(userList => {
        if (res.locals.userData.admin === true) {
          res.json({ userList: userList });
        } else {
          res.status(403).json({ error: 'not enough permissions to view the user list' });
        }
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/')
  .get(function(req, res) {
    res.setHeader('location', '/main');
    res.status(302).end();
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/:userId/info')
  .get(function(req, res, next) {
    user.getUserInfo(req.params.userId)
      .then(userInfo => {
        if (userInfo.status !== 'success') {
          switch (userInfo.error) {
            case 'invalid user id': res.status(422); break;
            case 'user id does not exist': res.status(404); break;
            default: res.status(422); break;
          }
        }
        res.json(userInfo);
      })
      .catch(next);
  })
  .put(util.checkJsonHeader, function(req, res, next) {
    if (
      (typeof req.body.firstName === 'string' || req.body.firstName === null) &&
      (typeof req.body.lastName === 'string' || req.body.lastName === null) &&
      (typeof req.body.birthDate === 'string' || req.body.birthDate === null) &&
      (typeof req.body.gender === 'string' || req.body.gender === null) &&
      (typeof req.body.phoneNumber === 'string' || req.body.phoneNumber === null)
    ) {
      user.updateUserInfo(
        res.locals.userData.userId,
        req.params.userId,
        req.body.firstName,
        req.body.lastName,
        req.body.birthDate,
        req.body.gender,
        req.body.phoneNumber
      )
        .then(updateStatus => {
          if (updateStatus.status !== 'success') {
            switch (updateStatus.error) {
              case 'user id does not exist': res.status(404); break;
              case 'not enough permissions to modify this user': res.status(403); break;
              default: res.status(422);
            }
          }
          res.json(updateStatus);
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid request body' });
    }
  })
  .all(util.httpErrorAllowOnlyGetPut);

/**
 * Add security headers
 */
router.get('*', util.securityHeaders);

router.route('/:userId')
  .get(function(req, res, next) {
    user.getUserInfo(req.params.userId)
      .then(userInfo => {
        if (userInfo.error === undefined) {
          res.render('user', userInfo.userInfo);
        } else {
          res.setHeader('location', '/main');
          res.status(302).end();
        }
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);
