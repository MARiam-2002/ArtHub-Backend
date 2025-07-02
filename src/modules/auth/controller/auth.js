import userModel from '../../../../DB/models/user.model.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../../utils/sendEmails.js';
import { resetPassword } from '../../../utils/generateHtml.js';
import tokenModel from '../../../../DB/models/token.model.js';
import admin from '../../../utils/firebaseAdmin.js';
import { updateUserFCMToken } from '../../../utils/pushNotifications.js';
import mongoose from 'mongoose';
import { ensureDatabaseConnection } from '../../../utils/mongodbUtils.js';

/**
 * Helper function to ensure database connection before operations
 * @param {Function} next - Express next function
 * @returns {Promise<boolean>} - True if connection is successful, false otherwise
 */
const ensureConnection = async next => {
  try {
    const isConnected = await ensureDatabaseConnection(true);
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    return true;
  } catch (error) {
    console.error('Database connection error:', error);
    next(
      new Error('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا', { cause: 503 })
    );
    return false;
  }
};

/**
 * Helper function to generate JWT tokens
 * @param {Object} user - User object
 * @returns {Object} - Access and refresh tokens
 */
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.TOKEN_KEY,
    { expiresIn: '2h' }
  );
  
  const refreshToken = jwt.sign(
    {
      id: user._id,
      tokenType: 'refresh'
    },
    process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY,
    { expiresIn: '30d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Helper function to create user response
 * @param {Object} user - User object
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} - User response data
 */
const createUserResponse = (user, accessToken, refreshToken) => ({
  _id: user._id,
  displayName: user.displayName,
  email: user.email,
  role: user.role,
  profileImage: user.profileImage,
  accessToken,
  refreshToken
});

/**
 * Register new user
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req, res, next) => {
  const { email, password, confirmPassword, displayName } = req.body;

  // Check if email already exists
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return next(new Error('البريد الإلكتروني مستخدم بالفعل', { cause: 409 }));
  }

  // Check password confirmation
  if (password !== confirmPassword) {
    return next(new Error('كلمة المرور وتأكيدها غير متطابقين', { cause: 400 }));
  }

  // Hash password
  const hashedPassword = await bcryptjs.hash(password, parseInt(process.env.SALT_ROUNDS) || 10);

  // Create user
  const user = await userModel.create({
    email,
    password: hashedPassword,
    displayName
  });

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save token pair to database
  await tokenModel.createTokenPair(
    user._id, 
    accessToken, 
    refreshToken, 
    req.headers['user-agent']
  );

  // Return success response
  return res.status(201).json({
    success: true,
    message: 'تم إنشاء الحساب بنجاح',
    data: createUserResponse(user, accessToken, refreshToken)
  });
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const invalidMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';

  // Find user
  const user = await userModel.findOne({ email }).select('+password');
  if (!user) {
    return next(new Error(invalidMessage, { cause: 400 }));
  }

  // Check if user is active
  if (!user.isActive) {
    return next(new Error('تم تعليق الحساب، يرجى التواصل مع الدعم الفني', { cause: 401 }));
  }

  // Verify password
  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new Error(invalidMessage, { cause: 400 }));
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save token pair to database
  await tokenModel.createTokenPair(
    user._id, 
    accessToken, 
    refreshToken, 
    req.headers['user-agent']
  );

  // Return success response
  return res.status(200).json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: createUserResponse(user, accessToken, refreshToken)
  });
});

/**
 * Login with fingerprint
 * @route POST /api/auth/login-with-fingerprint
 */
export const fingerprint = asyncHandler(async (req, res, next) => {
  try {
    // Ensure database connection first
    if (!(await ensureConnection(next))) {
      return; // Connection failed, error already sent
    }

    const { deviceId, fingerprintData } = req.body;
    const userId = req.user._id;

    // Find user by ID
    const user = await userModel.findById(userId);
    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    // Check if device is registered for this user
    const registeredDevice = user.devices?.find(device => device.deviceId === deviceId);
    if (!registeredDevice) {
      return next(new Error('الجهاز غير مسجل لهذا المستخدم', { cause: 400 }));
    }

    // Validate fingerprint data
    if (registeredDevice.fingerprintHash !== fingerprintData) {
      return next(new Error('بيانات البصمة غير صحيحة', { cause: 401 }));
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save token pair to database
    await tokenModel.createTokenPair(
      user._id, 
      accessToken, 
      refreshToken, 
      req.headers['user-agent']
    );

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح باستخدام البصمة',
      data: createUserResponse(user, accessToken, refreshToken)
    });
  } catch (error) {
    console.error('Fingerprint login error:', error);
    return handleDatabaseError(error, next);
  }
});

