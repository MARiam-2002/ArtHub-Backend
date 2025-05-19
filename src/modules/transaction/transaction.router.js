import { Router } from 'express';
import * as controller from './transaction.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import { 
  createArtworkTransactionSchema, 
  createSpecialRequestTransactionSchema,
  updateTransactionStatusSchema,
  updateTrackingInfoSchema
} from './transaction.validation.js';

const router = Router();

/**
 * @swagger
 * /api/transactions/artwork:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: شراء عمل فني
 *     description: إنشاء معاملة لشراء عمل فني
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artworkId
 *               - paymentMethod
 *               - shippingAddress
 *             properties:
 *               artworkId:
 *                 type: string
 *                 description: معرف العمل الفني
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, bank_transfer, paypal, stripe, other]
 *                 description: طريقة الدفع
 *               paymentId:
 *                 type: string
 *                 description: معرف عملية الدفع (اختياري)
 *               shippingAddress:
 *                 type: object
 *                 description: عنوان الشحن
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   addressLine1:
 *                     type: string
 *                   addressLine2:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   country:
 *                     type: string
 *                   phoneNumber:
 *                     type: string
 *     responses:
 *       201:
 *         description: تم إنشاء المعاملة بنجاح
 *       400:
 *         description: بيانات غير صالحة
 *       404:
 *         description: العمل الفني غير موجود
 */
router.post('/artwork', 
  isAuthenticated, 
  isValidation(createArtworkTransactionSchema), 
  controller.createArtworkTransaction
);

/**
 * @swagger
 * /api/transactions/special-request:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: الدفع لطلب خاص
 *     description: إنشاء معاملة لدفع قيمة طلب خاص
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - specialRequestId
 *               - paymentMethod
 *               - shippingAddress
 *             properties:
 *               specialRequestId:
 *                 type: string
 *                 description: معرف الطلب الخاص
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, bank_transfer, paypal, stripe, other]
 *                 description: طريقة الدفع
 *               paymentId:
 *                 type: string
 *                 description: معرف عملية الدفع (اختياري)
 *               shippingAddress:
 *                 type: object
 *                 description: عنوان الشحن
 *     responses:
 *       201:
 *         description: تم إنشاء المعاملة بنجاح
 *       400:
 *         description: بيانات غير صالحة
 *       404:
 *         description: الطلب الخاص غير موجود
 */
router.post('/special-request', 
  isAuthenticated, 
  isValidation(createSpecialRequestTransactionSchema), 
  controller.createSpecialRequestTransaction
);

/**
 * @swagger
 * /api/transactions/{transactionId}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: تفاصيل المعاملة
 *     description: عرض تفاصيل معاملة محددة
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المعاملة
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل المعاملة بنجاح
 *       404:
 *         description: المعاملة غير موجودة
 */
router.get('/:transactionId', 
  isAuthenticated, 
  controller.getTransactionById
);

/**
 * @swagger
 * /api/transactions/{transactionId}/status:
 *   patch:
 *     tags:
 *       - Transactions
 *     summary: تحديث حالة المعاملة
 *     description: تحديث حالة معاملة محددة (للمدير أو البائع فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المعاملة
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
 *                 enum: [pending, completed, failed, refunded]
 *                 description: حالة المعاملة الجديدة
 *               notes:
 *                 type: string
 *                 description: ملاحظات إضافية
 *               trackingInfo:
 *                 type: object
 *                 description: معلومات التتبع
 *     responses:
 *       200:
 *         description: تم تحديث حالة المعاملة بنجاح
 *       403:
 *         description: غير مصرح لك بتعديل هذه المعاملة
 *       404:
 *         description: المعاملة غير موجودة
 */
router.patch('/:transactionId/status', 
  isAuthenticated, 
  isValidation(updateTransactionStatusSchema), 
  controller.updateTransactionStatus
);

/**
 * @swagger
 * /api/transactions/{transactionId}/tracking:
 *   patch:
 *     tags:
 *       - Transactions
 *     summary: تحديث معلومات الشحن
 *     description: تحديث معلومات شحن وتتبع معاملة (للبائع فقط)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المعاملة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - provider
 *               - trackingNumber
 *             properties:
 *               provider:
 *                 type: string
 *                 description: مزود خدمة الشحن
 *               trackingNumber:
 *                 type: string
 *                 description: رقم التتبع
 *               trackingUrl:
 *                 type: string
 *                 description: رابط تتبع الشحنة
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *                 description: تاريخ التسليم المتوقع
 *     responses:
 *       200:
 *         description: تم تحديث معلومات الشحن بنجاح
 *       403:
 *         description: غير مصرح لك بتعديل هذه المعاملة
 *       404:
 *         description: المعاملة غير موجودة
 */
router.patch('/:transactionId/tracking', 
  isAuthenticated, 
  isValidation(updateTrackingInfoSchema), 
  controller.updateTrackingInfo
);

/**
 * @swagger
 * /api/transactions/buyer/history:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: سجل المشتريات
 *     description: عرض سجل معاملات الشراء للمستخدم
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
 *           enum: [pending, completed, failed, refunded]
 *         description: تصفية حسب الحالة
 *     responses:
 *       200:
 *         description: تم جلب سجل المشتريات بنجاح
 */
router.get('/buyer/history', 
  isAuthenticated, 
  controller.getBuyerTransactions
);

/**
 * @swagger
 * /api/transactions/seller/history:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: سجل المبيعات
 *     description: عرض سجل معاملات البيع للفنان
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
 *           enum: [pending, completed, failed, refunded]
 *         description: تصفية حسب الحالة
 *     responses:
 *       200:
 *         description: تم جلب سجل المبيعات بنجاح
 */
router.get('/seller/history', 
  isAuthenticated, 
  controller.getSellerTransactions
);

/**
 * @swagger
 * /api/transactions/seller/stats:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: إحصائيات المبيعات
 *     description: عرض إحصائيات البيع للفنان
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات المبيعات بنجاح
 *       403:
 *         description: غير مصرح لك بعرض إحصائيات المبيعات
 */
router.get('/seller/stats', 
  isAuthenticated, 
  controller.getSellerStats
);

/**
 * @swagger
 * /api/transactions/admin/stats:
 *   get:
 *     tags:
 *       - Transactions
 *       - Admin
 *     summary: إحصائيات المعاملات للمدير
 *     description: عرض إحصائيات جميع المعاملات في المنصة (للمدير فقط)
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب إحصائيات المعاملات بنجاح
 *       403:
 *         description: غير مصرح لك بعرض إحصائيات المعاملات
 */
router.get('/admin/stats', 
  isAuthenticated, 
  controller.getAdminStats
);

export default router; 