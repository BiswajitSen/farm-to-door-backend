const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    productIds: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, required: true },
        imageUrl: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        boughtFrom: { type: String, required: true },
        status: { type: String, default: 'Pending' },
    }],
    deliveryAddress: { type: String, required: true, minlength: 10 },
    orderDate: { type: Date, default: Date.now },
    productCount: { type: Number, default: 0 },
    username: { type: String, required: true },
});

orderSchema.pre('save', function(next) {
    this.productCount = this.productIds.reduce((total, product) => total + product.quantity, 0);
    next();
});

const Orders = mongoose.models.Order || mongoose.model('Order', orderSchema);

module.exports = Orders;