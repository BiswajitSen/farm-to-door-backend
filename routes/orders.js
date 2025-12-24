const express = require('express');
const Orders = require('../models/orders');
const Product = require('../models/product');
const PlacedOrders = require('../models/placedOrders');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../src/middlewares/validate');
const { asyncHandler } = require('../src/utils/asyncHandler');
const { getAuthedUsername } = require('../src/utils/getAuthedUsername');

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
    validate,
    asyncHandler(async (req, res) => {
        const { productIds, deliveryAddress } = req.body;

        const authedUsername = getAuthedUsername(req);
        const requestedUsername = req.body.username;
        const username = requestedUsername || authedUsername;

        if (!username) {
            return res.status(400).json({ message: 'Missing required field: username' });
        }

        // Backward compatible, but prevents impersonation
        if (authedUsername && requestedUsername && requestedUsername !== authedUsername) {
            return res.status(403).json({ message: 'Cannot place order for another user' });
        }

        const productIdsArray = productIds.map(p => p.productId);
        const products = await Product.find({ _id: { $in: productIdsArray } });
        if (products.length !== productIdsArray.length) {
            return res.status(404).json({ message: 'One or more products not found' });
        }

        // Check stock up front
        const productById = new Map(products.map((p) => [String(p._id), p]));
        for (const p of productIds) {
            const prod = productById.get(String(p.productId));
            if (!prod) return res.status(404).json({ message: 'One or more products not found' });
            if (typeof p.quantity !== 'number' && typeof p.quantity !== 'string') {
                return res.status(400).json({ message: 'Invalid quantity' });
            }
            const qty = Number(p.quantity);
            if (!Number.isFinite(qty) || qty <= 0) {
                return res.status(400).json({ message: 'Invalid quantity' });
            }
            if (prod.quantity < qty) {
                return res.status(409).json({ message: 'Insufficient stock', productId: String(prod._id) });
            }
        }

        // Decrement stock; rollback if any step fails
        const decremented = [];
        try {
            for (const p of productIds) {
                const qty = Number(p.quantity);
                const result = await Product.updateOne(
                    { _id: p.productId, quantity: { $gte: qty } },
                    { $inc: { quantity: -qty } }
                );

                if (result.modifiedCount !== 1) {
                    throw Object.assign(new Error('Insufficient stock'), { code: 'INSUFFICIENT_STOCK', productId: String(p.productId) });
                }
                decremented.push({ productId: p.productId, quantity: qty });
            }

            const newOrder = new Orders({ productIds, deliveryAddress, username });
            await newOrder.save();

            const placedOrderDetails = productIds.map(p => {
                return new PlacedOrders({
                    productId: p.productId,
                    productName: p.productName,
                    imageUrl: p.imageUrl,
                    quantity: p.quantity,
                    boughtFrom: p.boughtFrom,
                    username: username
                });
            });

            await PlacedOrders.insertMany(placedOrderDetails);

            res.status(201).json(newOrder);
        } catch (err) {
            // rollback
            for (const d of decremented) {
                await Product.updateOne({ _id: d.productId }, { $inc: { quantity: d.quantity } }).catch(() => {});
            }

            if (err?.code === 'INSUFFICIENT_STOCK') {
                return res.status(409).json({ message: 'Insufficient stock', productId: err.productId });
            }
            throw err;
        }
    })
);

router.get(
    '/',
    asyncHandler(async (req, res) => {
        const authedUsername = getAuthedUsername(req);
        const requestedUsername = req.query.username;
        const username = requestedUsername || authedUsername;

        if (!username) {
            return res.status(400).json({ message: 'Missing required query parameter: username' });
        }
        if (authedUsername && requestedUsername && requestedUsername !== authedUsername) {
            return res.status(403).json({ message: 'Cannot fetch orders for another user' });
        }

        const orders = await Orders.find({ username });
        res.json(orders);
    })
);

module.exports = router;