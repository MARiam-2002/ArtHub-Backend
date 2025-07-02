import Joi from 'joi';

// MongoDB ObjectId validation pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateTransactionRequest:
 *       type: object
 *       required:
 *         - items
 *         - payment
 *         - shipping
 *       properties:
 *         items:
 *           type: array
 *           minItems: 1
 *           maxItems: 10
 *           items:
 *             type: object
 *             properties:
 *               artworkId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: معرف العمل الفني
 *               specialRequestId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: معرف الطلب الخاص
 *               quantity:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 description: الكمية
 *         payment:
 *           type: object
 *           required:
 *             - method
 *             - provider
 *           properties:
 *             method:
 *               type: string
 *               enum: [credit_card, debit_card, bank_transfer, paypal, stripe, apple_pay, google_pay, mada, stc_pay, other]
 *               description: طريقة الدفع
 *             provider:
 *               type: string
 *               description: مزود خدمة الدفع
 *             transactionId:
 *               type: string
 *               description: معرف المعاملة من مزود الدفع
 *             reference:
 *               type: string
 *               description: المرجع من مزود الدفع
 *             cardLast4:
 *               type: string
 *               pattern: '^\\d{4}$'
 *               description: آخر 4 أرقام من البطاقة
 *             cardBrand:
 *               type: string
 *               enum: [visa, mastercard, amex, mada, other]
 *               description: نوع البطاقة
 *         shipping:
 *           type: object
 *           required:
 *             - address
 *           properties:
 *             address:
 *               type: object
 *               required:
 *                 - fullName
 *                 - addressLine1
 *                 - city
 *                 - country
 *                 - phoneNumber
 *               properties:
 *                 fullName:
 *                   type: string
 *                   minLength: 2
 *                   maxLength: 100
 *                 addressLine1:
 *                   type: string
 *                   minLength: 5
 *                   maxLength: 200
 *                 addressLine2:
 *                   type: string
 *                   maxLength: 200
 *                 city:
 *                   type: string
 *                   minLength: 2
 *                   maxLength: 50
 *                 state:
 *                   type: string
 *                   maxLength: 50
 *                 postalCode:
 *                   type: string
 *                   maxLength: 20
 *                 country:
 *                   type: string
 *                   minLength: 2
 *                   maxLength: 2
 *                 phoneNumber:
 *                   type: string
 *                   pattern: '^\\+?[1-9]\\d{1,14}$'
 *             method:
 *               type: string
 *               enum: [standard, express, overnight, pickup]
 *               description: طريقة الشحن
 *         installments:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *             totalInstallments:
 *               type: number
 *               minimum: 2
 *               maximum: 12
 *         discountCode:
 *           type: string
 *           maxLength: 50
 *           description: كود الخصم
 *         notes:
 *           type: string
 *           maxLength: 1000
 *           description: ملاحظات إضافية
 *       example:
 *         items:
 *           - artworkId: "507f1f77bcf86cd799439011"
 *             quantity: 1
 *         payment:
 *           method: "credit_card"
 *           provider: "stripe"
 *           transactionId: "pi_1234567890"
 *           cardLast4: "4242"
 *           cardBrand: "visa"
 *         shipping:
 *           address:
 *             fullName: "أحمد محمد"
 *             addressLine1: "شارع الملك فهد، حي النخيل"
 *             city: "الرياض"
 *             country: "SA"
 *             phoneNumber: "+966501234567"
 *           method: "standard"
 *         notes: "يرجى التعامل بحذر مع اللوحة"
 */

// Transaction item validation schema
const transactionItemSchema = Joi.object({
  artworkId: Joi.string()
    .pattern(objectIdPattern)
    .messages({
      'string.pattern.base': 'معرف العمل الفني غير صالح'
    }),
    
  specialRequestId: Joi.string()
    .pattern(objectIdPattern)
    .messages({
      'string.pattern.base': 'معرف الطلب الخاص غير صالح'
    }),
    
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(1)
    .messages({
      'number.base': 'الكمية يجب أن تكون رقماً',
      'number.integer': 'الكمية يجب أن تكون رقماً صحيحاً',
      'number.min': 'الكمية يجب أن تكون 1 على الأقل',
      'number.max': 'الكمية لا يمكن أن تتجاوز 10'
    })
}).xor('artworkId', 'specialRequestId').messages({
  'object.xor': 'يجب تحديد معرف العمل الفني أو الطلب الخاص (وليس كلاهما)'
});

