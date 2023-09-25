const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const createError = require('http-errors');
const express = require('express');
const logger = require('morgan');

const apiRouter = require('./routes/api');

const app = express();

app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(logger('dev'));

app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json(err.status);
});

module.exports = app;