/**
 * Register device for fingerprint authentication
 * @route POST /api/auth/register-device-fingerprint
 */
export const registerDeviceForFingerprint = asyncHandler(async (req, res, next) => {
  try {
    const { deviceId, deviceName, fingerprintData } = req.body;
    const userId = req.user._id;

    // Find user by ID
    const user = await userModel.findById(userId);
    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    // Initialize devices array if it doesn't exist
    if (!user.devices) {
      user.devices = [];
    }

    // Check if device already registered
    const existingDeviceIndex = user.devices.findIndex(device => device.deviceId === deviceId);
    
    if (existingDeviceIndex >= 0) {
      // Update existing device
      user.devices[existingDeviceIndex] = {
        deviceId,
        deviceName,
        fingerprintHash: fingerprintData,
        registeredAt: new Date()
      };
    } else {
      // Add new device
      user.devices.push({
        deviceId,
        deviceName,
        fingerprintHash: fingerprintData,
        registeredAt: new Date()
      });
    }

    // Save user
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الجهاز بنجاح للمصادقة باستخدام البصمة',
      data: {
        deviceId,
        deviceName,
        registeredAt: new Date()
      }
    });
  } catch (error) {
    console.error('Device registration error:', error);
    return handleDatabaseError(error, next);
  }
});

/**
 * Remove device fingerprint
 * @route POST /api/auth/remove-device-fingerprint
 */
export const removeDeviceFingerprint = asyncHandler(async (req, res, next) => {
  try {
    const { deviceId } = req.body;
    const userId = req.user._id;

    // Find user by ID
    const user = await userModel.findById(userId);
    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    // Check if device exists
    if (!user.devices || !user.devices.some(device => device.deviceId === deviceId)) {
      return next(new Error('الجهاز غير مسجل لهذا المستخدم', { cause: 404 }));
    }

    // Remove device
    user.devices = user.devices.filter(device => device.deviceId !== deviceId);

    // Save user
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'تم إزالة الجهاز بنجاح',
      data: {
        deviceId
      }
    });
  } catch (error) {
    console.error('Device removal error:', error);
    return handleDatabaseError(error, next);
  }
});

/**
 * Send forget password code
 * @route POST /api/auth/forget-password
 */
export const sendForgetCode = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  // Find user
  const user = await userModel.findOne({ email });
  if (!user) {
    // Don't reveal if email exists for security
    return res.status(200).json({
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، سيتم إرسال رمز إعادة التعيين'
    });
  }

  // Generate 4-digit code
  const forgetCode = Math.floor(1000 + Math.random() * 9000).toString();

  // Update user with forget code
  await userModel.findByIdAndUpdate(user._id, {
    forgetCode,
    forgetCodeExpires: Date.now() + 10 * 60 * 1000 // 10 minutes
  });

  // Send email
  try {
    await sendEmail({
      to: email,
      subject: 'رمز إعادة تعيين كلمة المرور - ArtHub',
      html: resetPassword(forgetCode)
    });
  } catch (error) {
    console.error('Email sending failed:', error);
    // Still return success to not reveal email existence
  }

  return res.status(200).json({
    success: true,
    message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
  });
});

/**
 * Verify forget password code
 * @route POST /api/auth/verify-forget-code
 */
export const verifyForgetCode = asyncHandler(async (req, res, next) => {
  const { email, forgetCode } = req.body;

  // Find user with valid forget code
  const user = await userModel.findOne({
    email,
    forgetCode,
    forgetCodeExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new Error('رمز التحقق غير صحيح أو منتهي الصلاحية', { cause: 400 }));
  }

  // Mark code as verified
  await userModel.findByIdAndUpdate(user._id, {
    forgetCodeVerified: true
  });

  return res.status(200).json({
    success: true,
    message: 'تم التحقق من الرمز بنجاح'
  });
});

