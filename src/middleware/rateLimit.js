import rateLimit from 'express-rate-limit';

/**
 * Default rate limiter for API routes
 * Limits to 100 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى للطلبات، يرجى المحاولة لاحقًا',
    status: 429
  }
});

/**
 * Strict rate limiter for authentication routes
 * Limits to 10 requests per hour per IP
 */
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول، يرجى المحاولة لاحقًا',
    status: 429
  }
});

/**
 * Rate limiter for password reset attempts
 * Limits to 5 requests per hour per IP
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 requests per hour
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لمحاولات إعادة تعيين كلمة المرور، يرجى المحاولة لاحقًا',
    status: 429
  }
});

/**
 * Rate limiter for image uploads
 * Limits to 20 uploads per hour per user
 */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.user?._id || req.ip, // Use user ID if authenticated, otherwise IP
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لعمليات رفع الصور، يرجى المحاولة لاحقًا',
    status: 429
  }
});

/**
 * Rate limiter for search queries
 * Limits to 60 searches per minute per IP
 */
export const searchLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 searches per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'تم تجاوز الحد الأقصى لعمليات البحث، يرجى المحاولة لاحقًا',
    status: 429
  }
});

export default {
  apiLimiter,
  authLimiter,
  passwordResetLimiter,
  uploadLimiter,
  searchLimiter
};
