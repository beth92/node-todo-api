/* jshint esversion: 6 */

var mongoose = require('mongoose');

// User type with email(required, trimmed, minlength)
var User = mongoose.model('User', {
  email: {
    type: String,
    required: true,
    minLength: 4,
    trim: true
  }
} );

module.exports = {User};
