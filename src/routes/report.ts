'use strict';

import express = require('express');

import util = require('../modules/util');
import report = require('../modules/report');

/**
 * Tickets page router
 */
export const router = express.Router();

/**
 * Add security headers
 */
router.get('*', util.securityHeaders);

router.route('/')
  .get(function(req, res, next) {
    report.getReports()
      .then(reports => {
        res.render('report', reports);
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);
