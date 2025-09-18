const express = require('express');
const router = express.Router();

const {
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
} = require('../controllers/shopController');

const { authenticate, isAdmin, isShopOwner } = require('../middleware/auth');
const { validateObjectId, validatePagination } = require('../middleware/validation');

// Public routes
router.get('/qr/:qrId', getShopByQR);
router.get('/code/:shopCode', getShopByCode);

// Shop owner routes
router.get('/my-shops', authenticate, isShopOwner, getMyShops);
router.get('/:id/dashboard', authenticate, validateObjectId, getShopDashboard);

// Admin routes
router.post('/', authenticate, isAdmin, createShop);
router.get('/', authenticate, isAdmin, validatePagination, getAllShops);
router.get('/:id', authenticate, validateObjectId, getShop);
router.put('/:id', authenticate, isAdmin, validateObjectId, updateShop);
router.delete('/:id', authenticate, isAdmin, validateObjectId, deleteShop);
router.post('/:id/regenerate-qr', authenticate, isAdmin, validateObjectId, regenerateShopQR);

module.exports = router;