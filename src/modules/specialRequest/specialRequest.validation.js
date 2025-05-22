import Joi from 'joi';

export const createSpecialRequestSchema = {
  body: Joi.object({
    artist: Joi.string().required().messages({
      'string.empty': 'يجب تحديد الفنان',
      'any.required': 'يجب تحديد الفنان'
    }),
    requestType: Joi.string().required().messages({
      'string.empty': 'يجب تحديد نوع الطلب',
      'any.required': 'يجب تحديد نوع الطلب'
    }),
    description: Joi.string().required().min(10).max(1000).messages({
      'string.empty': 'يجب إدخال وصف للطلب',
      'string.min': 'يجب أن يكون وصف الطلب أكثر من 10 أحرف',
      'string.max': 'يجب ألا يتجاوز وصف الطلب 1000 حرف',
      'any.required': 'يجب إدخال وصف للطلب'
    }),
    budget: Joi.number().required().min(1).messages({
      'number.base': 'يجب أن تكون الميزانية رقماً',
      'number.min': 'يجب أن تكون الميزانية قيمة موجبة',
      'any.required': 'يجب تحديد ميزانية للطلب'
    }),
    deadline: Joi.date().min('now').messages({
      'date.base': 'يجب أن يكون الموعد النهائي تاريخاً صحيحاً',
      'date.min': 'يجب أن يكون الموعد النهائي في المستقبل'
    }),
    attachments: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'يجب أن تكون المرفقات قائمة من الروابط',
      'string.uri': 'يجب أن تكون المرفقات روابط صالحة'
    })
  })
};

export const updateRequestStatusSchema = {
  body: Joi.object({
    status: Joi.string().valid('pending', 'accepted', 'rejected', 'completed').required().messages({
      'string.empty': 'يجب تحديد حالة الطلب',
      'any.required': 'يجب تحديد حالة الطلب',
      'any.only': 'حالة الطلب غير صالحة'
    }),
    response: Joi.string().max(1000).messages({
      'string.max': 'يجب ألا يتجاوز الرد 1000 حرف'
    })
  }),
  params: Joi.object({
    requestId: Joi.string().required().messages({
      'string.empty': 'يجب تحديد معرف الطلب',
      'any.required': 'يجب تحديد معرف الطلب'
    })
  })
};

export const completeRequestSchema = {
  body: Joi.object({
    deliverables: Joi.array().items(Joi.string().uri()).messages({
      'array.base': 'يجب أن تكون التسليمات قائمة من الروابط',
      'string.uri': 'يجب أن تكون التسليمات روابط صالحة'
    }),
    finalNote: Joi.string().max(1000).messages({
      'string.max': 'يجب ألا تتجاوز الملاحظة النهائية 1000 حرف'
    })
  }),
  params: Joi.object({
    requestId: Joi.string().required().messages({
      'string.empty': 'يجب تحديد معرف الطلب',
      'any.required': 'يجب تحديد معرف الطلب'
    })
  })
};

export const responseRequestSchema = {
  body: Joi.object({
    response: Joi.string().required().min(1).max(1000).messages({
      'string.empty': 'يجب إدخال رد',
      'string.min': 'يجب أن يكون الرد أكثر من حرف واحد',
      'string.max': 'يجب ألا يتجاوز الرد 1000 حرف',
      'any.required': 'يجب إدخال رد'
    })
  }),
  params: Joi.object({
    requestId: Joi.string().required().messages({
      'string.empty': 'يجب تحديد معرف الطلب',
      'any.required': 'يجب تحديد معرف الطلب'
    })
  })
};

export const cancelSpecialRequestSchema = {
  params: Joi.object({
    requestId: Joi.string().required().min(24).max(24).messages({
      'string.empty': 'معرف الطلب مطلوب',
      'string.min': 'معرف الطلب غير صالح',
      'string.max': 'معرف الطلب غير صالح',
    }),
  }),
  body: Joi.object({
    cancellationReason: Joi.string().messages({
      'string.empty': 'يرجى إدخال سبب الإلغاء',
    }),
  }),
}; 