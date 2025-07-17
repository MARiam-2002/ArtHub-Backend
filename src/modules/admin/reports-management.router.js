import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as reportsController from './reports-management.controller.js';
import * as reportsValidation from './reports-management.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reports Management
 *   description: إدارة البلاغات - عرض وإدارة بلاغات المستخدمين
 */

/**
 * @swagger
 * /api/admin/reports:
 *   get:
 *     summary: جلب جميع البلاغات
 *     tags: [Reports Management]
 *     description: جلب قائمة جميع البلاغات مع التفاصيل الأساسية للعرض في الجدول. يتم الترتيب والتصفية من الفرونت.
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
 *         description: تم جلب البلاغات بنجاح
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
 *                   example: "تم جلب البلاغات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
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
 *                             description: معرف البلاغ
 *                           complainant:
 *                             type: string
 *                             example: "منى سالم"
 *                             description: اسم المشتكي
 *                           complainantEmail:
 *                             type: string
 *                             example: "mona.salem@example.com"
 *                             description: بريد المشتكي
 *                           artist:
 *                             type: string
 *                             example: "أحمد محمد"
 *                             description: اسم الفنان
 *                           artistEmail:
 *                             type: string
 *                             example: "ahmed.mohamed@example.com"
 *                             description: بريد الفنان
 *                           reportType:
 *                             type: string
 *                             example: "تأخير في التسليم"
 *                             description: نوع البلاغ
 *                           date:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-18T10:30:00.000Z"
 *                             description: تاريخ البلاغ
 *                           description:
 *                             type: string
 *                             example: "تأخر الفنان في تسليم العمل"
 *                             description: وصف البلاغ
 *                           status:
 *                             type: string
 *                             example: "pending"
 *                             description: حالة البلاغ
 *                           statusText:
 *                             type: string
 *                             example: "تحت المراجعة"
 *                             description: نص حالة البلاغ
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
  isValidation(reportsValidation.getAllReportsValidation),
  reportsController.getAllReports
);

/**
 * @swagger
 * /api/admin/reports/{id}:
 *   get:
 *     summary: جلب تفاصيل بلاغ محدد
 *     tags: [Reports Management]
 *     description: جلب تفاصيل كاملة لبلاغ محدد لعرضه في النافذة المنبثقة
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف البلاغ
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل البلاغ بنجاح
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
 *                   example: "تم جلب تفاصيل البلاغ بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     description:
 *                       type: string
 *                       example: "تأخر الفنان في تسليم العمل لمدة أسبوع"
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 *       404:
 *         description: البلاغ غير موجود
 */
router.get(
  '/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(reportsValidation.getReportDetailsValidation),
  reportsController.getReportDetails
);

/**
 * @swagger
 * /api/admin/reports/{id}:
 *   delete:
 *     summary: حذف بلاغ
 *     tags: [Reports Management]
 *     description: حذف بلاغ محدد من النظام
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف البلاغ
 *     responses:
 *       200:
 *         description: تم حذف البلاغ بنجاح
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
 *                   example: "تم حذف البلاغ بنجاح"
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
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 *       404:
 *         description: البلاغ غير موجود
 */
router.delete(
  '/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(reportsValidation.deleteReportValidation),
  reportsController.deleteReport
);

export default router; 