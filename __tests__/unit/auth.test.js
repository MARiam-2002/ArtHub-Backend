import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userModel from '../../DB/models/user.model.js';
import tokenModel from '../../DB/models/token.model.js';

// Mock Firebase Admin SDK
jest.mock('../../src/utils/firebaseAdmin.js', () => ({
  auth: jest.fn().mockReturnValue({
    verifyIdToken: jest.fn()
  })
}));

// Mock email sending
jest.mock('../../src/utils/sendEmails.js', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));

// Mock push notifications
jest.mock('../../src/utils/pushNotifications.js', () => ({
  updateUserFCMToken: jest.fn().mockResolvedValue(true)
}));

describe('Auth Controller', () => {
  let req, res, next;
  let testUser, testToken;
  
  // Import auth controller functions
  let authController;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/arthub-test';
    await mongoose.connect(mongoUri);
    
    // Import controller after mocks are set up
    authController = await import('../../src/modules/auth/controller/auth.js');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await userModel.deleteMany({});
    await tokenModel.deleteMany({});

    // Create test user
    const hashedPassword = await bcryptjs.hash('Password123!', 10);
    testUser = await userModel.create({
      email: 'test@example.com',
      password: hashedPassword,
      displayName: 'Test User',
      isActive: true
    });

    // Setup request, response, and next mocks
    req = {
      body: {},
      headers: {
        'authorization': 'Bearer valid_token',
        'user-agent': 'test-agent'
      },
      user: {
        _id: testUser._id,
        email: testUser.email,
        displayName: testUser.displayName,
        role: testUser.role
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await userModel.deleteMany({});
    await tokenModel.deleteMany({});
  });

  describe('User Registration', () => {
    beforeEach(() => {
      req.body = {
        email: 'newuser@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        displayName: 'New User'
      };
    });

    it('should register a new user successfully', async () => {
      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم إنشاء الحساب بنجاح',
          data: expect.objectContaining({
            email: 'newuser@example.com',
            displayName: 'New User',
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          })
        })
      );
    });

    it('should reject registration with existing email', async () => {
      req.body.email = testUser.email;
      
      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'البريد الإلكتروني مستخدم بالفعل',
          cause: 409
        })
      );
    });

    it('should reject registration with mismatched passwords', async () => {
      req.body.confirmPassword = 'DifferentPassword123!';
      
      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'كلمة المرور وتأكيدها غير متطابقين',
          cause: 400
        })
      );
    });
  });

  describe('User Login', () => {
    beforeEach(() => {
      req.body = {
        email: testUser.email,
        password: 'Password123!'
      };
    });

    it('should login user successfully', async () => {
      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          data: expect.objectContaining({
            email: testUser.email,
            displayName: testUser.displayName,
            accessToken: expect.any(String),
            refreshToken: expect.any(String)
          })
        })
      );
    });

    it('should reject login with invalid email', async () => {
      req.body.email = 'nonexistent@example.com';
      
      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          cause: 400
        })
      );
    });

    it('should reject login with invalid password', async () => {
      req.body.password = 'WrongPassword123!';
      
      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
          cause: 400
        })
      );
    });

    it('should reject login for inactive user', async () => {
      await userModel.findByIdAndUpdate(testUser._id, { isActive: false });
      
      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'تم تعليق الحساب، يرجى التواصل مع الدعم الفني',
          cause: 401
        })
      );
    });
  });

  describe('Password Reset Flow', () => {
    describe('Send Forget Code', () => {
      beforeEach(() => {
        req.body = { email: testUser.email };
      });

      it('should send forget code successfully', async () => {
        await authController.sendForgetCode(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
          })
        );

        // Check that forget code was saved
        const updatedUser = await userModel.findById(testUser._id);
        expect(updatedUser.forgetCode).toBeDefined();
        expect(updatedUser.forgetCodeExpires).toBeDefined();
      });

      it('should not reveal non-existent email', async () => {
        req.body.email = 'nonexistent@example.com';
        
        await authController.sendForgetCode(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: expect.stringContaining('إذا كان البريد الإلكتروني')
          })
        );
      });
    });

    describe('Verify Forget Code', () => {
      let forgetCode;

      beforeEach(async () => {
        forgetCode = '1234';
        await userModel.findByIdAndUpdate(testUser._id, {
          forgetCode,
          forgetCodeExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        req.body = {
          email: testUser.email,
          forgetCode
        };
      });

      it('should verify forget code successfully', async () => {
        await authController.verifyForgetCode(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'تم التحقق من الرمز بنجاح'
          })
        );

        // Check that code was marked as verified
        const updatedUser = await userModel.findById(testUser._id);
        expect(updatedUser.forgetCodeVerified).toBe(true);
      });

      it('should reject invalid forget code', async () => {
        req.body.forgetCode = '9999';
        
        await authController.verifyForgetCode(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
            cause: 400
          })
        );
      });

      it('should reject expired forget code', async () => {
        await userModel.findByIdAndUpdate(testUser._id, {
          forgetCodeExpires: Date.now() - 1000 // Expired
        });
        
        await authController.verifyForgetCode(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'رمز التحقق غير صحيح أو منتهي الصلاحية',
            cause: 400
          })
        );
      });
    });

    describe('Reset Password', () => {
      beforeEach(async () => {
        await userModel.findByIdAndUpdate(testUser._id, {
          forgetCode: '1234',
          forgetCodeExpires: Date.now() + 10 * 60 * 1000,
          forgetCodeVerified: true
        });

        req.body = {
          email: testUser.email,
          password: 'NewPassword123!',
          confirmPassword: 'NewPassword123!'
        };
      });

      it('should reset password successfully', async () => {
        await authController.resetPasswordByCode(req, res, next);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            success: true,
            message: 'تم تحديث كلمة المرور بنجاح'
          })
        );

        // Verify password was updated
        const updatedUser = await userModel.findById(testUser._id).select('+password');
        const isNewPasswordValid = await bcryptjs.compare('NewPassword123!', updatedUser.password);
        expect(isNewPasswordValid).toBe(true);
      });

      it('should reject reset without code verification', async () => {
        await userModel.findByIdAndUpdate(testUser._id, {
          forgetCodeVerified: false
        });
        
        await authController.resetPasswordByCode(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'يرجى التحقق من الكود أولاً',
            cause: 400
          })
        );
      });

      it('should reject mismatched passwords', async () => {
        req.body.confirmPassword = 'DifferentPassword123!';
        
        await authController.resetPasswordByCode(req, res, next);

        expect(next).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'كلمة المرور وتأكيدها غير متطابقين',
            cause: 400
          })
        );
      });
    });
  });

  describe('Firebase Authentication', () => {
    beforeEach(() => {
      req.user = {
        _id: 'firebase_user_id',
        email: 'firebase@example.com',
        displayName: 'Firebase User',
        role: 'user',
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token'
      };
    });

    it('should handle Firebase login successfully', async () => {
      await authController.firebaseLogin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم تسجيل الدخول بنجاح',
          data: expect.objectContaining({
            _id: 'firebase_user_id',
            email: 'firebase@example.com',
            displayName: 'Firebase User',
            accessToken: 'mock_access_token',
            refreshToken: 'mock_refresh_token'
          })
        })
      );
    });

    it('should handle missing user data', async () => {
      req.user = undefined;
      
      await authController.firebaseLogin(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'فشل في مصادقة المستخدم',
          cause: 401
        })
      );
    });

    it('should handle missing tokens', async () => {
      delete req.user.accessToken;
      
      await authController.firebaseLogin(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'فشل في مصادقة المستخدم',
          cause: 401
        })
      );
    });
  });

  describe('FCM Token Update', () => {
    beforeEach(() => {
      req.body = { fcmToken: 'test_fcm_token' };
    });

    it('should update FCM token successfully', async () => {
      await authController.updateFCMToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم تحديث رمز الإشعارات بنجاح'
        })
      );
    });
  });
});
