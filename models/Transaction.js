const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: [true, 'Shop reference is required']
  },
  shopCode: {
    type: String,
    required: [true, 'Shop code is required'],
    index: true
  },
  transactionAmount: {
    type: Number,
    required: [true, 'Transaction amount is required'],
    min: [0, 'Transaction amount cannot be negative']
  },
  transactionType: {
    type: String,
    enum: ['demo_qr_scan', 'manual_entry', 'api_simulation'],
    default: 'demo_qr_scan'
  },
  paymentMethod: {
    type: String,
    enum: ['googlepay', 'phonepe', 'paytm', 'upi', 'demo'],
    default: 'demo'
  },
  transactionId: {
    type: String,
    unique: true,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'simulated'],
    default: 'simulated'
  },
  customerInfo: {
    name: { type: String, trim: true },
    phone: { type: String, trim: true },
    upiId: { type: String, trim: true }
  },
  metadata: {
    scannedAt: { type: Date, default: Date.now },
    userAgent: { type: String },
    ipAddress: { type: String },
    qrId: { type: String }
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot exceed 500 characters'],
    default: 'Demo QR scan transaction'
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
transactionSchema.index({ shop: 1, createdAt: -1 });
transactionSchema.index({ shopCode: 1, createdAt: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// Generate unique transaction ID before saving
transactionSchema.pre('save', function(next) {
  if (!this.transactionId) {
    this.transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);