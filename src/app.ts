'use strict';

import express = require('express');

import crypto = require('crypto');

import env = require('./env');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'app/views');
app.set('etag', false);
app.set('x-powered-by', false);

app.get('*', function(req, res, next) {
  crypto.randomBytes(16, (error, buffer) => {
    if (!error) {
      res.locals.cspNonce = buffer.toString('base64');
      res.setHeader('Content-Security-Policy',
        `default-src 'none'; base-uri 'none'; connect-src 'self'; font-src 'none'; ` +
        `form-action 'self'; frame-ancestors 'none'; img-src 'self' https://static.gennerator.com; ` +
        `manifest-src https://static.gennerator.com; ` +
        `media-src 'self'; object-src 'none'; report-to default; ` +
        `report-uri https://gennerator.report-uri.com/r/d/csp/enforce; ` +
        `script-src 'strict-dynamic' 'nonce-${res.locals.cspNonce}'; ` +
        `style-src https://static.gennerator.com/css/ 'nonce-${res.locals.cspNonce}'`
      );
      res.setHeader('Feature-Policy',
        `accelerometer 'none'; ambient-light-sensor 'none'; autoplay 'none'; camera 'none'; encrypted-media 'none'; ` +
        `fullscreen 'none'; geolocation 'none'; gyroscope 'none'; magnetometer 'none'; microphone 'none'; ` +
        `midi 'none'; payment 'none'; speaker 'none'; sync-xhr 'none'; usb 'none'; vr 'none'`
      );
      res.setHeader('Referrer-Policy', 'same-origin');
      next();
    } else {
      console.log(error);
      res.status(500).render('500');
    }
  });
});

app.get('/', function(req, res) {
  res.render('index');
});

app.use(function(req, res) {
  res.status(404).render('404');
});

app.listen(env.APP_PORT, () => console.log(`Aplicatia ruleaza pe portul ${env.APP_PORT}`));
