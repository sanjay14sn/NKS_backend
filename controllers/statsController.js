const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Order = require('../models/Order');

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    // Execute all count queries in parallel for better performance
    const [
      totalUsers,
      totalShopOwners,
      totalCategories,
      totalProducts,
      totalOrders,
      ordersThisMonth
    ] = await Promise.all([
      User.countDocuments({ isActive: true }),
      User.countDocuments({ role: 'shopowner', isActive: true }),
      Category.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Order.countDocuments({
        createdAt: {
          $gte: startOfMonth,
          $lte: endOfMonth
        }
      })
    ]);

    // Additional useful stats
    const [
      totalElectricians,
      totalAdmins,
      activeProducts,
      inactiveProducts,
      pendingOrders,
      completedOrders
    ] = await Promise.all([
      User.countDocuments({ role: 'electrician', isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ isActive: false }),
      Order.countDocuments({ status: { $in: ['placed', 'processing'] } }),
      Order.countDocuments({ status: 'delivered' })
    ]);

    const stats = {
      users: {
        total: totalUsers,
        shopOwners: totalShopOwners,
        electricians: totalElectricians,
        admins: totalAdmins
      },
      categories: {
        total: totalCategories
      },
      products: {
        total: totalProducts,
        active: activeProducts,
        inactive: inactiveProducts
      },
      orders: {
        total: totalOrders,
        thisMonth: ordersThisMonth,
        pending: pendingOrders,
        completed: completedOrders
      },
      period: {
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear()
      }
    };

    res.json({
      message: 'Dashboard statistics retrieved successfully',
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve dashboard statistics'
    });
  }
};

// Get user statistics breakdown
const getUserStats = async (req, res) => {
  try {
    const userStats = await User.aggregate([
      {
        $match: { isActive: true }
      },
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const totalActiveUsers = await User.countDocuments({ isActive: true });
    const totalInactiveUsers = await User.countDocuments({ isActive: false });

    res.json({
      message: 'User statistics retrieved successfully',
      stats: {
        byRole: userStats,
        total: {
          active: totalActiveUsers,
          inactive: totalInactiveUsers,
          all: totalActiveUsers + totalInactiveUsers
        }
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user statistics'
    });
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      ordersByStatus,
      ordersThisMonth,
      ordersLastMonth,
      totalRevenue,
      revenueThisMonth
    ] = await Promise.all([
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$total' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),
      Order.countDocuments({
        createdAt: { $gte: startOfMonth }
      }),
      Order.countDocuments({
        createdAt: {
          $gte: startOfLastMonth,
          $lte: endOfLastMonth
        }
      }),
      Order.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ]),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfMonth }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$total' }
          }
        }
      ])
    ]);

    res.json({
      message: 'Order statistics retrieved successfully',
      stats: {
        byStatus: ordersByStatus,
        monthly: {
          current: ordersThisMonth,
          previous: ordersLastMonth,
          growth: ordersLastMonth > 0 ? ((ordersThisMonth - ordersLastMonth) / ordersLastMonth * 100).toFixed(2) : 0
        },
        revenue: {
          total: totalRevenue[0]?.total || 0,
          thisMonth: revenueThisMonth[0]?.total || 0
        }
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve order statistics'
    });
  }
};

// Get product statistics
const getProductStats = async (req, res) => {
  try {
    const [
      productsByCategory,
      totalProducts,
      activeProducts,
      lowStockProducts,
      topRatedProducts
    ] = await Promise.all([
      Product.aggregate([
        {
          $lookup: {
            from: 'categories',
            localField: 'category',
            foreignField: '_id',
            as: 'categoryInfo'
          }
        },
        {
          $unwind: '$categoryInfo'
        },
        {
          $group: {
            _id: '$categoryInfo.title',
            count: { $sum: 1 },
            averagePrice: { $avg: '$price' }
          }
        },
        {
          $sort: { count: -1 }
        }
      ]),
      Product.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Product.countDocuments({ stock: { $lt: 10 }, isActive: true }),
      Product.find({ isActive: true })
        .sort({ rating: -1 })
        .limit(5)
        .select('title rating ratingCount price')
        .populate('category', 'title')
    ]);

    res.json({
      message: 'Product statistics retrieved successfully',
      stats: {
        total: totalProducts,
        active: activeProducts,
        inactive: totalProducts - activeProducts,
        lowStock: lowStockProducts,
        byCategory: productsByCategory,
        topRated: topRatedProducts
      }
    });
  } catch (error) {
    console.error('Get product stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve product statistics'
    });
  }
};

module.exports = {
  getDashboardStats,
  getUserStats,
  getOrderStats,
  getProductStats
};