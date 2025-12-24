const express = require('express');
const cors = require('cors');

const authMiddleware = require('../middlewares/auth');
const { notFound } = require('./middlewares/notFound');
const { errorHandler } = require('./middlewares/errorHandler');
const { safeRequire } = require('./utils/safeRequire');

const logger = (req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
};

function createApp() {
    const app = express();

    app.use(logger);
    const helmet = safeRequire('helmet');
    if (helmet) {
        app.use(helmet());
    } else {
        console.warn('Optional dependency missing: helmet (run `npm install` to enable security headers)');
    }

    const morgan = safeRequire('morgan');
    if (morgan) {
        app.use(morgan('combined'));
    } else {
        console.warn('Optional dependency missing: morgan (run `npm install` to enable request logging)');
    }
    app.use(cors());
    app.use(express.json());

    app.use('/api/signup', require('../routes/signup'));
    app.use('/api/login', require('../routes/login'));
    app.use('/api/products', require('../routes/products'));
    // Public static files; don't "fall through" into auth middleware when missing.
    app.use('/api/images/', express.static('resources/images', { fallthrough: false }));

    // Protected routes
    app.use(authMiddleware);
    app.use('/api/orders', require('../routes/orders'));
    app.use('/api/vendor', require('../routes/vendor'));

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = { createApp };


