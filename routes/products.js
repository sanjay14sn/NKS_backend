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

// ================= PUBLIC ROUTES =================

// Get all products (with pagination)
router.get('/', validatePagination, getProducts);

// Products by Category (⚡ placed before /:id)
router.get('/category/:categoryId', validateObjectId, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const {
      page = 1,
      limit = 10,
      search,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      active = 'true'
    } = req.query;

    const filter = { category: categoryId };

    if (active === 'true') filter.isActive = true;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    if (search) filter.$text = { $search: search };

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate('category', 'title slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      },
      category: products.length > 0 ? products[0].category : null
    });
  } catch (error) {
    console.error('❌ Get products by category error:', error);
    res.status(500).json({ error: 'Failed to fetch products by category' });
  }
});

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

// Global Search for Products
router.get('/search/global', async (req, res) => {
  try {
    const {
      q: searchQuery,
      page = 1,
      limit = 20,
      category,
      minPrice,
      maxPrice,
      sort = '-createdAt'
    } = req.query;

    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const filter = {
      isActive: true,
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } },
        { aboutProduct: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    if (category) filter.category = category;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const products = await Product.find(filter)
      .populate('category', 'title slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    const total = await Product.countDocuments(filter);

    res.json({
      products,
      searchQuery,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('❌ Global search error:', error);
    res.status(500).json({ error: 'Failed to perform global search' });
  }
});

// Single Product (⚡ must come AFTER category/search/filters)
router.get('/:id', validateObjectId, getProduct);

// ================= USER ROUTES =================
router.post('/:id/rate', authenticate, isUser, validateObjectId, rateProduct);

// ================= SHOP OWNER / ADMIN ROUTES =================
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

router.delete('/:id', authenticate, isAdmin, validateObjectId, deleteProduct);

module.exports = router;
