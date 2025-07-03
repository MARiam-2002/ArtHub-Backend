import { Router } from 'express';
import * as controller from './transaction.controller.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  createTransactionSchema,
  transactionIdSchema,
  transactionQuerySchema,
  updateTransactionStatusSchema,
  updateTrackingInfoSchema,
  refundRequestSchema,
  createDisputeSchema,
  transactionStatsQuerySchema,
  bulkUpdateTransactionsSchema,
  exportTransactionsSchema,
  installmentPaymentSchema
} from './transaction.validation.js';

const router = Router();

/**
 * @swagger
 * /api/transactions:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: إنشاء معاملة جديدة
 *     description: إنشاء معاملة لشراء عمل فني أو دفع طلب خاص مع دعم التقسيط والخصومات
 *     x-screen: checkout_screen
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTransactionRequest'
 *           examples:
 *             artwork_purchase:
 *               summary: شراء عمل فني
 *               value:
 *                 items:
 *                   - artworkId: "507f1f77bcf86cd799439011"
 *                     quantity: 1
 *                 payment:
 *                   method: "credit_card"
 *                   provider: "stripe"
 *                   transactionId: "pi_1234567890"
 *                   cardLast4: "4242"
 *                   cardBrand: "visa"
 *                 shipping:
 *                   address:
 *                     fullName: "أحمد محمد"
 *                     addressLine1: "شارع الملك فهد، حي النخيل"
 *                     city: "الرياض"
 *                     country: "SA"
 *                     phoneNumber: "+966501234567"
 *                   method: "standard"
 *                 notes: "يرجى التعامل بحذر مع اللوحة"
 *             special_request_payment:
 *               summary: دفع طلب خاص
 *               value:
 *                 items:
 *                   - specialRequestId: "507f1f77bcf86cd799439012"
 *                     quantity: 1
 *                 payment:
 *                   method: "mada"
 *                   provider: "hyperpay"
 *                   transactionId: "8ac7a4a27e4e2b5e017e4e3b6c123456"
 *                 shipping:
 *                   address:
 *                     fullName: "فاطمة علي"
 *                     addressLine1: "طريق الأمير محمد بن عبد العزيز"
 *                     city: "جدة"
 *                     country: "SA"
 *                     phoneNumber: "+966551234567"
 *                   method: "express"
 *             installment_purchase:
 *               summary: شراء بالتقسيط
 *               value:
 *                 items:
 *                   - artworkId: "507f1f77bcf86cd799439013"
 *                     quantity: 1
 *                 payment:
 *                   method: "credit_card"
 *                   provider: "stripe"
 *                 shipping:
 *                   address:
 *                     fullName: "محمد سالم"
 *                     addressLine1: "شارع التحلية"
 *                     city: "الخبر"
 *                     country: "SA"
 *                     phoneNumber: "+966501234567"
 *                 installments:
 *                   enabled: true
 *                   totalInstallments: 6
 *     responses:
 *       201:
 *         description: تم إنشاء المعاملة بنجاح
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
 *                   example: "تم إنشاء المعاملة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: بيانات غير صالحة
 *       403:
 *         description: غير مصرح
 *       404:
 *         description: العنصر غير موجود
 */
router.post(
  '/',
  isAuthenticated,
  isValidation(createTransactionSchema),
  controller.createTransaction
);

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: قائمة معاملات المستخدم
 *     description: الحصول على قائمة معاملات المستخدم مع فلترة وبحث متقدم
 *     x-screen: transactions_list_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: عدد النتائج في الصفحة
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *           enum: [pending, processing, confirmed, shipped, delivered, completed, cancelled, refunded, disputed]
 *         description: فلترة حسب الحالة
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [buying, selling, all]
 *           default: all
 *         description: نوع المعاملة
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية
 *       - name: minAmount
 *         in: query
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: الحد الأدنى للمبلغ
 *       - name: maxAmount
 *         in: query
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: الحد الأقصى للمبلغ
 *       - name: search
 *         in: query
 *         schema:
 *           type: string
 *           maxLength: 100
 *         description: البحث في رقم المعاملة أو الملاحظات
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, totalAmount, status, transactionNumber]
 *           default: createdAt
 *         description: معيار الترتيب
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: اتجاه الترتيب
 *     responses:
 *       200:
 *         description: تم جلب المعاملات بنجاح
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
 *                   example: "تم جلب المعاملات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalTransactions:
 *                           type: integer
 *                         totalAmount:
 *                           type: number
 *                         averageAmount:
 *                           type: number
 */
