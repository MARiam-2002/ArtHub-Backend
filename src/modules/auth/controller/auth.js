import userModel from '../../../../DB/models/user.model.js';
import { asyncHandler } from '../../../utils/errorHandler.js';
import { handleDatabaseError, handleAuthError } from '../../../utils/errorHandler.js';
import { generateTokens, saveTokenPair } from '../../../middleware/auth.middleware.js';
import bcrypt from 'bcrypt';
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
    
    const { email, password, confirmPassword, displayName, job, role = 'user', fingerprint } = req.body;

    // Validate password confirmation
    if (password !== confirmPassword) {
      return next(new Error('كلمة المرور وتأكيدها غير متطابقين', { cause: 400 }));
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return next(new Error('البريد الإلكتروني مستخدم بالفعل', { cause: 409 }));
    }

    // Check if fingerprint is already used (if provided)
    if (fingerprint) {
      const existingFingerprint = await userModel.findOne({ fingerprint });
      if (existingFingerprint) {
        return next(new Error('بصمة الجهاز مستخدمة بالفعل من قبل مستخدم آخر', { cause: 409 }));
      }
    }

    // Create new user - Hashing is handled by the pre-save hook in the model
    const user = await userModel.create({
      email,
      password, // Pass the plain password
      displayName: displayName || email.split('@')[0],
      job,
      role,
      fingerprint: fingerprint || undefined // Only set if provided
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

    // Verify password using the model's method
    const isPasswordValid = await user.comparePassword(password);
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
 * Login with device fingerprint
 * @route POST /api/auth/login-with-fingerprint
 */
export const loginWithFingerprint = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { fingerprint } = req.body;

    // Validate fingerprint
    if (!fingerprint) {
      return next(new Error('بصمة الجهاز مطلوبة', { cause: 400 }));
    }

    // Find user by fingerprint
    const user = await userModel.findOne({ fingerprint });
    if (!user) {
      return next(new Error('لم يتم العثور على حساب مرتبط بهذا الجهاز', { cause: 404 }));
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
      message: 'تم تسجيل الدخول بنجاح باستخدام بصمة الجهاز',
      data: createUserResponse(user, accessToken, refreshToken)
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});

/**
 * Update user fingerprint
 * @route POST /api/auth/update-fingerprint
 */
export const updateFingerprint = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { fingerprint } = req.body;
    const userId = req.user._id;

    // Validate fingerprint
    if (!fingerprint) {
      return next(new Error('بصمة الجهاز مطلوبة', { cause: 400 }));
    }

    // Check if fingerprint is already used by another user
    const existingUser = await userModel.findOne({ 
      fingerprint, 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return next(new Error('بصمة الجهاز مستخدمة بالفعل من قبل مستخدم آخر', { cause: 409 }));
    }

    // Update user fingerprint
    const user = await userModel.findByIdAndUpdate(
      userId,
      { fingerprint },
      { new: true }
    );

    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    return res.status(200).json({
      success: true,
      message: 'تم تحديث بصمة الجهاز بنجاح',
      data: {
        fingerprint: user.fingerprint
      }
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
    console.log('Starting forgetPassword process');
    await ensureDatabaseConnection();
    
    const { email } = req.body;
    console.log('Email received:', email);

    // Find user by email
    try {
      const user = await userModel.findOne({ email });
      console.log('User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        return next(new Error('لا يوجد حساب مرتبط بهذا البريد الإلكتروني', { cause: 404 }));
      }

      // Generate reset code
      const forgetCode = crypto.randomInt(1000, 9999).toString();
      console.log('Generated forget code');

      // Save reset code to user
      user.forgetCode = forgetCode;
      user.isForgetCodeVerified = false;
      await user.save();
      console.log('Saved forget code to user');

      // Send reset email
      try {
        console.log('Preparing email content with displayName:', user.displayName);
        const emailContent = resetPasswordTemplate(user.displayName || 'المستخدم', forgetCode);
        console.log('Email content generated successfully');
        
        await sendEmail({
          to: email,
          subject: 'إعادة تعيين كلمة المرور - ArtHub',
          html: emailContent
        });
        console.log('Email sent successfully');
      } catch (emailError) {
        console.error('Failed to send reset email:', emailError);
        return next(new Error('فشل في إرسال رمز إعادة التعيين، يرجى المحاولة مرة أخرى', { cause: 500 }));
      }

      return res.status(200).json({
        success: true,
        message: 'تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
      });
    } catch (userError) {
      console.error('Error finding or updating user:', userError);
      return next(new Error('حدث خطأ أثناء البحث عن المستخدم أو تحديث بياناته', { cause: 500 }));
    }
  } catch (error) {
    console.error('Unhandled error in forgetPassword:', error);
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

    // Set new password (hashing will be handled by pre-save hook)
    user.password = password;
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
      console.log('Auth controller - Decoded token:', decoded); // Log decoded token for debugging
      
      // We don't check tokenType here because some tokens might not have it
      // The database check below will ensure it's a valid refresh token
    } catch (error) {
      console.error('Auth controller - JWT verification error:', error); // Log the specific error
      return res.status(401).json({
        success: false,
        message: 'رمز التحديث غير صالح',
        errorCode: 'INVALID_TOKEN'
      });
    }

    // Check if refresh token exists in database
    console.log('Auth controller - Looking for refresh token in database:', refreshToken.substring(0, 20) + '...'); // Log partial token for security
    const tokenDoc = await tokenModel.findValidRefreshToken(refreshToken);
    console.log('Auth controller - Token found in database:', tokenDoc ? 'Yes' : 'No');
    
    // Get user directly from decoded token
    const user = await userModel.findById(decoded.id);
    if (!user || !user.isActive || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود أو معطل',
        errorCode: 'USER_DISABLED'
      });
    }
    
    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // If token document exists, update it, otherwise create a new one
    if (tokenDoc) {
      await tokenModel.updateTokenPair(tokenDoc._id, accessToken, newRefreshToken);
    } else {
      // Create a new token pair in database
      await tokenModel.createTokenPair(user._id, accessToken, newRefreshToken, req.headers['user-agent']);
    }
    
    return res.status(200).json({
      success: true,
      message: 'تم تحديث رمز الوصول بنجاح',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الرمز',
      errorCode: 'SERVER_ERROR'
    });
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
