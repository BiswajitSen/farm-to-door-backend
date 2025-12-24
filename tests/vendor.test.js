const fs = require('fs');
const path = require('path');
const request = require('supertest');
const Product = require('../models/product');
const Orders = require('../models/orders');
const PlacedOrders = require('../models/placedOrders');
const { buildApp } = require('./helpers/app');
const { connectTestDb, resetTestDb, disconnectTestDb } = require('./helpers/testDb');
const { signup, login } = require('./helpers/auth');

describe('Vendor: protected endpoints', () => {
    let app;
    let token;

    beforeAll(async () => {
        await connectTestDb();
        app = buildApp();

        // vendor upload writes to resources/images (relative)
        const imgDir = path.resolve(process.cwd(), 'resources/images');
        fs.mkdirSync(imgDir, { recursive: true });
    });

    beforeEach(async () => {
        await resetTestDb();
        await signup(app, { username: 'vendor1', password: 'password123' });
        const loginRes = await login(app, { username: 'vendor1', password: 'password123' });
        token = loginRes.body.token;
    });

    afterAll(async () => {
        await disconnectTestDb();
    });

    test('GET /api/vendor/products requires username query', async () => {
        const res = await request(app)
            .get('/api/vendor/products')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
    });

    test('GET /api/vendor/products rejects fetching another user products', async () => {
        const res = await request(app)
            .get('/api/vendor/products?username=someone-else')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    test('POST /api/vendor/addProducts creates product via multipart upload', async () => {
        const res = await request(app)
            .post('/api/vendor/addProducts?username=vendor1')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Carrot')
            .field('description', 'Fresh carrot')
            .field('price', '3')
            .field('quantity', '7')
            .attach('image', Buffer.from('fake-image'), 'test.jpg');

        expect(res.status).toBe(201);
        expect(res.body._id).toBeTruthy();
        expect(res.body.soldBy).toBe('vendor1');
        expect(res.body.imageUrl).toBeTruthy();
    });

    test('POST /api/vendor/addProducts rejects adding product for another user', async () => {
        const res = await request(app)
            .post('/api/vendor/addProducts?username=someone-else')
            .set('Authorization', `Bearer ${token}`)
            .field('name', 'Carrot')
            .field('description', 'Fresh carrot')
            .field('price', '3')
            .field('quantity', '7')
            .attach('image', Buffer.from('fake-image'), 'test.jpg');

        expect(res.status).toBe(403);
    });

    test('DELETE /api/vendor/products/:id deletes product', async () => {
        const product = await Product.create({
            name: 'DeleteMe',
            description: 'x',
            price: 1,
            imageUrl: 'image1.avif',
            quantity: 1,
            soldBy: 'vendor1',
        });

        const res = await request(app)
            .delete(`/api/vendor/products/${product._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        const still = await Product.findById(product._id);
        expect(still).toBeNull();
    });

    test('DELETE /api/vendor/products/:id rejects deleting another vendor product', async () => {
        const product = await Product.create({
            name: 'NotYours',
            description: 'x',
            price: 1,
            imageUrl: 'image1.avif',
            quantity: 1,
            soldBy: 'someone-else',
        });

        const res = await request(app)
            .delete(`/api/vendor/products/${product._id}`)
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        const still = await Product.findById(product._id);
        expect(still).toBeTruthy();
    });

    test('DELETE /api/vendor/products/:id returns 404 when product does not exist', async () => {
        const res = await request(app)
            .delete('/api/vendor/products/507f1f77bcf86cd799439011')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
    });

    test('PUT /api/vendor/orders/:id/status updates placed order + order line item status', async () => {
        const product = await Product.create({
            name: 'Tomato',
            description: 'Fresh tomato',
            price: 5,
            imageUrl: 'image1.avif',
            quantity: 5,
            soldBy: 'vendor1',
        });

        const order = await Orders.create({
            username: 'buyer',
            deliveryAddress: '123 Some Street, City',
            productIds: [
                {
                    productId: product._id,
                    productName: 'Tomato',
                    imageUrl: 'image1.avif',
                    quantity: 1,
                    boughtFrom: 'vendor1',
                    status: 'Pending',
                },
            ],
        });

        const placed = await PlacedOrders.create({
            productId: product._id,
            productName: 'Tomato',
            imageUrl: 'image1.avif',
            quantity: 1,
            boughtFrom: 'vendor1',
            username: 'buyer',
            status: 'Pending',
        });

        const res = await request(app)
            .put(`/api/vendor/orders/${placed._id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'Shipped', username: 'vendor1' });

        expect(res.status).toBe(200);
        const placedUpdated = await PlacedOrders.findById(placed._id);
        expect(placedUpdated.status).toBe('Shipped');

        const orderUpdated = await Orders.findById(order._id);
        expect(orderUpdated.productIds[0].status).toBe('Shipped');
    });

    test('PUT /api/vendor/orders/:id/status rejects updating another vendor orders', async () => {
        const product = await Product.create({
            name: 'Tomato',
            description: 'Fresh tomato',
            price: 5,
            imageUrl: 'image1.avif',
            quantity: 5,
            soldBy: 'someone-else',
        });

        const order = await Orders.create({
            username: 'buyer',
            deliveryAddress: '123 Some Street, City',
            productIds: [
                {
                    productId: product._id,
                    productName: 'Tomato',
                    imageUrl: 'image1.avif',
                    quantity: 1,
                    boughtFrom: 'someone-else',
                    status: 'Pending',
                },
            ],
        });

        const placed = await PlacedOrders.create({
            productId: product._id,
            productName: 'Tomato',
            imageUrl: 'image1.avif',
            quantity: 1,
            boughtFrom: 'someone-else',
            username: 'buyer',
            status: 'Pending',
        });

        const res = await request(app)
            .put(`/api/vendor/orders/${placed._id}/status`)
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'Shipped', username: 'someone-else' });

        expect(res.status).toBe(403);
        // Ensure order line item not changed
        const orderUpdated = await Orders.findById(order._id);
        expect(orderUpdated.productIds[0].status).toBe('Pending');
    });

    test('PUT /api/vendor/orders/:id/status returns 404 when placed order not found', async () => {
        const res = await request(app)
            .put('/api/vendor/orders/507f1f77bcf86cd799439011/status')
            .set('Authorization', `Bearer ${token}`)
            .send({ status: 'Shipped', username: 'vendor1' });

        expect(res.status).toBe(404);
    });

    test('GET /api/vendor/orders returns 400 when username is missing', async () => {
        const res = await request(app)
            .get('/api/vendor/orders')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(400);
    });

    test('GET /api/vendor/orders returns 403 when username does not match JWT user', async () => {
        const res = await request(app)
            .get('/api/vendor/orders?username=someone-else')
            .set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(403);
    });

    test('GET /api/vendor/orders returns orders for vendor', async () => {
        await PlacedOrders.create({
            productId: '507f1f77bcf86cd799439011',
            productName: 'X',
            imageUrl: 'image1.avif',
            quantity: 1,
            boughtFrom: 'vendor1',
            username: 'buyer',
            status: 'Pending',
        });

        const res = await request(app)
            .get('/api/vendor/orders?username=vendor1')
            .set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(1);
        expect(res.body[0].boughtFrom).toBe('vendor1');
    });
});


