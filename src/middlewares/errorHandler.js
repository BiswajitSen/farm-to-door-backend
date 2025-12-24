function errorHandler(err, req, res, next) {
    // eslint-disable-next-line no-unused-vars
    void next;

    const status = Number(err?.status) || 500;
    const message = err?.message || 'Internal server error';

    // Don't treat expected 4xx responses as "server errors" in logs.
    // Example: express.static({ fallthrough: false }) uses a 404 NotFoundError for missing files.
    if (status >= 500) {
        console.error('Unhandled error:', {
            method: req.method,
            url: req.originalUrl,
            status,
            message,
            stack: err?.stack,
        });
    }

    // Normalize common "Not Found" responses
    if (status === 404) {
        return res.status(404).json({ message: 'Not found' });
    }

    const payload = { message };
    if (err?.details) payload.details = err.details;

    // Optional debug info in non-production
    if (process.env.NODE_ENV !== 'production' && err?.stack) {
        payload.stack = err.stack;
    }

    res.status(status).json(payload);
}

module.exports = { errorHandler };


