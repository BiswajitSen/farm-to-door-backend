const express = require('express');
const Products = require('../models/product');
const router = express.Router();
const { body, validationResult } = require('express-validator');

router.get('/', async (req, res) => {
    try {
        const products = await Products.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
});

router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
        body('imageUrl').isURL().withMessage('Image URL must be valid'),
        body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive number'),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, description, price, quantity, imageUrl } = req.body;
        try {
            const newProduct = new Products({ name, description, price, quantity, imageUrl });
            await newProduct.save();
            res.status(201).json(newProduct);
        } catch (err) {
            res.status(500).json({ message: 'Error saving product', error: err.message });
        }
    }
);

module.exports = router;