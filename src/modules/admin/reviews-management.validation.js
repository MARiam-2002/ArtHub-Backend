import joi from 'joi';

// MongoDB ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Validation for getting all reviews
export const getAllReviewsValidation = {
  query: joi.object({
    page: joi.number().integer().min(1).default(1).messages({
      'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
    }),
    limit: joi.alternatives().try(
      joi.number().integer().min(1).max(100).messages({
        'number.min': 'عدد العناصر يجب أن يكون 1 على الأقل',
        'number.max': 'عدد العناصر يجب أن يكون 100 كحد أقصى'
      }),
      joi.string().valid('full').messages({
        'any.only': 'قيمة limit غير صالحة. استخدم رقم أو "full"'
      })
    ).default(20).messages({
      'any.required': 'عدد العناصر مطلوب'
    })
  }).optional()
};

// Validation for getting review details
export const getReviewDetailsValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'معرف التقييم غير صالح',
      'any.required': 'معرف التقييم مطلوب'
    })
  })
};

// Validation for deleting review
export const deleteReviewValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'معرف التقييم غير صالح',
      'any.required': 'معرف التقييم مطلوب'
    })
  })
};

// Validation for exporting reviews
export const exportReviewsValidation = {
  query: joi.object({
    format: joi.string().valid('json', 'csv').default('json').messages({
      'any.only': 'صيغة التصدير يجب أن تكون json أو csv'
    })
  }).optional()
}; 