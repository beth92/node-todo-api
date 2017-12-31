/* jshint esversion: 6 */
const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');


// test users
const userOneId = new ObjectID();
const userTwoId = new ObjectID();
const users = [{
  _id: userOneId,
  email: 'beth@test.com',
  password: 'example123',
  tokens: [{
    access: 'auth',
    token: jwt.sign({
      _id: userOneId,
      access: 'auth'
    }, process.env.JWT_SECRET).toString()
  }]
},
{
  _id: userTwoId,
  email: 'beth2@test.com',
  password: 'userTwoPass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({
      _id: userTwoId,
      access: 'auth'
    }, process.env.JWT_SECRET).toString()
  }]
}];

// test todos docs
const todos = [{
  _id: new ObjectID(),
  text: 'First test todo',
  _creator: userOneId
}, {
  _id: new ObjectID(),
  text: 'Second test todo',
  completed: true,
  completedAt: 12345,
  _creator: userTwoId
}];

// save test todos to test db
const populateTodos = (done) => {
  // add some seed data for testing
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done())
  .catch((e) => done(e));
};

// save test users
const populateUsers = (done) => {
  // first remove all docs
  User.remove({}).then(() => {
    // define 2 promises for saving users
    let userOne = new User(users[0]).save();
    let userTwo = new User(users[1]).save();

    // await resolution of both promises
    return Promise.all([userOne, userTwo]);
  }).then(() => done());
};

module.exports = {todos, populateTodos, users, populateUsers};
