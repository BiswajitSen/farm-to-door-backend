const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../models/product');
const Orders = require('../models/orders');
const PlacedOrders = require('../models/placedOrders');
const router = express.Router();
const { asyncHandler } = require('../src/utils/asyncHandler');
const { getAuthedUsername } = require('../src/utils/getAuthedUsername');

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

router.post('/addProducts', upload.single('image'), validateAddProductRequest, asyncHandler(async (req, res) => {
    const { name, description, price, quantity } = req.body;
    const authedUsername = getAuthedUsername(req);
    const { username } = req.query;

    if (authedUsername && username && username !== authedUsername) {
        return res.status(403).json({ message: 'Cannot add products for another user' });
    }
    const imageUrl = `${req.file.filename}`;

    const newProduct = new Product({ name, description, price, quantity, imageUrl, soldBy: username });
    await newProduct.save();
    res.status(201).json(newProduct);
}));

router.get('/products', asyncHandler(async (req, res) => {
    const authedUsername = getAuthedUsername(req);
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Missing required query parameter: username' });
    }
    if (authedUsername && username !== authedUsername) {
        return res.status(403).json({ message: 'Cannot fetch products for another user' });
    }

    const products = await Product.find({ soldBy: username });
    res.status(200).json(products);
}));

router.get('/orders', asyncHandler(async (req, res) => {
    const authedUsername = getAuthedUsername(req);
    const { username } = req.query;

    if (!username) {
        return res.status(400).json({ message: 'Missing required query parameter: username' });
    }
    if (authedUsername && username !== authedUsername) {
        return res.status(403).json({ message: 'Cannot fetch orders for another user' });
    }

    const orders = await PlacedOrders.find({ boughtFrom: username });
    res.status(200).json(orders);
}));

router.delete('/products/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    const authedUsername = getAuthedUsername(req);
    if (!authedUsername) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const product = await Product.findOneAndDelete({ _id: id, soldBy: authedUsername });
    if (!product) {
        return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ message: 'Product deleted successfully' });
}));

router.put('/orders/:id/status', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, username } = req.body;
    const authedUsername = getAuthedUsername(req);

    if (!status || !username) {
        return res.status(400).json({ message: 'Missing required fields: status and/or username' });
    }
    if (authedUsername && username !== authedUsername) {
        return res.status(403).json({ message: 'Cannot update orders for another user' });
    }

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
}));


module.exports = router;