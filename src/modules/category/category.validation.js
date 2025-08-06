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
  'string.uri': '{#label} يجب أن يكون رابطًا صالحًا.',
  'number.base': '{#label} يجب أن يكون رقمًا.',
  'number.integer': '{#label} يجب أن يكون رقمًا صحيحًا.',
  'number.min': '{#label} يجب أن يكون على الأقل {#limit}.',
  'number.max': '{#label} يجب ألا يزيد عن {#limit}.',
  'any.only': '{#label} يجب أن يكون إحدى القيم التالية: {#valids}.'
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
 *           description: "اسم التصنيف يجب أن يكون فريدًا"
 *         description:
 *           type: string
 *           maxLength: 200
 *           example: "لوحات مرسومة بالألوان الزيتية"
 *           description: "وصف اختياري للتصنيف"
 *         image:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               example: "https://res.cloudinary.com/demo/image/upload/v1612345678/category.jpg"
 *               description: "رابط صورة التصنيف"
 *             id:
 *               type: string
 *               example: "demo/category_id"
 *               description: "معرف الصورة في Cloudinary"
 *           description: "صورة اختيارية للتصنيف"
 */
export const createCategorySchema = joi
  .object({
    name: joi
      .string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .label('اسم التصنيف')
      .messages(defaultMessages),
    description: joi
      .string()
      .max(200)
      .trim()
      .optional()
      .allow('')
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
 *           description: "اسم التصنيف الجديد (يجب أن يكون فريدًا)"
 *         description:
 *           type: string
 *           maxLength: 200
 *           example: "وصف محدث للتصنيف"
 *           description: "وصف التصنيف الجديد"
 *         image:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *               example: "https://res.cloudinary.com/demo/image/upload/v1612345678/updated.jpg"
 *               description: "رابط الصورة الجديدة"
 *             id:
 *               type: string
 *               example: "demo/updated_id"
 *               description: "معرف الصورة الجديدة في Cloudinary"
 *           description: "صورة التصنيف الجديدة"
 *       description: "يجب توفير حقل واحد على الأقل للتحديث"
 */
export const updateCategorySchema = joi
  .object({
    name: joi
      .string()
      .min(2)
      .max(50)
      .trim()
      .optional()
      .label('اسم التصنيف')
      .messages(defaultMessages),
    description: joi
      .string()
      .max(200)
      .trim()
      .optional()
      .allow('')
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
  .required()
  .messages({
    'object.min': 'يجب توفير حقل واحد على الأقل للتحديث'
  });

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
 *           description: "معرف التصنيف في قاعدة البيانات"
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
 *           description: "رقم الصفحة المطلوبة"
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *           description: "عدد التصنيفات في الصفحة الواحدة"
 *         search:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *           example: "لوحات"
 *           description: "نص البحث في اسم أو وصف التصنيف"
 *         includeStats:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *           example: "true"
 *           description: "تضمين عدد الأعمال الفنية لكل تصنيف"
 */
export const getCategoriesQuerySchema = joi
  .object({
    page: joi
      .string()
      .pattern(/^\d+$/)
      .optional()
      .default('1')
      .label('رقم الصفحة')
      .messages(defaultMessages),
    limit: joi
      .string()
      .pattern(/^\d+$/)
      .optional()
      .default('10')
      .label('عدد العناصر')
      .messages(defaultMessages),
    search: joi
      .string()
      .min(1)
      .max(50)
      .trim()
      .optional()
      .label('نص البحث')
      .messages(defaultMessages),
    includeStats: joi
      .string()
      .valid('true', 'false')
      .optional()
      .default('false')
      .label('تضمين الإحصائيات')
      .messages(defaultMessages)
  })
  .optional();

/**
 * Get single category query validation schema
 * @swagger
 * components:
 *   schemas:
 *     GetCategoryQuery:
 *       type: object
 *       properties:
 *         includeStats:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *           example: "true"
 *           description: "تضمين إحصائيات وأعمال فنية حديثة"
 */
export const getCategoryQuerySchema = joi
  .object({
    includeStats: joi
      .string()
      .valid('true', 'false')
      .optional()
      .default('false')
      .label('تضمين الإحصائيات')
      .messages(defaultMessages)
  })
  .optional();

/**
 * Popular categories query validation schema
 * @swagger
 * components:
 *   schemas:
 *     PopularCategoriesQuery:
 *       type: object
 *       properties:
 *         limit:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 8
 *           example: 8
 *           description: "عدد التصنيفات الشائعة المطلوب جلبها"
 */
export const popularCategoriesQuerySchema = joi
  .object({
    limit: joi
      .number()
      .integer()
      .min(1)
      .max(20)
      .optional()
      .default(8)
      .label('عدد التصنيفات')
      .messages(defaultMessages)
  })
  .optional();

/**
 * Validators object for easy import
 */
export const Validators = {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  getCategoriesQuerySchema,
  getCategoryQuerySchema,
  popularCategoriesQuerySchema
}; 