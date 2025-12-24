const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Loads environment variables from .env.local (preferred) or .env (fallback).
 * Returns metadata about what was loaded.
 */
function loadEnv({ rootDir = path.resolve(__dirname, '..', '..') } = {}) {
    const envLocalPath = path.resolve(rootDir, '.env.local');
    const envPath = fs.existsSync(envLocalPath) ? envLocalPath : path.resolve(rootDir, '.env');

    const result = dotenv.config({ path: envPath });
    if (result.error) {
        return { ok: false, envPath, error: result.error };
    }
    return { ok: true, envPath };
}

function requireEnv(name) {
    const value = process.env[name];
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
        const err = new Error(`Missing required environment variable: ${name}`);
        err.code = 'ERR_MISSING_ENV';
        err.envName = name;
        throw err;
    }
    return value;
}

function getConfig() {
    return {
        port: Number(process.env.PORT) || 8080,
        mongoUri: requireEnv('MONGODB_URI'),
        jwtSecret: requireEnv('JWT_SECRET'),
        seedProducts: process.env.SEED_PRODUCTS === 'true',
        envFile: undefined, // set by caller using loadEnv()
    };
}

module.exports = { loadEnv, getConfig, requireEnv };


