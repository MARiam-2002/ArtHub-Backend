import { Router } from 'express';
import * as controller from './report.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import { createReportSchema, updateReportStatusSchema } from './report.validation.js';

const router = Router();

/**
 * @swagger
 * /api/reports:
 *   post:
 *     tags:
 *       - Reports
 *     summary: إنشاء تقرير جديد
 *     description: الإبلاغ عن محتوى غير مناسب
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentType
 *               - contentId
 *               - reason
 *             properties:
 *               contentType:
 *                 type: string
 *                 enum: [artwork, image, user, comment, message]
 *                 description: نوع المحتوى المبلغ عنه
 *               contentId:
 *                 type: string
 *                 description: معرف المحتوى المبلغ عنه
 *               reason:
 *                 type: string
 *                 enum: [inappropriate, copyright, spam, offensive, harassment, other]
 *                 description: سبب الإبلاغ
 *               description:
 *                 type: string
 *                 description: وصف تفصيلي للإبلاغ
 *     responses:
 *       201:
 *         description: تم إنشاء التقرير بنجاح
 *       400:
 *         description: بيانات غير صالحة
 *       404:
 *         description: المحتوى المبلغ عنه غير موجود
 */
router.post('/', isAuthenticated, isValidation(createReportSchema), controller.createReport);

/**
 * @swagger
 * /api/reports/my:
 *   get:
 *     tags:
 *       - Reports
 *     summary: عرض تقاريري
 *     description: عرض التقارير التي قام المستخدم بإنشائها
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
 *     responses:
 *       200:
 *         description: تم جلب التقارير بنجاح
 */
router.get('/my', isAuthenticated, controller.getUserReports);

/**
 * @swagger
 * /api/reports/{reportId}:
 *   get:
 *     tags:
 *       - Reports
 *     summary: عرض تفاصيل تقرير
 *     description: عرض تفاصيل تقرير محدد
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
 *         description: تم جلب تفاصيل التقرير بنجاح
 *       404:
 *         description: التقرير غير موجود
 */
router.get('/:reportId', isAuthenticated, controller.getReportById);

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
 *     description: عرض إحصائيات التقارير (للمدير فقط)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات التقارير بنجاح
 *       403:
 *         description: غير مصرح لك بعرض إحصائيات التقارير
 */
router.get('/admin/stats', isAuthenticated, controller.getReportStats);

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
router.patch('/admin/:reportId/status', isAuthenticated, isValidation(updateReportStatusSchema), controller.updateReportStatus);

export default router; 