// Payment details validation schema
const paymentDetailsSchema = Joi.object({
  method: Joi.string()
    .valid('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'mada', 'stc_pay', 'other')
    .required()
    .messages({
      'string.empty': 'يجب تحديد طريقة الدفع',
      'any.required': 'يجب تحديد طريقة الدفع',
      'any.only': 'طريقة الدفع غير صالحة'
    }),
    
  provider: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'يجب تحديد مزود خدمة الدفع',
      'string.min': 'اسم مزود الخدمة قصير جداً',
      'string.max': 'اسم مزود الخدمة طويل جداً',
      'any.required': 'يجب تحديد مزود خدمة الدفع'
    }),
    
  transactionId: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'معرف المعاملة طويل جداً'
    }),
    
  reference: Joi.string()
    .trim()
    .max(100)
    .optional()
    .messages({
      'string.max': 'المرجع طويل جداً'
    }),
    
  cardLast4: Joi.string()
    .pattern(/^\d{4}$/)
    .optional()
    .messages({
      'string.pattern.base': 'آخر 4 أرقام من البطاقة يجب أن تكون أرقاماً فقط'
    }),
    
  cardBrand: Joi.string()
    .valid('visa', 'mastercard', 'amex', 'mada', 'other')
    .optional()
    .messages({
      'any.only': 'نوع البطاقة غير صالح'
    }),
    
  fees: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'رسوم الدفع يجب أن تكون رقماً',
      'number.min': 'رسوم الدفع لا يمكن أن تكون سالبة',
      'number.precision': 'رسوم الدفع يجب أن تحتوي على منزلتين عشريتين كحد أقصى'
    })
});

// Shipping address validation schema
const shippingAddressSchema = Joi.object({
  fullName: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'يجب تحديد الاسم الكامل',
      'string.min': 'الاسم قصير جداً',
      'string.max': 'الاسم طويل جداً',
      'any.required': 'يجب تحديد الاسم الكامل'
    }),
    
  addressLine1: Joi.string()
    .trim()
    .min(5)
    .max(200)
    .required()
    .messages({
      'string.empty': 'يجب تحديد العنوان',
      'string.min': 'العنوان قصير جداً',
      'string.max': 'العنوان طويل جداً',
      'any.required': 'يجب تحديد العنوان'
    }),
    
  addressLine2: Joi.string()
    .trim()
    .max(200)
    .allow('')
    .optional()
    .messages({
      'string.max': 'العنوان الثاني طويل جداً'
    }),
    
  city: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.empty': 'يجب تحديد المدينة',
      'string.min': 'اسم المدينة قصير جداً',
      'string.max': 'اسم المدينة طويل جداً',
      'any.required': 'يجب تحديد المدينة'
    }),
    
  state: Joi.string()
    .trim()
    .max(50)
    .allow('')
    .optional()
    .messages({
      'string.max': 'اسم المنطقة طويل جداً'
    }),
    
  postalCode: Joi.string()
    .trim()
    .max(20)
    .allow('')
    .optional()
    .messages({
      'string.max': 'الرمز البريدي طويل جداً'
    }),
    
  country: Joi.string()
    .length(2)
    .uppercase()
    .default('SA')
    .messages({
      'string.length': 'رمز الدولة يجب أن يكون مكوناً من حرفين',
      'string.uppercase': 'رمز الدولة يجب أن يكون بالأحرف الكبيرة'
    }),
    
  phoneNumber: Joi.string()
    .pattern(/^\+?[1-9]\d{1,14}$/)
    .required()
    .messages({
      'string.empty': 'يجب تحديد رقم الهاتف',
      'string.pattern.base': 'رقم الهاتف غير صالح',
      'any.required': 'يجب تحديد رقم الهاتف'
    })
});

