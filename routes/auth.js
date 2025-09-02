const express = require('express');
const router = express.Router();

// Controllers
const {
  signupUser,
  signupShopOwner,
  login,
  getProfile,
  getAllUsers,
} = require('../controllers/authController');

// Middlewares
const { authenticate, isAdmin } = require('../middleware/auth');
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

module.exports = router;
