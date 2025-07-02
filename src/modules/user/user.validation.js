import Joi from 'joi';

/**
 * نمط MongoDB ObjectId للتحقق من صحة المعرفات
 */
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * مخطط التحقق من صحة تبديل قائمة المفضلة
 * @swagger
 * components:
 *   schemas:
 *     ToggleWishlistSchema:
 *       type: object
 *       required:
 *         - artworkId
 *       properties:
 *         artworkId:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: معرف العمل الفني
 *           example: "507f1f77bcf86cd799439011"
 */
export const toggleWishlistSchema = Joi.object({
  artworkId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'معرف العمل الفني يجب أن يكون معرف MongoDB صالح',
      'any.required': 'معرف العمل الفني مطلوب',
      'string.empty': 'معرف العمل الفني لا يمكن أن يكون فارغاً'
    })
});

/**
 * مخطط التحقق من صحة تحديث الملف الشخصي
 * @swagger
 * components:
 *   schemas:
 *     UpdateProfileSchema:
 *       type: object
 *       properties:
 *         displayName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: اسم العرض
 *           example: "أحمد محمد"
 *         job:
 *           type: string
 *           maxLength: 100
 *           description: المهنة أو التخصص
 *           example: "مصمم جرافيك"
 *         bio:
 *           type: string
 *           maxLength: 500
 *           description: نبذة شخصية
 *           example: "فنان تشكيلي متخصص في الرسم الزيتي"
 *         location:
 *           type: string
 *           maxLength: 100
 *           description: الموقع الجغرافي
 *           example: "الرياض، السعودية"
 *         website:
 *           type: string
 *           format: uri
 *           description: الموقع الشخصي
 *           example: "https://www.example.com"
 *         socialMedia:
 *           type: object
 *           properties:
 *             instagram:
 *               type: string
 *               description: رابط إنستغرام
 *             twitter:
 *               type: string
 *               description: رابط تويتر
 *             facebook:
 *               type: string
 *               description: رابط فيسبوك
 *         profileImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               description: رابط الصورة الشخصية
 *             id:
 *               type: string
 *               description: معرف الصورة في Cloudinary
 *         coverImages:
 *           type: array
 *           maxItems: 5
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               id:
 *                 type: string
 */
export const updateProfileSchema = Joi.object({
  displayName: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .optional()
    .messages({
      'string.min': 'اسم العرض يجب أن يكون على الأقل حرفين',
      'string.max': 'اسم العرض يجب أن يكون أقل من 50 حرف',
      'string.empty': 'اسم العرض لا يمكن أن يكون فارغاً'
    }),

  job: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'المهنة يجب أن تكون أقل من 100 حرف'
    }),

  bio: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'النبذة الشخصية يجب أن تكون أقل من 500 حرف'
    }),

  location: Joi.string()
    .trim()
    .max(100)
    .optional()
    .allow('')
    .messages({
      'string.max': 'الموقع يجب أن يكون أقل من 100 حرف'
    }),

  website: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'رابط الموقع يجب أن يكون رابط صالح'
    }),

  socialMedia: Joi.object({
    instagram: Joi.string().uri().optional().allow(''),
    twitter: Joi.string().uri().optional().allow(''),
    facebook: Joi.string().uri().optional().allow('')
  }).optional(),

  profileImage: Joi.object({
    url: Joi.string().uri().required(),
    id: Joi.string().required()
  }).optional(),

  coverImages: Joi.array()
    .items(
      Joi.object({
        url: Joi.string().uri().required(),
        id: Joi.string().required()
      })
    )
    .max(5)
    .optional()
    .messages({
      'array.max': 'يمكن رفع حد أقصى 5 صور غلاف'
    })
});

