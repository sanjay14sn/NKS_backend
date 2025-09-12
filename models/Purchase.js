const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true
  },
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Optional - can be null for anonymous purchases
  },
  purchaseAmount: {
    type: Number,
    required: [true, 'Purchase amount is required'],
    min: [0, 'Purchase amount cannot be negative']
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product'
    },
    quantity: {
      type: Number,
      min: 1,
      default: 1
    },
    price: {
      type: Number,
      min: 0
    }
  }],
  paymentMethod: {
    type: String,
    enum: ['qr', 'cash', 'card', 'online'],
    default: 'qr'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed'
  },
  customerInfo: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
purchaseSchema.index({ shop: 1, createdAt: -1 });
purchaseSchema.index({ customer: 1, createdAt: -1 });
purchaseSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Purchase', purchaseSchema);