const express = require('express');
const router = express.Router();

const {
  toggleFavorite,
  getFavorites,
  checkFavorite
} = require('../controllers/favoriteController');

const { authenticate, isUser } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// Protect all routes
router.use(authenticate);
router.use(isUser);

// Routes
router.post('/toggle/:productId', validateObjectId, toggleFavorite);
router.get('/', validatePagination, getFavorites);
router.get('/:productId', validateObjectId, checkFavorite);

module.exports = router;
