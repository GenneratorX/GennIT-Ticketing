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
app.use(function(error: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'invalid json' });
  } else {
    next();
  }
});

app.use(cookieParser(env.COOKIE_SECRET));

app.post('/signup', util.checkJsonHeader, function(req, res, next) {
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
      .catch(next);
  } else {
    res.status(422).json({ error: 'invalid request body' });
  }
});

app.post('/signin', util.checkJsonHeader, function(req, res, next) {
  if (typeof req.body.username === 'string' && typeof req.body.password === 'string') {
    auth.loginUser(req.body.username, req.body.password)
      .then(login => {
        if (login.response === true) {
          res.cookie('__Host-sessionID', login.sessionID, {
            signed: true,
            httpOnly: true,
            secure: true,
            sameSite: 'strict',
          }).json({ response: login.response, userName: login.userName });
        } else {
          if (login.error === 'user disabled') {
            res.cookie('__Host-activationToken', login.activationToken, {
              signed: true,
              httpOnly: true,
              secure: true,
              sameSite: 'strict',
              maxAge: 1800000, // 30 minutes
            }).json({ response: login.response, error: login.error });
          } else {
            res.json(login);
          }
        }
      })
      .catch(next);
  } else {
    res.status(422).json({ error: 'invalid request body' });
  }
});

app.post('/usernameExists', util.checkJsonHeader, function(req, res, next) {
  if (typeof req.body.username === 'string') {
    auth.usernameExists(req.body.username)
      .then(exists => {
        res.json({ response: exists });
      })
      .catch(next);
  } else {
    res.status(422).json({ error: 'invalid username' });
  }
});

app.post('/emailExists', util.checkJsonHeader, function(req, res, next) {
  if (typeof req.body.email === 'string') {
    auth.emailExists(req.body.email)
      .then(exists => {
        res.json({ response: exists });
      })
      .catch(next);
  } else {
    res.status(422).json({ error: 'invalid email' });
  }
});

app.post('/forgotPassword', util.checkJsonHeader, function(req, res, next) {
  if (typeof req.body.email === 'string') {
    auth.sendResetPasswordEmail(req.body.email)
      .then(() => {
        res.json({ response: true });
      })
      .catch(next);
  } else {
    res.status(422).json({ error: 'invalid email' });
  }
});

app.post('/resetPasswordByEmail', util.checkJsonHeader, function(req, res, next) {
  if (typeof req.body.password === 'string' && typeof req.body.resetCode === 'string') {
    auth.resetPasswordByEmail(req.body.resetCode, req.body.password)
      .then(resetStatus => {
        res.json(resetStatus);
      })
      .catch(next);
  } else {
    res.status(422).json({ error: 'invalid password or reset code' });
  }
});

app.post('/resendActivationMail', util.checkJsonHeader, function(req, res, next) {
  if (typeof req.body.email === 'string') {
    if (typeof req.signedCookies['__Host-activationToken'] === 'string') {
      auth.resendActivationMail(req.signedCookies['__Host-activationToken'], req.body.email)
        .then(response => {
          res.clearCookie('__Host-activationToken', {
            path: '/',
            httpOnly: true,
            secure: true,
            sameSite: true,
          });
          if (response.error === 'invalid activation token') {
            res.status(403).json(response.error);
          } else {
            res.json({ response: true });
          }
        })
        .catch(next);
    } else {
      res.status(403).json({ error: 'invalid activation token' });
    }
  } else {
    res.status(422).json({ error: 'invalid email' });
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
      .catch(next);
  } else {
    if (req.path !== '/auth') {
      res.setHeader('location', '/auth');
      res.status(302).end();
    } else {
      next();
    }
  }
});

app.post('/logout', function(req, res, next) {
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
    .catch(next);
});

/**
 * Add security headers
 */
app.get('*', util.securityHeaders);

app.get('/', function(req, res) {
  res.render('index');
});

app.get('/auth', function(req, res, next) {
  if (typeof req.query.activation === 'string') {
    auth.activateUser(req.query.activation)
      .then(activated => {
        if (activated === true) {
          res.render('activation');
        } else {
          res.render('auth');
        }
      })
      .catch(next);
  } else {
    res.render('auth');
  }
});

app.use(function(req, res) {
  res.status(404).render('404');
});

// eslint-disable-next-line no-unused-vars
app.use(function(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log(err);
  res.status(500).json({ error: 'internal error' });
});

app.listen(env.APP_PORT, () => console.log(`Aplicatia ruleaza pe portul ${env.APP_PORT}`));
