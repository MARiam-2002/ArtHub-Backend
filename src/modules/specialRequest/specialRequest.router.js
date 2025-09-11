import { Router } from 'express';
import * as controller from './specialRequest.controller.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  createSpecialRequestSchema,
  updateRequestStatusSchema,
  completeRequestSchema,
  cancelSpecialRequestSchema,
  deleteRequestSchema
} from './specialRequest.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Special Requests
 *   description: Special requests management for custom artwork commissions
 */

/**
 * @swagger
 * /special-requests/types:
 *   get:
 *     summary: Get request types
 *     tags: [Special Requests]
 *     description: Get all available request types for dropdown selection
 *     responses:
 *       200:
 *         description: Request types retrieved successfully
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
 *                   example: "تم جلب أنواع الطلبات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     requestTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *                           icon:
 *                             type: string
 *       500:
 *         description: Server error
 */
router.get('/types', controller.getRequestTypes);

/**
 * @swagger
 * /special-requests:
 *   post:
 *     tags:
 *       - Special Requests
 *     summary: إنشاء طلب خاص
 *     description: إرسال طلب خاص لفنان محدد مع تفاصيل كاملة
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SpecialRequestCreate'
 *     responses:
 *       201:
 *         description: تم إنشاء الطلب الخاص بنجاح
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
 *                   example: "تم إنشاء الطلب الخاص بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialRequest:
 *                       $ref: '#/components/schemas/SpecialRequest'
 *       400:
 *         description: بيانات غير صالحة
 *       404:
 *         description: الفنان غير موجود
 *       500:
 *         description: خطأ في الخادم
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
 *     description: عرض الطلبات الخاصة التي أرسلها المستخدم مع فلترة وترتيب
 *     security:
 *       - BearerAuth: []
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
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, in_progress, review, completed, cancelled]
 *         description: تصفية حسب الحالة
 *       - name: requestType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [custom_artwork, portrait, logo_design, illustration, digital_art, traditional_art, animation, graphic_design, character_design, concept_art, other]
 *         description: تصفية حسب نوع الطلب
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: تصفية حسب الأولوية
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: ترتيب حسب الحقل
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: طريقة الترتيب
 *     responses:
 *       200:
 *         description: تم جلب طلبات المستخدم بنجاح
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
 *                   example: "تم جلب الطلبات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     requests:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/SpecialRequest'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalItems:
 *                           type: number
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                     statusCounts:
 *                       type: object
 *                       description: عدد الطلبات حسب الحالة
 *                     totalCount:
 *                       type: number
 *       401:
 *         description: غير مصرح
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/my', isAuthenticated, controller.getUserRequests);

/**
 * @swagger
 * /special-requests/artist:
 *   get:
 *     tags:
 *       - Special Requests
 *     summary: عرض طلبات الفنان
 *     description: عرض الطلبات الخاصة المرسلة للفنان (للفنانين فقط)
 *     security:
 *       - BearerAuth: []
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
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, in_progress, review, completed, cancelled]
 *         description: تصفية حسب الحالة
 *       - name: requestType
 *         in: query
 *         schema:
 *           type: string
 *           enum: [custom_artwork, portrait, logo_design, illustration, digital_art, traditional_art, animation, graphic_design, character_design, concept_art, other]
 *         description: تصفية حسب نوع الطلب
 *       - name: priority
 *         in: query
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: تصفية حسب الأولوية
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           default: createdAt
 *         description: ترتيب حسب الحقل
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: طريقة الترتيب
 *     responses:
 *       200:
 *         description: تم جلب طلبات الفنان بنجاح
 *       403:
 *         description: غير مصرح (ليس فنان)
 *       500:
 *         description: خطأ في الخادم
 */
router.get('/artist', isAuthenticated, controller.getArtistRequests);

/**
 * @swagger
 * /special-requests/cancellation-reasons:
 *   get:
 *     summary: Get cancellation reasons
 *     tags: [Special Requests]
 *     description: Get all available cancellation reasons for dropdown selection
 *     responses:
 *       200:
 *         description: Cancellation reasons retrieved successfully
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
 *                   example: "تم جلب أسباب الإلغاء بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     cancellationReasons:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           value:
 *                             type: string
 *                           label:
 *                             type: string
 *       500:
 *         description: Server error
 */
router.get('/cancellation-reasons', controller.getCancellationReasons);

