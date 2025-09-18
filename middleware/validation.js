const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUserSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid Indian phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  body('referral').optional().trim().isLength({ max: 50 }),
  handleValidationErrors
];

// ShopOwner validation rules
const validateShopOwnerSignup = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid Indian phone number'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    }),
  body('gstNumber')
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please enter a valid GST number'),
  body('shopName').optional().trim().isLength({ max: 200 }),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('phone')
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid phone number'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Category validation
const validateCategory = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Title must be between 2 and 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('slug')
    .optional()
    .matches(/^[a-z0-9-]+$/)
    .withMessage('Slug can only contain lowercase letters, numbers, and hyphens'),
  handleValidationErrors
];

// Product validation
// Product validation
const validateProduct = [
  body('title')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Title must be between 2 and 200 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('aboutProduct')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('About product cannot exceed 2000 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('retailerPrice')
    .isFloat({ min: 0 })
    .withMessage('Retailer price must be a positive number'),
  body('stock')
    .isInt({ min: 0 })
    .withMessage('Stock must be a non-negative integer'),
  body('category')
    .isMongoId()
    .withMessage('Invalid category ID'),
  handleValidationErrors
];


// Order validation
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.product')
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('shippingAddress.street')
    .trim()
    .notEmpty()
    .withMessage('Street address is required'),
  body('shippingAddress.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('shippingAddress.state')
    .trim()
    .notEmpty()
    .withMessage('State is required'),
  body('shippingAddress.zipCode')
    .matches(/^[0-9]{6}$/)
    .withMessage('Please enter a valid 6-digit ZIP code'),
  body('paymentMethod')
    .isIn(['cod', 'online', 'card'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
];

// Shop validation
const validateShop = [
  body('shopName')
    .trim()
    .isLength({ min: 2, max: 200 })
    .withMessage('Shop name must be between 2 and 200 characters'),
  body('gstNumber')
    .matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
    .withMessage('Please enter a valid GST number'),
  body('mobileNumber')
    .matches(/^[0-9]{10}$/)
    .withMessage('Please enter a valid 10-digit mobile number'),
  body('ownerName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Owner name cannot exceed 100 characters'),
  body('contactInfo.phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid phone number'),
  body('contactInfo.email')
    .optional()
    .isEmail()
    .withMessage('Please enter a valid email address'),
  body('address.zipCode')
    .optional()
    .matches(/^[0-9]{6}$/)
    .withMessage('Please enter a valid 6-digit ZIP code'),
  body('assignOwner')
    .optional()
    .isMongoId()
    .withMessage('Invalid owner ID'),
  body('demoTransactionAmount')
    .optional()
    .isFloat({ min: 1 })
    .withMessage('Demo transaction amount must be at least ₹1'),
  handleValidationErrors
];

// Purchase validation
const validatePurchase = [
  body('shopId')
    .isMongoId()
    .withMessage('Invalid shop ID'),
  body('purchaseAmount')
    .isFloat({ min: 0 })
    .withMessage('Purchase amount must be a positive number'),
  body('products')
    .optional()
    .isArray()
    .withMessage('Products must be an array'),
  body('products.*.product')
    .optional()
    .isMongoId()
    .withMessage('Invalid product ID'),
  body('products.*.quantity')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('paymentMethod')
    .optional()
    .isIn(['qr', 'cash', 'card', 'online'])
    .withMessage('Invalid payment method'),
  handleValidationErrors
// Transaction validation
const validateTransaction = [
  body('shopId')
    .optional()
    .isMongoId()
    .withMessage('Invalid shop ID'),
  body('shopCode')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Shop code cannot be empty'),
  body('paymentMethod')
    .optional()
    .isIn(['googlepay', 'phonepe', 'paytm', 'upi', 'demo'])
    .withMessage('Invalid payment method'),
  body('customerInfo.phone')
    .optional()
    .isMobilePhone('en-IN')
    .withMessage('Please enter a valid phone number'),
  body('customerInfo.upiId')
    .optional()
    .matches(/^[\w.-]+@[\w.-]+$/)
    .withMessage('Please enter a valid UPI ID'),
  handleValidationErrors
];
];
// Parameter validation
const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors
];

// Query validation for pagination
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sort')
    .optional()
    .isIn(['createdAt', '-createdAt', 'price', '-price', 'rating', '-rating', 'title', '-title'])
    .withMessage('Invalid sort field'),
  handleValidationErrors
];

module.exports = {
  validateUserSignup,
  validateShopOwnerSignup,
  validateLogin,
  validateCategory,
  validateProduct,
  validateOrder,
  validateShop,
  validatePurchase,
  validateTransaction,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};