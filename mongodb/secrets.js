const mongoose = require('mongoose');

const secretSchema = new mongoose.Schema({
          secret: String
});

module.exports = mongoose.model('secret', secretSchema);