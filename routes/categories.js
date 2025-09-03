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
const { validateCategory, validateObjectId } = require("../middleware/validation");

// Import the correct Cloudinary upload middleware
const { uploadCategory } = require("../config/cloudinary");

// =====================
// Public routes
// =====================
router.get("/", getCategories);
router.get("/:id", validateObjectId, getCategory);

// =====================
// Admin routes with image upload
// =====================
router.post(
  "/",
  authenticate,
  isAdmin,
  uploadCategory.single("image"),
  validateCategory,
  createCategory
);

router.put(
  "/:id",
  authenticate,
  isAdmin,
  uploadCategory.single("image"),
  validateObjectId,
  validateCategory,
  updateCategory
);

router.delete(
  "/:id",
  authenticate,
  isAdmin,
  validateObjectId,
  deleteCategory
);

module.exports = router;