/**
 * مخطط التحقق من صحة تغيير كلمة المرور
 * @swagger
 * components:
 *   schemas:
 *     ChangePasswordSchema:
 *       type: object
 *       required:
 *         - oldPassword
 *         - newPassword
 *       properties:
 *         oldPassword:
 *           type: string
 *           description: كلمة المرور الحالية
 *         newPassword:
 *           type: string
 *           minLength: 8
 *           description: كلمة المرور الجديدة
 *           example: "NewPassword123!"
 */
export const changePasswordSchema = Joi.object({
  oldPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'كلمة المرور الحالية مطلوبة',
      'string.empty': 'كلمة المرور الحالية لا يمكن أن تكون فارغة'
    }),

  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'كلمة المرور الجديدة يجب أن تكون على الأقل 8 أحرف',
      'string.pattern.base': 'كلمة المرور يجب أن تحتوي على حرف كبير وصغير ورقم ورمز خاص',
      'any.required': 'كلمة المرور الجديدة مطلوبة',
      'string.empty': 'كلمة المرور الجديدة لا يمكن أن تكون فارغة'
    })
});

/**
 * مخطط التحقق من صحة معاملات الاستعلام للبحث عن الفنانين
 * @swagger
 * components:
 *   schemas:
 *     DiscoverArtistsQuerySchema:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           description: رقم الصفحة
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *           description: عدد النتائج في الصفحة
 *         sort:
 *           type: string
 *           enum: [newest, popular, recommended]
 *           default: newest
 *           description: طريقة الترتيب
 *         search:
 *           type: string
 *           minLength: 2
 *           description: نص البحث
 *         category:
 *           type: string
 *           description: فئة الفن
 *         location:
 *           type: string
 *           description: الموقع الجغرافي
 */
export const discoverArtistsQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'رقم الصفحة يجب أن يكون أكبر من 0',
      'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .messages({
      'number.min': 'عدد النتائج يجب أن يكون أكبر من 0',
      'number.max': 'عدد النتائج يجب أن يكون أقل من أو يساوي 50',
      'number.integer': 'عدد النتائج يجب أن يكون رقم صحيح'
    }),

  sort: Joi.string()
    .valid('newest', 'popular', 'recommended')
    .default('newest')
    .messages({
      'any.only': 'طريقة الترتيب يجب أن تكون newest أو popular أو recommended'
    }),

  search: Joi.string()
    .trim()
    .min(2)
    .optional()
    .messages({
      'string.min': 'نص البحث يجب أن يكون على الأقل حرفين'
    }),

  category: Joi.string()
    .trim()
    .optional(),

  location: Joi.string()
    .trim()
    .optional()
});

/**
 * مخطط التحقق من صحة تحديث تفضيلات اللغة
 * @swagger
 * components:
 *   schemas:
 *     LanguagePreferenceSchema:
 *       type: object
 *       required:
 *         - language
 *       properties:
 *         language:
 *           type: string
 *           enum: [ar, en]
 *           description: رمز اللغة المفضلة
 *           example: "ar"
 */
