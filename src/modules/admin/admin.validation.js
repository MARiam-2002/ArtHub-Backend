import joi from 'joi';

export const getUsersSchema = joi.object({
  page: joi.number().integer().min(1).optional(),
  limit: joi.number().integer().min(1).optional(),
  sort: joi.string().optional(),
  fields: joi.string().optional(),
  search: joi.string().optional(),
  role: joi.string().valid('user', 'artist').optional(),
  status: joi.string().valid('active', 'inactive', 'banned').optional(),
}); 