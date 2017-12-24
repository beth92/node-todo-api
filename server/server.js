/* jshint esversion: 6 */
//library imports
const express = require('express');
const bodyParser = require('body-parser');
const {ObjectID} = require('mongodb');

//local imports
const {mongoose} = require('./db/mongoose');
const {Todo} = require('./models/todo');
const {User} = require('./models/user');

var app = express();

// set up middleware
app.use(bodyParser.json());

// listen for post requests to /todos path
app.post('/todos', (req, res) => {
  var todo = new Todo({
    text: req.body.text
  });

  todo.save().then((doc)=>{
    res.status(200).send(doc);
  }, (e) => {
    res.status(400).send(e);
  });

} );

// handle get requests for todos
app.get('/todos', (req, res) => {
  Todo.find().then((todos) => {
    // better practice to respond with object rather than array
    res.send({todos});
  }, (e) => {
    res.status(400).send(e);
  });
});

// GET arbitrary todo
// use colon : syntax with app.get to represent params
// creates a req.params object with key values
app.get('/todos/:id', (req, res) => {
  let id = req.params.id;
  // valid id using isValid
  if (!ObjectID.isValid(id)){
    res.status(400).send({});
    return;
  }
  // findById
  Todo.findById(id).then((todo) => {
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

app.listen(3000, () => {
  console.log('Started on port 3000');
} );

module.exports = {app};
