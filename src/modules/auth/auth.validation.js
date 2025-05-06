import joi from "joi";

const defaultMessages = {
  "string.base": "{#label} يجب أن يكون نصًا.",
  "string.empty": "{#label} مطلوب ولا يمكن أن يكون فارغًا.",
  "string.min": "{#label} يجب أن يكون على الأقل {#limit} أحرف.",
  "string.max": "{#label} يجب ألا يزيد عن {#limit} أحرف.",
  "string.pattern.base": "{#label} يحتوي على تنسيق غير صالح.",
  "any.required": "{#label} مطلوب.",
  "any.only": "{#label} يجب أن يكون من القيم المسموح بها.",
  "string.email": "البريد الإلكتروني غير صالح، يرجى إدخال بريد إلكتروني صحيح.",
};

export const registerSchema = joi
  .object({
    email: joi.string().email().required().label("البريد الإلكتروني"),

    password: joi
      .string()
      .pattern(/^(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*(),.?":{}|<>])(?=.{8,}).*$/)
      .required()
      .label("كلمة المرور")
      .messages({
        ...defaultMessages,
        "string.pattern.base":
          "يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، حرف كبير، ورقم أو رمز خاص.",
      }),

    confirmPassword: joi
      .string()
      .valid(joi.ref("password"))
      .required()
      .label("تأكيد كلمة المرور"),
  })
  .messages(defaultMessages)
  .required();

export const loginSchema = joi
  .object({
    email: joi
      .string()
      .email()
      .required()
      .label("البريد الإلكتروني")
      .messages(defaultMessages),

    password: joi
      .string()
      .regex(/^(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*(),.?":{}|<>])(?=.{8,}).*$/)
      .required()
      .label("كلمة المرور")
      .messages({
        ...defaultMessages,
        "string.pattern.base":
          "كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، ورقم أو رمز خاص.",
      }),
    job: joi.string().required().label("الوظيفة").messages(defaultMessages),
  })
  .required();

export const forgetCode = joi
  .object({
    email: joi
      .string()
      .email()
      .required()
      .label("البريد الإلكتروني")
      .messages(defaultMessages),
  })
  .required();

export const resetPassword = joi
  .object({
    password: joi
      .string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
      .required()
      .label("Password")
      .messages({
        ...defaultMessages,
        "string.pattern.base":
          "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
      }),

    confirmPassword: joi
      .string()
      .valid(joi.ref("password"))
      .required()
      .label("Confirm Password")
      .messages({
        ...defaultMessages,
        "any.only": "Confirm Password must match the New Password.",
      }),
  })
  .required();

export const verify = joi
  .object({
    forgetCode: joi
      .string()
      .pattern(/^\d{4}$/) // تأكد إنه 4 أرقام فقط
      .required()
      .label("رمز التحقق")
      .messages({
        ...defaultMessages,
        "string.pattern.base": "{#label} يجب أن يتكون من 4 أرقام.",
      }),
  })
  .required();
