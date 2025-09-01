const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');

// Test database
const MONGO_URI = process.env.MONGO_TEST_URI || 'mongodb://localhost:27017/shopping-app-test';

describe('Authentication Endpoints', () => {
  beforeAll(async () => {
    await mongoose.connect(MONGO_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/auth/signup/user', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        phone: '9876543210',
        password: 'password123',
        confirmPassword: 'password123',
        referral: 'FRIEND123'
      };

      const response = await request(app)
        .post('/api/auth/signup/user')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user.phone).toBe(userData.phone);
      expect(response.body.user.role).toBe('user');
    });

    it('should return error for duplicate phone number', async () => {
      const userData = {
        name: 'John Doe',
        phone: '9876543210',
        password: 'password123',
        confirmPassword: 'password123'
      };

      // Create first user
      await request(app)
        .post('/api/auth/signup/user')
        .send(userData)
        .expect(201);

      // Try to create duplicate
      const response = await request(app)
        .post('/api/auth/signup/user')
        .send(userData)
        .expect(400);

      expect(response.body.error).toContain('already exists');
    });

    it('should validate password confirmation', async () => {
      const userData = {
        name: 'John Doe',
        phone: '9876543210',
        password: 'password123',
        confirmPassword: 'different'
      };

      const response = await request(app)
        .post('/api/auth/signup/user')
        .send(userData)
        .expect(400);

      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create test user
      const user = new User({
        name: 'Test User',
        phone: '9876543210',
        passwordHash: 'password123',
        role: 'user'
      });
      await user.save();
    });

    it('should login with valid credentials', async () => {
      const loginData = {
        phone: '9876543210',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty('token');
      expect(response.body.user.phone).toBe(loginData.phone);
    });

    it('should return error for invalid credentials', async () => {
      const loginData = {
        phone: '9876543210',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.error).toContain('Invalid');
    });
  });
});