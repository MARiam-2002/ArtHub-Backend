import joi from 'joi';

// MongoDB ObjectId pattern
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

// General field definitions
const generalFields = {
  id: joi.string().pattern(objectIdPattern).messages({
    'string.pattern.base': 'معرف غير صالح'
  })
};

// Validation for getting user by ID
export const getUserByIdValidation = {
  params: joi.object({
    id: generalFields.id.required()
  }).required()
};

// Validation for updating user status
export const updateUserStatusValidation = {
  params: joi.object({
    id: generalFields.id.required()
  }).required(),
  body: joi.object({
    status: joi.string().valid('active', 'inactive', 'banned').required()
  }).required()
};

// Validation for getting order by ID
export const getOrderByIdValidation = {
  params: joi.object({
    id: generalFields.id.required()
  }).required()
};

// Validation for updating review status
export const updateReviewStatusValidation = {
  params: joi.object({
    id: generalFields.id.required()
  }).required(),
  body: joi.object({
    status: joi.string().valid('pending', 'approved', 'rejected').required()
  }).required()
};

// Validation for sending notifications
export const sendNotificationValidation = {
  body: joi.object({
    title: joi.string().min(3).max(100).required(),
    message: joi.string().min(10).max(500).required(),
    type: joi.string().valid('request', 'message', 'review', 'system', 'other').default('system'),
    userId: generalFields.id.when('sendToAll', {
      is: false,
      then: joi.required(),
      otherwise: joi.optional()
    }),
    sendToAll: joi.boolean().default(false)
  }).required()
};

// Validation for charts query parameters
export const getChartsValidation = {
  query: joi.object({
    period: joi.string().valid('daily', 'weekly', 'monthly', 'yearly').default('monthly')
  }).optional()
};

// Validation for users query parameters
export const getUsersValidation = {
  query: joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    role: joi.string().valid('user', 'artist', 'admin', 'superadmin').optional(),
    status: joi.string().valid('active', 'inactive', 'banned').optional(),
    search: joi.string().min(2).max(50).optional()
  }).optional()
};

// Validation for orders query parameters
export const getOrdersValidation = {
  query: joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    status: joi.string().valid('pending', 'processing', 'completed', 'cancelled', 'refunded').optional(),
    search: joi.string().min(2).max(50).optional()
  }).optional()
};

// Validation for reviews query parameters
export const getReviewsValidation = {
  query: joi.object({
    page: joi.number().integer().min(1).default(1),
    limit: joi.number().integer().min(1).max(100).default(10),
    status: joi.string().valid('pending', 'approved', 'rejected').optional(),
    rating: joi.number().integer().min(1).max(5).optional()
  }).optional()
};

// Validation for top artists query parameters
export const getTopArtistsValidation = {
  query: joi.object({
    limit: joi.number().integer().min(1).max(50).default(10)
  }).optional()
};

// Validation for recent activities query parameters
export const getRecentActivitiesValidation = {
  query: joi.object({
    limit: joi.number().integer().min(1).max(50).default(20)
  }).optional()
}; 