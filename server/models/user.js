/* jshint esversion: 6 */

const mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');

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

UserSchema.methods.removeToken = function(token) {
  // use mongodb $pull operator to remove items from an array according to criteria
  let user = this;

  return user.update({
    $pull: {
      tokens: {token}
    }
  });
};

// create new 'instance method' which has access to docs
// must use function keyword since we need this binding
UserSchema.methods.generateAuthToken = function () {
  let user = this;
  let access = 'auth';
  let token = jwt.sign({
    _id: user._id.toHexString(),
    access
  }, process.env.JWT_SECRET).toString();

  user.tokens.push({access, token});

  return user.save().then(() => {
    return token;
  });
};

// define getUserByToken for verification of tokens
// statics = model method rather than instance method
// meaning that 'this' is a ref to model rather than the doc
UserSchema.statics.findByToken = function(token) {
  let User = this;
  let decoded;

  try {
    // verify using secret from generateAuthToken
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (e) {
    // if verification fails return a rejection to findByToken
    // this is caught by the route in server.js and
    // results in a 401
    return Promise.reject();
  }

  return User.findOne({
    // use the dot notation below to query nested docs
    '_id': decoded._id,
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};

UserSchema.statics.findByCredentials = function (email, password) {
  // start by matching email to get a potential match
  let User = this;
  return User.findOne({email}).then( (user) => {
      if (!user) {
        return Promise.reject();
      }
      return new Promise( (resolve, reject) => {
        bcrypt.compare(password, user.password, (err, result) => {
          if(result){
            resolve(user);
          } else {
            reject();
          }
        });
      });
  });
};

// run some code before save events to hash pw before storing
UserSchema.pre('save', function (next) {
  let user = this;

  // isModified can tell us whether a prop has just been changed
  if(user.isModified('password')){
    // user.password

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(user.password, salt, (err, hash) => {
        user.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

var User = mongoose.model('User', UserSchema);

module.exports = {User};
