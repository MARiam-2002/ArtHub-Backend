import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Import modules to test
import authRouter from '../../src/modules/auth/auth.router.js';
import userModel from '../../DB/models/user.model.js';
import tokenModel from '../../DB/models/token.model.js';
import { authenticate, optionalAuth, authorize } from '../../src/middleware/auth.middleware.js';
import { globalErrorHandler } from '../../src/utils/errorHandler.js';

// Mock Firebase Admin
jest.mock('../../src/utils/firebaseAdmin.js', () => ({
  default: {
    auth: () => ({
      verifyIdToken: jest.fn()
    })
  }
}));

// Mock email sending
jest.mock('../../src/utils/sendEmails.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

// Mock push notifications
jest.mock('../../src/utils/pushNotifications.js', () => ({
  updateUserFCMToken: jest.fn().mockResolvedValue(true)
}));

describe('Authentication System - Complete Test Suite', () => {
  let app;
  let mongoServer;
  let testUser;
  let testToken;

  // Test data
  const validUserData = {
    email: 'test@example.com',
    password: 'TestPassword123!',
    confirmPassword: 'TestPassword123!',
    displayName: 'Test User',
    role: 'user'
  };

  const validArtistData = {
    email: 'artist@example.com',
    password: 'ArtistPassword123!',
    confirmPassword: 'ArtistPassword123!',
    displayName: 'Test Artist',
    role: 'artist'
  };

  const validLoginData = {
    email: 'test@example.com',
    password: 'TestPassword123!'
  };

  beforeEach(async () => {
    // Setup test environment
    process.env.NODE_ENV = 'test';
    process.env.TOKEN_KEY = 'test-secret-key';
    process.env.REFRESH_TOKEN_KEY = 'test-refresh-secret-key';

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRouter);
    app.use(globalErrorHandler);

    // Setup in-memory MongoDB
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create test user
    const hashedPassword = await bcryptjs.hash(validUserData.password, 10);
    testUser = await userModel.create({
      email: validUserData.email,
      password: hashedPassword,
      displayName: validUserData.displayName,
      role: validUserData.role,
      isActive: true,
      isVerified: true
    });

    // Generate test token
    testToken = jwt.sign(
      { id: testUser._id, email: testUser.email, role: testUser.role },
      process.env.TOKEN_KEY,
      { expiresIn: '2h' }
    );

    // Save token to database
    await tokenModel.create({
      userId: testUser._id,
      accessToken: testToken,
      refreshToken: 'test-refresh-token',
      userAgent: 'test-agent',
      isValid: true
    });
  });

  afterEach(async () => {
    // Cleanup
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer.stop();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const newUserData = {
        ...validUserData,
        email: 'newuser@example.com'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(newUserData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم إنشاء الحساب بنجاح');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.email).toBe(newUserData.email);
      expect(response.body.data.displayName).toBe(newUserData.displayName);
      expect(response.body.data.role).toBe(newUserData.role);
    });

    it('should register an artist successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validArtistData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.role).toBe('artist');
    });

    it('should fail when email already exists', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('البريد الإلكتروني مستخدم بالفعل');
    });

    it('should fail when passwords do not match', async () => {
      const invalidData = {
        ...validUserData,
        email: 'different@example.com',
        confirmPassword: 'DifferentPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('كلمة المرور وتأكيدها غير متطابقين');
    });

    it('should fail with invalid email format', async () => {
      const invalidData = {
        ...validUserData,
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with weak password', async () => {
      const invalidData = {
        ...validUserData,
        email: 'weak@example.com',
        password: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com'
          // Missing password, confirmPassword, displayName
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم تسجيل الدخول بنجاح');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data.email).toBe(validLoginData.email);
    });

    it('should fail with invalid email', async () => {
      const invalidData = {
        ...validLoginData,
        email: 'nonexistent@example.com'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('should fail with invalid password', async () => {
      const invalidData = {
        ...validLoginData,
        password: 'WrongPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    });

    it('should fail with inactive user', async () => {
      // Deactivate user
      await userModel.findByIdAndUpdate(testUser._id, { isActive: false });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('تم تعطيل هذا الحساب، يرجى التواصل مع الدعم');
    });

    it('should fail with deleted user', async () => {
      // Mark user as deleted
      await userModel.findByIdAndUpdate(testUser._id, { isDeleted: true });

      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('هذا الحساب محذوف');
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset code successfully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');

      // Check if forget code was saved
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.forgetCode).toBeDefined();
      expect(updatedUser.isForgetCodeVerified).toBe(false);
    });

    it('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('لا يوجد حساب مرتبط بهذا البريد الإلكتروني');
    });

    it('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/verify-forget-code', () => {
    beforeEach(async () => {
      // Set up forget code for testing
      await userModel.findByIdAndUpdate(testUser._id, {
        forgetCode: '1234',
        isForgetCodeVerified: false
      });
    });

    it('should verify forget code successfully', async () => {
      const response = await request(app)
        .post('/api/auth/verify-forget-code')
        .send({
          email: testUser.email,
          forgetCode: '1234'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم التحقق من الرمز بنجاح، يمكنك الآن إعادة تعيين كلمة المرور');

      // Check if code was marked as verified
      const updatedUser = await userModel.findById(testUser._id);
      expect(updatedUser.isForgetCodeVerified).toBe(true);
    });

    it('should fail with invalid code', async () => {
      const response = await request(app)
        .post('/api/auth/verify-forget-code')
        .send({
          email: testUser.email,
          forgetCode: '9999'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('الرمز غير صحيح أو منتهي الصلاحية');
    });

    it('should fail with wrong email', async () => {
      const response = await request(app)
        .post('/api/auth/verify-forget-code')
        .send({
          email: 'wrong@example.com',
          forgetCode: '1234'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('الرمز غير صحيح أو منتهي الصلاحية');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    beforeEach(async () => {
      // Set up verified forget code for testing
      await userModel.findByIdAndUpdate(testUser._id, {
        forgetCode: '1234',
        isForgetCodeVerified: true
      });
    });

    it('should reset password successfully', async () => {
      const newPassword = 'NewPassword123!';
      
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          password: newPassword,
          confirmPassword: newPassword
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم إعادة تعيين كلمة المرور بنجاح، يرجى تسجيل الدخول');

      // Check if password was updated and reset fields cleared
      const updatedUser = await userModel.findById(testUser._id).select('+password');
      expect(updatedUser.forgetCode).toBeUndefined();
      expect(updatedUser.isForgetCodeVerified).toBe(false);
      
      // Verify new password works
      const isValid = await bcryptjs.compare(newPassword, updatedUser.password);
      expect(isValid).toBe(true);
    });

    it('should fail when passwords do not match', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          password: 'NewPassword123!',
          confirmPassword: 'DifferentPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('كلمة المرور وتأكيدها غير متطابقين');
    });

    it('should fail when forget code is not verified', async () => {
      // Mark code as not verified
      await userModel.findByIdAndUpdate(testUser._id, {
        isForgetCodeVerified: false
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('لم يتم التحقق من رمز إعادة التعيين');
    });
  });

  describe('POST /api/auth/refresh-token', () => {
    let refreshToken;

    beforeEach(async () => {
      // Generate refresh token
      refreshToken = jwt.sign(
        { id: testUser._id, tokenType: 'refresh' },
        process.env.REFRESH_TOKEN_KEY,
        { expiresIn: '30d' }
      );

      // Save refresh token to database
      await tokenModel.create({
        userId: testUser._id,
        accessToken: 'old-access-token',
        refreshToken: refreshToken,
        userAgent: 'test-agent',
        isValid: true
      });
    });

    it('should refresh token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم تحديث رمز الوصول بنجاح');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should fail with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({ refreshToken: 'invalid-token' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with missing refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh-token')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('رمز التحديث مطلوب');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم تسجيل الخروج بنجاح');
    });

    it('should logout with specific refresh token', async () => {
      const refreshToken = 'test-refresh-token';
      
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ refreshToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم تسجيل الخروج بنجاح');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user successfully', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم جلب بيانات المستخدم بنجاح');
      expect(response.body.data._id).toBe(testUser._id.toString());
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/fcm-token', () => {
    const fcmToken = 'test-fcm-token-123';

    it('should update FCM token successfully', async () => {
      const response = await request(app)
        .post('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ fcmToken });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('تم تحديث رمز الإشعارات بنجاح');
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/auth/fcm-token')
        .send({ fcmToken });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should fail without FCM token', async () => {
      const response = await request(app)
        .post('/api/auth/fcm-token')
        .set('Authorization', `Bearer ${testToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('رمز FCM مطلوب');
    });
  });

  describe('Authentication Middleware Tests', () => {
    it('should authenticate valid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${testToken}`);

      expect(response.status).toBe(200);
    });

    it('should reject invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
    });

    it('should reject missing authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject malformed authorization header', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
    });
  });

  describe('Integration Tests - Complete Auth Flow', () => {
    it('should complete full registration and login flow', async () => {
      const userData = {
        email: 'integration@example.com',
        password: 'IntegrationTest123!',
        confirmPassword: 'IntegrationTest123!',
        displayName: 'Integration Test User',
        role: 'user'
      };

      // 1. Register
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(registerResponse.status).toBe(201);
      const { accessToken, refreshToken } = registerResponse.body.data;

      // 2. Get user profile
      const profileResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(profileResponse.status).toBe(200);
      expect(profileResponse.body.data.email).toBe(userData.email);

      // 3. Logout
      const logoutResponse = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken });

      expect(logoutResponse.status).toBe(200);

      // 4. Login again
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: userData.email,
          password: userData.password
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.data).toHaveProperty('accessToken');
    });

    it('should complete password reset flow', async () => {
      // 1. Request password reset
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testUser.email });

      expect(forgotResponse.status).toBe(200);

      // Get the forget code from database
      const user = await userModel.findById(testUser._id);
      const forgetCode = user.forgetCode;

      // 2. Verify forget code
      const verifyResponse = await request(app)
        .post('/api/auth/verify-forget-code')
        .send({
          email: testUser.email,
          forgetCode
        });

      expect(verifyResponse.status).toBe(200);

      // 3. Reset password
      const newPassword = 'NewIntegrationPassword123!';
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: testUser.email,
          password: newPassword,
          confirmPassword: newPassword
        });

      expect(resetResponse.status).toBe(200);

      // 4. Login with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: newPassword
        });

      expect(loginResponse.status).toBe(200);
    });
  });
});
