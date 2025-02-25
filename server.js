require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const populateProducts = require('./populateProducts');
const authMiddleware = require('./middlewares/auth');

const port = process.env.PORT || 8080;

const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

const createApp = () => {
    const app = express();
    app.use(logger);
    app.use(cors());
    app.use(bodyParser.json());
    app.use('/api/signup', require('./routes/signup'));
    app.use('/api/login', require('./routes/login'));
    app.use('/api/products', require('./routes/products'));
    app.use('/api/images/', express.static('resources/images'));
    app.use(authMiddleware);
    app.use('/api/orders', require('./routes/orders'));
    return app;
};

const main = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('Connected to MongoDB');

        await populateProducts();

        const app = createApp();
        app.listen(port, () => {
            console.log(`Server is running on port ${port}`);
        });
    } catch (err) {
        console.error('Error starting the server:', err);
        process.exit(1);
    }
};

main();