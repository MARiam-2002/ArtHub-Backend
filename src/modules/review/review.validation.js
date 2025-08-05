import Joi from 'joi';

// MongoDB ObjectId regex pattern for validation
const MONGODB_OBJECTID_REGEX = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateArtworkReviewRequest:
 *       type: object
 *       required:
 *         - artwork
 *         - rating
 *       properties:
 *         artwork:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *           description: معرف العمل الفني (MongoDB ObjectId)
 *           example: "507f1f77bcf86cd799439011"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: التقييم العام (1-5 نجوم)
 *           example: 4
 *         title:
 *           type: string
 *           maxLength: 100
 *           description: عنوان التقييم
 *           example: "عمل فني رائع ومبدع"
 *         comment:
 *           type: string
 *           maxLength: 2000
 *           description: تعليق مفصل على العمل الفني
 *           example: "هذا العمل الفني يظهر مهارة عالية في التقنية والإبداع"
 *         pros:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 200
 *           maxItems: 10
 *           description: النقاط الإيجابية في العمل
 *           example: ["تقنية ممتازة", "ألوان جميلة", "تكوين متوازن"]
 *         cons:
 *           type: array
 *           items:
 *             type: string
 *             maxLength: 200
 *           maxItems: 10
 *           description: النقاط السلبية في العمل
 *           example: ["يحتاج لمزيد من التفاصيل"]
 *         subRatings:
 *           type: object
 *           description: تقييمات فرعية للعمل الفني
 *           properties:
 *             creativity:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: تقييم الإبداع
 *             technique:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: تقييم التقنية
 *             composition:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: تقييم التكوين
 *             originality:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: تقييم الأصالة
 *             impact:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: تقييم التأثير
 *             valueForMoney:
 *               type: number
 *               minimum: 1
 *               maximum: 5
 *               description: تقييم القيمة مقابل المال
 *         isRecommended:
 *           type: boolean
 *           description: هل توصي بهذا العمل الفني
 *           example: true
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           maxItems: 10
 *           description: علامات التقييم
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *           description: مرفقات التقييم
 */

/**
 * Schema for creating artwork review
 */
