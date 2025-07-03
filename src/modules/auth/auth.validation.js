import Joi from 'joi';

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - confirmPassword
 *         - displayName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: البريد الإلكتروني للمستخدم
 *           example: "user@example.com"
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           description: كلمة المرور (8 أحرف على الأقل، تحتوي على حرف كبير ورقم أو رمز خاص)
 *           example: "Password123!"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           description: تأكيد كلمة المرور
 *           example: "Password123!"
 *         displayName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: اسم المستخدم للعرض
 *           example: "أحمد محمد"
 *         phoneNumber:
 *           type: string
 *           pattern: '^\+[1-9]\d{1,14}$'
 *           description: رقم الهاتف (اختياري)
 *           example: "+966512345678"
 *     
 *     LoginRequest:
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
 *           format: password
 *           description: كلمة المرور
 *           example: "Password123!"
 */

// Password validation pattern
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;

// Common validation schemas
const emailSchema = Joi.string()
  .email({ tlds: { allow: false } })
  .required()
  .messages({
    'string.email': 'يرجى إدخال بريد إلكتروني صحيح',
    'any.required': 'البريد الإلكتروني مطلوب'
  });

const passwordSchema = Joi.string()
  .min(8)
  .pattern(passwordPattern)
  .required()
  .messages({
    'string.min': 'كلمة المرور يجب أن تكون 8 أحرف على الأقل',
    'string.pattern.base': 'كلمة المرور يجب أن تحتوي على حرف كبير وحرف صغير ورقم أو رمز خاص',
    'any.required': 'كلمة المرور مطلوبة'
  });

const displayNameSchema = Joi.string()
  .min(2)
  .max(50)
  .trim()
  .required()
  .messages({
    'string.min': 'الاسم يجب أن يكون حرفين على الأقل',
    'string.max': 'الاسم يجب أن يكون أقل من 50 حرف',
    'any.required': 'الاسم مطلوب'
  });

// Registration validation
export const registerSchema = {
  body: Joi.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'تأكيد كلمة المرور غير مطابق',
        'any.required': 'تأكيد كلمة المرور مطلوب'
      }),
    displayName: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .messages({
        'string.min': 'الاسم يجب أن يكون حرفين على الأقل',
        'string.max': 'الاسم يجب أن يكون أقل من 50 حرف'
      }),
    job: Joi.string()
      .min(2)
      .max(100)
      .trim()
      .optional()
      .messages({
        'string.min': 'المهنة يجب أن تكون حرفين على الأقل',
        'string.max': 'المهنة يجب أن تكون أقل من 100 حرف'
      }),
    role: Joi.string()
      .valid('user', 'artist')
      .optional()
      .messages({
        'any.only': 'نوع المستخدم يجب أن يكون مستخدم أو فنان'
      }),
    fingerprint: Joi.string()
      .min(10)
      .max(500)
      .optional()
      .messages({
        'string.min': 'بصمة الجهاز قصيرة جداً',
        'string.max': 'بصمة الجهاز طويلة جداً'
      })
  })
};

// Login validation
export const loginSchema = {
  body: Joi.object({
    email: emailSchema,
    password: Joi.string()
      .required()
      .messages({
        'any.required': 'كلمة المرور مطلوبة'
      })
  })
};

// Fingerprint login validation
export const fingerprintLoginSchema = {
  body: Joi.object({
    fingerprint: Joi.string()
      .required()
      .min(10)
      .max(500)
      .messages({
        'any.required': 'بصمة الجهاز مطلوبة',
        'string.min': 'بصمة الجهاز قصيرة جداً',
        'string.max': 'بصمة الجهاز طويلة جداً'
      })
  })
};

// Update fingerprint validation
export const updateFingerprintSchema = {
  body: Joi.object({
    fingerprint: Joi.string()
      .required()
      .min(10)
      .max(500)
      .messages({
        'any.required': 'بصمة الجهاز مطلوبة',
        'string.min': 'بصمة الجهاز قصيرة جداً',
        'string.max': 'بصمة الجهاز طويلة جداً'
      })
  })
};

// Forget password validation
export const forgetPasswordSchema = {
  body: Joi.object({
    email: emailSchema
  })
};

// Verify forget code validation
export const verifyForgetCodeSchema = {
  body: Joi.object({
    email: emailSchema,
    forgetCode: Joi.string()
      .pattern(/^\d{4}$/)
      .required()
      .messages({
        'string.pattern.base': 'رمز التحقق يجب أن يكون 4 أرقام',
        'any.required': 'رمز التحقق مطلوب'
      })
  })
};

// Reset password validation
export const resetPasswordSchema = {
  body: Joi.object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'تأكيد كلمة المرور غير مطابق',
        'any.required': 'تأكيد كلمة المرور مطلوب'
      })
  })
};

// FCM token validation
export const fcmTokenSchema = {
  body: Joi.object({
    fcmToken: Joi.string()
      .required()
      .messages({
        'any.required': 'رمز الإشعارات مطلوب',
        'string.empty': 'رمز الإشعارات لا يمكن أن يكون فارغ'
      })
  })
};

// Refresh token validation
export const refreshTokenSchema = {
  body: Joi.object({
    refreshToken: Joi.string()
      .required()
      .messages({
        'any.required': 'رمز التحديث مطلوب',
        'string.empty': 'رمز التحديث لا يمكن أن يكون فارغ'
      })
  })
};

// Export all schemas for easy access
export default {
  registerSchema,
  loginSchema,
  fingerprintLoginSchema,
  updateFingerprintSchema,
  forgetPasswordSchema,
  verifyForgetCodeSchema,
  resetPasswordSchema,
  fcmTokenSchema,
  refreshTokenSchema
};
