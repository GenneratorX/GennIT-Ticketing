'use strict';

import moment = require('moment');

import user = require('./user');
import db = require('./db');
import util = require('./util');

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
  ticket.title = util.trimWhitespace(ticket.title);
  ticket.message = util.cleanMultilineText(ticket.message);
  if (ticket.title.length >= 10 && ticket.title.length <= 100) {
    if (ticket.message.length >= 20 && ticket.message.length <= 2000) {
      if ((await departmentExists(ticket.category)) === true) {
        if ((await priorityExists(ticket.priority)) === true) {
          if (ticket.assignee === null || (await user.userIdExists(ticket.assignee)) === true) {
            if (startDateIsValid(ticket.startDate) === true) {
              if (ticket.endDate === null || endDateIsValid(ticket.endDate, ticket.startDate) === true) {
                if (ticket.status === '1' || ticket.status === '2') {
                  if (ticket.status === '1') {
                    ticket.status = '4';
                    if (ticket.assignee === null) {
                      ticket.assignee = ticket.requestor;
                    }
                  } else {
                    if (ticket.assignee === null) {
                      ticket.status = '1';
                    } else {
                      ticket.status = '2';
                    }
                  }
                  const conversationId = await util.generateId(9, {
                    query: 'SELECT conversation_id FROM conversation WHERE conversation_id = $1;',
                  }, true);
                  await db.query('INSERT INTO conversation VALUES ($1, DEFAULT);', [conversationId]);
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
    ticketNumber = 30;
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
    ticketNumber = 30;
  }
  const query = await db.query(
    'SELECT ticket_id "ticketId", title, SUBSTRING(message FOR 200) "message", start_date "startDate", ' +
    'end_date "endDate", a.status_id "statusId", c.status "status", b.priority "priority", d.name "department", ' +
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
 * Gets information about a specific ticket
 * @param ticketId Ticket ID
 * @returns Ticket information
 */
export async function getTicketInfo(ticketId: string) {
  const ticketInfo = await db.query(
    'SELECT title, message, start_date "startDate", conversation_id "conversationId", ' +
    'end_date "endDate", a.status_id "statusId", c.status "status", b.priority "priority", d.name "department", ' +
    'created_by "requestorId", COALESCE(e.first_name||\' \'||e.last_name, e.username) "requestorName", ' +
    'assigned_to "assigneeId", COALESCE(f.first_name||\' \'||f.last_name, f.username) "assigneeName" ' +
    'FROM ticket a ' +
    'INNER JOIN ticket_priority b ON a.priority_id = b.priority_id ' +
    'INNER JOIN ticket_status c ON a.status_id = c.status_id ' +
    'INNER JOIN department d ON a.department_id = d.department_id ' +
    'INNER JOIN users e ON a.created_by = e.user_id ' +
    'LEFT JOIN users f ON a.assigned_to = f.user_id ' +
    'WHERE ticket_id = $1;',
    [ticketId]
  );
  if (ticketInfo.length === 1) {
    const messagesAndEvents: ({
      type: 'evt',
      createDate: Date,
      prettyCreateDate: string,
      relativeCreateDate: string,
      userId: string,
      displayName: string,
      event: string,
      from: any
      to: any,
    } | {
      type: 'msg',
      createDate: Date,
      userId: string,
      displayName: string
      displayNameInitials: string,
      prettyDate: string,
      relativeSentDate: string,
      message: string
    })[] = [];

    const messages = await db.query(
      'SELECT a.message, a.create_date "createDate", a.user_id "userId", ' +
      'COALESCE(b.first_name ||\' \'||b.last_name, b.username) "userName" ' +
      'FROM message a ' +
      'INNER JOIN users b ON a.user_id = b.user_id ' +
      'WHERE a.conversation_id = $1;',
      [ticketInfo[0].conversationId]
    );

    for (let i = 0; i < messages.length; i++) {
      messagesAndEvents.push({
        type: 'msg',
        createDate: messages[i].createDate,
        userId: messages[i].userId,
        displayName: messages[i].userName,
        displayNameInitials: util.getUserInitials(messages[i].userName),
        prettyDate: moment(messages[i].createDate).format('D MMMM YYYY [ora] HH:mm'),
        relativeSentDate: moment(messages[i].createDate).fromNow(),
        message: messages[i].message,
      });
    }

    const events = await db.query(
      'SELECT a.user_id "userId", COALESCE(b.first_name ||\' \'||b.last_name, b.username) "userName", ' +
      'c.event_description "eventType", a.event_date "eventDate", d.user_id "assigneeFromId", ' +
      'COALESCE(d.first_name ||\' \'||d.last_name, d.username) "assigneeFromDisplayName",e.user_id "assigneeToId", ' +
      'COALESCE(e.first_name ||\' \'||e.last_name, e.username) "assigneeToDisplayName", f.status "statusFrom", ' +
      'g.status "statusTo", h.priority "priorityFrom", i.priority "priorityTo", j.name "departmentFrom", ' +
      'k.name "departmentTo", end_date_from "endDateFrom", end_date_to "endDateTo" ' +
      'FROM ticket_event a ' +
      'INNER JOIN users b ON a.user_id = b.user_id ' +
      'INNER JOIN ticket_event_type c ON a.event_type = c.event_type ' +
      'LEFT JOIN users d ON a.assignee_from = d.user_id ' +
      'LEFT JOIN users e ON a.assignee_to = e.user_id ' +
      'LEFT JOIN ticket_status f ON a.status_from = f.status_id ' +
      'LEFT JOIN ticket_status g ON a.status_to = g.status_id ' +
      'LEFT JOIN ticket_priority h ON a.priority_from = h.priority_id ' +
      'LEFT JOIN ticket_priority i ON a.priority_to = i.priority_id ' +
      'LEFT JOIN department j ON a.department_from = j.department_id ' +
      'LEFT JOIN department k ON a.department_to = k.department_id ' +
      'WHERE a.ticket_id = $1;',
      [ticketId]
    );

    for (let i = 0; i < events.length; i++) {
      const event: {
        type: 'evt',
        createDate: Date,
        prettyCreateDate: string,
        relativeCreateDate: string,
        userId: string,
        displayName: string,
        event: string,
        from: any,
        to: any
      } = {
        type: 'evt',
        createDate: events[i].eventDate,
        prettyCreateDate: moment(events[i].eventDate).format('D MMMM YYYY [ora] HH:mm'),
        relativeCreateDate: moment(events[i].eventDate).fromNow(),
        userId: events[i].userId,
        displayName: events[i].userName,
        event: events[i].eventType,
        from: {
          assigneeId: '',
          assigneeDisplayName: '',
        },
        to: {
          assigneeId: '',
          assigneeDisplayName: '',
        },
      };

      switch (events[i].eventType) {
        case 'changeAssignee':
          event.from.assigneeId = events[i].assigneeFromId;
          event.from.assigneeDisplayName = events[i].assigneeFromDisplayName;
          event.to.assigneeId = events[i].assigneeToId;
          event.to.assigneeDisplayName = events[i].assigneeToDisplayName;
          break;
        case 'changeStatus':
          event.from = events[i].statusFrom;
          event.to = events[i].statusTo;
          break;
        case 'changePriority':
          event.from = events[i].priorityFrom;
          event.to = events[i].priorityTo;
          break;
        case 'changeDepartment':
          event.from = events[i].departmentFrom;
          event.to = events[i].departmentTo;
          break;
        case 'changeEndDate':
          event.from =
            events[i].endDateFrom !== null ? moment(events[i].endDateFrom).format('D MMMM YYYY [ora] HH:mm') : null;
          event.to = moment(events[i].endDateTo).format('D MMMM YYYY [ora] HH:mm');
          break;
      }
      messagesAndEvents.push(event);
    }

    messagesAndEvents.sort((a, b) => a.createDate.getTime() - b.createDate.getTime());

    const prettyStartDate = moment(ticketInfo[0].startDate).format('D MMMM YYYY [ora] HH:mm');
    const relativeStartDate = moment(ticketInfo[0].startDate).fromNow();
    const prettyEndDate = moment(ticketInfo[0].endDate).format('D MMMM YYYY [ora] HH:mm');
    const relativeEndDate = ticketInfo[0].endDate === null ? null : moment(ticketInfo[0].endDate).fromNow();
    const requestorNameInitials = util.getUserInitials(ticketInfo[0].requestorName);
    const assigneeNameInitials =
      ticketInfo[0].assigneeName === null ? null : util.getUserInitials(ticketInfo[0].assigneeName);

    return {
      ...ticketInfo[0],
      prettyStartDate,
      relativeStartDate,
      prettyEndDate,
      relativeEndDate,
      requestorNameInitials,
      assigneeNameInitials,
      messagesAndEvents,
    };
  }
  return { error: 'invalid ticket' };
}

/**
 * Adds a message to ticket conversation
 * @param ticketId Ticket ID
 * @param message Message
 * @param senderId ID of the sender
 * @returns Status of the sent message
 */
export async function addMessageToTicket(ticketId: string, message: string, senderId: string) {
  const query = await db.query(
    'SELECT created_by "requestorId",assigned_to "assigneeId",conversation_id "conversationId",status_id "statusId" ' +
    'FROM ticket WHERE ticket_id = $1;',
    [ticketId]
  );
  if (query.length === 1) {
    if (query[0].statusId !== 4) {
      if (senderId === query[0].requestorId || senderId === query[0].assigneeId) {
        message = util.cleanMultilineText(message);
        if (message.length >= 20 && message.length <= 2000) {
          await db.query(
            'INSERT INTO message VALUES (DEFAULT, $1, DEFAULT, $2, $3);',
            [message, senderId, query[0].conversationId]
          );
          return { status: 'success' };
        }
        return { error: 'invalid ticket message' };
      }
      return { error: 'user is not allowed to send messages in this conversation' };
    }
    return { error: 'ticket status does not allow message sending' };
  }
  return { error: 'invalid ticket id' };
}

/**
 * Changes the ticket assignee of a specific ticket
 * @param userId User ID of the user that wants to change the ticket assignee
 * @param adminStatus Admin status of user
 * @param ticketId Ticket ID
 * @param assigneeId New assignee user ID
 * @returns Status of the ticket assignee change
 */
export async function changeTicketAssignee(userId: string, adminStatus: boolean, ticketId: string, assigneeId: string) {
  if (adminStatus === true) {
    if ((await user.userIdExists(assigneeId)) === true) {
      const query = await db.query('SELECT assigned_to, status_id FROM ticket WHERE ticket_id = $1;', [ticketId]);
      if (query.length === 1) {
        if (query[0].status_id !== 4) {
          if (query[0].assigned_to !== assigneeId) {
            db.query(
              'INSERT INTO ticket_event(ticket_id, user_id, event_type, assignee_from, assignee_to) ' +
              'VALUES($1, $2, 1, $3, $4);',
              [
                ticketId,
                userId,
                query[0].assigned_to,
                assigneeId
              ]
            );
            await db.query('UPDATE ticket SET assigned_to = $1 WHERE ticket_id = $2;', [assigneeId, ticketId]);
            if (query[0].assigned_to === null) {
              await db.query('UPDATE ticket SET status_id = 2 WHERE ticket_id = $1;', [ticketId]);
            }
          }
          return { status: 'success' };
        }
        return { error: 'ticket status does not allow ticket assignee change' };
      }
      return { error: 'invalid ticket id' };
    }
    return { error: 'invalid assignee user id' };
  }
  return { error: 'user is not allowed to change ticket assignee' };
}

/**
 * Changes the ticket status of a specific ticket
 * @param userId User ID of the user that wants to change the ticket status
 * @param ticketId Ticket ID
 * @param statusId New ticket status ID
 * @returns Status of the ticket status change
 */
export async function changeTicketStatus(userId: string, ticketId: string, statusId: string) {
  const query = await db.query('SELECT status_id, assigned_to FROM ticket WHERE ticket_id = $1;', [ticketId]);
  if (query.length === 1) {
    if (query[0].assigned_to === userId) {
      const ticketAllowedStatuses =
        (await getAllowedTicketStatuses(ticketId)) as { statusId: string; statusName: string; }[];

      let isStatusAllowed = false;
      for (let i = 0; i < ticketAllowedStatuses.length; i++) {
        if (ticketAllowedStatuses[i].statusId === statusId) {
          isStatusAllowed = true;
          i = ticketAllowedStatuses.length;
        }
      }

      if (isStatusAllowed === true) {
        db.query(
          'INSERT INTO ticket_event(ticket_id, user_id, event_type, status_from, status_to) VALUES($1, $2, 2, $3, $4);',
          [
            ticketId,
            userId,
            query[0].status_id,
            statusId
          ]
        );
        await db.query('UPDATE ticket SET status_id = $1 WHERE ticket_id = $2;', [statusId, ticketId]);
        return { status: 'success' };
      }
      return { error: 'ticket status does not allow ticket status change' };
    }
    return { error: 'user is not allowed to change ticket status' };
  }
  return { error: 'invalid ticket id' };
}

/**
 * Changes the ticket priority of a specific ticket
 * @param userId User ID of the user that wants to change the ticket priority
 * @param ticketId Ticket ID
 * @param priorityId New ticket priority ID
 * @returns Status of the ticket priority change
 */
export async function changeTicketPriority(userId: string, ticketId: string, priorityId: string) {
  const query = await db.query(
    'SELECT assigned_to, priority_id, status_id FROM ticket WHERE ticket_id = $1;', [ticketId]
  );
  if (query.length === 1) {
    if (query[0].assigned_to === userId) {
      if (query[0].status_id !== 4) {
        if ((await priorityExists(query[0].priority_id)) === true) {
          if (query[0].priority_id.toString() !== priorityId) {
            db.query(
              'INSERT INTO ticket_event(ticket_id, user_id, event_type, priority_from, priority_to) ' +
              'VALUES($1, $2, 3, $3, $4);',
              [
                ticketId,
                userId,
                query[0].priority_id,
                priorityId
              ]
            );
            await db.query('UPDATE ticket SET priority_id = $1 WHERE ticket_id = $2;', [priorityId, ticketId]);
            return { status: 'success' };
          }
          return { error: 'ticket priority is identical with the specified value' };
        }
        return { error: 'invalid priority id' };
      }
      return { error: 'ticket status does not allow ticket priority change' };
    }
    return { error: 'user is not allowed to change ticket priority' };
  }
  return { error: 'invalid ticket id' };
}

/**
 * Changes the ticket department of a specific ticket
 * @param userId User ID of the user that wants to change the ticket department
 * @param ticket_id Ticket ID
 * @param departmentId New ticket department ID
 * @returns Status of the ticket department change
 */
export async function changeTicketDepartment(userId: string, ticketId: string, departmentId: string) {
  const query = await db.query(
    'SELECT assigned_to, department_id, status_id FROM ticket WHERE ticket_id = $1;', [ticketId]
  );
  if (query.length === 1) {
    if (query[0].assigned_to === userId) {
      if (query[0].status_id !== 4) {
        if ((await departmentExists(departmentId)) === true) {
          if (query[0].department_id.toString() !== departmentId) {
            db.query(
              'INSERT INTO ticket_event(ticket_id, user_id, event_type, department_from, department_to) ' +
              'VALUES($1, $2, 4, $3, $4); ',
              [
                ticketId,
                userId,
                query[0].department_id,
                departmentId
              ]
            );
            await db.query('UPDATE ticket SET department_id = $1 WHERE ticket_id = $2;', [departmentId, ticketId]);
            return { status: 'success' };
          }
          return { error: 'ticket department is identical with the specified value' };
        }
        return { error: 'invalid department id' };
      }
      return { error: 'ticket status does not allow ticket department change' };
    }
    return { error: 'user is not allowed to change ticket department' };
  }
  return { error: 'invalid ticket id' };
}

/**
 * Changes the ticket end date of a specific ticket
 * @param userId User ID of the user that wants to change the ticket end date
 * @param ticketId Ticket ID
 * @param endDate New ticket end date
 * @returns Status of the ticket end date change
 */
export async function changeTicketEndDate(userId: string, ticketId: string, endDate: string) {
  const query = await db.query(
    'SELECT assigned_to, start_date, end_date, status_id FROM ticket WHERE ticket_id = $1;', [ticketId]
  );
  if (query.length === 1) {
    if (query[0].assigned_to === userId) {
      if (query[0].status_id !== 4) {
        if (endDateIsValid(endDate, query[0].start_date) === true) {
          if (
            moment(endDate, moment.ISO_8601, true).isSame(moment(query[0].end_date, moment.ISO_8601, true)) === false
          ) {
            db.query(
              'INSERT INTO ticket_event(ticket_id, user_id, event_type, end_date_from, end_date_to) ' +
              'VALUES($1, $2, 5, $3, $4); ',
              [
                ticketId,
                userId,
                query[0].end_date,
                endDate
              ]
            );
            await db.query('UPDATE ticket SET end_date = $1 WHERE ticket_id = $2;', [endDate, ticketId]);
            return { status: 'success' };
          }
          return { error: 'ticket end date is identical with the specified value' };
        }
        return { error: 'invalid ticket end date' };
      }
      return { error: 'ticket status does not allow ticket end date change' };
    }
    return { error: 'user is not allowed to change ticket end date' };
  }
  return { error: 'invalid ticket id' };
}

/**
 * Gets the allowed ticket statuses
 * @param ticketId Ticket ID
 * @returns Allowed ticket statuses
 */
export async function getAllowedTicketStatuses(ticketId: string) {
  const query = await db.query('SELECT status_id FROM ticket WHERE ticket_id = $1;', [ticketId]);
  if (query.length === 1) {
    switch (query[0].status_id) {
      case 1:
        return [{ statusId: '3', statusName: 'În așteptare' }];
      case 2:
        return [{ statusId: '3', statusName: 'În așteptare' }, { statusId: '4', statusName: 'Soluționat' }];
      case 3:
        return [{ statusId: '2', statusName: 'Atribuit' }, { statusId: '4', statusName: 'Soluționat' }];
      case 4:
        return [];
    }
  }
  return { error: 'invalid ticket id' };
}

/**
 * Gets the ticket assignee ID of a specific ticket
 * @param ticketId Ticket ID
 * @returns Ticket assignee ID
 */
export async function getTicketAssignee(ticketId: string) {
  const query = await db.query('SELECT assigned_to "assigneeId" FROM ticket WHERE ticket_id = $1;', [ticketId]);
  if (query.length === 1) {
    return query[0];
  }
  return { error: 'invalid ticket id' };
}

/**
 * Gets the ticket priority ID of a specific ticket
 * @param ticketId Ticket ID
 * @returns Ticket priority ID
 */
export async function getTicketPriority(ticketId: string) {
  const query = await db.query('SELECT priority_id "priorityId" FROM ticket WHERE ticket_id = $1;', [ticketId]);
  if (query.length === 1) {
    return query[0];
  }
  return { error: 'invalid ticket id' };
}

/**
 * Gets the ticket department ID of a specific ticket
 * @param ticketId Ticket ID
 * @returns Ticket department ID
 */
export async function getTicketDepartment(ticketId: string) {
  const query = await db.query('SELECT department_id "departmentId" FROM ticket WHERE ticket_id = $1;', [ticketId]);
  if (query.length === 1) {
    return query[0];
  }
  return { error: 'invalid ticket id' };
}

/**
 * Gets the start and end dates of a specific ticket
 * @param ticketId Ticket ID
 * @returns Ticket start and end dates
 */
export async function getTicketStartAndEndDate(ticketId: string) {
  const query = await db.query(
    'SELECT start_date "startDate", end_date "endDate" FROM ticket WHERE ticket_id = $1;', [ticketId]
  );
  if (query.length === 1) {
    return { startDate: query[0].startDate, endDate: query[0].endDate };
  }
  return { error: 'invalid ticket id' };
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
 * Checks if the ticket start date is valid
 * @param startDate Start date
 * @returns Whether the date is valid
 */
function startDateIsValid(startDate: string) {
  const startDateMoment = moment(startDate, moment.ISO_8601, true);
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
