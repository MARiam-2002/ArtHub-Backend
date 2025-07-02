import Joi from 'joi';
import { isValidObjectId } from 'mongoose';

// رسائل الخطأ المخصصة باللغة العربية
const arabicMessages = {
  'string.base': '{#label} يجب أن يكون نصاً',
  'string.empty': '{#label} لا يمكن أن يكون فارغاً',
  'string.min': '{#label} يجب أن يحتوي على {#limit} أحرف على الأقل',
  'string.max': '{#label} يجب ألا يتجاوز {#limit} حرف',
  'string.pattern.base': '{#label} يحتوي على تنسيق غير صحيح',
  'number.base': '{#label} يجب أن يكون رقماً',
  'number.positive': '{#label} يجب أن يكون رقماً موجباً',
  'number.min': '{#label} يجب أن يكون {#limit} على الأقل',
  'number.max': '{#label} يجب ألا يتجاوز {#limit}',
  'array.base': '{#label} يجب أن يكون مصفوفة',
  'array.min': '{#label} يجب أن يحتوي على عنصر واحد على الأقل',
  'array.max': '{#label} يجب ألا يتجاوز {#limit} عنصر',
  'boolean.base': '{#label} يجب أن يكون true أو false',
  'any.required': '{#label} مطلوب',
  'any.only': '{#label} يجب أن يكون واحداً من {#valids}'
};

// التحقق من معرف MongoDB
const objectIdValidator = Joi.string().custom((value, helpers) => {
  if (!isValidObjectId(value)) {
    return helpers.error('string.pattern.base');
  }
  return value;
});

// Common validation patterns
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
 *     ImageUploadRequest:
 *       type: object
 *       required:
 *         - image
 *       properties:
 *         image:
 *           type: string
 *           format: binary
 *           description: Image file to upload
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: Image title
 *           example: "Beautiful Artwork"
 *         description:
 *           type: string
 *           maxLength: 500
 *           description: Image description
 *           example: "Abstract painting with vibrant colors"
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 10
 *           description: Image tags
 *           example: ["art", "abstract", "colors"]
 *         category:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: Category ID
 *         isPrivate:
 *           type: boolean
 *           default: false
 *           description: Make image private
 *         allowDownload:
 *           type: boolean
 *           default: true
 *           description: Allow image download
 *     UpdateImageRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 500
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 10
 *         isPrivate:
 *           type: boolean
 *         allowDownload:
 *           type: boolean
 */

// Common field schemas
const titleSchema = Joi.string()
  .trim()
  .min(3)
  .max(100)
  .messages({
    'string.empty': 'عنوان الصورة مطلوب',
    'string.min': 'عنوان الصورة يجب أن يكون 3 أحرف على الأقل',
    'string.max': 'عنوان الصورة يجب أن يكون 100 حرف على الأكثر'
  });

const descriptionSchema = Joi.string()
  .trim()
  .max(500)
  .allow('')
  .messages({
    'string.max': 'وصف الصورة يجب أن يكون 500 حرف على الأكثر'
  });

const tagsSchema = Joi.array()
  .items(Joi.string().trim().min(2).max(30).messages({
    'string.min': 'الوسم يجب أن يكون حرفين على الأقل',
    'string.max': 'الوسم يجب أن يكون 30 حرف على الأكثر'
  }))
  .max(10)
  .default([])
  .messages({
    'array.max': 'يمكن إضافة 10 وسوم على الأكثر'
  });

const categorySchema = Joi.string()
  .pattern(objectIdPattern)
  .optional()
  .messages({
    'string.pattern.base': 'معرف الفئة غير صحيح'
  });

// Main validation schemas
export const uploadImageSchema = {
  body: Joi.object({
    title: titleSchema.required().messages({
      'any.required': 'عنوان الصورة مطلوب'
    }),
    description: descriptionSchema,
    tags: tagsSchema,
    category: categorySchema,
    isPrivate: Joi.boolean().default(false),
    allowDownload: Joi.boolean().default(true)
  })
};

export const updateImageSchema = {
  body: Joi.object({
    title: titleSchema,
    description: descriptionSchema,
    tags: tagsSchema,
    isPrivate: Joi.boolean(),
    allowDownload: Joi.boolean()
  }).min(1).messages({
    'object.min': 'يجب تقديم حقل واحد على الأقل للتحديث'
  })
};

// Parameter validations
export const imageIdParamSchema = {
  params: Joi.object({
    imageId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف الصورة غير صحيح',
        'any.required': 'معرف الصورة مطلوب'
      })
  })
};

// Query validations
export const getImagesQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    category: Joi.string().pattern(objectIdPattern).optional(),
    user: Joi.string().pattern(objectIdPattern).optional(),
    search: Joi.string().trim().min(2).max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'views', 'downloads', 'title').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    isPrivate: Joi.boolean().optional()
  })
};

export const searchImagesQuerySchema = {
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
    category: Joi.string().pattern(objectIdPattern).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  })
};

export const downloadImageQuerySchema = {
  query: Joi.object({
    quality: Joi.string()
      .valid('low', 'medium', 'high', 'original')
      .default('original')
      .messages({
        'any.only': 'جودة التحميل يجب أن تكون: منخفضة، متوسطة، عالية، أو أصلية'
      })
  })
};

// My Images validation
export const myImagesQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    isPrivate: Joi.boolean().optional(),
    category: Joi.string().pattern(objectIdPattern).optional(),
    sortBy: Joi.string().valid('createdAt', 'views', 'downloads', 'title').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

// Export all schemas
export default {
  uploadImageSchema,
  updateImageSchema,
  imageIdParamSchema,
  getImagesQuerySchema,
  searchImagesQuerySchema,
  downloadImageQuerySchema,
  myImagesQuerySchema
};
