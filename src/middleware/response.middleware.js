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
