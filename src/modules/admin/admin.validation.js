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
  }),
  file: joi.object({
    fieldname: joi.string().valid('profileImage').optional(),
    originalname: joi.string().optional(),
    encoding: joi.string().optional(),
    mimetype: joi.string().valid('image/jpeg', 'image/png', 'image/jpg').optional(),
    size: joi.number().max(5 * 1024 * 1024).optional(), // 5MB max
    destination: joi.string().optional(),
    filename: joi.string().optional(),
    path: joi.string().optional()
  }).optional()
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
    email: joi.string()
      .email({ tlds: { allow: false } })
      .optional()
      .messages({
        'string.email': 'يرجى إدخال بريد إلكتروني صحيح'
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
      }),
    password: joi.string()
      .min(8)
      .pattern(passwordPattern)
      .optional()
      .messages({
        'string.min': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
        'string.pattern.base': 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم أو رمز خاص'
      })
  }),
  file: joi.object({
    fieldname: joi.string().valid('profileImage').optional(),
    originalname: joi.string().optional(),
    encoding: joi.string().optional(),
    mimetype: joi.string().valid('image/jpeg', 'image/png', 'image/jpg').optional(),
    size: joi.number().max(5 * 1024 * 1024).optional(), // 5MB max
    destination: joi.string().optional(),
    filename: joi.string().optional(),
    path: joi.string().optional()
  }).optional()
};

// Change admin password validation
export const changeAdminPasswordSchema = {
  body: joi.object({
    newPassword: passwordSchema
  })
};

// Update admin profile validation
export const updateProfileSchema = {
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
    email: joi.string()
      .email({ tlds: { allow: false } })
      .optional()
      .messages({
        'string.email': 'يرجى إدخال بريد إلكتروني صحيح'
      }),
    currentPassword: joi.string()
      .optional()
      .messages({
        'string.base': 'كلمة المرور الحالية يجب أن تكون نصاً'
      }),
    newPassword: joi.string()
      .min(8)
      .max(50)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .optional()
      .messages({
        'string.min': 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل',
        'string.max': 'كلمة المرور الجديدة يجب أن تكون أقل من 50 حرف',
        'string.pattern.base': 'كلمة المرور الجديدة يجب أن تحتوي على حرف كبير وحرف صغير ورقم ورمز خاص'
      }),
    confirmNewPassword: joi.string()
      .optional()
      .messages({
        'string.base': 'تأكيد كلمة المرور يجب أن يكون نصاً'
      })
  }).custom((value, helpers) => {
    // If newPassword is provided, currentPassword and confirmNewPassword are required
    if (value.newPassword && !value.currentPassword) {
      return helpers.error('any.invalid', { message: 'كلمة المرور الحالية مطلوبة لتغيير كلمة المرور' });
    }
    if (value.newPassword && !value.confirmNewPassword) {
      return helpers.error('any.invalid', { message: 'تأكيد كلمة المرور مطلوب' });
    }
    if (value.newPassword && value.newPassword !== value.confirmNewPassword) {
      return helpers.error('any.invalid', { message: 'كلمة المرور الجديدة وتأكيدها غير متطابقين' });
    }
    return value;
  }),
  file: joi.object({
    fieldname: joi.string().valid('profileImage').optional(),
    originalname: joi.string().optional(),
    encoding: joi.string().optional(),
    mimetype: joi.string().valid('image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp').optional(),
    size: joi.number().max(5 * 1024 * 1024).optional(), // 5MB max
    destination: joi.string().optional(),
    filename: joi.string().optional(),
    path: joi.string().optional()
  }).optional()
};

// Change own password validation
export const changePasswordSchema = {
  body: joi.object({
    currentPassword: joi.string()
      .required()
      .messages({
        'any.required': 'كلمة المرور الحالية مطلوبة'
      }),
    newPassword: passwordSchema
  })
};

// Get users validation
export const getUsersSchema = {
  query: joi.object({
    page: joi.number().integer().min(1).default(1).messages({
      'number.base': 'رقم الصفحة يجب أن يكون رقماً',
      'number.integer': 'رقم الصفحة يجب أن يكون رقماً صحيحاً',
      'number.min': 'رقم الصفحة يجب أن يكون أكبر من 0'
    }),
    limit: joi.alternatives().try(
      joi.string().valid('full').messages({
        'string.base': 'قيمة limit يجب أن تكون رقماً أو "full"',
        'any.only': 'قيمة limit يجب أن تكون رقماً أو "full"'
      }),
      joi.number().integer().min(1).max(100).messages({
        'number.base': 'عدد العناصر يجب أن يكون رقماً',
        'number.integer': 'عدد العناصر يجب أن يكون رقماً صحيحاً',
        'number.min': 'عدد العناصر يجب أن يكون أكبر من 0',
        'number.max': 'عدد العناصر يجب أن يكون أقل من 100'
      })
    ).default(10)
  })
};

