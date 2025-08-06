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
 *           pattern: "^[0-9a-fA-F]{24}$"
 *           description: معرف الفئة
 *           example: "507f1f77bcf86cd799439011"
 *         images:
 *           type: array
 *           minItems: 1
 *           maxItems: 10
 *           items:
 *             type: string
 *             format: uri
 *           description: روابط صور العمل الفني
 *           example: ["https://example.com/image1.jpg"]
 *         tags:
 *           type: array
 *           maxItems: 10
 *           items:
 *             type: string
 *             minLength: 2
 *             maxLength: 30
 *           description: وسوم العمل الفني
 *           example: ["طبيعة", "رسم"]
 *         status:
 *           type: string
 *           enum: ["available", "sold", "reserved"]
 *           default: "available"
 *           description: حالة العمل الفني
 *         isFramed:
 *           type: boolean
 *           default: false
 *           description: هل العمل مؤطر
 *         dimensions:
 *           type: object
 *           properties:
 *             width:
 *               type: number
 *               minimum: 1
 *               description: العرض بالسنتيمتر
 *             height:
 *               type: number
 *               minimum: 1
 *               description: الارتفاع بالسنتيمتر
 *             depth:
 *               type: number
 *               minimum: 0
 *               description: العمق بالسنتيمتر
 *         materials:
 *           type: array
 *           maxItems: 5
 *           items:
 *             type: string
 *             minLength: 2
 *             maxLength: 50
 *           description: المواد المستخدمة
 *           example: ["زيت على قماش", "أكريليك"]
 *     UpdateArtworkRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           minLength: 3
 *           maxLength: 100
 *         description:
 *           type: string
 *           maxLength: 1000
 *         price:
 *           type: number
 *           minimum: 1
 *           maximum: 1000000
 *         status:
 *           type: string
 *           enum: ["available", "sold", "reserved"]
 *         tags:
 *           type: array
 *         isFramed:
 *           type: boolean
 *         dimensions:
 *           type: object
 *         materials:
 *           type: array
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

const categorySchema = Joi.string()
  .pattern(objectIdPattern)
  .messages({
    'string.pattern.base': 'معرف الفئة غير صحيح'
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

const statusSchema = Joi.string()
  .valid('available', 'sold', 'reserved')
  .messages({
    'any.only': 'حالة العمل الفني يجب أن تكون: متاح، مباع، أو محجوز'
  });

const dimensionsSchema = Joi.object({
  width: Joi.number().positive().messages({
    'number.positive': 'العرض يجب أن يكون أكبر من صفر'
  }),
  height: Joi.number().positive().messages({
    'number.positive': 'الارتفاع يجب أن يكون أكبر من صفر'
  }),
  depth: Joi.number().min(0).messages({
    'number.min': 'العمق لا يمكن أن يكون سالباً'
  })
}).messages({
  'object.base': 'أبعاد العمل الفني يجب أن تكون كائناً صحيحاً'
});

const materialsSchema = Joi.array()
  .items(Joi.string().trim().min(2).max(50).messages({
    'string.min': 'اسم المادة يجب أن يكون حرفين على الأقل',
    'string.max': 'اسم المادة يجب أن يكون 50 حرف على الأكثر'
  }))
  .max(5)
  .default([])
  .messages({
    'array.max': 'يمكن إضافة 5 مواد على الأكثر'
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
      'any.required': 'فئة العمل الفني مطلوبة'
    })
  })
};

export const updateArtworkSchema = {
  body: Joi.object({
    title: titleSchema,
    description: descriptionSchema,
    price: priceSchema,
    tags: tagsSchema,
    status: statusSchema,
    isFramed: Joi.boolean(),
    dimensions: dimensionsSchema,
    materials: materialsSchema
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
    sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
    tags: Joi.alternatives().try(
      Joi.string(),
      Joi.array().items(Joi.string())
    ).optional()
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
    category: Joi.string().pattern(objectIdPattern).optional(),
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
