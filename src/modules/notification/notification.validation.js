import Joi from 'joi';

/**
 * مخطط التحقق من صحة معرف الإشعار
 * @swagger
 * components:
 *   schemas:
 *     NotificationIdSchema:
 *       type: object
 *       required:
 *         - notificationId
 *       properties:
 *         notificationId:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *           description: معرف الإشعار (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 */
export const notificationIdSchema = Joi.object({
  notificationId: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.base': 'معرف الإشعار يجب أن يكون نصاً',
      'string.empty': 'معرف الإشعار مطلوب',
      'string.pattern.base': 'معرف الإشعار غير صحيح',
      'any.required': 'معرف الإشعار مطلوب'
    })
});

/**
 * مخطط التحقق من صحة استعلام الإشعارات
 * @swagger
 * components:
 *   schemas:
 *     NotificationQuerySchema:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: رقم الصفحة
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *           description: عدد العناصر في الصفحة
 *           example: 20
 *         unreadOnly:
 *           type: boolean
 *           description: عرض الإشعارات غير المقروءة فقط
 *           example: false
 *         type:
 *           type: string
 *           enum: ["request", "message", "review", "system", "other"]
 *           description: نوع الإشعار
 *           example: "message"
 *         language:
 *           type: string
 *           enum: ["ar", "en"]
 *           default: "ar"
 *           description: لغة الإشعارات
 *           example: "ar"
 *         dateFrom:
 *           type: string
 *           format: date
 *           description: تاريخ البداية للفلترة
 *           example: "2024-01-01"
 *         dateTo:
 *           type: string
 *           format: date
 *           description: تاريخ النهاية للفلترة
 *           example: "2024-12-31"
 */
export const notificationQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.base': 'رقم الصفحة يجب أن يكون رقماً',
      'number.integer': 'رقم الصفحة يجب أن يكون رقماً صحيحاً',
      'number.min': 'رقم الصفحة يجب أن يكون أكبر من أو يساوي 1'
    }),
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.base': 'عدد العناصر يجب أن يكون رقماً',
      'number.integer': 'عدد العناصر يجب أن يكون رقماً صحيحاً',
      'number.min': 'عدد العناصر يجب أن يكون أكبر من أو يساوي 1',
      'number.max': 'عدد العناصر يجب أن يكون أقل من أو يساوي 100'
    }),
  unreadOnly: Joi.boolean()
    .messages({
      'boolean.base': 'خيار الإشعارات غير المقروءة يجب أن يكون قيمة منطقية'
    }),
  type: Joi.string()
    .valid('request', 'message', 'review', 'system', 'other')
    .messages({
      'string.base': 'نوع الإشعار يجب أن يكون نصاً',
      'any.only': 'نوع الإشعار يجب أن يكون أحد القيم المسموحة: request, message, review, system, other'
    }),
  language: Joi.string()
    .valid('ar', 'en')
    .default('ar')
    .messages({
      'string.base': 'اللغة يجب أن تكون نصاً',
      'any.only': 'اللغة يجب أن تكون ar أو en'
    }),
  dateFrom: Joi.date()
    .iso()
    .messages({
      'date.base': 'تاريخ البداية يجب أن يكون تاريخاً صحيحاً',
      'date.format': 'تاريخ البداية يجب أن يكون بصيغة ISO'
    }),
  dateTo: Joi.date()
    .iso()
    .min(Joi.ref('dateFrom'))
    .messages({
      'date.base': 'تاريخ النهاية يجب أن يكون تاريخاً صحيحاً',
      'date.format': 'تاريخ النهاية يجب أن يكون بصيغة ISO',
      'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
    })
});

/**
 * مخطط التحقق من صحة رمز FCM
 * @swagger
 * components:
 *   schemas:
 *     FCMTokenSchema:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           minLength: 10
 *           maxLength: 1000
 *           description: رمز FCM للإشعارات الفورية
 *           example: "eHb1fxhb7rI:APA91bEhYKjBqLNdBgKBALRhHuHLaDVVUhwa6ugfOvVGiC..."
 *         deviceType:
 *           type: string
 *           enum: ["android", "ios", "web"]
 *           description: نوع الجهاز
 *           example: "android"
 */
