const Product = require('../models/Product');
const Category = require('../models/Category');

// Create product (Admin/ShopOwner only)
const createProduct = async (req, res) => {
  try {
    const { title, description, aboutProduct, price, retailerPrice, stock, category } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({
        error: 'Invalid category ID'
      });
    }

    // Handle uploaded images
    const images = req.files ? req.files.map(file => `/uploads/${file.filename}`) : [];

  const product = new Product({
  title,
  description,
  aboutProduct,
  price: parseFloat(price),
  retailerPrice: parseFloat(retailerPrice),
  stock: parseInt(stock),
  category,
  images,
  createdBy: req.user.id
});

    await product.save();

    // Populate category info
    await product.populate('category', 'title slug');

    res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      error: 'Failed to create product'
    });
  }
};

// Get all products with filtering, search, and pagination
const getProducts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      search,
      minPrice,
      maxPrice,
      sort = '-createdAt',
      active = 'true'
    } = req.query;

    // Build filter object
    const filter = {};
    
    if (active === 'true') {
      filter.isActive = true;
    }
    
    if (category) {
      filter.category = category;
    }
    
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseFloat(minPrice);
      if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
    }
    
    if (search) {
      filter.$text = { $search: search };
    }

    // Calculate pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const products = await Product.find(filter)
      .populate('category', 'title slug')
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Get total count for pagination
    const total = await Product.countDocuments(filter);

    res.json({
      products,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      error: 'Failed to fetch products'
    });
  }
};

// Get single product
const getProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'title slug description');
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      error: 'Failed to fetch product'
    });
  }
};

// Update product (Admin/ShopOwner only)
const updateProduct = async (req, res) => {
  try {
    const { title, description, aboutProduct, price, stock, category, isActive } = req.body;
    
    // Verify category exists if provided
    if (category) {
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          error: 'Invalid category ID'
        });
      }
    }

    // Handle uploaded images
   let updateData = {
  title,
  description,
  aboutProduct,
  price: price ? parseFloat(price) : undefined,
  retailerPrice: retailerPrice ? parseFloat(retailerPrice) : undefined,
  stock: stock !== undefined ? parseInt(stock) : undefined,
  category,
  isActive
};


    // Remove undefined values
    Object.keys(updateData).forEach(key => 
      updateData[key] === undefined && delete updateData[key]
    );

    // Add new images if uploaded
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => `/uploads/${file.filename}`);
      const product = await Product.findById(req.params.id);
      updateData.images = [...(product.images || []), ...newImages];
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('category', 'title slug');

    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      error: 'Failed to update product'
    });
  }
};

// Delete product (Admin only)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    res.json({
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      error: 'Failed to delete product'
    });
  }
};

// Rate product
const rateProduct = async (req, res) => {
  try {
    const { rating } = req.body;
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        error: 'Rating must be between 1 and 5'
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    await product.updateRating(rating);

    res.json({
      message: 'Product rated successfully',
      rating: product.rating,
      ratingCount: product.ratingCount
    });
  } catch (error) {
    console.error('Rate product error:', error);
    res.status(500).json({
      error: 'Failed to rate product'
    });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProduct,
  updateProduct,
  deleteProduct,
  rateProduct
};