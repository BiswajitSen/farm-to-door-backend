const Product = require('./models/Product');

const products = [
    { name: 'Product 1', description: 'Description 1', price: 10, imageUrl: 'image1.avif' },
    { name: 'Product 2', description: 'Description 2', price: 20, imageUrl: 'image2.avif' },
    { name: 'Product 3', description: 'Description 3', price: 30, imageUrl: 'image3.avif' },
    { name: 'Product 1', description: 'Description 1', price: 10, imageUrl: 'image1.avif' },
    { name: 'Product 2', description: 'Description 2', price: 20, imageUrl: 'image2.avif' },
    { name: 'Product 3', description: 'Description 3', price: 30, imageUrl: 'image3.avif' },
    { name: 'Product 1', description: 'Description 1', price: 10, imageUrl: 'image1.avif' },
    { name: 'Product 2', description: 'Description 2', price: 20, imageUrl: 'image2.avif' },
    { name: 'Product 3', description: 'Description 3', price: 30, imageUrl: 'image3.avif' },
    { name: 'Product 1', description: 'Description 1', price: 10, imageUrl: 'image1.avif' },
    { name: 'Product 2', description: 'Description 2', price: 20, imageUrl: 'image2.avif' },
    { name: 'Product 3', description: 'Description 3', price: 30, imageUrl: 'image3.avif' },
    { name: 'Product 1', description: 'Description 1', price: 10, imageUrl: 'image1.avif' },
    { name: 'Product 2', description: 'Description 2', price: 20, imageUrl: 'image2.avif' },
    { name: 'Product 3', description: 'Description 3', price: 30, imageUrl: 'image3.avif' },
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