const mongoose = require('mongoose');

const connectDB = async () => {
          mongoose.connect(process.env.DATABASE_URI)
                    .then(result => {
                              console.log("DATABASE Connected")
                    })
                    .catch(error => {
                              console.error(error)
                    })
};

module.exports = connectDB;