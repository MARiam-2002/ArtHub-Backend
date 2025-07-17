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
 *           enum: [1month, 3months, 6months, 9months, 12months]
 *           default: 12months
 *         description: الفترة الزمنية للبيانات
 *         example: "12months"
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
 *                         chartData:
 *                           type: array
 *                           description: بيانات الرسوم البيانية للطلبات
 *                           items:
 *                             type: object
 *                             properties:
 *                               month:
 *                                 type: string
 *                                 example: "يناير"
 *                                 description: اسم الشهر باللغة العربية
 *                               value:
 *                                 type: number
 *                                 example: 85
 *                                 description: إجمالي عدد الطلبات للشهر
 *                               completed:
 *                                 type: number
 *                                 example: 70
 *                                 description: عدد الطلبات المكتملة
 *                               inProgress:
 *                                 type: number
 *                                 example: 10
 *                                 description: عدد الطلبات قيد التنفيذ
 *                               rejected:
 *                                 type: number
 *                                 example: 5
 *                                 description: عدد الطلبات المرفوضة
 *                           example: [
 *                             {
 *                               "month": "يناير",
 *                               "value": 140,
 *                               "completed": 119,
 *                               "inProgress": 14,
 *                               "rejected": 7
 *                             },
 *                             {
 *                               "month": "فبراير",
 *                               "value": 120,
 *                               "completed": 102,
 *                               "inProgress": 12,
 *                               "rejected": 6
 *                             },
 *                             {
 *                               "month": "مارس",
 *                               "value": 80,
 *                               "completed": 68,
 *                               "inProgress": 8,
 *                               "rejected": 4
 *                             },
 *                             {
 *                               "month": "أبريل",
 *                               "value": 100,
 *                               "completed": 85,
 *                               "inProgress": 10,
 *                               "rejected": 5
 *                             },
 *                             {
 *                               "month": "مايو",
 *                               "value": 60,
 *                               "completed": 51,
 *                               "inProgress": 6,
 *                               "rejected": 3
 *                             },
 *                             {
 *                               "month": "يونيو",
 *                               "value": 80,
 *                               "completed": 68,
 *                               "inProgress": 8,
 *                               "rejected": 4
 *                             },
 *                             {
 *                               "month": "يوليو",
 *                               "value": 60,
 *                               "completed": 51,
 *                               "inProgress": 6,
 *                               "rejected": 3
 *                             },
 *                             {
 *                               "month": "أغسطس",
 *                               "value": 100,
 *                               "completed": 85,
 *                               "inProgress": 10,
 *                               "rejected": 5
 *                             },
 *                             {
 *                               "month": "سبتمبر",
 *                               "value": 80,
 *                               "completed": 68,
 *                               "inProgress": 8,
 *                               "rejected": 4
 *                             },
 *                             {
 *                               "month": "أكتوبر",
 *                               "value": 60,
 *                               "completed": 51,
 *                               "inProgress": 6,
 *                               "rejected": 3
 *                             },
 *                             {
 *                               "month": "نوفمبر",
 *                               "value": 80,
 *                               "completed": 68,
 *                               "inProgress": 8,
 *                               "rejected": 4
 *                             },
 *                             {
 *                               "month": "ديسمبر",
 *                               "value": 100,
 *                               "completed": 85,
 *                               "inProgress": 10,
 *                               "rejected": 5
 *                             }
 *                           ]
 *                         summary:
 *                           type: object
 *                           description: ملخص إحصائيات الطلبات
 *                           properties:
 *                             inProgress:
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
 *                         chartData:
 *                           type: array
 *                           description: بيانات الرسوم البيانية للإيرادات
 *                           items:
 *                             type: object
 *                             properties:
 *                               month:
 *                                 type: string
 *                                 example: "يناير"
 *                                 description: اسم الشهر باللغة العربية
 *                               value:
 *                                 type: number
 *                                 example: 120000
 *                                 description: إجمالي الإيرادات للشهر
 *                               orderCount:
 *                                 type: number
 *                                 example: 85
 *                                 description: عدد الطلبات المكتملة للشهر
 *                               averageOrderValue:
 *                                 type: number
 *                                 example: 1411.76
 *                                 description: متوسط قيمة الطلب للشهر
 *                           example: [
 *                             {
 *                               "month": "يناير",
 *                               "value": 250000,
 *                               "orderCount": 167,
 *                               "averageOrderValue": 1497
 *                             },
 *                             {
 *                               "month": "فبراير",
 *                               "value": 280000,
 *                               "orderCount": 187,
 *                               "averageOrderValue": 1497
 *                             },
 *                             {
 *                               "month": "مارس",
 *                               "value": 70000,
 *                               "orderCount": 47,
 *                               "averageOrderValue": 1489
 *                             },
 *                             {
 *                               "month": "أبريل",
 *                               "value": 180000,
 *                               "orderCount": 120,
 *                               "averageOrderValue": 1500
 *                             },
 *                             {
 *                               "month": "مايو",
 *                               "value": 220000,
 *                               "orderCount": 147,
 *                               "averageOrderValue": 1497
 *                             },
 *                             {
 *                               "month": "يونيو",
 *                               "value": 150000,
 *                               "orderCount": 100,
 *                               "averageOrderValue": 1500
 *                             },
 *                             {
 *                               "month": "يوليو",
 *                               "value": 200000,
 *                               "orderCount": 133,
 *                               "averageOrderValue": 1504
 *                             },
 *                             {
 *                               "month": "أغسطس",
 *                               "value": 250000,
 *                               "orderCount": 167,
 *                               "averageOrderValue": 1497
 *                             },
 *                             {
 *                               "month": "سبتمبر",
 *                               "value": 180000,
 *                               "orderCount": 120,
 *                               "averageOrderValue": 1500
 *                             },
 *                             {
 *                               "month": "أكتوبر",
 *                               "value": 120000,
 *                               "orderCount": 80,
 *                               "averageOrderValue": 1500
 *                             },
 *                             {
 *                               "month": "نوفمبر",
 *                               "value": 150000,
 *                               "orderCount": 100,
 *                               "averageOrderValue": 1500
 *                             },
 *                             {
 *                               "month": "ديسمبر",
 *                               "value": 200000,
 *                               "orderCount": 133,
 *                               "averageOrderValue": 1504
 *                             }
 *                           ]
 *                         summary:
 *                           type: object
 *                           description: ملخص إحصائيات الإيرادات
 *                           properties:
 *                             weekly:
 *                               type: number
 *                               example: 28900
 *                               description: الإيرادات الأسبوعية
 *                             monthly:
 *                               type: number
 *                               example: 124500
 *                               description: الإيرادات الشهرية
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
 *           enum: [1week, 1month, 3months, 6months, 1year]
 *           default: 1month
 *         description: الفترة الزمنية لحساب الأداء
 *         example: "1month"
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