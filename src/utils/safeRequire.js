function safeRequire(moduleName) {
    try {
        // eslint-disable-next-line import/no-dynamic-require, global-require
        return require(moduleName);
    } catch (err) {
        if (err && err.code === 'MODULE_NOT_FOUND') return null;
        throw err;
    }
}

module.exports = { safeRequire };


