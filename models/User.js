const mongoose = require('mongoose');

// ===================== ADDRESS SCHEMA =====================
const addressSchema = new mongoose.Schema({
  nickname: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: [50, 'Nickname cannot exceed 50 characters'] // e.g. Home, Office, Mom's house
  },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  postalCode: { type: String, required: true, trim: true },
  country: { type: String, required: true, trim: true },
  latitude: { type: Number, required: true },   // ✅ lat
  longitude: { type: Number, required: true },  // ✅ lon
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

// ===================== USER SCHEMA =====================
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  phone: {
    type: String,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\S+@\S+\.\S+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  passwordHash: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6
  },
  role: {
    type: String,
    enum: ['user', 'shopowner', 'electrician', 'admin'],
    default: 'user'
  },
  referral: { type: String, trim: true },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  gstNumber: {
    type: String,
    required: function() {
      return this.role === 'shopowner' || this.role === 'electrician';
    },
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  shopName: { type: String, trim: true },
  isActive: { type: Boolean, default: true },
  addresses: [addressSchema], // ✅ array of addresses with nickname + lat/lon
  profilePicture: {
    url: { type: String, default: null },       // Cloudinary URL
    public_id: { type: String, default: null }  // For deletion
  }
}, {
  timestamps: true
});

const bcrypt = require('bcryptjs');

// ===================== PASSWORD HASHING =====================
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// ===================== PASSWORD COMPARE =====================
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// ===================== HIDE SENSITIVE FIELDS =====================
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

module.exports = mongoose.model('User', userSchema);
