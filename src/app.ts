'use strict';

import express = require('express');

import env = require('./env');
import util = require('./modules/util');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'app/views');
app.set('etag', false);
app.set('x-powered-by', false);

/**
 * Check if user is logged in and redirect him to the login page if hes not
 */
app.use(function(req, res, next) {
  if (app.locals.userName === undefined && req.path !== '/auth') {
    //res.redirect('/auth');
    res.setHeader('location', '/auth');
    res.status(302).end();
  } else {
    next();
  }
});
/**
 * Add security headers
 */
app.get('*', util.securityHeaders);

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/auth', function(req, res) {
  res.render('auth');
});

app.use(function(req, res) {
  res.status(404).render('404');
});

app.listen(env.APP_PORT, () => console.log(`Aplicatia ruleaza pe portul ${env.APP_PORT}`));