export const fcmTokenSchema = Joi.object({
  token: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.base': 'رمز FCM يجب أن يكون نصاً',
      'string.empty': 'رمز FCM مطلوب',
      'string.min': 'رمز FCM قصير جداً',
      'string.max': 'رمز FCM طويل جداً',
      'any.required': 'رمز FCM مطلوب'
    }),
  deviceType: Joi.string()
    .valid('android', 'ios', 'web')
    .messages({
      'string.base': 'نوع الجهاز يجب أن يكون نصاً',
      'any.only': 'نوع الجهاز يجب أن يكون android أو ios أو web'
    })
});

/**
 * مخطط التحقق من صحة إنشاء إشعار
 * @swagger
 * components:
 *   schemas:
 *     CreateNotificationSchema:
 *       type: object
 *       required:
 *         - recipient
 *         - title
 *         - message
 *       properties:
 *         recipient:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *           description: معرف المستخدم المتلقي
 *           example: "507f1f77bcf86cd799439011"
 *         title:
 *           type: object
 *           required:
 *             - ar
 *           properties:
 *             ar:
 *               type: string
 *               minLength: 1
 *               maxLength: 100
 *               description: عنوان الإشعار بالعربية
 *               example: "إشعار جديد"
 *             en:
 *               type: string
 *               maxLength: 100
 *               description: عنوان الإشعار بالإنجليزية
 *               example: "New Notification"
 *         message:
 *           type: object
 *           required:
 *             - ar
 *           properties:
 *             ar:
 *               type: string
 *               minLength: 1
 *               maxLength: 500
 *               description: نص الإشعار بالعربية
 *               example: "لديك رسالة جديدة"
 *             en:
 *               type: string
 *               maxLength: 500
 *               description: نص الإشعار بالإنجليزية
 *               example: "You have a new message"
 *         type:
 *           type: string
 *           enum: ["request", "message", "review", "system", "other"]
 *           default: "other"
 *           description: نوع الإشعار
 *           example: "message"
 *         ref:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *           description: معرف المرجع المرتبط بالإشعار
 *           example: "507f1f77bcf86cd799439011"
 *         refModel:
 *           type: string
 *           enum: ["SpecialRequest", "Artwork", "Message", "User"]
 *           description: نموذج المرجع
 *           example: "Message"
 *         data:
 *           type: object
 *           description: بيانات إضافية للإشعار
 *           example: { "messageId": "507f1f77bcf86cd799439011" }
 *         sendPush:
 *           type: boolean
 *           default: true
 *           description: إرسال إشعار فوري
 *           example: true
 */
