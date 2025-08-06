import Joi from 'joi';

// Common validation patterns
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateArtworkRequest:
 *       type: object
 *       required:
 *         - title
 *         - price
 *         - category
 *         - images
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *           description: عنوان العمل الفني
 *           example: "لوحة المناظر الطبيعية"
 *         description:
 *           type: string
 *           maxLength: 1000
 *           description: وصف العمل الفني
 *           example: "لوحة جميلة تصور المناظر الطبيعية الخلابة"
 *         price:
 *           type: number
 *           minimum: 1
 *           maximum: 1000000
 *           description: سعر العمل الفني بالريال السعودي
 *           example: 500
 *         category:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           description: اسم الفئة
 *           example: "الرسم الزيتي"
 *         images:
 *           type: array
 *           minItems: 1
 *           maxItems: 10
 *           items:
 *             type: string
 *             format: uri
 *           description: روابط صور العمل الفني
 *           example: ["https://example.com/image1.jpg"]
 *         status:
 *           type: string
 *           enum: ["available", "sold", "reserved"]
 *           default: "available"
 *           description: حالة العمل الفني
 */

// Common field schemas
const titleSchema = Joi.string()
  .trim()
  .min(3)
  .max(100)
  .messages({
    'string.empty': 'عنوان العمل الفني مطلوب',
    'string.min': 'عنوان العمل الفني يجب أن يكون 3 أحرف على الأقل',
    'string.max': 'عنوان العمل الفني يجب أن يكون 100 حرف على الأكثر'
  });

const descriptionSchema = Joi.string()
  .trim()
  .max(1000)
  .allow('')
  .messages({
    'string.max': 'وصف العمل الفني يجب أن يكون 1000 حرف على الأكثر'
  });

const priceSchema = Joi.number()
  .positive()
  .min(1)
  .max(1000000)
  .messages({
    'number.base': 'السعر يجب أن يكون رقماً',
    'number.positive': 'السعر يجب أن يكون أكبر من صفر',
    'number.min': 'السعر يجب أن يكون ريال واحد على الأقل',
    'number.max': 'السعر يجب أن يكون مليون ريال على الأكثر'
  });

// تحديث schema الفئة لتقبل الاسم بدلاً من المعرف
const categorySchema = Joi.string()
  .trim()
  .min(2)
  .max(50)
  .messages({
    'string.empty': 'اسم الفئة مطلوب',
    'string.min': 'اسم الفئة يجب أن يكون حرفين على الأقل',
    'string.max': 'اسم الفئة يجب أن يكون 50 حرف على الأكثر'
  });

const imagesSchema = Joi.array()
  .items(Joi.string().uri().messages({
    'string.uri': 'رابط الصورة غير صحيح'
  }))
  .min(1)
  .max(5) // تحديث ليطابق الصورة: 5 صور كحد أقصى
  .messages({
    'array.min': 'يجب إضافة صورة واحدة على الأقل',
    'array.max': 'يمكن إضافة 5 صور على الأكثر'
  });

// Schema for file upload validation (used in controller)
const fileUploadSchema = Joi.object({
  files: Joi.array().min(1).max(5).messages({ // تحديث ليطابق الصورة
    'array.min': 'يجب إضافة صورة واحدة على الأقل',
    'array.max': 'يمكن إضافة 5 صور على الأكثر'
  })
});

// إضافة schema للعملة
const currencySchema = Joi.string()
  .valid('USD', 'SAR', 'EUR', 'GBP')
  .default('USD')
  .messages({
    'any.only': 'العملة غير مدعومة'
  });

const statusSchema = Joi.string()
  .valid('available', 'sold', 'reserved')
  .messages({
    'any.only': 'حالة العمل الفني يجب أن تكون: متاح، مباع، أو محجوز'
  });

// Main validation schemas
export const createArtworkSchema = {
  body: Joi.object({
    title: titleSchema.required().messages({
      'any.required': 'عنوان العمل الفني مطلوب'
    }),
    description: Joi.string()
      .trim()
      .min(10)
      .max(2000)
      .optional()
      .messages({
        'string.min': 'الوصف يجب أن يكون 10 أحرف على الأقل',
        'string.max': 'الوصف يجب أن يكون 2000 حرف على الأكثر'
      }),
    price: priceSchema.required().messages({
      'any.required': 'سعر العمل الفني مطلوب'
    }),
    category: categorySchema.required().messages({
      'any.required': 'اسم فئة العمل الفني مطلوب'
    })
  })
};

export const updateArtworkSchema = {
  body: Joi.object({
    title: titleSchema,
    description: descriptionSchema,
    price: priceSchema,
    status: statusSchema
  }).min(1).messages({
    'object.min': 'يجب تقديم حقل واحد على الأقل للتحديث'
  })
};

// Parameter validations
export const artworkIdParamSchema = {
  params: Joi.object({
    artworkId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف العمل الفني غير صحيح',
        'any.required': 'معرف العمل الفني مطلوب'
      })
  })
};

// Query validations
export const getArtworksQuerySchema = {
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10),
    category: Joi.string().pattern(objectIdPattern).optional(),
    artist: Joi.string().pattern(objectIdPattern).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    status: Joi.string().valid('available', 'sold', 'reserved').optional(),
    search: Joi.string().trim().min(2).max(100).optional(),
    sortBy: Joi.string().valid('createdAt', 'price', 'title', 'views').default('createdAt'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  })
};

export const searchArtworksQuerySchema = {
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
    category: Joi.string().trim().min(2).max(50).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().min(0).optional(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(10)
  })
};

// Review validation
export const addReviewSchema = {
  body: Joi.object({
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .required()
      .messages({
        'number.min': 'التقييم يجب أن يكون بين 1 و 5',
        'number.max': 'التقييم يجب أن يكون بين 1 و 5',
        'any.required': 'التقييم مطلوب'
      }),
    comment: Joi.string()
      .trim()
      .max(500)
      .allow('')
      .messages({
        'string.max': 'التعليق يجب أن يكون 500 حرف على الأكثر'
      })
  })
};

// Favorite validation
export const toggleFavoriteSchema = {
  params: Joi.object({
    id: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.pattern.base': 'معرف العمل الفني غير صحيح',
        'any.required': 'معرف العمل الفني مطلوب'
      })
  })
};

// Export all schemas
export default {
  createArtworkSchema,
  updateArtworkSchema,
  artworkIdParamSchema,
  getArtworksQuerySchema,
  searchArtworksQuerySchema,
  addReviewSchema,
  toggleFavoriteSchema
};