/**
 * @swagger
 * /special-requests/{requestId}:
 *   get:
 *     tags:
 *       - Special Requests
 *     summary: تفاصيل طلب خاص
 *     description: عرض تفاصيل طلب خاص محدد مع معلومات الصلاحيات
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
 *                   example: "تم جلب تفاصيل الطلب بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialRequest:
 *                       $ref: '#/components/schemas/SpecialRequest'
 *                     userRelation:
 *                       type: object
 *                       properties:
 *                         isSender:
 *                           type: boolean
 *                         isArtist:
 *                           type: boolean
 *                         canEdit:
 *                           type: boolean
 *                         canAccept:
 *                           type: boolean
 *                         canReject:
 *                           type: boolean
 *                         canComplete:
 *                           type: boolean
 *                         canCancel:
 *                           type: boolean
 *       400:
 *         description: معرف الطلب غير صالح
 *       403:
 *         description: غير مصرح لك بعرض هذا الطلب
 *       404:
 *         description: الطلب غير موجود
 *       500:
 *         description: خطأ في الخادم
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
 *                 enum: [pending, accepted, rejected, in_progress, review, completed, cancelled]
 *                 description: الحالة الجديدة
 *               response:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: رد أو ملاحظات إضافية (اختياري)
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *                 description: تاريخ التسليم المتوقع (اختياري)
 *               quotedPrice:
 *                 type: number
 *                 minimum: 0
 *                 description: السعر المقتبس (اختياري)
 *     responses:
 *       200:
 *         description: تم تحديث حالة الطلب بنجاح
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialRequest:
 *                       $ref: '#/components/schemas/SpecialRequest'
 *       400:
 *         description: بيانات غير صالحة
 *       403:
 *         description: غير مصرح (ليس فنان)
 *       404:
 *         description: الطلب غير موجود
 *       500:
 *         description: خطأ في الخادم
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
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: الرد أو التعليق
 *               attachments:
 *                 type: array
 *                 maxItems: 5
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                     type:
 *                       type: string
 *                       enum: [image, document, reference]
 *                     name:
 *                       type: string
 *                       maxLength: 100
 *                     description:
 *                       type: string
 *                       maxLength: 200
 *                 description: مرفقات إضافية
 *     responses:
 *       200:
 *         description: تم إضافة الرد بنجاح
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
 *                   example: "تم إضافة الرد بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialRequest:
 *                       $ref: '#/components/schemas/SpecialRequest'
 *       400:
 *         description: بيانات غير صالحة
 *       403:
 *         description: غير مصرح لك بإضافة رد
 *       404:
 *         description: الطلب غير موجود
 *       500:
 *         description: خطأ في الخادم
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
 *     description: وضع علامة على الطلب الخاص كمكتمل مع تسليم الملفات النهائية (بواسطة الفنان)
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
 *               - deliverables
 *             properties:
 *               deliverables:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - url
 *                     - type
 *                     - name
 *                   properties:
 *                     url:
 *                       type: string
 *                       format: uri
 *                       description: رابط الملف النهائي
 *                     type:
 *                       type: string
 *                       enum: [final, preview, source, documentation]
 *                       description: نوع الملف
 *                     name:
 *                       type: string
 *                       maxLength: 100
 *                       description: اسم الملف
 *                     description:
 *                       type: string
 *                       maxLength: 200
 *                       description: وصف الملف
 *                 description: ملفات التسليم النهائية
 *               finalNote:
 *                 type: string
 *                 maxLength: 1000
 *                 description: ملاحظة نهائية
 *     responses:
 *       200:
 *         description: تم إكمال الطلب بنجاح
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
 *                   example: "تم إكمال الطلب بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialRequest:
 *                       $ref: '#/components/schemas/SpecialRequest'
 *       400:
 *         description: بيانات غير صالحة أو لا يمكن إكمال الطلب
 *       403:
 *         description: غير مصرح (ليس فنان)
 *       404:
 *         description: الطلب غير موجود
 *       500:
 *         description: خطأ في الخادم
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
 *   post:
 *     tags:
 *       - Special Requests
 *     summary: إلغاء طلب خاص
 *     description: إلغاء طلب خاص (يمكن للمرسل والفنان إلغاءه)
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 maxLength: 500
 *                 description: سبب الإلغاء
 *     responses:
 *       200:
 *         description: تم إلغاء الطلب بنجاح
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
 *                   example: "تم إلغاء الطلب الخاص بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     specialRequest:
 *                       $ref: '#/components/schemas/SpecialRequest'
 *       400:
 *         description: لا يمكن إلغاء الطلب في حالته الحالية
 *       403:
 *         description: غير مصرح لك بإلغاء هذا الطلب
 *       404:
 *         description: الطلب غير موجود
 *       500:
 *         description: خطأ في الخادم
 */
router.post(
  '/:requestId/cancel',
  isAuthenticated,
  isValidation(cancelSpecialRequestSchema),
  controller.cancelSpecialRequest
);

