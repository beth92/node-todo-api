/* jshint esversion: 6 */

var mongoose = require('mongoose');

//create a mongoose model for a todo item
// mongoose.model returns a constructor which can be used to add to db
var Todo = mongoose.model('Todo', {
  text: {
    // mmongoose will cast to string where possible
    type: String,
    required: true,
    minLength: 2,
    // remove leading or trailing whitespace
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    // UNIX timestamp type aka a number
    type: Number,
    default: null
  },
  _creator: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = {Todo};
