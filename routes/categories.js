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
const { upload } = require("../config/cloudinary");

// Public routes
router.get("/", getCategories);
router.get("/:id", validateObjectId, getCategory);

// Admin routes with image upload
router.post("/", authenticate, isAdmin, upload.single("image"), validateCategory, createCategory);
router.put("/:id", authenticate, isAdmin, upload.single("image"), validateObjectId, validateCategory, updateCategory);
router.delete("/:id", authenticate, isAdmin, validateObjectId, deleteCategory);

module.exports = router;
