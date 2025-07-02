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
  'number.base': '{#label} يجب أن يكون رقمًا.',
  'number.min': '{#label} يجب أن يكون على الأقل {#limit}.',
  'number.max': '{#label} يجب ألا يزيد عن {#limit}.',
  'any.only': '{#label} يجب أن يكون إحدى القيم المسموحة.',
  'any.required': '{#label} مطلوب.'
};

/**
 * MongoDB ObjectId pattern
 */
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Search query validation schema
 */
export const searchQuerySchema = joi.object({
  q: joi
    .string()
    .min(1)
    .max(100)
    .optional()
    .label('نص البحث')
    .messages(defaultMessages),
  
  type: joi
    .string()
    .valid('all', 'artworks', 'artists')
    .default('all')
    .optional()
    .label('نوع البحث')
    .messages(defaultMessages),
  
  category: joi
    .string()
    .pattern(objectIdPattern)
    .optional()
    .label('التصنيف')
    .messages({
      ...defaultMessages,
      'string.pattern.base': 'معرف التصنيف غير صالح'
    }),
  
  minPrice: joi
    .number()
    .min(0)
    .optional()
    .label('الحد الأدنى للسعر')
    .messages(defaultMessages),
  
  maxPrice: joi
    .number()
    .min(0)
    .optional()
    .label('الحد الأقصى للسعر')
    .messages(defaultMessages),
  
  page: joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .label('رقم الصفحة')
    .messages(defaultMessages),
  
  limit: joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .label('عدد العناصر في الصفحة')
    .messages(defaultMessages)
}).custom((value, helpers) => {
  // Validate that maxPrice is greater than minPrice if both are provided
  if (value.minPrice && value.maxPrice && value.maxPrice <= value.minPrice) {
    return helpers.error('custom.maxPriceGreaterThanMin');
  }
  return value;
}).messages({
  'custom.maxPriceGreaterThanMin': 'الحد الأقصى للسعر يجب أن يكون أكبر من الحد الأدنى'
});

/**
 * Pagination validation schema
 */
export const paginationSchema = joi.object({
  page: joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .label('رقم الصفحة')
    .messages(defaultMessages),
  
  limit: joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .label('عدد العناصر في الصفحة')
    .messages(defaultMessages)
});

/**
 * Category filter validation schema
 */
export const categoryFilterSchema = joi.object({
  category: joi
    .string()
    .pattern(objectIdPattern)
    .required()
    .label('التصنيف')
    .messages({
      ...defaultMessages,
      'string.pattern.base': 'معرف التصنيف غير صالح'
    }),
  
  page: joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .label('رقم الصفحة')
    .messages(defaultMessages),
  
  limit: joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .label('عدد العناصر في الصفحة')
    .messages(defaultMessages)
});

/**
 * Artist filter validation schema
 */
export const artistFilterSchema = joi.object({
  artist: joi
    .string()
    .pattern(objectIdPattern)
    .required()
    .label('الفنان')
    .messages({
      ...defaultMessages,
      'string.pattern.base': 'معرف الفنان غير صالح'
    }),
  
  page: joi
    .number()
    .integer()
    .min(1)
    .default(1)
    .optional()
    .label('رقم الصفحة')
    .messages(defaultMessages),
  
  limit: joi
    .number()
    .integer()
    .min(1)
    .max(50)
    .default(10)
    .optional()
    .label('عدد العناصر في الصفحة')
    .messages(defaultMessages)
});

/**
 * @swagger
 * components:
 *   schemas:
 *     HomeDataResponse:
 *       type: object
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *           description: قائمة التصنيفات الرئيسية
 *         topArtists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artist'
 *           description: أفضل الفنانين
 *         featuredArtworks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artwork'
 *           description: الأعمال الفنية المميزة
 *         latestArtworks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artwork'
 *           description: أحدث الأعمال الفنية
 *         personalizedArtworks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artwork'
 *           description: أعمال مخصصة للمستخدم
 *         trendingArtworks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artwork'
 *           description: الأعمال الرائجة
 *         statistics:
 *           type: object
 *           description: إحصائيات المنصة
 *     
 *     SearchRequest:
 *       type: object
 *       properties:
 *         q:
 *           type: string
 *           description: نص البحث
 *           example: "لوحة فنية"
 *         type:
 *           type: string
 *           enum: [all, artworks, artists, categories]
 *           description: نوع البحث
 *           example: "all"
 *         category:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: معرف التصنيف للفلترة
 *         priceMin:
 *           type: number
 *           minimum: 0
 *           description: الحد الأدنى للسعر
 *         priceMax:
 *           type: number
 *           minimum: 0
 *           description: الحد الأقصى للسعر
 *         location:
 *           type: string
 *           description: الموقع الجغرافي
 *         sortBy:
 *           type: string
 *           enum: [newest, oldest, price_low, price_high, rating, popular]
 *           description: معيار الترتيب
 *         page:
 *           type: number
 *           minimum: 1
 *           description: رقم الصفحة
 *         limit:
 *           type: number
 *           minimum: 1
 *           maximum: 50
 *           description: عدد النتائج في الصفحة
 */

