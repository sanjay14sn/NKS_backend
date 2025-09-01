const express = require('express');
const router = express.Router();

const {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  rateProduct
} = require('../controllers/productController');

const { authenticate, isAdmin, isShopOwner, isUser } = require('../middleware/auth');
const { validateProduct, validateObjectId, validatePagination } = require('../middleware/validation');
const upload = require('../config/multer');

// Public routes
router.get('/', validatePagination, getProducts);
router.get('/:id', validateObjectId, getProduct);

// User routes
router.post('/:id/rate', authenticate, isUser, validateObjectId, rateProduct);

// Shop owner/Admin routes
router.post('/', authenticate, isShopOwner, upload.array('images', 5), validateProduct, createProduct);
router.put('/:id', authenticate, isShopOwner, validateObjectId, upload.array('images', 5), updateProduct);

// Admin only routes
router.delete('/:id', authenticate, isAdmin, validateObjectId, deleteProduct);

module.exports = router;