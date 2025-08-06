import { Router } from 'express';
import * as controller from './category.controller.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
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
 *         artworkCount:
 *           type: integer
 *           example: 25
 *         recentArtworks:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               title:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: object
 *               price:
 *                 type: number
 *               artist:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                   avatar:
 *                     type: object
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:45.123Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:45.123Z"
 *     
 *     CategoryStats:
 *       type: object
 *       properties:
 *         totalCategories:
 *           type: integer
 *           example: 15
 *         emptyCategoriesCount:
 *           type: integer
 *           example: 3
 *         recentCategoriesCount:
 *           type: integer
 *           example: 5
 *         averageArtworksPerCategory:
 *           type: integer
 *           example: 12
 *         mostPopularCategories:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               name:
 *                 type: string
 *               artworkCount:
 *                 type: integer
 *
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
 *             - type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *             - $ref: '#/components/schemas/CategoryStats'
 *             - type: array
 *               items:
 *                 $ref: '#/components/schemas/Category'
 */

/**
 * @swagger
 * /api/categories/popular:
 *   get:
 *     summary: جلب التصنيفات الشائعة
 *     tags: [Categories]
 *     description: |
 *       جلب التصنيفات الأكثر شعبية مع عدد الأعمال الفنية.
 *       مخصص للشاشة الرئيسية في التطبيق المحمول.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 8
 *         description: عدد التصنيفات المطلوب جلبها
 *         example: 8
 *     responses:
 *       200:
 *         description: تم جلب التصنيفات الشائعة بنجاح
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
 *                   example: "تم جلب التصنيفات الشائعة بنجاح"
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Category'
 *                       - type: object
 *                         properties:
 *                           artworkCount:
 *                             type: integer
 *                             example: 25
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: HomeScreen
 */
router.get(
  '/popular',
  isValidation({ query: Validators.popularCategoriesQuerySchema }),
  controller.getPopularCategories
);

/**
 * @swagger
 * /api/categories/stats:
 *   get:
 *     summary: جلب إحصائيات التصنيفات
 *     tags: [Categories]
 *     description: |
 *       جلب إحصائيات شاملة عن التصنيفات مثل العدد الإجمالي،
 *       التصنيفات الأكثر شعبية، والتصنيفات الحديثة.
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات التصنيفات بنجاح
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
 *                   example: "تم جلب إحصائيات التصنيفات بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/CategoryStats'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: AdminPanel
 */
router.get('/stats', controller.getCategoryStats);

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: جلب جميع التصنيفات
 *     tags: [Categories]
 *     description: |
 *       جلب قائمة مقسمة من التصنيفات مع إمكانية البحث.
 *       يمكن تضمين إحصائيات الأعمال الفنية لكل تصنيف.
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
 *         description: عدد التصنيفات في الصفحة
 *         example: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 50
 *         description: نص البحث في اسم أو وصف التصنيف
 *         example: "لوحات"
 *       - in: query
 *         name: includeStats
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: تضمين عدد الأعمال الفنية لكل تصنيف
 *         example: "true"
 *     responses:
 *       200:
 *         description: تم جلب التصنيفات بنجاح
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
 *                   example: "تم جلب التصنيفات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: CategoriesScreen
 */
router.get(
  '/',
  isValidation({ query: Validators.getCategoriesQuerySchema }),
  controller.getCategories
);

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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم إنشاء التصنيف بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       409:
 *         description: يوجد تصنيف بنفس هذا الاسم بالفعل
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
 *                   example: "يوجد تصنيف بنفس هذا الاسم بالفعل"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: AdminPanel
 */
router.post(
  '/',
  isAuthenticated,
  isValidation({ body: Validators.createCategorySchema }),
  controller.createCategory
);

/**
 * @swagger
 * /api/categories/{id}:
 *   get:
 *     summary: جلب تصنيف واحد
 *     tags: [Categories]
 *     description: |
 *       جلب تفاصيل تصنيف واحد بمعرفه.
 *       يمكن تضمين إحصائيات وأعمال فنية حديثة.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: معرف التصنيف
 *         example: "60d0fe4f5311236168a109ca"
 *       - in: query
 *         name: includeStats
 *         schema:
 *           type: string
 *           enum: ['true', 'false']
 *           default: 'false'
 *         description: تضمين عدد الأعمال الفنية والأعمال الحديثة
 *         example: "true"
 *     responses:
 *       200:
 *         description: تم جلب التصنيف بنجاح
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
 *                   example: "تم جلب التصنيف بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
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
 *     x-screen: CategoryDetailsScreen
 */
router.get(
  '/:id',
  isValidation({ 
    params: Validators.categoryIdSchema,
    query: Validators.getCategoryQuerySchema 
  }),
  controller.getCategory
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم تحديث التصنيف بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Category'
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
 *       409:
 *         description: يوجد تصنيف بنفس هذا الاسم بالفعل
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
 *                   example: "يوجد تصنيف بنفس هذا الاسم بالفعل"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: AdminPanel
 */
router.put(
  '/:id',
  isAuthenticated,
  isValidation({ 
    params: Validators.categoryIdSchema,
    body: Validators.updateCategorySchema 
  }),
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
 *       تحذير: لا يمكن حذف التصنيف إذا كان مرتبطاً بأعمال فنية.
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
 *                 data:
 *                   type: null
 *                   example: null
 *       400:
 *         description: لا يمكن حذف التصنيف لأنه مرتبط بأعمال فنية
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
 *                   example: "لا يمكن حذف التصنيف لأنه مرتبط بـ 5 عمل فني"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworksCount:
 *                       type: integer
 *                       example: 5
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
  isValidation({ params: Validators.categoryIdSchema }),
  controller.deleteCategory
);

export default router;