export const createArtworkReviewSchema = {
  body: Joi.object({
    artwork: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف العمل الفني مطلوب',
        'string.pattern.base': 'معرف العمل الفني غير صالح',
        'any.required': 'معرف العمل الفني مطلوب'
      }),
    rating: Joi.number()
      .required()
      .min(1)
      .max(5)
      .integer()
      .messages({
        'number.base': 'التقييم يجب أن يكون رقم',
        'number.min': 'التقييم يجب أن يكون بين 1 و 5',
        'number.max': 'التقييم يجب أن يكون بين 1 و 5',
        'number.integer': 'التقييم يجب أن يكون رقم صحيح',
        'any.required': 'التقييم مطلوب'
      }),
    title: Joi.string()
      .min(5)
      .max(100)
      .messages({
        'string.min': 'عنوان التقييم يجب أن يكون على الأقل 5 أحرف',
        'string.max': 'عنوان التقييم يجب ألا يتجاوز 100 حرف'
      }),
    comment: Joi.string()
      .min(10)
      .max(2000)
      .messages({
        'string.min': 'التعليق يجب أن يكون على الأقل 10 أحرف',
        'string.max': 'التعليق يجب ألا يتجاوز 2000 حرف'
      }),
    pros: Joi.array()
      .items(
        Joi.string()
          .min(3)
          .max(200)
          .messages({
            'string.min': 'النقطة الإيجابية يجب أن تكون على الأقل 3 أحرف',
            'string.max': 'النقطة الإيجابية يجب ألا تتجاوز 200 حرف'
          })
      )
      .max(10)
      .messages({
        'array.base': 'النقاط الإيجابية يجب أن تكون قائمة',
        'array.max': 'لا يمكن إضافة أكثر من 10 نقاط إيجابية'
      }),
    cons: Joi.array()
      .items(
        Joi.string()
          .min(3)
          .max(200)
          .messages({
            'string.min': 'النقطة السلبية يجب أن تكون على الأقل 3 أحرف',
            'string.max': 'النقطة السلبية يجب ألا تتجاوز 200 حرف'
          })
      )
      .max(10)
      .messages({
        'array.base': 'النقاط السلبية يجب أن تكون قائمة',
        'array.max': 'لا يمكن إضافة أكثر من 10 نقاط سلبية'
      }),
    subRatings: Joi.object({
      creativity: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم الإبداع يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم الإبداع يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم الإبداع يجب أن يكون رقم صحيح'
        }),
      technique: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم التقنية يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم التقنية يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم التقنية يجب أن يكون رقم صحيح'
        }),
      composition: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم التكوين يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم التكوين يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم التكوين يجب أن يكون رقم صحيح'
        }),
      originality: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم الأصالة يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم الأصالة يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم الأصالة يجب أن يكون رقم صحيح'
        }),
      impact: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم التأثير يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم التأثير يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم التأثير يجب أن يكون رقم صحيح'
        }),
      valueForMoney: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم القيمة مقابل المال يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم القيمة مقابل المال يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم القيمة مقابل المال يجب أن يكون رقم صحيح'
        }),
      communication: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم التواصل يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم التواصل يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم التواصل يجب أن يكون رقم صحيح'
        }),
      delivery: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم التسليم يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم التسليم يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم التسليم يجب أن يكون رقم صحيح'
        })
    }),
    isRecommended: Joi.boolean()
      .messages({
        'boolean.base': 'التوصية يجب أن تكون true أو false'
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
        'array.max': 'لا يمكن إضافة أكثر من 10 علامات'
      }),
    attachments: Joi.array()
      .items(
        Joi.object({
          url: Joi.string()
            .uri()
            .required()
            .messages({
              'string.uri': 'رابط المرفق غير صالح',
              'any.required': 'رابط المرفق مطلوب'
            }),
          type: Joi.string()
            .valid('image', 'video', 'document')
            .required()
            .messages({
              'any.only': 'نوع المرفق غير صالح',
              'any.required': 'نوع المرفق مطلوب'
            }),
          caption: Joi.string()
            .max(200)
            .messages({
              'string.max': 'وصف المرفق يجب ألا يتجاوز 200 حرف'
            })
        })
      )
      .max(5)
      .messages({
        'array.base': 'المرفقات يجب أن تكون قائمة',
        'array.max': 'لا يمكن إرفاق أكثر من 5 ملفات'
      }),
    purchaseInfo: Joi.object({
      transactionId: Joi.string()
        .pattern(MONGODB_OBJECTID_REGEX)
        .messages({
          'string.pattern.base': 'معرف المعاملة غير صالح'
        }),
      purchaseDate: Joi.date()
        .messages({
          'date.base': 'تاريخ الشراء غير صالح'
        }),
      purchasePrice: Joi.number()
        .positive()
        .messages({
          'number.positive': 'سعر الشراء يجب أن يكون رقم موجب'
        })
    }),
    anonymous: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'الخيار المجهول يجب أن يكون true أو false'
      })
  })
};

/**
 * Schema for creating artist review
 */
