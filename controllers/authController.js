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

// ===================== SIGNUP USER =====================
const signupUser = async (req, res) => {
  try {
    const { name, phone, password, referral } = req.body;

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    const user = new User({
      name,
      phone,
      passwordHash: password, // ⚠️ ensure hashing in User model
      role: 'user',
      referral,
    });

    await user.save();
    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        referral: user.referral,
      },
    });
  } catch (error) {
    console.error('User signup error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ===================== SIGNUP SHOP OWNER/ELECTRICIAN =====================
const signupShopOwner = async (req, res) => {
  try {
    const { name, phone, password, gstNumber, shopName, role } = req.body;

    if (!['shopowner', 'electrician'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be shopowner or electrician' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number already exists' });
    }

    const shopOwner = new User({
      name,
      phone,
      passwordHash: password, // ⚠️ hashing handled in User model
      role,
      gstNumber,
      shopName,
    });

    await shopOwner.save();
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
        shopName: shopOwner.shopName,
      },
    });
  } catch (error) {
    console.error('Shop owner signup error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// ===================== LOGIN =====================
const login = async (req, res) => {
  try {
    const { phone, email, password } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ error: 'Please provide phone or email' });
    }

    const query = {};
    if (phone) query.phone = phone;
    if (email) query.email = email;
    query.isActive = true;

    const user = await User.findOne(query);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return res.status(401).json({ error: 'Invalid credentials' });

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
        shopName: user.shopName,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// ===================== GET PROFILE =====================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('favorites', 'title price images');

    if (!user) return res.status(404).json({ error: 'User not found' });

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
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

// ===================== ADMIN GET ALL USERS =====================
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Users fetched successfully',
      users,
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

// ===================== ADD ADDRESS =====================
const addAddress = async (req, res) => {
  try {
    const { nickname, street, city, state, postalCode, country, latitude, longitude, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (isDefault) {
      // Make all other addresses non-default
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    user.addresses.push({
      nickname,
      street,
      city,
      state,
      postalCode,
      country,
      latitude,
      longitude,
      isDefault
    });

    await user.save();

    res.status(201).json({
      message: 'Address added successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({ error: 'Failed to add address' });
  }
};

// ===================== UPDATE ADDRESS =====================
const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { nickname, street, city, state, postalCode, country, latitude, longitude, isDefault } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ error: 'Address not found' });

    if (isDefault) {
      // make all other addresses non-default
      user.addresses.forEach(addr => addr.isDefault = false);
    }

    // update fields if provided
    address.nickname = nickname || address.nickname;
    address.street = street || address.street;
    address.city = city || address.city;
    address.state = state || address.state;
    address.postalCode = postalCode || address.postalCode;
    address.country = country || address.country;
    address.latitude = latitude ?? address.latitude;
    address.longitude = longitude ?? address.longitude;
    address.isDefault = isDefault ?? address.isDefault;

    await user.save();

    res.json({
      message: 'Address updated successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({ error: 'Failed to update address' });
  }
};

// ===================== DELETE ADDRESS =====================
const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const address = user.addresses.id(addressId);
    if (!address) return res.status(404).json({ error: 'Address not found' });

    address.deleteOne();
    await user.save();

    res.json({
      message: 'Address deleted successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({ error: 'Failed to delete address' });
  }
};

// ===================== GET ALL ADDRESSES =====================
const getAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('addresses');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      message: 'Addresses fetched successfully',
      addresses: user.addresses
    });
  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({ error: 'Failed to fetch addresses' });
  }
};

module.exports = {
  signupUser,
  signupShopOwner,
  login,
  getProfile,
  getAllUsers,
  updateAddress,
  addAddress,
  deleteAddress,
  getAddresses
};