export const createNotificationSchema = Joi.object({
  recipient: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.base': 'معرف المستخدم المتلقي يجب أن يكون نصاً',
      'string.empty': 'معرف المستخدم المتلقي مطلوب',
      'string.pattern.base': 'معرف المستخدم المتلقي غير صحيح',
      'any.required': 'معرف المستخدم المتلقي مطلوب'
    }),
  title: Joi.object({
    ar: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.base': 'عنوان الإشعار بالعربية يجب أن يكون نصاً',
        'string.empty': 'عنوان الإشعار بالعربية مطلوب',
        'string.min': 'عنوان الإشعار بالعربية قصير جداً',
        'string.max': 'عنوان الإشعار بالعربية طويل جداً',
        'any.required': 'عنوان الإشعار بالعربية مطلوب'
      }),
    en: Joi.string()
      .max(100)
      .messages({
        'string.base': 'عنوان الإشعار بالإنجليزية يجب أن يكون نصاً',
        'string.max': 'عنوان الإشعار بالإنجليزية طويل جداً'
      })
  }).required().messages({
    'object.base': 'عنوان الإشعار يجب أن يكون كائناً',
    'any.required': 'عنوان الإشعار مطلوب'
  }),
  message: Joi.object({
    ar: Joi.string()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.base': 'نص الإشعار بالعربية يجب أن يكون نصاً',
        'string.empty': 'نص الإشعار بالعربية مطلوب',
        'string.min': 'نص الإشعار بالعربية قصير جداً',
        'string.max': 'نص الإشعار بالعربية طويل جداً',
        'any.required': 'نص الإشعار بالعربية مطلوب'
      }),
    en: Joi.string()
      .max(500)
      .messages({
        'string.base': 'نص الإشعار بالإنجليزية يجب أن يكون نصاً',
        'string.max': 'نص الإشعار بالإنجليزية طويل جداً'
      })
  }).required().messages({
    'object.base': 'نص الإشعار يجب أن يكون كائناً',
    'any.required': 'نص الإشعار مطلوب'
  }),
  type: Joi.string()
    .valid('request', 'message', 'review', 'system', 'other')
    .default('other')
    .messages({
      'string.base': 'نوع الإشعار يجب أن يكون نصاً',
      'any.only': 'نوع الإشعار يجب أن يكون أحد القيم المسموحة'
    }),
  ref: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.base': 'معرف المرجع يجب أن يكون نصاً',
      'string.pattern.base': 'معرف المرجع غير صحيح'
    }),
  refModel: Joi.string()
    .valid('SpecialRequest', 'Artwork', 'Message', 'User')
    .when('ref', {
      is: Joi.exist(),
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'string.base': 'نموذج المرجع يجب أن يكون نصاً',
      'any.only': 'نموذج المرجع يجب أن يكون أحد القيم المسموحة',
      'any.required': 'نموذج المرجع مطلوب عند تحديد معرف المرجع'
    }),
  data: Joi.object()
    .messages({
      'object.base': 'البيانات الإضافية يجب أن تكون كائناً'
    }),
  sendPush: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'خيار الإشعار الفوري يجب أن يكون قيمة منطقية'
    })
});

/**
 * مخطط التحقق من صحة إعدادات الإشعارات
 * @swagger
 * components:
 *   schemas:
 *     NotificationSettingsSchema:
 *       type: object
 *       properties:
 *         enablePush:
 *           type: boolean
 *           description: تفعيل الإشعارات الفورية
 *           example: true
 *         enableEmail:
 *           type: boolean
 *           description: تفعيل إشعارات البريد الإلكتروني
 *           example: false
 *         enableSMS:
 *           type: boolean
 *           description: تفعيل إشعارات الرسائل النصية
 *           example: false
 *         language:
 *           type: string
 *           enum: ["ar", "en"]
 *           description: لغة الإشعارات المفضلة
 *           example: "ar"
 *         categories:
 *           type: object
 *           description: إعدادات إشعارات الفئات
 *           properties:
 *             messages:
 *               type: boolean
 *               description: إشعارات الرسائل
 *               example: true
 *             requests:
 *               type: boolean
 *               description: إشعارات الطلبات الخاصة
 *               example: true
 *             reviews:
 *               type: boolean
 *               description: إشعارات المراجعات
 *               example: true
 *             system:
 *               type: boolean
 *               description: إشعارات النظام
 *               example: true
 *             follows:
 *               type: boolean
 *               description: إشعارات المتابعات
 *               example: true
 *             sales:
 *               type: boolean
 *               description: إشعارات المبيعات
 *               example: true
 *         quietHours:
 *           type: object
 *           description: ساعات الصمت
 *           properties:
 *             enabled:
 *               type: boolean
 *               description: تفعيل ساعات الصمت
 *               example: false
 *             startTime:
 *               type: string
 *               pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *               description: وقت البداية (HH:MM)
 *               example: "22:00"
 *             endTime:
 *               type: string
 *               pattern: "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$"
 *               description: وقت النهاية (HH:MM)
 *               example: "08:00"
 */
