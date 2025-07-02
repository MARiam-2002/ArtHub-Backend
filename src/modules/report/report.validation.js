import Joi from 'joi';

// MongoDB ObjectId pattern for validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateReportRequest:
 *       type: object
 *       required:
 *         - contentType
 *         - contentId
 *         - reason
 *       properties:
 *         contentType:
 *           type: string
 *           enum: [artwork, image, user, comment, message, review, specialRequest]
 *           description: نوع المحتوى المبلغ عنه
 *           example: "artwork"
 *         contentId:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: معرف المحتوى المبلغ عنه (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         reason:
 *           type: string
 *           enum: [inappropriate, copyright, spam, offensive, harassment, violence, nudity, fake, scam, other]
 *           description: سبب الإبلاغ
 *           example: "inappropriate"
 *         description:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: وصف تفصيلي للإبلاغ (اختياري)
 *           example: "هذا المحتوى غير مناسب ويحتوي على مواد مخالفة"
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: أولوية التقرير (اختياري)
 *           example: "medium"
 *         evidence:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 5
 *           description: روابط أو معرفات الأدلة المرفقة (اختياري)
 *           example: ["https://example.com/evidence1.jpg"]
 *     
 *     UpdateReportStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [pending, investigating, resolved, rejected, escalated]
 *           description: الحالة الجديدة للتقرير
 *           example: "resolved"
 *         adminNotes:
 *           type: string
 *           maxLength: 1000
 *           description: ملاحظات المدير (اختياري)
 *           example: "تم مراجعة التقرير واتخاذ الإجراء المناسب"
 *         actionTaken:
 *           type: string
 *           enum: [none, warning, content_removed, user_suspended, user_banned, other]
 *           description: الإجراء المتخذ (اختياري)
 *           example: "content_removed"
 *         notifyReporter:
 *           type: boolean
 *           description: إشعار المبلغ بالنتيجة
 *           example: true
 *     
 *     ReportQueryParams:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           description: رقم الصفحة
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           description: عدد العناصر في الصفحة
 *           example: 20
 *         status:
 *           type: string
 *           enum: [pending, investigating, resolved, rejected, escalated]
 *           description: تصفية حسب الحالة
 *           example: "pending"
 *         contentType:
 *           type: string
 *           enum: [artwork, image, user, comment, message, review, specialRequest]
 *           description: تصفية حسب نوع المحتوى
 *           example: "artwork"
 *         reason:
 *           type: string
 *           enum: [inappropriate, copyright, spam, offensive, harassment, violence, nudity, fake, scam, other]
 *           description: تصفية حسب السبب
 *           example: "inappropriate"
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: تصفية حسب الأولوية
 *           example: "high"
 *         sortBy:
 *           type: string
 *           enum: [createdAt, updatedAt, priority, status]
 *           description: ترتيب النتائج حسب
 *           example: "createdAt"
 *         sortOrder:
 *           type: string
 *           enum: [asc, desc]
 *           description: اتجاه الترتيب
 *           example: "desc"
 *         dateFrom:
 *           type: string
 *           format: date
 *           description: تصفية من تاريخ معين
 *           example: "2024-01-01"
 *         dateTo:
 *           type: string
 *           format: date
 *           description: تصفية إلى تاريخ معين
 *           example: "2024-12-31"
 *         search:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *           description: البحث في وصف التقرير
 *           example: "محتوى غير مناسب"
 */

// Report ID validation schema
export const reportIdSchema = {
  params: Joi.object({
    reportId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.empty': 'معرف التقرير مطلوب',
        'any.required': 'معرف التقرير مطلوب',
        'string.pattern.base': 'معرف التقرير غير صالح'
      })
  })
};