export const languagePreferenceSchema = Joi.object({
  language: Joi.string()
    .valid('ar', 'en')
    .required()
    .messages({
      'any.only': 'اللغة يجب أن تكون "ar" للعربية أو "en" للإنجليزية',
      'any.required': 'اللغة المفضلة مطلوبة',
      'string.empty': 'اللغة المفضلة لا يمكن أن تكون فارغة'
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
 *           description: تفعيل الإشعارات المباشرة
 *           example: true
 *         enableEmail:
 *           type: boolean
 *           description: تفعيل إشعارات البريد الإلكتروني
 *           example: false
 *         muteChat:
 *           type: boolean
 *           description: كتم إشعارات المحادثات
 *           example: false
 *         categories:
 *           type: object
 *           description: إعدادات إشعارات الفئات
 *           properties:
 *             newArtworks:
 *               type: boolean
 *               description: إشعارات الأعمال الجديدة
 *             sales:
 *               type: boolean
 *               description: إشعارات المبيعات
 *             follows:
 *               type: boolean
 *               description: إشعارات المتابعات الجديدة
 *             messages:
 *               type: boolean
 *               description: إشعارات الرسائل
 */
export const notificationSettingsSchema = Joi.object({
  enablePush: Joi.boolean().optional(),
  enableEmail: Joi.boolean().optional(),
  muteChat: Joi.boolean().optional(),
  categories: Joi.object({
    newArtworks: Joi.boolean().optional(),
    sales: Joi.boolean().optional(),
    follows: Joi.boolean().optional(),
    messages: Joi.boolean().optional()
  }).optional()
}).min(1).messages({
  'object.min': 'يجب توفير إعداد واحد على الأقل للتحديث'
});

/**
 * مخطط التحقق من صحة حذف الحساب
 * @swagger
 * components:
 *   schemas:
 *     DeleteAccountSchema:
 *       type: object
 *       properties:
 *         password:
 *           type: string
 *           description: كلمة المرور للتأكيد
 *         reason:
 *           type: string
 *           maxLength: 500
 *           description: سبب حذف الحساب (اختياري)
 *         confirmText:
 *           type: string
 *           pattern: '^حذف الحساب$'
 *           description: نص التأكيد (يجب أن يكون "حذف الحساب")
 */
export const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .optional()
    .messages({
      'string.empty': 'كلمة المرور لا يمكن أن تكون فارغة'
    }),

  reason: Joi.string()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'سبب الحذف يجب أن يكون أقل من 500 حرف'
    }),

  confirmText: Joi.string()
    .pattern(/^حذف الحساب$/)
    .optional()
    .messages({
      'string.pattern.base': 'نص التأكيد يجب أن يكون "حذف الحساب" بالضبط'
    })
});

/**
 * مخطط التحقق من صحة إعادة تنشيط الحساب
 * @swagger
 * components:
 *   schemas:
 *     ReactivateAccountSchema:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: البريد الإلكتروني
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           description: كلمة المرور
 */
export const reactivateAccountSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'البريد الإلكتروني غير صالح',
      'any.required': 'البريد الإلكتروني مطلوب',
      'string.empty': 'البريد الإلكتروني لا يمكن أن يكون فارغاً'
    }),

  password: Joi.string()
    .required()
    .messages({
      'any.required': 'كلمة المرور مطلوبة',
      'string.empty': 'كلمة المرور لا يمكن أن تكون فارغة'
    })
});

/**
 * مخطط التحقق من صحة معاملات المتابعين والمتابَعين
 * @swagger
 * components:
 *   schemas:
 *     FollowersQuerySchema:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         search:
 *           type: string
 *           minLength: 2
 *           description: البحث في أسماء المتابعين
 */
export const followersQuerySchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'رقم الصفحة يجب أن يكون أكبر من 0',
      'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'عدد النتائج يجب أن يكون أكبر من 0',
      'number.max': 'عدد النتائج يجب أن يكون أقل من أو يساوي 100',
      'number.integer': 'عدد النتائج يجب أن يكون رقم صحيح'
    }),

  search: Joi.string()
    .trim()
    .min(2)
    .optional()
    .messages({
      'string.min': 'نص البحث يجب أن يكون على الأقل حرفين'
    })
});

/**
 * مخطط التحقق من صحة معرف المستخدم في المسار
 * @swagger
 * components:
 *   schemas:
 *     UserIdParamSchema:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: معرف المستخدم
 */
export const userIdParamSchema = Joi.object({
  userId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'معرف المستخدم يجب أن يكون معرف MongoDB صالح',
      'any.required': 'معرف المستخدم مطلوب',
      'string.empty': 'معرف المستخدم لا يمكن أن يكون فارغاً'
    })
});

/**
 * مخطط التحقق من صحة معرف الفنان في المسار
 * @swagger
 * components:
 *   schemas:
 *     ArtistIdParamSchema:
 *       type: object
 *       required:
 *         - artistId
 *       properties:
 *         artistId:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: معرف الفنان
 */
