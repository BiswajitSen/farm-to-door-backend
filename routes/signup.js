const express = require('express');
const { body } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { validate } = require('../src/middlewares/validate');
const { asyncHandler } = require('../src/utils/asyncHandler');
const router = express.Router();

router.post(
    '/',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password')
            .notEmpty().withMessage('Password is required')
            .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
    ],
    validate,
    asyncHandler(async (req, res) => {

        const { username, password } = req.body;

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const newUser = new User({ username, passwordHash });
        await newUser.save();

        res.status(201).json({ message: 'User created successfully' });
    })
);

module.exports = router;