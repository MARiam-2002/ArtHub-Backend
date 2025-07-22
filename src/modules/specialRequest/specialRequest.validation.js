import Joi from 'joi';

// MongoDB ObjectId regex pattern for validation
const MONGODB_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * Schema for creating a new special request
 */
export const createSpecialRequestSchema = {
  body: Joi.object({
    artist: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف الفنان مطلوب',
        'string.pattern.base': 'معرف الفنان غير صالح',
        'any.required': 'معرف الفنان مطلوب'
      }),
    requestType: Joi.string()
      .required()
      .valid(
        'custom_artwork',
        'portrait',
        'logo_design',
        'illustration',
        'digital_art',
        'traditional_art',
        'animation',
        'graphic_design',
        'character_design',
        'concept_art',
        'other'
      )
      .messages({
        'string.empty': 'نوع العمل مطلوب',
        'any.required': 'نوع العمل مطلوب',
        'any.only': 'نوع العمل غير صالح'
      }),
    description: Joi.string()
      .required()
      .min(20)
      .max(2000)
      .messages({
        'string.empty': 'وصف تفصيلي للعمل مطلوب',
        'string.min': 'الوصف يجب أن يكون على الأقل 20 حرف',
        'string.max': 'الوصف يجب ألا يتجاوز 2000 حرف',
        'any.required': 'وصف تفصيلي للعمل مطلوب'
      }),
    budget: Joi.number()
      .required()
      .min(10)
      .max(100000)
      .messages({
        'number.base': 'الميزانية يجب أن تكون رقم',
        'number.min': 'الميزانية يجب أن تكون على الأقل 10',
        'number.max': 'الميزانية يجب ألا تتجاوز 100,000',
        'any.required': 'الميزانية المقترحة مطلوبة'
      }),
    duration: Joi.number()
      .required()
      .min(1)
      .max(365)
      .messages({
        'number.base': 'المدة يجب أن تكون رقم',
        'number.min': 'المدة يجب أن تكون يوم واحد على الأقل',
        'number.max': 'المدة يجب ألا تتجاوز 365 يوم',
        'any.required': 'المدة المطلوبة مطلوبة'
      }),
    technicalDetails: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'التفاصيل الفنية يجب ألا تتجاوز 1000 حرف'
      }),
    currency: Joi.string()
      .valid('SAR', 'USD', 'EUR', 'AED')
      .default('SAR')
      .messages({
        'any.only': 'العملة غير مدعومة'
      }),
    artworkId: Joi.string()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .optional()
      .messages({
        'string.pattern.base': 'معرف العمل الفني غير صالح'
      })
  }).options({ stripUnknown: true })
};

/**
 * Schema for updating special request status
 */
export const updateRequestStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .required()
      .valid('pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled')
      .messages({
        'string.empty': 'حالة الطلب مطلوبة',
        'any.required': 'حالة الطلب مطلوبة',
        'any.only': 'حالة الطلب غير صالحة'
      }),
    response: Joi.string()
      .min(10)
      .max(1000)
      .when('status', {
        is: Joi.valid('accepted', 'rejected'),
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'string.min': 'الرد يجب أن يكون على الأقل 10 أحرف',
        'string.max': 'الرد يجب ألا يتجاوز 1000 حرف',
        'any.required': 'الرد مطلوب عند قبول أو رفض الطلب'
      }),
    estimatedDelivery: Joi.date()
      .min('now')
      .when('status', {
        is: 'accepted',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'date.base': 'تاريخ التسليم المتوقع يجب أن يكون تاريخ صالح',
        'date.min': 'تاريخ التسليم المتوقع يجب أن يكون في المستقبل',
        'any.required': 'تاريخ التسليم المتوقع مطلوب عند قبول الطلب'
      }),
    quotedPrice: Joi.number()
      .positive()
      .when('status', {
        is: 'accepted',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'number.positive': 'السعر المقتبس يجب أن يكون رقم موجب',
        'any.required': 'السعر المقتبس مطلوب عند قبول الطلب'
      })
  }),
  params: Joi.object({
    requestId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف الطلب مطلوب',
        'string.pattern.base': 'معرف الطلب غير صالح',
        'any.required': 'معرف الطلب مطلوب'
      })
  })
};

/**
 * Schema for completing a special request
 */
