'use strict';

import express = require('express');

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'app/views');
//app.set('etag', false);
app.set('x-powered-by', false);

app.get('/', function(req, res) {
  res.render('index');
});

app.listen(8000, () => console.log('Aplicatia ruleaza pe portul 8000'));
