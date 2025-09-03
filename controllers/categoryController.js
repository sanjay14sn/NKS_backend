const Category = require('../models/Category');

// Create category (Admin only)
// Create category (Admin only)
const createCategory = async (req, res) => {
  try {
    const { title, description, slug } = req.body;

    const category = new Category({
      title,
      description,
      slug,
      image: req.file ? req.file.path : null
    });

    await category.save();

    res.status(201).json({
      message: "Category created successfully",
      category
    });
  } catch (error) {
    console.error("Create category error:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

// Update category (Admin only)
const updateCategory = async (req, res) => {
  try {
    const { title, description, slug, isActive } = req.body;

    const updateData = { title, description, slug, isActive };
    if (req.file) updateData.image = req.file.path;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    res.json({ message: "Category updated successfully", category });
  } catch (error) {
    console.error("Update category error:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};


// Get all categories
const getCategories = async (req, res) => {
  try {
    const { active = 'true' } = req.query;
    
    const filter = active === 'true' ? { isActive: true } : {};
    const categories = await Category.find(filter).sort({ title: 1 });

    res.json({
      categories,
      count: categories.length
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      error: 'Failed to fetch categories'
    });
  }
};

// Get single category
const getCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.json({ category });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      error: 'Failed to fetch category'
    });
  }
};

// Update category (Admin only)
// Delete category (Admin only)
const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    
    if (!category) {
      return res.status(404).json({
        error: 'Category not found'
      });
    }

    res.json({
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      error: 'Failed to delete category'
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  deleteCategory
};