module.exports = {
    testEnvironment: 'node',
    testMatch: ['**/tests/**/*.test.js'],
    setupFiles: ['<rootDir>/tests/jest.setup.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/jest.afterEnv.js'],
    verbose: false,
};


