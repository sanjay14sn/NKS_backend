const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

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
    const { name, email, phone, password, referral } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email }] 
    });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number or email already exists' });
    }

    const user = new User({
      name,
      email,
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
        email: user.email,
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
    const { name, email, phone, password, gstNumber, shopName, role } = req.body;

    if (!['shopowner', 'electrician'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be shopowner or electrician' });
    }

    const existingUser = await User.findOne({ 
      $or: [{ phone }, { email }] 
    });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this phone number or email already exists' });
    }

    const shopOwner = new User({
      name,
      email,
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
        email: shopOwner.email,
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
    const { phone, email, password, fcmToken, deviceInfo } = req.body;

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

    // Update FCM token and device info if provided
    if (fcmToken) {
      user.fcmToken = fcmToken;
    }
    if (deviceInfo) {
      user.deviceInfo = {
        platform: deviceInfo.platform,
        deviceId: deviceInfo.deviceId,
        appVersion: deviceInfo.appVersion
      };
    }
    
    if (fcmToken || deviceInfo) {
      await user.save();
    }
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
        profilePicture: user.profilePicture,
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
    console.log('req.user:', req.user);
    console.log('req.body:', req.body);

    const { nickname, street, city, state, postalCode, country, latitude, longitude, isDefault } = req.body;

    const user = await User.findById(req.user?.id); // optional chaining
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (isDefault) {
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

    const savedUser = await user.save();
    console.log('Saved user:', savedUser);

    res.status(201).json({
      message: 'Address added successfully',
      addresses: savedUser.addresses
    });
  } catch (error) {
    console.error('Add address error:', error); // log full error
    res.status(500).json({ error: error.message }); // send detailed message
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

// ===================== UPLOAD PROFILE PICTURE =====================
const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete old profile picture from Cloudinary if exists
    if (user.profilePicture && user.profilePicture.public_id) {
      try {
        await cloudinary.uploader.destroy(user.profilePicture.public_id);
      } catch (error) {
        console.error('Error deleting old profile picture:', error);
      }
    }

    // Update user with new profile picture
    user.profilePicture = {
      url: req.file.path,
      public_id: req.file.filename
    };

    await user.save();

    res.json({
      message: 'Profile picture updated successfully',
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({ error: 'Failed to upload profile picture' });
  }
};

// ===================== DELETE PROFILE PICTURE =====================
const deleteProfilePicture = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (!user.profilePicture || !user.profilePicture.public_id) {
      return res.status(400).json({ error: 'No profile picture to delete' });
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(user.profilePicture.public_id);
    } catch (error) {
      console.error('Error deleting profile picture from Cloudinary:', error);
    }

    // Remove from user document
    user.profilePicture = {
      url: null,
      public_id: null
    };

    await user.save();

    res.json({
      message: 'Profile picture deleted successfully'
    });
  } catch (error) {
    console.error('Delete profile picture error:', error);
    res.status(500).json({ error: 'Failed to delete profile picture' });
  }
};

// ===================== UPDATE FCM TOKEN =====================
const updateFCMToken = async (req, res) => {
  try {
    const { fcmToken, deviceInfo } = req.body;

    if (!fcmToken) {
      return res.status(400).json({ error: 'FCM token is required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.fcmToken = fcmToken;
    if (deviceInfo) {
      user.deviceInfo = {
        platform: deviceInfo.platform,
        deviceId: deviceInfo.deviceId,
        appVersion: deviceInfo.appVersion
      };
    }

    await user.save();

    res.json({
      message: 'FCM token updated successfully'
    });
  } catch (error) {
    console.error('Update FCM token error:', error);
    res.status(500).json({ error: 'Failed to update FCM token' });
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
  getAddresses,
  uploadProfilePicture,
  deleteProfilePicture,
  updateFCMToken
};
