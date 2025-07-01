import Joi from 'joi';

export const createArtworkTransactionSchema = {
  body: Joi.object({
    artworkId: Joi.string().required().messages({
      'string.empty': 'يجب تحديد معرف العمل الفني',
      'any.required': 'يجب تحديد معرف العمل الفني'
    }),
    paymentMethod: Joi.string()
      .valid('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'other')
      .required()
      .messages({
        'string.empty': 'يجب تحديد طريقة الدفع',
        'any.required': 'يجب تحديد طريقة الدفع',
        'any.only': 'طريقة الدفع غير صالحة'
      }),
    paymentId: Joi.string().allow('').optional().messages({
      'string.empty': 'رقم الدفع غير صحيح'
    }),
    shippingAddress: Joi.object({
      fullName: Joi.string().required().messages({
        'string.empty': 'يجب تحديد الاسم الكامل',
        'any.required': 'يجب تحديد الاسم الكامل'
      }),
      addressLine1: Joi.string().required().messages({
        'string.empty': 'يجب تحديد العنوان',
        'any.required': 'يجب تحديد العنوان'
      }),
      addressLine2: Joi.string().allow('').optional(),
      city: Joi.string().required().messages({
        'string.empty': 'يجب تحديد المدينة',
        'any.required': 'يجب تحديد المدينة'
      }),
      state: Joi.string().allow('').optional(),
      postalCode: Joi.string().allow('').optional(),
      country: Joi.string().required().messages({
        'string.empty': 'يجب تحديد الدولة',
        'any.required': 'يجب تحديد الدولة'
      }),
      phoneNumber: Joi.string().required().messages({
        'string.empty': 'يجب تحديد رقم الهاتف',
        'any.required': 'يجب تحديد رقم الهاتف'
      })
    })
      .required()
      .messages({
        'object.base': 'يجب توفير بيانات الشحن',
        'any.required': 'يجب توفير بيانات الشحن'
      })
  })
};

export const createSpecialRequestTransactionSchema = {
  body: Joi.object({
    specialRequestId: Joi.string().required().messages({
      'string.empty': 'يجب تحديد معرف الطلب الخاص',
      'any.required': 'يجب تحديد معرف الطلب الخاص'
    }),
    paymentMethod: Joi.string()
      .valid('credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'other')
      .required()
      .messages({
        'string.empty': 'يجب تحديد طريقة الدفع',
        'any.required': 'يجب تحديد طريقة الدفع',
        'any.only': 'طريقة الدفع غير صالحة'
      }),
    paymentId: Joi.string().allow('').optional().messages({
      'string.empty': 'رقم الدفع غير صحيح'
    }),
    shippingAddress: Joi.object({
      fullName: Joi.string().required().messages({
        'string.empty': 'يجب تحديد الاسم الكامل',
        'any.required': 'يجب تحديد الاسم الكامل'
      }),
      addressLine1: Joi.string().required().messages({
        'string.empty': 'يجب تحديد العنوان',
        'any.required': 'يجب تحديد العنوان'
      }),
      addressLine2: Joi.string().allow('').optional(),
      city: Joi.string().required().messages({
        'string.empty': 'يجب تحديد المدينة',
        'any.required': 'يجب تحديد المدينة'
      }),
      state: Joi.string().allow('').optional(),
      postalCode: Joi.string().allow('').optional(),
      country: Joi.string().required().messages({
        'string.empty': 'يجب تحديد الدولة',
        'any.required': 'يجب تحديد الدولة'
      }),
      phoneNumber: Joi.string().required().messages({
        'string.empty': 'يجب تحديد رقم الهاتف',
        'any.required': 'يجب تحديد رقم الهاتف'
      })
    })
      .required()
      .messages({
        'object.base': 'يجب توفير بيانات الشحن',
        'any.required': 'يجب توفير بيانات الشحن'
      })
  })
};

export const updateTransactionStatusSchema = {
  body: Joi.object({
    status: Joi.string().valid('pending', 'completed', 'failed', 'refunded').required().messages({
      'string.empty': 'يجب تحديد حالة المعاملة',
      'any.required': 'يجب تحديد حالة المعاملة',
      'any.only': 'حالة المعاملة غير صالحة'
    }),
    notes: Joi.string().max(500).allow('').optional().messages({
      'string.max': 'يجب ألا تتجاوز الملاحظات 500 حرف'
    }),
    trackingInfo: Joi.object({
      provider: Joi.string().allow('').optional(),
      trackingNumber: Joi.string().allow('').optional(),
      trackingUrl: Joi.string().uri().allow('').optional().messages({
        'string.uri': 'يجب أن يكون رابط التتبع صالحًا'
      }),
      estimatedDelivery: Joi.date().greater('now').allow(null).optional().messages({
        'date.greater': 'يجب أن يكون تاريخ التسليم المتوقع في المستقبل'
      })
    }).optional()
  }),
  params: Joi.object({
    transactionId: Joi.string().required().messages({
      'string.empty': 'يجب تحديد معرف المعاملة',
      'any.required': 'يجب تحديد معرف المعاملة'
    })
  })
};

export const updateTrackingInfoSchema = {
  body: Joi.object({
    provider: Joi.string().required().messages({
      'string.empty': 'يجب تحديد مزود الشحن',
      'any.required': 'يجب تحديد مزود الشحن'
    }),
    trackingNumber: Joi.string().required().messages({
      'string.empty': 'يجب تحديد رقم التتبع',
      'any.required': 'يجب تحديد رقم التتبع'
    }),
    trackingUrl: Joi.string().uri().allow('').optional().messages({
      'string.uri': 'يجب أن يكون رابط التتبع صالحًا'
    }),
    estimatedDelivery: Joi.date().greater('now').allow(null).optional().messages({
      'date.greater': 'يجب أن يكون تاريخ التسليم المتوقع في المستقبل'
    })
  }),
  params: Joi.object({
    transactionId: Joi.string().required().messages({
      'string.empty': 'يجب تحديد معرف المعاملة',
      'any.required': 'يجب تحديد معرف المعاملة'
    })
  })
};
