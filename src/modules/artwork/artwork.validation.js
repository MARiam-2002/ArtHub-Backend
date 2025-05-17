import Joi from 'joi';

export const createArtworkSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().allow(''),
  images: Joi.array().items(Joi.string().uri()).min(1).required(),
  price: Joi.number().required(),
  status: Joi.string().valid('available', 'sold').default('available'),
  tags: Joi.array().items(Joi.string()),
  category: Joi.string().hex().length(24),
});

export const updateArtworkSchema = Joi.object({
  title: Joi.string(),
  description: Joi.string().allow(''),
  images: Joi.array().items(Joi.string().uri()),
  price: Joi.number(),
  status: Joi.string().valid('available', 'sold'),
  tags: Joi.array().items(Joi.string()),
  category: Joi.string().hex().length(24),
}); 