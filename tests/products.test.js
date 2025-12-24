const request = require('supertest');
const Product = require('../models/product');
const { buildApp } = require('./helpers/app');
const { connectTestDb, resetTestDb, disconnectTestDb } = require('./helpers/testDb');

describe('Products: public endpoints', () => {
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

    test('GET /api/products returns array', async () => {
        await Product.create({ name: 'P1', description: 'D1', price: 10, imageUrl: 'image1.avif', quantity: 2 });
        const res = await request(app).get('/api/products');
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
    });

    test('POST /api/products validates input', async () => {
        const res = await request(app).post('/api/products').send({ name: 'P1' });
        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test('POST /api/products creates a product', async () => {
        const payload = {
            name: 'Apple',
            description: 'Fresh apples',
            price: 12.5,
            quantity: 10,
            imageUrl: 'image1.avif',
        };

        const res = await request(app).post('/api/products').send(payload);
        expect(res.status).toBe(201);
        expect(res.body._id).toBeTruthy();
        expect(res.body.name).toBe('Apple');
    });
});


