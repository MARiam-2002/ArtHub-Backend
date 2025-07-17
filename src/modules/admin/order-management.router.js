import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as orderManagementController from './order-management.controller.js';
import * as orderManagementValidation from './order-management.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Order Management
 *   description: إدارة الطلبات - لوحة تحكم الإدارة
 */

/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: جلب جميع الطلبات مع الفلترة والبحث
 *     tags: [Order Management]
 *     description: جلب قائمة الطلبات مع إمكانية الفلترة حسب الفنان، الحالة، التاريخ والبحث النصي
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
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: البحث في عنوان الطلب، الوصف، اسم الفنان أو العميل
 *       - in: query
 *         name: artistId
 *         schema:
 *           type: string
 *         description: فلترة حسب الفنان
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, in_progress, review, completed, cancelled]
 *         description: فلترة حسب حالة الطلب
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية للفلترة
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية للفلترة
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, title, price, status]
 *           default: createdAt
 *         description: ترتيب النتائج
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: اتجاه الترتيب
 *       - in: query
 *         name: export
 *         schema:
 *           type: boolean
 *           default: false
 *         description: تصدير البيانات
 *     responses:
 *       200:
 *         description: تم جلب الطلبات بنجاح
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
 *                     orders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           title:
 *                             type: string
 *                             example: "لوحة زيتية مخصصة"
 *                           description:
 *                             type: string
 *                             example: "وصف الطلب"
 *                           price:
 *                             type: number
 *                             example: 850
 *                           currency:
 *                             type: string
 *                             example: "SAR"
 *                           orderDate:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-18T10:30:00.000Z"
 *                           artist:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                                 example: "أحمد محمد"
 *                               profileImage:
 *                                 type: string
 *                           customer:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                                 example: "منى سالم"
 *                               profileImage:
 *                                 type: string
 *                           status:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                                 example: "completed"
 *                               label:
 *                                 type: string
 *                                 example: "مكتمل"
 *                               color:
 *                                 type: string
 *                                 example: "#4CAF50"
 *                           requestType:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                                 example: "custom_artwork"
 *                               label:
 *                                 type: string
 *                                 example: "عمل فني مخصص"
 *                           priority:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                                 example: "medium"
 *                               label:
 *                                 type: string
 *                                 example: "متوسطة"
 *                           deadline:
 *                             type: string
 *                             format: date-time
 *                           estimatedDelivery:
 *                             type: string
 *                             format: date-time
 *                           currentProgress:
 *                             type: number
 *                             example: 100
 *                           attachments:
 *                             type: array
 *                           deliverables:
 *                             type: array
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 20
 *                         total:
 *                           type: integer
 *                           example: 150
 *                         pages:
 *                           type: integer
 *                           example: 8
 *                     filters:
 *                       type: object
 *                       properties:
 *                         availableArtists:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               name:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                               orderCount:
 *                                 type: integer
 *                         availableStatuses:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                               label:
 *                                 type: string
 *                               color:
 *                                 type: string
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 */
router.get('/orders',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(orderManagementValidation.getAllOrdersSchema),
  orderManagementController.getAllOrders
);

/**
 * @swagger
 * /api/admin/orders/{id}/status:
 *   patch:
 *     summary: تحديث حالة الطلب
 *     tags: [Order Management]
 *     description: تحديث حالة الطلب مع إرسال إشعارات للمستخدمين
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 description: الحالة الجديدة للطلب
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
 *                   example: "تم تحديث حالة الطلب بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     status:
 *                       type: object
 *                       properties:
 *                         value:
 *                           type: string
 *                           example: "completed"
 *                         label:
 *                           type: string
 *                           example: "مكتمل"
 *                         color:
 *                           type: string
 *                           example: "#4CAF50"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *       400:
 *         description: بيانات غير صحيحة
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 *       404:
 *         description: الطلب غير موجود
 */
router.patch('/orders/:id/status',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(orderManagementValidation.updateOrderStatusSchema),
  orderManagementController.updateOrderStatus
);

/**
 * @swagger
 * /api/admin/orders/{id}:
 *   delete:
 *     summary: حذف طلب
 *     tags: [Order Management]
 *     description: حذف طلب (حذف ناعم)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الطلب
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
 *                   type: null
 *       400:
 *         description: معرف الطلب غير صالح
 *       401:
 *         description: غير مصرح
 *       403:
 *         description: ممنوع - للمديرين فقط
 *       404:
 *         description: الطلب غير موجود
 */
router.delete('/orders/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(orderManagementValidation.deleteOrderSchema),
  orderManagementController.deleteOrder
);

export default router; 