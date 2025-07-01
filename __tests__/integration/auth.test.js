import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import dotenv from 'dotenv';
import bcryptjs from 'bcryptjs';
import userModel from '../../DB/models/user.model.js';
import authRouter from '../../src/modules/auth/auth.router.js';
import { responseMiddleware } from '../../src/middleware/response.middleware.js';
import { globalErrorHandling } from '../../src/middleware/error.middleware.js';

dotenv.config();

describe('Auth API - Integration Tests', () => {
  let mongoServer;
  let app;
  let testUser;
  let hashedPassword;

  beforeAll(async () => {
    // Setup MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to in-memory database
    await mongoose.connect(mongoUri);

    // Create Express app
    app = express();
    app.use(express.json());
    app.use(responseMiddleware);
    app.use('/api/auth', authRouter);
    app.use(globalErrorHandling);

    // Create test user
    hashedPassword = await bcryptjs.hash('Password123!', 10);
    testUser = {
      displayName: 'Test User',
      email: 'existing@example.com',
      password: hashedPassword,
      phoneNumber: '+9665xxxxxxxx',
      role: 'user'
    };
  });

  beforeEach(async () => {
    // Clear database before each test
    await userModel.deleteMany({});

    // Add test user to database
    await userModel.create(testUser);
  });

  afterAll(async () => {
    // Disconnect and stop MongoDB Memory Server
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const newUser = {
        displayName: 'New User',
        email: 'new@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phoneNumber: '+9665xxxxxxxx',
        job: 'Designer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUser)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم إنشاء الحساب بنجاح');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.email).toBe(newUser.email);
      expect(response.body.data.displayName).toBe(newUser.displayName);

      // Verify user was created in database
      const createdUser = await userModel.findOne({ email: newUser.email });
      expect(createdUser).toBeTruthy();
      expect(createdUser.displayName).toBe(newUser.displayName);
    });

    it('should return 409 if email already exists', async () => {
      const existingUser = {
        displayName: 'Existing User',
        email: 'existing@example.com', // Same as testUser
        password: 'Password123!',
        confirmPassword: 'Password123!',
        phoneNumber: '+9665xxxxxxxx',
        job: 'Designer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(existingUser)
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('البريد الإلكتروني مسجل بالفعل');
    });

    it('should return 400 if validation fails', async () => {
      const invalidUser = {
        displayName: 'Invalid User',
        email: 'invalid-email', // Invalid email format
        password: 'weak', // Weak password
        confirmPassword: 'weak',
        phoneNumber: '+9665xxxxxxxx',
        job: 'Designer'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidUser)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('validationErrors');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const loginData = {
        email: 'existing@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.email).toBe(loginData.email);
    });

    it('should return 400 if email not found', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    });

    it('should return 400 if password is incorrect', async () => {
      const loginData = {
        email: 'existing@example.com',
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
    });
  });
});
