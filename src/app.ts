'use strict';

import express = require('express');

import env = require('./env');
import util = require('./modules/util');
import auth = require('./modules/auth');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'app/views');
app.set('etag', false);
app.set('x-powered-by', false);
app.use(express.json());

app.post('/signup', function(req, res) {
  if (
    typeof req.body.username === 'string' &&
    typeof req.body.password === 'string' &&
    typeof req.body.email === 'string' &&
    typeof req.body.policy === 'boolean' &&
    req.body.policy === true
  ) {
    auth.createUser(req.body.username, req.body.password, req.body.email)
      .then(created => {
        res.json(created);
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error: 'internal error' });
      });
  } else {
    res.status(400).json({ error: 'invalid request body' });
  }
});

app.post('/signin', function(req, res) {
  if (typeof req.body.username === 'string' && typeof req.body.password === 'string') {
    auth.loginUser(req.body.username, req.body.password)
      .then(loggedIn => {
        res.json(loggedIn);
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error: 'internal error' });
      });
  } else {
    res.status(400).json({ error: 'invalid request body' });
  }
});

app.post('/usernameExists', function(req, res) {
  if (typeof req.body.username === 'string') {
    auth.usernameExists(req.body.username)
      .then(exists => {
        res.json({ response: exists });
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error: 'internal error' });
      });
  } else {
    res.status(400).json({ error: 'invalid username' });
  }
});

app.post('/emailExists', function(req, res) {
  if (typeof req.body.email === 'string') {
    auth.emailExists(req.body.email)
      .then(exists => {
        res.json({ response: exists });
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error: 'internal error' });
      });
  } else {
    res.status(400).json({ error: 'invalid email' });
  }
});

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
  if (typeof req.query.activation === 'string') {
    auth.activateUser(req.query.activation)
      .then(activated => {
        if (activated === true) {
          res.render('activation');
        } else {
          res.setHeader('location', '/auth');
          res.status(302).end();
        }
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({ error: 'internal error' });
      });
  } else {
    res.render('auth');
  }
});

app.use(function(req, res) {
  res.status(404).render('404');
});

app.listen(env.APP_PORT, () => console.log(`Aplicatia ruleaza pe portul ${env.APP_PORT}`));