/**
 * @swagger
 * /special-requests/{requestId}:
 *   delete:
 *     tags:
 *       - Special Requests
 *     summary: حذف طلب خاص
 *     description: حذف طلب خاص نهائياً من قاعدة البيانات مع سبب الإلغاء (اختياري) (لصاحب الطلب فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: requestId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الطلب
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cancellationReason:
 *                 type: string
 *                 enum: [ordered_by_mistake, service_delayed, other_reasons]
 *                 description: سبب الإلغاء (اختياري)
 *                 example: "ordered_by_mistake"
 *     responses:
 *       200:
 *         description: تم حذف الطلب بنجاح
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
 *                   example: "تم حذف الطلب بنجاح"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       400:
 *         description: معرف الطلب غير صالح
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
 *                   example: "معرف الطلب غير صالح"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       403:
 *         description: غير مصرح لك بحذف هذا الطلب
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
 *                   example: "غير مصرح لك بحذف هذا الطلب"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       404:
 *         description: الطلب غير موجود
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
 *                   example: "الطلب غير موجود"
 *                 data:
 *                   type: object
 *                   nullable: true
 *       500:
 *         description: خطأ في الخادم
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:requestId', 
  isAuthenticated, 
  isValidation(deleteRequestSchema),
  controller.deleteRequest
);

/**
 * @swagger
 * components:
 *   schemas:
 *     SpecialRequest:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف الطلب
 *         title:
 *           type: string
 *           description: عنوان الطلب
 *         description:
 *           type: string
 *           description: وصف الطلب
 *         requestType:
 *           type: string
 *           enum: [custom_artwork, portrait, logo_design, illustration, digital_art, traditional_art, animation, graphic_design, character_design, concept_art, other]
 *           description: نوع الطلب
 *         requestTypeLabel:
 *           type: string
 *           description: تسمية نوع الطلب
 *         budget:
 *           type: number
 *           description: الميزانية المقترحة
 *         duration:
 *           type: number
 *           description: المدة المطلوبة بالأيام
 *         currency:
 *           type: string
 *           enum: [SAR, USD, EUR, AED]
 *           description: العملة
 *         quotedPrice:
 *           type: number
 *           nullable: true
 *           description: السعر المقتبس من الفنان
 *         finalPrice:
 *           type: number
 *           nullable: true
 *           description: السعر النهائي المتفق عليه
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected, in_progress, review, completed, cancelled]
 *           description: حالة الطلب
 *         statusLabel:
 *           type: string
 *           description: تسمية حالة الطلب
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: أولوية الطلب
 *         priorityLabel:
 *           type: string
 *           description: تسمية أولوية الطلب
 *         sender:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             displayName:
 *               type: string
 *             profileImage:
 *               type: string
 *             job:
 *               type: string
 *             rating:
 *               type: number
 *             reviewsCount:
 *               type: number
 *             isVerified:
 *               type: boolean
 *             role:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *           description: معلومات المرسل
 *         artist:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             displayName:
 *               type: string
 *             profileImage:
 *               type: string
 *             job:
 *               type: string
 *             rating:
 *               type: number
 *             reviewsCount:
 *               type: number
 *             isVerified:
 *               type: boolean
 *             role:
 *               type: string
 *             email:
 *               type: string
 *             phone:
 *               type: string
 *           description: معلومات الفنان
 *         category:
 *           type: object
 *           nullable: true
 *           properties:
 *             _id:
 *               type: string
 *             name:
 *               type: string
 *             image:
 *               type: string
 *           description: معلومات الفئة
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               size:
 *                 type: number
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *           description: المرفقات
 *         deliverables:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               size:
 *                 type: number
 *               uploadedAt:
 *                 type: string
 *                 format: date-time
 *           description: ملفات التسليم
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: علامات الطلب
 *         response:
 *           type: string
 *           nullable: true
 *           description: رد الفنان
 *         finalNote:
 *           type: string
 *           nullable: true
 *           description: ملاحظة نهائية
 *         currentProgress:
 *           type: number
 *           description: نسبة التقدم الحالية
 *         usedRevisions:
 *           type: number
 *           description: عدد التعديلات المستخدمة
 *         maxRevisions:
 *           type: number
 *           description: الحد الأقصى للتعديلات
 *         allowRevisions:
 *           type: boolean
 *           description: السماح بالتعديلات
 *         deadline:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: الموعد النهائي
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: تاريخ التسليم المتوقع
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ الإنشاء
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: تاريخ القبول
 *         completedAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: تاريخ الإكمال
 *         specifications:
 *           type: object
 *           nullable: true
 *           description: مواصفات العمل
 *         communicationPreferences:
 *           type: object
 *           nullable: true
 *           description: تفضيلات التواصل
 *         isPrivate:
 *           type: boolean
 *           description: هل الطلب خاص
 *         remainingDays:
 *           type: number
 *           nullable: true
 *           description: الأيام المتبقية للموعد النهائي
 *         canEdit:
 *           type: boolean
 *           description: هل يمكن تعديل الطلب
 *         canCancel:
 *           type: boolean
 *           description: هل يمكن إلغاء الطلب
 *         canComplete:
 *           type: boolean
 *           description: هل يمكن إكمال الطلب
 */

export default router;
