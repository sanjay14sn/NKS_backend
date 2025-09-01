const express = require('express');
const router = express.Router();

const {
  toggleFavorite,
  getFavorites,
  checkFavorite
} = require('../controllers/favoriteController');

const { authenticate, isUser } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// All routes require authentication
router.use(authenticate);
router.use(isUser);

// Toggle favorite
router.post('/toggle/:productId', validateObjectId, toggleFavorite);

// Get user favorites
router.get('/', validatePagination, getFavorites);

// Check if product is favorite
router.get('/:productId', validateObjectId, checkFavorite);

module.exports = router;