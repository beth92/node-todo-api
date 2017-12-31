// jshint esversion: 6

// if we are in dev mode node_env won't be set.
// otherwise we are in heroku (production) or test where node_env is set
var env = process.env.NODE_ENV || 'development';

if(env === 'development' || env === 'test') {
  // load config.json
  let config = require('./config.json');

  Object.keys(config[env]).forEach((key) => {
    process.env[key] = config[env][key];
  });
}

// if(env === 'development') {
//   process.env.PORT = 3000;
//   process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoApp';
// } else if (env === 'test') {
//   process.env.PORT = 3000;
//   process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoAppTest';
// }
