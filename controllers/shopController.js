const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');
const Shop = require('../models/Shop');
const User = require('../models/User');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');

// Generate QR code for shop
const generateShopQR = async (shopData) => {
  const qrId = uuidv4();
  const shopCode = `SHOP_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  
  const qrData = JSON.stringify({
    shopId: shopData._id || 'temp',
    shopName: shopData.shopName,
    shopCode: shopCode,
    qrId: qrId,
    type: 'shop_payment_demo',
    demoAmount: shopData.demoTransactionAmount || 30,
    gstNumber: shopData.gstNumber,
    mobileNumber: shopData.mobileNumber
  });

  try {
    const qrCodeImage = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      qrCode: qrCodeImage,
      qrData: qrData,
      qrId: qrId,
      shopCode: shopCode
    };
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

// Create shop (Admin only)
const createShop = async (req, res) => {
  try {
    const { 
      shopName, 
      gstNumber, 
      mobileNumber, 
      ownerName, 
      contactInfo, 
      address, 
      assignOwner,
      demoTransactionAmount 
    } = req.body;

    // Check if shop owner exists (if provided)
    let shopOwner = null;
    if (assignOwner) {
      shopOwner = await User.findById(assignOwner);
      if (!shopOwner || !['shopowner', 'electrician'].includes(shopOwner.role)) {
        return res.status(400).json({ 
          error: 'Invalid shop owner. Must be a shopowner or electrician.' 
        });
      }
    }

    // Check for duplicate GST number
    const existingShopByGST = await Shop.findOne({ gstNumber });
    if (existingShopByGST) {
      return res.status(400).json({ 
        error: 'Shop with this GST number already exists' 
      });
    }

    // Check for duplicate mobile number
    const existingShopByMobile = await Shop.findOne({ mobileNumber });
    if (existingShopByMobile) {
      return res.status(400).json({ 
        error: 'Shop with this mobile number already exists' 
      });
    }
    // Create shop data for QR generation
    const tempShopData = { 
      shopName, 
      gstNumber, 
      mobileNumber, 
      demoTransactionAmount: demoTransactionAmount || 30 
    };
    const qrData = await generateShopQR(tempShopData);

    const shop = new Shop({
      shopName,
      gstNumber,
      mobileNumber,
      ownerName,
      contactInfo,
      address,
      demoTransactionAmount: demoTransactionAmount || 30,
      paymentQR: qrData,
      shopOwner: shopOwner ? shopOwner._id : null,
      createdBy: req.user.id
    });

    await shop.save();

    // Update QR data with actual shop ID
    const updatedQrData = JSON.stringify({
      shopId: shop._id,
      shopName: shop.shopName,
      shopCode: qrData.shopCode,
      qrId: qrData.qrId,
      type: 'shop_payment_demo',
      demoAmount: shop.demoTransactionAmount,
      gstNumber: shop.gstNumber,
      mobileNumber: shop.mobileNumber
    });

    shop.paymentQR.qrData = updatedQrData;
    const updatedQrCode = await QRCode.toDataURL(updatedQrData, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    shop.paymentQR.qrCode = updatedQrCode;
    await shop.save();

    // Populate shop owner info
    await shop.populate('shopOwner', 'name phone email');

    res.status(201).json({
      message: 'Shop created successfully',
      shop
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ error: 'Failed to create shop' });
  }
};

// Get all shops (Admin only)
const getAllShops = async (req, res) => {
  try {
    const { page = 1, limit = 10, active = 'true' } = req.query;
    
    const filter = {};
    if (active === 'true') filter.isActive = true;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const shops = await Shop.find(filter)
      .populate('shopOwner', 'name phone email')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await Shop.countDocuments(filter);

    res.json({
      shops,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get all shops error:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};

// Get single shop
const getShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id)
      .populate('shopOwner', 'name phone email')
      .populate('createdBy', 'name');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check permissions - admin can view all, shop owners can only view their own
    if (req.user.role !== 'admin' && 
        (!shop.shopOwner || shop.shopOwner._id.toString() !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ shop });
  } catch (error) {
    console.error('Get shop error:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
};

// Update shop (Admin only)
const updateShop = async (req, res) => {
  try {
    const { 
      shopName, 
      gstNumber, 
      mobileNumber, 
      ownerName, 
      contactInfo, 
      address, 
      isActive, 
      assignOwner,
      demoTransactionAmount 
    } = req.body;

    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check for duplicate GST number (excluding current shop)
    if (gstNumber && gstNumber !== shop.gstNumber) {
      const existingShopByGST = await Shop.findOne({ 
        gstNumber, 
        _id: { $ne: shop._id } 
      });
      if (existingShopByGST) {
        return res.status(400).json({ 
          error: 'Shop with this GST number already exists' 
        });
      }
    }

    // Check for duplicate mobile number (excluding current shop)
    if (mobileNumber && mobileNumber !== shop.mobileNumber) {
      const existingShopByMobile = await Shop.findOne({ 
        mobileNumber, 
        _id: { $ne: shop._id } 
      });
      if (existingShopByMobile) {
        return res.status(400).json({ 
          error: 'Shop with this mobile number already exists' 
        });
      }
    }
    // Check if new shop owner exists (if provided)
    let shopOwner = null;
    if (assignOwner) {
      shopOwner = await User.findById(assignOwner);
      if (!shopOwner || !['shopowner', 'electrician'].includes(shopOwner.role)) {
        return res.status(400).json({ 
          error: 'Invalid shop owner. Must be a shopowner or electrician.' 
        });
      }
    }

    // Track if QR regeneration is needed
    const needsQRRegeneration = (
      (shopName && shopName !== shop.shopName) ||
      (gstNumber && gstNumber !== shop.gstNumber) ||
      (mobileNumber && mobileNumber !== shop.mobileNumber) ||
      (demoTransactionAmount && demoTransactionAmount !== shop.demoTransactionAmount)
    );
    // Update shop fields
    if (shopName) shop.shopName = shopName;
    if (gstNumber) shop.gstNumber = gstNumber;
    if (mobileNumber) shop.mobileNumber = mobileNumber;
    if (ownerName !== undefined) shop.ownerName = ownerName;
    if (contactInfo) shop.contactInfo = { ...shop.contactInfo, ...contactInfo };
    if (address) shop.address = { ...shop.address, ...address };
    if (typeof isActive !== 'undefined') shop.isActive = isActive;
    if (assignOwner !== undefined) shop.shopOwner = shopOwner ? shopOwner._id : null;
    if (demoTransactionAmount !== undefined) shop.demoTransactionAmount = demoTransactionAmount;

    // Regenerate QR if critical details changed
    if (needsQRRegeneration) {
      await shop.regenerateQR();
    }

    await shop.save();
    await shop.populate('shopOwner', 'name phone email');

    res.json({
      message: 'Shop updated successfully',
      shop
    });
  } catch (error) {
    console.error('Update shop error:', error);
    res.status(500).json({ error: 'Failed to update shop' });
  }
};

// Delete shop (Admin only)
const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findByIdAndDelete(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    res.json({ message: 'Shop deleted successfully' });
  } catch (error) {
    console.error('Delete shop error:', error);
    res.status(500).json({ error: 'Failed to delete shop' });
  }
};

// Get shop by QR ID (for QR scanning)
const getShopByQR = async (req, res) => {
  try {
    const { qrId } = req.params;

    const shop = await Shop.findOne({ 'paymentQR.qrId': qrId })
      .populate('shopOwner', 'name phone');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (!shop.isActive) {
      return res.status(400).json({ error: 'Shop is not active' });
    }

    res.json({
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        gstNumber: shop.gstNumber,
        mobileNumber: shop.mobileNumber,
        ownerName: shop.ownerName,
        contactInfo: shop.contactInfo,
        address: shop.address,
        qrId: shop.paymentQR.qrId,
        shopCode: shop.paymentQR.shopCode,
        demoTransactionAmount: shop.demoTransactionAmount
      }
    });
  } catch (error) {
    console.error('Get shop by QR error:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
};

// Get shop by shop code (alternative QR lookup)
const getShopByCode = async (req, res) => {
  try {
    const { shopCode } = req.params;

    const shop = await Shop.findOne({ 'paymentQR.shopCode': shopCode })
      .populate('shopOwner', 'name phone');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    if (!shop.isActive) {
      return res.status(400).json({ error: 'Shop is not active' });
    }

    res.json({
      shop: {
        id: shop._id,
        shopName: shop.shopName,
        gstNumber: shop.gstNumber,
        mobileNumber: shop.mobileNumber,
        ownerName: shop.ownerName,
        contactInfo: shop.contactInfo,
        address: shop.address,
        qrId: shop.paymentQR.qrId,
        shopCode: shop.paymentQR.shopCode,
        demoTransactionAmount: shop.demoTransactionAmount
      }
    });
  } catch (error) {
    console.error('Get shop by code error:', error);
    res.status(500).json({ error: 'Failed to fetch shop' });
  }
};
// Get shop dashboard (for shop owners)
const getShopDashboard = async (req, res) => {
  try {
    const shopId = req.params.id;
    
    const shop = await Shop.findById(shopId)
      .populate('shopOwner', 'name phone email');

    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && 
        (!shop.shopOwner || shop.shopOwner._id.toString() !== req.user.id)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get recent transactions (demo QR scans)
    const recentTransactions = await Transaction.find({ shop: shopId })
      .sort({ createdAt: -1 })
      .limit(10);

    // Get recent purchases (if any)
    const recentPurchases = await Purchase.find({ shop: shopId })
      .populate('customer', 'name phone')
      .populate('products.product', 'title price')
      .sort({ createdAt: -1 })
      .limit(5);

    // Get transaction statistics
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayTransactions = await Transaction.aggregate([
      { $match: { shop: shop._id, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$transactionAmount' }, count: { $sum: 1 } } }
    ]);

    const todayPurchases = await Purchase.aggregate([
      { $match: { shop: shop._id, createdAt: { $gte: today } } },
      { $group: { _id: null, total: { $sum: '$purchaseAmount' }, count: { $sum: 1 } } }
    ]);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    const monthlyTransactions = await Transaction.aggregate([
      { $match: { shop: shop._id, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$transactionAmount' }, count: { $sum: 1 } } }
    ]);
    
    const monthlyPurchases = await Purchase.aggregate([
      { $match: { shop: shop._id, createdAt: { $gte: thisMonth } } },
      { $group: { _id: null, total: { $sum: '$purchaseAmount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      shop,
      recentTransactions,
      recentPurchases,
      statistics: {
        totalRevenue: shop.totalRevenue,
        totalPurchases: shop.totalPurchases,
        todayTransactionRevenue: todayTransactions[0]?.total || 0,
        todayTransactionCount: todayTransactions[0]?.count || 0,
        todayRevenue: todayPurchases[0]?.total || 0,
        todayPurchases: todayPurchases[0]?.count || 0,
        monthlyTransactionRevenue: monthlyTransactions[0]?.total || 0,
        monthlyTransactionCount: monthlyTransactions[0]?.count || 0,
        monthlyRevenue: monthlyPurchases[0]?.total || 0,
        monthlyPurchases: monthlyPurchases[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Get shop dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch shop dashboard' });
  }
};

// Regenerate QR code for shop (Admin only)
const regenerateShopQR = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ error: 'Shop not found' });
    }

    await shop.regenerateQR();
    await shop.populate('shopOwner', 'name phone email');

    res.json({
      message: 'QR code regenerated successfully. Old QR code is now invalid.',
      shop
    });
  } catch (error) {
    console.error('Regenerate QR error:', error);
    res.status(500).json({ error: 'Failed to regenerate QR code' });
  }
};
// Get shops for current user (shop owner)
const getMyShops = async (req, res) => {
  try {
    const shops = await Shop.find({ shopOwner: req.user.id, isActive: true })
      .sort({ createdAt: -1 });

    res.json({ shops });
  } catch (error) {
    console.error('Get my shops error:', error);
    res.status(500).json({ error: 'Failed to fetch shops' });
  }
};

module.exports = {
  createShop,
  getAllShops,
  getShop,
  updateShop,
  deleteShop,
  getShopByQR,
  getShopByCode,
  getShopDashboard,
  getMyShops,
  regenerateShopQR
};