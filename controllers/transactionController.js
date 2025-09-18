const Transaction = require('../models/Transaction');
const Shop = require('../models/Shop');

// Simulate QR scan transaction (Demo version)
const simulateQRScan = async (req, res) => {
  try {
    const { 
      shopId, 
      shopCode, 
      paymentMethod = 'demo',
      customerInfo = {},
      userAgent,
      ipAddress 
    } = req.body;

    // Find shop by ID or shop code
    let shop;
    if (shopId) {
      shop = await Shop.findById(shopId);
    } else if (shopCode) {
      shop = await Shop.findOne({ 'paymentQR.shopCode': shopCode });
    } else {
      return res.status(400).json({ 
        error: 'Either shopId or shopCode is required' 
      });
    }

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (!shop.isActive) {
      return res.status(400).json({ error: 'Shop is not active' });
    }

    // Create demo transaction
    const transaction = new Transaction({
      shop: shop._id,
      shopCode: shop.paymentQR.shopCode,
      transactionAmount: shop.demoTransactionAmount,
      transactionType: 'demo_qr_scan',
      paymentMethod: paymentMethod,
      status: 'simulated',
      customerInfo: {
        name: customerInfo.name || 'Demo Customer',
        phone: customerInfo.phone || null,
        upiId: customerInfo.upiId || null
      },
      metadata: {
        scannedAt: new Date(),
        userAgent: userAgent || req.get('User-Agent'),
        ipAddress: ipAddress || req.ip,
        qrId: shop.paymentQR.qrId
      },
      notes: `Demo QR scan transaction for ₹${shop.demoTransactionAmount}`
    });

    await transaction.save();

    // Update shop revenue
    await shop.addPurchase(shop.demoTransactionAmount);

    res.status(201).json({
      message: 'QR scan simulated successfully',
      transaction: {
        id: transaction._id,
        transactionId: transaction.transactionId,
        amount: transaction.transactionAmount,
        shop: {
          id: shop._id,
          name: shop.shopName,
          gstNumber: shop.gstNumber,
          mobileNumber: shop.mobileNumber
        },
        status: transaction.status,
        timestamp: transaction.createdAt
      }
    });
  } catch (error) {
    console.error('Simulate QR scan error:', error);
    res.status(500).json({ error: 'Failed to simulate QR scan' });
  }
};

// Get all transactions (Admin only)
const getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, shopId, status, startDate, endDate } = req.query;

    const filter = {};
    if (shopId) filter.shop = shopId;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const transactions = await Transaction.find(filter)
      .populate('shop', 'shopName gstNumber mobileNumber')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
};

// Get shop transactions (Shop owner can view their shop's transactions)
const getShopTransactions = async (req, res) => {
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

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get shop transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch shop transactions' });
  }
};

// Get transaction analytics (Admin only)
const getTransactionAnalytics = async (req, res) => {
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

    // Total transactions and revenue
    const totalStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: '$transactionAmount' },
          totalTransactions: { $sum: 1 }
        } 
      }
    ]);

    // Shop-wise analytics
    const shopStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      { 
        $group: { 
          _id: '$shop',
          revenue: { $sum: '$transactionAmount' },
          transactions: { $sum: 1 }
        } 
      },
      { $lookup: { from: 'shops', localField: '_id', foreignField: '_id', as: 'shop' } },
      { $unwind: '$shop' },
      { $sort: { revenue: -1 } },
      { $limit: 10 }
    ]);

    // Daily trend
    const dailyTrend = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$transactionAmount' },
          transactions: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Payment method breakdown
    const paymentMethodStats = await Transaction.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          revenue: { $sum: '$transactionAmount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      period,
      totalStats: totalStats[0] || { totalRevenue: 0, totalTransactions: 0 },
      shopStats,
      dailyTrend,
      paymentMethodStats
    });
  } catch (error) {
    console.error('Get transaction analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};

// Get single transaction details
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('shop', 'shopName gstNumber mobileNumber ownerName');

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check permissions - admin can view all, shop owners can only view their own
    if (req.user.role !== 'admin') {
      const shop = await Shop.findById(transaction.shop._id);
      if (!shop.shopOwner || shop.shopOwner.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ transaction });
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
};

module.exports = {
  simulateQRScan,
  getAllTransactions,
  getShopTransactions,
  getTransactionAnalytics,
  getTransaction
};