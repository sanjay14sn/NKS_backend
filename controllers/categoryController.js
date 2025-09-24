const Category = require("../models/Category");
const { cloudinary } = require("../config/cloudinary");
const User = require("../models/User");

// ===================== NOTIFICATION HELPER =====================
const sendNotificationToAllUsers = async (title, message, type, data = {}) => {
  try {
    // TODO: Implement push notification service (FCM, OneSignal, etc.)
    // For now, we'll just log the notification
    console.log(`📱 BROADCAST NOTIFICATION: ${title} - ${message} (Type: ${type})`);
    
    // You can integrate with FCM, OneSignal, or other services here
    // Example structure for future implementation:
    /*
    const users = await User.find({ isActive: true }).select('_id');
    
    for (const user of users) {
      const notification = {
        userId: user._id,
        title,
        message,
        type,
        data,
        timestamp: new Date()
      };
      
      // Send to notification service
      await notificationService.send(notification);
    }
    */
  } catch (error) {
    console.error('Broadcast notification error:', error);
  }
};

// ======================
// Create Category (Admin only)
// ======================
const createCategory = async (req, res) => {
  try {
    const { title, description, slug } = req.body;

    // Generate base slug
    let baseSlug =
      slug ||
      title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, ""); // trim dashes

    let finalSlug = baseSlug;
    let counter = 1;

    // Check if slug already exists → append -1, -2...
    while (await Category.findOne({ slug: finalSlug })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    // Handle image
    let imageData = null;
    if (req.file) {
      imageData = {
        url: req.file.path, // Cloudinary URL
        public_id: req.file.filename, // Cloudinary public_id
      };
    }

    const category = new Category({
      title,
      description,
      slug: finalSlug,
      image: imageData,
    });

    await category.save();

    // Send notification to all users about new category
    await sendNotificationToAllUsers(
      'New Category Added! 🆕',
      `Check out our new category: ${category.title}`,
      'new_category',
      { categoryId: category._id, categoryTitle: category.title, categorySlug: category.slug }
    );

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

// ======================
// Update Category (Admin only)
// ======================
const updateCategory = async (req, res) => {
  try {
    const { title, description, slug, isActive } = req.body;

    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // If a new image is uploaded, delete old image from Cloudinary
    if (req.file) {
      if (category.image && category.image.public_id) {
        await cloudinary.uploader.destroy(category.image.public_id);
      }
      category.image = {
        url: req.file.path,
        public_id: req.file.filename,
      };
    }

    // Update other fields
    category.title = title || category.title;
    category.description = description || category.description;

    if (slug) {
      let baseSlug = slug.toLowerCase();
      let finalSlug = baseSlug;
      let counter = 1;

      while (
        await Category.findOne({ slug: finalSlug, _id: { $ne: category._id } })
      ) {
        finalSlug = `${baseSlug}-${counter++}`;
      }

      category.slug = finalSlug;
    }

    category.isActive =
      typeof isActive !== "undefined" ? isActive : category.isActive;

    await category.save();

    res.json({
      message: "Category updated successfully",
      category,
    });
  } catch (error) {
    console.error("❌ Update category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

// ======================
// Get All Categories
// ======================
const getCategories = async (req, res) => {
  try {
    const { active = "true" } = req.query;
    const filter = active === "true" ? { isActive: true } : {};

    const categories = await Category.find(filter).sort({ title: 1 });

    res.json({
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("❌ Get categories error:", error);
    res.status(500).json({
      error: "Failed to fetch categories",
    });
  }
};

// ======================
// Get Single Category
// ======================
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    res.json({ category });
  } catch (error) {
    console.error("❌ Get category error:", error);
    res.status(500).json({
      error: "Failed to fetch category",
    });
  }
};

// ======================
// Delete Category (Admin only)
// ======================
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    // Delete image from Cloudinary if exists
    if (category.image && category.image.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    res.json({
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("❌ Delete category error:", error);
    res.status(500).json({
      error: "Failed to delete category",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
