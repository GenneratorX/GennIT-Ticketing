'use strict';

import express = require('express');
import cookieParser = require('cookie-parser');

import env = require('./env');
import auth = require('./modules/auth');
import util = require('./modules/util');

import { router as authRouter } from './routes/auth';
import { router as mainRouter } from './routes/main';
import { router as userRouter } from './routes/user';

export const app = express();
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

app.route('/')
  .get(function(req, res) {
    res.setHeader('location', '/auth');
    res.status(302).end();
  })
  .all(util.httpErrorAllowOnlyGet);


app.use('/auth', authRouter);
/**
 * Check if user is logged in and redirect him to the login page if hes not
 */
app.use(function(req, res, next) {
  if (typeof req.signedCookies['__Host-sessionID'] === 'string') {
    auth.verifySessionID(req.signedCookies['__Host-sessionID'])
      .then(session => {
        if (session.error === undefined) {
          res.locals.userData = { ...session };
          if (req.path === '/auth') {
            res.setHeader('location', '/main');
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
          if (req.method === 'GET') {
            res.setHeader('location', '/auth');
            res.status(302).end();
          } else {
            res.setHeader('WWW-Authenticate', 'gennit-auth');
            res.status(401).json({ error: 'user not authenticated' });
          }
        }
      })
      .catch(next);
  } else {
    if (req.method === 'GET') {
      if (req.path !== '/auth') {
        res.setHeader('location', '/auth');
        res.status(302).end();
      } else {
        next();
      }
    } else {
      res.setHeader('WWW-Authenticate', 'gennit-auth');
      res.status(401).json({ error: 'user not authenticated' });
    }
  }
});

app.route('/auth')
  .get(util.securityHeaders, function(req, res, next) {
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
  }).all(util.httpErrorAllowOnlyGet);

/**
 * Routers
 */
app.use('/main', mainRouter);
app.use('/user', userRouter);

app.use(util.securityHeaders, function(req, res) {
  res.status(404).render('404');
});

// eslint-disable-next-line no-unused-vars
app.use(function(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log(err);
  res.status(500).json({ error: 'internal error' });
});

app.listen(env.APP_PORT, () => console.log(`Aplicatia ruleaza pe portul ${env.APP_PORT}`));
