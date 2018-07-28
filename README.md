<h1> Node TODO API</h1>

<h2> About </h2>

<p> This project was created as part of <a href='https://www.udemy.com/the-complete-nodejs-developer-course-2/learn/v4/overview'>this node JS developer course.</a>

Credit for design of the project to Andrew J Mead (course author). </p>

<h3>Getting started</h3>

Prerequisites for development:
- NodeJS v8 or above
- npm package manager
- mongoDB

<ol>
<li> Clone the repo and run `npm install` to fetch npm dependencies </li> <br>
<li>Set up config.json file under `server/config/` to establish node environment variables (see `server/config/config.js`). Required are port for local server and MongoDB as well as JWT secret required by jwt library for auth token generation (see `server/models/users.js`)
</li> <br>
<li>Start mongoDB locally (see <a href='https://docs.mongodb.com/manual/reference/program/mongo/#mongo-usage-examples'>MongoDB documentation</a> for OS specific instructions.)</li><br>
<li>Start the local server with `node server/server.js`</li><br>
<li>To listen for local changes and restart server upon save run `nodemon server/server.js` instead</li><br>
<li>To run unit tests: `npm test` (without server running)</li><br>
<li>To run unit tests and watch for changes: `npm run test-watch`</li><br>
</ol>
