const express = require('express');
const router = express.Router();

const {
  simulateQRScan,
  getAllTransactions,
  getShopTransactions,
  getTransactionAnalytics,
  getTransaction
} = require('../controllers/transactionController');

const { authenticate, isAdmin } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// Public routes (for QR scanning simulation)
router.post('/simulate-qr-scan', simulateQRScan);

// Shop-specific transactions (shop owners can view their shop's transactions)
router.get('/shop/:shopId', authenticate, validateObjectId, validatePagination, getShopTransactions);

// Transaction details
router.get('/:id', authenticate, validateObjectId, getTransaction);

// Admin routes
router.get('/', authenticate, isAdmin, validatePagination, getAllTransactions);
router.get('/analytics', authenticate, isAdmin, getTransactionAnalytics);

module.exports = router;