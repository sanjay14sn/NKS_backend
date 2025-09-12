const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [200, 'Shop name cannot exceed 200 characters']
  },
  ownerName: {
    type: String,
    trim: true,
    maxlength: [100, 'Owner name cannot exceed 100 characters']
  },
  contactInfo: {
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[0-9]{10}$/.test(v);
        },
        message: 'Please enter a valid 10-digit phone number'
      }
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v) {
          return !v || /^\S+@\S+\.\S+$/.test(v);
        },
        message: 'Please enter a valid email address'
      }
    }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { 
      type: String,
      validate: {
        validator: function(v) {
          return !v || /^[0-9]{6}$/.test(v);
        },
        message: 'Please enter a valid 6-digit ZIP code'
      }
    },
    country: { type: String, default: 'India' }
  },
  paymentQR: {
    qrCode: { type: String, required: true }, // Base64 encoded QR image
    qrData: { type: String, required: true }, // QR code data/content
    qrId: { type: String, required: true, unique: true } // Unique identifier
  },
  shopOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Can be null if admin manages directly
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: [0, 'Revenue cannot be negative']
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: [0, 'Purchase count cannot be negative']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
shopSchema.index({ 'paymentQR.qrId': 1 });
shopSchema.index({ shopOwner: 1 });
shopSchema.index({ createdBy: 1 });

// Method to update revenue and purchase count
shopSchema.methods.addPurchase = function(amount) {
  this.totalRevenue += amount;
  this.totalPurchases += 1;
  return this.save();
};

module.exports = mongoose.model('Shop', shopSchema);