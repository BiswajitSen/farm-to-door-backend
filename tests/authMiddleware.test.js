const request = require('supertest');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { buildApp } = require('./helpers/app');
const { connectTestDb, resetTestDb, disconnectTestDb } = require('./helpers/testDb');
const { signup, login } = require('./helpers/auth');

describe('Auth middleware', () => {
    let app;

    beforeAll(async () => {
        await connectTestDb();
        app = buildApp();
    });

    beforeEach(async () => {
        await resetTestDb();
        await signup(app, { username: 'u1', password: 'password123' });
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    test('rejects invalid token', async () => {
        const res = await request(app)
            .get('/api/orders?username=u1')
            .set('Authorization', 'Bearer not-a-real-token');

        expect(res.status).toBe(401);
    });

    test('rejects expired token', async () => {
        // Create a real user authToken so only expiry is the failure
        const expired = jwt.sign({ username: 'u1' }, process.env.JWT_SECRET, { expiresIn: -10 });
        const user = await User.findOne({ username: 'u1' });
        user.authToken = expired;
        await user.save();

        const res = await request(app)
            .get('/api/orders?username=u1')
            .set('Authorization', `Bearer ${expired}`);

        expect(res.status).toBe(401);
    });

    test('rejects token that does not match stored authToken (logout/rotation scenario)', async () => {
        const loginRes = await login(app, { username: 'u1', password: 'password123' });
        expect(loginRes.status).toBe(200);
        const token = loginRes.body.token;

        // Simulate logout or token rotation
        const user = await User.findOne({ username: 'u1' });
        user.authToken = 'some-other-token';
        await user.save();

        const res = await request(app)
            .get('/api/orders?username=u1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(401);
    });
});


