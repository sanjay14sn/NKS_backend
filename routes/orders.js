// routes/orders.js (Fix Applied)
const express = require('express');
const router = express.Router();

const {
  createOrder,
  getUserOrders,
  getAllOrders,
  getOrder,
  updateOrderStatus,
  cancelOrder
} = require('../controllers/orderController');

const { authenticate, isAdmin, isUser } = require('../middleware/auth');
const { validateOrder, validateObjectId, validatePagination } = require('../middleware/validation');

// User routes
router.post('/', authenticate, isUser, validateOrder, createOrder);
router.get('/my-orders', authenticate, isUser, validatePagination, getUserOrders);

// Shared routes (users can view their own orders, admins can view any)
router.get('/:id', authenticate, validateObjectId('id'), getOrder); 

// Admin only routes
router.get('/', authenticate, isAdmin, validatePagination, getAllOrders);

router.put('/:id/status', authenticate, isAdmin, validateObjectId('id'), updateOrderStatus);

// User cancel order route
router.put('/:id/cancel', authenticate, isUser, validateObjectId('id'), cancelOrder);
module.exports = router;