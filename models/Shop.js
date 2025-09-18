const mongoose = require('mongoose');

const shopSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: [true, 'Shop name is required'],
    trim: true,
    maxlength: [200, 'Shop name cannot exceed 200 characters']
  },
  gstNumber: {
    type: String,
    required: [true, 'GST number is required'],
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: 'Please enter a valid 10-digit mobile number'
    }
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
    qrId: { type: String, required: true, unique: true }, // Unique identifier
    shopCode: { type: String, required: true, unique: true } // Shop-specific code for QR
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
  demoTransactionAmount: {
    type: Number,
    default: 30,
    min: [1, 'Demo transaction amount must be at least ₹1']
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
shopSchema.index({ 'paymentQR.shopCode': 1 });
shopSchema.index({ shopOwner: 1 });
shopSchema.index({ createdBy: 1 });
shopSchema.index({ gstNumber: 1 });
shopSchema.index({ mobileNumber: 1 });

// Method to update revenue and purchase count
shopSchema.methods.addPurchase = function(amount) {
  this.totalRevenue += amount;
  this.totalPurchases += 1;
  return this.save();
};

// Method to regenerate QR code (invalidates old QR)
shopSchema.methods.regenerateQR = async function() {
  const QRCode = require('qrcode');
  const { v4: uuidv4 } = require('uuid');
  
  const newQrId = uuidv4();
  const newShopCode = `SHOP_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const qrData = JSON.stringify({
    shopId: this._id,
    shopName: this.shopName,
    shopCode: newShopCode,
    qrId: newQrId,
    type: 'shop_payment_demo',
    demoAmount: this.demoTransactionAmount,
    gstNumber: this.gstNumber,
    mobileNumber: this.mobileNumber
  });

  const qrCodeImage = await QRCode.toDataURL(qrData, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    quality: 0.92,
    margin: 1,
    color: {
      dark: '#000000',
      light: '#FFFFFF'
    }
  });

  this.paymentQR = {
    qrCode: qrCodeImage,
    qrData: qrData,
    qrId: newQrId,
    shopCode: newShopCode
  };

  return this.save();
};
module.exports = mongoose.model('Shop', shopSchema);