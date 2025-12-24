const mongoose = require('mongoose');

async function connectToMongo(mongoUri) {
    await mongoose.connect(mongoUri);
    return mongoose;
}

async function disconnectFromMongo() {
    if (mongoose.connection?.readyState) {
        await mongoose.connection.close();
    }
}

module.exports = { connectToMongo, disconnectFromMongo, mongoose };


