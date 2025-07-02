import { Router } from 'express';
import * as controller from './category.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import { Validators } from './category.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d0fe4f5311236168a109ca"
 *         name:
 *           type: string
 *           example: "لوحات زيتية"
 *         description:
 *           type: string
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
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:45.123Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:45.123Z"
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "تم جلب التصنيفات بنجاح"
 *         data:
 *           oneOf:
 *             - $ref: '#/components/schemas/Category'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 *         pagination:
 *           type: object
 *           properties:
 *             page:
 *               type: integer
 *               example: 1
 *             limit:
 *               type: integer
 *               example: 10
 *             totalPages:
 *               type: integer
 *               example: 5
 *             totalItems:
 *               type: integer
 *               example: 50
 *             hasNextPage:
 *               type: boolean
 *               example: true
 *             hasPrevPage:
 *               type: boolean
 *               example: false
 */

/**
 * @swagger
 * /api/categories:
 *   post:
 *     summary: إنشاء تصنيف جديد
 *     tags: [Categories]
 *     description: |
 *       إنشاء تصنيف جديد للأعمال الفنية.
 *       يتطلب صلاحيات المدير أو المشرف.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryRequest'
 *     responses:
 *       201:
 *         description: تم إنشاء التصنيف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: AdminPanel
 */
router.post(
  '/',
  isAuthenticated,
  isValidation(Validators.createCategorySchema),
  controller.createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   put:
 *     summary: تحديث تصنيف موجود
 *     tags: [Categories]
 *     description: |
 *       تحديث بيانات تصنيف موجود.
 *       يتطلب صلاحيات المدير أو المشرف.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: معرف التصنيف
 *         example: "60d0fe4f5311236168a109ca"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryRequest'
 *     responses:
 *       200:
 *         description: تم تحديث التصنيف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: التصنيف غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "التصنيف غير موجود"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: AdminPanel
 */
router.put(
  '/:id',
  isAuthenticated,
  isValidation(Validators.categoryIdSchema, 'params'),
  isValidation(Validators.updateCategorySchema),
  controller.updateCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   delete:
 *     summary: حذف تصنيف
 *     tags: [Categories]
 *     description: |
 *       حذف تصنيف موجود.
 *       يتطلب صلاحيات المدير أو المشرف.
 *       تحذير: حذف التصنيف قد يؤثر على الأعمال الفنية المرتبطة به.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: معرف التصنيف
 *         example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: تم حذف التصنيف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم حذف التصنيف بنجاح"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: التصنيف غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "التصنيف غير موجود"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: AdminPanel
 */
router.delete(
  '/:id',
  isAuthenticated,
  isValidation(Validators.categoryIdSchema, 'params'),
  controller.deleteCategory
);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: جلب جميع التصنيفات
 *     tags: [Categories]
 *     description: |
 *       جلب قائمة بجميع التصنيفات المتاحة مع إمكانية البحث والتصفح.
 *       هذا الـ endpoint متاح للجميع بدون مصادقة.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: البحث في أسماء التصنيفات
 *         example: "لوحات"
 *     responses:
 *       200:
 *         description: تم جلب التصنيفات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: HomeScreen, CategoriesScreen, SearchScreen
 */
router.get(
  '/',
  isValidation(Validators.getCategoriesQuerySchema, 'query'),
  controller.getCategories
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: جلب تصنيف محدد
 *     tags: [Categories]
 *     description: |
 *       جلب تفاصيل تصنيف محدد باستخدام معرفه.
 *       هذا الـ endpoint متاح للجميع بدون مصادقة.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: معرف التصنيف
 *         example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: تم جلب التصنيف بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         description: التصنيف غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "التصنيف غير موجود"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: CategoryDetailsScreen, ArtworkListScreen
 */
router.get(
  '/:id',
  isValidation(Validators.categoryIdSchema, 'params'),
  controller.getCategory
);

export default router;
