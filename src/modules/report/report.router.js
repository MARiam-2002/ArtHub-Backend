import { Router } from 'express';
import * as controller from './report.controller.js';
import { authenticate as isAuthenticated, authenticate as verifyFirebaseToken } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  updateReportStatusSchema,
  reportIdSchema,
  bulkUpdateReportsSchema,
  reportStatsQuerySchema,
  contentReportsQuerySchema
} from './report.validation.js';

const router = Router();

/**
 * @swagger
 * /reports/admin/stats:
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
 *                   $ref: '#/components/schemas/ReportStatsResponse'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/admin/stats', isAuthenticated, isValidation(reportStatsQuerySchema), controller.getReportStats);

/**
 * @swagger
 * /reports/admin/all:
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
 * /reports/admin/{reportId}/status:
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
 *         $ref: '#/components/responses/Forbidden'
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
 * /reports/admin/bulk-update:
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
router.patch(
  '/admin/bulk-update',
  isAuthenticated,
  isValidation(bulkUpdateReportsSchema),
  controller.bulkUpdateReports
);

/**
 * @swagger
 * /reports/content/{contentType}/{contentId}:
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
router.get(
  '/content/:contentType/:contentId',
  isAuthenticated,
  isValidation(contentReportsQuerySchema),
  controller.getContentReports
);

export default router;