router.get(
  '/',
  isAuthenticated,
  isValidation(transactionQuerySchema),
  controller.getUserTransactions
);

/**
 * @swagger
 * /api/transactions/stats:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: إحصائيات المعاملات
 *     description: الحصول على إحصائيات شاملة لمعاملات المستخدم
 *     x-screen: transaction_stats_screen
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
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية (للفترة المخصصة)
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية (للفترة المخصصة)
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [status, method, currency, date]
 *           default: status
 *         description: معيار التجميع
 *       - name: includeRefunds
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين المعاملات المستردة
 *       - name: includeDisputes
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين المعاملات المتنازع عليها
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
 *                     summary:
 *                       type: object
 *                       properties:
 *                         buyer:
 *                           type: object
 *                         seller:
 *                           type: object
 *                         combined:
 *                           type: object
 *                     detailed:
 *                       type: array
 *                       items:
 *                         type: object
 *                     additional:
 *                       type: object
 */
router.get(
  '/stats',
  isAuthenticated,
  isValidation(transactionStatsQuerySchema),
  controller.getTransactionStats
);

/**
 * @swagger
 * /api/transactions/export:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: تصدير بيانات المعاملات
 *     description: تصدير بيانات المعاملات بتنسيقات مختلفة (CSV, Excel, PDF)
 *     x-screen: export_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: format
 *         in: query
 *         schema:
 *           type: string
 *           enum: [csv, excel, pdf]
 *           default: csv
 *         description: تنسيق التصدير
 *       - name: startDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية
 *       - name: endDate
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية
 *       - name: status
 *         in: query
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *             enum: [pending, processing, confirmed, shipped, delivered, completed, cancelled, refunded, disputed]
 *         description: حالات المعاملات المراد تصديرها
 *       - name: includeItems
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين تفاصيل العناصر
 *       - name: includeShipping
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *         description: تضمين تفاصيل الشحن
 *       - name: includePayment
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *         description: تضمين تفاصيل الدفع
 *     responses:
 *       200:
 *         description: تم تصدير البيانات بنجاح
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/export',
  isAuthenticated,
  isValidation(exportTransactionsSchema),
  controller.exportTransactions
);

/**
 * @swagger
 * /api/transactions/bulk:
 *   patch:
 *     tags:
 *       - Transactions
 *     summary: العمليات المجمعة على المعاملات
 *     description: تحديث حالة عدة معاملات في عملية واحدة (للمدير فقط)
 *     x-screen: admin_bulk_operations_screen
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionIds
 *               - action
 *             properties:
 *               transactionIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   pattern: '^[0-9a-fA-F]{24}$'
 *                 minItems: 1
 *                 maxItems: 50
 *                 description: معرفات المعاملات
 *               action:
 *                 type: string
 *                 enum: [cancel, confirm, ship, complete]
 *                 description: الإجراء المطلوب
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *                 description: سبب الإجراء
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: ملاحظات إضافية
 *           example:
 *             transactionIds: 
 *               - "507f1f77bcf86cd799439011"
 *               - "507f1f77bcf86cd799439012"
 *             action: "confirm"
 *             reason: "تم التحقق من الدفع"
 *             notes: "تأكيد جماعي للمعاملات"
 *     responses:
 *       200:
 *         description: تم تحديث المعاملات بنجاح
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
 *                   example: "تم تحديث 5 معاملة من أصل 5"
 *                 data:
 *                   type: object
 *                   properties:
 *                     results:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           transactionId:
 *                             type: string
 *                           transactionNumber:
 *                             type: string
 *                           success:
 *                             type: boolean
 *                           newStatus:
 *                             type: string
 *                           error:
 *                             type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         successful:
 *                           type: integer
 *                         failed:
 *                           type: integer
 *       403:
 *         description: غير مصرح (المدير فقط)
 */
