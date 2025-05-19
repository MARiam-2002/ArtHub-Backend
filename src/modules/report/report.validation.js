import Joi from 'joi';

export const createReportSchema = {
  body: Joi.object({
    contentType: Joi.string()
      .valid('artwork', 'image', 'user', 'comment', 'message')
      .required()
      .messages({
        'string.empty': 'يجب تحديد نوع المحتوى',
        'any.required': 'يجب تحديد نوع المحتوى',
        'any.only': 'نوع المحتوى غير صالح'
      }),
    contentId: Joi.string()
      .required()
      .messages({
        'string.empty': 'يجب تحديد معرف المحتوى',
        'any.required': 'يجب تحديد معرف المحتوى'
      }),
    reason: Joi.string()
      .valid('inappropriate', 'copyright', 'spam', 'offensive', 'harassment', 'other')
      .required()
      .messages({
        'string.empty': 'يجب تحديد سبب الإبلاغ',
        'any.required': 'يجب تحديد سبب الإبلاغ',
        'any.only': 'سبب الإبلاغ غير صالح'
      }),
    description: Joi.string()
      .min(10)
      .max(500)
      .messages({
        'string.min': 'يجب أن يكون الوصف أكثر من 10 أحرف',
        'string.max': 'يجب ألا يتجاوز الوصف 500 حرف'
      })
  })
};

export const updateReportStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid('pending', 'resolved', 'rejected')
      .required()
      .messages({
        'string.empty': 'يجب تحديد الحالة',
        'any.required': 'يجب تحديد الحالة',
        'any.only': 'الحالة غير صالحة'
      }),
    adminNotes: Joi.string()
      .max(500)
      .messages({
        'string.max': 'يجب ألا تتجاوز الملاحظات 500 حرف'
      })
  }),
  params: Joi.object({
    reportId: Joi.string()
      .required()
      .messages({
        'string.empty': 'يجب تحديد معرف التقرير',
        'any.required': 'يجب تحديد معرف التقرير'
      })
  })
}; 