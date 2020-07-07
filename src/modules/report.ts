'use strict';

import db = require('./db');

/**
 * Gets user and ticket information from the database
 * @returns User and ticket reports
 */
export async function getReports() {
  const userQuery = db.query(
    'SELECT a.user_id "userId", COALESCE(first_name ||\' \'||last_name, username) "userName", ' +
    'SUM(CASE WHEN b.created_by = a.user_id THEN 1 ELSE 0 END) "openedTickets", ' +
    'SUM(CASE WHEN b.assigned_to = a.user_id AND b.status_id = 2 THEN 1 ELSE 0 END) "assignedTickets", ' +
    'SUM(CASE WHEN b.assigned_to = a.user_id AND b.status_id = 3 THEN 1 ELSE 0 END) "pendingTickets", ' +
    'SUM(CASE WHEN b.assigned_to = a.user_id AND b.status_id = 4 THEN 1 ELSE 0 END) "solvedTickets", ' +
    'SUM(CASE WHEN b.assigned_to = a.user_id THEN 1 ELSE 0 END) "allTickets", ' +
    'SUM(CASE WHEN b.assigned_to = a.user_id AND b.end_date < NOW() AND b.status_id != 4 THEN 1 ELSE 0 END) ' +
    '"expiredTickets", COALESCE(' +
    'SUM(CASE WHEN b.assigned_to = a.user_id AND b.status_id = 4 THEN 1 ELSE 0 END) /' +
    'NULLIF(SUM(CASE WHEN b.assigned_to = a.user_id THEN 1 ELSE 0 END),0)::float*100, 0' +
    ') || \'%\' "solvedTicketsPercentage" ' +
    'FROM users a, ticket b ' +
    'GROUP BY a.user_id ' +
    'ORDER BY "userName" DESC;'
  ) as any;

  const messagesQuery = db.query(
    'SELECT COALESCE(first_name ||\' \'||last_name, username) "userName", COUNT(message_id) "sentMessages", ' +
    'COALESCE(ROUND(COUNT(message_id)/NULLIF(COUNT(DISTINCT(conversation_id)),0)::numeric,2),0) "averageMessages" ' +
    'FROM users a ' +
    'LEFT JOIN message b ON a.user_id = b.user_id ' +
    'GROUP BY a.user_id ' +
    'ORDER BY "userName" DESC;'
  ) as any;

  const ticketQuery = db.query(
    'SELECT a.name "departmentName", COUNT(b.ticket_id) "ticketCount", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.status_id = 1) "statusNew", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.status_id = 2) "statusAssigned", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.status_id = 3) "statusPending", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.status_id = 4) "statusSolved", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.priority_id = 1) "priorityLow", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.priority_id = 2) "priorityMedium", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.priority_id = 3) "priorityHigh", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.priority_id = 4) "priorityUrgent", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.end_date > NOW()) "onTime", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.end_date < NOW()) "notOnTime", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.end_date IS NULL) "noEndDate", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.assigned_to IS NOT NULL) "hasAssignee", ' +
    'COUNT(b.ticket_id) FILTER (WHERE b.assigned_to IS NULL) "doesntHaveAssignee" ' +
    'FROM department a ' +
    'INNER JOIN ticket b ON a.department_id = b.department_id ' +
    'GROUP BY a.department_id ' +
    'ORDER BY a.name;'
  ) as any;

  const reports = await Promise.all([userQuery, messagesQuery, ticketQuery]);

  const userReport: {
    userId: string,
    userName: string,
    openedTickets: number,
    assignedTickets: number,
    pendingTickets: number,
    solvedTickets: number,
    allTickets: number,
    expiredTickets: number,
    solvedTicketsPercentage: string,
    sentMessages: number,
    sentMessagesAverageByConversation: number,
  }[] = [];

  for (let i = 0; i < reports[0].length; i++) {
    userReport.push({
      userId: reports[0][i].userId,
      userName: reports[0][i].userName,
      openedTickets: reports[0][i].openedTickets,
      assignedTickets: reports[0][i].assignedTickets,
      pendingTickets: reports[0][i].pendingTickets,
      solvedTickets: reports[0][i].solvedTickets,
      allTickets: reports[0][i].allTickets,
      expiredTickets: reports[0][i].expiredTickets,
      solvedTicketsPercentage: reports[0][i].solvedTicketsPercentage,
      sentMessages: reports[1][i].sentMessages,
      sentMessagesAverageByConversation: reports[1][i].averageMessages,
    });
  }

  const ticketReport: {
    departmentName: string,
    ticketCount: string,
    statusNew: number,
    statusAssigned: number,
    statusPending: number,
    statusSolved: number,
    priorityLow: number,
    priorityMedium: number,
    priorityHigh: number,
    priorityUrgent: number,
    onTime: number,
    notOnTime: number,
    noEndDate: number,
    hasAssignee: number,
    doesntHaveAssignee: number,
  }[] = [];

  const ticketStatistics = {
    ticketCount: 0,
    statusNew: 0,
    statusAssigned: 0,
    statusPending: 0,
    statusSolved: 0,
    priorityLow: 0,
    priorityMedium: 0,
    priorityHigh: 0,
    priorityUrgent: 0,
    onTime: 0,
    notOnTime: 0,
    noEndDate: 0,
    hasAssignee: 0,
    doesntHaveAssignee: 0,
  };

  for (let i = 0; i < reports[2].length; i++) {
    ticketReport.push({
      departmentName: reports[2][i].departmentName,
      ticketCount: reports[2][i].ticketCount,
      statusNew: reports[2][i].statusNew,
      statusAssigned: reports[2][i].statusAssigned,
      statusPending: reports[2][i].statusPending,
      statusSolved: reports[2][i].statusSolved,
      priorityLow: reports[2][i].priorityLow,
      priorityMedium: reports[2][i].priorityMedium,
      priorityHigh: reports[2][i].priorityHigh,
      priorityUrgent: reports[2][i].priorityUrgent,
      onTime: reports[2][i].onTime,
      notOnTime: reports[2][i].notOnTime,
      noEndDate: reports[2][i].noEndDate,
      hasAssignee: reports[2][i].hasAssignee,
      doesntHaveAssignee: reports[2][i].doesntHaveAssignee,
    });

    ticketStatistics.ticketCount += parseInt(reports[2][i].ticketCount, 10);
    ticketStatistics.statusNew += parseInt(reports[2][i].statusNew, 10);
    ticketStatistics.statusAssigned += parseInt(reports[2][i].statusAssigned, 10);
    ticketStatistics.statusPending += parseInt(reports[2][i].statusPending, 10);
    ticketStatistics.statusSolved += parseInt(reports[2][i].statusSolved, 10);
    ticketStatistics.priorityLow += parseInt(reports[2][i].priorityLow, 10);
    ticketStatistics.priorityMedium += parseInt(reports[2][i].priorityMedium, 10);
    ticketStatistics.priorityHigh += parseInt(reports[2][i].priorityHigh, 10);
    ticketStatistics.priorityUrgent += parseInt(reports[2][i].priorityUrgent, 10);
    ticketStatistics.onTime += parseInt(reports[2][i].onTime, 10);
    ticketStatistics.notOnTime += parseInt(reports[2][i].notOnTime, 10);
    ticketStatistics.noEndDate += parseInt(reports[2][i].noEndDate, 10);
    ticketStatistics.hasAssignee += parseInt(reports[2][i].hasAssignee, 10);
    ticketStatistics.doesntHaveAssignee += parseInt(reports[2][i].doesntHaveAssignee, 10);

  }

  return { userReport, ticketReport, ticketStatistics };
}
