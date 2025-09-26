const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Toggle favorite product for authenticated user
 */
const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    // Find user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Toggle favorite
    const isFavorite = user.favorites.some(fav => fav.toString() === productId);
    if (isFavorite) {
      user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
    } else {
      user.favorites.push(productId);
    }

    await user.save();

    res.json({
      message: isFavorite
        ? 'Product removed from favorites'
        : 'Product added to favorites',
      isFavorite: !isFavorite,
      favoritesCount: user.favorites.length,
    });
  } catch (error) {
    console.error('Toggle favorite error:', error);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
};

/**
 * Get user favorites with optional pagination
 */
const getFavorites = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(parseInt(page), 1);
    const limitNum = Math.max(parseInt(limit), 1);
    const skip = (pageNum - 1) * limitNum;

    const user = await User.findById(req.user.id).populate({
      path: 'favorites',
      populate: { path: 'category', select: 'title slug' },
      options: { skip, limit: limitNum },
    });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      favorites: user.favorites,
      pagination: {
        current: pageNum,
        pages: Math.ceil(user.favorites.length / limitNum),
        total: user.favorites.length,
        limit: limitNum,
      },
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Failed to fetch favorites' });
  }
};

/**
 * Check if a product is favorited by the user
 */
const checkFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isFavorite = user.favorites.some(fav => fav.toString() === productId);
    res.json({ isFavorite });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Failed to check favorite status' });
  }
};

module.exports = {
  toggleFavorite,
  getFavorites,
  checkFavorite,
};
