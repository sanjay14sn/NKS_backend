const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

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
const { uploadProduct } = require('../config/cloudinary');

// Public routes
router.get('/', validatePagination, getProducts);
router.get('/:id', validateObjectId, getProduct);

// Featured Products
router.get('/filters/featured', async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'title slug')
      .sort('-createdAt')
      .limit(20);
    res.json({ products, count: products.length });
  } catch (error) {
    console.error('❌ Get featured products error:', error);
    res.status(500).json({ error: 'Failed to fetch featured products' });
  }
});

// Trending Products
router.get('/filters/trending', async (req, res) => {
  try {
    const products = await Product.find({ isTrending: true, isActive: true })
      .populate('category', 'title slug')
      .sort('-createdAt')
      .limit(20);
    res.json({ products, count: products.length });
  } catch (error) {
    console.error('❌ Get trending products error:', error);
    res.status(500).json({ error: 'Failed to fetch trending products' });
  }
});

// User routes
router.post('/:id/rate', authenticate, isUser, validateObjectId, rateProduct);

// Shop owner/Admin routes
router.post(
  '/',
  authenticate,
  isShopOwner,
  uploadProduct.array('images', 5), // Cloudinary upload
  validateProduct,
  createProduct
);

router.put(
  '/:id',
  authenticate,
  isShopOwner,
  validateObjectId,
  uploadProduct.array('images', 5),
  updateProduct
);

// Admin only routes
router.delete('/:id', authenticate, isAdmin, validateObjectId, deleteProduct);

module.exports = router;
