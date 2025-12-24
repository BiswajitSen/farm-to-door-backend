// Runs before any test files are evaluated
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret';
process.env.SEED_PRODUCTS = 'false';


