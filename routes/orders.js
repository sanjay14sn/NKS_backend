// routes/orders.js (Fix Applied)
const express = require('express');
const router = express.Router();

const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus
} = require('../controllers/orderController');

const { authenticate, isAdmin, isUser } = require('../middleware/auth');
const { validateOrder, validateObjectId, validatePagination } = require('../middleware/validation');

// User routes
router.post('/', authenticate, isUser, validateOrder, createOrder);
router.get('/my-orders', authenticate, isUser, validatePagination, getUserOrders);

// Shared routes (users can view their own orders, admins can view any)
// 💡 FIX: MUST CALL validateObjectId()
router.get('/:id', authenticate, validateObjectId(), getOrder); 

// Admin only routes
router.get('/', authenticate, isAdmin, validatePagination, getAllOrders);

// 💡 FIX: MUST CALL validateObjectId()
router.put('/:id/status', authenticate, isAdmin, validateObjectId(), updateOrderStatus);

module.exports = router;