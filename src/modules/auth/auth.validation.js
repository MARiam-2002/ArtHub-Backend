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
  'any.required': '{#label} مطلوب.',
  'any.only': '{#label} يجب أن يكون من القيم المسموح بها.',
  'string.email': 'البريد الإلكتروني غير صالح، يرجى إدخال بريد إلكتروني صحيح.'
};

/**
 * Password pattern: At least 8 characters, one uppercase, one number or special character
 */
const passwordPattern = /^(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*(),.?":{}|<>])(?=.{8,}).*$/;
const passwordMessage = 'يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، حرف كبير، ورقم أو رمز خاص.';

/**
 * Verification code pattern: 4 digits
 */
const codePattern = /^\d{4}$/;
const codeMessage = '{#label} يجب أن يتكون من 4 أرقام.';

/**
 * Registration validation schema
 * @swagger
 * components:
 *   schemas:
 *     RegisterValidation:
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
 *         password:
 *           type: string
 *           format: password
 *         confirmPassword:
 *           type: string
 *           format: password
 *         displayName:
 *           type: string
 *         phoneNumber:
 *           type: string
 *         job:
 *           type: string
 */
export const registerSchema = joi
  .object({
    email: joi.string().email().required().label('البريد الإلكتروني'),
    password: joi
      .string()
      .pattern(passwordPattern)
      .required()
      .label('كلمة المرور')
      .messages({
        ...defaultMessages,
        'string.pattern.base': passwordMessage
      }),
    confirmPassword: joi
      .string()
      .valid(joi.ref('password'))
      .required()
      .label('تأكيد كلمة المرور')
      .messages({
        ...defaultMessages,
        'any.only': 'تأكيد كلمة المرور يجب أن يطابق كلمة المرور.'
      }),
    displayName: joi.string().required().label('الاسم').messages(defaultMessages),
    phoneNumber: joi.string().optional().label('رقم الهاتف').messages(defaultMessages),
    job: joi.string().optional().label('الوظيفة').messages(defaultMessages)
  })
  .messages(defaultMessages)
  .required();

/**
 * Login validation schema
 * @swagger
 * components:
 *   schemas:
 *     LoginValidation:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 */
export const loginSchema = joi
  .object({
    email: joi.string().email().required().label('البريد الإلكتروني').messages(defaultMessages),
    password: joi.string().required().label('كلمة المرور').messages(defaultMessages)
  })
  .required();

/**
 * Forget password validation schema
 * @swagger
 * components:
 *   schemas:
 *     ForgetPasswordValidation:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 */
export const forgetCode = joi
  .object({
    email: joi.string().email().required().label('البريد الإلكتروني').messages(defaultMessages)
  })
  .required();

/**
 * Reset password validation schema
 * @swagger
 * components:
 *   schemas:
 *     ResetPasswordValidation:
 *       type: object
 *       required:
 *         - password
 *         - confirmPassword
 *       properties:
 *         password:
 *           type: string
 *           format: password
 *         confirmPassword:
 *           type: string
 *           format: password
 */
export const resetPassword = joi
  .object({
    password: joi
      .string()
      .pattern(passwordPattern)
      .required()
      .label('كلمة المرور الجديدة')
      .messages({
        ...defaultMessages,
        'string.pattern.base': passwordMessage
      }),
    confirmPassword: joi
      .string()
      .valid(joi.ref('password'))
      .required()
      .label('تأكيد كلمة المرور')
      .messages({
        ...defaultMessages,
        'any.only': 'تأكيد كلمة المرور يجب أن يطابق كلمة المرور الجديدة.'
      })
  })
  .required();

/**
 * Verification code validation schema
 * @swagger
 * components:
 *   schemas:
 *     VerificationCodeValidation:
 *       type: object
 *       required:
 *         - verificationCode
 *       properties:
 *         verificationCode:
 *           type: string
 *           pattern: ^\d{4}$
 */
export const verify = joi
  .object({
    verificationCode: joi
      .string()
      .pattern(codePattern)
      .required()
      .label('رمز التحقق')
      .messages({
        ...defaultMessages,
        'string.pattern.base': codeMessage
      })
  })
  .required();

/**
 * Forget code verification validation schema
 * @swagger
 * components:
 *   schemas:
 *     VerifyForgetCodeValidation:
 *       type: object
 *       required:
 *         - email
 *         - forgetCode
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         forgetCode:
 *           type: string
 *           pattern: ^\d{4}$
 */
export const verifyForgetCode = joi
  .object({
    email: joi.string().email().required().label('البريد الإلكتروني').messages(defaultMessages),
    forgetCode: joi
      .string()
      .pattern(codePattern)
      .required()
      .label('رمز التحقق')
      .messages({
        ...defaultMessages,
        'string.pattern.base': codeMessage
      })
  })
  .required();

/**
 * Reset password by code validation schema
 * @swagger
 * components:
 *   schemas:
 *     ResetPasswordByCodeValidation:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - confirmPassword
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *         confirmPassword:
 *           type: string
 *           format: password
 */
export const resetPasswordByCode = joi
  .object({
    email: joi.string().email().required().label('البريد الإلكتروني').messages(defaultMessages),
    password: joi
      .string()
      .pattern(passwordPattern)
      .required()
      .label('كلمة المرور الجديدة')
      .messages({
        ...defaultMessages,
        'string.pattern.base': passwordMessage
      }),
    confirmPassword: joi
      .string()
      .valid(joi.ref('password'))
      .required()
      .label('تأكيد كلمة المرور')
      .messages({
        ...defaultMessages,
        'any.only': 'تأكيد كلمة المرور يجب أن يطابق كلمة المرور الجديدة.'
      })
  })
  .required();

/**
 * FCM token validation schema
 * @swagger
 * components:
 *   schemas:
 *     FCMTokenValidation:
 *       type: object
 *       required:
 *         - fcmToken
 *       properties:
 *         fcmToken:
 *           type: string
 */
export const fcmTokenSchema = joi
  .object({
    fcmToken: joi.string().required().label('رمز الإشعارات').messages(defaultMessages)
  })
  .required();
