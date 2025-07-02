import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import tokenModel from '../../DB/models/token.model.js';
import userModel from '../../DB/models/user.model.js';

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 * 
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login or registration
 */
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(new Error('لم يتم توفير رمز المصادقة', { cause: 401 }));
    }

    // Extract token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.TOKEN_KEY);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return next(new Error('انتهت صلاحية رمز المصادقة', { cause: 401 }));
      }
      return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
    }

    // Check if token exists in database and is valid
    const tokenDoc = await tokenModel.findValidToken(token);
    
    if (!tokenDoc) {
      return next(new Error('رمز المصادقة غير صالح أو تم إبطاله', { cause: 401 }));
    }

    // Get user from database
    const user = await userModel.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    // Check if user is active
    if (!user.isActive) {
      return next(new Error('تم تعطيل هذا الحساب', { cause: 403 }));
    }

    // Check if user is deleted
    if (user.isDeleted) {
      return next(new Error('تم حذف هذا الحساب', { cause: 403 }));
    }

    // Attach user to request
    req.user = user;
    
    // Continue
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return next(new Error('فشل في التحقق من الهوية', { cause: 500 }));
  }
});

/**
 * Role-based authorization middleware
 * Checks if user has required role
 * @param {...string} roles - Allowed roles
 * @returns {Function} - Express middleware
 */
export const allowedRoles = (...roles) => {
  return (req, res, next) => {
    // Check if user exists and has a role
    if (!req.user || !req.user.role) {
      return next(new Error('غير مصرح لك بالوصول', { cause: 403 }));
    }

    // Check if user's role is in allowed roles
    if (!roles.includes(req.user.role)) {
      return next(new Error('غير مصرح لك بالوصول لهذا المورد', { cause: 403 }));
    }

    // Continue
    next();
  };
};

/**
 * Invalidate current token (logout)
 * @route POST /api/auth/logout
 */
export const invalidateToken = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return next(new Error('لم يتم توفير رمز المصادقة', { cause: 400 }));
    }
    
    // Invalidate token
    const result = await tokenModel.invalidateToken(token);
    
    if (!result) {
      return next(new Error('رمز المصادقة غير موجود', { cause: 404 }));
    }
    
    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    console.error('Logout error:', error);
    return next(new Error('فشل في تسجيل الخروج', { cause: 500 }));
  }
});

/**
 * Invalidate all tokens for current user (logout from all devices)
 * @route POST /api/auth/logout-all
 */
export const invalidateAllTokens = asyncHandler(async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new Error('لم يتم توفير بيانات المستخدم', { cause: 400 }));
    }
    
    // Invalidate all tokens for user
    const result = await tokenModel.invalidateAllUserTokens(req.user._id);
    
    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
      data: result
    });
  } catch (error) {
    console.error('Logout all error:', error);
    return next(new Error('فشل في تسجيل الخروج من جميع الأجهزة', { cause: 500 }));
  }
});

/**
 * Middleware to verify user ownership of a resource
 * This middleware should be used after isAuthenticated to check resource ownership
 * 
 * @swagger
 * components:
 *   schemas:
 *     ResourceOwnership:
 *       type: object
 *       properties:
 *         resourceId:
 *           type: string
 *           format: uuid
 *           description: ID of the resource to check ownership for
 * 
 * @param {Function} getResourceUserId - Function to extract user ID from resource
 * @returns {Function} - Express middleware function
 */
export const isResourceOwner = getResourceUserId =>
  asyncHandler(async (req, res, next) => {
    // Check if user exists in request (set by isAuthenticated)
    if (!req.user) {
      return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
    }

    try {
      // Get resource owner ID using the provided function
      const resourceUserId = await getResourceUserId(req);

      if (!resourceUserId) {
        return next(new Error('المورد غير موجود', { cause: 404 }));
      }

      // Check if user is the owner of the resource
      if (resourceUserId.toString() !== req.user._id.toString()) {
        return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
      }

      next();
    } catch (error) {
      console.error('Resource ownership verification error:', error);
      return next(new Error('حدث خطأ أثناء التحقق من ملكية المورد', { cause: 500 }));
    }
  });

/**
 * Refresh token middleware to generate new access token
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
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
      return next(new Error('رمز التحديث غير صالح', { cause: 401 }));
    }
    
    // Find user by ID from token
    const user = await userModel.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }
    
    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      return next(new Error('تم تعطيل هذا الحساب', { cause: 403 }));
    }
    
    // Generate new access token
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.TOKEN_KEY,
      { expiresIn: '2h' }
    );
    
    // Save new token to database
    await tokenModel.create({
      user: user._id,
      token: accessToken,
      userAgent: req.headers['user-agent'] || 'unknown',
      expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours
    });
    
    res.status(200).json({
      success: true,
      message: 'تم تحديث رمز الوصول بنجاح',
      data: {
        token: accessToken
      }
    });
  } catch (error) {
    next(error);
  }
});
