import { asyncHandler } from '../utils/asyncHandler.js';
import admin from '../utils/firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';
import jwt from 'jsonwebtoken';
import tokenModel from '../../DB/models/token.model.js';

/**
 * Generate JWT tokens for authenticated users
 * @param {Object} user - User object
 * @returns {Object} - Object containing access token and refresh token
 */
const generateTokens = user => {
  // Generate access token
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.TOKEN_KEY,
    { expiresIn: '2h' }
  );
  
  // Generate refresh token
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
 * Save token pair to database
 * @param {string} userId - User ID
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {string} userAgent - User agent string
 * @returns {Promise<Object>} - Saved token object
 */
const saveTokenPair = async (userId, accessToken, refreshToken, userAgent) => {
  try {
    return await tokenModel.createTokenPair(
      userId, 
      accessToken, 
      refreshToken, 
      userAgent
    );
  } catch (error) {
    console.warn('Failed to save token pair:', error);
    return null;
  }
};

/**
 * Middleware to verify Firebase ID token and attach user to request
 * Works with both web and mobile Firebase Authentication
 * 
 * @swagger
 * components:
 *   securitySchemes:
 *     firebaseAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Firebase ID token obtained from Firebase Authentication
 */
export const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  try {
    // Check for Firebase token in Authorization header
    const firebaseToken = req.headers.authorization?.split('Bearer ')[1];

    if (!firebaseToken) {
      return next(new Error('لم يتم توفير رمز المصادقة', { cause: 401 }));
    }

    // Verify the token with Firebase Admin
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    } catch (error) {
      console.error('Firebase token verification error:', error);
      return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
    }

    if (!decodedToken) {
      return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
    }

    // Extract user information from token
    const userInfo = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'مستخدم جديد',
      picture: decodedToken.picture || '',
      emailVerified: decodedToken.email_verified || false,
      phoneNumber: decodedToken.phone_number || null,
      provider: decodedToken.firebase?.sign_in_provider?.split('.')[0] || 'firebase'
    };

    // Find or create user based on Firebase UID
    let user = await userModel.findOne({ firebaseUid: userInfo.uid });

    // If user not found by UID, try email if available
    if (!user && userInfo.email) {
      user = await userModel.findOne({ email: userInfo.email });
      
      // If found by email, update the Firebase UID
      if (user) {
        user.firebaseUid = userInfo.uid;
        user.isVerified = userInfo.emailVerified;
        if (!user.profileImage?.url && userInfo.picture) {
          user.profileImage = { url: userInfo.picture };
        }
        await user.save();
      }
    }

    // If still not found, create new user
    if (!user) {
      // Create new user if first time login with Firebase
      user = await userModel.create({
        firebaseUid: userInfo.uid,
        email: userInfo.email,
        displayName: userInfo.name,
        profileImage: userInfo.picture ? { url: userInfo.picture } : undefined,
        phoneNumber: userInfo.phoneNumber,
        isVerified: userInfo.emailVerified,
        role: 'user',
        socialProvider: userInfo.provider
      });
    }

    // Attach the user to the request object
    req.user = {
      _id: user._id,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      profileImage: user.profileImage
    };

    next();
  } catch (error) {
    console.error('Firebase auth error:', error);
    return next(new Error('فشل التحقق من الهوية', { cause: 401 }));
  }
});

/**
 * Optional Firebase authentication middleware
 * Attaches user to request if token is valid, but continues if not
 */
export const optionalFirebaseAuth = asyncHandler(async (req, res, next) => {
  try {
    // Check for Firebase token in Authorization header
    const firebaseToken = req.headers.authorization?.split('Bearer ')[1];

    // If no token, just continue
    if (!firebaseToken) {
      return next();
    }

    // Verify the token with Firebase Admin
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    } catch (error) {
      // If token verification fails, just continue without user
      return next();
    }

    if (!decodedToken) {
      return next();
    }

    // Extract user information from token
    const userInfo = {
      uid: decodedToken.uid,
      email: decodedToken.email || null,
      name: decodedToken.name || decodedToken.email?.split('@')[0] || 'مستخدم جديد',
      picture: decodedToken.picture || '',
      emailVerified: decodedToken.email_verified || false,
      phoneNumber: decodedToken.phone_number || null
    };

    // Find user based on Firebase UID
    const user = await userModel.findOne({ firebaseUid: userInfo.uid });

    // If user found, attach to request
    if (user) {
      req.user = {
        _id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        profileImage: user.profileImage
      };
    }

    next();
  } catch (error) {
    // In case of any error, just continue without user
    console.warn('Optional Firebase auth error:', error);
    next();
  }
});

/**
 * Convert Firebase user to JWT token for standard API endpoints
 */
export const firebaseToJWT = asyncHandler(async (req, res, next) => {
  // Skip if no user from Firebase auth
  if (!req.user) {
    return next(new Error('لم يتم توفير بيانات المستخدم', { cause: 401 }));
  }

  try {
    // Get the user from database
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      return next(new Error('تم تعطيل هذا الحساب', { cause: 403 }));
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Save token pair to database
    await saveTokenPair(user._id, accessToken, refreshToken, req.headers['user-agent']);

    // Add tokens to user object
    req.user.accessToken = accessToken;
    req.user.refreshToken = refreshToken;

    next();
  } catch (error) {
    console.error('Error converting Firebase auth to JWT:', error);
    next(new Error('فشل في إنشاء جلسة', { cause: 500 }));
  }
});

export default { verifyFirebaseToken, firebaseToJWT, optionalFirebaseAuth };
