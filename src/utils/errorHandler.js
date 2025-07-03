/**
 * Unified Error Handler for ArtHub Backend
 * Provides consistent error handling across the application
 */

/**
 * Get standardized error code for Flutter integration
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {string} - Standardized error code
 */
export const getErrorCode = (statusCode, message) => {
  // Common error codes
  const errorMap = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'TOO_MANY_REQUESTS',
    500: 'SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
    504: 'GATEWAY_TIMEOUT'
  };

  // Default to status-based code
  let code = errorMap[statusCode] || `ERROR_${statusCode}`;

  // Add more specific codes based on error message
  if (message) {
    const errorString = message.toLowerCase();
    
    if (errorString.includes('password')) {
      code = 'INVALID_PASSWORD';
    } else if (errorString.includes('email')) {
      code = 'INVALID_EMAIL';
    } else if (errorString.includes('token')) {
      code = 'INVALID_TOKEN';
    } else if (errorString.includes('file') && errorString.includes('size')) {
      code = 'FILE_TOO_LARGE';
    } else if (errorString.includes('file') && errorString.includes('format')) {
      code = 'INVALID_FILE_FORMAT';
    } else if (errorString.includes('limit')) {
      code = 'RATE_LIMIT_EXCEEDED';
    } else if (errorString.includes('permission') || errorString.includes('access')) {
      code = 'ACCESS_DENIED';
    } else if (errorString.includes('duplicate')) {
      code = 'DUPLICATE_ENTITY';
    } else if (errorString.includes('network')) {
      code = 'NETWORK_ERROR';
    } else if (errorString.includes('timeout')) {
      code = 'REQUEST_TIMEOUT';
    } else if (errorString.includes('validation')) {
      code = 'VALIDATION_ERROR';
    } else if (errorString.includes('database') || errorString.includes('mongo')) {
      code = 'DATABASE_ERROR';
    } else if (errorString.includes('cloudinary') || errorString.includes('upload')) {
      code = 'UPLOAD_ERROR';
    } else if (errorString.includes('firebase')) {
      code = 'FIREBASE_ERROR';
    }
  }

  return code;
};

/**
 * Handle database errors and convert to appropriate API responses
 * @param {Error} error - The caught error
 * @param {Function} next - Express next function
 */
export const handleDatabaseError = (error, next) => {
  console.error('Database error:', error);

  // MongoDB duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
    const value = error.keyValue ? error.keyValue[field] : 'value';
    return next(
      new Error(`${field} '${value}' موجود بالفعل، يرجى استخدام قيمة أخرى`, { cause: 409 })
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
    error.name === 'MongoTimeoutError' ||
    (error.name === 'MongooseError' && error.message.includes('buffering timed out')) ||
    error.message.includes('failed to connect') ||
    error.message.includes('connection timed out') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('server selection error')
  ) {
    return next(
      new Error('خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا', { cause: 503 })
    );
  }

  // Default database error
  return next(
    new Error('حدث خطأ في قاعدة البيانات', { cause: 500 })
  );
};

/**
 * Handle authentication errors
 * @param {Error} error - The caught error
 * @param {Function} next - Express next function
 */
export const handleAuthError = (error, next) => {
  console.error('Authentication error:', error);

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
  }

  if (error.name === 'TokenExpiredError') {
    return next(new Error('انتهت صلاحية رمز المصادقة', { cause: 401 }));
  }

  // Firebase errors
  if (error.code === 'auth/id-token-expired') {
    return next(new Error('انتهت صلاحية رمز المصادقة', { cause: 401 }));
  }

  if (error.code === 'auth/id-token-revoked') {
    return next(new Error('تم إلغاء رمز المصادقة', { cause: 401 }));
  }

  if (error.code === 'auth/invalid-id-token') {
    return next(new Error('رمز المصادقة غير صالح', { cause: 401 }));
  }

  // Default auth error
  return next(new Error('فشل في التحقق من الهوية', { cause: 401 }));
};

/**
 * Handle validation errors
 * @param {Error} error - The caught error
 * @param {Function} next - Express next function
 */
export const handleValidationError = (error, next) => {
  console.error('Validation error:', error);

  // Joi validation errors
  if (error.isJoi) {
    const validationErrors = {};
    error.details.forEach(detail => {
      validationErrors[detail.path.join('.')] = detail.message;
    });
    
    return next(
      new Error('خطأ في البيانات المدخلة', { 
        cause: 400, 
        details: validationErrors 
      })
    );
  }

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const validationErrors = {};
    Object.keys(error.errors).forEach(key => {
      validationErrors[key] = error.errors[key].message;
    });
    
    return next(
      new Error('خطأ في البيانات المدخلة', { 
        cause: 400, 
        details: validationErrors 
      })
    );
  }

  // Default validation error
  return next(new Error('البيانات المدخلة غير صالحة', { cause: 400 }));
};

/**
 * Handle file upload errors
 * @param {Error} error - The caught error
 * @param {Function} next - Express next function
 */
export const handleUploadError = (error, next) => {
  console.error('Upload error:', error);

  if (error.code === 'LIMIT_FILE_SIZE') {
    return next(new Error('حجم الملف كبير جداً', { cause: 413 }));
  }

  if (error.code === 'LIMIT_FILE_COUNT') {
    return next(new Error('عدد الملفات يتجاوز الحد المسموح', { cause: 413 }));
  }

  if (error.code === 'LIMIT_UNEXPECTED_FILE') {
    return next(new Error('نوع الملف غير مدعوم', { cause: 400 }));
  }

  // Cloudinary errors
  if (error.error && error.error.message) {
    return next(new Error(`خطأ في رفع الملف: ${error.error.message}`, { cause: 500 }));
  }

  // Default upload error
  return next(new Error('فشل في رفع الملف', { cause: 500 }));
};

/**
 * Create standardized error response
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @returns {Object} - Standardized error response
 */
export const createErrorResponse = (error, req = {}) => {
  const status = error.cause || 500;
  const message = error.message || 'حدث خطأ غير متوقع';
  const errorCode = getErrorCode(status, message);
  
  const response = {
    success: false,
    status,
    message,
    errorCode,
    timestamp: new Date().toISOString(),
    requestId: req.id || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };

  // Add validation details if available
  if (error.details) {
    response.details = error.details;
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') {
    response.stack = error.stack;
  }

  return response;
};

/**
 * Global error handling middleware
 * @param {Error} err - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error(`ERROR 💥: ${err.stack}`);

  // Create standardized error response
  const errorResponse = createErrorResponse(err, req);

  // Send error response
  res.status(errorResponse.status).json(errorResponse);
};

/**
 * Handle 404 errors
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
export const notFoundHandler = (req, res, next) => {
  const error = new Error(`المسار ${req.originalUrl} غير موجود`);
  error.cause = 404;
  next(error);
};

/**
 * Async error handler wrapper
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Export all handlers
export default {
  getErrorCode,
  handleDatabaseError,
  handleAuthError,
  handleValidationError,
  handleUploadError,
  createErrorResponse,
  globalErrorHandler,
  notFoundHandler,
  asyncHandler
}; 