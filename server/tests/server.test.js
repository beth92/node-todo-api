/* jshint esversion: 6 */

const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

const todos = [{
  _id: new ObjectID(),
  text: 'First test todo'
}, {
  _id: new ObjectID(),
  text: 'Second test todo'
}];

// start with 0 todos
beforeEach((done) => {
  // add some seed data for testing
  Todo.remove({}).then(() => {
    return Todo.insertMany(todos);
  }).then(() => done());
});

describe('POST /todos', () => {

  it('should create a new todo', (done) => {
    var text = 'Test todo text';

    // user supertest syntax to test express
    request(app)
      .post('/todos')
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

    // second test case
    it('should not create todo with invalid data', (done) => {

      request(app)
      .post('/todos')
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
    .expect(200)
    .expect((res) => {
      expect(res.body.todos.length).toBe(2);
    })
    .end(done);
  });
});

// test case for getting todo by id
describe('GET /todos/:id', () => {
  it('should return todo doc', (done) => {
    request(app)
    .get(`/todos/${todos[0]._id.toHexString()}`)
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
      .expect(404)
      .end(done);
  });

  // test that when we have an invalid id we get back a 400
  // course uses a 404 but personally I prefer 400 for bad request
  it('should return a 400 for non object IDs', (done) => {
    // test /todos/123
    request(app)
    .get('/todos/123')
    .expect(400)
    .end(done);
  });
});

// test todo deletion
describe('DELETE /todos/:id', () => {

  it('should correctly remove a todo', (done) => {
    let id = todos[1]._id.toHexString();
    request(app)
    .delete(`/todos/${id}`)
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

  it('should return a 404 if todo not found', (done) => {
    let id = new ObjectID().toHexString();
    request(app)
    .delete(`/todos/${id}`)
    .expect(404)
    .end(done);
  });

  it('should return a 400 if object ID invalid', (done) => {
    request(app)
    .delete('/todos/123')
    .expect(400)
    .end(done);
  });
});
