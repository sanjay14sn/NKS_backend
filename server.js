const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const favoriteRoutes = require('./routes/favorites');

const app = express();

// Connect to MongoDB and seed admin
// Connect to MongoDB and seed admin
connectDB().then(async () => {
  try {
    const adminPhone = process.env.ADMIN_PHONE || "7868000645"; // ✅ fallback if not in .env
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Administrator";

    if (!adminPhone || !adminPassword) {
      console.warn("⚠️ ADMIN_PHONE or ADMIN_PASSWORD not set in .env");
      return;
    }

    let admin = await User.findOne({ phone: adminPhone });
    if (!admin) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      admin = new User({
        name: adminName,
        phone: adminPhone,   // ✅ now using phone
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true
      });

      await admin.save();
      console.log(`✅ Admin account created with phone: ${adminPhone}`);
    } else {
      console.log(`ℹ️ Admin already exists with phone: ${adminPhone}`);
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
});

// Security middleware
app.use(helmet());

// Compression middleware (better performance)
app.use(compression());

// Cookie parser (needed if auth tokens are stored in cookies)
app.use(cookieParser());

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL]
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});
app.use('/api/', limiter);

// Logging
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format'
    });
  }
  
  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate field value',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 5003;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 API base URL: http://localhost:${PORT}/api`);
});

module.exports = app;
