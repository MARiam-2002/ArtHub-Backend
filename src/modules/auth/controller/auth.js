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
 * Helper function to generate JWT token
 * @param {Object} user - User object
 * @returns {string} - JWT token
 */
const generateToken = user =>
  jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.TOKEN_KEY,
    { expiresIn: '30d' }
  );

/**
 * Helper function to save token in database
 * @param {string} token - JWT token
 * @param {string} userId - User ID
 * @param {string} userAgent - User agent string
 * @returns {Promise<Object>} - Saved token object
 */
const saveToken = async (token, userId, userAgent) => {
  try {
    // Delete any existing tokens for this user first
    await tokenModel.findOneAndDelete({ user: userId });

    // Create new token
    return await tokenModel.create({
      token,
      user: userId,
      agent: userAgent || 'unknown'
    });
  } catch (error) {
    console.warn('Failed to save token:', error);
    // Return null but don't fail the operation
    return null;
  }
};

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req, res, next) => {
  try {
    // Ensure database connection first
    if (!(await ensureConnection(next))) {
      return; // Connection failed, error already sent
    }

    // Extract data from request body
    const { displayName, email, password, phoneNumber } = req.body;

    // Check if user already exists
    try {
      const existingUser = await userModel.findOne({ email });

      if (existingUser) {
        return next(new Error('البريد الإلكتروني مسجل بالفعل', { cause: 409 }));
      }
    } catch (findError) {
      console.error('User lookup error:', findError);
      return handleDatabaseError(findError, next);
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, parseInt(process.env.SALT_ROUND || 10));

    // Create new user
    let newUser;
    try {
      newUser = await userModel.create({
        displayName,
        email,
        password: hashedPassword,
        phoneNumber,
        role: 'user'
      });
    } catch (createError) {
      console.error('User creation error:', createError);
      return handleDatabaseError(createError, next);
    }

    // Generate token
    const token = generateToken(newUser);

    // Return success response
    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: {
        _id: newUser._id,
        displayName: newUser.displayName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return handleDatabaseError(error, next);
  }
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req, res, next) => {
  try {
    // Ensure database connection first
    if (!(await ensureConnection(next))) {
      return; // Connection failed, error already sent
    }

    const { email, password } = req.body;
    const invalidMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';

    // Find user
    let user;
    try {
      user = await userModel.findOne({ email }).select('+password');

      if (!user) {
        return next(new Error(invalidMessage, { cause: 400 }));
      }
    } catch (findError) {
      console.error('User lookup error:', findError);
      return handleDatabaseError(findError, next);
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new Error(invalidMessage, { cause: 400 }));
    }

    // Generate token
    const token = generateToken(user);

    // Save token to database
    await saveToken(token, user._id, req.headers['user-agent']);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح.',
      data: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        job: user.job,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return handleDatabaseError(error, next);
  }
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

    // Generate token
    const token = generateToken(user);

    // Save token to database
    await saveToken(token, user._id, req.headers['user-agent']);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح باستخدام البصمة',
      data: {
        _id: user._id,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
        token
      }
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
 * Send password reset code
 * @route POST /api/auth/forgot-password
 */
export const sendForgetCode = asyncHandler(async (req, res, next) => {
  // Ensure database connection first
  if (!(await ensureConnection(next))) {
    return; // Connection failed, error already sent
  }

  const { email } = req.body;

  // Find user by email
  const user = await userModel.findOne({ email });

  // For security reasons, don't reveal if user exists or not
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'إذا كان البريد الإلكتروني صحيحًا، سيتم إرسال رمز إعادة تعيين كلمة المرور.'
    });
  }

  // Generate random 4-digit code
  const code = crypto.randomInt(1000, 9999).toString();

  // Save code to user
  user.forgetCode = code;
  await user.save();

  try {
    // Send email with reset code
    const emailSent = await sendEmail({
      to: email,
      subject: 'إعادة تعيين كلمة المرور',
      html: resetPassword(code)
    });

    if (!emailSent) {
      return next(new Error('حدث خطأ أثناء إرسال البريد الإلكتروني.', { cause: 500 }));
    }

    return res.status(200).json({
      success: true,
      message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
    });
  } catch (error) {
    console.error('Email sending error:', error);
    return next(new Error('فشل في إرسال البريد الإلكتروني، حاول مرة أخرى.', { cause: 500 }));
  }
});

