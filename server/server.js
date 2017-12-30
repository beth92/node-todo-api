/* jshint esversion: 6 */

require('./config/config');

//library imports
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

//local imports
const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');
const {authenticate} = require('./middleware/authenticate');

var app = express();
const port = process.env.PORT;

// set up middleware
app.use(bodyParser.json());

// listen for post requests to /todos path
app.post('/todos', authenticate, (req, res) => {
  var todo = new Todo({
    text: req.body.text,
    _creator: req.user._id
  });

  todo.save().then((doc)=>{
    res.status(200).send(doc);
  }, (e) => {
    res.status(400).send(e);
  });

} );

// handle get requests for todos
app.get('/todos', authenticate, (req, res) => {
  Todo.find({
    _creator: req.user._id
  }).then((todos) => {
    // better practice to respond with object rather than array
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

// GET arbitrary todo
// use colon : syntax with app.get to represent params
// creates a req.params object with key values
app.get('/todos/:id', authenticate, (req, res) => {
  let id = req.params.id;
  // valid id using isValid
  if (!ObjectID.isValid(id)){
    res.status(400).send({});
    return;
  }
  // findById
  Todo.findOne({
    _id: id,
    _creator: req.user._id
  }).then((todo) => {
    // check for empty result set
    if(!todo){
      res.status(404).send();
      return;
    }
    // else send back object containing the todo document
    res.status(200).send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

// Setup route for handling delete requests
app.delete('/todos/:id', authenticate, (req, res) => {
  // get id
  let id = req.params.id;
  // check validity and if invalid send bad request status
  if (!ObjectID.isValid(id)){
    res.status(400).send();
    return;
  }
  // else remove from db
  Todo.findOneAndRemove({
    _id: id,
    _creator: req.user._id
  })
  .then( (todo) => {
    if(!todo) {
      res.status(404).send();
      return;
    }
    res.status(200).send({todo});
  }).catch((e) => {
    res.status(400).send();
  });
});

// use app.patch to update a resource (best practices for API dev)
app.patch('/todos/:id', authenticate, (req, res) => {
  let id = req.params.id;
  // only allow users to change text or completed
  let body = _.pick(req.body, ['text', 'completed']);
  // check that object id is valid
  if (!ObjectID.isValid(id)){
    res.status(400).send({});
    return;
  }

  // check that completed field is boolean and check value
  if(_.isBoolean(body.completed) && body.completed){
    body.completedAt = new Date().getTime();
  } else {
    body.completed = false;
    body.completedAt = null;
  }
  // the new option returns the new record
  Todo.findOneAndUpdate({
    _id: id,
    _creator: req.user._id
  }, {$set: body}, {new: true})
  .then( (todo) => {
    if (!todo) {
      return res.status(404).send();
    }
    res.send({todo});
  })
  .catch((e)=>{
    res.status(400).send();
  });
});

// POST /users
app.post('/users', (req, res) => {
  let user = new User(_.pick(req.body, ['email', 'password']));



  // submit to mongodb for validation
  user.save().then(() => {
    return user.generateAuthToken();
  })
  .then((token) => {
    // prepend custom header with x-
    res.status(200).header('x-auth', token).send({user});
  })
  .catch((e) => res.status(400).send(e));
});

// GET current user
app.get('/users/me', authenticate, (req, res) => {
  let token = req.header('x-auth');

  User.findByToken(token).then((user) => {
    res.send({
      user: req.user
    });
  });
});

// POST /users/login {email, password}
app.post('/users/login', (req, res) => {
  let body = _.pick(req.body, ['email', 'password']);

  User.findByCredentials(body.email, body.password)
  .then((user) => {
    user.generateAuthToken().then((token) => {
      res.set('x-auth', token).send(user);
    });
  })
  .catch( (e) => {
    res.status(400).send();
  });
});

// logout
app.delete('/users/me/token', authenticate, (req, res) => {
  // authenticate function sets req.user and req.token
  req.user.removeToken(req.token).then(() => {
    res.status(200).send();
  }, (e) => {
    res.status(400).send();
  });
});

app.listen(port, () => {
  console.log(`Started on port ${port}`);
} );

module.exports = {app};
