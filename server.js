const path = require('path');
const { loadEnv, getConfig } = require('./src/config/env');
const { connectToMongo, disconnectFromMongo, mongoose } = require('./src/config/db');
const { createApp } = require('./src/app');
const populateProducts = require('./populateProducts');

function requireDependency(moduleName) {
    try {
        require.resolve(moduleName);
    } catch (err) {
        console.error(
            [
                `Missing dependency: ${moduleName}`,
                '',
                'Run:',
                '  npm install',
            ].join('\n')
        );
        process.exit(1);
    }
}

const main = async () => {
    try {
        const envLoad = loadEnv({ rootDir: __dirname });
        if (envLoad.ok) {
            console.log(`Loaded environment from ${path.basename(envLoad.envPath)}`);
        } else {
            console.warn(`Warning: failed to load env file at ${envLoad.envPath}: ${envLoad.error.message}`);
        }

        // Required by auth routes
        requireDependency('bcryptjs');

        const config = getConfig();
        config.envFile = envLoad.envPath;

        await connectToMongo(config.mongoUri);
        console.log('Connected to MongoDB');

        if (config.seedProducts) {
            console.log('SEED_PRODUCTS=true → seeding products (this will overwrite existing products)');
            await populateProducts();
        }

        const app = createApp();
        const server = app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });

        const shutdown = async (signal) => {
            console.log(`Received ${signal}. Shutting down...`);
            server.close(async () => {
                await disconnectFromMongo().catch(() => {});
                process.exit(0);
            });
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (err) {
        // Helpful hints for common MongoDB Atlas/local connection failures
        if (err && typeof err.message === 'string') {
            const msg = err.message;
            if (msg.includes('bad auth') || msg.toLowerCase().includes('authentication failed')) {
                console.error(
                    [
                        'Error starting the server: MongoDB authentication failed.',
                        '',
                        'Check:',
                        '- Your MongoDB username/password are correct',
                        '- If the password contains special characters, URL-encode it',
                        '- The user has access to the target database/cluster',
                    ].join('\n')
                );
                process.exit(1);
            }
            if (msg.includes('ServerSelectionError') || msg.toLowerCase().includes('server selection')) {
                console.error(
                    [
                        'Error starting the server: cannot reach MongoDB (server selection error).',
                        '',
                        'Common fixes:',
                        '- If using Atlas: add your current IP to the Network Access allowlist',
                        '- If using local MongoDB: ensure mongod is running on the host/port in MONGODB_URI',
                    ].join('\n')
                );
                process.exit(1);
            }
        }

        console.error('Error starting the server:', err);
        process.exit(1);
    }
};

main();