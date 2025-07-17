import Joi from 'joi';

// MongoDB ObjectId regex pattern for validation
const MONGODB_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Schema for getting all orders with filters
 */
export const getAllOrdersSchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'رقم الصفحة يجب أن يكون رقم',
      'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
      'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
    }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'عدد العناصر يجب أن يكون رقم',
      'number.integer': 'عدد العناصر يجب أن يكون رقم صحيح',
      'number.min': 'عدد العناصر يجب أن يكون 1 على الأقل',
      'number.max': 'عدد العناصر يجب ألا يتجاوز 100'
    }),
    search: Joi.string().max(100).messages({
      'string.max': 'نص البحث يجب ألا يتجاوز 100 حرف'
    }),
    artistId: Joi.string().pattern(MONGODB_OBJECTID_REGEX).messages({
      'string.pattern.base': 'معرف الفنان غير صالح'
    }),
    status: Joi.string().valid(
      'pending',
      'accepted',
      'rejected',
      'in_progress',
      'review',
      'completed',
      'cancelled'
    ).messages({
      'any.only': 'حالة الطلب غير صالحة'
    }),
    dateFrom: Joi.date().iso().messages({
      'date.base': 'تاريخ البداية غير صالح',
      'date.format': 'تاريخ البداية يجب أن يكون بصيغة ISO'
    }),
    dateTo: Joi.date().iso().min(Joi.ref('dateFrom')).messages({
      'date.base': 'تاريخ النهاية غير صالح',
      'date.format': 'تاريخ النهاية يجب أن يكون بصيغة ISO',
      'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
    }),
    sortBy: Joi.string().valid('createdAt', 'title', 'price', 'status').default('createdAt').messages({
      'any.only': 'حقل الترتيب غير صالح'
    }),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc').messages({
      'any.only': 'اتجاه الترتيب غير صالح'
    }),
    export: Joi.boolean().default(false).messages({
      'boolean.base': 'قيمة التصدير يجب أن تكون true أو false'
    })
  }).optional()
};

/**
 * Schema for getting order details
 */
export const getOrderDetailsSchema = {
  params: Joi.object({
    id: Joi.string().pattern(MONGODB_OBJECTID_REGEX).required().messages({
      'string.empty': 'معرف الطلب مطلوب',
      'string.pattern.base': 'معرف الطلب غير صالح',
      'any.required': 'معرف الطلب مطلوب'
    })
  }).required()
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
    status: Joi.string().valid(
      'pending',
      'accepted',
      'rejected',
      'in_progress',
      'review',
      'completed',
      'cancelled'
    ).required().messages({
      'string.empty': 'حالة الطلب مطلوبة',
      'any.required': 'حالة الطلب مطلوبة',
      'any.only': 'حالة الطلب غير صالحة'
    }),
    reason: Joi.string().max(500).messages({
      'string.max': 'سبب التغيير يجب ألا يتجاوز 500 حرف'
    }),
    estimatedDelivery: Joi.date().iso().min('now').messages({
      'date.base': 'تاريخ التسليم المتوقع غير صالح',
      'date.format': 'تاريخ التسليم المتوقع يجب أن يكون بصيغة ISO',
      'date.min': 'تاريخ التسليم المتوقع يجب أن يكون في المستقبل'
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
  }).required()
};

/**
 * Schema for getting order statistics
 */
export const getOrderStatisticsSchema = {
  query: Joi.object({
    period: Joi.string().valid('7days', '30days', '90days', '1year').default('30days').messages({
      'any.only': 'الفترة الزمنية يجب أن تكون 7days, 30days, 90days, أو 1year'
    })
  }).optional()
}; 