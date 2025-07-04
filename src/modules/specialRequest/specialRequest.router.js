import { Router } from 'express';
import * as controller from './specialRequest.controller.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  createSpecialRequestSchema,
  updateRequestStatusSchema,
  completeRequestSchema,
  cancelSpecialRequestSchema
} from './specialRequest.validation.js';

const router = Router();

/**
 * @swagger
 * /special-requests:
 *   post:
 *     tags:
 *       - Special Requests
 *     summary: إنشاء طلب خاص
 *     description: إرسال طلب خاص لفنان محدد
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artist
 *               - requestType
 *               - description
 *               - budget
 *             properties:
 *               artist:
 *                 type: string
 *                 description: معرف الفنان
 *               requestType:
 *                 type: string
 *                 description: نوع الطلب الخاص
 *               description:
 *                 type: string
 *                 description: وصف تفصيلي للطلب
 *               budget:
 *                 type: number
 *                 description: الميزانية المقترحة
 *               deadline:
 *                 type: string
 *                 format: date-time
 *                 description: الموعد النهائي (اختياري)
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 description: روابط ملفات مرفقة (اختياري)
 *     responses:
 *       201:
 *         description: تم إنشاء الطلب الخاص بنجاح
 *       400:
 *         description: بيانات غير صالحة
 *       404:
 *         description: الفنان غير موجود
 */
router.post(
  '/',
  isAuthenticated,
  isValidation(createSpecialRequestSchema),
  controller.createSpecialRequest
);

/**
 * @swagger
 * /special-requests/my:
 *   get:
 *     tags:
 *       - Special Requests
 *     summary: عرض طلباتي الخاصة
 *     description: عرض الطلبات الخاصة التي أرسلها المستخدم
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
 *           enum: [pending, accepted, rejected, completed]
 *         description: تصفية حسب الحالة
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *         description: ترتيب حسب الحقل
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: طريقة الترتيب
 *     responses:
 *       200:
 *         description: تم جلب طلبات المستخدم بنجاح
 */
router.get('/my', isAuthenticated, controller.getUserRequests);

/**
 * @swagger
 * /special-requests/artist:
 *   get:
 *     tags:
 *       - Special Requests
 *     summary: عرض الطلبات الموجهة للفنان
 *     description: عرض الطلبات الخاصة المرسلة إلى الفنان
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
 *           enum: [pending, accepted, rejected, completed]
 *         description: تصفية حسب الحالة
 *     responses:
 *       200:
 *         description: تم جلب طلبات الفنان بنجاح
 *       403:
 *         description: غير مصرح لك بعرض طلبات الفنانين
 */
router.get('/artist', isAuthenticated, controller.getArtistRequests);

/**
 * @swagger
 * /special-requests/artist/stats:
 *   get:
 *     tags:
 *       - Special Requests
 *     summary: إحصائيات الطلبات للفنان
 *     description: عرض إحصائيات الطلبات الخاصة للفنان
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات الطلبات بنجاح
 *       403:
 *         description: غير مصرح لك بعرض إحصائيات الفنانين
 */
router.get('/artist/stats', isAuthenticated, controller.getArtistRequestStats);

/**
 * @swagger
 * /special-requests/{requestId}:
 *   get:
 *     tags:
 *       - Special Requests
 *     summary: تفاصيل طلب خاص
 *     description: عرض تفاصيل طلب خاص محدد
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الطلب
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل الطلب بنجاح
 *       404:
 *         description: الطلب غير موجود
 */
router.get('/:requestId', isAuthenticated, controller.getRequestById);

/**
 * @swagger
 * /special-requests/{requestId}/status:
 *   patch:
 *     tags:
 *       - Special Requests
 *     summary: تحديث حالة الطلب
 *     description: تحديث حالة طلب خاص (للفنان فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الطلب
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
 *                 enum: [pending, accepted, rejected, completed]
 *               response:
 *                 type: string
 *                 description: رد أو ملاحظات إضافية
 *     responses:
 *       200:
 *         description: تم تحديث حالة الطلب بنجاح
 *       404:
 *         description: الطلب غير موجود
 */
router.patch(
  '/:requestId/status',
  isAuthenticated,
  isValidation(updateRequestStatusSchema),
  controller.updateRequestStatus
);

/**
 * @swagger
 * /special-requests/{requestId}/response:
 *   post:
 *     tags:
 *       - Special Requests
 *     summary: إضافة رد للطلب
 *     description: إضافة رد أو تعليق على طلب خاص
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الطلب
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - response
 *             properties:
 *               response:
 *                 type: string
 *                 description: الرد أو التعليق
 *     responses:
 *       200:
 *         description: تم إضافة الرد بنجاح
 *       404:
 *         description: الطلب غير موجود
 */
router.post(
  '/:requestId/response',
  isAuthenticated,
  controller.addResponseToRequest
);

/**
 * @swagger
 * /special-requests/{requestId}/complete:
 *   post:
 *     tags:
 *       - Special Requests
 *     summary: إكمال الطلب الخاص
 *     description: وضع علامة على الطلب الخاص كمكتمل (بواسطة الفنان)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الطلب
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               finalWork:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: روابط العمل النهائي
 *     responses:
 *       200:
 *         description: تم إكمال الطلب بنجاح
 *       404:
 *         description: الطلب غير موجود
 */
router.post(
  '/:requestId/complete',
  isAuthenticated,
  isValidation(completeRequestSchema),
  controller.completeRequest
);

/**
 * @swagger
 * /special-requests/{requestId}/cancel:
 *   delete:
 *     tags:
 *       - Special Requests
 *     summary: إلغاء طلب خاص
 *     description: إلغاء طلب خاص (بواسطة المستخدم)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الطلب
 *     responses:
 *       200:
 *         description: تم إلغاء الطلب بنجاح
 *       404:
 *         description: الطلب غير موجود
 */
// router.delete(
//   '/:requestId/cancel',
//   isAuthenticated,
//   isValidation(cancelSpecialRequestSchema),
//   controller.cancelRequest
// );

export default router;
