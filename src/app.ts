'use strict';

import express = require('express');
import cookieParser = require('cookie-parser');

import env = require('./env');
import util = require('./modules/util');

import { router as authRouter } from './routes/auth';
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

/**
 * Add security headers
 */
app.get('*', util.securityHeaders);

/**
 * Routers
 */
app.use(authRouter);
app.use(userRouter);

app.route('/')
  .get(function(req, res) {
    res.render('index');
  }).all(util.httpErrorAllowOnlyGet);

app.use(util.securityHeaders, function(req, res) {
  res.status(404).render('404');
});

// eslint-disable-next-line no-unused-vars
app.use(function(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
  console.log(err);
  res.status(500).json({ error: 'internal error' });
});

app.listen(env.APP_PORT, () => console.log(`Aplicatia ruleaza pe portul ${env.APP_PORT}`));
