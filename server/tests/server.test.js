/* jshint esversion: 6 */

const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {todos, populateTodos, users, populateUsers} = require('./seed/seed');


// start with test docs
beforeEach(populateUsers);
beforeEach(populateTodos);


describe('POST /todos', () => {

  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    // user supertest syntax to test express
    request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect((res) => {
        expect(res.body.text).toBe(text);
      })
      .end((err, res) => {
        if (err) {
          return done(err);
        }
        // use the model's find() method to query
        // see 'querying' section of http://mongoosejs.com/docs/models.html
        // note also that mongoose looks for plural of model name
        // i.e. todo.save goes into todos collection
        Todo.find({text}).then((todos) => {
          expect(todos.length).toBe(1);
          expect(todos[0].text).toBe(text);
          done();
        })
        .catch((e) => done(e));
      });
    });

    // test with empty request body
    it('should not create todo with invalid data', (done) => {

      request(app)
      .post('/todos')
      .set('x-auth', users[0].tokens[0].token)
      .send({})
      .expect(400)
      .end( (err, res) => {
        if(err){
          return done(err);
        }

        // assert that db should be empty
        Todo.find().then((todos) => {
          expect(todos.length).toBe(2);
          done();
        })
        .catch((e) => done(e));
      } );
    } );
});

// new describe block
describe('GET /todos', () => {
  it('should get all todos', (done) => {
    request(app)
    .get('/todos')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todos.length).toBe(1);
    })
    .end(done);
  });
});

// test case for getting todo by id
describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect( (res) => {
      expect(res.body.todo.text).toBe(todos[0].text);
    } )
    .end(done);
  });

  // test error handling using arbitrary new object id
  it('should return 404 if todo not found', (done) => {
      let id = new ObjectID().toHexString();
      request(app)
      .get(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });

  // test that when we have an invalid id we get back a 400
  // course uses a 404 but personally I prefer 400 for bad request
  it('should return a 400 for non object IDs', (done) => {
    // test /todos/123
    request(app)
    .get('/todos/123')
    .set('x-auth', users[0].tokens[0].token)
    .expect(400)
    .end(done);
  });

  it('should not return a todo created by another user', (done) => {
      let id = todos[1]._id.toHexString();
      request(app)
      .get(`/todos/${id}`)
      .set('x-auth', users[0].tokens[0].token)
      .expect(404)
      .end(done);
  });
});

