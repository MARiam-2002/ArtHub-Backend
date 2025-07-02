/**
 * Utility functions for standardized error handling
 */

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} [details] - Additional error details
 * @returns {Object} Standardized error response object
 */
export const createErrorResponse = (message, statusCode = 400, details = null) => ({
  success: false,
  message,
  statusCode,
  ...(details && { details })
});

/**
 * Handle database errors and convert to appropriate API responses
 * @param {Error} error - The caught error
 * @param {Function} next - Express next function
 */
export const handleDatabaseError = (error, next) => {
  console.error('Database error:', error);

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern)[0];
    return next(
      new Error(`${field} موجود بالفعل، يرجى استخدام قيمة أخرى`, { cause: 409 })
    );
  }

  // MongoDB validation error
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return next(
      new Error(`خطأ في التحقق من البيانات: ${errors.join(', ')}`, { cause: 400 })
    );
  }

  // MongoDB cast error (invalid ID)
  if (error.name === 'CastError') {
    return next(
      new Error(`معرف غير صالح: ${error.value}`, { cause: 400 })
    );
  }

  // MongoDB connection errors
  if (
    error.name === 'MongoNetworkError' ||
    error.name === 'MongoServerSelectionError' ||
    (error.name === 'MongooseError' && error.message.includes('buffering timed out'))
  ) {
    return next(
      new Error('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا', { cause: 503 })
    );
  }

  // Default error
  return next(
    new Error('حدث خطأ داخلي في الخادم', { cause: 500 })
  );
};

/**
 * Async handler to catch errors in async route handlers
 * @param {Function} fn - Async function to wrap
 * @returns {Function} Express middleware function
 */
export const asyncErrorHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Global error handler middleware
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.cause || err.statusCode || 500;
  const message = err.message || 'حدث خطأ داخلي في الخادم';

  res.status(statusCode).json({
    success: false,
    message,
    statusCode,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

export default {
  createErrorResponse,
  handleDatabaseError,
  asyncErrorHandler,
  globalErrorHandler
}; 