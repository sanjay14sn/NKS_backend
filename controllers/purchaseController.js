const Purchase = require('../models/Purchase');
const Shop = require('../models/Shop');
const Product = require('../models/Product');

// Record purchase via QR scan
const recordPurchase = async (req, res) => {
  try {
    const { 
      shopId, 
      purchaseAmount, 
      products = [], 
      paymentMethod = 'qr',
      customerInfo,
      notes 
    } = req.body;

    // Validate shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (!shop.isActive) {
      return res.status(400).json({ error: 'Shop is not active' });
    }

    // Validate products if provided
    let processedProducts = [];
    let calculatedAmount = 0;

    if (products.length > 0) {
      for (const item of products) {
        const product = await Product.findById(item.product);
        if (!product) {
          return res.status(400).json({ 
            error: `Product not found: ${item.product}` 
          });
        }

        const quantity = item.quantity || 1;
        const itemTotal = product.price * quantity;
        calculatedAmount += itemTotal;

        processedProducts.push({
          product: product._id,
          quantity: quantity,
          price: product.price
        });

        // Update product stock if needed
        if (product.stock >= quantity) {
          product.stock -= quantity;
          await product.save();
        }
      }

      // Use calculated amount if products are provided
      if (calculatedAmount > 0) {
        purchaseAmount = calculatedAmount;
      }
    }

    // Create purchase record
    const purchase = new Purchase({
      shop: shopId,
      customer: req.user ? req.user.id : null,
      purchaseAmount: parseFloat(purchaseAmount),
      products: processedProducts,
      paymentMethod,
      customerInfo: customerInfo || (req.user ? {
        name: req.user.name,
        phone: req.user.phone,
        email: req.user.email
      } : {}),
      notes
    });

    await purchase.save();

    // Update shop revenue and purchase count
    await shop.addPurchase(parseFloat(purchaseAmount));

    // Populate purchase data
    await purchase.populate([
      { path: 'shop', select: 'shopName ownerName' },
      { path: 'customer', select: 'name phone' },
      { path: 'products.product', select: 'title price' }
    ]);

    res.status(201).json({
      message: 'Purchase recorded successfully',
      purchase
    });
  } catch (error) {
    console.error('Record purchase error:', error);
    res.status(500).json({ error: 'Failed to record purchase' });
  }
};

// Get all purchases (Admin only)
const getAllPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 10, shopId, customerId, startDate, endDate } = req.query;

    const filter = {};
    if (shopId) filter.shop = shopId;
    if (customerId) filter.customer = customerId;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const purchases = await Purchase.find(filter)
      .populate('shop', 'shopName ownerName')
      .populate('customer', 'name phone')
      .populate('products.product', 'title price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Purchase.countDocuments(filter);

    res.json({
      purchases,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get all purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
};

// Get shop purchases (Shop owner can view their shop's purchases)
const getShopPurchases = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { page = 1, limit = 10, startDate, endDate } = req.query;

    // Verify shop exists and user has permission
    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (req.user.role !== 'admin' && 
        (!shop.shopOwner || shop.shopOwner.toString() !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const filter = { shop: shopId };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const purchases = await Purchase.find(filter)
      .populate('customer', 'name phone')
      .populate('products.product', 'title price')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Purchase.countDocuments(filter);

    res.json({
      purchases,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get shop purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch shop purchases' });
  }
};

// Get customer purchases (User can view their own purchases)
const getMyPurchases = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const purchases = await Purchase.find({ customer: req.user.id })
      .populate('shop', 'shopName ownerName address')
      .populate('products.product', 'title price images')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Purchase.countDocuments({ customer: req.user.id });

    res.json({
      purchases,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get my purchases error:', error);
    res.status(500).json({ error: 'Failed to fetch purchases' });
  }
};

// Get purchase analytics (Admin only)
const getPurchaseAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;

    let startDate;
    const endDate = new Date();

    switch (period) {
      case 'day':
        startDate = new Date();
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date();
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
    }

    // Total purchases and revenue
    const totalStats = await Purchase.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$purchaseAmount' },
          totalPurchases: { $sum: 1 }
        } 
      }
    ]);

    // Shop-wise analytics
    const shopStats = await Purchase.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { 
        $group: { 
          _id: '$shop',
          revenue: { $sum: '$purchaseAmount' },
          purchases: { $sum: 1 }
        } 
      },
      { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shop' } },
      { $unwind: '$shop' },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Daily trend
    const dailyTrend = await Purchase.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$purchaseAmount' },
          purchases: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      period,
      totalStats: totalStats[0] || { totalRevenue: 0, totalPurchases: 0 },
      shopStats,
      dailyTrend
    });
  } catch (error) {
    console.error('Get purchase analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

module.exports = {
  recordPurchase,
  getAllPurchases,
  getShopPurchases,
  getMyPurchases,
  getPurchaseAnalytics
};