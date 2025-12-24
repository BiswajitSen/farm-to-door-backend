const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function connectTestDb() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
}

async function resetTestDb() {
    if (mongoose.connection?.db) {
        await mongoose.connection.db.dropDatabase();
    }
}

async function disconnectTestDb() {
    await mongoose.disconnect();
    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = undefined;
    }
}

module.exports = { connectTestDb, resetTestDb, disconnectTestDb };


