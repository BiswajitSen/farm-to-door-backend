const express = require('express');
const { body } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const { validate } = require('../src/middlewares/validate');
const { asyncHandler } = require('../src/utils/asyncHandler');
const router = express.Router();

router.post(
    '/',
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    validate,
    asyncHandler(async (req, res) => {

        const { username, password } = req.body;

        const user = await User.findOne({ username }).select('+password +passwordHash');
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        let passwordOk = false;
        if (user.passwordHash) {
            passwordOk = await bcrypt.compare(password, user.passwordHash);
        } else if (user.password) {
            // Legacy plaintext support (migrate on successful login)
            passwordOk = user.password === password;
            if (passwordOk) {
                user.passwordHash = await bcrypt.hash(password, 10);
                user.password = undefined;
            }
        }

        if (!passwordOk) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

        user.authToken = token;
        await user.save();

        res.status(200).json({ message: 'Login successful', token });
    })
);

module.exports = router;