export const createArtistReviewSchema = {
  body: Joi.object({
    artist: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف الفنان مطلوب',
        'string.pattern.base': 'معرف الفنان غير صالح',
        'any.required': 'معرف الفنان مطلوب'
      }),
    rating: Joi.number()
      .required()
      .min(1)
      .max(5)
      .integer()
      .messages({
        'number.base': 'التقييم يجب أن يكون رقم',
        'number.min': 'التقييم يجب أن يكون بين 1 و 5',
        'number.max': 'التقييم يجب أن يكون بين 1 و 5',
        'number.integer': 'التقييم يجب أن يكون رقم صحيح',
        'any.required': 'التقييم مطلوب'
      }),
    title: Joi.string()
      .min(5)
      .max(100)
      .messages({
        'string.min': 'عنوان التقييم يجب أن يكون على الأقل 5 أحرف',
        'string.max': 'عنوان التقييم يجب ألا يتجاوز 100 حرف'
      }),
    comment: Joi.string()
      .min(10)
      .max(2000)
      .messages({
        'string.min': 'التعليق يجب أن يكون على الأقل 10 أحرف',
        'string.max': 'التعليق يجب ألا يتجاوز 2000 حرف'
      }),
    pros: Joi.array()
      .items(
        Joi.string()
          .min(3)
          .max(200)
          .messages({
            'string.min': 'النقطة الإيجابية يجب أن تكون على الأقل 3 أحرف',
            'string.max': 'النقطة الإيجابية يجب ألا تتجاوز 200 حرف'
          })
      )
      .max(10)
      .messages({
        'array.base': 'النقاط الإيجابية يجب أن تكون قائمة',
        'array.max': 'لا يمكن إضافة أكثر من 10 نقاط إيجابية'
      }),
    cons: Joi.array()
      .items(
        Joi.string()
          .min(3)
          .max(200)
          .messages({
            'string.min': 'النقطة السلبية يجب أن تكون على الأقل 3 أحرف',
            'string.max': 'النقطة السلبية يجب ألا تتجاوز 200 حرف'
          })
      )
      .max(10)
      .messages({
        'array.base': 'النقاط السلبية يجب أن تكون قائمة',
        'array.max': 'لا يمكن إضافة أكثر من 10 نقاط سلبية'
      }),
    subRatings: Joi.object({
      professionalism: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم الاحترافية يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم الاحترافية يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم الاحترافية يجب أن يكون رقم صحيح'
        }),
      communication: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم التواصل يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم التواصل يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم التواصل يجب أن يكون رقم صحيح'
        }),
      delivery: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم التسليم يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم التسليم يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم التسليم يجب أن يكون رقم صحيح'
        }),
      creativity: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم الإبداع يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم الإبداع يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم الإبداع يجب أن يكون رقم صحيح'
        }),
      valueForMoney: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم القيمة مقابل المال يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم القيمة مقابل المال يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم القيمة مقابل المال يجب أن يكون رقم صحيح'
        }),
      responsiveness: Joi.number()
        .min(1)
        .max(5)
        .integer()
        .messages({
          'number.min': 'تقييم سرعة الاستجابة يجب أن يكون بين 1 و 5',
          'number.max': 'تقييم سرعة الاستجابة يجب أن يكون بين 1 و 5',
          'number.integer': 'تقييم سرعة الاستجابة يجب أن يكون رقم صحيح'
        })
    }),
    isRecommended: Joi.boolean()
      .messages({
        'boolean.base': 'التوصية يجب أن تكون true أو false'
      }),
    workingExperience: Joi.object({
      projectType: Joi.string()
        .valid('commission', 'collaboration', 'purchase', 'consultation', 'other')
        .messages({
          'any.only': 'نوع المشروع غير صالح'
        }),
      duration: Joi.string()
        .valid('less_than_week', 'one_to_two_weeks', 'two_to_four_weeks', 'one_to_three_months', 'more_than_three_months')
        .messages({
          'any.only': 'مدة المشروع غير صالحة'
        }),
      budget: Joi.string()
        .valid('under_100', '100_500', '500_1000', '1000_5000', 'over_5000')
        .messages({
          'any.only': 'نطاق الميزانية غير صالح'
        })
    }),
    anonymous: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'الخيار المجهول يجب أن يكون true أو false'
      })
  })
};

/**
 * Schema for updating review
 */
export const updateReviewSchema = {
  body: Joi.object({
    rating: Joi.number()
      .min(1)
      .max(5)
      .integer()
      .messages({
        'number.base': 'التقييم يجب أن يكون رقم',
        'number.min': 'التقييم يجب أن يكون بين 1 و 5',
        'number.max': 'التقييم يجب أن يكون بين 1 و 5',
        'number.integer': 'التقييم يجب أن يكون رقم صحيح'
      }),
    title: Joi.string()
      .min(5)
      .max(100)
      .messages({
        'string.min': 'عنوان التقييم يجب أن يكون على الأقل 5 أحرف',
        'string.max': 'عنوان التقييم يجب ألا يتجاوز 100 حرف'
      }),
    comment: Joi.string()
      .min(10)
      .max(2000)
      .messages({
        'string.min': 'التعليق يجب أن يكون على الأقل 10 أحرف',
        'string.max': 'التعليق يجب ألا يتجاوز 2000 حرف'
      }),
    pros: Joi.array()
      .items(
        Joi.string()
          .min(3)
          .max(200)
          .messages({
            'string.min': 'النقطة الإيجابية يجب أن تكون على الأقل 3 أحرف',
            'string.max': 'النقطة الإيجابية يجب ألا تتجاوز 200 حرف'
          })
      )
      .max(10)
      .messages({
        'array.base': 'النقاط الإيجابية يجب أن تكون قائمة',
        'array.max': 'لا يمكن إضافة أكثر من 10 نقاط إيجابية'
      }),
    cons: Joi.array()
      .items(
        Joi.string()
          .min(3)
          .max(200)
          .messages({
            'string.min': 'النقطة السلبية يجب أن تكون على الأقل 3 أحرف',
            'string.max': 'النقطة السلبية يجب ألا تتجاوز 200 حرف'
          })
      )
      .max(10)
      .messages({
        'array.base': 'النقاط السلبية يجب أن تكون قائمة',
        'array.max': 'لا يمكن إضافة أكثر من 10 نقاط سلبية'
      }),
    subRatings: Joi.object()
      .pattern(
        Joi.string(),
        Joi.number()
          .min(1)
          .max(5)
          .integer()
          .messages({
            'number.min': 'التقييم الفرعي يجب أن يكون بين 1 و 5',
            'number.max': 'التقييم الفرعي يجب أن يكون بين 1 و 5',
            'number.integer': 'التقييم الفرعي يجب أن يكون رقم صحيح'
          })
      ),
    isRecommended: Joi.boolean()
      .messages({
        'boolean.base': 'التوصية يجب أن تكون true أو false'
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
        'array.max': 'لا يمكن إضافة أكثر من 10 علامات'
      })
  }),
  params: Joi.object({
    reviewId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف التقييم مطلوب',
        'string.pattern.base': 'معرف التقييم غير صالح',
        'any.required': 'معرف التقييم مطلوب'
      })
  })
};

