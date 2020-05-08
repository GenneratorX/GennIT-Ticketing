'use strict';

import express = require('express');

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
