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

// Note: The cleanObjectId middleware is redundant if validateObjectId handles decoding/trimming.
// However, since validateObjectId doesn't *currently* use the parameter name correctly, 
// let's adjust how validateObjectId is used.

// Protect all routes
router.use(authenticate);
router.use(isUser);

// Only routes with :productId should use validateObjectId
// 💡 FIX: Pass the parameter name 'productId' to validateObjectId
router.post('/toggle/:productId', validateObjectId('productId'), toggleFavorite);
router.get('/:productId', validateObjectId('productId'), checkFavorite);

// No productId in this one, so don't apply it
router.get('/', validatePagination, getFavorites);


module.exports = router;