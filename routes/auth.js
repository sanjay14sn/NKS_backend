const express = require('express');
const router = express.Router();

// Controllers
const {
  signupUser,
  signupShopOwner,
  login,
  getProfile,
  getAllUsers,
  addAddress,
  updateAddress,
  deleteAddress,
  getAddresses,
  uploadProfilePicture,
  deleteProfilePicture
} = require('../controllers/authController');

// Middlewares
const { authenticate, isAdmin } = require('../middleware/auth');
const { uploadProfilePicture: uploadProfilePic } = require('../config/cloudinary');
const {
  validateUserSignup,
  validateShopOwnerSignup,
  validateLogin,
} = require('../middleware/validation');

/**
 * @route   GET /api/auth/users
 * @desc    Get all users (Admin only)
 * @access  Private/Admin
 */
router.get('/users', authenticate, isAdmin, getAllUsers);

/**
 * @route   POST /api/auth/signup/user
 * @desc    Register a normal user
 * @access  Public
 */
router.post('/signup/user', validateUserSignup, signupUser);

/**
 * @route   POST /api/auth/signup/shopowner
 * @desc    Register shopowner or electrician
 * @access  Public
 */
router.post('/signup/shopowner', validateShopOwnerSignup, signupShopOwner);

/**
 * @route   POST /api/auth/login
 * @desc    Login user (phone/email + password)
 * @access  Public
 */
router.post('/login', validateLogin, login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get logged-in user profile
 * @access  Private
 */
router.get('/profile', authenticate, getProfile);

/**
 * ==================== ADDRESS ROUTES ====================
 */

/**
 * @route   POST /api/auth/address
 * @desc    Add a new address
 * @access  Private
 */
router.post('/address', authenticate, addAddress);

/**
 * @route   GET /api/auth/address
 * @desc    Get all addresses of logged-in user
 * @access  Private
 */
router.get('/address', authenticate, getAddresses);

/**
 * @route   PUT /api/auth/address/:addressId
 * @desc    Update address by ID
 * @access  Private
 */
router.put('/address/:addressId', authenticate, updateAddress);

/**
 * @route   DELETE /api/auth/address/:addressId
 * @desc    Delete address by ID
 * @access  Private
 */
router.delete('/address/:addressId', authenticate, deleteAddress);

/**
 * ==================== PROFILE PICTURE ROUTES ====================
 */

/**
 * @route   PUT /api/auth/profile/picture
 * @desc    Upload/Update profile picture
 * @access  Private
 */
router.put('/profile/picture', authenticate, uploadProfilePic.single('profilePicture'), uploadProfilePicture);

/**
 * @route   DELETE /api/auth/profile/picture
 * @desc    Delete profile picture
 * @access  Private
 */
router.delete('/profile/picture', authenticate, deleteProfilePicture);

module.exports = router;
