/* jshint esversion: 6 */

var mongoose = require('mongoose');

// set up mongoose to use promises
mongoose.Promise = global.Promise;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/TodoApp', {
  useMongoClient: true
});

module.exports = {mongoose};
