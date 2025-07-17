import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as reviewsController from './reviews-management.controller.js';
import * as reviewsValidation from './reviews-management.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reviews Management
 *   description: إدارة التقييمات في لوحة التحكم
 */

/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: جلب جميع التقييمات
 *     tags: [Reviews Management]
 *     description: جلب قائمة جميع التقييمات مع التفاصيل للعرض في الجدول
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب التقييمات بنجاح
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
 *                   example: "تم جلب التقييمات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                             example: 1
 *                             description: الرقم التسلسلي
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                             description: معرف التقييم
 *                           artworkTitle:
 *                             type: string
 *                             example: "لوحة زيتية مخصصة"
 *                             description: اسم العمل الفني
 *                           clientName:
 *                             type: string
 *                             example: "منى سالم"
 *                             description: اسم العميل
 *                           artistName:
 *                             type: string
 *                             example: "أحمد محمد"
 *                             description: اسم الفنان
 *                           rating:
 *                             type: number
 *                             example: 4
 *                             description: التقييم (1-5)
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-18T10:30:00.000Z"
 *                             description: تاريخ التقييم
 *                           comment:
 *                             type: string
 *                             example: "عمل رائع ومميز"
 *                             description: التعليق
 *                           artworkImage:
 *                             type: string
 *                             example: "https://example.com/artwork.jpg"
 *                             description: صورة العمل الفني
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 20
 *                         total:
 *                           type: number
 *                           example: 150
 *                         pages:
 *                           type: number
 *                           example: 8
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 */
router.get(
  '/',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(reviewsValidation.getAllReviewsValidation),
  reviewsController.getAllReviews
);

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   get:
 *     summary: جلب تفاصيل تعليق محدد
 *     tags: [Reviews Management]
 *     description: جلب تفاصيل كاملة لتعليق محدد لعرضه في النافذة المنبثقة
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف التقييم
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل التقييم بنجاح
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
 *                   example: "تم جلب تفاصيل التقييم بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     rating:
 *                       type: number
 *                       example: 4
 *                     comment:
 *                       type: string
 *                       example: "عمل رائع ومميز، الفنان متعاون جداً"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *                     client:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "منى سالم"
 *                         email:
 *                           type: string
 *                           example: "mona.salem@example.com"
 *                         image:
 *                           type: string
 *                           example: "https://example.com/client.jpg"
 *                     artist:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                           example: "أحمد محمد"
 *                         email:
 *                           type: string
 *                           example: "ahmed.mohamed@example.com"
 *                         image:
 *                           type: string
 *                           example: "https://example.com/artist.jpg"
 *                     artwork:
 *                       type: object
 *                       properties:
 *                         title:
 *                           type: string
 *                           example: "لوحة زيتية مخصصة"
 *                         image:
 *                           type: string
 *                           example: "https://example.com/artwork.jpg"
 *                         description:
 *                           type: string
 *                           example: "لوحة زيتية مخصصة بحجم 50x70 سم"
 *       400:
 *         description: معرف التقييم غير صالح
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 *       404:
 *         description: التقييم غير موجود
 */
router.get(
  '/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(reviewsValidation.getReviewDetailsValidation),
  reviewsController.getReviewDetails
);

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   delete:
 *     summary: حذف تقييم
 *     tags: [Reviews Management]
 *     description: حذف تقييم محدد من النظام
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف التقييم
 *     responses:
 *       200:
 *         description: تم حذف التقييم بنجاح
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
 *                   example: "تم حذف التقييم بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *       400:
 *         description: معرف التقييم غير صالح
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 *       404:
 *         description: التقييم غير موجود
 */
router.delete(
  '/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(reviewsValidation.deleteReviewValidation),
  reviewsController.deleteReview
);

/**
 * @swagger
 * /api/admin/reviews/export:
 *   get:
 *     summary: تصدير بيانات التقييمات
 *     tags: [Reviews Management]
 *     description: تصدير جميع بيانات التقييمات بصيغة JSON أو CSV
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, csv]
 *           default: json
 *         description: صيغة التصدير
 *     responses:
 *       200:
 *         description: تم تصدير بيانات التقييمات بنجاح
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
 *                   example: "تم تصدير بيانات التقييمات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReviews:
 *                       type: number
 *                       example: 150
 *                     exportedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: number
 *                             example: 1
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           artworkTitle:
 *                             type: string
 *                             example: "لوحة زيتية مخصصة"
 *                           clientName:
 *                             type: string
 *                             example: "منى سالم"
 *                           clientEmail:
 *                             type: string
 *                             example: "mona.salem@example.com"
 *                           artistName:
 *                             type: string
 *                             example: "أحمد محمد"
 *                           artistEmail:
 *                             type: string
 *                             example: "ahmed.mohamed@example.com"
 *                           rating:
 *                             type: number
 *                             example: 4
 *                           comment:
 *                             type: string
 *                             example: "عمل رائع ومميز"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-18T10:30:00.000Z"
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 */
router.get(
  '/export',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(reviewsValidation.exportReviewsValidation),
  reviewsController.exportReviews
);

/**
 * @swagger
 * /api/admin/reviews/statistics:
 *   get:
 *     summary: إحصائيات التقييمات
 *     tags: [Reviews Management]
 *     description: جلب إحصائيات عامة للتقييمات وأفضل الفنانين تقييماً
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات التقييمات بنجاح
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
 *                   example: "تم جلب إحصائيات التقييمات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         totalReviews:
 *                           type: number
 *                           example: 150
 *                         averageRating:
 *                           type: number
 *                           example: 4.2
 *                         ratingDistribution:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: number
 *                                 example: 5
 *                               count:
 *                                 type: number
 *                                 example: 45
 *                     topRatedArtists:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                             example: "أحمد محمد"
 *                           image:
 *                             type: string
 *                             example: "https://example.com/artist.jpg"
 *                           averageRating:
 *                             type: number
 *                             example: 4.8
 *                           totalReviews:
 *                             type: number
 *                             example: 25
 *                     latestReviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           rating:
 *                             type: number
 *                             example: 4
 *                           comment:
 *                             type: string
 *                             example: "عمل رائع ومميز"
 *                           clientName:
 *                             type: string
 *                             example: "منى سالم"
 *                           artistName:
 *                             type: string
 *                             example: "أحمد محمد"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-18T10:30:00.000Z"
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 */
router.get(
  '/statistics',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  reviewsController.getReviewsStatistics
);

export default router; 