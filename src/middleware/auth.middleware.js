import admin from '../utils/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import userModel from '../../DB/models/user.model.js';
import tokenModel from '../../DB/models/token.model.js';

/**
 * Generate JWT tokens for authenticated users
 * @param {Object} user - User object
 * @returns {Object} - Object containing access token and refresh token
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
 * Save token pair to database
 * @param {string} userId - User ID
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {string} userAgent - User agent string
 * @returns {Promise<Object>} - Saved token object
 */
const saveTokenPair = async (userId, accessToken, refreshToken, userAgent) => {
  try {
    return await tokenModel.createTokenPair(userId, accessToken, refreshToken, userAgent);
  } catch (error) {
    console.warn('Failed to save token pair:', error);
    return null;
  }
};

/**
 * Verify Firebase ID token and create/find user
 * @param {string} firebaseToken - Firebase ID token
 * @returns {Promise<Object>} - User object with tokens
 */
const verifyFirebaseTokenInternal = async (firebaseToken) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
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

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      throw new Error('تم تعطيل هذا الحساب');
    }

    return user;
  } catch (error) {
    console.error('Firebase token verification error:', error);
    throw error;
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {Promise<Object>} - User object
 */
const verifyJWTToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);
    
    // Check if token exists in database and is valid
    const tokenDoc = await tokenModel.findValidToken(token);
    if (!tokenDoc) {
      throw new Error('رمز المصادقة غير صالح أو تم إبطاله');
    }

    // Get user from database
    const user = await userModel.findById(decoded.id).select('-password');
    if (!user) {
      throw new Error('المستخدم غير موجود');
    }

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      throw new Error('تم تعطيل هذا الحساب');
    }

    return user;
  } catch (error) {
    console.error('JWT token verification error:', error);
    throw error;
  }
};

/**
 * Main authentication middleware
 * Supports both Firebase and JWT tokens
 */
const authenticate = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new Error('لم يتم توفير رمز المصادقة', { cause: 401 }));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
    }

    let user;
    
    // Try Firebase token first (longer tokens)
    if (token.length > 500) {
      try {
        user = await verifyFirebaseTokenInternal(token);
      } catch (firebaseError) {
        // If Firebase fails, try JWT
        try {
          user = await verifyJWTToken(token);
        } catch (jwtError) {
          return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
        }
      }
    } else {
      // Try JWT first (shorter tokens)
      try {
        user = await verifyJWTToken(token);
      } catch (jwtError) {
        // If JWT fails, try Firebase
        try {
          user = await verifyFirebaseTokenInternal(token);
        } catch (firebaseError) {
          return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
        }
      }
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return next(new Error('فشل في التحقق من الهوية', { cause: 401 }));
  }
});

/**
 * Optional authentication middleware
 * Continues even if authentication fails
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }

    let user;
    
    // Try Firebase token first (longer tokens)
    if (token.length > 500) {
      try {
        user = await verifyFirebaseTokenInternal(token);
      } catch (firebaseError) {
        // If Firebase fails, try JWT
        try {
          user = await verifyJWTToken(token);
        } catch (jwtError) {
          return next();
        }
      }
    } else {
      // Try JWT first (shorter tokens)
      try {
        user = await verifyJWTToken(token);
      } catch (jwtError) {
        // If JWT fails, try Firebase
        try {
          user = await verifyFirebaseTokenInternal(token);
        } catch (firebaseError) {
          return next();
        }
      }
    }

    // Attach user to request if found
    if (user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    // In optional auth, we don't want to throw an error, just continue
    next();
  }
});

/**
 * Role-based authorization middleware
 * @param {...string} roles - Allowed roles
 * @returns {Function} - Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بالوصول إلى هذا المورد'
      });
    }
    next();
  };
};

// --- Single, consolidated export block ---
export {
  generateTokens,
  saveTokenPair,
  verifyFirebaseTokenInternal,
  authenticate,
  optionalAuth,
  authorize
};