// Create report validation schema
export const createReportSchema = {
  body: Joi.object({
    contentType: Joi.string()
      .valid('artwork', 'image', 'user', 'comment', 'message', 'review', 'specialRequest')
      .required()
      .messages({
        'string.empty': 'نوع المحتوى مطلوب',
        'any.required': 'نوع المحتوى مطلوب',
        'any.only': 'نوع المحتوى غير صالح. القيم المسموحة: artwork, image, user, comment, message, review, specialRequest'
      }),
    
    contentId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.empty': 'معرف المحتوى مطلوب',
        'any.required': 'معرف المحتوى مطلوب',
        'string.pattern.base': 'معرف المحتوى يجب أن يكون معرف MongoDB صالح'
      }),
    
    reason: Joi.string()
      .valid('inappropriate', 'copyright', 'spam', 'offensive', 'harassment', 'violence', 'nudity', 'fake', 'scam', 'other')
      .required()
      .messages({
        'string.empty': 'سبب الإبلاغ مطلوب',
        'any.required': 'سبب الإبلاغ مطلوب',
        'any.only': 'سبب الإبلاغ غير صالح'
      }),
    
    description: Joi.string()
      .min(10)
      .max(1000)
      .trim()
      .messages({
        'string.min': 'وصف التقرير يجب أن يكون أكثر من 10 أحرف',
        'string.max': 'وصف التقرير يجب ألا يتجاوز 1000 حرف'
      }),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .default('medium')
      .messages({
        'any.only': 'أولوية التقرير غير صالحة. القيم المسموحة: low, medium, high, urgent'
      }),
    
    evidence: Joi.array()
      .items(Joi.string().uri().messages({
        'string.uri': 'رابط الدليل يجب أن يكون رابطاً صالحاً'
      }))
      .max(5)
      .messages({
        'array.max': 'لا يمكن إرفاق أكثر من 5 أدلة'
      })
  })
};

// Update report status validation schema
export const updateReportStatusSchema = {
  params: Joi.object({
    reportId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.empty': 'معرف التقرير مطلوب',
        'any.required': 'معرف التقرير مطلوب',
        'string.pattern.base': 'معرف التقرير غير صالح'
      })
  }),
  
  body: Joi.object({
    status: Joi.string()
      .valid('pending', 'investigating', 'resolved', 'rejected', 'escalated')
      .required()
      .messages({
        'string.empty': 'حالة التقرير مطلوبة',
        'any.required': 'حالة التقرير مطلوبة',
        'any.only': 'حالة التقرير غير صالحة. القيم المسموحة: pending, investigating, resolved, rejected, escalated'
      }),
    
    adminNotes: Joi.string()
      .max(1000)
      .trim()
      .messages({
        'string.max': 'ملاحظات المدير يجب ألا تتجاوز 1000 حرف'
      }),
    
    actionTaken: Joi.string()
      .valid('none', 'warning', 'content_removed', 'user_suspended', 'user_banned', 'other')
      .messages({
        'any.only': 'الإجراء المتخذ غير صالح'
      }),
    
    notifyReporter: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'إشعار المبلغ يجب أن يكون قيمة منطقية'
      })
  })
};

// Report query parameters validation schema
export const reportQuerySchema = {
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقماً',
        'number.integer': 'رقم الصفحة يجب أن يكون رقماً صحيحاً',
        'number.min': 'رقم الصفحة يجب أن يكون أكبر من 0'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'عدد العناصر يجب أن يكون رقماً',
        'number.integer': 'عدد العناصر يجب أن يكون رقماً صحيحاً',
        'number.min': 'عدد العناصر يجب أن يكون أكبر من 0',
        'number.max': 'عدد العناصر يجب ألا يتجاوز 100'
      }),
    
    status: Joi.string()
      .valid('pending', 'investigating', 'resolved', 'rejected', 'escalated')
      .messages({
        'any.only': 'حالة التقرير غير صالحة'
      }),
    
    contentType: Joi.string()
      .valid('artwork', 'image', 'user', 'comment', 'message', 'review', 'specialRequest')
      .messages({
        'any.only': 'نوع المحتوى غير صالح'
      }),
    
    reason: Joi.string()
      .valid('inappropriate', 'copyright', 'spam', 'offensive', 'harassment', 'violence', 'nudity', 'fake', 'scam', 'other')
      .messages({
        'any.only': 'سبب الإبلاغ غير صالح'
      }),
    
    priority: Joi.string()
      .valid('low', 'medium', 'high', 'urgent')
      .messages({
        'any.only': 'أولوية التقرير غير صالحة'
      }),
    
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'priority', 'status')
      .default('createdAt')
      .messages({
        'any.only': 'معيار الترتيب غير صالح'
      }),
    
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'اتجاه الترتيب غير صالح. استخدم asc أو desc'
      }),
    
    dateFrom: Joi.date()
      .iso()
      .messages({
        'date.base': 'تاريخ البداية غير صالح',
        'date.format': 'تاريخ البداية يجب أن يكون بصيغة ISO (YYYY-MM-DD)'
      }),
    
    dateTo: Joi.date()
      .iso()
      .min(Joi.ref('dateFrom'))
      .messages({
        'date.base': 'تاريخ النهاية غير صالح',
        'date.format': 'تاريخ النهاية يجب أن يكون بصيغة ISO (YYYY-MM-DD)',
        'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
      }),
    
    search: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .messages({
        'string.min': 'نص البحث يجب أن يكون أكثر من حرفين',
        'string.max': 'نص البحث يجب ألا يتجاوز 100 حرف'
      })
  })
};

