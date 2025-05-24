/**
 * Standardized response middleware for the API
 * Optimized for Flutter integration with consistent response format
 */
export function responseMiddleware(req, res, next) {
  /**
   * Send a success response
   * @param {any} data - The data to return (can be null)
   * @param {string} message - Success message (Arabic)
   * @param {number} status - HTTP status code (default: 200)
   * @param {object} metadata - Optional metadata for pagination, etc.
   */
  res.success = (data, message = 'تم بنجاح', status = 200, metadata = null) => {
    // Standard response structure for all success responses
    const response = { 
      success: true,
      status,
      message,
      timestamp: new Date().toISOString(),
      requestId: req.id || generateRequestId(),
    };

    // Add data field only if not undefined (might be null)
    if (data !== undefined) {
      response.data = data;
    }

    // Add metadata if provided
    if (metadata) {
      response.metadata = metadata;
    }
    
    res.status(status).json(response);
  };

  /**
   * Pagination helper for list responses
   * @param {Array} data - The paginated data array
   * @param {string} message - Success message (Arabic)
   * @param {number} page - Current page number
   * @param {number} limit - Items per page
   * @param {number} totalCount - Total number of items
   */
  res.successPaginated = (data, message = 'تم جلب البيانات بنجاح', page = 1, limit = 10, totalCount = 0) => {
    const totalPages = Math.ceil(totalCount / limit);
    
    res.success(data, message, 200, {
      pagination: {
        currentPage: parseInt(page),
        itemsPerPage: parseInt(limit),
        totalItems: totalCount,
        totalPages,
        hasNextPage: parseInt(page) < totalPages,
        hasPreviousPage: parseInt(page) > 1
      }
    });
  };

  /**
   * Send a failure response
   * @param {any} error - Error details (for developers)
   * @param {string} message - User-friendly error message (Arabic)
   * @param {number} status - HTTP status code (default: 400)
   * @param {string} errorCode - Optional standardized error code for Flutter
   */
  res.fail = (error, message = 'حدث خطأ', status = 400, errorCode = null) => {
    // For Flutter, ensure error is always a string or null
    const errorDetails = process.env.NODE_ENV === 'production' 
      ? null 
      : (error instanceof Error ? error.message : error ? String(error) : null);
    
    // Get standardized error code
    const code = errorCode || getErrorCode(status, error);
    
    // Standard error response structure for all errors
    const response = { 
      success: false,
      status,
      message,
      error: errorDetails,
      errorCode: code,
      timestamp: new Date().toISOString(),
      requestId: req.id || generateRequestId()
    };
    
    res.status(status).json(response);
  };
  
  next();
}

/**
 * Get standardized error code for Flutter integration
 * @param {number} status - HTTP status code
 * @param {any} error - Error object or message
 * @returns {string} - Standardized error code
 */
function getErrorCode(status, error) {
  // Common error codes mapped to HTTP status
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
  let code = errorMap[status] || `ERROR_${status}`;
  
  // Add more specific codes based on error content
  if (error) {
    const errorString = error instanceof Error ? error.message : String(error);
    
    if (/password/i.test(errorString)) {
      code = 'INVALID_PASSWORD';
    } else if (/email/i.test(errorString)) {
      code = 'INVALID_EMAIL';
    } else if (/token/i.test(errorString)) {
      code = 'INVALID_TOKEN';
    } else if (/file/i.test(errorString) && /size/i.test(errorString)) {
      code = 'FILE_TOO_LARGE';
    } else if (/file/i.test(errorString) && /format/i.test(errorString)) {
      code = 'INVALID_FILE_FORMAT';
    } else if (/limit/i.test(errorString)) {
      code = 'RATE_LIMIT_EXCEEDED';
    } else if (/permission/i.test(errorString) || /access/i.test(errorString)) {
      code = 'ACCESS_DENIED';
    } else if (/duplicate/i.test(errorString)) {
      code = 'DUPLICATE_ENTITY';
    } else if (/network/i.test(errorString)) {
      code = 'NETWORK_ERROR';
    } else if (/timeout/i.test(errorString)) {
      code = 'REQUEST_TIMEOUT';
    } else if (/validation/i.test(errorString)) {
      code = 'VALIDATION_ERROR';
    } else if (/database/i.test(errorString)) {
      code = 'DATABASE_ERROR';
    } else if (/cloudinary/i.test(errorString)) {
      code = 'UPLOAD_ERROR';
    }
  }
  
  return code;
}