/**
 * Schema for getting home data
 */
export const getHomeDataSchema = {
  query: joi.object({
    includePersonalized: joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'تضمين المحتوى المخصص يجب أن يكون true أو false'
      }),
    includeStatistics: joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'تضمين الإحصائيات يجب أن يكون true أو false'
      }),
    includeTrending: joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'تضمين المحتوى الرائج يجب أن يكون true أو false'
      }),
    categoryLimit: joi.number()
      .integer()
      .min(1)
      .max(20)
      .default(10)
      .messages({
        'number.base': 'حد التصنيفات يجب أن يكون رقم',
        'number.integer': 'حد التصنيفات يجب أن يكون رقم صحيح',
        'number.min': 'حد التصنيفات يجب أن يكون 1 أو أكثر',
        'number.max': 'حد التصنيفات يجب ألا يتجاوز 20'
      }),
    artistLimit: joi.number()
      .integer()
      .min(1)
      .max(20)
      .default(8)
      .messages({
        'number.base': 'حد الفنانين يجب أن يكون رقم',
        'number.integer': 'حد الفنانين يجب أن يكون رقم صحيح',
        'number.min': 'حد الفنانين يجب أن يكون 1 أو أكثر',
        'number.max': 'حد الفنانين يجب ألا يتجاوز 20'
      }),
    artworkLimit: joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(12)
      .messages({
        'number.base': 'حد الأعمال الفنية يجب أن يكون رقم',
        'number.integer': 'حد الأعمال الفنية يجب أن يكون رقم صحيح',
        'number.min': 'حد الأعمال الفنية يجب أن يكون 1 أو أكثر',
        'number.max': 'حد الأعمال الفنية يجب ألا يتجاوز 50'
      }),
    language: joi.string()
      .valid('ar', 'en', 'fr')
      .default('ar')
      .messages({
        'any.only': 'اللغة غير مدعومة'
      }),
    region: joi.string()
      .valid('saudi', 'gulf', 'arab', 'international')
      .messages({
        'any.only': 'المنطقة غير صالحة'
      })
  })
};

/**
 * Schema for search functionality
 */