// test todo deletion
describe('DELETE /todos/:id', () => {

  it('should correctly remove a todo', (done) => {
    let id = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/${id}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.todo._id).toBe(id);
    })
    .end((err, res) => {
      if(err) {
        done(err);
        return;
      }
      Todo.findById(id)
      .then((todo) => {
        expect(todo).toNotExist();
        done();
      })
      // catch any errors with the find query
      .catch((e) => done(e));
    });
  });

  it('should not remove another user\'s todo', (done) => {
    let id = todos[0]._id.toHexString();
    request(app)
    .delete(`/todos/${id}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(404)
    .end((err, res) => {
      if(err) {
        done(err);
        return;
      }
      Todo.findById(id)
      .then((todo) => {
        expect(todo).toExist();
        done();
      })
      // catch any errors with the find query
      .catch((e) => done(e));
    });
  });

  it('should return a 404 if todo not found', (done) => {
    let id = new ObjectID().toHexString();
    request(app)
    .delete(`/todos/${id}`)
    .set('x-auth', users[1].tokens[0].token)
    .expect(404)
    .end(done);
  });

  it('should return a 400 if object ID invalid', (done) => {
    request(app)
    .delete('/todos/123')
    .set('x-auth', users[1].tokens[0].token)
    .expect(400)
    .end(done);
  });
});

// test updating of todo
describe('PATCH /todos/:id', () => {
  it('should update the todo', (done) => {
    // use id of first item
    let id = todos[0]._id.toHexString();
    let newText = 'Testing updates to text';

    request(app)
    .patch(`/todos/${id}`)
    .set('x-auth', users[0].tokens[0].token)
    .send({
      // update text, set completed to true
      text: newText,
      completed: true
    })
    .expect(200)
    // text is changed, completed is true, completedAt is a number
    .expect( (res) => {
      expect(res.body.todo.text).toBe(newText);
      expect(res.body.todo.completed).toBe(true);
      expect(res.body.todo.completedAt).toBeA('number');
    })
    .end( (err, res) => {
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });

  // beforeEach runs now so changes above will not hold
  it('should clear completedAt when todo is un-completed', (done) => {
    // grab id of second item
    let id = todos[1]._id.toHexString();
    let newText = 'Testing updates to text a second time';
    request(app)
    .patch(`/todos/${id}`)
    .set('x-auth', users[1].tokens[0].token)
    .send({
      // update text, set completed to false
      text: newText,
      completed: false
    })
    .expect(200)
    // text is changed, completed is false, completedAd is null (toNotExist)
    .expect( (res) => {
      expect(res.body.todo.text).toBe(newText);
      expect(res.body.todo.completed).toBe(false);
      expect(res.body.todo.completedAt).toNotExist();
    })
    .end((err, res) => {
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });

  it('should not allow an update of another user\'s todo', (done) => {
    let id = todos[0]._id.toHexString();
    let newText = 'Updating a todo I don\'t own';
    request(app)
    .patch(`/todos/${id}`)
    .set('x-auth', users[1].tokens[0].token)
    .send({
      // update text, set completed to true
      text: newText,
      completed: true
    })
    .expect(404)
    .end( (err, res) => {
      if(err) {
        done(err);
        return;
      }
      // make sure todo is unchanged
      Todo.findById(id)
      .then((todo) => {
        expect(todo.text).toBe(todos[0].text);
        expect(todo.completed).toBe(false);
        expect(todo.completedAt).toNotExist();
        done();
      }).catch((e) => done(e));
    });
  });
});

describe('GET /users/me', () => {
  // when using the done callback arg, specifies async test for it()
  it('should return user id authenticated', (done) => {
    request(app)
    .get('/users/me')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .expect((res) => {
      expect(res.body.user._id).toBe(users[0]._id.toHexString());
      expect(res.body.user.email).toBe(users[0].email);
    })
    .end( (err, res) => {
      if(err) {
        done(err);
      } else {
        done();
      }
    });
  });

  // test with no x-auth header
  it('should return a 401 if not authenticated', (done) => {
      // always use toEqual when comparing objects
      request(app)
      .get('/users/me')
      .expect(401)
      .expect( (res => {
        expect(res.body).toEqual({});
      }))
      .end( (err, res) => {
        if(err) {
          done(err);
        } else {
          done();
        }
      });
  });

});

describe('POST /users', () => {
  it('should create a user', (done) => {
    let email = 'example@example.com';
    let password = '123asdfghjkl!';
    request(app)
    .post('/users')
    .send({email, password})
    .expect(200)
    .expect( (res) => {
      // note: headers.x-auth is not valid so need bracket notation
      expect(res.headers['x-auth']).toExist();
      expect(res.body.user._id).toExist();
      expect(res.body.user.email).toBe(email);
    })
    .end( (err, res) => {
      if(err) {
        done(err);
        return;
      } else {
        // if no errors, now check if user exists
        User.findOne({email}).then((user) => {
          expect(user).toExist();
          // check that pw has been hashed
          expect(user.password).toNotBe(password);
          done();
        }).catch((e) => done(e));
      }
    });
  });

  it('should return validation errors if user properties are invalid',(done) => {
    // expect a 400
    request(app)
    .post('/users')
    .send({
      email: 'afakeemail',
      password: 'no'
    })
    .expect(400)
    .end((err) => {
      if(err) {
        done(err);
        return;
      }
      done();
    });
  });

  it('should not create user if email in use', (done) => {
    // use an email that's already taken
    // expect a 400
    request(app)
    .post('/users')
    .send({
      email: users[0].email,
      password: 'testpass123'
    })
    .expect(400)
    .end((err) => {
      if(err) {
        done(err);
        return;
      }
      done();
    });
  });
});

describe('POST /users/login', () => {
  it('should login user and return auth token ', (done) => {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[1].password
    })
    .expect(200)
    .expect( (res) => {
      expect(res.headers['x-auth']).toExist();
    })
    .end ((err, res) => {
      if(err) {
        done(err);
        return;
      }

      User.findById(users[1]._id).then((user) => {
        expect(user.tokens[1]).toInclude({
          access: 'auth',
          token: res.headers['x-auth']
        });
        done();
      }).catch((e) => done(e));
    });
  });

  it('should reject invalid login', (done) => {
    request(app)
    .post('/users/login')
    .send({
      email: users[1].email,
      password: users[0].password
    })
    .expect(400)
    .end((err, res) => {
      if(err) {
        done(err);
        return;
      }
      expect(res.headers['x-auth']).toNotExist();
      User.findById(users[1]._id).then((user) => {
        expect(user.tokens.length).toBe(1);
        done();
      }).catch((e) => done(e));
    });
  });
});

describe('DELETE /users/me/token', () => {
  it('should remove auth token on logout', (done) => {
    request(app)
    .delete('/users/me/token')
    .set('x-auth', users[0].tokens[0].token)
    .expect(200)
    .end((err, res) => {
      if(err) {
        done(err);
        return;
      }
      // check that token has been deleted from db doc
      User.findById(users[0]._id)
      .then((user) => {
        expect(user.tokens.length).toBe(0);
        done();
      }).catch((e) => done(e));
    });
  });
});
