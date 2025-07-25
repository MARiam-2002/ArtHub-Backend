import Joi from 'joi';

// MongoDB ObjectId regex pattern for validation
const MONGODB_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Schema for getting all orders
 */
export const getAllOrdersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'رقم الصفحة يجب أن يكون رقماً',
      'number.integer': 'رقم الصفحة يجب أن يكون رقماً صحيحاً',
      'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
    }),
    limit: Joi.alternatives().try(
      Joi.number().integer().min(1).max(100).messages({
        'number.base': 'عدد العناصر يجب أن يكون رقماً',
        'number.integer': 'عدد العناصر يجب أن يكون رقماً صحيحاً',
        'number.min': 'عدد العناصر يجب أن يكون 1 على الأقل',
        'number.max': 'عدد العناصر يجب أن يكون 100 كحد أقصى'
      }),
      Joi.string().valid('full').messages({
        'any.only': 'قيمة limit غير صالحة. استخدم رقم أو "full"'
      })
    ).default(10).messages({
      'any.required': 'عدد العناصر مطلوب'
    })
  }).optional()
};

/**
 * Schema for updating order status
 */
export const updateOrderStatusSchema = {
  params: Joi.object({
    id: Joi.string().pattern(MONGODB_OBJECTID_REGEX).required().messages({
      'string.empty': 'معرف الطلب مطلوب',
      'string.pattern.base': 'معرف الطلب غير صالح',
      'any.required': 'معرف الطلب مطلوب'
    })
  }).required(),
  body: Joi.object({
    status: Joi.string().valid('pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled').required().messages({
      'string.empty': 'حالة الطلب مطلوبة',
      'any.only': 'حالة الطلب يجب أن تكون pending, accepted, rejected, in_progress, review, completed, أو cancelled',
      'any.required': 'حالة الطلب مطلوبة'
    })
  }).required()
};

/**
 * Schema for deleting order
 */
export const deleteOrderSchema = {
  params: Joi.object({
    id: Joi.string().pattern(MONGODB_OBJECTID_REGEX).required().messages({
      'string.empty': 'معرف الطلب مطلوب',
      'string.pattern.base': 'معرف الطلب غير صالح',
      'any.required': 'معرف الطلب مطلوب'
    })
  }).required(),
  body: Joi.object({
    cancellationReason: Joi.string().min(5).required().messages({
      'string.empty': 'سبب الإلغاء مطلوب',
      'string.min': 'سبب الإلغاء يجب أن يكون 5 أحرف على الأقل',
      'any.required': 'سبب الإلغاء مطلوب'
    })
  }).required()
}; 