export const searchSchema = {
  query: joi.object({
    q: joi.string()
      .min(1)
      .max(100)
      .trim()
      .messages({
        'string.empty': 'نص البحث مطلوب',
        'string.min': 'نص البحث يجب أن يكون حرف واحد على الأقل',
        'string.max': 'نص البحث يجب ألا يتجاوز 100 حرف'
      }),
    type: joi.string()
      .valid('all', 'artworks', 'artists', 'categories', 'users')
      .default('all')
      .messages({
        'any.only': 'نوع البحث غير صالح'
      }),
    category: joi.string()
      .pattern(objectIdPattern)
      .messages({
        'string.pattern.base': 'معرف التصنيف غير صالح'
      }),
    priceMin: joi.number()
      .min(0)
      .messages({
        'number.base': 'الحد الأدنى للسعر يجب أن يكون رقم',
        'number.min': 'الحد الأدنى للسعر يجب أن يكون 0 أو أكثر'
      }),
    priceMax: joi.number()
      .min(0)
      .greater(joi.ref('priceMin'))
      .messages({
        'number.base': 'الحد الأقصى للسعر يجب أن يكون رقم',
        'number.min': 'الحد الأقصى للسعر يجب أن يكون 0 أو أكثر',
        'number.greater': 'الحد الأقصى للسعر يجب أن يكون أكبر من الحد الأدنى'
      }),
    minRating: joi.number()
      .min(1)
      .max(5)
      .integer()
      .messages({
        'number.base': 'الحد الأدنى للتقييم يجب أن يكون رقم',
        'number.min': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
        'number.max': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
        'number.integer': 'الحد الأدنى للتقييم يجب أن يكون رقم صحيح'
      }),
    location: joi.string()
      .max(50)
      .messages({
        'string.max': 'الموقع يجب ألا يتجاوز 50 حرف'
      }),
    availability: joi.string()
      .valid('available', 'sold', 'commission', 'all')
      .default('available')
      .messages({
        'any.only': 'حالة التوفر غير صالحة'
      }),
    sortBy: joi.string()
      .valid('newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular', 'views', 'alphabetical')
      .default('newest')
      .messages({
        'any.only': 'معيار الترتيب غير صالح'
      }),
    page: joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقم',
        'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
        'number.min': 'رقم الصفحة يجب أن يكون 1 أو أكثر'
      }),
    limit: joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(12)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
        'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
        'number.max': 'حد النتائج يجب ألا يتجاوز 50'
      }),
    includeCount: joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'تضمين العدد يجب أن يكون true أو false'
      }),
    tags: joi.array()
      .items(
        joi.string()
          .min(2)
          .max(30)
          .messages({
            'string.min': 'العلامة يجب أن تكون على الأقل حرفين',
            'string.max': 'العلامة يجب ألا تتجاوز 30 حرف'
          })
      )
      .max(10)
      .messages({
        'array.base': 'العلامات يجب أن تكون قائمة',
        'array.max': 'لا يمكن البحث بأكثر من 10 علامات'
      }),
    dateRange: joi.object({
      startDate: joi.date()
        .messages({
          'date.base': 'تاريخ البداية يجب أن يكون تاريخ صالح'
        }),
      endDate: joi.date()
        .min(joi.ref('startDate'))
        .messages({
          'date.base': 'تاريخ النهاية يجب أن يكون تاريخ صالح',
          'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
        })
    }),
    artistExperience: joi.string()
      .valid('beginner', 'intermediate', 'expert', 'master')
      .messages({
        'any.only': 'مستوى خبرة الفنان غير صالح'
      }),
    artworkStyle: joi.array()
      .items(
        joi.string()
          .valid('traditional', 'modern', 'abstract', 'realistic', 'digital', 'mixed_media', 'other')
          .messages({
            'any.only': 'نمط العمل الفني غير صالح'
          })
      )
      .max(5)
      .messages({
        'array.base': 'أنماط الأعمال الفنية يجب أن تكون قائمة',
        'array.max': 'لا يمكن اختيار أكثر من 5 أنماط'
      })
  })
};

/**
 * Schema for advanced search with filters
 */
