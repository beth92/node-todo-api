/* jshint esversion: 6 */
//library imports
var express = require('express');
var bodyParser = require('body-parser');

//local imports
var {mongoose} = require('./db/mongoose');
var {Todo} = require('./models/Todo');
var {User} = require('./models/User');

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

app.listen(3000, () => {
  console.log('Started on port 3000');
} );