router.patch(
  '/bulk',
  isAuthenticated,
  isValidation(bulkUpdateTransactionsSchema),
  controller.bulkUpdateTransactions
);

/**
 * @swagger
 * /api/transactions/{transactionId}:
 *   get:
 *     tags:
 *       - Transactions
 *     summary: تفاصيل المعاملة
 *     description: عرض تفاصيل معاملة محددة مع جميع المعلومات والتاريخ
 *     x-screen: transaction_details_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف المعاملة
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل المعاملة بنجاح
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
 *                   example: "تم جلب تفاصيل المعاملة بنجاح"
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Transaction'
 *                     - type: object
 *                       properties:
 *                         userRole:
 *                           type: string
 *                           enum: [buyer, seller]
 *                           description: دور المستخدم في المعاملة
 *                         canCancel:
 *                           type: boolean
 *                           description: إمكانية إلغاء المعاملة
 *                         canRefund:
 *                           type: boolean
 *                           description: إمكانية طلب الاسترداد
 *                         canDispute:
 *                           type: boolean
 *                           description: إمكانية فتح نزاع
 *       403:
 *         description: غير مصرح لك بعرض هذه المعاملة
 *       404:
 *         description: المعاملة غير موجودة
 */
router.get(
  '/:transactionId',
  isAuthenticated,
  isValidation(transactionIdSchema),
  controller.getTransactionById
);

/**
 * @swagger
 * /api/transactions/{transactionId}/status:
 *   patch:
 *     tags:
 *       - Transactions
 *     summary: تحديث حالة المعاملة
 *     description: تحديث حالة معاملة محددة (للبائع أو المدير فقط)
 *     x-screen: seller_order_management_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
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
 *                 enum: [pending, processing, confirmed, shipped, delivered, completed, cancelled, refunded, disputed]
 *                 description: الحالة الجديدة
 *               reason:
 *                 type: string
 *                 maxLength: 200
 *                 description: سبب التحديث
 *               notes:
 *                 type: string
 *                 maxLength: 1000
 *                 description: ملاحظات إضافية
 *               trackingInfo:
 *                 type: object
 *                 description: معلومات التتبع (عند الشحن)
 *                 properties:
 *                   provider:
 *                     type: string
 *                     maxLength: 50
 *                   trackingNumber:
 *                     type: string
 *                     maxLength: 100
 *                   trackingUrl:
 *                     type: string
 *                     format: uri
 *                   estimatedDelivery:
 *                     type: string
 *                     format: date-time
 *           examples:
 *             confirm_order:
 *               summary: تأكيد الطلب
 *               value:
 *                 status: "confirmed"
 *                 reason: "تم التحقق من الدفع"
 *                 notes: "الطلب جاهز للشحن"
 *             ship_order:
 *               summary: شحن الطلب
 *               value:
 *                 status: "shipped"
 *                 reason: "تم الشحن"
 *                 trackingInfo:
 *                   provider: "aramex"
 *                   trackingNumber: "ARX123456789"
 *                   trackingUrl: "https://www.aramex.com/track/results?ShipmentNumber=ARX123456789"
 *                   estimatedDelivery: "2024-02-15T12:00:00Z"
 *     responses:
 *       200:
 *         description: تم تحديث حالة المعاملة بنجاح
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
 *                   example: "تم تحديث حالة المعاملة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: انتقال حالة غير صالح
 *       403:
 *         description: غير مصرح لك بتعديل هذه المعاملة
 *       404:
 *         description: المعاملة غير موجودة
 */
