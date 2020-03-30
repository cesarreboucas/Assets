#! /usr/bin/env node

console.log('This script populates users to your database. Specified database as argument - e.g.: populatedb mongodb://your_username:your_password@your_dabase_url');

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
if (!userArgs[0].startsWith('mongodb://')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return;
}

var async = require('async');
var User = require('./models/user');

var mongoose = require('mongoose');
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var users = []

function userCreate(username, password, first_name, last_name, d_birth, cb) {
    userdetail =
        {
            username: username,
            password: password,
            first_name: first_name,
            last_name: last_name
        }
    if (d_birth != false) userdetail.date_of_birth = d_birth

    var user = new User(userdetail);

    user.save(function (err) {
        if (err) {
            cb(err, null);
            return;
        }
        console.log('New User: ' + user);
        users.push(user);
        cb(null, user);
    });
}

function createUsers(cb) {
    async.parallel([
        function (callback) {
            userCreate('patrick@gmail.com', 'patrick', 'Patrick', 'Rufus', '1973-06-06', callback);
        },
        function (callback) {
            userCreate('jhon@gmail.com', 'jhon', 'Jhon', 'Impetus', '1983-03-06', callback);
        },
        function (callback) {
            userCreate('beatrice@gmail.com', 'beatrice', 'Beatrice', 'Lastnameson', '1978-02-26', callback);
        },
        function (callback) {
            userCreate('patrick@gmail.com', 'patrick', 'Patrick', 'Rufus', '1973-06-06', callback);
        },
    ],
        // optional callback
        cb);
}


async.series([
    createUsers
],
    // Optional callback
    function (err, results) {
        if (err) {
            console.log('FINAL ERR: ' + err);
        }
        else {
            console.log('Users added: ' + users);
        }
        // All done, disconnect from database
        mongoose.connection.close();
    });