/**
 * Generate a unique request ID
 * @returns {string} - Unique request ID
 */
function generateRequestId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5).toUpperCase();
}

/**
 * تحديد اللغة المفضلة للمستخدم من الطلب
 * @param {Object} req - كائن الطلب
 * @returns {string} رمز اللغة (ar أو en)
 */
export const getPreferredLanguage = (req) => {
  // التحقق من وجود معلمة اللغة في الاستعلام
  if (req.query && req.query.language && ['ar', 'en'].includes(req.query.language)) {
    return req.query.language;
  }
  
  // التحقق من وجود هيدر اللغة
  if (req.headers && req.headers['accept-language']) {
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage.startsWith('en')) {
      return 'en';
    }
  }
  
  // التحقق من تفضيل المستخدم المخزن
  if (req.user && req.user.preferredLanguage) {
    return req.user.preferredLanguage;
  }
  
  // القيمة الافتراضية هي العربية
  return 'ar';
};

/**
 * تحسين وسيط استجابة Express.js لتوحيد تنسيق الاستجابة وإضافة دعم اللغات
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @param {Function} next - دالة الانتقال للوسيط التالي
 */
export const responseEnhancer = (req, res, next) => {
  // حفظ الدوال الأصلية
  const originalSend = res.send;
  const originalJson = res.json;
  const originalStatus = res.status;
  
  // معرف الطلب الفريد
  const requestId = req.id || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  req.id = requestId;
  
  // تحديد اللغة المفضلة
  const preferredLanguage = getPreferredLanguage(req);
  req.preferredLanguage = preferredLanguage;
  
  // إعادة تعريف دالة الحالة
  res.status = function(code) {
    res.statusCode = code;
    return originalStatus.apply(res, arguments);
  };
  
  // إعادة تعريف دالة json لتوحيد الاستجابة
  res.json = function(data) {
    // التحقق مما إذا كانت البيانات بالفعل في التنسيق المطلوب
    if (data && typeof data === 'object' && 'success' in data) {
      // إضافة طابع زمني ومعرف الطلب إذا لم يكن موجودًا
      data.timestamp = data.timestamp || new Date().toISOString();
      data.requestId = data.requestId || requestId;
      
      // إضافة معلومات اللغة المستخدمة
      data.language = preferredLanguage;
      
      return originalJson.call(this, data);
    }
    
    // تحديد رسالة نجاح ديناميكية بناءً على اللغة
    const successMessage = preferredLanguage === 'ar' 
      ? 'تمت العملية بنجاح' 
      : 'Operation completed successfully';
    
    // تنسيق البيانات
    const formattedData = {
      success: true,
      status: res.statusCode || 200,
      message: successMessage,
      data: data,
      timestamp: new Date().toISOString(),
      requestId: requestId,
      language: preferredLanguage
    };
    
    return originalJson.call(this, formattedData);
  };
  
  // إعادة تعريف دالة send لتوحيد الاستجابة
  res.send = function(data) {
    // إذا كانت البيانات نصية، مرر كما هي
    if (typeof data === 'string') {
      return originalSend.apply(res, arguments);
    }
    
    // التحويل إلى JSON
    return res.json(data);
  };
  
  // إضافة دالة لإرسال رسائل خطأ منسقة
  res.sendError = function(message, error, statusCode = 400) {
    // تحديد رسالة خطأ ديناميكية بناءً على اللغة إذا لم يتم توفيرها
    const errorMessage = message || (preferredLanguage === 'ar' 
      ? 'حدث خطأ أثناء معالجة الطلب' 
      : 'An error occurred while processing the request');
    
    const errorResponse = {
      success: false,
      status: statusCode,
      message: errorMessage,
      error: error,
      timestamp: new Date().toISOString(),
      requestId: requestId,
      language: preferredLanguage
    };
    
    return res.status(statusCode).json(errorResponse);
  };
  
  // المتابعة إلى الوسيط التالي
  next();
};
