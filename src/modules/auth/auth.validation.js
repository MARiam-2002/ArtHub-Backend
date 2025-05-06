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
    email: joi
      .string()
      .email()
      .required()
      .label("البريد الإلكتروني"),

    password: joi
      .string()
      .pattern(/^(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*(),.?":{}|<>])(?=.{8,}).*$/)
      .required()
      .label("كلمة المرور"),

    confirmPassword: joi
      .string()
      .valid(joi.ref("password"))
      .required()
      .label("تأكيد كلمة المرور"),

    role: joi
      .string()
      .valid("user", "photographer", "painter", "visual_artist")
      .label("الدور"),
  })
  .messages(defaultMessages)
  .required();


export const loginSchema = joi
  .object({
    email: joi
      .string()
      .email()
      .required()
      .label("Email")
      .messages(defaultMessages),

    password: joi
      .string()
      .regex(/^(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*(),.?":{}|<>])(?=.{8,}).*$/)
      .required()
      .label("Password")
      .messages({
        ...defaultMessages,
        "string.pattern.base":
          "Password must be at least 8 characters long, contain at least one uppercase letter, and include either a number or a special character.",
      }),
  })
  .required();

export const forgetCode = joi
  .object({
    email: joi
      .string()
      .email()
      .required()
      .label("Email")
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
      .required()
      .label("Forget Code")
      .messages(defaultMessages),
  })
  .required();
