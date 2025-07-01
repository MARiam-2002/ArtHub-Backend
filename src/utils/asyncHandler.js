/**
 * Utility function to handle async route handlers in Express
 * Eliminates the need for try/catch blocks in each route handler
 *
 * @param {Function} fn - Async function to be wrapped
 * @returns {Function} - Express middleware function
 */
export const asyncHandler = fn => (req, res, next) => {
  // Performance optimization: use native Promise.resolve()
  // instead of creating a new Promise
  Promise.resolve(fn(req, res, next)).catch(error => {
    // Check if response has already been sent
    if (!res.headersSent) {
      // Pass error to Express error handler
      next(error);
    } else {
      // Log error but don't crash the server
      console.error('Error occurred after response was sent:', error);
      console.error('Request path:', req.path);
      console.error('Request method:', req.method);

      // Additional debug info in development
      if (process.env.NODE_ENV === 'development') {
        console.error('Request body:', req.body);
        console.error('Request query:', req.query);
        console.error('Request params:', req.params);
        console.error('Error stack:', error.stack);
      }
    }
  });
};

/**
 * Helper function to create a standardized API error
 *
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {Object} details - Additional error details
 * @returns {Error} - Error object with cause property set to statusCode
 */
export const createError = (message, statusCode = 500, details = null) => {
  const error = new Error(message);
  error.cause = statusCode;

  if (details) {
    error.details = details;
  }

  return error;
};

/**
 * Helper function to validate request data against a schema
 *
 * @param {Object} schema - Joi schema for validation
 * @param {string} source - Request property to validate ('body', 'query', 'params')
 * @returns {Function} - Express middleware function
 */
export const validateRequest =
  (schema, source = 'body') =>
  (req, res, next) => {
    const { error, value } = schema.validate(req[source], {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const validationErrors = {};

      error.details.forEach(detail => {
        validationErrors[detail.context.key] = detail.message;
      });

      return next(createError('خطأ في البيانات المدخلة', 400, validationErrors));
    }

    // Replace request data with validated data
    req[source] = value;
    next();
  };