// Shipping details validation schema
const shippingDetailsSchema = Joi.object({
  address: shippingAddressSchema.required(),
  
  method: Joi.string()
    .valid('standard', 'express', 'overnight', 'pickup')
    .default('standard')
    .messages({
      'any.only': 'طريقة الشحن غير صالحة'
    }),
    
  cost: Joi.number()
    .min(0)
    .precision(2)
    .default(0)
    .messages({
      'number.base': 'تكلفة الشحن يجب أن تكون رقماً',
      'number.min': 'تكلفة الشحن لا يمكن أن تكون سالبة',
      'number.precision': 'تكلفة الشحن يجب أن تحتوي على منزلتين عشريتين كحد أقصى'
    }),
    
  estimatedDays: Joi.number()
    .integer()
    .min(1)
    .max(30)
    .default(7)
    .messages({
      'number.base': 'أيام التسليم المتوقعة يجب أن تكون رقماً',
      'number.integer': 'أيام التسليم المتوقعة يجب أن تكون رقماً صحيحاً',
      'number.min': 'أيام التسليم المتوقعة يجب أن تكون يوماً واحداً على الأقل',
      'number.max': 'أيام التسليم المتوقعة لا يمكن أن تتجاوز 30 يوماً'
    })
});

// Installments validation schema
const installmentsSchema = Joi.object({
  enabled: Joi.boolean()
    .default(false),
    
  totalInstallments: Joi.number()
    .integer()
    .min(2)
    .max(12)
    .when('enabled', {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'number.base': 'عدد الأقساط يجب أن يكون رقماً',
      'number.integer': 'عدد الأقساط يجب أن يكون رقماً صحيحاً',
      'number.min': 'عدد الأقساط يجب أن يكون 2 على الأقل',
      'number.max': 'عدد الأقساط لا يمكن أن يتجاوز 12',
      'any.required': 'يجب تحديد عدد الأقساط عند تفعيل نظام التقسيط'
    })
});

// Create transaction validation schema
export const createTransactionSchema = {
  body: Joi.object({
    items: Joi.array()
      .items(transactionItemSchema)
      .min(1)
      .max(10)
      .required()
      .messages({
        'array.base': 'العناصر يجب أن تكون مصفوفة',
        'array.min': 'يجب تحديد عنصر واحد على الأقل',
        'array.max': 'لا يمكن إضافة أكثر من 10 عناصر',
        'any.required': 'يجب تحديد العناصر المراد شراؤها'
      }),
      
    payment: paymentDetailsSchema.required(),
    shipping: shippingDetailsSchema.required(),
    installments: installmentsSchema.optional(),
    
    discountCode: Joi.string()
      .trim()
      .max(50)
      .optional()
      .messages({
        'string.max': 'كود الخصم طويل جداً'
      }),
      
    notes: Joi.string()
      .trim()
      .max(1000)
      .allow('')
      .optional()
      .messages({
        'string.max': 'الملاحظات طويلة جداً'
      }),
      
    metadata: Joi.object({
      userAgent: Joi.string().max(500).optional(),
      ipAddress: Joi.string().ip().optional(),
      deviceType: Joi.string().valid('mobile', 'desktop', 'tablet', 'unknown').default('unknown'),
      location: Joi.object({
        country: Joi.string().max(50).optional(),
        city: Joi.string().max(50).optional()
      }).optional(),
      source: Joi.string().valid('web', 'mobile_app', 'api').default('web')
    }).optional()
  })
};

// Transaction ID parameter validation
export const transactionIdSchema = {
  params: Joi.object({
    transactionId: Joi.string()
      .pattern(objectIdPattern)
      .required()
      .messages({
        'string.empty': 'يجب تحديد معرف المعاملة',
        'string.pattern.base': 'معرف المعاملة غير صالح',
        'any.required': 'يجب تحديد معرف المعاملة'
      })
  })
};

