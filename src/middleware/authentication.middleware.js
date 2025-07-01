import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import tokenModel from '../../DB/models/token.model.js';
import userModel from '../../DB/models/user.model.js';

/**
 * Authentication middleware to verify user token and set user in request
 * This middleware should be used on protected routes that require authentication
 * 
 * @swagger
 * components:
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login or registration
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const isAuthenticated = asyncHandler(async (req, res, next) => {
  // Check if token exists in headers
  const token = req.headers['authorization']?.split(' ')[1] || req.headers['token'];

  if (!token) {
    return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
  }

  try {
    // Verify JWT token
    const decoded = jwt.verify(token, process.env.TOKEN_KEY);

    // Check if token exists in database and is valid
    const tokenRecord = await tokenModel.findValidToken(token);

    if (!tokenRecord) {
      return next(new Error('هذا التوكن غير صالح أو تم تسجيل الخروج', { cause: 403 }));
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

    // Set user in request object for use in subsequent middleware/routes
    req.user = user;
    return next();
  } catch (error) {
    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return next(new Error('التوكن غير صالح', { cause: 401 }));
    }

    if (error.name === 'TokenExpiredError') {
      return next(new Error('انتهت صلاحية التوكن', { cause: 401 }));
    }

    // Handle database connection errors
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return next(
        new Error('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا', { cause: 503 })
      );
    }

    // Handle other database errors
    if (
      error.name === 'MongoError' ||
      error.name === 'MongoServerError' ||
      error.name === 'MongoNetworkError' ||
      error.name === 'MongoServerSelectionError'
    ) {
      return next(
        new Error('خطأ في قاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا', { cause: 503 })
      );
    }

    // Pass other errors to the error handler
    console.error('Authentication error:', error);
    return next(error);
  }
});

/**
 * Role-based authorization middleware
 * This middleware should be used after isAuthenticated to check user roles
 * 
 * @swagger
 * components:
 *   schemas:
 *     RoleAuthorization:
 *       type: object
 *       properties:
 *         allowedRoles:
 *           type: array
 *           items:
 *             type: string
 *             enum: [user, artist, admin]
 * 
 * @param {Array} allowedRoles - Array of roles allowed to access the route
 * @returns {Function} - Express middleware function
 */
export const authorizeRoles = allowedRoles =>
  asyncHandler(async (req, res, next) => {
    // Check if user exists in request (set by isAuthenticated)
    if (!req.user) {
      return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
    }

    // Check if user role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return next(new Error('غير مصرح لك بالوصول إلى هذا المورد', { cause: 403 }));
    }

    next();
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
 * Middleware to invalidate user token (logout)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const invalidateToken = asyncHandler(async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1] || req.headers['token'];
    
    if (!token) {
      return next(new Error('لم يتم توفير رمز المصادقة', { cause: 400 }));
    }
    
    const tokenRecord = await tokenModel.findOneAndUpdate(
      { token },
      { isValid: false },
      { new: true }
    );
    
    if (!tokenRecord) {
      return next(new Error('رمز المصادقة غير موجود', { cause: 404 }));
    }
    
    res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Middleware to invalidate all user tokens (logout from all devices)
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const invalidateAllTokens = asyncHandler(async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) {
      return next(new Error('يجب تسجيل الدخول أولاً', { cause: 401 }));
    }
    
    await tokenModel.invalidateAllUserTokens(req.user._id);
    
    res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح'
    });
  } catch (error) {
    next(error);
  }
});
