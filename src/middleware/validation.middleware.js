import { Types } from 'mongoose';

// ✅ Custom validator for ObjectId
export const isValidObjectId = (value, helpers) =>
  Types.ObjectId.isValid(value) ? value : helpers.message('المعرّف غير صالح (Invalid ObjectId)');

// ✅ Middleware for schema validation
export const isValidation = Schema => (req, res, next) => {
  try {
    // Check if Schema is an object with body, params, query properties
    if (Schema && typeof Schema === 'object' && (Schema.body || Schema.params || Schema.query)) {
      // Handle structured schema object
      const validationErrors = [];
      
      // Validate body
      if (Schema.body) {
        const { error } = Schema.body.validate(req.body, { abortEarly: false });
        if (error) {
          validationErrors.push(...error.details.map(err => err.message));
        }
      }
      
      // Validate params
      if (Schema.params) {
        const { error } = Schema.params.validate(req.params, { abortEarly: false });
        if (error) {
          validationErrors.push(...error.details.map(err => err.message));
        }
      }
      
      // Validate query
      if (Schema.query) {
        const { error } = Schema.query.validate(req.query, { abortEarly: false });
        if (error) {
          validationErrors.push(...error.details.map(err => err.message));
        }
      }
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'فشل التحقق من البيانات',
          errors: validationErrors
        });
      }
    } else {
      // Handle direct Joi schema (legacy support)
      const copyReq = {
        ...req.body,
        ...req.params,
        ...req.query,
        ...req.files
      };

      const { error } = Schema.validate(copyReq, { abortEarly: false });

      if (error) {
        const errorMessages = error.details.map(err => err.message);

        return res.status(400).json({
          success: false,
          message: 'فشل التحقق من البيانات',
          errors: errorMessages
        });
      }
    }

    return next();
  } catch (error) {
    console.error('❌ Validation middleware error:', error);
    throw error;
  }
};