// Transaction query validation schema
export const transactionQuerySchema = {
  query: Joi.object({
    page: Joi.number()
      .integer()
      .min(1)
      .default(1)
      .messages({
        'number.base': 'رقم الصفحة يجب أن يكون رقماً',
        'number.integer': 'رقم الصفحة يجب أن يكون رقماً صحيحاً',
        'number.min': 'رقم الصفحة يجب أن يكون 1 على الأقل'
      }),
      
    limit: Joi.number()
      .integer()
      .min(1)
      .max(100)
      .default(20)
      .messages({
        'number.base': 'حد النتائج يجب أن يكون رقماً',
        'number.integer': 'حد النتائج يجب أن يكون رقماً صحيحاً',
        'number.min': 'حد النتائج يجب أن يكون 1 على الأقل',
        'number.max': 'حد النتائج لا يمكن أن يتجاوز 100'
      }),
      
    status: Joi.string()
      .valid('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed')
      .optional()
      .messages({
        'any.only': 'حالة المعاملة غير صالحة'
      }),
      
    type: Joi.string()
      .valid('buying', 'selling', 'all')
      .default('all')
      .messages({
        'any.only': 'نوع المعاملة غير صالح'
      }),
      
    startDate: Joi.date()
      .optional()
      .messages({
        'date.base': 'تاريخ البداية غير صالح'
      }),
      
    endDate: Joi.date()
      .greater(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'تاريخ النهاية غير صالح',
        'date.greater': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
      }),
      
    minAmount: Joi.number()
      .min(0)
      .precision(2)
      .optional()
      .messages({
        'number.base': 'الحد الأدنى للمبلغ يجب أن يكون رقماً',
        'number.min': 'الحد الأدنى للمبلغ لا يمكن أن يكون سالباً',
        'number.precision': 'الحد الأدنى للمبلغ يجب أن يحتوي على منزلتين عشريتين كحد أقصى'
      }),
      
    maxAmount: Joi.number()
      .greater(Joi.ref('minAmount'))
      .precision(2)
      .optional()
      .messages({
        'number.base': 'الحد الأقصى للمبلغ يجب أن يكون رقماً',
        'number.greater': 'الحد الأقصى للمبلغ يجب أن يكون أكبر من الحد الأدنى',
        'number.precision': 'الحد الأقصى للمبلغ يجب أن يحتوي على منزلتين عشريتين كحد أقصى'
      }),
      
    search: Joi.string()
      .trim()
      .max(100)
      .optional()
      .messages({
        'string.max': 'نص البحث طويل جداً'
      }),
      
    sortBy: Joi.string()
      .valid('createdAt', 'updatedAt', 'totalAmount', 'status', 'transactionNumber')
      .default('createdAt')
      .messages({
        'any.only': 'معيار الترتيب غير صالح'
      }),
      
    sortOrder: Joi.string()
      .valid('asc', 'desc')
      .default('desc')
      .messages({
        'any.only': 'اتجاه الترتيب غير صالح'
      })
  })
};

// Update transaction status validation schema
export const updateTransactionStatusSchema = {
  body: Joi.object({
    status: Joi.string()
      .valid('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed')
      .required()
      .messages({
        'string.empty': 'يجب تحديد حالة المعاملة',
        'any.required': 'يجب تحديد حالة المعاملة',
        'any.only': 'حالة المعاملة غير صالحة'
      }),
      
    reason: Joi.string()
      .trim()
      .max(200)
      .optional()
      .messages({
        'string.max': 'سبب التحديث طويل جداً'
      }),
      
    notes: Joi.string()
      .trim()
      .max(1000)
      .allow('')
      .optional()
      .messages({
        'string.max': 'الملاحظات طويلة جداً'
      }),
      
    trackingInfo: Joi.object({
      provider: Joi.string().trim().max(50).optional(),
      trackingNumber: Joi.string().trim().max(100).optional(),
      trackingUrl: Joi.string().uri().optional().messages({
        'string.uri': 'رابط التتبع غير صالح'
      }),
      estimatedDelivery: Joi.date().greater('now').optional().messages({
        'date.greater': 'تاريخ التسليم المتوقع يجب أن يكون في المستقبل'
      })
    }).optional()
  }),
  params: transactionIdSchema.params
};

