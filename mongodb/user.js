const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const userSchema = new mongoose.Schema({
          username: String, 
          password: String,
          secret: Array
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('user', userSchema);