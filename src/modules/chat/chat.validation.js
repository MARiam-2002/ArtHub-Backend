import Joi from 'joi';

// Common validation patterns
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateChatRequest:
 *       type: object
 *       required:
 *         - participantId
 *       properties:
 *         participantId:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: ID of the user to chat with
 *           example: "507f1f77bcf86cd799439011"
 *     SendMessageRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           description: Message content
 *           example: "Hello, how are you?"
 *         messageType:
 *           type: string
 *           enum: [text, image, file]
 *           default: text
 *           description: Type of message
 */

// Main validation schemas
export const createChatSchema = {
  body: Joi.object({
    participantId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف المستخدم غير صحيح',
        'any.required': 'معرف المستخدم مطلوب'
      })
  })
};

export const sendMessageSchema = {
  body: Joi.object({
    content: Joi.string()
      .trim()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'محتوى الرسالة مطلوب',
        'string.min': 'الرسالة لا يمكن أن تكون فارغة',
        'string.max': 'الرسالة يجب أن تكون 1000 حرف على الأكثر',
        'any.required': 'محتوى الرسالة مطلوب'
      }),
    messageType: Joi.string()
      .valid('text', 'image', 'file')
      .default('text')
      .messages({
        'any.only': 'نوع الرسالة يجب أن يكون: نص، صورة، أو ملف'
      })
  })
};

// Parameter validations
export const chatIdParamSchema = {
  params: Joi.object({
    chatId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف المحادثة غير صحيح',
        'any.required': 'معرف المحادثة مطلوب'
      })
  })
};

// Query validations
export const getUserChatsQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    search: Joi.string().trim().min(2).max(100).optional()
  })
};

export const getMessagesQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(50),
    before: Joi.date().iso().optional().messages({
      'date.format': 'التاريخ يجب أن يكون بصيغة ISO صحيحة'
    }),
    after: Joi.date().iso().optional().messages({
      'date.format': 'التاريخ يجب أن يكون بصيغة ISO صحيحة'
    })
  })
};

// Message ID validation
export const messageIdParamSchema = {
  params: Joi.object({
    messageId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف الرسالة غير صحيح',
        'any.required': 'معرف الرسالة مطلوب'
      })
  })
};

// Update message validation
export const updateMessageSchema = {
  body: Joi.object({
    content: Joi.string()
      .trim()
      .min(1)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'محتوى الرسالة مطلوب',
        'string.min': 'الرسالة لا يمكن أن تكون فارغة',
        'string.max': 'الرسالة يجب أن تكون 1000 حرف على الأكثر',
        'any.required': 'محتوى الرسالة مطلوب'
      })
  })
};

// Search messages validation
export const searchMessagesQuerySchema = {
  query: Joi.object({
    q: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .required()
      .messages({
        'string.min': 'نص البحث يجب أن يكون حرفين على الأقل',
        'string.max': 'نص البحث يجب أن يكون 100 حرف على الأكثر',
        'any.required': 'نص البحث مطلوب'
      }),
    chatId: Joi.string().pattern(objectIdPattern).optional(),
    messageType: Joi.string().valid('text', 'image', 'file').optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  })
};

// Export all schemas
export default {
  createChatSchema,
  sendMessageSchema,
  chatIdParamSchema,
  getUserChatsQuerySchema,
  getMessagesQuerySchema,
  messageIdParamSchema,
  updateMessageSchema,
  searchMessagesQuerySchema
};
