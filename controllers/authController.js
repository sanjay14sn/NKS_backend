const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// User signup
const signupUser = async (req, res) => {
  try {
    const { name, phone, password, referral } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this phone number already exists'
      });
    }

    // Create new user
    const user = new User({
      name,
      phone,
      passwordHash: password,
      role: 'user',
      referral
    });

    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        referral: user.referral
      }
    });
  } catch (error) {
    console.error('User signup error:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.'
    });
  }
};

// ShopOwner/Electrician signup
const signupShopOwner = async (req, res) => {
  try {
    const { name, phone, password, gstNumber, shopName, role } = req.body;

    // Validate role
    if (!['shopowner', 'electrician'].includes(role)) {
      return res.status(400).json({
        error: 'Invalid role. Must be shopowner or electrician'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        error: 'User with this phone number already exists'
      });
    }

    // Create new shop owner
    const shopOwner = new User({
      name,
      phone,
      passwordHash: password,
      role,
      gstNumber,
      shopName
    });

    await shopOwner.save();

    // Generate token
    const token = generateToken(shopOwner._id);

    res.status(201).json({
      message: 'Shop owner registered successfully',
      token,
      user: {
        id: shopOwner._id,
        name: shopOwner.name,
        phone: shopOwner.phone,
        role: shopOwner.role,
        gstNumber: shopOwner.gstNumber,
        shopName: shopOwner.shopName
      }
    });
  } catch (error) {
    console.error('Shop owner signup error:', error);
    res.status(500).json({
      error: 'Registration failed. Please try again.'
    });
  }
};

// Login
// Login
const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    // Find user by phone or email
    const user = await User.findOne({
      $or: [
        phone ? { phone, isActive: true } : {},
        email ? { email, isActive: true } : {}
      ]
    });

    if (!user) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Invalid credentials'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        gstNumber: user.gstNumber,
        shopName: user.shopName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed. Please try again.'
    });
  }
};


// Get current user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites', 'title price images');
    
    res.json({
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        gstNumber: user.gstNumber,
        shopName: user.shopName,
        referral: user.referral,
        favorites: user.favorites,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Failed to fetch profile'
    });
  }
};

module.exports = {
  signupUser,
  signupShopOwner,
  login,
  getProfile
};