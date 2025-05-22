import Joi from 'joi';

export const addReviewSchema = {
  body: Joi.object({
    artwork: Joi.string().required().messages({
      'string.empty': 'معرف العمل الفني مطلوب',
      'any.required': 'معرف العمل الفني مطلوب'
    }),
    rating: Joi.number().min(1).max(5).required().messages({
      'number.base': 'يجب أن يكون التقييم رقماً',
      'number.min': 'يجب أن يكون التقييم 1 على الأقل',
      'number.max': 'يجب أن يكون التقييم 5 على الأكثر',
      'any.required': 'التقييم مطلوب'
    }),
    comment: Joi.string().allow('').optional().max(500).messages({
      'string.max': 'يجب ألا يتجاوز التعليق 500 حرف'
    })
  })
};

export const updateReviewSchema = {
  body: Joi.object({
    artwork: Joi.string().required().messages({
      'string.empty': 'معرف العمل الفني مطلوب',
      'any.required': 'معرف العمل الفني مطلوب'
    }),
    rating: Joi.number().min(1).max(5).required().messages({
      'number.base': 'يجب أن يكون التقييم رقماً',
      'number.min': 'يجب أن يكون التقييم 1 على الأقل',
      'number.max': 'يجب أن يكون التقييم 5 على الأكثر',
      'any.required': 'التقييم مطلوب'
    }),
    comment: Joi.string().allow('').optional().max(500).messages({
      'string.max': 'يجب ألا يتجاوز التعليق 500 حرف'
    })
  })
};

export const addArtistReviewSchema = {
  body: Joi.object({
    artist: Joi.string().required().messages({
      'string.empty': 'معرف الفنان مطلوب',
      'any.required': 'معرف الفنان مطلوب'
    }),
    rating: Joi.number().min(1).max(5).required().messages({
      'number.base': 'يجب أن يكون التقييم رقماً',
      'number.min': 'يجب أن يكون التقييم 1 على الأقل',
      'number.max': 'يجب أن يكون التقييم 5 على الأكثر',
      'any.required': 'التقييم مطلوب'
    }),
    comment: Joi.string().allow('').optional().max(500).messages({
      'string.max': 'يجب ألا يتجاوز التعليق 500 حرف'
    })
  })
}; 