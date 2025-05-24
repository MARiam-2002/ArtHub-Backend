import { Router } from 'express';
import * as artworkController from './controller/artwork.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import { createArtworkSchema, updateArtworkSchema } from './artwork.validation.js';
import * as reviewController from '../review/review.controller.js';
import { verifyFirebaseToken } from '../../middleware/firebase.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/artworks:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: قائمة الأعمال الفنية
 *     description: الحصول على قائمة بجميع الأعمال الفنية مع دعم الصفحات
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 12
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب الأعمال الفنية بنجاح
 */
router.get('/', artworkController.getAllArtworks);

/**
 * @swagger
 * /api/artworks/search:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: البحث المتقدم في الأعمال الفنية
 *     description: البحث في الأعمال الفنية مع دعم التصفية المتقدمة
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: نص البحث (في العنوان والوصف)
 *       - name: minPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: الحد الأدنى للسعر
 *       - name: maxPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: الحد الأقصى للسعر
 *       - name: minRating
 *         in: query
 *         schema:
 *           type: number
 *         description: الحد الأدنى للتقييم (1-5)
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: معرف الفئة
 *       - name: artist
 *         in: query
 *         schema:
 *           type: string
 *         description: معرف الفنان
 *       - name: tags
 *         in: query
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: الوسوم للتصفية
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [price, createdAt, title, rating]
 *         description: ترتيب حسب
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: ترتيب تصاعدي أو تنازلي
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 12
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب نتائج البحث بنجاح
 */
router.get('/search', artworkController.searchArtworks);

/**
 * @swagger
 * /api/artworks/artist/{artistId}:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: أعمال الفنان
 *     description: الحصول على الأعمال الفنية لفنان محدد
 *     parameters:
 *       - name: artistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الفنان
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 12
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب أعمال الفنان بنجاح
 *       404:
 *         description: الفنان غير موجود
 */
router.get('/artist/:artistId', artworkController.getArtworksByArtist);

/**
 * @swagger
 * /api/artworks/category/{categoryId}:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: أعمال حسب الفئة
 *     description: الحصول على الأعمال الفنية في فئة محددة
 *     parameters:
 *       - name: categoryId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الفئة
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 12
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب الأعمال حسب الفئة بنجاح
 */
router.get('/category/:categoryId', artworkController.getArtworksByCategory);

/**
 * @swagger
 * /api/artworks/{id}:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: تفاصيل عمل فني
 *     description: الحصول على تفاصيل عمل فني محدد
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف العمل الفني
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل العمل الفني بنجاح
 *       404:
 *         description: العمل الفني غير موجود
 */
router.get('/:id', artworkController.getArtworkById);

/**
 * @swagger
 * /api/artworks/{id}/similar:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: الأعمال الفنية المشابهة
 *     description: الحصول على أعمال فنية مشابهة لعمل فني محدد
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف العمل الفني
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 6
 *         description: عدد الأعمال المشابهة المطلوبة
 *     responses:
 *       200:
 *         description: تم جلب الأعمال المشابهة بنجاح
 *       404:
 *         description: العمل الفني غير موجود
 */
router.get('/:artworkId/similar', artworkController.getSimilarArtworks);

/**
 * @swagger
 * /api/artworks/{id}/reviews:
 *   get:
 *     tags:
 *       - Artworks
 *       - Reviews
 *     summary: مراجعات العمل الفني
 *     description: الحصول على مراجعات وتقييمات عمل فني محدد
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف العمل الفني
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب المراجعات بنجاح
 */
router.get('/:id/reviews', reviewController.getArtworkReviewsWithStats);

/**
 * @swagger
 * /api/artworks:
 *   post:
 *     tags:
 *       - Artworks
 *     summary: إنشاء عمل فني جديد
 *     description: إضافة عمل فني جديد (للفنانين فقط)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - image
 *               - price
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان العمل الفني
 *               description:
 *                 type: string
 *                 description: وصف العمل الفني
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: رابط صورة العمل الفني
 *               price:
 *                 type: number
 *                 description: سعر العمل الفني
 *               category:
 *                 type: string
 *                 description: معرف فئة العمل الفني
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: وسوم العمل الفني
 *     responses:
 *       201:
 *         description: تم إضافة العمل الفني بنجاح
 *       400:
 *         description: بيانات غير صالحة
 */
router.post('/', isAuthenticated, isValidation(createArtworkSchema), artworkController.createArtwork);

/**
 * @swagger
 * /api/artworks/{id}:
 *   patch:
 *     tags:
 *       - Artworks
 *     summary: تحديث عمل فني
 *     description: تحديث بيانات عمل فني (للفنان المالك فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف العمل الفني
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان العمل الفني
 *               description:
 *                 type: string
 *                 description: وصف العمل الفني
 *               image:
 *                 type: string
 *                 format: uri
 *                 description: رابط صورة العمل الفني
 *               price:
 *                 type: number
 *                 description: سعر العمل الفني
 *               category:
 *                 type: string
 *                 description: معرف فئة العمل الفني
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: وسوم العمل الفني
 *     responses:
 *       200:
 *         description: تم تحديث العمل الفني بنجاح
 *       404:
 *         description: العمل الفني غير موجود أو غير مصرح
 */
router.patch('/:id', isAuthenticated, isValidation(updateArtworkSchema), artworkController.updateArtwork);

/**
 * @swagger
 * /api/artworks/{id}:
 *   delete:
 *     tags:
 *       - Artworks
 *     summary: حذف عمل فني
 *     description: حذف عمل فني (للفنان المالك فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف العمل الفني
 *     responses:
 *       200:
 *         description: تم حذف العمل الفني بنجاح
 *       404:
 *         description: العمل الفني غير موجود أو غير مصرح
 */
router.delete('/:id', isAuthenticated, artworkController.deleteArtwork);

/**
 * @swagger
 * /api/artwork/search:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: البحث عن الأعمال الفنية
 *     description: البحث عن الأعمال الفنية حسب المعايير المختلفة
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: كلمة البحث (في العنوان، الوصف، الوسوم)
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: معرف الفئة للتصفية
 *       - name: minPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: الحد الأدنى للسعر
 *       - name: maxPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: الحد الأقصى للسعر
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [newest, priceAsc, priceDesc, popular]
 *           default: newest
 *         description: ترتيب النتائج
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب نتائج البحث بنجاح
 */
router.get('/search', artworkController.searchArtworks);

/**
 * @swagger
 * /api/artwork/search/firebase:
 *   get:
 *     tags:
 *       - Artworks
 *     summary: البحث عن الأعمال الفنية (Firebase)
 *     description: البحث عن الأعمال الفنية حسب المعايير المختلفة مع مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: query
 *         in: query
 *         schema:
 *           type: string
 *         description: كلمة البحث (في العنوان، الوصف، الوسوم)
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: معرف الفئة للتصفية
 *       - name: minPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: الحد الأدنى للسعر
 *       - name: maxPrice
 *         in: query
 *         schema:
 *           type: number
 *         description: الحد الأقصى للسعر
 *       - name: sort
 *         in: query
 *         schema:
 *           type: string
 *           enum: [newest, priceAsc, priceDesc, popular]
 *           default: newest
 *         description: ترتيب النتائج
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب نتائج البحث بنجاح
 */
router.get('/search/firebase', verifyFirebaseToken, artworkController.searchArtworks);

export default router; 