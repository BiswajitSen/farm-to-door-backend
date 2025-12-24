const fs = require('fs');
const path = require('path');
const request = require('supertest');
const { buildApp } = require('./helpers/app');
const { connectTestDb, resetTestDb, disconnectTestDb } = require('./helpers/testDb');

describe('Images: static files', () => {
    let app;

    beforeAll(async () => {
        await connectTestDb();
        app = buildApp();

        const imgDir = path.resolve(process.cwd(), 'resources/images');
        fs.mkdirSync(imgDir, { recursive: true });
        fs.writeFileSync(path.join(imgDir, 'test-image.txt'), 'hello');
    });

    beforeEach(async () => {
        await resetTestDb();
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    test('GET /api/images/test-image.txt returns file', async () => {
        const res = await request(app).get('/api/images/test-image.txt');
        expect(res.status).toBe(200);
        expect(res.text).toBe('hello');
    });

    test('GET /api/images/missing returns 404', async () => {
        const res = await request(app).get('/api/images/does-not-exist.txt');
        expect(res.status).toBe(404);
    });
});


