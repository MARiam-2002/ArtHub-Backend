/**
 * Global error handling middleware
 * Provides consistent error response format for the API
 * Optimized for Flutter integration
 */
export const globalErrorHandling = (err, req, res, next) => {
  // Log the error for debugging
  console.error(`ERROR 💥: ${err.stack}`);
  
  // Enhanced MongoDB connection error detection with more specific patterns
  const isMongoConnectionError = 
    err.name === 'MongoNetworkError' ||
    err.name === 'MongoServerSelectionError' ||
    err.name === 'MongooseError' && (
      err.message.includes('buffering timed out') ||
      err.message.includes('operation timed out')
    ) ||
    err.message.includes('failed to connect') ||
    err.message.includes('connection timed out') ||
    err.message.includes('getaddrinfo ENOTFOUND') ||
    err.message.includes('connection closed') ||
    err.message.includes('topology was destroyed') ||
    err.message.includes('no primary found') ||
    err.message.includes('server selection error') ||
    err.message.includes('ECONNREFUSED') ||
    err.message.includes('Operation `users.findOne()` buffering timed out') ||
    err.cause === 503;

  // Handle MongoDB connection errors with a specific error response
  if (isMongoConnectionError) {
    console.error("❌ MongoDB connection error detected:", err.message);
    
    // Try to provide more specific error information
    let specificError = "خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا";
    let errorCode = "DB_CONNECTION_ERROR";
    
    if (err.message.includes('buffering timed out')) {
      specificError = "انتهت مهلة عملية قاعدة البيانات، يرجى المحاولة مرة أخرى";
      errorCode = "DB_BUFFERING_TIMEOUT";
      
      // Log additional diagnostic info for buffering timeouts
      console.error("⚠️ Buffering timeout error. This typically happens when:");
      console.error("  - MongoDB Atlas IP whitelist doesn't include your server's IP");
      console.error("  - For Vercel deployments, add 0.0.0.0/0 to your MongoDB Atlas IP whitelist");
    } else if (err.message.includes('ENOTFOUND')) {
      specificError = "تعذر العثور على خادم قاعدة البيانات";
      errorCode = "DB_HOST_NOT_FOUND";
    } else if (err.message.includes('Authentication failed')) {
      specificError = "فشل المصادقة مع قاعدة البيانات";
      errorCode = "DB_AUTH_FAILED";
    } else if (err.message.includes('ECONNREFUSED')) {
      specificError = "تم رفض الاتصال بقاعدة البيانات";
      errorCode = "DB_CONNECTION_REFUSED";
    } else if (err.message.includes('server selection error') || err.message.includes('no primary found')) {
      specificError = "تعذر الاتصال بخادم قاعدة البيانات، قد تكون الخدمة غير متاحة حاليًا";
      errorCode = "DB_SERVER_SELECTION_ERROR";
    }
    
    return res.status(503).json({
      success: false,
      status: 503,
      message: "الخدمة غير متوفرة",
      error: specificError,
      errorCode: errorCode,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    const validationErrors = {};
    
    // Extract validation error messages
    Object.keys(err.errors).forEach((key) => {
      validationErrors[key] = err.errors[key].message;
    });
    
    return res.status(400).json({
      success: false,
      status: 400,
      message: "خطأ في البيانات المدخلة",
      errors: validationErrors,
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    
    return res.status(409).json({
      success: false,
      status: 409,
      message: `القيمة '${value}' مستخدمة بالفعل في الحقل '${field}'`,
      error: "خطأ في تكرار البيانات",
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      status: 401,
      message: "غير مصرح",
      error: "رمز المصادقة غير صالح",
      timestamp: new Date().toISOString()
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      status: 401,
      message: "غير مصرح",
      error: "انتهت صلاحية رمز المصادقة",
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle file size errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "حجم الملف كبير جدًا",
      error: "يجب أن يكون حجم الملف أقل من 5 ميجابايت",
      timestamp: new Date().toISOString()
    });
  }
  
  // Handle timeout errors
  if (err.name === 'TimeoutError' || err.message.includes('timeout')) {
    return res.status(408).json({
      success: false,
      status: 408,
      message: "انتهت مهلة الطلب",
      error: "استغرق الطلب وقتًا طويلاً للاستجابة",
      timestamp: new Date().toISOString()
    });
  }

  // Default error response
  const statusCode = err.cause || 500;
  const errorMessage = statusCode === 500 ? "حدث خطأ داخلي في الخادم" : err.message;
  
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: errorMessage,
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    timestamp: new Date().toISOString()
  });
};

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
    500: 'SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE'
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
    } else if (/mongo|database|connection/i.test(message)) {
      code = 'DB_CONNECTION_ERROR';
    } else if (/timeout|timed out/i.test(message)) {
      code = 'OPERATION_TIMEOUT';
    }
  }
  
  return code;
}
