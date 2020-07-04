'use strict';

import express = require('express');

import util = require('../modules/util');
import ticket = require('../modules/ticket');

/**
 * Tickets page router
 */
export const router = express.Router();

router.route('/:ticketId/allowedStatuses')
  .get(function(req, res, next) {
    ticket.getAllowedTicketStatuses(req.params.ticketId)
      .then(allowedStatuses => {
        if ((allowedStatuses as { error: string }).error !== undefined) {
          res.status(422);
        }
        res.json(allowedStatuses);
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/:ticketId/assignee')
  .get(function(req, res, next) {
    ticket.getTicketAssignee(req.params.ticketId)
      .then(assignee => {
        if (assignee.error !== undefined) {
          res.status(422);
        }
        res.json(assignee);
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/:ticketId/priority')
  .get(function(req, res, next) {
    ticket.getTicketPriority(req.params.ticketId)
      .then(priority => {
        if (priority.error !== undefined) {
          res.status(422);
        }
        res.json(priority);
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/:ticketId/department')
  .get(function(req, res, next) {
    ticket.getTicketDepartment(req.params.ticketId)
      .then(department => {
        if (department.error !== undefined) {
          res.status(422);
        }
        res.json(department);
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);

router.route('/:ticketId/dates')
  .get(function(req, res, next) {
    ticket.getTicketStartAndEndDate(req.params.ticketId)
      .then(dates => {
        if (dates.error !== undefined) {
          res.status(422);
        }
        res.json(dates);
      })
      .catch(next);
  })
  .all(util.httpErrorAllowOnlyGet);
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
                  if (
                    sentStatus.error === 'user is not allowed to send messages in this conversation' ||
                    sentStatus.error === 'ticket status does not allow message sending'
                  ) {
                    res.status(403);
                  } else {
                    res.status(422);
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
        case 'changeStatus': {
          if (typeof req.body.status === 'string') {
            ticket.changeTicketStatus(res.locals.userData.userId, req.params.ticketId, req.body.status)
              .then(statusChange => {
                if (statusChange.status === 'success') {
                  res.json(statusChange);
                } else {
                  if (
                    statusChange.error === 'user is not allowed to change ticket status' ||
                    statusChange.error === 'ticket status does not allow ticket status change'
                  ) {
                    res.status(403);
                  } else {
                    res.status(422);
                  }
                  res.json(statusChange);
                }
              })
              .catch(next);
          } else {
            res.status(422).json({ error: 'invalid ticket status' });
          }
          break;
        }
        case 'changeAssignee': {
          if (typeof req.body.assigneeId === 'string') {
            ticket.changeTicketAssignee(
              res.locals.userData.userId,
              res.locals.userData.admin,
              req.params.ticketId,
              req.body.assigneeId
            )
              .then(assigneeChange => {
                if (assigneeChange.status === 'success') {
                  res.json(assigneeChange);
                } else {
                  if (
                    assigneeChange.error === 'user is not allowed to change ticket assignee' ||
                    assigneeChange.error === 'ticket status does not allow ticket assignee change'
                  ) {
                    res.status(403);
                  } else {
                    res.status(422);
                  }
                  res.json(assigneeChange);
                }
              })
              .catch(next);
          } else {
            res.status(422).json({ error: 'invalid ticket assignee' });
          }
          break;
        }
        case 'changePriority': {
          if (typeof req.body.priorityId === 'string') {
            ticket.changeTicketPriority(res.locals.userData.userId, req.params.ticketId, req.body.priorityId)
              .then(priorityChange => {
                if (priorityChange.status === 'success') {
                  res.json(priorityChange);
                } else {
                  if (
                    priorityChange.error === 'user is not allowed to change ticket priority' ||
                    priorityChange.error === 'ticket status does not allow ticket priority change'
                  ) {
                    res.status(403);
                  } else {
                    res.status(422);
                  }
                  res.json(priorityChange);
                }
              })
              .catch(next);
          } else {
            res.status(422).json({ error: 'invalid ticket priority' });
          }
          break;
        }
        case 'changeDepartment': {
          if (typeof req.body.departmentId === 'string') {
            ticket.changeTicketDepartment(res.locals.userData.userId, req.params.ticketId, req.body.departmentId)
              .then(departmentChange => {
                if (departmentChange.status === 'success') {
                  res.json(departmentChange);
                } else {
                  if (
                    departmentChange.error === 'user is not allowed to change ticket department' ||
                    departmentChange.error === 'ticket status does not allow ticket department change'
                  ) {
                    res.status(403);
                  } else {
                    res.status(422);
                  }
                  res.json(departmentChange);
                }
              })
              .catch(next);
          } else {
            res.status(422).json({ error: 'invalid ticket department' });
          }
          break;
        }
        case 'changeEndDate': {
          if (typeof req.body.endDate === 'string') {
            ticket.changeTicketEndDate(res.locals.userData.userId, req.params.ticketId, req.body.endDate)
              .then(endDateChange => {
                if (endDateChange.status === 'success') {
                  res.json(endDateChange);
                } else {
                  if (
                    endDateChange.error === 'user is not allowed to change ticket end date' ||
                    endDateChange.error === 'ticket status does not allow ticket end date change'
                  ) {
                    res.status(403);
                  } else {
                    res.status(422);
                  }
                  res.json(endDateChange);
                }
              })
              .catch(next);
          } else {
            res.status(422).json({ error: 'invalid ticket end date' });
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
