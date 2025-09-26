// routes/favorites.js
const express = require('express');
const router = express.Router();

const {
  toggleFavorite,
  getFavorites,
  checkFavorite
} = require('../controllers/favoriteController');

const { authenticate, isUser } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// ✅ Fix: Wrapper to decode + trim productId before validation
const cleanObjectId = (req, res, next) => {
  if (req.params.productId) {
    req.params.productId = decodeURIComponent(req.params.productId).trim();
  }
  next();
};

// Protect all routes
router.use(authenticate);
router.use(isUser);

// Only routes with :productId should use validateObjectId
router.post('/toggle/:productId', validateObjectId, toggleFavorite);
router.get('/:productId', validateObjectId, checkFavorite);

// No productId in this one, so don't apply it
router.get('/', validatePagination, getFavorites);


module.exports = router;
