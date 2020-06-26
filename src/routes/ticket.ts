'use strict';

import express = require('express');

import util = require('../modules/util');
import ticket = require('../modules/ticket');

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
    ticket.getTicketsForTemplate()
      .then(tickets => {
        res.render('tickets', { tickets });
      })
      .catch(next);
  })
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
      ticket.addTicket({
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
        .then(createdStatus => {
          if (createdStatus.status === 'success') {
            res.setHeader('location', `/ticket/${createdStatus.ticketId}`);
            res.status(201).json({ status: createdStatus.status });
          } else {
            res.status(422).json(createdStatus);
          }
        })
        .catch(next);
    } else {
      res.status(422).json({ error: 'invalid request body' });
    }
  })
  .all(util.httpErrorAllowOnlyGetPost);

router.route('/:ticketId')
  .get(function(req, res, next) {
    ticket.getTicketInfo(req.params.ticketId)
      .then(ticket => {
        res.render('ticket', { ticket });
      })
      .catch(next);
  })
  .patch(function(req, res, next) {
    if (typeof req.body.event === 'string') {
      switch (req.body.event) {
        case 'sendMessage': {
          if (typeof req.body.message === 'string') {
            ticket.addMessageToTicket(req.params.ticketId, req.body.message, res.locals.userData.userId)
              .then(sentStatus => {
                if (sentStatus.status === 'success') {
                  res.json(sentStatus);
                } else {
                  switch (sentStatus.error) {
                    case 'invalid ticket id': res.status(422); break;
                    case 'user is not allowed to send messages in this conversation': res.status(403); break;
                    case 'invalid ticket message': res.status(422); break;
                  }
                  res.json(sentStatus);
                }
              })
              .catch(next);
          } else {
            res.status(422).json({ error: 'invalid message' });
          }
          break;
        }
        default: res.status(422).json({ error: 'invalid event name' });
      }
    } else {
      res.status(422).json({ error: 'missing event name' });
    }
  })
  .all(util.httpErrorAllowOnlyGetPatch);