export const completeRequestSchema = {
  body: Joi.object({
    deliverables: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required().messages({
            'string.uri': 'رابط التسليم غير صالح',
            'any.required': 'رابط التسليم مطلوب'
          }),
          type: Joi.string().valid('final', 'preview', 'source', 'documentation').required().messages({
            'any.only': 'نوع التسليم غير صالح',
            'any.required': 'نوع التسليم مطلوب'
          }),
          name: Joi.string().required().max(100).messages({
            'string.empty': 'اسم الملف مطلوب',
            'string.max': 'اسم الملف يجب ألا يتجاوز 100 حرف',
            'any.required': 'اسم الملف مطلوب'
          }),
          description: Joi.string().max(200).messages({
            'string.max': 'وصف الملف يجب ألا يتجاوز 200 حرف'
          })
        })
      )
      .min(1)
      .required()
      .messages({
        'array.base': 'التسليمات يجب أن تكون قائمة',
        'array.min': 'يجب إرفاق ملف واحد على الأقل',
        'any.required': 'التسليمات مطلوبة'
      }),
    finalNote: Joi.string()
      .max(1000)
      .messages({
        'string.max': 'الملاحظة النهائية يجب ألا تتجاوز 1000 حرف'
      })
  }),
  params: Joi.object({
    requestId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف الطلب مطلوب',
        'string.pattern.base': 'معرف الطلب غير صالح',
        'any.required': 'معرف الطلب مطلوب'
      })
  })
};

/**
 * Schema for artist response to special request
 */
export const responseRequestSchema = {
  body: Joi.object({
    response: Joi.string()
      .required()
      .min(10)
      .max(1000)
      .messages({
        'string.empty': 'الرد مطلوب',
        'string.min': 'الرد يجب أن يكون على الأقل 10 أحرف',
        'string.max': 'الرد يجب ألا يتجاوز 1000 حرف',
        'any.required': 'الرد مطلوب'
      }),
    attachments: Joi.array()
      .items(Joi.string().uri())
      .max(5)
      .messages({
        'array.base': 'المرفقات يجب أن تكون قائمة',
        'array.max': 'لا يمكن إرفاق أكثر من 5 ملفات',
        'string.uri': 'رابط المرفق غير صالح'
      })
  }),
  params: Joi.object({
    requestId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف الطلب مطلوب',
        'string.pattern.base': 'معرف الطلب غير صالح',
        'any.required': 'معرف الطلب مطلوب'
      })
  })
};

/**
 * Schema for cancelling special request
 */
export const cancelSpecialRequestSchema = {
  params: Joi.object({
    requestId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف الطلب مطلوب',
        'string.pattern.base': 'معرف الطلب غير صالح',
        'any.required': 'معرف الطلب مطلوب'
      })
  }),
  body: Joi.object({
    cancellationReason: Joi.string()
      .required()
      .min(10)
      .max(500)
      .messages({
        'string.empty': 'سبب الإلغاء مطلوب',
        'string.min': 'سبب الإلغاء يجب أن يكون على الأقل 10 أحرف',
        'string.max': 'سبب الإلغاء يجب ألا يتجاوز 500 حرف',
        'any.required': 'سبب الإلغاء مطلوب'
      }),
    refundRequested: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'طلب الاسترداد يجب أن يكون true أو false'
      })
  })
};

/**
 * Schema for getting special requests with filters
 */
export const getSpecialRequestsSchema = {
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقم',
        'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
        'number.min': 'رقم الصفحة يجب أن يكون 1 أو أكثر'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
        'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
        'number.max': 'حد النتائج يجب ألا يتجاوز 100'
      }),
    status: Joi.string()
      .valid('pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled')
      .messages({
        'any.only': 'حالة الطلب غير صالحة'
      }),
    requestType: Joi.string()
      .valid(
        'custom_artwork',
        'portrait',
        'logo_design',
        'illustration',
        'digital_art',
        'traditional_art',
        'animation',
        'graphic_design',
        'character_design',
        'concept_art',
        'other'
      )
      .messages({
        'any.only': 'نوع الطلب غير صالح'
      }),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .messages({
        'any.only': 'أولوية الطلب غير صالحة'
      }),
    minBudget: Joi.number()
      .positive()
      .messages({
        'number.positive': 'الحد الأدنى للميزانية يجب أن يكون رقم موجب'
      }),
    maxBudget: Joi.number()
      .positive()
      .messages({
        'number.positive': 'الحد الأقصى للميزانية يجب أن يكون رقم موجب'
      }),
    search: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'البحث يجب أن يكون على الأقل حرفين',
        'string.max': 'البحث يجب ألا يتجاوز 100 حرف'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'budget', 'deadline', 'priority', 'status')
      .default('createdAt')
      .messages({
        'any.only': 'معيار الترتيب غير صالح'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'اتجاه الترتيب غير صالح'
      })
  })
};

/**
 * Schema for getting special request statistics
 */
export const getRequestStatsSchema = {
  query: Joi.object({
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'فترة الإحصائيات غير صالحة'
      }),
    groupBy: Joi.string()
      .valid('status', 'requestType', 'priority', 'month', 'week')
      .messages({
        'any.only': 'معيار التجميع غير صالح'
      }),
    includeDetails: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'تضمين التفاصيل يجب أن يكون true أو false'
      })
  })
};

/**
 * Schema for special request ID parameter validation
 */
export const requestIdSchema = {
  params: Joi.object({
    requestId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف الطلب مطلوب',
        'string.pattern.base': 'معرف الطلب غير صالح',
        'any.required': 'معرف الطلب مطلوب'
      })
  })
};