/**
 * Schema for getting reviews with filters
 */
export const getReviewsSchema = {
  query: Joi.object({
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
      .default(10)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقم',
        'number.integer': 'حد النتائج يجب أن يكون رقم صحيح',
        'number.min': 'حد النتائج يجب أن يكون 1 أو أكثر',
        'number.max': 'حد النتائج يجب ألا يتجاوز 100'
      }),
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .messages({
        'number.integer': 'التقييم يجب أن يكون رقم صحيح',
        'number.min': 'التقييم يجب أن يكون بين 1 و 5',
        'number.max': 'التقييم يجب أن يكون بين 1 و 5'
      }),
    minRating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .messages({
        'number.integer': 'الحد الأدنى للتقييم يجب أن يكون رقم صحيح',
        'number.min': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5',
        'number.max': 'الحد الأدنى للتقييم يجب أن يكون بين 1 و 5'
      }),
    maxRating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .messages({
        'number.integer': 'الحد الأقصى للتقييم يجب أن يكون رقم صحيح',
        'number.min': 'الحد الأقصى للتقييم يجب أن يكون بين 1 و 5',
        'number.max': 'الحد الأقصى للتقييم يجب أن يكون بين 1 و 5'
      }),
    verified: Joi.boolean()
      .messages({
        'boolean.base': 'الشراء المعتمد يجب أن يكون true أو false'
      }),
    recommended: Joi.boolean()
      .messages({
        'boolean.base': 'التوصية يجب أن تكون true أو false'
      }),
    search: Joi.string()
      .min(2)
      .max(100)
      .messages({
        'string.min': 'البحث يجب أن يكون على الأقل حرفين',
        'string.max': 'البحث يجب ألا يتجاوز 100 حرف'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'rating', 'helpfulVotes', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'معيار الترتيب غير صالح'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'اتجاه الترتيب غير صالح'
      }),
    startDate: Joi.date()
      .messages({
        'date.base': 'تاريخ البداية يجب أن يكون تاريخ صالح'
      }),
    endDate: Joi.date()
      .min(Joi.ref('startDate'))
      .messages({
        'date.base': 'تاريخ النهاية يجب أن يكون تاريخ صالح',
        'date.min': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
      }),
    status: Joi.string()
      .valid('active', 'hidden', 'reported', 'deleted')
      .default('active')
      .messages({
        'any.only': 'حالة التقييم غير صالحة'
      }),
    hasImages: Joi.boolean()
      .messages({
        'boolean.base': 'وجود الصور يجب أن يكون true أو false'
      }),
    includeAnonymous: Joi.boolean()
      .default(true)
      .messages({
        'boolean.base': 'تضمين التقييمات المجهولة يجب أن يكون true أو false'
      })
  }),
  params: Joi.object({
    targetId: Joi.string()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.pattern.base': 'معرف الهدف غير صالح'
      }),
    targetType: Joi.string()
      .valid('artwork', 'artist')
      .messages({
        'any.only': 'نوع الهدف غير صالح'
      })
  })
};

