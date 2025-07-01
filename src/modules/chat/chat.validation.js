import Joi from 'joi';

// مخطط التحقق لإنشاء محادثة جديدة
export const createChatSchema = {
  body: Joi.object({
    userId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.empty': 'يجب تحديد معرف المستخدم',
        'string.pattern.base': 'معرف المستخدم غير صالح',
        'any.required': 'معرف المستخدم مطلوب'
      })
  })
};

// مخطط التحقق لإرسال رسالة
export const sendMessageSchema = {
  params: Joi.object({
    chatId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.empty': 'يجب تحديد معرف المحادثة',
        'string.pattern.base': 'معرف المحادثة غير صالح',
        'any.required': 'معرف المحادثة مطلوب'
      })
  }),
  body: Joi.object({
    content: Joi.string().required().min(1).max(500).messages({
      'string.empty': 'لا يمكن إرسال رسالة فارغة',
      'string.min': 'الرسالة قصيرة جدًا',
      'string.max': 'الرسالة طويلة جدًا، الحد الأقصى هو 500 حرف',
      'any.required': 'نص الرسالة مطلوب'
    }),
    // للتوافق مع الإصدارات القديمة
    text: Joi.string().min(1).max(500).messages({
      'string.empty': 'لا يمكن إرسال رسالة فارغة',
      'string.min': 'الرسالة قصيرة جدًا',
      'string.max': 'الرسالة طويلة جدًا، الحد الأقصى هو 500 حرف'
    })
  }).xor('content', 'text') // إما content أو text يجب أن يكون موجودًا
};

// مخطط التحقق لجلب رسائل محادثة
export const getMessagesSchema = {
  params: Joi.object({
    chatId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.empty': 'يجب تحديد معرف المحادثة',
        'string.pattern.base': 'معرف المحادثة غير صالح',
        'any.required': 'معرف المحادثة مطلوب'
      })
  })
};

// مخطط التحقق لتحديث حالة قراءة الرسائل
export const markAsReadSchema = {
  params: Joi.object({
    chatId: Joi.string()
      .required()
      .pattern(/^[0-9a-fA-F]{24}$/)
      .messages({
        'string.empty': 'يجب تحديد معرف المحادثة',
        'string.pattern.base': 'معرف المحادثة غير صالح',
        'any.required': 'معرف المحادثة مطلوب'
      })
  })
};

// مخطط التحقق لاتصال Socket.io
export const socketAuthSchema = {
  query: Joi.object({
    token: Joi.string().required().messages({
      'string.empty': 'رمز الاتصال مطلوب',
      'any.required': 'رمز الاتصال مطلوب'
    })
  })
};
