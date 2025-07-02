import joi from 'joi';

/**
 * Default validation error messages in Arabic
 */
const defaultMessages = {
  'string.base': '{#label} يجب أن يكون نصًا.',
  'string.empty': '{#label} مطلوب ولا يمكن أن يكون فارغًا.',
  'string.min': '{#label} يجب أن يكون على الأقل {#limit} أحرف.',
  'string.max': '{#label} يجب ألا يزيد عن {#limit} أحرف.',
  'string.pattern.base': '{#label} يحتوي على تنسيق غير صالح.',
  'string.email': '{#label} يجب أن يكون بريد إلكتروني صالح.',
  'string.uri': '{#label} يجب أن يكون رابطًا صالحًا.',
  'number.base': '{#label} يجب أن يكون رقمًا.',
  'number.min': '{#label} يجب أن يكون على الأقل {#limit}.',
  'number.max': '{#label} يجب ألا يزيد عن {#limit}.',
  'boolean.base': '{#label} يجب أن يكون true أو false.',
  'any.only': '{#label} يجب أن يكون إحدى القيم المسموحة.',
  'any.required': '{#label} مطلوب.'
};

/**
 * MongoDB ObjectId pattern
 */
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Password pattern (minimum 8 characters, at least one letter and one number)
 */
const passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;

/**
 * Update profile validation schema
 */
export const updateProfileSchema = joi.object({
  displayName: joi
    .string()
    .min(2)
    .max(50)
    .optional()
    .label('الاسم')
    .messages(defaultMessages),
  
  bio: joi
    .string()
    .max(500)
    .optional()
    .allow('')
    .label('النبذة الشخصية')
    .messages(defaultMessages),
  
  job: joi
    .string()
    .max(100)
    .optional()
    .allow('')
    .label('المهنة')
    .messages(defaultMessages),
  
  location: joi
    .string()
    .max(100)
    .optional()
    .allow('')
    .label('الموقع')
    .messages(defaultMessages),
  
  website: joi
    .string()
    .uri()
    .optional()
    .allow('')
    .label('الموقع الإلكتروني')
    .messages(defaultMessages),
  
  socialMedia: joi
    .object({
      instagram: joi.string().max(100).optional().allow('').label('إنستغرام'),
      twitter: joi.string().max(100).optional().allow('').label('تويتر'),
      facebook: joi.string().max(100).optional().allow('').label('فيسبوك')
    })
    .optional()
    .label('وسائل التواصل الاجتماعي'),
  
  profileImage: joi
    .object({
      url: joi.string().uri().required().label('رابط الصورة'),
      publicId: joi.string().required().label('معرف الصورة')
    })
    .optional()
    .label('صورة الملف الشخصي')
});

/**
 * Change password validation schema
 */
export const changePasswordSchema = joi.object({
  currentPassword: joi
    .string()
    .required()
    .label('كلمة المرور الحالية')
    .messages(defaultMessages),
  
  newPassword: joi
    .string()
    .pattern(passwordPattern)
    .required()
    .label('كلمة المرور الجديدة')
    .messages({
      ...defaultMessages,
      'string.pattern.base': 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف واحد ورقم واحد على الأقل'
    }),
  
  confirmPassword: joi
    .string()
    .valid(joi.ref('newPassword'))
    .required()
    .label('تأكيد كلمة المرور')
    .messages({
      ...defaultMessages,
      'any.only': 'تأكيد كلمة المرور يجب أن يطابق كلمة المرور الجديدة'
    })
});

/**
 * Toggle wishlist validation schema
 */
export const toggleWishlistSchema = joi.object({
  artworkId: joi
    .string()
    .pattern(objectIdPattern)
    .required()
    .label('معرف العمل الفني')
    .messages({
      ...defaultMessages,
      'string.pattern.base': 'معرف العمل الفني غير صالح'
    })
});

/**
 * Artist ID parameter validation schema
 */
export const artistIdSchema = joi.object({
  artistId: joi
    .string()
    .pattern(objectIdPattern)
    .required()
    .label('معرف الفنان')
    .messages({
      ...defaultMessages,
      'string.pattern.base': 'معرف الفنان غير صالح'
    })
});

/**
 * Pagination validation schema
 */
export const paginationSchema = joi.object({
  page: joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .label('رقم الصفحة')
    .messages(defaultMessages),
  
  limit: joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .label('عدد العناصر في الصفحة')
    .messages(defaultMessages)
});

/**
 * My artworks query validation schema
 */
export const myArtworksSchema = joi.object({
  page: joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .label('رقم الصفحة')
    .messages(defaultMessages),
  
  limit: joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .label('عدد العناصر في الصفحة')
    .messages(defaultMessages),
  
  status: joi
    .string()
    .valid('available', 'sold')
    .optional()
    .label('حالة التوفر')
    .messages(defaultMessages)
});

/**
 * Notification settings validation schema
 */
export const notificationSettingsSchema = joi.object({
  notificationSettings: joi
    .object({
      pushNotifications: joi
        .boolean()
        .optional()
        .label('الإشعارات الفورية')
        .messages(defaultMessages),
      
      emailNotifications: joi
        .boolean()
        .optional()
        .label('إشعارات البريد الإلكتروني')
        .messages(defaultMessages),
      
      messageNotifications: joi
        .boolean()
        .optional()
        .label('إشعارات الرسائل')
        .messages(defaultMessages),
      
      followNotifications: joi
        .boolean()
        .optional()
        .label('إشعارات المتابعة')
        .messages(defaultMessages),
      
      artworkNotifications: joi
        .boolean()
        .optional()
        .label('إشعارات الأعمال الفنية')
        .messages(defaultMessages),
      
      marketingNotifications: joi
        .boolean()
        .optional()
        .label('الإشعارات التسويقية')
        .messages(defaultMessages)
    })
    .required()
    .label('إعدادات الإشعارات')
    .messages(defaultMessages)
});

/**
 * Delete account validation schema
 */
export const deleteAccountSchema = joi.object({
  password: joi
    .string()
    .required()
    .label('كلمة المرور')
    .messages(defaultMessages)
});

/**
 * User ID parameter validation schema
 */
export const userIdSchema = joi.object({
  userId: joi
    .string()
    .pattern(objectIdPattern)
    .required()
    .label('معرف المستخدم')
    .messages({
      ...defaultMessages,
      'string.pattern.base': 'معرف المستخدم غير صالح'
    })
});

/**
 * Search users validation schema
 */
export const searchUsersSchema = joi.object({
  q: joi
    .string()
    .min(2)
    .max(100)
    .required()
    .label('نص البحث')
    .messages(defaultMessages),
  
  type: joi
    .string()
    .valid('all', 'artist', 'user')
    .default('all')
    .optional()
    .label('نوع المستخدم')
    .messages(defaultMessages),
  
  page: joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .label('رقم الصفحة')
    .messages(defaultMessages),
  
  limit: joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .label('عدد العناصر في الصفحة')
    .messages(defaultMessages)
});

// تصدير جميع المخططات
export const userValidationSchemas = {
  toggleWishlistSchema,
  updateProfileSchema,
  changePasswordSchema,
  notificationSettingsSchema,
  deleteAccountSchema,
  userIdSchema,
  searchUsersSchema
};

export default userValidationSchemas; 