/**
 * Schema for review interaction (helpful, report)
 */
export const reviewInteractionSchema = {
  body: Joi.object({
    action: Joi.string()
      .required()
      .valid('helpful', 'unhelpful', 'report', 'unreport')
      .messages({
        'string.empty': 'الإجراء مطلوب',
        'any.required': 'الإجراء مطلوب',
        'any.only': 'الإجراء غير صالح'
      }),
    reason: Joi.string()
      .when('action', {
        is: 'report',
        then: Joi.required(),
        otherwise: Joi.optional()
      })
      .valid('spam', 'inappropriate', 'fake', 'offensive', 'misleading', 'other')
      .messages({
        'any.required': 'سبب التبليغ مطلوب',
        'any.only': 'سبب التبليغ غير صالح'
      }),
    comment: Joi.string()
      .max(500)
      .messages({
        'string.max': 'التعليق يجب ألا يتجاوز 500 حرف'
      })
  }),
  params: Joi.object({
    reviewId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف التقييم مطلوب',
        'string.pattern.base': 'معرف التقييم غير صالح',
        'any.required': 'معرف التقييم مطلوب'
      })
  })
};

/**
 * Schema for review statistics
 */
export const getReviewStatsSchema = {
  query: Joi.object({
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'فترة الإحصائيات غير صالحة'
      }),
    groupBy: Joi.string()
      .valid('rating', 'targetType', 'month', 'week', 'status')
      .messages({
        'any.only': 'معيار التجميع غير صالح'
      }),
    includeDetails: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'تضمين التفاصيل يجب أن يكون true أو false'
      })
  }),
  params: Joi.object({
    targetId: Joi.string()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.pattern.base': 'معرف الهدف غير صالح'
      }),
    targetType: Joi.string()
      .valid('artwork', 'artist')
      .messages({
        'any.only': 'نوع الهدف غير صالح'
      })
  })
};

/**
 * Schema for bulk review operations
 */
export const bulkReviewOperationsSchema = {
  body: Joi.object({
    reviewIds: Joi.array()
      .items(
        Joi.string()
          .pattern(MONGODB_OBJECTID_REGEX)
          .messages({
            'string.pattern.base': 'معرف التقييم غير صالح'
          })
      )
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.base': 'معرفات التقييمات يجب أن تكون قائمة',
        'array.min': 'يجب تحديد تقييم واحد على الأقل',
        'array.max': 'لا يمكن معالجة أكثر من 50 تقييم في المرة الواحدة',
        'any.required': 'معرفات التقييمات مطلوبة'
      }),
    operation: Joi.string()
      .required()
      .valid('delete', 'hide', 'show', 'approve', 'reject')
      .messages({
        'string.empty': 'العملية مطلوبة',
        'any.required': 'العملية مطلوبة',
        'any.only': 'العملية غير صالحة'
      }),
    reason: Joi.string()
      .max(500)
      .messages({
        'string.max': 'السبب يجب ألا يتجاوز 500 حرف'
      })
  })
};

/**
 * Schema for review ID parameter validation
 */
export const reviewIdSchema = {
  params: Joi.object({
    reviewId: Joi.string()
      .required()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.empty': 'معرف التقييم مطلوب',
        'string.pattern.base': 'معرف التقييم غير صالح',
        'any.required': 'معرف التقييم مطلوب'
      })
  })
};

/**
 * Schema for review comparison
 */
export const compareReviewsSchema = {
  body: Joi.object({
    reviewIds: Joi.array()
      .items(
        Joi.string()
          .pattern(MONGODB_OBJECTID_REGEX)
          .messages({
            'string.pattern.base': 'معرف التقييم غير صالح'
          })
      )
      .min(2)
      .max(5)
      .required()
      .messages({
        'array.base': 'معرفات التقييمات يجب أن تكون قائمة',
        'array.min': 'يجب تحديد تقييمين على الأقل للمقارنة',
        'array.max': 'لا يمكن مقارنة أكثر من 5 تقييمات في المرة الواحدة',
        'any.required': 'معرفات التقييمات مطلوبة'
      }),
    compareBy: Joi.array()
      .items(
        Joi.string()
          .valid('rating', 'subRatings', 'pros', 'cons', 'sentiment', 'length', 'helpfulness')
          .messages({
            'any.only': 'معيار المقارنة غير صالح'
          })
      )
      .default(['rating', 'subRatings'])
      .messages({
        'array.base': 'معايير المقارنة يجب أن تكون قائمة'
      })
  })
};

