const express = require('express');
const Orders = require('../models/orders');
const Product = require('../models/product');
const router = express.Router();
const { body, param, validationResult } = require('express-validator');

// Create a new order with multiple products
router.post(
    '/',
    [
        body('productIds').isArray({ min: 1 }).withMessage('Product IDs must be an array with at least one product ID'),
        body('productIds.*').notEmpty().withMessage('Each product ID is required'),
        body('deliveryAddress').notEmpty().withMessage('Delivery address is required')
    ],
    async (req, res) => {
        // const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.status(400).json({ errors: errors.array() });
        // }

        const { productIds, deliveryAddress } = req.body;
        console.log({productIds, deliveryAddress})
        try {
            console.log(JSON.stringify(productIds));
            const products = await Product.find({ _id: { $in: productIds } });
            if (products.length !== productIds.length) {
                return res.status(404).json({ message: 'One or more products not found' });
            }

            const newOrder = new Orders({ productIds, deliveryAddress });
            await newOrder.save();
            res.status(201).json(newOrder);
        } catch (err) {
            res.status(500).json({ message: 'Error placing order', error: err.message });
        }
    }
);

// Get order by ID
router.get(
    '/:orderId',
    [
        param('orderId').isMongoId().withMessage('Invalid order ID')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { orderId } = req.params;
        try {
            const order = await Orders.findById(orderId).populate('productIds');
            if (!order) return res.status(404).json({ message: 'Order not found' });
            res.json(order);
        } catch (err) {
            res.status(500).json({ message: 'Error fetching order', error: err.message });
        }
    }
);

module.exports = router;