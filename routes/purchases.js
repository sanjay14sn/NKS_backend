const express = require('express');
const router = express.Router();

const {
  recordPurchase,
  getAllPurchases,
  getShopPurchases,
  getMyPurchases,
  getPurchaseAnalytics
} = require('../controllers/purchaseController');

const { authenticate, isAdmin, isUser } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// User routes (can be used without authentication for anonymous purchases)
router.post('/', recordPurchase);
router.get('/my-purchases', authenticate, isUser, validatePagination, getMyPurchases);

// Shop-specific purchases (shop owners can view their shop's purchases)
router.get('/shop/:shopId', authenticate, validateObjectId, validatePagination, getShopPurchases);

// Admin routes
router.get('/', authenticate, isAdmin, validatePagination, getAllPurchases);
router.get('/analytics', authenticate, isAdmin, getPurchaseAnalytics);

module.exports = router;