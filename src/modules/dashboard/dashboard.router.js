import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as dashboardValidation from './dashboard.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: لوحة التحكم الرئيسية - إحصائيات وبيانات أساسية
 */

/**
 * @swagger
 * /api/dashboard/statistics:
 *   get:
 *     summary: الإحصائيات الرئيسية للوحة التحكم
 *     tags: [Dashboard]
 *     description: جلب الإحصائيات الرئيسية للمنصة مع النسب المئوية مقارنة بالشهر الماضي
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الإحصائيات بنجاح
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
 *                   example: "تم جلب الإحصائيات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: object
 *                       description: إجمالي المستخدمين
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 12847
 *                           description: إجمالي عدد المستخدمين
 *                         percentageChange:
 *                           type: number
 *                           example: 12
 *                           description: النسبة المئوية مقارنة بالشهر الماضي
 *                         isPositive:
 *                           type: boolean
 *                           example: true
 *                           description: هل التغيير إيجابي أم سلبي
 *                     activeArtists:
 *                       type: object
 *                       description: الفنانين النشطين
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 3429
 *                           description: عدد الفنانين النشطين
 *                         percentageChange:
 *                           type: number
 *                           example: 8
 *                           description: النسبة المئوية مقارنة بالشهر الماضي
 *                         isPositive:
 *                           type: boolean
 *                           example: true
 *                           description: هل التغيير إيجابي أم سلبي
 *                     totalRevenue:
 *                       type: object
 *                       description: إجمالي الإيرادات
 *                       properties:
 *                         value:
 *                           type: number
 *                           example: 1545118
 *                           description: إجمالي الإيرادات
 *                         percentageChange:
 *                           type: number
 *                           example: -2.5
 *                           description: النسبة المئوية مقارنة بالشهر الماضي
 *                         isPositive:
 *                           type: boolean
 *                           example: false
 *                           description: هل التغيير إيجابي أم سلبي
 *                         currency:
 *                           type: string
 *                           example: "SAR"
 *                           description: عملة الإيرادات
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 */
router.get(
  '/statistics',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getDashboardStatistics
);

/**
 * @swagger
 * /api/dashboard/charts:
 *   get:
 *     summary: بيانات الرسوم البيانية
 *     tags: [Dashboard]
 *     description: جلب بيانات الرسوم البيانية للإيرادات والطلبات مع الإحصائيات التفصيلية
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: الفترة الزمنية للبيانات
 *         example: "monthly"
 *     responses:
 *       200:
 *         description: تم جلب بيانات الرسوم البيانية بنجاح
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
 *                   example: "تم جلب بيانات الرسوم البيانية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     orders:
 *                       type: object
 *                       description: إحصائيات الطلبات
 *                       properties:
 *                         labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
 *                           description: أسماء الأشهر باللغة العربية
 *                         data:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [85, 92, 98, 105, 112, 118, 125, 132, 140, 148, 156, 165]
 *                           description: عدد الطلبات لكل شهر
 *                         summary:
 *                           type: object
 *                           description: ملخص إحصائيات الطلبات
 *                           properties:
 *                             pending:
 *                               type: number
 *                               example: 89
 *                               description: الطلبات قيد التنفيذ
 *                             completed:
 *                               type: number
 *                               example: 1243
 *                               description: الطلبات المكتملة
 *                             rejected:
 *                               type: number
 *                               example: 23
 *                               description: الطلبات المرفوضة
 *                     revenue:
 *                       type: object
 *                       description: إحصائيات الإيرادات
 *                       properties:
 *                         labels:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"]
 *                           description: أسماء الأشهر باللغة العربية
 *                         data:
 *                           type: array
 *                           items:
 *                             type: number
 *                           example: [120000, 135000, 142000, 138000, 156000, 168000, 175000, 182000, 195000, 210000, 225000, 240000]
 *                           description: الإيرادات لكل شهر
 *                         summary:
 *                           type: object
 *                           description: ملخص إحصائيات الإيرادات
 *                           properties:
 *                             yearly:
 *                               type: number
 *                               example: 47392
 *                               description: الإيرادات السنوية
 *                             monthly:
 *                               type: number
 *                               example: 124500
 *                               description: الإيرادات الشهرية
 *                             weekly:
 *                               type: number
 *                               example: 28900
 *                               description: الإيرادات الأسبوعية
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 */
router.get(
  '/charts',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getChartsValidation),
  dashboardController.getDashboardCharts
);

/**
 * @swagger
 * /api/dashboard/artists/performance:
 *   get:
 *     summary: أفضل الفنانين أداءً
 *     tags: [Dashboard]
 *     description: جلب قائمة أفضل الفنانين أداءً مع مقاييسهم
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 3
 *         description: عدد الفنانين المطلوب عرضهم
 *         example: 3
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *           default: monthly
 *         description: الفترة الزمنية لحساب الأداء
 *         example: "monthly"
 *     responses:
 *       200:
 *         description: تم جلب بيانات الفنانين بنجاح
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
 *                   example: "تم جلب بيانات الفنانين بنجاح"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       displayName:
 *                         type: string
 *                         example: "مريم خالد"
 *                       profileImage:
 *                         type: string
 *                         example: "https://example.com/profile.jpg"
 *                       job:
 *                         type: string
 *                         example: "فن رقمي"
 *                       performance:
 *                         type: object
 *                         properties:
 *                           sales:
 *                             type: number
 *                             example: 1175
 *                           rating:
 *                             type: number
 *                             example: 4.7
 *                           artworks:
 *                             type: number
 *                             example: 28
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 */
router.get(
  '/artists/performance',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getArtistsPerformance
);

export default router; 