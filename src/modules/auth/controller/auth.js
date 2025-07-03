import userModel from '../../../../DB/models/user.model.js';
import { asyncHandler } from '../../../utils/errorHandler.js';
import { handleDatabaseError, handleAuthError } from '../../../utils/errorHandler.js';
import { generateTokens, saveTokenPair } from '../../../middleware/auth.middleware.js';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../../../utils/sendEmails.js';
import { resetPassword as resetPasswordTemplate } from '../../../utils/generateHtml.js';
import tokenModel from '../../../../DB/models/token.model.js';
import { updateUserFCMToken } from '../../../utils/pushNotifications.js';
import { ensureDatabaseConnection } from '../../../utils/mongodbUtils.js';

/**
 * Helper function to create user response object
 * @param {Object} user - User object
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} - User response object
 */
const createUserResponse = (user, accessToken, refreshToken) => ({
  _id: user._id,
  email: user.email,
  displayName: user.displayName,
  role: user.role,
  profileImage: user.profileImage,
  coverImages: user.coverImages,
  isVerified: user.isVerified,
  preferredLanguage: user.preferredLanguage,
  notificationSettings: user.notificationSettings,
  accessToken,
  refreshToken
});

/**
 * Register new user
 * @route POST /api/auth/register
 */
export const register = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { email, password, confirmPassword, displayName, job, role = 'user' } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      return next(new Error('كلمة المرور وتأكيدها غير متطابقين', { cause: 400 }));
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return next(new Error('البريد الإلكتروني مستخدم بالفعل', { cause: 409 }));
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create new user
    const user = await userModel.create({
      email,
      password: hashedPassword,
      displayName: displayName || email.split('@')[0], // Use email prefix if no displayName provided
      job: job || 'مستخدم',
      role,
      isActive: true
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save token pair
    await saveTokenPair(user._id, accessToken, refreshToken, req.headers['user-agent']);

    // Send success response
    return res.status(201).json({
      success: true,
      message: 'تم إنشاء الحساب بنجاح',
      data: createUserResponse(user, accessToken, refreshToken)
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Login user
 * @route POST /api/auth/login
 */
export const login = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { email, password } = req.body;

    // Find user by email (include password for verification)
    const user = await userModel.findOne({ email }).select('+password');
    if (!user) {
      return next(new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة', { cause: 400 }));
    }

    // Verify password
    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return next(new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة', { cause: 400 }));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new Error('تم تعطيل هذا الحساب، يرجى التواصل مع الدعم', { cause: 403 }));
    }

    if (user.isDeleted) {
      return next(new Error('هذا الحساب محذوف', { cause: 403 }));
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save token pair
    await saveTokenPair(user._id, accessToken, refreshToken, req.headers['user-agent']);

    // Update last active
    user.lastActive = new Date();
    await user.save();

    // Send success response
    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: createUserResponse(user, accessToken, refreshToken)
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Firebase login
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
 * Logout user
 * @route POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { refreshToken } = req.body;
    const userId = req.user._id;

    // If refresh token provided, invalidate specific token
    if (refreshToken) {
      await tokenModel.invalidateToken(refreshToken);
    } else {
      // Otherwise, invalidate all user tokens
      await tokenModel.invalidateAllUserTokens(userId);
    }

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Forgot password
 * @route POST /api/auth/forgot-password
 */
export const forgetPassword = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { email } = req.body;

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return next(new Error('لا يوجد حساب مرتبط بهذا البريد الإلكتروني', { cause: 404 }));
    }

    // Generate reset code
    const forgetCode = crypto.randomInt(1000, 9999).toString();

    // Save reset code to user
    user.forgetCode = forgetCode;
    user.isForgetCodeVerified = false;
    await user.save();

    // Send reset email
    try {
      const emailContent = resetPasswordTemplate(user.displayName, forgetCode);
      await sendEmail(email, 'إعادة تعيين كلمة المرور - ArtHub', emailContent);
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return next(new Error('فشل في إرسال رمز إعادة التعيين، يرجى المحاولة مرة أخرى', { cause: 500 }));
    }

    return res.status(200).json({
      success: true,
      message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Verify forget code
 * @route POST /api/auth/verify-forget-code
 */
export const verifyForgetCode = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { email, forgetCode } = req.body;

    // Find user with matching email and code
    const user = await userModel.findOne({ email, forgetCode });
    if (!user) {
      return next(new Error('الرمز غير صحيح أو منتهي الصلاحية', { cause: 400 }));
    }

    // Mark code as verified
    user.isForgetCodeVerified = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'تم التحقق من الرمز بنجاح، يمكنك الآن إعادة تعيين كلمة المرور'
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Reset password
 * @route POST /api/auth/reset-password
 */
export const resetPassword = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { email, password, confirmPassword } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      return next(new Error('كلمة المرور وتأكيدها غير متطابقين', { cause: 400 }));
    }

    // Find user with verified forget code
    const user = await userModel.findOne({ email, isForgetCodeVerified: true });
    if (!user) {
      return next(new Error('لم يتم التحقق من رمز إعادة التعيين', { cause: 400 }));
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Update user password and clear reset fields
    user.password = hashedPassword;
    user.forgetCode = undefined;
    user.isForgetCodeVerified = false;
    await user.save();

    // Invalidate all existing tokens for security
    await tokenModel.invalidateAllUserTokens(user._id);

    return res.status(200).json({
      success: true,
      message: 'تم إعادة تعيين كلمة المرور بنجاح، يرجى تسجيل الدخول'
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Refresh token
 * @route POST /api/auth/refresh-token
 */
export const refreshToken = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new Error('رمز التحديث مطلوب', { cause: 400 }));
    }

    // Verify refresh token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY);
    } catch (error) {
      return handleAuthError(error, next);
    }

    // Check if refresh token exists in database
    const tokenDoc = await tokenModel.findValidRefreshToken(refreshToken);
    if (!tokenDoc) {
      return next(new Error('رمز التحديث غير صالح أو منتهي الصلاحية', { cause: 401 }));
    }

    // Get user
    const user = await userModel.findById(decoded.id);
    if (!user || !user.isActive || user.isDeleted) {
      return next(new Error('المستخدم غير موجود أو معطل', { cause: 401 }));
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

    // Update token pair in database
    await tokenModel.updateTokenPair(tokenDoc._id, accessToken, newRefreshToken);

    return res.status(200).json({
      success: true,
      message: 'تم تحديث رمز الوصول بنجاح',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return handleAuthError(error, next);
  }
});

/**
 * Update FCM token for push notifications
 * @route POST /api/auth/fcm-token
 */
export const updateFCMToken = asyncHandler(async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    const userId = req.user._id;

    if (!fcmToken) {
      return next(new Error('رمز FCM مطلوب', { cause: 400 }));
    }

    // Update FCM token
    const result = await updateUserFCMToken(userId, fcmToken);
    if (!result) {
      return next(new Error('فشل في تحديث رمز الإشعارات', { cause: 500 }));
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث رمز الإشعارات بنجاح'
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Get current user profile
 * @route GET /api/auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user._id).select('-password');
    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    return res.status(200).json({
      success: true,
      message: 'تم جلب بيانات المستخدم بنجاح',
      data: user
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

export { generateTokens, saveTokenPair };
