import Joi from 'joi';

// MongoDB ObjectId pattern for validation
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
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
 *     
 *     BulkUpdateReportsRequest:
 *       type: object
 *       required:
 *         - reportIds
 *         - status
 *       properties:
 *         reportIds:
 *           type: array
 *           items:
 *             type: string
 *           minItems: 1
 *           description: قائمة معرفات التقارير
 *           example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *         status:
 *           type: string
 *           enum: [pending, investigating, resolved, rejected]
 *           description: الحالة الجديدة للتقارير
 *           example: "resolved"
 *         adminNotes:
 *           type: string
 *           maxLength: 1000
 *           description: ملاحظات المدير (اختياري)
 *           example: "تم مراجعة جميع التقارير واتخاذ الإجراء المناسب"
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

// Update report status validation schema
export const updateReportStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid('pending', 'investigating', 'resolved', 'rejected')
      .required()
      .messages({
        'string.empty': 'حالة التقرير مطلوبة',
        'any.required': 'حالة التقرير مطلوبة',
        'any.only': 'حالة التقرير غير صالحة. القيم المسموحة: pending, investigating, resolved, rejected'
      }),
    
    adminNotes: Joi.string()
      .max(1000)
      .trim()
      .messages({
        'string.max': 'ملاحظات المدير يجب ألا تتجاوز 1000 حرف'
      })
  })
};

// Bulk update reports validation schema
export const bulkUpdateReportsSchema = {
  body: Joi.object({
    reportIds: Joi.array()
      .items(Joi.string().pattern(objectIdPattern))
      .min(1)
      .required()
      .messages({
        'array.min': 'يجب تحديد تقرير واحد على الأقل',
        'any.required': 'قائمة معرفات التقارير مطلوبة',
        'array.base': 'قائمة معرفات التقارير يجب أن تكون مصفوفة'
      }),
    
    status: Joi.string()
      .valid('pending', 'investigating', 'resolved', 'rejected')
      .required()
      .messages({
        'string.empty': 'حالة التقارير مطلوبة',
        'any.required': 'حالة التقارير مطلوبة',
        'any.only': 'حالة التقارير غير صالحة. القيم المسموحة: pending, investigating, resolved, rejected'
      }),
    
    adminNotes: Joi.string()
      .max(1000)
      .trim()
      .messages({
        'string.max': 'ملاحظات المدير يجب ألا تتجاوز 1000 حرف'
      })
  })
};

// Report stats query validation schema
export const reportStatsQuerySchema = {
  query: Joi.object({
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'الفترة غير صالحة. القيم المسموحة: day, week, month, quarter, year, all'
      }),
    
    groupBy: Joi.string()
      .valid('status', 'contentType', 'reason', 'priority', 'date')
      .default('status')
      .messages({
        'any.only': 'معيار التجميع غير صالح. القيم المسموحة: status, contentType, reason, priority, date'
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
        'any.only': 'نوع المحتوى غير صالح. القيم المسموحة: artwork, image, user, comment, message, review, specialRequest'
      }),
    
    contentId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.empty': 'معرف المحتوى مطلوب',
        'any.required': 'معرف المحتوى مطلوب',
        'string.pattern.base': 'معرف المحتوى يجب أن يكون معرف MongoDB صالح'
      })
  }),
  
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقماً',
        'number.integer': 'رقم الصفحة يجب أن يكون رقماً صحيحاً',
        'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
      }),
    
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(20)
      .messages({
        'number.base': 'عدد العناصر يجب أن يكون رقماً',
        'number.integer': 'عدد العناصر يجب أن يكون رقماً صحيحاً',
        'number.min': 'عدد العناصر يجب أن يكون 1 على الأقل',
        'number.max': 'عدد العناصر يجب ألا يتجاوز 50'
      })
  })
};
