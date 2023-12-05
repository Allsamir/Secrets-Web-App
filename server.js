require('dotenv').config();
const express = require('express');
const session = require('express-session');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const flash = require('express-flash');
const connectDB = require('./config/db');
connectDB();
const User = require('./mongodb/user');
const Secret = require('./mongodb/secrets');

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(flash());
app.use(express.urlencoded({
   extended: true
}));
app.use(session({
   secret: process.env.SECRET_KEY,
   resave: false,
   saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id)
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secret"
  },
  function(accessToken, refreshToken, profile, cb) {
   console.log(profile.emails[0].value);
    User.findOrCreate({
       username: profile.emails[0].value, 
       googleId: profile.id
      }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.route('/')
   .get((req, res) => {
      res.render('home')
   });

app.route('/auth/google')
.get( passport.authenticate('google', { 
   scope:['profile', 'email'] }
));

app.get('/auth/google/secret', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secret');
  });

app.route('/register')
   .get((req, res) => {
      res.render('register')
   })
   .post((req, res) => {
      const {
         username,
         password
      } = req.body;

      User.register(new User({
         username
      }), password, (err, user) => {
         if (err) {
            console.error("Error during registration: ", err);
            return res.redirect('/register');
         }

         passport.authenticate('local')(req, res, () => {
            res.redirect('/login');
         })
      })
   });

app.route('/login')
   .get((req, res) => {
      res.render('login', {error: req.flash()})
   })
   .post(passport.authenticate('local', {
      successRedirect: '/secret',
      failureRedirect: '/login'
   }));

app.route('/secret')
   .get((req, res) => {
      if (req.isAuthenticated()) {
         User.find(req.user)
         .then(user => {
            console.log(user);
            req.flash('success', 'Congratulation! On your successful Login');
            res.render('secret', {userData: user,  messages: req.flash()})
         })
         .catch(error => {
            console.error(error)
         }) 
      } else {
         res.redirect('/register')
      }
   });

app.route('/logout')
   .get((req, res) => {
      req.logout((err) => {
         if (err) {
            console.error(err)
         } else {
            res.redirect('/')
         }
      });
   });

app.route('/submit')
   .get((req, res) => {
      if (req.isAuthenticated()) {
         res.render('submit');
      } else {
         res.redirect('/login')
      }
   })
   .post((req, res) => {
      // Updating the secret data in users collection
      const secret = req.body.secret;
      User.findOneAndUpdate({username: req.user.username}, { $push: { secret: secret } }, {new: true})
      .then(result => {
         console.log(`Successfully updated ${result}`);
         res.redirect('/secret');
      })
      .catch(error => {
         console.error(error)
      });
      // Saving secret in secrets collection
      const newSecret = new Secret({
         secret: secret
      });
      newSecret.save()
      .then(result => {
         console.log(`Data Saved ${result}`)
      })
      .catch(error => {
         console.error(error)
      })
   });
app.route('/secrets')
 .get((req, res) => {
   Secret.find()
   .then(secret => {
      res.render('secrets', {secrets: secret});
      console.log(`Secret Collection : ${secret}`);
   })
   .catch(error => {
      console.error(error)
   });
 });

app.listen(port, () => {
   console.log(`App is listening at ${port}`)
});