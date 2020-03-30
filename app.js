/*
API ALPHA VANTAGE: 7M2GANU4CTO5UTMU
*/

// Helpers for errors
const createError = require('http-errors');
// Express framework
const express = require('express');
// To create virtual paths
const path = require('path');
// Cookies, yumm!
const cookieParser = require('cookie-parser');
// Dont ask me
const logger = require('morgan');
// HTML compiler
const hbs = require('express-handlebars');
// CSS compiler
const sassMiddleware = require('node-sass-middleware');
//CORS
const cors = require('cors');
// Create the index routes
const indexRouter = require('./routes/index');
// Cron jobs
const cron = require('node-cron');
const alphaVantage = require('./services/alphaVantageWorker');

const app = express();
app.use(cors());

// Set up mongoose connection
const mongoose = require('mongoose');
mongoose.set('useUnifiedTopology', true);
const mongoDB = 'mongodb://nodeapi:a123456789@ds045107.mlab.com:45107/node-assets';
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

// Set up handlebars view engine
app.engine('hbs', hbs({
  defaultLayout: 'layout',
  layoutsDir: path.join(__dirname, 'views', 'layouts'),
  extname: 'hbs',
}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// Some express configuration
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Set up cookie parser
app.use(cookieParser());
// Set up SASS
app.use(sassMiddleware({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: false, // true = .sass and false = .scss
  sourceMap: true,
}));

// Set up virtual path
app.use(express.static(path.join(__dirname, 'public')));

// Set up routes
app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  //next(createError(404));
  res.send({ message: 'PAGE_NOT_FOUND' });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('layouts/error');
});

/**
 # ┌────────────── second (optional)
 # │ ┌──────────── minute
 # │ │ ┌────────── hour
 # │ │ │ ┌──────── day of month
 # │ │ │ │ ┌────── month
 # │ │ │ │ │ ┌──── day of week
 # │ │ │ │ │ │
 # │ │ │ │ │ │
 # * * * * * *
 */
cron.schedule('*/2 * * * *', () => {
  //alphaVantage.updateQuotes();
});


module.exports = app;
