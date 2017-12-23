/* jshint esversion: 6 */

const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');

// start with 0 todos
beforeEach((done) => {
  Todo.remove({}).then(() => done());
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
        Todo.find().then((todos) => {
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
          expect(todos.length).toBe(0);
          done();
        })
        .catch((e) => done(e));
      } );
    } );

});
