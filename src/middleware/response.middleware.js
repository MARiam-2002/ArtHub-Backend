
/**
 * Standardized response middleware for the API
 * Adds success and fail methods to the response object
 * Optimized for Flutter integration
 */
export function responseMiddleware(req, res, next) {
  /**
   * Send a success response
   * @param {any} data - The data to return
   * @param {string} message - Success message (Arabic)
   * @param {number} status - HTTP status code (default: 200)
   */
  res.success = (data, message = 'تم بنجاح', status = 200) => {
    // Allow null data to be sent
    const responseData = data === undefined ? null : data;
    
    res.status(status).json({ 
      success: true, 
      status,
      message, 
      data: responseData,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
  };

  /**
   * Send a failure response
   * @param {any} error - Error details (for developers)
   * @param {string} message - User-friendly error message (Arabic)
   * @param {number} status - HTTP status code (default: 400)
   */
  res.fail = (error, message = 'حدث خطأ', status = 400) => {
    // For Flutter, ensure error is always a string or null
    const errorDetails = process.env.NODE_ENV === 'production' 
      ? null 
      : (error instanceof Error ? error.message : String(error));
    
    // Standardized error codes for Flutter
    const errorCode = getErrorCode(status, error);
    
    res.status(status).json({ 
      success: false,
      status,
      message,
      error: errorDetails,
      errorCode,
      timestamp: new Date().toISOString(),
      requestId: req.id
    });
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
    }
  }
  
  return code;
}
