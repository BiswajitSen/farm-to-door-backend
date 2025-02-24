const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    deliveryAddress: String,
    status: { type: String, default: 'Pending' },
    orderDate: { type: Date, default: Date.now },
});

const Orders = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Orders;