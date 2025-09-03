const Category = require('../models/Category');
const { cloudinary } = require('../config/cloudinary');

// ======================
// Create Category (Admin only)
// ======================
const createCategory = async (req, res) => {
  try {
    const { title, description, slug } = req.body;

    let imageData = null;
    if (req.file) {
      imageData = {
        url: req.file.path,        // Cloudinary secure_url
        public_id: req.file.filename, // Cloudinary public_id
      };
    }

    const category = new Category({
      title,
      description,
      slug,
      image: imageData,
    });

    await category.save();

    res.status(201).json({
      message: 'Category created successfully',
      category,
    });
  } catch (error) {
    console.error('❌ Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
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
      return res.status(404).json({ error: 'Category not found' });
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
    category.slug = slug || category.slug;
    category.isActive =
      typeof isActive !== 'undefined' ? isActive : category.isActive;

    await category.save();

    res.json({
      message: 'Category updated successfully',
      category,
    });
  } catch (error) {
    console.error('❌ Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
};

// ======================
// Get All Categories
// ======================
const getCategories = async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    const filter = active === 'true' ? { isActive: true } : {};

    const categories = await Category.find(filter).sort({ title: 1 });

    res.json({
      categories,
      count: categories.length,
    });
  } catch (error) {
    console.error('❌ Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories',
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
        error: 'Category not found',
      });
    }

    res.json({ category });
  } catch (error) {
    console.error('❌ Get category error:', error);
    res.status(500).json({
      error: 'Failed to fetch category',
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
      return res.status(404).json({ error: 'Category not found' });
    }

    // Delete image from Cloudinary if exists
    if (category.image && category.image.public_id) {
      await cloudinary.uploader.destroy(category.image.public_id);
    }

    res.json({
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('❌ Delete category error:', error);
    res.status(500).json({
      error: 'Failed to delete category',
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
