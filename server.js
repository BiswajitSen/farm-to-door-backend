require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const populateProducts = require('./populateProducts');

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
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/images/', express.static('resources/images'));
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