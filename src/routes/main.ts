'use strict';

import express = require('express');

import util = require('../modules/util');

/**
 * Main page router
 */
export const router = express.Router();

/**
 * Add security headers
 */
router.get('*', util.securityHeaders);

router.route('/')
  .get(function(req, res) {
    res.render('index');
  })
  .all(util.httpErrorAllowOnlyGet);