/**
 * Verify email verification code
 * @route PATCH /api/auth/VerifyCode
 */
export const VerifyCode = asyncHandler(async (req, res, next) => {
  const { email, verificationCode } = req.body;

  // Find user by email
  const user = await userModel.findOne({ email });

  if (!user || !user.verificationCode) {
    return res.status(400).json({
      success: false,
      message: 'يرجى طلب كود تحقق جديد أولاً.'
    });
  }

  // Verify code
  if (user.verificationCode !== verificationCode) {
    return res.status(400).json({
      success: false,
      message: 'رمز التحقق غير صحيح!'
    });
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.verificationCode = null;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'تم التحقق من البريد الإلكتروني بنجاح.'
  });
});

/**
 * Verify password reset code
 * @route POST /api/auth/verify-code
 */
export const verifyForgetCode = asyncHandler(async (req, res, next) => {
  const { email, forgetCode } = req.body;

  // Find user by email
  const user = await userModel.findOne({ email });

  if (!user || !user.forgetCode) {
    return res.status(400).json({
      success: false,
      message: 'يرجى طلب كود جديد أولاً.'
    });
  }

  // Verify code
  if (user.forgetCode !== forgetCode) {
    return res.status(400).json({
      success: false,
      message: 'رمز التحقق غير صحيح!'
    });
  }

  // Mark code as verified
  user.forgetCode = null;
  user.isForgetCodeVerified = true;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'تم التحقق من الرمز بنجاح. يمكنك الآن إعادة تعيين كلمة المرور.'
  });
});

/**
 * Reset password using verified code
 * @route POST /api/auth/reset-password
 */
export const resetPasswordByCode = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await userModel.findOne({ email });

  if (!user || !user.isForgetCodeVerified) {
    return res.status(400).json({
      success: false,
      message: 'يرجى التحقق من الكود أولاً.'
    });
  }

  // Hash new password
  const hashedPassword = await bcryptjs.hash(password, parseInt(process.env.SALT_ROUND || 10));

  // Update password and reset verification flag
  user.password = hashedPassword;
  user.isForgetCodeVerified = false;
  await user.save();

  // Invalidate all tokens for this user
  await tokenModel.updateMany({ user: user._id }, { isValid: false });

  return res.status(200).json({
    success: true,
    message: 'تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.'
  });
});

/**
 * Update FCM token for push notifications
 * @route POST /api/auth/fcm-token
 */
export const updateFCMToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body;

  if (!fcmToken) {
    return next(new Error('رمز الإشعارات مطلوب', { cause: 400 }));
  }

  const user = await userModel.findById(req.user._id);

  if (!user) {
    return next(new Error('المستخدم غير موجود', { cause: 404 }));
  }

  // Update the FCM token
  user.fcmToken = fcmToken;
  await user.save();

  // Update token in notification system
  const updated = await updateUserFCMToken(user._id, fcmToken);

  if (!updated) {
    console.warn(`Warning: Failed to update FCM token for user ${user._id} in notification system`);
  }

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

  // Generate JWT token
  const token = generateToken(user);

  // Save token to database
  await saveToken(token, user._id, req.headers['user-agent']);

  return res.status(200).json({
    success: true,
    message: `تم تسجيل الدخول بنجاح بواسطة ${provider || 'حساب خارجي'}`,
    data: {
      _id: user._id,
      displayName: user.displayName,
      email: user.email,
      profileImage: user.profileImage,
      role: user.role,
      job: user.job,
      token
    }
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
