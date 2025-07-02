import { Router } from 'express';
import * as controller from './report.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken } from '../../middleware/firebase-auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  createReportSchema,
  updateReportStatusSchema,
  reportIdSchema,
  reportQuerySchema,
  bulkUpdateReportsSchema,
  reportStatsQuerySchema,
  contentReportsQuerySchema,
  exportReportsSchema
} from './report.validation.js';

const router = Router();

/**
 * @swagger
 * /api/reports:
 *   post:
 *     tags:
 *       - Reports
 *     summary: إنشاء تقرير جديد
 *     description: الإبلاغ عن محتوى غير مناسب أو مخالف لسياسات المنصة
 *     x-screen: ReportContentScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateReportRequest'
 *           examples:
 *             artwork_report:
 *               summary: الإبلاغ عن عمل فني
 *               value:
 *                 contentType: "artwork"
 *                 contentId: "507f1f77bcf86cd799439011"
 *                 reason: "inappropriate"
 *                 description: "هذا العمل الفني يحتوي على محتوى غير مناسب"
 *                 priority: "medium"
 *             user_report:
 *               summary: الإبلاغ عن مستخدم
 *               value:
 *                 contentType: "user"
 *                 contentId: "507f1f77bcf86cd799439012"
 *                 reason: "harassment"
 *                 description: "هذا المستخدم يقوم بالتحرش والإزعاج"
 *                 priority: "high"
 *                 evidence: ["https://example.com/screenshot1.jpg"]
 *     responses:
 *       201:
 *         description: تم إنشاء التقرير بنجاح
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
 *                   example: "تم إرسال التقرير بنجاح، سيتم مراجعته قريباً"
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: المحتوى المبلغ عنه غير موجود
 *       429:
 *         $ref: '#/components/responses/TooManyRequests'
 */
// Create report with both authentication methods
router.post('/', isAuthenticated, isValidation(createReportSchema), controller.createReport);
router.post('/firebase', verifyFirebaseToken, isValidation(createReportSchema), controller.createReport);

/**
 * @swagger
 * /api/reports/my:
 *   get:
 *     tags:
 *       - Reports
 *     summary: عرض تقاريري
 *     description: عرض التقارير التي قام المستخدم بإنشائها مع إحصائيات سريعة
 *     x-screen: MyReportsScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/ReportQueryParams'
 *     responses:
 *       200:
 *         description: تم جلب التقارير بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Report'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         pending:
 *                           type: integer
 *                         investigating:
 *                           type: integer
 *                         resolved:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/my', isAuthenticated, isValidation(reportQuerySchema), controller.getUserReports);
router.get('/my/firebase', verifyFirebaseToken, isValidation(reportQuerySchema), controller.getUserReports);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   get:
 *     tags:
 *       - Reports
 *     summary: عرض تفاصيل تقرير
 *     description: عرض تفاصيل تقرير محدد مع التقارير المرتبطة للمدراء
 *     x-screen: ReportDetailsScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف التقرير (MongoDB ObjectId)
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل التقرير بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Report'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         description: التقرير غير موجود
 */
router.get('/:reportId', isAuthenticated, isValidation(reportIdSchema), controller.getReportById);
router.get('/:reportId/firebase', verifyFirebaseToken, isValidation(reportIdSchema), controller.getReportById);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   delete:
 *     tags:
 *       - Reports
 *     summary: حذف تقرير
 *     description: حذف تقرير قام المستخدم بإنشائه (يمكن فقط إذا كان التقرير قيد الانتظار)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف التقرير
 *     responses:
 *       200:
 *         description: تم حذف التقرير بنجاح
 *       404:
 *         description: التقرير غير موجود أو لا يمكن حذفه
 */
router.delete('/:reportId', isAuthenticated, controller.deleteReport);

