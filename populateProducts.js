const Product = require('./models/Product');

const products = [
    { name: 'Product 1', description: 'Description 1', price: 10, imageUrl: 'http://example.com/image1.jpg' },
    { name: 'Product 2', description: 'Description 2', price: 20, imageUrl: 'http://example.com/image2.jpg' },
    { name: 'Product 3', description: 'Description 3', price: 30, imageUrl: 'http://example.com/image3.jpg' },
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