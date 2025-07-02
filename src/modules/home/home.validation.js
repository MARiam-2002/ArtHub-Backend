import Joi from 'joi';

// MongoDB ObjectId regex pattern for validation
const MONGODB_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

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
  query: Joi.object({
    includePersonalized: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'تضمين المحتوى المخصص يجب أن يكون true أو false'
      }),
    includeStatistics: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'تضمين الإحصائيات يجب أن يكون true أو false'
      }),
    includeTrending: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'تضمين المحتوى الرائج يجب أن يكون true أو false'
      }),
    categoryLimit: Joi.number()
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
    artistLimit: Joi.number()
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
    artworkLimit: Joi.number()
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
    language: Joi.string()
      .valid('ar', 'en', 'fr')
      .default('ar')
      .messages({
        'any.only': 'اللغة غير مدعومة'
      }),
    region: Joi.string()
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
  query: Joi.object({
    q: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .messages({
        'string.empty': 'نص البحث مطلوب',
        'string.min': 'نص البحث يجب أن يكون حرف واحد على الأقل',
        'string.max': 'نص البحث يجب ألا يتجاوز 100 حرف'
      }),
    type: Joi.string()
      .valid('all', 'artworks', 'artists', 'categories', 'users')
      .default('all')
      .messages({
        'any.only': 'نوع البحث غير صالح'
      }),
    category: Joi.string()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.pattern.base': 'معرف التصنيف غير صالح'
      }),
    priceMin: Joi.number()
      .min(0)
      .messages({
        'number.base': 'الحد الأدنى للسعر يجب أن يكون رقم',
        'number.min': 'الحد الأدنى للسعر يجب أن يكون 0 أو أكثر'
      }),
    priceMax: Joi.number()
      .min(0)
      .greater(Joi.ref('priceMin'))
      .messages({
        'number.base': 'الحد الأقصى للسعر يجب أن يكون رقم',
        'number.min': 'الحد الأقصى للسعر يجب أن يكون 0 أو أكثر',
        'number.greater': 'الحد الأقصى للسعر يجب أن يكون أكبر من الحد الأدنى'
      }),
    minRating: Joi.number()
      .min(1)
      .max(5)
      .integer()
      .messages({
        'number.base': 'الحد الأدنى للتقييم يجب أن يكون رقم',
        'number.min': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
        'number.max': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
        'number.integer': 'الحد الأدنى للتقييم يجب أن يكون رقم صحيح'
      }),
    location: Joi.string()
      .max(50)
      .messages({
        'string.max': 'الموقع يجب ألا يتجاوز 50 حرف'
      }),
    availability: Joi.string()
      .valid('available', 'sold', 'commission', 'all')
      .default('available')
      .messages({
        'any.only': 'حالة التوفر غير صالحة'
      }),
    sortBy: Joi.string()
      .valid('newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular', 'views', 'alphabetical')
      .default('newest')
      .messages({
        'any.only': 'معيار الترتيب غير صالح'
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقم',
        'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
        'number.min': 'رقم الصفحة يجب أن يكون 1 أو أكثر'
      }),
    limit: Joi.number()
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
    includeCount: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'تضمين العدد يجب أن يكون true أو false'
      }),
    tags: Joi.array()
      .items(
        Joi.string()
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
    dateRange: Joi.object({
      startDate: Joi.date()
        .messages({
          'date.base': 'تاريخ البداية يجب أن يكون تاريخ صالح'
        }),
      endDate: Joi.date()
        .min(Joi.ref('startDate'))
        .messages({
          'date.base': 'تاريخ النهاية يجب أن يكون تاريخ صالح',
          'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
        })
    }),
    artistExperience: Joi.string()
      .valid('beginner', 'intermediate', 'expert', 'master')
      .messages({
        'any.only': 'مستوى خبرة الفنان غير صالح'
      }),
    artworkStyle: Joi.array()
      .items(
        Joi.string()
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
  body: Joi.object({
    searchCriteria: Joi.object({
      keywords: Joi.array()
        .items(
          Joi.string()
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
      exactPhrase: Joi.string()
        .max(200)
        .messages({
          'string.max': 'العبارة الدقيقة يجب ألا تتجاوز 200 حرف'
        }),
      excludeWords: Joi.array()
        .items(
          Joi.string()
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
    filters: Joi.object({
      categories: Joi.array()
        .items(
          Joi.string()
            .pattern(MONGODB_OBJECTID_REGEX)
            .messages({
              'string.pattern.base': 'معرف التصنيف غير صالح'
            })
        )
        .max(10)
        .messages({
          'array.base': 'التصنيفات يجب أن تكون قائمة',
          'array.max': 'لا يمكن اختيار أكثر من 10 تصنيفات'
        }),
      priceRange: Joi.object({
        min: Joi.number()
          .min(0)
          .messages({
            'number.min': 'الحد الأدنى للسعر يجب أن يكون 0 أو أكثر'
          }),
        max: Joi.number()
          .min(0)
          .greater(Joi.ref('min'))
          .messages({
            'number.min': 'الحد الأقصى للسعر يجب أن يكون 0 أو أكثر',
            'number.greater': 'الحد الأقصى للسعر يجب أن يكون أكبر من الحد الأدنى'
          })
      }),
      ratingRange: Joi.object({
        min: Joi.number()
          .min(1)
          .max(5)
          .integer()
          .messages({
            'number.min': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
            'number.max': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
            'number.integer': 'الحد الأدنى للتقييم يجب أن يكون رقم صحيح'
          }),
        max: Joi.number()
          .min(1)
          .max(5)
          .integer()
          .min(Joi.ref('min'))
          .messages({
            'number.min': 'الحد الأقصى للتقييم يجب أن يكون بين 1 و 5',
            'number.max': 'الحد الأقصى للتقييم يجب أن يكون بين 1 و 5',
            'number.integer': 'الحد الأقصى للتقييم يجب أن يكون رقم صحيح'
          })
      }),
      dateCreated: Joi.object({
        startDate: Joi.date()
          .messages({
            'date.base': 'تاريخ البداية يجب أن يكون تاريخ صالح'
          }),
        endDate: Joi.date()
          .min(Joi.ref('startDate'))
          .messages({
            'date.base': 'تاريخ النهاية يجب أن يكون تاريخ صالح',
            'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
          })
      }),
      location: Joi.object({
        country: Joi.string()
          .max(50)
          .messages({
            'string.max': 'اسم البلد يجب ألا يتجاوز 50 حرف'
          }),
        city: Joi.string()
          .max(50)
          .messages({
            'string.max': 'اسم المدينة يجب ألا يتجاوز 50 حرف'
          }),
        radius: Joi.number()
          .min(1)
          .max(1000)
          .messages({
            'number.min': 'نطاق البحث يجب أن يكون 1 كم أو أكثر',
            'number.max': 'نطاق البحث يجب ألا يتجاوز 1000 كم'
          })
      })
    }),
    sorting: Joi.object({
      primary: Joi.string()
        .valid('relevance', 'newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular', 'views')
        .default('relevance')
        .messages({
          'any.only': 'معيار الترتيب الأساسي غير صالح'
        }),
      secondary: Joi.string()
        .valid('newest', 'oldest', 'price_low', 'price_high', 'rating', 'popular', 'views')
        .messages({
          'any.only': 'معيار الترتيب الثانوي غير صالح'
        })
    }),
    pagination: Joi.object({
      page: Joi.number()
        .integer()
        .min(1)
        .default(1)
        .messages({
          'number.base': 'رقم الصفحة يجب أن يكون رقم',
          'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
          'number.min': 'رقم الصفحة يجب أن يكون 1 أو أكثر'
        }),
      limit: Joi.number()
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
  query: Joi.object({
    type: Joi.string()
      .valid('artworks', 'artists', 'categories', 'all')
      .default('all')
      .messages({
        'any.only': 'نوع المحتوى الرائج غير صالح'
      }),
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year')
      .default('week')
      .messages({
        'any.only': 'فترة المحتوى الرائج غير صالحة'
      }),
    limit: Joi.number()
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
    includeStats: Joi.boolean()
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
  query: Joi.object({
    type: Joi.string()
      .valid('artworks', 'artists', 'categories', 'mixed')
      .default('mixed')
      .messages({
        'any.only': 'نوع التوصيات غير صالح'
      }),
    basedOn: Joi.string()
      .valid('viewing_history', 'purchases', 'favorites', 'ratings', 'similar_users')
      .default('viewing_history')
      .messages({
        'any.only': 'أساس التوصية غير صالح'
      }),
    limit: Joi.number()
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
    excludeViewed: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'استبعاد المشاهد يجب أن يكون true أو false'
      }),
    diversityFactor: Joi.number()
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
  query: Joi.object({
    type: Joi.string()
      .valid('overview', 'detailed', 'trends', 'comparisons')
      .default('overview')
      .messages({
        'any.only': 'نوع الإحصائيات غير صالح'
      }),
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'فترة الإحصائيات غير صالحة'
      }),
    metrics: Joi.array()
      .items(
        Joi.string()
          .valid('users', 'artworks', 'transactions', 'reviews', 'views', 'revenue', 'growth')
          .messages({
            'any.only': 'مقياس الإحصائيات غير صالح'
          })
      )
      .default(['users', 'artworks', 'transactions'])
      .messages({
        'array.base': 'مقاييس الإحصائيات يجب أن تكون قائمة'
      }),
    groupBy: Joi.string()
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
  query: Joi.object({
    q: Joi.string()
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
    type: Joi.string()
      .valid('all', 'artworks', 'artists', 'categories', 'tags')
      .default('all')
      .messages({
        'any.only': 'نوع الاقتراحات غير صالح'
      }),
    limit: Joi.number()
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
  query: Joi.object({
    feedType: Joi.string()
      .valid('following', 'discover', 'trending', 'recommended', 'recent')
      .default('discover')
      .messages({
        'any.only': 'نوع الخلاصة غير صالح'
      }),
    contentTypes: Joi.array()
      .items(
        Joi.string()
          .valid('artworks', 'artist_updates', 'reviews', 'collections', 'events')
          .messages({
            'any.only': 'نوع المحتوى غير صالح'
          })
      )
      .default(['artworks', 'artist_updates'])
      .messages({
        'array.base': 'أنواع المحتوى يجب أن تكون قائمة'
      }),
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقم',
        'number.integer': 'رقم الصفحة يجب أن يكون رقم صحيح',
        'number.min': 'رقم الصفحة يجب أن يكون 1 أو أكثر'
      }),
    limit: Joi.number()
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
    refreshToken: Joi.string()
      .messages({
        'string.base': 'رمز التحديث يجب أن يكون نص'
      })
  })
};

/**
 * Schema for location-based search
 */
export const locationSearchSchema = {
  query: Joi.object({
    latitude: Joi.number()
      .required()
      .min(-90)
      .max(90)
      .messages({
        'number.base': 'خط العرض يجب أن يكون رقم',
        'any.required': 'خط العرض مطلوب',
        'number.min': 'خط العرض يجب أن يكون بين -90 و 90',
        'number.max': 'خط العرض يجب أن يكون بين -90 و 90'
      }),
    longitude: Joi.number()
      .required()
      .min(-180)
      .max(180)
      .messages({
        'number.base': 'خط الطول يجب أن يكون رقم',
        'any.required': 'خط الطول مطلوب',
        'number.min': 'خط الطول يجب أن يكون بين -180 و 180',
        'number.max': 'خط الطول يجب أن يكون بين -180 و 180'
      }),
    radius: Joi.number()
      .min(1)
      .max(1000)
      .default(50)
      .messages({
        'number.base': 'نطاق البحث يجب أن يكون رقم',
        'number.min': 'نطاق البحث يجب أن يكون 1 كم أو أكثر',
        'number.max': 'نطاق البحث يجب ألا يتجاوز 1000 كم'
      }),
    unit: Joi.string()
      .valid('km', 'miles')
      .default('km')
      .messages({
        'any.only': 'وحدة المسافة غير صالحة'
      }),
    type: Joi.string()
      .valid('artworks', 'artists', 'galleries', 'events', 'all')
      .default('all')
      .messages({
        'any.only': 'نوع البحث الجغرافي غير صالح'
      }),
    limit: Joi.number()
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