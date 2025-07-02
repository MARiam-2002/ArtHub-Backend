import joi from 'joi';

/**
 * Default validation error messages in Arabic
 */
const defaultMessages = {
  'string.base': '{#label} يجب أن يكون نصًا.',
  'string.empty': '{#label} مطلوب ولا يمكن أن يكون فارغًا.',
  'string.min': '{#label} يجب أن يكون على الأقل {#limit} أحرف.',
  'string.max': '{#label} يجب ألا يزيد عن {#limit} أحرف.',
  'string.pattern.base': '{#label} يحتوي على تنسيق غير صالح.',
  'any.required': '{#label} مطلوب.',
  'string.uri': '{#label} يجب أن يكون رابطًا صالحًا.'
};

/**
 * MongoDB ObjectId pattern
 */
const objectIdPattern = /^[0-9a-fA-F]{24}$/;

/**
 * Create category validation schema
 * @swagger
 * components:
 *   schemas:
 *     CreateCategoryRequest:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: "لوحات زيتية"
 *         description:
 *           type: string
 *           maxLength: 200
 *           example: "لوحات مرسومة بالألوان الزيتية"
 *         image:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               example: "https://res.cloudinary.com/demo/image/upload/v1612345678/category.jpg"
 *             id:
 *               type: string
 *               example: "demo/category_id"
 */
export const createCategorySchema = joi
  .object({
    name: joi
      .string()
      .min(2)
      .max(50)
      .required()
      .label('اسم التصنيف')
      .messages(defaultMessages),
    description: joi
      .string()
      .max(200)
      .optional()
      .label('وصف التصنيف')
      .messages(defaultMessages),
    image: joi
      .object({
        url: joi
          .string()
          .uri()
          .required()
          .label('رابط الصورة')
          .messages(defaultMessages),
        id: joi
          .string()
          .required()
          .label('معرف الصورة')
          .messages(defaultMessages)
      })
      .optional()
      .label('صورة التصنيف')
  })
  .required();

/**
 * Update category validation schema
 * @swagger
 * components:
 *   schemas:
 *     UpdateCategoryRequest:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: "لوحات زيتية محدثة"
 *         description:
 *           type: string
 *           maxLength: 200
 *           example: "وصف محدث للتصنيف"
 *         image:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               example: "https://res.cloudinary.com/demo/image/upload/v1612345678/updated.jpg"
 *             id:
 *               type: string
 *               example: "demo/updated_id"
 */
export const updateCategorySchema = joi
  .object({
    name: joi
      .string()
      .min(2)
      .max(50)
      .optional()
      .label('اسم التصنيف')
      .messages(defaultMessages),
    description: joi
      .string()
      .max(200)
      .optional()
      .label('وصف التصنيف')
      .messages(defaultMessages),
    image: joi
      .object({
        url: joi
          .string()
          .uri()
          .required()
          .label('رابط الصورة')
          .messages(defaultMessages),
        id: joi
          .string()
          .required()
          .label('معرف الصورة')
          .messages(defaultMessages)
      })
      .optional()
      .label('صورة التصنيف')
  })
  .min(1) // At least one field must be provided
  .required();

/**
 * Category ID parameter validation schema
 * @swagger
 * components:
 *   schemas:
 *     CategoryIdParam:
 *       type: object
 *       required:
 *         - id
 *       properties:
 *         id:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *           example: "60d0fe4f5311236168a109ca"
 */
export const categoryIdSchema = joi
  .object({
    id: joi
      .string()
      .pattern(objectIdPattern)
      .required()
      .label('معرف التصنيف')
      .messages({
        ...defaultMessages,
        'string.pattern.base': 'معرف التصنيف غير صالح'
      })
  })
  .required();

/**
 * Get categories query validation schema
 * @swagger
 * components:
 *   schemas:
 *     GetCategoriesQuery:
 *       type: object
 *       properties:
 *         page:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *         search:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "لوحات"
 */
export const getCategoriesQuerySchema = joi
  .object({
    page: joi
      .number()
      .integer()
      .min(1)
      .default(1)
      .optional()
      .label('رقم الصفحة')
      .messages(defaultMessages),
    limit: joi
      .number()
      .integer()
      .min(1)
      .max(100)
      .default(10)
      .optional()
      .label('عدد العناصر في الصفحة')
      .messages(defaultMessages),
    search: joi
      .string()
      .min(1)
      .max(50)
      .optional()
      .label('البحث')
      .messages(defaultMessages)
  })
  .optional();

// Export all schemas for easy access
export const Validators = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  getCategoriesQuerySchema
}; 