// Get user details validation
export const getUserDetailsSchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  })
};

// Block user validation
export const blockUserSchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  })
  // لا حاجة لـ body validation لأننا لا نرسل أي بيانات
};

// Send message validation
export const sendMessageSchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  }),
  body: joi.object({
    subject: joi.string().min(1).max(200).required().messages({
      'string.min': 'موضوع الرسالة يجب أن يكون حرف واحد على الأقل',
      'string.max': 'موضوع الرسالة يجب أن يكون أقل من 200 حرف',
      'any.required': 'موضوع الرسالة مطلوب'
    }),
    message: joi.string().min(1).max(2000).required().messages({
      'string.min': 'نص الرسالة مطلوب',
      'string.max': 'نص الرسالة يجب أن يكون أقل من 2000 حرف',
      'any.required': 'نص الرسالة مطلوب'
    })
  }).unknown(true) // السماح بحقول إضافية مثل الملفات
};

// Get user orders validation
export const getUserOrdersSchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  }),
  query: joi.object({
    page: joi.number().integer().min(1).optional(),
    limit: joi.number().integer().min(1).max(100).default(20),
    status: joi.string().valid('pending', 'accepted', 'rejected', 'completed', 'cancelled').optional(),
    sortBy: joi.string().valid('createdAt', 'updatedAt', 'price').default('createdAt'),
    sortOrder: joi.string().valid('asc', 'desc').default('desc')
  })
};

// Get user reviews validation
export const getUserReviewsSchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  }),
  query: joi.object({
    page: joi.number().integer().min(1).optional(),
    limit: joi.number().integer().min(1).max(100).default(10)
  })
};

// Get user activity validation
export const getUserActivitySchema = {
  params: joi.object({
    id: joi.string().required().messages({
      'any.required': 'معرف المستخدم مطلوب'
    })
  }),
                query: joi.object({
                page: joi.number().integer().min(1).optional().default(1),
                limit: joi.number().integer().default(10)
              })
};

// Export users validation
export const exportUsersSchema = {
  query: joi.object({})
};

// Get all artists validation
export const getAllArtistsSchema = {
  query: joi.object({
    page: joi.number().integer().min(1).optional().default(1),
    limit: joi.number().integer().min(1).max(100).optional().default(10),
    search: joi.string().min(1).max(100).optional(),
    status: joi.string().valid('active', 'inactive', 'banned').optional(),
    sortBy: joi.string().valid('createdAt', 'displayName', 'artworksCount', 'totalSales').default('createdAt'),
    sortOrder: joi.string().valid('asc', 'desc').default('desc')
  })
};

// Get artist details validation
export const getArtistDetailsSchema = {
  params: joi.object({
    artistId: joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'معرف الفنان غير صالح',
      'any.required': 'معرف الفنان مطلوب'
    })
  }),
  query: joi.object({
    page: joi.number().integer().min(1).optional().default(1),
    limit: joi.number().integer().min(1).max(100).optional().default(10)
  })
};

// Update artist status validation
export const updateArtistStatusSchema = {
  params: joi.object({
    artistId: joi.string().pattern(/^[0-9a-fA-F]{24}$/).required().messages({
      'string.pattern.base': 'معرف الفنان غير صالح',
      'any.required': 'معرف الفنان مطلوب'
    })
  }),
  body: joi.object({
    status: joi.string().valid('active', 'inactive', 'banned').required().messages({
      'any.only': 'الحالة يجب أن تكون active أو inactive أو banned',
      'any.required': 'الحالة مطلوبة'
    }),
    reason: joi.string().min(1).max(500).optional().messages({
      'string.min': 'سبب الحظر يجب أن يكون حرف واحد على الأقل',
      'string.max': 'سبب الحظر يجب أن يكون أقل من 500 حرف'
    })
  }).custom((value, helpers) => {
    // إذا كانت الحالة banned، يجب إرسال سبب
    if (value.status === 'banned' && !value.reason) {
      return helpers.error('any.invalid', { message: 'سبب الحظر مطلوب عند حظر الفنان' });
    }
    return value;
  })
}; 