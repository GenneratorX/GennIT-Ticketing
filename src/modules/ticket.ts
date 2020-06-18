'use strict';

import moment = require('moment');

import db = require('./db');
import util = require('./util');

moment.locale('ro-RO', {
  parentLocale: 'ro',
  relativeTime: {
    past: 'acum %s',
  },
});

/**
 * Adds a ticket to the database
 * @param ticket Ticket object
 * @returns Status of the ticket insertion
 */
export async function addTicket(ticket: {
  title: string,
  message: string,
  requestor: string,
  category: string,
  priority: string,
  assignee: string | null,
  startDate: string,
  endDate: string | null,
  status: string,
}) {
  if (ticket.title.length >= 10 && ticket.title.length <= 100) {
    if (ticket.message.length >= 20 && ticket.message.length <= 2000) {
      if ((await departmentExists(ticket.category)) === true) {
        if ((await priorityExists(ticket.priority)) === true) {
          if (ticket.assignee === null || ticket.assignee) {
            if (startDateIsValid(ticket.startDate) === true) {
              if (ticket.endDate === null || endDateIsValid(ticket.endDate, ticket.startDate) === true) {
                if ((await statusExists(ticket.status)) === true) {
                  const conversationId = await util.generateId(9, {
                    query: 'SELECT conversation_id FROM conversation WHERE conversation_id = $1;',
                  }, true);
                  await db.query('INSERT INTO conversation VALUES ($1, DEFAULT)', [conversationId]);
                  const ticketId = await util.generateId(9, {
                    query: 'SELECT ticket_id FROM ticket WHERE ticket_id = $1;',
                  }, true);
                  await db.query(
                    'INSERT INTO ticket VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);',
                    [
                      ticketId,
                      ticket.title,
                      ticket.message,
                      ticket.startDate,
                      ticket.endDate,
                      ticket.status,
                      ticket.priority,
                      ticket.category,
                      ticket.requestor,
                      ticket.assignee,
                      conversationId
                    ]
                  );
                  return { status: 'success', ticketId: ticketId };
                }
                return { error: 'invalid ticket status' };
              }
              return { error: 'invalid ticket end date' };
            }
            return { error: 'invalid ticket start date' };
          }
          return { error: 'invalid ticket assignee id' };
        }
        return { error: 'invalid ticket priority' };
      }
      return { error: 'invalid ticket category' };
    }
    return { error: 'invalid ticket message' };
  }
  return { error: 'invalid ticket title' };
}

/**
 * Gets a ticket list from the database
 * @param limit How many tickets to get
 * @returns List of tickets
 */
export async function getTickets(limit?: number) {
  let ticketNumber: number;
  if (limit !== undefined && limit < 30) {
    ticketNumber = limit;
  } else {
    ticketNumber = 10;
  }
  const query = await db.query(
    'SELECT ticket_id "ticketId", title, SUBSTRING(message FOR 200) "message", start_date "startDate", ' +
    'end_date "endDate", status_id "status", priority_id "priority", department_id "department", ' +
    'created_by "requestor", assigned_to "assignee" ' +
    'FROM ticket ' +
    'ORDER BY "startDate" DESC LIMIT $1; ',
    [ticketNumber]
  );
  return query;
}

/**
 * Gets a ticket list from the database and prepare it to be rendered by the template engine
 * @param limit How many tickets to get
 * @returns List of tickets ready to be rendered
 */
export async function getTicketsForTemplate(limit?: number) {
  let ticketNumber: number;
  if (limit !== undefined && limit < 30) {
    ticketNumber = limit;
  } else {
    ticketNumber = 10;
  }
  const query = await db.query(
    'SELECT ticket_id "ticketId", title, SUBSTRING(message FOR 200) "message", start_date "startDate", ' +
    'end_date "endDate",a.status_id "statusId", c.status "status", b.priority "priority", d.name "department", ' +
    'created_by "requestorId", COALESCE(e.first_name||\' \'||e.last_name, e.username) "requestorName", ' +
    'assigned_to "assigneeId", COALESCE(f.first_name||\' \'||f.last_name, f.username) "assigneeName" ' +
    'FROM ticket a ' +
    'INNER JOIN ticket_priority b ON a.priority_id = b.priority_id ' +
    'INNER JOIN ticket_status c ON a.status_id = c.status_id ' +
    'INNER JOIN department d ON a.department_id = d.department_id ' +
    'INNER JOIN users e ON a.created_by = e.user_id ' +
    'LEFT JOIN users f ON a.assigned_to = f.user_id ' +
    'ORDER BY start_date DESC ' +
    'LIMIT $1;',
    [ticketNumber]
  );
  const tickets = [];
  for (let i = 0; i < query.length; i++) {
    const trimmedMessage = query[i].message.replace(/\s+/g, ' ');
    const prettyStartDate = moment(query[i].startDate).format('D MMMM YYYY [ora] HH:mm');
    const relativeStartDate = moment(query[i].startDate).fromNow();
    const prettyEndDate = moment(query[i].endDate).format('D MMMM YYYY [ora] HH:mm');
    const relativeEndDate = query[i].endDate === null ? null : moment(query[i].endDate).fromNow();
    const requestorNameInitials = util.getUserInitials(query[i].requestorName);
    const assigneeNameInitials = query[i].assigneeName === null ? null : util.getUserInitials(query[i].assigneeName);

    tickets.push({
      ...query[i],
      trimmedMessage,
      prettyStartDate,
      relativeStartDate,
      prettyEndDate,
      relativeEndDate,
      requestorNameInitials,
      assigneeNameInitials,
    });
  }
  return tickets;
}

/**
 * Checks if the department exists in the database
 * @param departmentId Department ID
 * @returns Whether the department exists
 */
async function departmentExists(departmentId: string) {
  const query = await db.query('SELECT department_id FROM department WHERE department_id = $1;', [departmentId]);
  if (query.length === 1) {
    return true;
  }
  return false;
}

/**
 * Checks if the ticket priority exists in the database
 * @param priorityId Priority ID
 * @returns Whether the priority exists
 */
async function priorityExists(priorityId: string) {
  const query = await db.query('SELECT priority_id FROM ticket_priority WHERE priority_id = $1;', [priorityId]);
  if (query.length === 1) {
    return true;
  }
  return false;
}

/**
 * Checks if the ticket status exists in the database
 * @param statusId Status ID
 * @returns Whether the status exists
 */
async function statusExists(statusId: string) {
  const query = await db.query('SELECT status_id FROM ticket_status WHERE status_id = $1;', [statusId]);
  if (query.length === 1) {
    return true;
  }
  return false;
}

/**
 * Checks if the ticket start date is valid
 * @param startDate Start date
 * @returns Whether the date is valid
 */
function startDateIsValid(startDate: string) {
  const startDateMoment = moment.utc(startDate, moment.ISO_8601, true);
  if (startDateMoment.isValid() === true && startDateMoment.diff(moment(), 'days', true) >= -1) {
    return true;
  }
  return false;
}


/**
 * Checks if the ticket end date is valid
 * @param endDate Ticket end date
 * @param startDate Ticket start date
 * @returns Whether the end date is valid
 */
function endDateIsValid(endDate: string, startDate: string) {
  const startDateMoment = moment(startDate, moment.ISO_8601, true);
  const endDateMoment = moment(endDate, moment.ISO_8601, true);
  if (
    startDateMoment.isValid() === true &&
    endDateMoment.isValid() === true &&
    endDateMoment.diff(startDateMoment, 'days', true) >= 1
  ) {
    return true;
  }
  return false;
}