/**
 * Schema for review analytics
 */
export const reviewAnalyticsSchema = {
  query: Joi.object({
    targetType: Joi.string()
      .valid('artwork', 'artist', 'all')
      .default('all')
      .messages({
        'any.only': 'نوع الهدف غير صالح'
      }),
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'فترة التحليل غير صالحة'
      }),
    metrics: Joi.array()
      .items(
        Joi.string()
          .valid('averageRating', 'totalReviews', 'ratingDistribution', 'sentiment', 'trends', 'topReviewers')
          .messages({
            'any.only': 'مقياس التحليل غير صالح'
          })
      )
      .default(['averageRating', 'totalReviews', 'ratingDistribution'])
      .messages({
        'array.base': 'مقاييس التحليل يجب أن تكون قائمة'
      }),
    includeSubRatings: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'تضمين التقييمات الفرعية يجب أن يكون true أو false'
      })
  })
};

/**
 * Schema for exporting reviews
 */
export const exportReviewsSchema = {
  query: Joi.object({
    format: Joi.string()
      .valid('csv', 'json', 'xlsx')
      .default('csv')
      .messages({
        'any.only': 'تنسيق التصدير غير صالح'
      }),
    fields: Joi.array()
      .items(
        Joi.string()
          .valid('user', 'rating', 'title', 'comment', 'pros', 'cons', 'subRatings', 'createdAt', 'isVerifiedPurchase', 'isRecommended', 'helpfulVotes')
          .messages({
            'any.only': 'حقل التصدير غير صالح'
          })
      )
      .default(['user', 'rating', 'title', 'comment', 'createdAt'])
      .messages({
        'array.base': 'حقول التصدير يجب أن تكون قائمة'
      }),
    includeDeleted: Joi.boolean()
      .default(false)
      .messages({
        'boolean.base': 'تضمين المحذوفات يجب أن يكون true أو false'
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
    })
  })
};

/**
 * Schema for validating target ID (artwork or artist)
 */
export const targetIdSchema = {
  params: Joi.object({
    artworkId: Joi.string()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.pattern.base': 'معرف العمل الفني غير صالح',
        'any.required': 'معرف العمل الفني مطلوب'
      }),
    artistId: Joi.string()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.pattern.base': 'معرف الفنان غير صالح',
        'any.required': 'معرف الفنان مطلوب'
      }),
    reviewId: Joi.string()
      .pattern(MONGODB_OBJECTID_REGEX)
      .messages({
        'string.pattern.base': 'معرف التقييم غير صالح',
        'any.required': 'معرف التقييم مطلوب'
      })
  })
};

/**
 * Schema for review query parameters
 */
export const reviewQuerySchema = {
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقم صحيح',
        'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
      }),
    limit: Joi.number()
      .integer()
      .min(1)
      .max(50)
      .default(10)
      .messages({
        'number.base': 'عدد العناصر يجب أن يكون رقم صحيح',
        'number.min': 'عدد العناصر يجب أن يكون 1 على الأقل',
        'number.max': 'عدد العناصر يجب أن يكون 50 على الأكثر'
      }),
    rating: Joi.number()
      .integer()
      .min(1)
      .max(5)
      .messages({
        'number.base': 'التقييم يجب أن يكون رقم صحيح',
        'number.min': 'التقييم يجب أن يكون 1 على الأقل',
        'number.max': 'التقييم يجب أن يكون 5 على الأكثر'
      }),
    sortBy: Joi.string()
      .valid('createdAt', 'rating', 'helpfulVotes', 'updatedAt')
      .default('createdAt')
      .messages({
        'any.only': 'معيار الترتيب غير صالح'
      }),
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'ترتيب النتائج غير صالح'
      }),
    verified: Joi.string()
      .valid('true', 'false')
      .messages({
        'any.only': 'قيمة التحقق غير صالحة'
      }),
    recommended: Joi.string()
      .valid('true', 'false')
      .messages({
        'any.only': 'قيمة التوصية غير صالحة'
      }),
    search: Joi.string()
      .max(100)
      .messages({
        'string.max': 'نص البحث يجب أن يكون أقل من 100 حرف'
      })
  })
}; 