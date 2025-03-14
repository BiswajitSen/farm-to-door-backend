const mongoose = require('mongoose');

const placedOrderSchema = new mongoose.Schema({
    productId: {type: mongoose.Schema.Types.ObjectId, ref: 'Product'},
    productName: {type: String, required: true},
    imageUrl: {type: String, required: true},
    quantity: {type: Number, required: true, min: 1},
    boughtFrom: {type: String, required: true},
    username: {type: String, required: true},
    status: {type: String, default: 'Pending'},
    orderDate: {type: Date, default: Date.now},
});

const PlacedOrders = mongoose.models.PlacedOrder || mongoose.model('PlacedOrder', placedOrderSchema);

module.exports = PlacedOrders;