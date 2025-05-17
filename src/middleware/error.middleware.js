
/**
 * Global error handling middleware
 * Provides consistent error response format for the API
 * Optimized for Flutter integration
 */
export function errorHandler(err, req, res, next) {
  console.error('ERROR 💥:', err);
  
  // Default error information
  const statusCode = err.status || err.statusCode || err.cause || 500;
  const message = err.message || 'Internal Server Error';
  
  // Validation errors handling
  let validationErrors = null;
  if (err.errors) {
    validationErrors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message
    }));
  }
  
  // Create error response object with Flutter-friendly format
  const errorResponse = {
    success: false,
    status: statusCode,
    message: getArabicErrorMessage(statusCode, message),
    error: process.env.NODE_ENV === 'production' 
      ? (statusCode === 500 ? 'Server Error' : message)
      : err.stack,
    errorCode: getErrorCode(statusCode, message),
    timestamp: new Date().toISOString()
  };
  
  // Add validation errors if they exist - important for form validation in Flutter
  if (validationErrors) {
    errorResponse.validationErrors = validationErrors;
  }
  
  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }
  
  res.status(statusCode).json(errorResponse);
}

/**
 * Get arabic error message based on status code and english message
 * @param {number} statusCode - HTTP status code
 * @param {string} englishMessage - English error message
 * @returns {string} - Arabic error message
 */
function getArabicErrorMessage(statusCode, englishMessage) {
  // Common error messages in Arabic
  const statusMessages = {
    400: 'طلب غير صحيح',
    401: 'غير مصرح بالدخول',
    403: 'محظور الوصول',
    404: 'غير موجود',
    409: 'تعارض في البيانات',
    422: 'خطأ في البيانات المدخلة',
    429: 'طلبات كثيرة جدًا',
    500: 'خطأ في الخادم',
    502: 'البوابة غير صحيحة',
    503: 'الخدمة غير متوفرة'
  };
  
  // Return Arabic message based on status code or use English message
  return statusMessages[statusCode] || englishMessage;
}

/**
 * Get standardized error code for Flutter integration
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @returns {string} - Standardized error code
 */
function getErrorCode(statusCode, message) {
  // Common error codes
  const errorMap = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'VALIDATION_ERROR',
    429: 'TOO_MANY_REQUESTS',
    500: 'SERVER_ERROR'
  };
  
  // Default to status-based code
  let code = errorMap[statusCode] || `ERROR_${statusCode}`;
  
  // Add more specific codes based on error message
  if (message) {
    if (/password/i.test(message)) {
      code = 'INVALID_PASSWORD';
    } else if (/email/i.test(message)) {
      code = 'INVALID_EMAIL';
    } else if (/token/i.test(message)) {
      code = 'INVALID_TOKEN';
    } else if (/upload/i.test(message) || /file/i.test(message)) {
      code = 'FILE_ERROR';
    }
  }
  
  return code;
}
