const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectDB = require('../config/database');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const seedData = async () => {
  try {
    await connectDB();

    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

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

    console.log('✅ Seed data created successfully!');
    console.log('\n📋 Test Accounts:');
    console.log(`Admin: Phone: 9999999999, Password: ${process.env.ADMIN_PASSWORD || 'admin123'}`);
    console.log(`User: Phone: 9876543210, Password: password123`);
    console.log(`Shop Owner: Phone: 9876543211, Password: password123`);
    console.log(`Electrician: Phone: 9876543212, Password: password123`);
    console.log(`\n📊 Created ${categories.length} categories and ${products.length} products`);

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