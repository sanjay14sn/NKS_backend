const User = require('../models/User');
const Product = require('../models/Product');

/**
 * Toggle favorite product for authenticated user
 */
const toggleFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    // Ensure product exists
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ error: 'Product not found' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const index = user.favorites.findIndex(fav => fav.toString() === productId);

    if (index > -1) {
      // remove
      user.favorites.splice(index, 1);
    } else {
      // add
      user.favorites.push(productId);
    }

    await user.save();

    res.json({
      message: index > -1 ? 'Removed from favorites' : 'Added to favorites',
      isFavorite: index === -1,
      favoritesCount: user.favorites.length
    });
  } catch (error) {
    console.error('Toggle favorite error:', error.message);
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

    const user = await User.findById(req.user.id)
      .slice('favorites', [skip, limitNum])
      .populate({
        path: 'favorites',
        populate: { path: 'category', select: 'title slug' }
      });

    if (!user) return res.status(404).json({ error: 'User not found' });

    const totalFavorites = await User.aggregate([
      { $match: { _id: user._id } },
      { $project: { count: { $size: "$favorites" } } }
    ]);

    const total = totalFavorites[0]?.count || 0;

    res.json({
      favorites: user.favorites,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get favorites error:', error.message);
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
