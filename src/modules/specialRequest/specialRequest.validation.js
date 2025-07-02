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
        'string.empty': 'نوع الطلب مطلوب',
        'any.required': 'نوع الطلب مطلوب',
        'any.only': 'نوع الطلب غير صالح'
      }),
    title: Joi.string()
      .required()
      .min(5)
      .max(100)
      .messages({
        'string.empty': 'عنوان الطلب مطلوب',
        'string.min': 'عنوان الطلب يجب أن يكون على الأقل 5 أحرف',
        'string.max': 'عنوان الطلب يجب ألا يتجاوز 100 حرف',
        'any.required': 'عنوان الطلب مطلوب'
      }),
    description: Joi.string()
      .required()
      .min(20)
      .max(2000)
      .messages({
        'string.empty': 'وصف الطلب مطلوب',
        'string.min': 'وصف الطلب يجب أن يكون على الأقل 20 حرف',
        'string.max': 'وصف الطلب يجب ألا يتجاوز 2000 حرف',
        'any.required': 'وصف الطلب مطلوب'
      }),
    budget: Joi.number()
      .required()
      .min(10)
      .max(100000)
      .messages({
        'number.base': 'الميزانية يجب أن تكون رقم',
        'number.min': 'الميزانية يجب أن تكون على الأقل 10 ريال',
        'number.max': 'الميزانية يجب ألا تتجاوز 100,000 ريال',
        'any.required': 'الميزانية مطلوبة'
      }),
    currency: Joi.string()
      .valid('SAR', 'USD', 'EUR', 'AED')
      .default('SAR')
      .messages({
        'any.only': 'العملة غير مدعومة'
      }),
    deadline: Joi.date()
      .min('now')
      .max(Joi.ref('$now', { adjust: value => new Date(value.getTime() + 365 * 24 * 60 * 60 * 1000) }))
      .messages({
        'date.base': 'الموعد النهائي يجب أن يكون تاريخ صالح',
        'date.min': 'الموعد النهائي يجب أن يكون في المستقبل',
        'date.max': 'الموعد النهائي يجب ألا يتجاوز سنة من الآن'
      }),
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .default('medium')
      .messages({
        'any.only': 'أولوية الطلب غير صالحة'
      }),
    category: Joi.string()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.pattern.base': 'معرف الفئة غير صالح'
      }),
    tags: Joi.array()
      .items(Joi.string().min(2).max(30))
      .max(10)
      .messages({
        'array.base': 'العلامات يجب أن تكون قائمة',
        'array.max': 'لا يمكن إضافة أكثر من 10 علامات',
        'string.min': 'العلامة يجب أن تكون على الأقل حرفين',
        'string.max': 'العلامة يجب ألا تتجاوز 30 حرف'
      }),
    attachments: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required().messages({
            'string.uri': 'رابط المرفق غير صالح',
            'any.required': 'رابط المرفق مطلوب'
          }),
          type: Joi.string().valid('image', 'document', 'reference').required().messages({
            'any.only': 'نوع المرفق غير صالح',
            'any.required': 'نوع المرفق مطلوب'
          }),
          name: Joi.string().max(100).messages({
            'string.max': 'اسم المرفق يجب ألا يتجاوز 100 حرف'
          }),
          description: Joi.string().max(200).messages({
            'string.max': 'وصف المرفق يجب ألا يتجاوز 200 حرف'
          })
        })
      )
      .max(10)
      .messages({
        'array.base': 'المرفقات يجب أن تكون قائمة',
        'array.max': 'لا يمكن إرفاق أكثر من 10 ملفات'
      }),
    specifications: Joi.object({
      dimensions: Joi.object({
        width: Joi.number().positive().messages({
          'number.positive': 'العرض يجب أن يكون رقم موجب'
        }),
        height: Joi.number().positive().messages({
          'number.positive': 'الارتفاع يجب أن يكون رقم موجب'
        }),
        unit: Joi.string().valid('px', 'cm', 'in', 'mm').default('px').messages({
          'any.only': 'وحدة القياس غير صالحة'
        })
      }),
      format: Joi.string().valid('digital', 'print', 'both').messages({
        'any.only': 'تنسيق العمل غير صالح'
      }),
      resolution: Joi.number().positive().messages({
        'number.positive': 'الدقة يجب أن تكون رقم موجب'
      }),
      colorMode: Joi.string().valid('RGB', 'CMYK', 'Grayscale').messages({
        'any.only': 'نمط الألوان غير صالح'
      }),
      fileFormat: Joi.array().items(
        Joi.string().valid('PNG', 'JPG', 'JPEG', 'SVG', 'PDF', 'AI', 'PSD', 'EPS')
      ).messages({
        'any.only': 'تنسيق الملف غير مدعوم'
      })
    }),
    communicationPreferences: Joi.object({
      preferredMethod: Joi.string().valid('chat', 'email', 'phone', 'video_call').default('chat').messages({
        'any.only': 'طريقة التواصل المفضلة غير صالحة'
      }),
      timezone: Joi.string().messages({
        'string.base': 'المنطقة الزمنية يجب أن تكون نص'
      }),
      availableHours: Joi.object({
        start: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
          'string.pattern.base': 'وقت البداية غير صالح (استخدم تنسيق HH:MM)'
        }),
        end: Joi.string().pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).messages({
          'string.pattern.base': 'وقت النهاية غير صالح (استخدم تنسيق HH:MM)'
        })
      })
    }),
    isPrivate: Joi.boolean().default(false).messages({
      'boolean.base': 'حالة الخصوصية يجب أن تكون true أو false'
    }),
    allowRevisions: Joi.boolean().default(true).messages({
      'boolean.base': 'السماح بالتعديلات يجب أن يكون true أو false'
    }),
    maxRevisions: Joi.number().min(0).max(10).default(3).messages({
      'number.min': 'عدد التعديلات يجب أن يكون 0 أو أكثر',
      'number.max': 'عدد التعديلات يجب ألا يتجاوز 10'
    })
  })
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
