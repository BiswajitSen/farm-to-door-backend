const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: String,
    description: String,
    price: Number,
    imageUrl: String,
    quantity: Number,
    soldBy: String,
});

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;