const express = require('express');
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require('../controllers/categoryController');

const { authenticate, isAdmin } = require('../middleware/auth');
const { validateCategory, validateObjectId } = require('../middleware/validation');

// Public routes
router.get('/', getCategories);
router.get('/:id', validateObjectId, getCategory);

// Admin only routes
router.post('/', authenticate, isAdmin, validateCategory, createCategory);
router.put('/:id', authenticate, isAdmin, validateObjectId, validateCategory, updateCategory);
router.delete('/:id', authenticate, isAdmin, validateObjectId, deleteCategory);

module.exports = router;