router.patch(
  '/:transactionId/status',
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
 *     summary: تحديث معلومات التتبع
 *     description: تحديث معلومات تتبع الشحن (للبائع أو المدير فقط)
 *     x-screen: shipping_management_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
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
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: مزود الشحن
 *               trackingNumber:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: رقم التتبع
 *               trackingUrl:
 *                 type: string
 *                 format: uri
 *                 description: رابط التتبع
 *               estimatedDelivery:
 *                 type: string
 *                 format: date-time
 *                 description: تاريخ التسليم المتوقع
 *               status:
 *                 type: string
 *                 enum: [pending, shipped, in_transit, delivered, returned]
 *                 default: shipped
 *                 description: حالة الشحن
 *           example:
 *             provider: "aramex"
 *             trackingNumber: "ARX123456789"
 *             trackingUrl: "https://www.aramex.com/track/results?ShipmentNumber=ARX123456789"
 *             estimatedDelivery: "2024-02-15T12:00:00Z"
 *             status: "shipped"
 *     responses:
 *       200:
 *         description: تم تحديث معلومات التتبع بنجاح
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
 *                   example: "تم تحديث معلومات التتبع بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/ShippingDetails'
 *       403:
 *         description: غير مصرح لك بتعديل معلومات التتبع
 *       404:
 *         description: المعاملة غير موجودة
 */
router.patch(
  '/:transactionId/tracking',
  isAuthenticated,
  isValidation(updateTrackingInfoSchema),
  controller.updateTrackingInfo
);

/**
 * @swagger
 * /api/transactions/{transactionId}/refund:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: طلب استرداد
 *     description: تقديم طلب استرداد كامل أو جزئي للمعاملة (للمشتري فقط)
 *     x-screen: refund_request_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف المعاملة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: مبلغ الاسترداد (للاسترداد الجزئي)
 *               reason:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: سبب طلب الاسترداد
 *               type:
 *                 type: string
 *                 enum: [full, partial]
 *                 default: full
 *                 description: نوع الاسترداد
 *           examples:
 *             full_refund:
 *               summary: استرداد كامل
 *               value:
 *                 reason: "العمل الفني لا يطابق الوصف المذكور في الإعلان"
 *                 type: "full"
 *             partial_refund:
 *               summary: استرداد جزئي
 *               value:
 *                 amount: 150.00
 *                 reason: "العمل الفني به عيب بسيط لكنه قابل للاستخدام"
 *                 type: "partial"
 *     responses:
 *       200:
 *         description: تم تقديم طلب الاسترداد بنجاح
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
 *                   example: "تم تقديم طلب الاسترداد بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     requested:
 *                       type: boolean
 *                     requestedAt:
 *                       type: string
 *                       format: date-time
 *                     requestedBy:
 *                       type: string
 *                     reason:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     status:
 *                       type: string
 *                       enum: [pending, approved, rejected, processed]
 *       400:
 *         description: لا يمكن طلب الاسترداد لهذه المعاملة
 *       403:
 *         description: غير مصرح لك بطلب استرداد لهذه المعاملة
 *       404:
 *         description: المعاملة غير موجودة
 */
router.post(
  '/:transactionId/refund',
  isAuthenticated,
  isValidation(refundRequestSchema),
  controller.requestRefund
);

/**
 * @swagger
 * /api/transactions/{transactionId}/dispute:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: فتح نزاع
 *     description: فتح نزاع للمعاملة (للمشتري أو البائع)
 *     x-screen: dispute_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف المعاملة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reason
 *               - description
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [not_received, not_as_described, damaged, unauthorized, other]
 *                 description: سبب النزاع
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 1000
 *                 description: وصف مفصل للمشكلة
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *                 maxItems: 10
 *                 description: روابط الأدلة (صور، مستندات)
 *           example:
 *             reason: "not_as_described"
 *             description: "العمل الفني المستلم يختلف تماماً عن الصور المعروضة في الإعلان. الألوان مختلفة والحجم أصغر من المذكور."
 *             evidence:
 *               - "https://example.com/evidence1.jpg"
 *               - "https://example.com/evidence2.jpg"
 *     responses:
 *       200:
 *         description: تم فتح النزاع بنجاح
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
 *                   example: "تم فتح النزاع بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     active:
 *                       type: boolean
 *                     openedAt:
 *                       type: string
 *                       format: date-time
 *                     openedBy:
 *                       type: string
 *                     reason:
 *                       type: string
 *                     description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [open, investigating, resolved, closed]
 *       400:
 *         description: لا يمكن فتح نزاع لهذه المعاملة
 *       403:
 *         description: غير مصرح لك بفتح نزاع لهذه المعاملة
 *       404:
 *         description: المعاملة غير موجودة
 */
router.post(
  '/:transactionId/dispute',
  isAuthenticated,
  isValidation(createDisputeSchema),
  controller.openDispute
);

/**
 * @swagger
 * /api/transactions/{transactionId}/installments/{installmentNumber}:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: دفع قسط
 *     description: دفع قسط محدد من أقساط المعاملة (للمشتري فقط)
 *     x-screen: installment_payment_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف المعاملة
 *       - name: installmentNumber
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: رقم القسط
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentMethod
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: مبلغ القسط (اختياري، سيتم استخدام المبلغ المحدد مسبقاً)
 *               paymentMethod:
 *                 type: string
 *                 enum: [credit_card, debit_card, bank_transfer, paypal, stripe, apple_pay, google_pay, mada, stc_pay, other]
 *                 description: طريقة الدفع
 *               paymentId:
 *                 type: string
 *                 maxLength: 100
 *                 description: معرف عملية الدفع من مزود الخدمة
 *           example:
 *             paymentMethod: "credit_card"
 *             paymentId: "pi_1234567890abcdef"
 *     responses:
 *       200:
 *         description: تم دفع القسط بنجاح
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
 *                   example: "تم دفع القسط بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     installment:
 *                       type: object
 *                       properties:
 *                         installmentNumber:
 *                           type: integer
 *                         amount:
 *                           type: number
 *                         dueDate:
 *                           type: string
 *                           format: date-time
 *                         paidAt:
 *                           type: string
 *                           format: date-time
 *                         status:
 *                           type: string
 *                           enum: [pending, paid, overdue, failed]
 *                     installmentProgress:
 *                       type: object
 *                       properties:
 *                         percentage:
 *                           type: number
 *                         remaining:
 *                           type: integer
 *                         nextAmount:
 *                           type: number
 *                     transactionStatus:
 *                       type: string
 *       400:
 *         description: القسط مدفوع مسبقاً أو المعاملة لا تستخدم التقسيط
 *       403:
 *         description: غير مصرح لك بدفع أقساط هذه المعاملة
 *       404:
 *         description: المعاملة أو القسط غير موجود
 */
router.post(
  '/:transactionId/installments/:installmentNumber',
  isAuthenticated,
  isValidation(installmentPaymentSchema),
  controller.payInstallment
);

/**
 * @swagger
 * /api/transactions/{transactionId}/cancel:
 *   post:
 *     tags:
 *       - Transactions
 *     summary: إلغاء معاملة
 *     description: إلغاء معاملة في حالة الانتظار أو المعالجة (للمشتري أو المدير)
 *     x-screen: cancel_transaction_screen
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: transactionId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف المعاملة
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: سبب الإلغاء
 *           example:
 *             reason: "تغيير في الخطط، لم أعد بحاجة للعمل الفني"
 *     responses:
 *       200:
 *         description: تم إلغاء المعاملة بنجاح
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
 *                   example: "تم إلغاء المعاملة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Transaction'
 *       400:
 *         description: لا يمكن إلغاء المعاملة في حالتها الحالية
 *       403:
 *         description: غير مصرح لك بإلغاء هذه المعاملة
 *       404:
 *         description: المعاملة غير موجودة
 */
router.post(
  '/:transactionId/cancel',
  isAuthenticated,
  isValidation(transactionIdSchema),
  controller.cancelTransaction
);

export default router;