export const notificationSettingsSchema = Joi.object({
  enablePush: Joi.boolean()
    .messages({
      'boolean.base': 'خيار الإشعارات الفورية يجب أن يكون قيمة منطقية'
    }),
  enableEmail: Joi.boolean()
    .messages({
      'boolean.base': 'خيار إشعارات البريد الإلكتروني يجب أن يكون قيمة منطقية'
    }),
  enableSMS: Joi.boolean()
    .messages({
      'boolean.base': 'خيار إشعارات الرسائل النصية يجب أن يكون قيمة منطقية'
    }),
  language: Joi.string()
    .valid('ar', 'en')
    .messages({
      'string.base': 'اللغة يجب أن تكون نصاً',
      'any.only': 'اللغة يجب أن تكون ar أو en'
    }),
  categories: Joi.object({
    messages: Joi.boolean()
      .messages({
        'boolean.base': 'خيار إشعارات الرسائل يجب أن يكون قيمة منطقية'
      }),
    requests: Joi.boolean()
      .messages({
        'boolean.base': 'خيار إشعارات الطلبات يجب أن يكون قيمة منطقية'
      }),
    reviews: Joi.boolean()
      .messages({
        'boolean.base': 'خيار إشعارات المراجعات يجب أن يكون قيمة منطقية'
      }),
    system: Joi.boolean()
      .messages({
        'boolean.base': 'خيار إشعارات النظام يجب أن يكون قيمة منطقية'
      }),
    follows: Joi.boolean()
      .messages({
        'boolean.base': 'خيار إشعارات المتابعات يجب أن يكون قيمة منطقية'
      }),
    sales: Joi.boolean()
      .messages({
        'boolean.base': 'خيار إشعارات المبيعات يجب أن يكون قيمة منطقية'
      })
  }).messages({
    'object.base': 'إعدادات فئات الإشعارات يجب أن تكون كائناً'
  }),
  quietHours: Joi.object({
    enabled: Joi.boolean()
      .messages({
        'boolean.base': 'خيار تفعيل ساعات الصمت يجب أن يكون قيمة منطقية'
      }),
    startTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .when('enabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'string.base': 'وقت البداية يجب أن يكون نصاً',
        'string.pattern.base': 'وقت البداية يجب أن يكون بصيغة HH:MM',
        'any.required': 'وقت البداية مطلوب عند تفعيل ساعات الصمت'
      }),
    endTime: Joi.string()
      .pattern(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
      .when('enabled', {
        is: true,
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .messages({
        'string.base': 'وقت النهاية يجب أن يكون نصاً',
        'string.pattern.base': 'وقت النهاية يجب أن يكون بصيغة HH:MM',
        'any.required': 'وقت النهاية مطلوب عند تفعيل ساعات الصمت'
      })
  }).messages({
    'object.base': 'إعدادات ساعات الصمت يجب أن تكون كائناً'
  })
}).min(1).messages({
  'object.min': 'يجب توفير إعداد واحد على الأقل للتحديث'
});

/**
 * مخطط التحقق من صحة الإشعارات المتعددة
 * @swagger
 * components:
 *   schemas:
 *     BulkNotificationSchema:
 *       type: object
 *       required:
 *         - recipients
 *         - title
 *         - message
 *       properties:
 *         recipients:
 *           type: array
 *           items:
 *             type: string
 *             pattern: "^[0-9a-fA-F]{24}$"
 *           minItems: 1
 *           maxItems: 1000
 *           description: قائمة معرفات المستخدمين المتلقين
 *           example: ["507f1f77bcf86cd799439011", "507f1f77bcf86cd799439012"]
 *         title:
 *           $ref: '#/components/schemas/CreateNotificationSchema/properties/title'
 *         message:
 *           $ref: '#/components/schemas/CreateNotificationSchema/properties/message'
 *         type:
 *           $ref: '#/components/schemas/CreateNotificationSchema/properties/type'
 *         data:
 *           $ref: '#/components/schemas/CreateNotificationSchema/properties/data'
 *         sendPush:
 *           $ref: '#/components/schemas/CreateNotificationSchema/properties/sendPush'
 */
export const bulkNotificationSchema = Joi.object({
  recipients: Joi.array()
    .items(
      Joi.string()
        .pattern(/^[0-9a-fA-F]{24}$/)
        .messages({
          'string.base': 'معرف المستخدم يجب أن يكون نصاً',
          'string.pattern.base': 'معرف المستخدم غير صحيح'
        })
    )
    .min(1)
    .max(1000)
    .unique()
    .required()
    .messages({
      'array.base': 'قائمة المتلقين يجب أن تكون مصفوفة',
      'array.min': 'يجب تحديد متلقي واحد على الأقل',
      'array.max': 'لا يمكن إرسال إشعار لأكثر من 1000 مستخدم في المرة الواحدة',
      'array.unique': 'لا يمكن تكرار معرفات المستخدمين',
      'any.required': 'قائمة المتلقين مطلوبة'
    }),
  title: Joi.object({
    ar: Joi.string()
      .min(1)
      .max(100)
      .required()
      .messages({
        'string.base': 'عنوان الإشعار بالعربية يجب أن يكون نصاً',
        'string.empty': 'عنوان الإشعار بالعربية مطلوب',
        'string.min': 'عنوان الإشعار بالعربية قصير جداً',
        'string.max': 'عنوان الإشعار بالعربية طويل جداً',
        'any.required': 'عنوان الإشعار بالعربية مطلوب'
      }),
    en: Joi.string()
      .max(100)
      .messages({
        'string.base': 'عنوان الإشعار بالإنجليزية يجب أن يكون نصاً',
        'string.max': 'عنوان الإشعار بالإنجليزية طويل جداً'
      })
  }).required().messages({
    'object.base': 'عنوان الإشعار يجب أن يكون كائناً',
    'any.required': 'عنوان الإشعار مطلوب'
  }),
  message: Joi.object({
    ar: Joi.string()
      .min(1)
      .max(500)
      .required()
      .messages({
        'string.base': 'نص الإشعار بالعربية يجب أن يكون نصاً',
        'string.empty': 'نص الإشعار بالعربية مطلوب',
        'string.min': 'نص الإشعار بالعربية قصير جداً',
        'string.max': 'نص الإشعار بالعربية طويل جداً',
        'any.required': 'نص الإشعار بالعربية مطلوب'
      }),
    en: Joi.string()
      .max(500)
      .messages({
        'string.base': 'نص الإشعار بالإنجليزية يجب أن يكون نصاً',
        'string.max': 'نص الإشعار بالإنجليزية طويل جداً'
      })
  }).required().messages({
    'object.base': 'نص الإشعار يجب أن يكون كائناً',
    'any.required': 'نص الإشعار مطلوب'
  }),
  type: Joi.string()
    .valid('request', 'message', 'review', 'system', 'other')
    .default('other')
    .messages({
      'string.base': 'نوع الإشعار يجب أن يكون نصاً',
      'any.only': 'نوع الإشعار يجب أن يكون أحد القيم المسموحة'
    }),
  data: Joi.object()
    .messages({
      'object.base': 'البيانات الإضافية يجب أن تكون كائناً'
    }),
  sendPush: Joi.boolean()
    .default(true)
    .messages({
      'boolean.base': 'خيار الإشعار الفوري يجب أن يكون قيمة منطقية'
    })
});

/**
 * مخطط التحقق من صحة إحصائيات الإشعارات
 * @swagger
 * components:
 *   schemas:
 *     NotificationStatsQuerySchema:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           enum: ["day", "week", "month", "year", "all"]
 *           default: "month"
 *           description: فترة الإحصائيات
 *           example: "month"
 *         groupBy:
 *           type: string
 *           enum: ["type", "date", "status"]
 *           description: تجميع الإحصائيات حسب
 *           example: "type"
 */
export const notificationStatsQuerySchema = Joi.object({
  period: Joi.string()
    .valid('day', 'week', 'month', 'year', 'all')
    .default('month')
    .messages({
      'string.base': 'فترة الإحصائيات يجب أن تكون نصاً',
      'any.only': 'فترة الإحصائيات يجب أن تكون أحد القيم المسموحة'
    }),
  groupBy: Joi.string()
    .valid('type', 'date', 'status')
    .messages({
      'string.base': 'تجميع الإحصائيات يجب أن يكون نصاً',
      'any.only': 'تجميع الإحصائيات يجب أن يكون أحد القيم المسموحة'
    })
});
