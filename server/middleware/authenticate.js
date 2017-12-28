/* jshint esversion: 6 */
const {User} = require('./../models/user');

// define middleware function which allows
// pre-authentication of reqs before they reach express handler
let authenticate = (req, res, next) => {
  let token = req.header('x-auth');

  User.findByToken(token).then((user) => {
    if(!user){
      // reject so execution moves to catch
      return Promise.reject();
    }
    req.user = user;
    req.token = token;
    // signature verified, pass on to req handler
    next();
  }).catch((e) => {
    // either no user found or jwt verification failed
    res.status(401).send();
  });
};

module.exports = {authenticate};
