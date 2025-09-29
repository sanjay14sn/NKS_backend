// routes/categories.js
const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
} = require("../controllers/categoryController");

const { authenticate, isAdmin } = require("../middleware/auth");
const { validateCreateCategory, validateUpdateCategory, validateObjectId } = require("../middleware/validation");

// Import the correct Cloudinary upload middleware
const { uploadCategory } = require("../config/cloudinary");

// =====================
// Public routes
// =====================
router.get("/", getCategories);
router.get("/:id", validateObjectId('id'), getCategory);

// =====================
// Admin routes with image upload
// =====================
router.post(
  "/",
  authenticate,
  isAdmin,
  uploadCategory.single("image"),
  validateCreateCategory,
  createCategory
);

router.put(
  "/:id",
  authenticate,
  isAdmin,
  uploadCategory.single("image"),
  validateObjectId('id'),
  validateUpdateCategory,
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  isAdmin,
  validateObjectId('id'),
  deleteCategory
);

module.exports = router;
