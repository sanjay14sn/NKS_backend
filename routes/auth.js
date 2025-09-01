const express = require('express');
const router = express.Router();

const { signupUser, signupShopOwner, login, getProfile } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { validateUserSignup, validateShopOwnerSignup, validateLogin } = require('../middleware/validation');

// User signup
router.post('/signup/user', validateUserSignup, signupUser);

// ShopOwner/Electrician signup
router.post('/signup/shopowner', validateShopOwnerSignup, signupShopOwner);

// Login
router.post('/login', validateLogin, login);

// Get current user profile
router.get('/profile', authenticate, getProfile);

module.exports = router;