const request = require('supertest');
const User = require('../../models/user');

async function signup(app, { username, password }) {
    return request(app).post('/api/signup').send({ username, password });
}

async function login(app, { username, password }) {
    return request(app).post('/api/login').send({ username, password });
}

async function createLegacyUser({ username, password }) {
    // Legacy plaintext user, to verify migration-on-login works
    return User.create({ username, password });
}

module.exports = { signup, login, createLegacyUser };


