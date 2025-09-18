const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');
const Shop = require('../models/Shop');
const Purchase = require('../models/Purchase');
const Transaction = require('../models/Transaction');
const QRCode = require('qrcode');
const { v4: uuidv4 } = require('uuid');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Shop.deleteMany({});
    await Purchase.deleteMany({});
    await Transaction.deleteMany({});

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 12);
    const admin = await User.create({
      name: process.env.ADMIN_NAME || 'System Administrator',
      phone: '9999999999',
      passwordHash: adminPassword,
      role: 'admin'
    });

    // Create test users
    console.log('👥 Creating test users...');
    const testUserPassword = await bcrypt.hash('password123', 12);
    
    const testUser = await User.create({
      name: 'John Doe',
      phone: '9876543210',
      passwordHash: testUserPassword,
      role: 'user',
      referral: 'FRIEND123'
    });

    const shopOwner = await User.create({
      name: 'Shop Owner',
      phone: '9876543211',
      passwordHash: testUserPassword,
      role: 'shopowner',
      gstNumber: '22AAAAA0000A1Z5',
      shopName: 'Electronics Paradise'
    });

    const electrician = await User.create({
      name: 'Expert Electrician',
      phone: '9876543212',
      passwordHash: testUserPassword,
      role: 'electrician',
      gstNumber: '22BBBBB0000A1Z5',
      shopName: 'Electrical Solutions'
    });

    // Create categories
    console.log('📂 Creating categories...');
    const categories = await Category.insertMany([
      {
        title: 'Lighting',
        slug: 'lighting',
        description: 'LED lights, bulbs, fixtures, and lighting accessories'
      },
      {
        title: 'Wiring & Cables',
        slug: 'wiring-cables',
        description: 'Electrical wires, cables, and wiring accessories'
      },
      {
        title: 'Switches & Sockets',
        slug: 'switches-sockets',
        description: 'Wall switches, power sockets, and electrical outlets'
      },
      {
        title: 'Circuit Protection',
        slug: 'circuit-protection',
        description: 'MCBs, fuses, surge protectors, and safety equipment'
      },
      {
        title: 'Fans & Ventilation',
        slug: 'fans-ventilation',
        description: 'Ceiling fans, exhaust fans, and ventilation systems'
      },
      {
        title: 'Tools & Equipment',
        slug: 'tools-equipment',
        description: 'Electrical tools, testers, and installation equipment'
      }
    ]);

    // Create sample products
    console.log('🛍️ Creating sample products...');
    const products = [
      // Lighting products
      {
        title: 'LED Bulb 9W Cool White',
        description: 'Energy efficient LED bulb with 9W power consumption',
        aboutProduct: 'High-quality LED bulb with 900 lumens output, 6500K cool white color temperature. Long lasting with 25,000 hours lifespan. Suitable for homes and offices.',
        price: 150,
        stock: 100,
        category: categories[0]._id,
        images: ['https://images.pexels.com/photos/1560072/pexels-photo-1560072.jpeg'],
        rating: 4.5,
        ratingCount: 24,
        createdBy: admin._id
      },
      {
        title: 'Smart LED Strip Lights 5M',
        description: 'RGB color changing LED strip lights with remote control',
        aboutProduct: 'Flexible LED strip lights with 16 million colors, multiple modes, and remote control. Easy installation with adhesive backing. Perfect for decoration and ambient lighting.',
        price: 799,
        stock: 50,
        category: categories[0]._id,
        images: ['https://images.pexels.com/photos/1939485/pexels-photo-1939485.jpeg'],
        rating: 4.2,
        ratingCount: 18,
        createdBy: shopOwner._id
      },
      // Wiring products
      {
        title: 'Copper Wire 2.5 sq mm (100m)',
        description: 'High quality copper electrical wire for home wiring',
        aboutProduct: 'IS 694:1990 certified copper wire with PVC insulation. Suitable for residential and commercial wiring. Fire retardant and durable.',
        price: 2500,
        stock: 25,
        category: categories[1]._id,
        images: ['https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg'],
        rating: 4.8,
        ratingCount: 12,
        createdBy: electrician._id
      },
      // Switches products
      {
        title: 'Modular Switch 2-Way White',
        description: '2-way modular switch with modern design',
        aboutProduct: 'Premium quality 2-way modular switch with smooth operation. ISI marked for safety. Elegant white finish that complements modern interiors.',
        price: 120,
        stock: 200,
        category: categories[2]._id,
        images: ['https://images.pexels.com/photos/221415/pexels-photo-221415.jpeg'],
        rating: 4.3,
        ratingCount: 35,
        createdBy: admin._id
      },
      {
        title: 'USB Socket with 2 USB Ports',
        description: 'Modular socket with built-in USB charging ports',
        aboutProduct: 'Convenient modular socket with 2 USB ports for direct device charging. Built-in surge protection and smart charging technology.',
        price: 450,
        stock: 75,
        category: categories[2]._id,
        images: ['https://images.pexels.com/photos/106344/pexels-photo-106344.jpeg'],
        rating: 4.6,
        ratingCount: 28,
        createdBy: shopOwner._id
      },
      // Circuit protection
      {
        title: 'MCB 32A Single Pole',
        description: 'Miniature Circuit Breaker for electrical safety',
        aboutProduct: 'High-quality MCB with 32A rating, C-type characteristics. Provides protection against overload and short circuit. IS 13947 certified.',
        price: 180,
        stock: 150,
        category: categories[3]._id,
        images: ['https://images.pexels.com/photos/257736/pexels-photo-257736.jpeg'],
        rating: 4.7,
        ratingCount: 15,
        createdBy: electrician._id
      },
      // Fans
      {
        title: 'Ceiling Fan 48" with Remote',
        description: 'Energy efficient ceiling fan with remote control',
        aboutProduct: 'Premium ceiling fan with aerodynamic blade design for maximum air delivery. Includes remote control with speed and light control. 5-year warranty.',
        price: 3200,
        stock: 30,
        category: categories[4]._id,
        images: ['https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg'],
        rating: 4.4,
        ratingCount: 22,
        createdBy: admin._id
      },
      // Tools
      {
        title: 'Digital Multimeter',
        description: 'Professional digital multimeter for electrical testing',
        aboutProduct: 'Accurate digital multimeter with auto-ranging, backlit display, and safety features. Measures voltage, current, resistance, and continuity.',
        price: 850,
        stock: 40,
        category: categories[5]._id,
        images: ['https://images.pexels.com/photos/5966621/pexels-photo-5966621.jpeg'],
        rating: 4.9,
        ratingCount: 8,
        createdBy: electrician._id
      }
    ];

    await Product.insertMany(products);

    // Create sample shops
    console.log('🏪 Creating sample shops...');
    const shops = [];
    
    const shopData = [
      {
        shopName: 'Electronics Paradise',
        gstNumber: '27AAAAA0000A1Z5',
        mobileNumber: '9876543201',
        ownerName: shopOwner.name,
        shopOwner: shopOwner._id,
        demoTransactionAmount: 30
      },
      {
        shopName: 'Electrical Solutions Hub',
        gstNumber: '27BBBBB0000A1Z5',
        mobileNumber: '9876543202',
        ownerName: electrician.name,
        shopOwner: electrician._id,
        demoTransactionAmount: 50
      },
      {
        shopName: 'Tech Components Store',
        gstNumber: '27CCCCC0000A1Z5',
        mobileNumber: '9876543203',
        ownerName: null,
        shopOwner: null,
        demoTransactionAmount: 25
      }
    ];

    for (let i = 0; i < shopData.length; i++) {
      const qrId = uuidv4();
      const shopCode = `SHOP_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const currentShopData = {
        ...shopData[i],
        contactInfo: {
          phone: shopData[i].mobileNumber,
          email: `shop${i + 1}@example.com`
        },
        address: {
          street: `${i + 1}23 Market Street`,
          city: 'Mumbai',
          state: 'Maharashtra',
          zipCode: '400001'
        },
        createdBy: admin._id
      };

      const qrDataContent = JSON.stringify({
        shopId: 'temp',
        shopName: currentShopData.shopName,
        shopCode: shopCode,
        qrId: qrId,
        type: 'shop_payment_demo',
        demoAmount: currentShopData.demoTransactionAmount,
        gstNumber: currentShopData.gstNumber,
        mobileNumber: currentShopData.mobileNumber
      });

      const qrCodeImage = await QRCode.toDataURL(qrDataContent, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        quality: 0.92,
        margin: 1
      });

      const shop = new Shop({
        ...currentShopData,
        paymentQR: {
          qrCode: qrCodeImage,
          qrData: qrDataContent,
          qrId: qrId,
          shopCode: shopCode
        }
      });

      await shop.save();

      // Update QR data with actual shop ID
      const updatedQrData = JSON.stringify({
        shopId: shop._id,
        shopName: shop.shopName,
        shopCode: shopCode,
        qrId: qrId,
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
        margin: 1
      });
      shop.paymentQR.qrCode = updatedQrCode;
      await shop.save();

      shops.push(shop);
    }

    // Create sample demo transactions
    console.log('💳 Creating sample demo transactions...');
    const sampleTransactions = [
      {
        shop: shops[0]._id,
        shopCode: shops[0].paymentQR.shopCode,
        transactionAmount: 30,
        paymentMethod: 'googlepay',
        customerInfo: { name: 'Demo Customer 1', phone: '9876543210', upiId: 'customer1@paytm' }
      },
      {
        shop: shops[1]._id,
        shopCode: shops[1].paymentQR.shopCode,
        transactionAmount: 50,
        paymentMethod: 'phonepe',
        customerInfo: { name: 'Demo Customer 2', phone: '9876543211', upiId: 'customer2@phonepe' }
      },
      {
        shop: shops[0]._id,
        shopCode: shops[0].paymentQR.shopCode,
        transactionAmount: 30,
        paymentMethod: 'paytm',
        customerInfo: { name: 'Demo Customer 3', upiId: 'customer3@paytm' }
      },
      {
        shop: shops[2]._id,
        shopCode: shops[2].paymentQR.shopCode,
        transactionAmount: 25,
        paymentMethod: 'demo',
        customerInfo: { name: 'Anonymous Customer' }
      }
    ];

    for (const transactionData of sampleTransactions) {
      const transaction = new Transaction({
        ...transactionData,
        transactionType: 'demo_qr_scan',
        status: 'simulated',
        metadata: {
          scannedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
          userAgent: 'Demo/Seed Data',
          ipAddress: '127.0.0.1',
          qrId: shops.find(s => s._id.equals(transactionData.shop)).paymentQR.qrId
        },
        notes: `Demo QR scan transaction for ₹${transactionData.transactionAmount}`
      });
      
      await transaction.save();
      
      // Update shop revenue
      const shop = await Shop.findById(transactionData.shop);
      await shop.addPurchase(transactionData.transactionAmount);
    }
    // Create sample purchases
    console.log('💰 Creating sample purchases...');
    const samplePurchases = [
      {
        shop: shops[0]._id,
        customer: testUser._id,
        purchaseAmount: 150,
        products: [{ product: products[0]._id, quantity: 1, price: 150 }],
        paymentMethod: 'qr',
        customerInfo: { name: testUser.name, phone: testUser.phone }
      },
      {
        shop: shops[1]._id,
        customer: null, // Anonymous purchase
        purchaseAmount: 799,
        products: [{ product: products[1]._id, quantity: 1, price: 799 }],
        paymentMethod: 'qr',
        customerInfo: { name: 'Anonymous Customer', phone: '9999999998' }
      },
      {
        shop: shops[0]._id,
        customer: testUser._id,
        purchaseAmount: 270,
        products: [
          { product: products[3]._id, quantity: 2, price: 120 },
          { product: products[4]._id, quantity: 1, price: 450 }
        ],
        paymentMethod: 'qr'
      }
    ];

    for (const purchaseData of samplePurchases) {
      const purchase = new Purchase(purchaseData);
      await purchase.save();

      // Update shop revenue
      const shop = await Shop.findById(purchaseData.shop);
      await shop.addPurchase(purchaseData.purchaseAmount);
    }
    console.log('✅ Seed data created successfully!');
    console.log('\n📋 Test Accounts:');
    console.log(`Admin: Phone: 9999999999, Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`User: Phone: 9876543210, Password: password123`);
    console.log(`Shop Owner: Phone: 9876543211, Password: password123`);
    console.log(`Electrician: Phone: 9876543212, Password: password123`);
   console.log(`\n📊 Created ${categories.length} categories, ${products.length} products, ${shops.length} shops, ${sampleTransactions.length} demo transactions, and ${samplePurchases.length} sample purchases`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed data creation failed:', error);
    process.exit(1);
  }
};

// Run seed data if this file is executed directly
if (require.main === module) {
  seedData();
}

module.exports = seedData;