// Update tracking info validation schema
export const updateTrackingInfoSchema = {
  body: Joi.object({
    provider: Joi.string()
      .trim()
      .min(2)
      .max(50)
      .required()
      .messages({
        'string.empty': 'يجب تحديد مزود الشحن',
        'string.min': 'اسم مزود الشحن قصير جداً',
        'string.max': 'اسم مزود الشحن طويل جداً',
        'any.required': 'يجب تحديد مزود الشحن'
      }),
      
    trackingNumber: Joi.string()
      .trim()
      .min(3)
      .max(100)
      .required()
      .messages({
        'string.empty': 'يجب تحديد رقم التتبع',
        'string.min': 'رقم التتبع قصير جداً',
        'string.max': 'رقم التتبع طويل جداً',
        'any.required': 'يجب تحديد رقم التتبع'
      }),
      
    trackingUrl: Joi.string()
      .uri()
      .optional()
      .messages({
        'string.uri': 'رابط التتبع غير صالح'
      }),
      
    estimatedDelivery: Joi.date()
      .greater('now')
      .optional()
      .messages({
        'date.base': 'تاريخ التسليم المتوقع غير صالح',
        'date.greater': 'تاريخ التسليم المتوقع يجب أن يكون في المستقبل'
      }),
      
    status: Joi.string()
      .valid('pending', 'shipped', 'in_transit', 'delivered', 'returned')
      .default('shipped')
      .messages({
        'any.only': 'حالة الشحن غير صالحة'
      })
  }),
  params: transactionIdSchema.params
};

// Refund request validation schema
export const refundRequestSchema = {
  body: Joi.object({
    amount: Joi.number()
      .min(0.01)
      .precision(2)
      .optional()
      .messages({
        'number.base': 'مبلغ الاسترداد يجب أن يكون رقماً',
        'number.min': 'مبلغ الاسترداد يجب أن يكون أكبر من صفر',
        'number.precision': 'مبلغ الاسترداد يجب أن يحتوي على منزلتين عشريتين كحد أقصى'
      }),
      
    reason: Joi.string()
      .trim()
      .min(10)
      .max(500)
      .required()
      .messages({
        'string.empty': 'يجب تحديد سبب الاسترداد',
        'string.min': 'سبب الاسترداد قصير جداً',
        'string.max': 'سبب الاسترداد طويل جداً',
        'any.required': 'يجب تحديد سبب الاسترداد'
      }),
      
    type: Joi.string()
      .valid('full', 'partial')
      .default('full')
      .messages({
        'any.only': 'نوع الاسترداد غير صالح'
      })
  }),
  params: transactionIdSchema.params
};

// Dispute creation validation schema
export const createDisputeSchema = {
  body: Joi.object({
    reason: Joi.string()
      .valid('not_received', 'not_as_described', 'damaged', 'unauthorized', 'other')
      .required()
      .messages({
        'string.empty': 'يجب تحديد سبب النزاع',
        'any.required': 'يجب تحديد سبب النزاع',
        'any.only': 'سبب النزاع غير صالح'
      }),
      
    description: Joi.string()
      .trim()
      .min(20)
      .max(1000)
      .required()
      .messages({
        'string.empty': 'يجب تحديد وصف النزاع',
        'string.min': 'وصف النزاع قصير جداً',
        'string.max': 'وصف النزاع طويل جداً',
        'any.required': 'يجب تحديد وصف النزاع'
      }),
      
    evidence: Joi.array()
      .items(Joi.string().uri())
      .max(10)
      .optional()
      .messages({
        'array.base': 'الأدلة يجب أن تكون مصفوفة من الروابط',
        'array.max': 'لا يمكن إرفاق أكثر من 10 أدلة',
        'string.uri': 'رابط الدليل غير صالح'
      })
  }),
  params: transactionIdSchema.params
};

// Transaction statistics query validation schema
export const transactionStatsQuerySchema = {
  query: Joi.object({
    period: Joi.string()
      .valid('day', 'week', 'month', 'quarter', 'year', 'all')
      .default('month')
      .messages({
        'any.only': 'فترة الإحصائيات غير صالحة'
      }),
      
    startDate: Joi.date()
      .optional()
      .messages({
        'date.base': 'تاريخ البداية غير صالح'
      }),
      
    endDate: Joi.date()
      .greater(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'تاريخ النهاية غير صالح',
        'date.greater': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
      }),
      
    groupBy: Joi.string()
      .valid('status', 'method', 'currency', 'date')
      .default('status')
      .messages({
        'any.only': 'معيار التجميع غير صالح'
      }),
      
    includeRefunds: Joi.boolean()
      .default(true),
      
    includeDisputes: Joi.boolean()
      .default(true)
  })
};

