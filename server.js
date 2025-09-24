// server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('./config/database');
const User = require('./models/User');

// Import routes
const authRoutes = require('./routes/auth');
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const favoriteRoutes = require('./routes/favorites');
const statsRoutes = require('./routes/stats');

const app = express();

// ===========================
// MongoDB connection & Admin Seed
// ===========================
connectDB().then(async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const adminName = process.env.ADMIN_NAME || "Super Admin";

    if (!adminEmail || !adminPassword) {
      console.warn("⚠️ ADMIN_EMAIL or ADMIN_PASSWORD not set in .env");
      return;
    }

    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      admin = new User({
        name: adminName,
        email: adminEmail,
        passwordHash: hashedPassword,
        role: "admin",
        isActive: true
      });
      await admin.save();
      console.log(`✅ Admin account created with email: ${adminEmail}`);
    } else {
      console.log(`ℹ️ Admin already exists with email: ${adminEmail}`);
    }
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
  }
});

// ===========================
// Security & Performance Middleware
// ===========================
app.use(helmet());
app.use(compression());
app.use(cookieParser());

// ===========================
// CORS Configuration
// ===========================
const allowedOrigins = process.env.CLIENT_URLS?.split(',').map(u => u.trim()) || [];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS blocked: ${origin}`));
    }
  },
  credentials: true
}));

// ===========================
// Rate Limiting
// ===========================
const limiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // default 15 min
  max: process.env.RATE_LIMIT_MAX_REQUESTS || 100, // default 100 requests
  message: { error: 'Too many requests from this IP, please try again later.' }
});
app.use('/api/', limiter);

// ===========================
// Logging & Body Parsing
// ===========================
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ===========================
// Static File Serving
// ===========================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===========================
// API Routes
// ===========================
app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/stats', statsRoutes);

// ===========================
// Health Check
// ===========================
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ===========================
// Error Handling Middleware
// ===========================
app.use((err, req, res, next) => {
  console.error("❌ Error Handler:", err);

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: Object.values(err.errors).map(e => e.message)
    });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(400).json({
      error: 'Duplicate field value',
      field: Object.keys(err.keyPattern)[0]
    });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// ===========================
// 404 Handler
// ===========================
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ===========================
// Start Server
// ===========================
const PORT = process.env.PORT || 5006;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
