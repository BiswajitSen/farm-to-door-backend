const Product = require('./models/Product');

const products = [
    { name: 'Product 1', description: 'Description 1', price: 10, imageUrl: 'image1.avif', quantity: 1, soldBy: 'user@example.com' },
    { name: 'Product 2', description: 'Description 2', price: 20, imageUrl: 'image2.avif', quantity: 1, soldBy: 'user@example.com' },
    { name: 'Product 3', description: 'Description 3', price: 30, imageUrl: 'image3.avif', quantity: 1, soldBy: 'user@example.com' },
    { name: 'Product 4', description: 'Description 4', price: 40, imageUrl: 'image4.avif', quantity: 1, soldBy: 'user@example.com' },
    { name: 'Product 5', description: 'Description 5', price: 50, imageUrl: 'image5.avif', quantity: 1, soldBy: 'user@example.com' },
    { name: 'Product 6', description: 'Description 6', price: 60, imageUrl: 'image6.avif', quantity: 1, soldBy: 'user@example.com' },
    { name: 'Product 7', description: 'Description 7', price: 70, imageUrl: 'image7.avif', quantity: 1, soldBy: 'user@example.com' },
    { name: 'Product 8', description: 'Description 8', price: 80, imageUrl: 'image8.avif', quantity: 1, soldBy: 'user@example.com' },
];

const populateProducts = async () => {
    try {
        await Product.deleteMany({});
        await Product.insertMany(products);
        console.log('Products populated successfully');
    } catch (err) {
        console.error('Error populating products:', err);
    }
};

module.exports = populateProducts;