// Bulk operations validation schema
export const bulkUpdateTransactionsSchema = {
  body: Joi.object({
    transactionIds: Joi.array()
      .items(Joi.string().pattern(objectIdPattern))
      .min(1)
      .max(50)
      .required()
      .messages({
        'array.base': 'معرفات المعاملات يجب أن تكون مصفوفة',
        'array.min': 'يجب تحديد معاملة واحدة على الأقل',
        'array.max': 'لا يمكن تحديث أكثر من 50 معاملة في المرة الواحدة',
        'any.required': 'يجب تحديد معرفات المعاملات',
        'string.pattern.base': 'معرف المعاملة غير صالح'
      }),
      
    action: Joi.string()
      .valid('cancel', 'confirm', 'ship', 'complete')
      .required()
      .messages({
        'string.empty': 'يجب تحديد الإجراء',
        'any.required': 'يجب تحديد الإجراء',
        'any.only': 'الإجراء غير صالح'
      }),
      
    reason: Joi.string()
      .trim()
      .max(200)
      .optional()
      .messages({
        'string.max': 'سبب الإجراء طويل جداً'
      }),
      
    notes: Joi.string()
      .trim()
      .max(1000)
      .allow('')
      .optional()
      .messages({
        'string.max': 'الملاحظات طويلة جداً'
      })
  })
};

// Export transaction data validation schema
export const exportTransactionsSchema = {
  query: Joi.object({
    format: Joi.string()
      .valid('csv', 'excel', 'pdf')
      .default('csv')
      .messages({
        'any.only': 'تنسيق التصدير غير صالح'
      }),
      
    startDate: Joi.date()
      .optional()
      .messages({
        'date.base': 'تاريخ البداية غير صالح'
      }),
      
    endDate: Joi.date()
      .greater(Joi.ref('startDate'))
      .optional()
      .messages({
        'date.base': 'تاريخ النهاية غير صالح',
        'date.greater': 'تاريخ النهاية يجب أن يكون بعد تاريخ البداية'
      }),
      
    status: Joi.array()
      .items(Joi.string().valid('pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed'))
      .optional()
      .messages({
        'array.base': 'حالات المعاملات يجب أن تكون مصفوفة',
        'any.only': 'حالة المعاملة غير صالحة'
      }),
      
    includeItems: Joi.boolean()
      .default(true),
      
    includeShipping: Joi.boolean()
      .default(true),
      
    includePayment: Joi.boolean()
      .default(false)
  })
};

// Installment payment validation schema
export const installmentPaymentSchema = {
  body: Joi.object({
    installmentNumber: Joi.number()
      .integer()
      .min(1)
      .required()
      .messages({
        'number.base': 'رقم القسط يجب أن يكون رقماً',
        'number.integer': 'رقم القسط يجب أن يكون رقماً صحيحاً',
        'number.min': 'رقم القسط يجب أن يكون 1 على الأقل',
        'any.required': 'يجب تحديد رقم القسط'
      }),
      
    amount: Joi.number()
      .min(0.01)
      .precision(2)
      .optional()
      .messages({
        'number.base': 'مبلغ القسط يجب أن يكون رقماً',
        'number.min': 'مبلغ القسط يجب أن يكون أكبر من صفر',
        'number.precision': 'مبلغ القسط يجب أن يحتوي على منزلتين عشريتين كحد أقصى'
      }),
      
    paymentMethod: Joi.string()
      .valid('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'mada', 'stc_pay', 'other')
      .required()
      .messages({
        'string.empty': 'يجب تحديد طريقة الدفع',
        'any.required': 'يجب تحديد طريقة الدفع',
        'any.only': 'طريقة الدفع غير صالحة'
      }),
      
    paymentId: Joi.string()
      .trim()
      .max(100)
      .optional()
      .messages({
        'string.max': 'معرف الدفع طويل جداً'
      })
  }),
  params: transactionIdSchema.params
};
