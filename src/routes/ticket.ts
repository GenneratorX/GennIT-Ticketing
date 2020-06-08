'use strict';

import express = require('express');

import util = require('../modules/util');
import tickets = require('../modules/ticket');

/**
 * Tickets page router
 */
export const router = express.Router();

router.route('/add')
  .post(function(req, res, next) {
    if (
      typeof req.body.title === 'string' &&
      typeof req.body.message === 'string' &&
      typeof req.body.category === 'string' &&
      typeof req.body.priority === 'string' &&
      (typeof req.body.assignee === 'string' || req.body.assignee === null) &&
      typeof req.body.startDate === 'string' &&
      (typeof req.body.endDate === 'string' || req.body.endDate === null) &&
      typeof req.body.status === 'string'
    ) {
      tickets.addTicket({
        title: req.body.title,
        message: req.body.message,
        requestor: res.locals.userData.userId,
        category: req.body.category,
        priority: req.body.priority,
        assignee: req.body.assignee,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        status: req.body.status,
      })
        .then(created => {
          res.json(created);
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid request body' });
    }
  })
  .all(util.httpErrorAllowOnlyPost);

/**
 * Add security headers
 */
router.get('*', util.securityHeaders);

router.route('/')
  .get(function(req, res) {
    res.render('tickets');
  })
  .all(util.httpErrorAllowOnlyGet);