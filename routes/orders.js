const express = require('express');
const Orders = require('../models/orders');
const Product = require('../models/product');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Create a new order with multiple products
router.post(
    '/',
    [
        body('productIds').isArray({ min: 1 }).withMessage('Product IDs must be an array with at least one product ID'),
        body('productIds.*.productId').notEmpty().withMessage('Each product must have a product ID'),
        body('productIds.*.quantity').isInt({ min: 1 }).withMessage('Each product must have a quantity of at least 1'),
        body('deliveryAddress')
            .notEmpty().withMessage('Delivery address is required')
            .isLength({ min: 10 }).withMessage('Delivery address must be at least 10 characters long')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { productIds, deliveryAddress } = req.body;
        try {
            const productIdsArray = productIds.map(p => p.productId);
            const products = await Product.find({ _id: { $in: productIdsArray } });
            if (products.length !== productIdsArray.length) {
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

module.exports = router;