/**
 * @swagger
 * /api/reports/admin/stats:
 *   get:
 *     tags:
 *       - Reports
 *       - Admin
 *     summary: إحصائيات التقارير
 *     description: عرض إحصائيات شاملة للتقارير مع إمكانية التصفية (للمدير فقط)
 *     x-screen: AdminReportsStatsScreen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: month
 *         description: فترة الإحصائيات
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [status, contentType, reason, priority, date]
 *           default: status
 *         description: معيار التجميع
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات التقارير بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         pending:
 *                           type: integer
 *                         investigating:
 *                           type: integer
 *                         resolved:
 *                           type: integer
 *                         rejected:
 *                           type: integer
 *                         escalated:
 *                           type: integer
 *                     groupedBy:
 *                       type: object
 *                     topReasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           reason:
 *                             type: string
 *                           count:
 *                             type: integer
 *                     activity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           date:
 *                             type: string
 *                           count:
 *                             type: integer
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin/stats', isAuthenticated, isValidation(reportStatsQuerySchema), controller.getReportStats);

/**
 * @swagger
 * /api/reports/admin/all:
 *   get:
 *     tags:
 *       - Reports
 *       - Admin
 *     summary: قائمة جميع التقارير
 *     description: عرض قائمة جميع التقارير (للمدير فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: عدد العناصر في الصفحة
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, resolved, rejected]
 *         description: تصفية حسب الحالة
 *       - name: contentType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [artwork, image, user, comment, message]
 *         description: تصفية حسب نوع المحتوى
 *     responses:
 *       200:
 *         description: تم جلب قائمة التقارير بنجاح
 *       403:
 *         description: غير مصرح لك بعرض قائمة التقارير
 */
router.get('/admin/all', isAuthenticated, controller.getAllReports);

/**
 * @swagger
 * /api/reports/admin/{reportId}/status:
 *   patch:
 *     tags:
 *       - Reports
 *       - Admin
 *     summary: تحديث حالة تقرير
 *     description: تحديث حالة تقرير محدد (للمدير فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: reportId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف التقرير
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, resolved, rejected]
 *                 description: الحالة الجديدة
 *               adminNotes:
 *                 type: string
 *                 description: ملاحظات المدير
 *     responses:
 *       200:
 *         description: تم تحديث حالة التقرير بنجاح
 *       403:
 *         description: غير مصرح لك بتحديث حالة التقارير
 *       404:
 *         description: التقرير غير موجود
 */
router.patch(
  '/admin/:reportId/status',
  isAuthenticated,
  isValidation(updateReportStatusSchema),
  controller.updateReportStatus
);

/**
 * @swagger
 * /api/reports/admin/bulk-update:
 *   patch:
 *     tags:
 *       - Reports
 *       - Admin
 *     summary: تحديث متعدد للتقارير
 *     description: تحديث حالة عدة تقارير في مرة واحدة (للمدير فقط)
 *     x-screen: AdminBulkReportsScreen
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkUpdateReportsRequest'
 *     responses:
 *       200:
 *         description: تم تحديث التقارير بنجاح
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.patch('/admin/bulk-update', isAuthenticated, isValidation(bulkUpdateReportsSchema), controller.bulkUpdateReports);

/**
 * @swagger
 * /api/reports/content/{contentType}/{contentId}:
 *   get:
 *     tags:
 *       - Reports
 *       - Admin
 *     summary: تقارير محتوى معين
 *     description: عرض جميع التقارير المتعلقة بمحتوى معين (للمدير فقط)
 *     x-screen: AdminContentReportsScreen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: contentType
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           enum: [artwork, image, user, comment, message, review, specialRequest]
 *         description: نوع المحتوى
 *       - name: contentId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف المحتوى
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب تقارير المحتوى بنجاح
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/content/:contentType/:contentId', isAuthenticated, isValidation(contentReportsQuerySchema), controller.getContentReports);

/**
 * @swagger
 * /api/reports/admin/export:
 *   get:
 *     tags:
 *       - Reports
 *       - Admin
 *     summary: تصدير التقارير
 *     description: تصدير التقارير بصيغ مختلفة (للمدير فقط)
 *     x-screen: AdminExportReportsScreen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [csv, xlsx, json]
 *           default: csv
 *         description: صيغة التصدير
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, investigating, resolved, rejected, escalated]
 *         description: تصفية حسب الحالة
 *       - name: contentType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [artwork, image, user, comment, message, review, specialRequest]
 *         description: تصفية حسب نوع المحتوى
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية
 *     responses:
 *       200:
 *         description: تم تصدير التقارير بنجاح
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin/export', isAuthenticated, isValidation(exportReportsSchema), controller.exportReports);

export default router;
