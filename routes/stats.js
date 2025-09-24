const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getUserStats,
  getOrderStats,
  getProductStats
} = require('../controllers/statsController');

const { authenticate, isAdmin } = require('../middleware/auth');

// All stats routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

/**
 * @route   GET /api/stats/dashboard
 * @desc    Get comprehensive dashboard statistics
 * @access  Private/Admin
 */
router.get('/dashboard', getDashboardStats);

/**
 * @route   GET /api/stats/users
 * @desc    Get detailed user statistics
 * @access  Private/Admin
 */
router.get('/users', getUserStats);

/**
 * @route   GET /api/stats/orders
 * @desc    Get detailed order statistics
 * @access  Private/Admin
 */
router.get('/orders', getOrderStats);

/**
 * @route   GET /api/stats/products
 * @desc    Get detailed product statistics
 * @access  Private/Admin
 */
router.get('/products', getProductStats);

module.exports = router;