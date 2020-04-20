'use strict';

import express = require('express');
import cookieParser = require('cookie-parser');

import env = require('./env');
import util = require('./modules/util');
import auth = require('./modules/auth');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'app/views');
app.set('etag', false);
app.set('x-powered-by', false);

app.use(express.json());
app.use(cookieParser(env.COOKIE_SECRET));

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
        if (loggedIn.response === true) {
          res.cookie('__Host-sessionID', loggedIn.sessionID, {
            signed: true,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
          }).json({ response: loggedIn.response, userName: loggedIn.userName });
        } else {
          res.json(loggedIn);
        }
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
  if (typeof req.signedCookies['__Host-sessionID'] === 'string') {
    auth.verifySessionID(req.signedCookies['__Host-sessionID'])
      .then(session => {
        if (session.error === undefined) {
          app.locals.userName = session.userName;
          if (req.path === '/auth') {
            res.setHeader('location', '/');
            res.status(302).end();
          } else {
            next();
          }
        } else {
          // Remove invalid/expired cookie
          res.clearCookie('__Host-sessionID', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: true,
          });
          res.setHeader('location', '/auth');
          res.status(302).end();
        }
      })
      .catch(error => {
        console.log(error);
      });
  } else {
    if (req.path !== '/auth') {
      //res.redirect('/auth');
      res.setHeader('location', '/auth');
      res.status(302).end();
    } else {
      next();
    }
  }
});

app.get('/logout', function(req, res) {
  auth.removeSessionID(req.signedCookies['__Host-sessionID'])
    .then(removed => {
      if (removed === true) {
        res.clearCookie('__Host-sessionID', {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: true,
        }).json({ response: true });
      } else {
        res.status(500).json({ response: false, error: 'logout failed' });
      }
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ error: 'internal error' });
    });
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
          res.render('auth');
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
