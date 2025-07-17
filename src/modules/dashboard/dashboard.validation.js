import joi from 'joi';

// MongoDB ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// General field definitions
const generalFields = {
  id: joi.string().pattern(objectIdPattern).messages({
    'string.pattern.base': 'معرف غير صالح'
  })
};

// Validation for charts query parameters
export const getChartsValidation = {
  query: joi.object({
    period: joi.string().valid('1month', '3months', '6months', '9months', '12months').default('12months').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 1month, 3months, 6months, 9months, أو 12months'
    })
  }).optional()
};

// Validation for artists performance query parameters
export const getArtistsPerformanceValidation = {
  query: joi.object({
    limit: joi.number().integer().min(1).max(20).default(3).messages({
      'number.min': 'عدد الفنانين يجب أن يكون 1 على الأقل',
      'number.max': 'عدد الفنانين يجب أن يكون 20 كحد أقصى'
    }),
    period: joi.string().valid('1week', '1month', '3months', '6months', '1year').default('1month').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 1week, 1month, 3months, 6months, أو 1year'
    })
  }).optional()
}; 