import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken } from '../../middleware/firebase-auth.middleware.js';

const router = Router();

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: الحصول على إشعارات المستخدم
 *     description: استرجاع جميع إشعارات المستخدم المسجل الدخول
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
 *           default: 20
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب الإشعارات بنجاح
 */
router.get('/', isAuthenticated, notificationController.getUserNotifications);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: وضع علامة "مقروء" على إشعار
 *     description: تعيين إشعار معين كمقروء
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الإشعار
 *     responses:
 *       200:
 *         description: تم تحديث حالة قراءة الإشعار بنجاح
 *       404:
 *         description: الإشعار غير موجود
 */
router.patch(
  '/:notificationId/read',
  isAuthenticated,
  notificationController.markNotificationAsRead
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: وضع علامة "مقروء" على جميع الإشعارات
 *     description: تعيين جميع إشعارات المستخدم كمقروءة
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم تحديث حالة قراءة جميع الإشعارات بنجاح
 */
router.patch('/read-all', isAuthenticated, notificationController.markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: حذف إشعار
 *     description: حذف إشعار معين
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الإشعار
 *     responses:
 *       200:
 *         description: تم حذف الإشعار بنجاح
 *       404:
 *         description: الإشعار غير موجود
 */
router.delete('/:notificationId', isAuthenticated, notificationController.deleteNotification);

/**
 * @swagger
 * /api/notifications:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: حذف جميع الإشعارات
 *     description: حذف جميع إشعارات المستخدم
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم حذف جميع الإشعارات بنجاح
 */
router.delete('/', isAuthenticated, notificationController.deleteAllNotifications);

/**
 * @swagger
 * /api/notifications/token:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: تسجيل رمز إشعارات FCM
 *     description: تسجيل رمز FCM للإشعارات الفورية للمستخدم الحالي
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: رمز FCM للإشعارات الفورية
 *     responses:
 *       200:
 *         description: تم تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 */
router.post('/token', isAuthenticated, notificationController.registerFCMToken);

/**
 * @swagger
 * /api/notifications/token:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: إلغاء تسجيل رمز إشعارات FCM
 *     description: إلغاء تسجيل رمز FCM للإشعارات الفورية للمستخدم الحالي
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: رمز FCM للإشعارات الفورية
 *     responses:
 *       200:
 *         description: تم إلغاء تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 */
router.delete('/token', isAuthenticated, notificationController.unregisterFCMToken);

/**
 * @swagger
 * /api/notifications/token/firebase:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: تسجيل رمز إشعارات FCM (Firebase)
 *     description: تسجيل رمز FCM للإشعارات الفورية باستخدام مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: رمز FCM للإشعارات الفورية
 *     responses:
 *       200:
 *         description: تم تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 */
router.post('/token/firebase', verifyFirebaseToken, notificationController.registerFCMToken);

/**
 * @swagger
 * /api/notifications/token/firebase:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: إلغاء تسجيل رمز إشعارات FCM (Firebase)
 *     description: إلغاء تسجيل رمز FCM للإشعارات الفورية باستخدام مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *                 description: رمز FCM للإشعارات الفورية
 *     responses:
 *       200:
 *         description: تم إلغاء تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 */
router.delete('/token/firebase', verifyFirebaseToken, notificationController.unregisterFCMToken);

export default router;
