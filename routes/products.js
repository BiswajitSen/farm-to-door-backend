const express = require('express');
const Products = require('../models/product');
const router = express.Router();
const { body } = require('express-validator');
const { validate } = require('../src/middlewares/validate');
const { asyncHandler } = require('../src/utils/asyncHandler');

router.get(
    '/',
    asyncHandler(async (req, res) => {
        const products = await Products.find();
        res.json(products);
    })
);

router.post(
    '/',
    [
        body('name').notEmpty().withMessage('Name is required'),
        body('description').notEmpty().withMessage('Description is required'),
        body('price').isFloat({ gt: 0 }).withMessage('Price must be a positive number'),
        // Accept either a full URL or a local filename served via /api/images/<filename>
        body('imageUrl').isString().notEmpty().withMessage('Image URL/filename is required'),
        body('quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive number'),
    ],
    validate,
    asyncHandler(async (req, res) => {

        const { name, description, price, quantity, imageUrl } = req.body;
        const newProduct = new Products({ name, description, price, quantity, imageUrl });
        await newProduct.save();
        res.status(201).json(newProduct);
    })
);

module.exports = router;