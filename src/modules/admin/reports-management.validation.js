import joi from 'joi';

// MongoDB ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// Validation for getting all reports
export const getAllReportsValidation = {
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

// Validation for getting report details
export const getReportDetailsValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'معرف البلاغ غير صالح',
      'any.required': 'معرف البلاغ مطلوب'
    })
  })
};

// Validation for deleting report
export const deleteReportValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'معرف البلاغ غير صالح',
      'any.required': 'معرف البلاغ مطلوب'
    })
  })
};

// Validation for updating report status
export const updateReportStatusValidation = {
  params: joi.object({
    id: joi.string().pattern(objectIdPattern).required().messages({
      'string.pattern.base': 'معرف البلاغ غير صالح',
      'any.required': 'معرف البلاغ مطلوب'
    })
  }),
  body: joi.object({
    status: joi.string().valid('pending', 'resolved', 'rejected').required().messages({
      'string.valid': 'حالة البلاغ يجب أن تكون واحدة من: pending, resolved, rejected',
      'any.required': 'حالة البلاغ مطلوبة'
    })
  })
}; 