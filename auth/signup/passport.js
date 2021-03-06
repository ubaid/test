/**
 * Created by rakesh on 25/5/17.
 */
// config/passport_old.js

// load all the things we need
var LocalStrategy   = require('passport-local').Strategy;

// load up the user model
var User            = require('../../models/users');
const config=require('../../config/index')
// const AMQP = require('../../lib/amqp')
// expose this function to our app using module.exports
module.exports = function(passport) {

  // =========================================================================
  // passport session setup ==================================================
  // =========================================================================
  // required for persistent signup sessions
  // passport needs ability to serialize and unserialize users out of session

  // used to serialize the user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // used to deserialize the user
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // =========================================================================
  // LOCAL SIGNUP ============================================================
  // =========================================================================
  // we are using named strategies since we have one for signup and one for signup
  // by default, if there was no name, it would just be called 'signup'

  passport.use('local-signup', new LocalStrategy({
      // by default, signup strategy uses username and password, we will override with email
      usernameField : 'email',
      passwordField : 'password',
      passReqToCallback : true // allows us to pass back the entire request to the callback
    },
    function(req, email, password, done) {


      // asynchronous
      // User.findOne wont fire unless data is sent back
      process.nextTick(function() {

        if(!req.body.email || !req.body.password ||!req.body.company  || !req.body.firstName || !req.body.lastName){
          let errorMsg={message:"Fields can't be empty"}
          console.log(errorMsg)
          req.returnMessage=errorMsg;
          return done(errorMsg);
        }
        // find a user whose email is the same as the forms email
        // we are checking to see if the user trying to signup already exists
        User.findOne({'email' :  email }, function(err, user) {
          // if there are any errors, return the error

          if (err){
            let errorMsg={message:"something went wrong"}
            console.log(errorMsg)
            req.returnMessage=errorMsg;
            return done(err);
          }

          // check to see if theres already a user with that email
          if (user) {
            // var returnMessage={message:"That email is already taken."}
            user.status="409"
            user.message="This email is already taken";
            return done(null,user);
          } else {

            // if there is no user with that email
            // create the user
            var newUser= new User();
            newUser.email    = email;
            newUser.password = newUser.generateHash(password);
            newUser.company=req.body.company

            newUser.screenName=req.body.firstName+' '+req.body.lastName
            if(config.profileActivateDefault){
              newUser.status=true
            }

            // save the user
            newUser.save(function(err) {
              if (err){
                console.log(err)
                throw err;
              }else {
             newUser.message="registered";
             newUser.code=200
                return done(null, newUser);
              }


            });
          }

        });

      });

    }));

};