/**
 * Reset password by code
 * @route POST /api/auth/reset-password
 */
export const resetPasswordByCode = asyncHandler(async (req, res, next) => {
  const { email, password, confirmPassword } = req.body;

  // Check password confirmation
  if (password !== confirmPassword) {
    return next(new Error('كلمة المرور وتأكيدها غير متطابقين', { cause: 400 }));
  }

  // Find user with verified forget code
  const user = await userModel.findOne({
    email,
    forgetCodeVerified: true,
    forgetCodeExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new Error('يرجى التحقق من الكود أولاً', { cause: 400 }));
  }

  // Hash new password
  const hashedPassword = await bcryptjs.hash(password, parseInt(process.env.SALT_ROUNDS) || 10);

  // Update password and clear forget code data
  await userModel.findByIdAndUpdate(user._id, {
    password: hashedPassword,
    forgetCode: undefined,
    forgetCodeExpires: undefined,
    forgetCodeVerified: undefined
  });

  // Invalidate all existing tokens
  await tokenModel.invalidateAllUserTokens(user._id);

  return res.status(200).json({
    success: true,
    message: 'تم تحديث كلمة المرور بنجاح'
  });
});

/**
 * Update FCM token
 * @route POST /api/auth/fcm-token
 */
export const updateFCMToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body;
  const userId = req.user._id;

  // Update user's FCM token
  await updateUserFCMToken(userId, fcmToken);

  return res.status(200).json({
    success: true,
    message: 'تم تحديث رمز الإشعارات بنجاح'
  });
});

/**
 * Login with social provider
 * @route POST /api/auth/social-login
 */
export const socialLogin = asyncHandler(async (req, res, next) => {
  const { email, name, picture, uid, provider } = req.user;

  // Find or create user
  let user = await userModel.findOne({ email });

  if (!user) {
    // Create new user if they don't exist
    user = await userModel.create({
      email,
      displayName: name || email.split('@')[0],
      profileImage: {
        url: picture || undefined
      },
      socialId: uid,
      socialProvider: provider || 'firebase',
      isVerified: true, // Social auth users are considered verified
      job: 'مستخدم' // Default job title
    });
  } else if (!user.socialId) {
    // If user exists but doesn't have socialId (registered via email), link accounts
    user.socialId = uid;
    user.socialProvider = provider || 'firebase';
    if (!user.profileImage?.url && picture) {
      user.profileImage = { url: picture };
    }
    await user.save();
  }

  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);

  // Save token pair to database
  await tokenModel.createTokenPair(
    user._id, 
    accessToken, 
    refreshToken, 
    req.headers['user-agent']
  );

  return res.status(200).json({
    success: true,
    message: `تم تسجيل الدخول بنجاح بواسطة ${provider || 'حساب خارجي'}`,
    data: createUserResponse(user, accessToken, refreshToken)
  });
});

/**
 * Login with Firebase token
 * @route POST /api/auth/firebase
 */
export const firebaseLogin = asyncHandler(async (req, res, next) => {
  // User and tokens are already attached by middleware
  if (!req.user || !req.user.accessToken || !req.user.refreshToken) {
    return next(new Error('فشل في مصادقة المستخدم', { cause: 401 }));
  }

  return res.status(200).json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: createUserResponse(
      req.user,
      req.user.accessToken,
      req.user.refreshToken
    )
  });
});

/**
 * Helper function to handle database errors
 * @param {Error} error - Database error
 * @param {Function} next - Express next function
 */
function handleDatabaseError(error, next) {
  // MongoDB connection errors
  if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
    return next(
      new Error('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا', { cause: 503 })
    );
  }

  // Server selection errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongoServerSelectionError') {
    return next(new Error('تعذر الاتصال بخادم قاعدة البيانات', { cause: 503 }));
  }

  // Other database errors
  if (error.name === 'MongoError' || error.name === 'MongoServerError') {
    return next(new Error('خطأ في قاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا', { cause: 503 }));
  }

  // Duplicate key error
  if (error.code === 11000) {
    return next(new Error('البريد الإلكتروني مسجل بالفعل', { cause: 409 }));
  }

  // Generic error
  return next(new Error('حدث خطأ أثناء معالجة الطلب', { cause: 500 }));
}
