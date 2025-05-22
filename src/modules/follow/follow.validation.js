import Joi from 'joi';

export const followArtistSchema = {
  body: Joi.object({
    artistId: Joi.string().required().messages({
      'string.empty': 'معرف الفنان مطلوب',
      'any.required': 'معرف الفنان مطلوب'
    })
  })
};

export const unfollowArtistSchema = {
  body: Joi.object({
    artistId: Joi.string().required().messages({
      'string.empty': 'معرف الفنان مطلوب',
      'any.required': 'معرف الفنان مطلوب'
    })
  })
}; 