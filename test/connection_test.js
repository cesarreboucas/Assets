const mongoose = require('mongoose');

// ES6 Promises
mongoose.Promise = global.Promise;

// Connect to the database before test runs
before(function(done) {
  // connect to mongodb
  mongoose.connect(
      'mongodb://marangoni:m4r4ng0n1@ds045107.mlab.com:45107/node-assets',
      {useNewUrlParser: true}
  );

  mongoose.connection.once('open', function() {
    console.log('connection has been made, now make fireworks...');
    done();
  }).on('error', function(error) {
    console.log('Connection error: '.error);
  });
});

after(function() {
  mongoose.connection.close();
});

module.exports = mongoose;
