const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../server');
const User = require('../models/User');
const Category = require('../models/Category');
const Product = require('../models/Product');

const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/shopping-app-test';

describe('Product Endpoints', () => {
  let adminToken, userToken, categoryId;

  beforeAll(async () => {
    await mongoose.connect(MONGO_URI);
  });

  beforeEach(async () => {
    // Clear collections
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});

    // Create admin user
    const admin = new User({
      name: 'Admin',
      phone: '9999999999',
      passwordHash: 'admin123',
      role: 'admin'
    });
    await admin.save();
    adminToken = jwt.sign({ id: admin._id }, process.env.JWT_SECRET);

    // Create regular user
    const user = new User({
      name: 'Test User',
      phone: '9876543210',
      passwordHash: 'password123',
      role: 'user'
    });
    await user.save();
    userToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Create test category
    const category = new Category({
      title: 'Test Category',
      slug: 'test-category',
      description: 'Test category description'
    });
    await category.save();
    categoryId = category._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('GET /api/products', () => {
    it('should return products list', async () => {
      // Create test product
      const product = new Product({
        title: 'Test Product',
        description: 'Test description',
        price: 100,
        stock: 10,
        category: categoryId,
        createdBy: adminToken.id
      });
      await product.save();

      const response = await request(app)
        .get('/api/products')
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].title).toBe('Test Product');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should filter products by category', async () => {
      // Create products in different categories
      const product1 = new Product({
        title: 'Product 1',
        description: 'Description 1',
        price: 100,
        stock: 10,
        category: categoryId,
        createdBy: adminToken.id
      });

      const category2 = new Category({
        title: 'Category 2',
        slug: 'category-2'
      });
      await category2.save();

      const product2 = new Product({
        title: 'Product 2',
        description: 'Description 2',
        price: 200,
        stock: 5,
        category: category2._id,
        createdBy: adminToken.id
      });

      await Promise.all([product1.save(), product2.save()]);

      const response = await request(app)
        .get(`/api/products?category=${categoryId}`)
        .expect(200);

      expect(response.body.products).toHaveLength(1);
      expect(response.body.products[0].title).toBe('Product 1');
    });
  });

  describe('POST /api/products', () => {
    it('should create product as admin', async () => {
      const productData = {
        title: 'New Product',
        description: 'New product description',
        aboutProduct: 'Detailed information about the product',
        price: 299,
        stock: 50,
        category: categoryId.toString()
      };

      const response = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(productData)
        .expect(201);

      expect(response.body.product.title).toBe(productData.title);
      expect(response.body.product.price).toBe(productData.price);
    });

    it('should deny product creation for regular users', async () => {
      const productData = {
        title: 'New Product',
        description: 'New product description',
        price: 299,
        stock: 50,
        category: categoryId.toString()
      };

      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send(productData)
        .expect(403);
    });
  });
});