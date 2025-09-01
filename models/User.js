const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    sparse: true, // ✅ allows null for admin (no phone required)
    validate: {
      validator: function(v) {
        // only validate if phone is provided
        return !v || /^[0-9]{10}$/.test(v);
      },
      message: 'Please enter a valid 10-digit phone number'
    }
  },
  email: {
    type: String,
    unique: true,
    sparse: true, // ✅ allows users without email, but admin will use it
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        // only validate if email is provided
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
  referral: {
    type: String,
    trim: true
  },
  favorites: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Additional fields for shopowners/electricians
  gstNumber: {
    type: String,
    required: function() {
      return this.role === 'shopowner' || this.role === 'electrician';
    },
    match: [/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Please enter a valid GST number']
  },
  shopName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('passwordHash')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.passwordHash);
};

// Remove sensitive fields from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

module.exports = mongoose.model('User', userSchema);