export const advancedSearchSchema = {
  body: joi.object({
    searchCriteria: joi.object({
      keywords: joi.array()
        .items(
          joi.string()
            .min(2)
            .max(50)
            .messages({
              'string.min': 'الكلمة المفتاحية يجب أن تكون على الأقل حرفين',
              'string.max': 'الكلمة المفتاحية يجب ألا تتجاوز 50 حرف'
            })
        )
        .max(20)
        .messages({
          'array.base': 'الكلمات المفتاحية يجب أن تكون قائمة',
          'array.max': 'لا يمكن البحث بأكثر من 20 كلمة مفتاحية'
        }),
      exactPhrase: joi.string()
        .max(200)
        .messages({
          'string.max': 'العبارة الدقيقة يجب ألا تتجاوز 200 حرف'
        }),
      excludeWords: joi.array()
        .items(
          joi.string()
            .min(2)
            .max(50)
            .messages({
              'string.min': 'الكلمة المستبعدة يجب أن تكون على الأقل حرفين',
              'string.max': 'الكلمة المستبعدة يجب ألا تتجاوز 50 حرف'
            })
        )
        .max(10)
        .messages({
          'array.base': 'الكلمات المستبعدة يجب أن تكون قائمة',
          'array.max': 'لا يمكن استبعاد أكثر من 10 كلمات'
        })
    }),
    filters: joi.object({
      categories: joi.array()
        .items(
          joi.string()
            .pattern(objectIdPattern)
            .messages({
              'string.pattern.base': 'معرف التصنيف غير صالح'
            })
        )
        .max(10)
        .messages({
          'array.base': 'التصنيفات يجب أن تكون قائمة',
          'array.max': 'لا يمكن اختيار أكثر من 10 تصنيفات'
        }),
      priceRange: joi.object({
        min: joi.number()
          .min(0)
          .messages({
            'number.min': 'الحد الأدنى للسعر يجب أن يكون 0 أو أكثر'
          }),
        max: joi.number()
          .min(0)
          .greater(joi.ref('min'))
          .messages({
            'number.min': 'الحد الأقصى للسعر يجب أن يكون 0 أو أكثر',
            'number.greater': 'الحد الأقصى للسعر يجب أن يكون أكبر من الحد الأدنى'
          })
      }),
      ratingRange: joi.object({
        min: joi.number()
          .min(1)
          .max(5)
          .integer()
          .messages({
            'number.min': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
            'number.max': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
            'number.integer': 'الحد الأدنى للتقييم يجب أن يكون رقم صحيح'
          }),
        max: joi.number()
          .min(1)
          .max(5)
          .integer()
          .min(joi.ref('min'))
          .messages({
            'number.min': 'الحد الأقصى للتقييم يجب أن يكون بين 1 و 5',
            'number.max': 'الحد الأقصى للتقييم يجب أن يكون بين 1 و 5',
            'number.integer': 'الحد الأقصى للتقييم يجب أن يكون رقم صحيح'
          })
      }),
      dateCreated: joi.object({
        startDate: joi.date()
          .messages({
            'date.base': 'تاريخ البداية يجب أن يكون تاريخ صالح'
          }),
        endDate: joi.date()
          .min(joi.ref('startDate'))
          .messages({
            'date.base': 'تاريخ النهاية يجب أن يكون تاريخ صالح',
            'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
          })
      }),
      location: joi.object({
        country: joi.string()
          .max(50)
          .messages({
            'string.max': 'اسم البلد يجب ألا يتجاوز 50 حرف'
          }),
        city: joi.string()
          .max(50)
          .messages({
            'string.max': 'اسم المدينة يجب ألا يتجاوز 50 حرف'
          }),
        radius: joi.number()
          .min(1)
          .max(1000)
          .messages({
            'number.min': 'نطاق البحث يجب أن يكون 1 كم أو أكثر',
            'number.max': 'نطاق البحث يجب ألا يتجاوز 1000 كم'
          })
      })
    }),
    sorting: joi.object({
      primary: joi.string()
        .valid('relevance', 'newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular', 'views')
        .default('relevance')
        .messages({
          'any.only': 'معيار الترتيب الأساسي غير صالح'
        }),
      secondary: joi.string()
        .valid('newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular', 'views')
        .messages({
          'any.only': 'معيار الترتيب الثانوي غير صالح'
        })
    }),
    pagination: joi.object({
      page: joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
          'number.base': 'رقم الصفحة يجب أن يكون رقم',
          'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
          'number.min': 'رقم الصفحة يجب أن يكون 1 أو أكثر'
        }),
      limit: joi.number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
          'number.base': 'حد النتائج يجب أن يكون رقم',
          'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
          'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
          'number.max': 'حد النتائج يجب ألا يتجاوز 100'
        })
    })
  })
};

/**
 * Schema for getting trending content
 */
export const getTrendingSchema = {
  query: joi.object({
    type: joi.string()
      .valid('artworks', 'artists', 'categories', 'all')
      .default('all')
      .messages({
        'any.only': 'نوع المحتوى الرائج غير صالح'
      }),
    period: joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year')
      .default('week')
      .messages({
        'any.only': 'فترة المحتوى الرائج غير صالحة'
      }),
    limit: joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(20)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
        'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
        'number.max': 'حد النتائج يجب ألا يتجاوز 50'
      }),
    includeStats: joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'تضمين الإحصائيات يجب أن يكون true أو false'
      })
  })
};

/**
 * Schema for getting recommendations
 */
export const getRecommendationsSchema = {
  query: joi.object({
    type: joi.string()
      .valid('artworks', 'artists', 'categories', 'mixed')
      .default('mixed')
      .messages({
        'any.only': 'نوع التوصيات غير صالح'
      }),
    basedOn: joi.string()
      .valid('viewing_history', 'purchases', 'favorites', 'ratings', 'similar_users')
      .default('viewing_history')
      .messages({
        'any.only': 'أساس التوصية غير صالح'
      }),
    limit: joi.number()
      .integer()
      .min(1)
      .max(30)
      .default(15)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
        'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
        'number.max': 'حد النتائج يجب ألا يتجاوز 30'
      }),
    excludeViewed: joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'استبعاد المشاهد يجب أن يكون true أو false'
      }),
    diversityFactor: joi.number()
      .min(0)
      .max(1)
      .default(0.3)
      .messages({
        'number.base': 'عامل التنوع يجب أن يكون رقم',
        'number.min': 'عامل التنوع يجب أن يكون بين 0 و 1',
        'number.max': 'عامل التنوع يجب أن يكون بين 0 و 1'
      })
  })
};

/**
 * Schema for getting statistics
 */
