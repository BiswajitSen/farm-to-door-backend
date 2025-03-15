const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../models/product');
const Orders = require('../models/orders');
const PlacedOrders = require('../models/placedOrders');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'resources/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

const validateAddProductRequest = (req, res, next) => {
    const { name, description, price, quantity } = req.body;
    const { username } = req.query;
    console.log({ name, description, price, quantity, username });
    if (!name || !description || !price || !quantity || !username) {
        return res.status(400).json({ message: 'Missing required fields' });
    }
    next();
};

router.post('/addProducts', upload.single('image'), validateAddProductRequest, async (req, res) => {
    const { name, description, price, quantity } = req.body;
    const { username } = req.query;
    const imageUrl = `${req.file.filename}`;

    try {
        const newProduct = new Product({ name, description, price, quantity, imageUrl, soldBy: username });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ message: 'Error saving product', error: err.message });
    }
});

router.get('/products', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Missing required query parameter: username' });
    }

    try {
        const products = await Product.find({ soldBy: username });
        console.log({ products });
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
});

router.get('/orders', async (req, res) => {
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Missing required query parameter: username' });
    }

    try {
        const orders = await PlacedOrders.find({ boughtFrom: username });
        console.log({ orders });
        res.status(200).json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching orders', error: err.message });
    }
});

router.delete('/products/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findByIdAndDelete(id);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting product', error: err.message });
    }
});

router.put('/orders/:id/status', async (req, res) => {
    const { id } = req.params;
    const { status, username } = req.body;

    if (!status || !username) {
        return res.status(400).json({ message: 'Missing required fields: status and/or username' });
    }

    try {
        const placedOrder = await PlacedOrders.findOneAndUpdate(
            { _id: id, boughtFrom: username },
            { status },
            { new: true }
        );

        if (!placedOrder) {
            return res.status(404).json({ message: 'Placed order not found or not bought from the specified user' });
        }

        const order = await Orders.findOneAndUpdate(
            { 'productIds.productId': placedOrder.productId, 'productIds.boughtFrom': username },
            { $set: { 'productIds.$.status': status } },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({ message: 'Order not found or not placed by the specified user' });
        }

        res.status(200).json({ message: 'Order status updated successfully', placedOrder, order });
    } catch (err) {
        res.status(500).json({ message: 'Error updating order status', error: err.message });
    }
});


module.exports = router;