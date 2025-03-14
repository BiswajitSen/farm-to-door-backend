const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const router = express.Router();

router.post(
    '/',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        try {
            const user = await User.findOne({ username, password });
            if (!user) {
                console.log('User not found');
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

            user.authToken = token;
            await user.save();

            res.status(200).json({ message: 'Login successful', token });
        } catch (err) {
            res.status(500).json({ message: 'Error logging in', error: err.message });
        }
    }
);

module.exports = router;