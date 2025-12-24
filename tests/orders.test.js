const request = require('supertest');
const Product = require('../models/product');
const Orders = require('../models/orders');
const PlacedOrders = require('../models/placedOrders');
const { buildApp } = require('./helpers/app');
const { connectTestDb, resetTestDb, disconnectTestDb } = require('./helpers/testDb');
const { signup, login } = require('./helpers/auth');

describe('Orders: protected endpoints', () => {
    let app;
    let token;

    beforeAll(async () => {
        await connectTestDb();
        app = buildApp();
    });

    beforeEach(async () => {
        await resetTestDb();
        await signup(app, { username: 'buyer', password: 'password123' });
        const loginRes = await login(app, { username: 'buyer', password: 'password123' });
        token = loginRes.body.token;
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    test('GET /api/orders requires auth', async () => {
        const res = await request(app).get('/api/orders?username=buyer');
        expect(res.status).toBe(401);
    });

    test('POST /api/orders validates input', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({});
        expect(res.status).toBe(400);
        expect(res.body.errors).toBeDefined();
    });

    test('POST /api/orders returns 404 when product not found', async () => {
        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                username: 'buyer',
                deliveryAddress: '123 Some Street, City',
                productIds: [
                    {
                        productId: '507f1f77bcf86cd799439011',
                        productName: 'Missing',
                        imageUrl: 'image1.avif',
                        quantity: 1,
                        boughtFrom: 'vendor1',
                    },
                ],
            });
        expect(res.status).toBe(404);
    });

    test('POST /api/orders places order, creates placedOrders, and decrements product quantity', async () => {
        const product = await Product.create({
            name: 'Tomato',
            description: 'Fresh tomato',
            price: 5,
            imageUrl: 'image1.avif',
            quantity: 5,
            soldBy: 'vendor1',
        });

        const payload = {
            username: 'buyer',
            deliveryAddress: '123 Some Street, City',
            productIds: [
                {
                    productId: product._id.toString(),
                    productName: 'Tomato',
                    imageUrl: 'image1.avif',
                    quantity: 2,
                    boughtFrom: 'vendor1',
                },
            ],
        };

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send(payload);

        expect(res.status).toBe(201);

        const updated = await Product.findById(product._id);
        expect(updated.quantity).toBe(3);

        const orders = await Orders.find();
        expect(orders.length).toBe(1);

        const placed = await PlacedOrders.find();
        expect(placed.length).toBe(1);
        expect(placed[0].boughtFrom).toBe('vendor1');
        expect(placed[0].username).toBe('buyer');
    });

    test('POST /api/orders rejects placing an order for another username', async () => {
        const product = await Product.create({
            name: 'Tomato',
            description: 'Fresh tomato',
            price: 5,
            imageUrl: 'image1.avif',
            quantity: 5,
            soldBy: 'vendor1',
        });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                username: 'someone-else',
                deliveryAddress: '123 Some Street, City',
                productIds: [
                    {
                        productId: product._id.toString(),
                        productName: 'Tomato',
                        imageUrl: 'image1.avif',
                        quantity: 1,
                        boughtFrom: 'vendor1',
                    },
                ],
            });

        expect(res.status).toBe(403);
    });

    test('POST /api/orders returns 409 when stock is insufficient', async () => {
        const product = await Product.create({
            name: 'Limited',
            description: 'Limited stock',
            price: 5,
            imageUrl: 'image1.avif',
            quantity: 1,
            soldBy: 'vendor1',
        });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                username: 'buyer',
                deliveryAddress: '123 Some Street, City',
                productIds: [
                    {
                        productId: product._id.toString(),
                        productName: 'Limited',
                        imageUrl: 'image1.avif',
                        quantity: 2,
                        boughtFrom: 'vendor1',
                    },
                ],
            });

        expect(res.status).toBe(409);
        const refreshed = await Product.findById(product._id);
        expect(refreshed.quantity).toBe(1);
    });

    test('GET /api/orders returns orders for username', async () => {
        const product = await Product.create({
            name: 'Potato',
            description: 'Fresh potato',
            price: 4,
            imageUrl: 'image2.avif',
            quantity: 10,
            soldBy: 'vendor1',
        });

        await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                username: 'buyer',
                deliveryAddress: '123 Some Street, City',
                productIds: [
                    {
                        productId: product._id.toString(),
                        productName: 'Potato',
                        imageUrl: 'image2.avif',
                        quantity: 1,
                        boughtFrom: 'vendor1',
                    },
                ],
            });

        const res = await request(app)
            .get('/api/orders?username=buyer')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].username).toBe('buyer');
    });

    test('GET /api/orders without username query uses JWT user', async () => {
        // Create one order for buyer
        const product = await Product.create({
            name: 'Potato',
            description: 'Fresh potato',
            price: 4,
            imageUrl: 'image2.avif',
            quantity: 10,
            soldBy: 'vendor1',
        });

        await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                username: 'buyer',
                deliveryAddress: '123 Some Street, City',
                productIds: [
                    {
                        productId: product._id.toString(),
                        productName: 'Potato',
                        imageUrl: 'image2.avif',
                        quantity: 1,
                        boughtFrom: 'vendor1',
                    },
                ],
            });

        const res = await request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].username).toBe('buyer');
    });

    test('POST /api/orders multi-item order rolls back if second item insufficient', async () => {
        const p1 = await Product.create({
            name: 'P1',
            description: 'd',
            price: 1,
            imageUrl: 'image1.avif',
            quantity: 2,
            soldBy: 'vendor1',
        });
        const p2 = await Product.create({
            name: 'P2',
            description: 'd',
            price: 1,
            imageUrl: 'image1.avif',
            quantity: 0,
            soldBy: 'vendor1',
        });

        const res = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${token}`)
            .send({
                username: 'buyer',
                deliveryAddress: '123 Some Street, City',
                productIds: [
                    { productId: p1._id.toString(), productName: 'P1', imageUrl: 'image1.avif', quantity: 1, boughtFrom: 'vendor1' },
                    { productId: p2._id.toString(), productName: 'P2', imageUrl: 'image1.avif', quantity: 1, boughtFrom: 'vendor1' },
                ],
            });

        expect(res.status).toBe(409);

        const p1After = await Product.findById(p1._id);
        expect(p1After.quantity).toBe(2); // rolled back
    });

    test('GET /api/orders rejects fetching orders for another username', async () => {
        const res = await request(app)
            .get('/api/orders?username=someone-else')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(403);
    });
});


