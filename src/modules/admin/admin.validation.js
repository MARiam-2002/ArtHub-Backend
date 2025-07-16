import joi from 'joi';

// Password validation pattern
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

// Common validation schemas
const emailSchema = joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    'string.email': 'يرجى إدخال بريد إلكتروني صحيح',
    'any.required': 'البريد الإلكتروني مطلوب'
  });

const passwordSchema = joi.string()
  .min(8)
  .pattern(passwordPattern)
  .required()
  .messages({
    'string.min': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    'string.pattern.base': 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم أو رمز خاص',
    'any.required': 'كلمة المرور مطلوبة'
  });

// Admin login validation
export const adminLoginSchema = {
  body: joi.object({
    email: emailSchema,
    password: joi.string()
      .required()
      .messages({
        'any.required': 'كلمة المرور مطلوبة'
      })
  })
};

// Get admins validation
export const getAdminsSchema = {
  query: joi.object({
    page: joi.number().integer().min(1).optional(),
    limit: joi.number().integer().min(1).max(100).optional(),
    sort: joi.string().optional(),
    fields: joi.string().optional(),
    search: joi.string().optional(),
    role: joi.string().valid('admin', 'superadmin').optional(),
    status: joi.string().valid('active', 'inactive', 'banned').optional(),
  })
};

// Create admin validation
export const createAdminSchema = {
  body: joi.object({
    email: emailSchema,
    password: passwordSchema,
    displayName: joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'الاسم يجب أن يكون حرفين على الأقل',
        'string.max': 'الاسم يجب أن يكون أقل من 50 حرف'
      }),
    role: joi.string()
      .valid('admin', 'superadmin')
      .default('admin')
      .messages({
        'any.only': 'نوع المستخدم يجب أن يكون admin أو superadmin'
      })
  })
};

// Update admin validation
export const updateAdminSchema = {
  body: joi.object({
    displayName: joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'الاسم يجب أن يكون حرفين على الأقل',
        'string.max': 'الاسم يجب أن يكون أقل من 50 حرف'
      }),
    status: joi.string()
      .valid('active', 'inactive', 'banned')
      .optional()
      .messages({
        'any.only': 'الحالة يجب أن تكون active أو inactive أو banned'
      }),
    isActive: joi.boolean()
      .optional()
      .messages({
        'boolean.base': 'حالة النشاط يجب أن تكون true أو false'
      }),
    role: joi.string()
      .valid('admin', 'superadmin')
      .optional()
      .messages({
        'any.only': 'نوع المستخدم يجب أن يكون admin أو superadmin'
      })
  })
};

// Change admin password validation
export const changeAdminPasswordSchema = {
  body: joi.object({
    newPassword: passwordSchema
  })
};

// Update admin profile validation
export const updateAdminProfileSchema = {
  body: joi.object({
    displayName: joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'الاسم يجب أن يكون حرفين على الأقل',
        'string.max': 'الاسم يجب أن يكون أقل من 50 حرف'
      })
  })
};

// Change own password validation
export const changeOwnPasswordSchema = {
  body: joi.object({
    currentPassword: joi.string()
      .required()
      .messages({
        'any.required': 'كلمة المرور الحالية مطلوبة'
      }),
    newPassword: passwordSchema
  })
};

// Get users validation (existing)
export const getUsersSchema = {
  query: joi.object({
    page: joi.number().integer().min(1).optional(),
    limit: joi.number().integer().min(1).max(100).optional(),
    sort: joi.string().optional(),
    fields: joi.string().optional(),
    search: joi.string().optional(),
    role: joi.string().valid('user', 'artist').optional(),
    status: joi.string().valid('active', 'inactive', 'banned').optional(),
  })
}; 