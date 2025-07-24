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
 *     summary: جلب جميع الطلبات الخاصة (Special Requests)
 *     tags: [Order Management]
 *     description: جلب قائمة الطلبات الخاصة مع الـ pagination (limit 10 افتراضياً)
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
 *           default: 10
 *         description: عدد العناصر في الصفحة (افتراضي 10)
 *     responses:
 *       200:
 *         description: تم جلب الطلبات الخاصة بنجاح
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
 *                   example: "تم جلب الطلبات الخاصة بنجاح"
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
 *                               displayName:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                           customer:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               displayName:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                           status:
 *                             type: string
 *                             example: "قيد الانتظار"
 *                           requestType:
 *                             type: string
 *                             example: "عمل فني مخصص"
 *                           priority:
 *                             type: string
 *                             example: "متوسطة"
 *                           deadline:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-02-18T10:30:00.000Z"
 *                           estimatedDelivery:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-02-15T10:30:00.000Z"
 *                           currentProgress:
 *                             type: number
 *                             example: 75
 *                           attachments:
 *                             type: array
 *                             items:
 *                               type: object
 *                           deliverables:
 *                             type: array
 *                             items:
 *                               type: object
 *                           orderType:
 *                             type: string
 *                             example: "special_request"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                     filters:
 *                       type: object
 *                       properties:
 *                         availableStatuses:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: string
 *                                 example: "pending"
 *                               label:
 *                                 type: string
 *                                 example: "قيد الانتظار"
 *                               color:
 *                                 type: string
 *                                 example: "#FF9800"
 *       401:
 *         description: غير مصرح
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
 *                   example: "غير مصرح"
 *       403:
 *         description: ممنوع - للمديرين فقط
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
 *                   example: "غير مصرح لك بالوصول لهذا المورد"
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