// Bulk update reports validation schema
export const bulkUpdateReportsSchema = {
  body: Joi.object({
    reportIds: Joi.array()
      .items(Joi.string().pattern(objectIdPattern).messages({
        'string.pattern.base': 'معرف التقرير غير صالح'
      }))
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.min': 'يجب تحديد تقرير واحد على الأقل',
        'array.max': 'لا يمكن تحديث أكثر من 50 تقرير في المرة الواحدة',
        'any.required': 'معرفات التقارير مطلوبة'
      }),
    
    status: Joi.string()
      .valid('pending', 'investigating', 'resolved', 'rejected', 'escalated')
      .required()
      .messages({
        'string.empty': 'حالة التقرير مطلوبة',
        'any.required': 'حالة التقرير مطلوبة',
        'any.only': 'حالة التقرير غير صالحة'
      }),
    
    adminNotes: Joi.string()
      .max(500)
      .trim()
      .messages({
        'string.max': 'ملاحظات المدير يجب ألا تتجاوز 500 حرف'
      })
  })
};

// Report statistics query validation schema
export const reportStatsQuerySchema = {
  query: Joi.object({
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'فترة الإحصائيات غير صالحة. القيم المسموحة: day, week, month, quarter, year, all'
      }),
    
    groupBy: Joi.string()
      .valid('status', 'contentType', 'reason', 'priority', 'date')
      .default('status')
      .messages({
        'any.only': 'معيار التجميع غير صالح'
      }),
    
    dateFrom: Joi.date()
      .iso()
      .messages({
        'date.base': 'تاريخ البداية غير صالح',
        'date.format': 'تاريخ البداية يجب أن يكون بصيغة ISO'
      }),
    
    dateTo: Joi.date()
      .iso()
      .min(Joi.ref('dateFrom'))
      .messages({
        'date.base': 'تاريخ النهاية غير صالح',
        'date.format': 'تاريخ النهاية يجب أن يكون بصيغة ISO',
        'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
      })
  })
};

// Content reports query validation schema
export const contentReportsQuerySchema = {
  params: Joi.object({
    contentType: Joi.string()
      .valid('artwork', 'image', 'user', 'comment', 'message', 'review', 'specialRequest')
      .required()
      .messages({
        'string.empty': 'نوع المحتوى مطلوب',
        'any.required': 'نوع المحتوى مطلوب',
        'any.only': 'نوع المحتوى غير صالح'
      }),
    
    contentId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.empty': 'معرف المحتوى مطلوب',
        'any.required': 'معرف المحتوى مطلوب',
        'string.pattern.base': 'معرف المحتوى غير صالح'
      })
  }),
  
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
  })
};

// Export report validation schema
export const exportReportsSchema = {
  query: Joi.object({
    format: Joi.string()
      .valid('csv', 'xlsx', 'json')
      .default('csv')
      .messages({
        'any.only': 'صيغة التصدير غير صالحة. القيم المسموحة: csv, xlsx, json'
      }),
    
    status: Joi.string()
      .valid('pending', 'investigating', 'resolved', 'rejected', 'escalated')
      .messages({
        'any.only': 'حالة التقرير غير صالحة'
      }),
    
    contentType: Joi.string()
      .valid('artwork', 'image', 'user', 'comment', 'message', 'review', 'specialRequest')
      .messages({
        'any.only': 'نوع المحتوى غير صالح'
      }),
    
    dateFrom: Joi.date()
      .iso()
      .messages({
        'date.base': 'تاريخ البداية غير صالح'
      }),
    
    dateTo: Joi.date()
      .iso()
      .min(Joi.ref('dateFrom'))
      .messages({
        'date.base': 'تاريخ النهاية غير صالح',
        'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
      })
  })
};
