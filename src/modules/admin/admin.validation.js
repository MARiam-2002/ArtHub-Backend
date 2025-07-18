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
  files: joi.object({
    profileImage: joi.object({
      fieldname: joi.string().valid('profileImage'),
      originalname: joi.string(),
      encoding: joi.string(),
      mimetype: joi.string().valid('image/jpeg', 'image/png', 'image/jpg'),
      size: joi.number().max(5 * 1024 * 1024), // 5MB max
      destination: joi.string(),
      filename: joi.string(),
      path: joi.string()
    }).optional()
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
  })
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
      })
  })
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
    // No query parameters needed - frontend will handle filtering and sorting
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
  }),
  body: joi.object({
    action: joi.string().valid('block', 'unblock').required().messages({
      'any.only': 'الإجراء يجب أن يكون block أو unblock',
      'any.required': 'الإجراء مطلوب'
    }),
    reason: joi.string().optional()
  })
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
      'string.min': 'موضوع الرسالة مطلوب',
      'string.max': 'موضوع الرسالة يجب أن يكون أقل من 200 حرف',
      'any.required': 'موضوع الرسالة مطلوب'
    }),
    message: joi.string().min(1).max(2000).required().messages({
      'string.min': 'نص الرسالة مطلوب',
      'string.max': 'نص الرسالة يجب أن يكون أقل من 2000 حرف',
      'any.required': 'نص الرسالة مطلوب'
    }),
    deliveryMethod: joi.string().valid('email', 'chat', 'both').required().messages({
      'any.only': 'طريقة التوصيل يجب أن تكون email أو chat أو both',
      'any.required': 'طريقة التوصيل مطلوبة'
    }),
    attachments: joi.array().items(joi.string().uri()).optional()
  })
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
    limit: joi.number().integer().min(1).max(100).default(20),
    rating: joi.number().integer().min(1).max(5).optional(),
    sortBy: joi.string().valid('createdAt', 'rating').default('createdAt'),
    sortOrder: joi.string().valid('asc', 'desc').default('desc')
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
    page: joi.number().integer().min(1).optional(),
    limit: joi.number().integer().min(1).max(100).default(20),
    activityType: joi.string().valid('login', 'order', 'review', 'profile_update', 'artwork_view').optional(),
    dateFrom: joi.date().iso().optional(),
    dateTo: joi.date().iso().optional()
  })
};

// Export users validation
export const exportUsersSchema = {
  query: joi.object({
    format: joi.string().valid('csv', 'excel').default('csv'),
    role: joi.string().valid('user', 'artist', 'all').default('all'),
    status: joi.string().valid('active', 'inactive', 'banned', 'all').default('all'),
    dateFrom: joi.date().iso().optional(),
    dateTo: joi.date().iso().optional()
  })
}; 