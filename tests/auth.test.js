const request = require('supertest');
const User = require('../models/user');
const { buildApp } = require('./helpers/app');
const { connectTestDb, resetTestDb, disconnectTestDb } = require('./helpers/testDb');
const { signup, login, createLegacyUser } = require('./helpers/auth');

describe('Auth: signup/login', () => {
    let app;

    beforeAll(async () => {
        await connectTestDb();
        app = buildApp();
    });

    beforeEach(async () => {
        await resetTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    test('POST /api/signup validates input', async () => {
        const res = await request(app).post('/api/signup').send({});
        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test('POST /api/signup creates user with passwordHash', async () => {
        const res = await signup(app, { username: 'alice', password: 'password123' });
        expect(res.status).toBe(201);

        const user = await User.findOne({ username: 'alice' }).select('+password +passwordHash');
        expect(user).toBeTruthy();
        expect(user.passwordHash).toBeTruthy();
        expect(user.password).toBeFalsy(); // legacy field should not be present
    });

    test('POST /api/signup prevents duplicate usernames', async () => {
        await signup(app, { username: 'alice', password: 'password123' });
        const res2 = await signup(app, { username: 'alice', password: 'password456' });
        expect(res2.status).toBe(400);
        expect(res2.body.message).toMatch(/exists/i);
    });

    test('POST /api/login validates input', async () => {
        const res = await request(app).post('/api/login').send({});
        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test('POST /api/login rejects invalid credentials', async () => {
        await signup(app, { username: 'alice', password: 'password123' });
        const res = await login(app, { username: 'alice', password: 'wrong' });
        expect(res.status).toBe(401);
    });

    test('POST /api/login returns token and persists authToken', async () => {
        await signup(app, { username: 'alice', password: 'password123' });
        const res = await login(app, { username: 'alice', password: 'password123' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();

        const user = await User.findOne({ username: 'alice' });
        expect(user.authToken).toBe(res.body.token);
    });

    test('Legacy plaintext users are migrated on login', async () => {
        await createLegacyUser({ username: 'legacy', password: 'pass1234' });

        const res = await login(app, { username: 'legacy', password: 'pass1234' });
        expect(res.status).toBe(200);
        expect(res.body.token).toBeTruthy();

        const user = await User.findOne({ username: 'legacy' }).select('+password +passwordHash');
        expect(user.passwordHash).toBeTruthy();
        expect(user.password).toBeFalsy();
    });
});