export const getStatisticsSchema = {
  query: joi.object({
    type: joi.string()
      .valid('overview', 'detailed', 'trends', 'comparisons')
      .default('overview')
      .messages({
        'any.only': 'نوع الإحصائيات غير صالح'
      }),
    period: joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'فترة الإحصائيات غير صالحة'
      }),
    metrics: joi.array()
      .items(
        joi.string()
          .valid('users', 'artworks', 'transactions', 'reviews', 'views', 'revenue', 'growth')
          .messages({
            'any.only': 'مقياس الإحصائيات غير صالح'
          })
      )
      .default(['users', 'artworks', 'transactions'])
      .messages({
        'array.base': 'مقاييس الإحصائيات يجب أن تكون قائمة'
      }),
    groupBy: joi.string()
      .valid('day', 'week', 'month', 'category', 'location', 'artist')
      .messages({
        'any.only': 'معيار التجميع غير صالح'
      })
  })
};

/**
 * Schema for search suggestions
 */
export const getSearchSuggestionsSchema = {
  query: joi.object({
    q: joi.string()
      .required()
      .min(1)
      .max(50)
      .trim()
      .messages({
        'string.empty': 'نص البحث مطلوب',
        'any.required': 'نص البحث مطلوب',
        'string.min': 'نص البحث يجب أن يكون حرف واحد على الأقل',
        'string.max': 'نص البحث يجب ألا يتجاوز 50 حرف'
      }),
    type: joi.string()
      .valid('all', 'artworks', 'artists', 'categories', 'tags')
      .default('all')
      .messages({
        'any.only': 'نوع الاقتراحات غير صالح'
      }),
    limit: joi.number()
      .integer()
      .min(1)
      .max(20)
      .default(10)
      .messages({
        'number.base': 'حد الاقتراحات يجب أن يكون رقم',
        'number.integer': 'حد الاقتراحات يجب أن يكون رقم صحيح',
        'number.min': 'حد الاقتراحات يجب أن يكون 1 أو أكثر',
        'number.max': 'حد الاقتراحات يجب ألا يتجاوز 20'
      })
  })
};

/**
 * Schema for content feed
 */
export const getContentFeedSchema = {
  query: joi.object({
    feedType: joi.string()
      .valid('following', 'discover', 'trending', 'recommended', 'recent')
      .default('discover')
      .messages({
        'any.only': 'نوع الخلاصة غير صالح'
      }),
    contentTypes: joi.array()
      .items(
        joi.string()
          .valid('artworks', 'artist_updates', 'reviews', 'collections', 'events')
          .messages({
            'any.only': 'نوع المحتوى غير صالح'
          })
      )
      .default(['artworks', 'artist_updates'])
      .messages({
        'array.base': 'أنواع المحتوى يجب أن تكون قائمة'
      }),
    page: joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقم',
        'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
        'number.min': 'رقم الصفحة يجب أن يكون 1 أو أكثر'
      }),
    limit: joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(20)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
        'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
        'number.max': 'حد النتائج يجب ألا يتجاوز 50'
      }),
    refreshToken: joi.string()
      .messages({
        'string.base': 'رمز التحديث يجب أن يكون نص'
      })
  })
};

/**
 * Schema for location-based search
 */
export const locationSearchSchema = {
  query: joi.object({
    latitude: joi.number()
      .required()
      .min(-90)
      .max(90)
      .messages({
        'number.base': 'خط العرض يجب أن يكون رقم',
        'any.required': 'خط العرض مطلوب',
        'number.min': 'خط العرض يجب أن يكون بين -90 و 90',
        'number.max': 'خط العرض يجب أن يكون بين -90 و 90'
      }),
    longitude: joi.number()
      .required()
      .min(-180)
      .max(180)
      .messages({
        'number.base': 'خط الطول يجب أن يكون رقم',
        'any.required': 'خط الطول مطلوب',
        'number.min': 'خط الطول يجب أن يكون بين -180 و 180',
        'number.max': 'خط الطول يجب أن يكون بين -180 و 180'
      }),
    radius: joi.number()
      .min(1)
      .max(1000)
      .default(50)
      .messages({
        'number.base': 'نطاق البحث يجب أن يكون رقم',
        'number.min': 'نطاق البحث يجب أن يكون 1 كم أو أكثر',
        'number.max': 'نطاق البحث يجب ألا يتجاوز 1000 كم'
      }),
    unit: joi.string()
      .valid('km', 'miles')
      .default('km')
      .messages({
        'any.only': 'وحدة المسافة غير صالحة'
      }),
    type: joi.string()
      .valid('artworks', 'artists', 'galleries', 'events', 'all')
      .default('all')
      .messages({
        'any.only': 'نوع البحث الجغرافي غير صالح'
      }),
    limit: joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
        'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
        'number.max': 'حد النتائج يجب ألا يتجاوز 100'
      })
  })
};