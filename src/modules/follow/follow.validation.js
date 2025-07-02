import Joi from 'joi';

/**
 * Default validation error messages in Arabic
 */
const defaultMessages = {
  'string.base': '{#label} يجب أن يكون نصًا.',
  'string.empty': '{#label} مطلوب ولا يمكن أن يكون فارغًا.',
  'string.pattern.base': '{#label} يحتوي على تنسيق غير صالح.',
  'any.required': '{#label} مطلوب.',
  'number.base': '{#label} يجب أن يكون رقمًا.',
  'number.integer': '{#label} يجب أن يكون رقمًا صحيحًا.',
  'number.min': '{#label} يجب أن يكون على الأقل {#limit}.',
  'number.max': '{#label} يجب ألا يزيد عن {#limit}.'
};

/**
 * MongoDB ObjectId pattern
 */
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
 *     FollowUserRequest:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: ID of the user to follow
 *           example: "507f1f77bcf86cd799439011"
 */

// Main validation schemas
export const followUserSchema = {
  body: Joi.object({
    userId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف المستخدم غير صحيح',
        'any.required': 'معرف المستخدم مطلوب'
      })
  })
};

// Parameter validations
export const userIdParamSchema = {
  params: Joi.object({
    userId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف المستخدم غير صحيح',
        'any.required': 'معرف المستخدم مطلوب'
      })
  })
};

// Query validations
export const getFollowersQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    search: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'نص البحث يجب أن يكون حرفين على الأقل',
        'string.max': 'نص البحث يجب أن يكون 100 حرف على الأكثر'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'displayName', 'followersCount')
      .default('createdAt')
      .messages({
        'any.only': 'ترتيب غير صحيح'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'اتجاه الترتيب يجب أن يكون asc أو desc'
      })
  })
};

export const getFollowingQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    search: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional()
      .messages({
        'string.min': 'نص البحث يجب أن يكون حرفين على الأقل',
        'string.max': 'نص البحث يجب أن يكون 100 حرف على الأكثر'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'displayName', 'followersCount')
      .default('createdAt')
      .messages({
        'any.only': 'ترتيب غير صحيح'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'اتجاه الترتيب يجب أن يكون asc أو desc'
      })
  })
};

// Bulk operations validation
export const bulkFollowSchema = {
  body: Joi.object({
    userIds: Joi.array()
      .items(
        Joi.string()
          .pattern(objectIdPattern)
          .messages({
            'string.pattern.base': 'معرف المستخدم غير صحيح'
          })
      )
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.min': 'يجب تحديد مستخدم واحد على الأقل',
        'array.max': 'لا يمكن متابعة أكثر من 10 مستخدمين في المرة الواحدة',
        'any.required': 'قائمة المستخدمين مطلوبة'
      })
  })
};

// Follow suggestions validation
export const getFollowSuggestionsQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(20).default(10),
    category: Joi.string()
      .pattern(objectIdPattern)
      .optional()
      .messages({
        'string.pattern.base': 'معرف الفئة غير صحيح'
      }),
    excludeFollowing: Joi.boolean().default(true),
    minFollowers: Joi.number().integer().min(0).optional(),
    maxFollowers: Joi.number().integer().min(0).optional()
  })
};

// Mutual follows validation
export const getMutualFollowsQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
    search: Joi.string()
      .trim()
      .min(2)
      .max(100)
      .optional()
  })
};

// Export all schemas
export default {
  followUserSchema,
  userIdParamSchema,
  getFollowersQuerySchema,
  getFollowingQuerySchema,
  bulkFollowSchema,
  getFollowSuggestionsQuerySchema,
  getMutualFollowsQuerySchema
};