export const artistIdParamSchema = Joi.object({
  artistId: Joi.string()
    .pattern(objectIdPattern)
    .required()
    .messages({
      'string.pattern.base': 'معرف الفنان يجب أن يكون معرف MongoDB صالح',
      'any.required': 'معرف الفنان مطلوب',
      'string.empty': 'معرف الفنان لا يمكن أن يكون فارغاً'
    })
});

/**
 * مخطط التحقق من صحة البحث المتقدم عن المستخدمين
 * @swagger
 * components:
 *   schemas:
 *     SearchUsersSchema:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           minLength: 2
 *           description: نص البحث
 *         role:
 *           type: string
 *           enum: [user, artist, admin]
 *           description: دور المستخدم
 *         location:
 *           type: string
 *           description: الموقع الجغرافي
 *         verified:
 *           type: boolean
 *           description: المستخدمون المتحققون فقط
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 */
export const searchUsersSchema = Joi.object({
  query: Joi.string()
    .trim()
    .min(2)
    .optional()
    .messages({
      'string.min': 'نص البحث يجب أن يكون على الأقل حرفين'
    }),

  role: Joi.string()
    .valid('user', 'artist', 'admin')
    .optional()
    .messages({
      'any.only': 'الدور يجب أن يكون user أو artist أو admin'
    }),

  location: Joi.string()
    .trim()
    .optional(),

  verified: Joi.boolean()
    .optional(),

  page: Joi.number()
    .integer()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'رقم الصفحة يجب أن يكون أكبر من 0',
      'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح'
    }),

  limit: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .default(20)
    .messages({
      'number.min': 'عدد النتائج يجب أن يكون أكبر من 0',
      'number.max': 'عدد النتائج يجب أن يكون أقل من أو يساوي 50',
      'number.integer': 'عدد النتائج يجب أن يكون رقم صحيح'
    })
});

/**
 * مخطط التحقق من صحة تحديث الخصوصية
 * @swagger
 * components:
 *   schemas:
 *     PrivacySettingsSchema:
 *       type: object
 *       properties:
 *         profileVisibility:
 *           type: string
 *           enum: [public, private, friends]
 *           description: مستوى خصوصية الملف الشخصي
 *         showEmail:
 *           type: boolean
 *           description: إظهار البريد الإلكتروني
 *         showPhone:
 *           type: boolean
 *           description: إظهار رقم الهاتف
 *         allowMessages:
 *           type: string
 *           enum: [everyone, followers, none]
 *           description: من يمكنه إرسال الرسائل
 *         showActivity:
 *           type: boolean
 *           description: إظهار النشاط الأخير
 */
export const privacySettingsSchema = Joi.object({
  profileVisibility: Joi.string()
    .valid('public', 'private', 'friends')
    .optional()
    .messages({
      'any.only': 'مستوى الخصوصية يجب أن يكون public أو private أو friends'
    }),

  showEmail: Joi.boolean().optional(),
  showPhone: Joi.boolean().optional(),
  showActivity: Joi.boolean().optional(),

  allowMessages: Joi.string()
    .valid('everyone', 'followers', 'none')
    .optional()
    .messages({
      'any.only': 'إعداد الرسائل يجب أن يكون everyone أو followers أو none'
    })
}).min(1).messages({
  'object.min': 'يجب توفير إعداد واحد على الأقل للتحديث'
});

// تصدير جميع المخططات
export const userValidationSchemas = {
  toggleWishlistSchema,
  updateProfileSchema,
  changePasswordSchema,
  discoverArtistsQuerySchema,
  languagePreferenceSchema,
  notificationSettingsSchema,
  deleteAccountSchema,
  reactivateAccountSchema,
  followersQuerySchema,
  userIdParamSchema,
  artistIdParamSchema,
  searchUsersSchema,
  privacySettingsSchema
};

export default userValidationSchemas; 