const User = require('../models/User');
const Product = require('../models/Product');

// Toggle favorite product
const toggleFavorite = async (req, res) => {
  try {
    const productId = req.params.productId;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        error: 'Product not found'
      });
    }

    const user = await User.findById(userId);
    const isFavorite = user.favorites.includes(productId);

    if (isFavorite) {
      // Remove from favorites
      user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
    } else {
      // Add to favorites
      user.favorites.push(productId);
    }

    await user.save();

    res.json({
      message: isFavorite ? 'Product removed from favorites' : 'Product added to favorites',
      isFavorite: !isFavorite,
      favoritesCount: user.favorites.length
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({
      error: 'Failed to toggle favorite'
    });
  }
};

// Get user favorites
const getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(req.user.id)
      .populate({
        path: 'favorites',
        populate: {
          path: 'category',
          select: 'title slug'
        },
        options: {
          skip,
          limit: limitNum
        }
      });

    const totalFavorites = user.favorites.length;

    res.json({
      favorites: user.favorites,
      pagination: {
        current: pageNum,
        pages: Math.ceil(totalFavorites / limitNum),
        total: totalFavorites,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({
      error: 'Failed to fetch favorites'
    });
  }
};

// Check if product is favorite
const checkFavorite = async (req, res) => {
  try {
    const productId = req.params.productId;
    const user = await User.findById(req.user.id);
    
    const isFavorite = user.favorites.includes(productId);

    res.json({
      isFavorite
    });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({
      error: 'Failed to check favorite status'
    });
  }
};

module.exports = {
  toggleFavorite,
  getFavorites,
  checkFavorite
};