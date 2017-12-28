/* jshint esversion: 6 */

const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

// example user
// {
//   email: 'beth@example.com',
//   password: 'jdsjabyhskefhw7452ihddugs',
//   tokens: [{
//      access: 'auth',
//      token: '1kwiusva87329uhiw678UHDSU'
//   }, {}, {}]
// }

var UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 4,
    trim: true,
    // ensure an email cannot be used twice
    unique: true,
    // email validation
    validate: {
      validator: validator.isEmail,
      // message for failure of validator
      message: '{VALUE} is not a valid email',
      isAsync: true
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  // tokens array for mongodb
  tokens: [{
    access: {
      type: String,
      required: true
    },
    token: {
      type: String,
      required: true
    }
  }]
}, {usePushEach: true});

// prevent user from seeing password and token in the response
// by overriding the toJSON function
UserSchema.methods.toJSON = function () {
  let userObject = this.toObject();
  return _.pick(userObject, ['_id', 'email']);
};

// create new 'instance method' which has access to docs
// must use function keyword since we need this binding
UserSchema.methods.generateAuthToken = function () {
  let user = this;
  let access = 'auth';
  let token = jwt.sign({
    _id: user._id.toHexString(),
    access
  }, 'abc123').toString();

  user.tokens.push({access, token});

  return user.save().then(() => {
    return token;
  });
};

var User = mongoose.model('User', UserSchema);

module.exports = {User};
