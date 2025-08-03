import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { authenticate as isAuthenticated, authenticate as verifyFirebaseToken } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  notificationIdSchema,
  notificationQuerySchema,
  fcmTokenSchema,
  createNotificationSchema,
  bulkNotificationSchema,
  notificationSettingsSchema,
  notificationStatsQuerySchema
} from './notification.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Notification management endpoints
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     description: Get paginated list of user notifications
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', isAuthenticated, notificationController.getNotifications);

/**
 * @swagger
 * /notifications/firebase:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: الحصول على إشعارات المستخدم (Firebase)
 *     description: استرجاع إشعارات المستخدم باستخدام مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/page'
 *       - $ref: '#/components/parameters/limit'
 *       - $ref: '#/components/parameters/language'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/NotificationListResponse'
 *     x-screen: "NotificationsScreen"
 */
router.get(
  '/firebase',
  verifyFirebaseToken,
  isValidation(notificationQuerySchema, 'query'),
  notificationController.getNotifications
);

/**
 * @swagger
 * /notifications/stats:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: الحصول على إحصائيات الإشعارات
 *     description: |
 *       جلب إحصائيات شاملة عن إشعارات المستخدم
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.get('/api/notifications/stats',
 *         queryParameters: {
 *           'period': 'month',
 *           'groupBy': 'type'
 *         }
 *       );
 *       ```
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["day", "week", "month", "year", "all"]
 *           default: "month"
 *         description: فترة الإحصائيات
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["type", "date", "status"]
 *         description: تجميع الإحصائيات حسب
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["ar", "en"]
 *           default: "ar"
 *         description: لغة الاستجابة
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         unread:
 *                           type: integer
 *                         read:
 *                           type: integer
 *                         readRate:
 *                           type: string
 *                     byType:
 *                       type: object
 *                     recentActivity:
 *                       type: array
 *     x-screen: "NotificationStatsScreen"
 */
// Stats endpoint temporarily disabled - function not implemented

/**
 * @swagger
 * /notifications/settings:
 *   get:
 *     summary: Get notification settings
 *     tags: [Notifications]
 *     description: Get user notification preferences
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/settings', isAuthenticated, notificationController.getNotificationSettings);

/**
 * @swagger
 * /notifications/settings:
 *   put:
 *     summary: Update notification settings
 *     tags: [Notifications]
 *     description: Update user notification preferences
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               notificationSettings:
 *                 type: object
 *                 properties:
 *                   pushNotifications:
 *                     type: boolean
 *                   emailNotifications:
 *                     type: boolean
 *                   messageNotifications:
 *                     type: boolean
 *                   followNotifications:
 *                     type: boolean
 *                   artworkNotifications:
 *                     type: boolean
 *                   marketingNotifications:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.put('/settings', isAuthenticated, notificationController.updateNotificationSettings);

/**
 * @swagger
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     description: Mark a specific notification as read
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.patch('/:notificationId/read', isAuthenticated, notificationController.markAsRead);

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     description: Mark all user notifications as read
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       500:
 *         description: Server error
 */
router.patch('/read-all', isAuthenticated, notificationController.markAllAsRead);

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     description: Delete a specific notification
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Server error
 */
router.delete('/:notificationId', isAuthenticated, notificationController.deleteNotification);

/**
 * @swagger
 * /notifications:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: حذف جميع الإشعارات
 *     description: |
 *       حذف جميع إشعارات المستخدم
 *       
 *       **تحذير:** هذا الإجراء لا يمكن التراجع عنه
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.delete('/api/notifications');
 *       ```
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["ar", "en"]
 *           default: "ar"
 *         description: لغة الاستجابة
 *     responses:
 *       200:
 *         description: تم حذف جميع الإشعارات بنجاح
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
 *                   example: "تم حذف جميع الإشعارات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: integer
 *                       example: 25
 *                     message:
 *                       type: string
 *                       example: "تم حذف 25 إشعار"
 *     x-screen: "NotificationsScreen"
 *   post:
 *     tags:
 *       - Notifications
 *     summary: إنشاء إشعار جديد (للمشرفين)
 *     description: |
 *       إنشاء إشعار جديد وإرساله لمستخدم محدد
 *       
 *       **ملاحظة:** هذا الـ API متاح للمشرفين فقط
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateNotificationSchema'
 *     responses:
 *       201:
 *         description: تم إنشاء الإشعار بنجاح
 *       400:
 *         description: خطأ في البيانات المرسلة
 *       404:
 *         description: المستخدم المتلقي غير موجود
 *     x-screen: "AdminNotificationScreen"
 */
router.delete('/', isAuthenticated, notificationController.deleteAllNotifications);
router.post(
  '/',
  isAuthenticated,
  isValidation(createNotificationSchema),
  notificationController.createNotification
);

/**
 * @swagger
 * /notifications/bulk:
 *   post:
 *     tags:
 *       - Notifications
 *     summary: إرسال إشعارات متعددة (للمشرفين)
 *     description: |
 *       إرسال إشعار واحد لعدة مستخدمين
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.post('/api/notifications/bulk',
 *         data: {
 *           'recipients': ['userId1', 'userId2', 'userId3'],
 *           'title': {
 *             'ar': 'إشعار عام',
 *             'en': 'General Notification'
 *           },
 *           'message': {
 *             'ar': 'رسالة مهمة لجميع المستخدمين',
 *             'en': 'Important message for all users'
 *           },
 *           'type': 'system'
 *         }
 *       );
 *       ```
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BulkNotificationSchema'
 *     responses:
 *       201:
 *         description: تم إرسال الإشعارات بنجاح
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
 *                   example: "تم إرسال 15 إشعار بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalSent:
 *                       type: integer
 *                       example: 15
 *                     totalRecipients:
 *                       type: integer
 *                       example: 20
 *                     validRecipients:
 *                       type: integer
 *                       example: 15
 *                     invalidRecipients:
 *                       type: integer
 *                       example: 5
 *       400:
 *         description: لا يوجد مستخدمون صالحون للإرسال
 *     x-screen: "AdminBulkNotificationScreen"
 */
// Bulk notifications endpoint temporarily disabled - function not implemented

/**
 * @swagger
 * /notifications/token:
 *   post:
 *     tags:
 *       - FCM Tokens
 *     summary: تسجيل رمز إشعارات FCM
 *     description: |
 *       تسجيل رمز FCM للإشعارات الفورية للمستخدم الحالي
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       // Get FCM token
 *       String? token = await FirebaseMessaging.instance.getToken();
 *       
 *       // Register token
 *       final response = await dio.post('/api/notifications/token',
 *         data: {
 *           'token': token,
 *           'deviceType': 'android' // or 'ios', 'web'
 *         }
 *       );
 *       ```
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FCMTokenSchema'
 *     responses:
 *       200:
 *         description: تم تسجيل الرمز بنجاح
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
 *                   example: "تم تسجيل رمز الإشعارات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                     deviceType:
 *                       type: string
 *                     registered:
 *                       type: boolean
 *       400:
 *         description: الرمز مطلوب أو غير صحيح
 *     x-screen: "SettingsScreen"
 *   delete:
 *     tags:
 *       - FCM Tokens
 *     summary: إلغاء تسجيل رمز إشعارات FCM
 *     description: |
 *       إلغاء تسجيل رمز FCM للإشعارات الفورية
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.delete('/api/notifications/token',
 *         data: {
 *           'token': fcmToken
 *         }
 *       );
 *       ```
 *     security:
 *       - BearerAuth: []
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
 *                 description: رمز FCM المراد إلغاء تسجيله
 *     responses:
 *       200:
 *         description: تم إلغاء تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 *     x-screen: "SettingsScreen"
 *   get:
 *     tags:
 *       - FCM Tokens
 *     summary: الحصول على رموز FCM للمستخدم
 *     description: |
 *       جلب جميع رموز FCM المسجلة للمستخدم الحالي
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.get('/api/notifications/token');
 *       ```
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الرموز بنجاح
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
 *                   example: "تم جلب رموز الإشعارات بنجاح"
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       token:
 *                         type: string
 *                       deviceType:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *     x-screen: "SettingsScreen"
 */
// FCM token endpoints - Unified for both Bearer and Firebase auth
router.post('/token', isAuthenticated, isValidation(fcmTokenSchema), notificationController.registerFCMToken);
router.delete('/token', isAuthenticated, isValidation(fcmTokenSchema), notificationController.unregisterFCMToken);
router.get('/token', isAuthenticated, notificationController.getUserFCMTokens);

/**
 * @swagger
 * /notifications/token/firebase:
 *   post:
 *     tags:
 *       - FCM Tokens
 *     summary: تسجيل رمز إشعارات FCM (Firebase) - DEPRECATED
 *     description: |
 *       ⚠️ DEPRECATED: This endpoint is deprecated.
 *       Please use `/api/notifications/token` instead for FCM token management.
 *       
 *       تسجيل رمز FCM للإشعارات الفورية باستخدام مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FCMTokenSchema'
 *     responses:
 *       200:
 *         description: تم تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 *     x-screen: "SettingsScreen"
 *     deprecated: true
 *   delete:
 *     tags:
 *       - FCM Tokens
 *     summary: إلغاء تسجيل رمز إشعارات FCM (Firebase) - DEPRECATED
 *     description: |
 *       ⚠️ DEPRECATED: This endpoint is deprecated.
 *       Please use `/api/notifications/token` instead for FCM token management.
 *       
 *       إلغاء تسجيل رمز FCM للإشعارات الفورية باستخدام مصادقة Firebase
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
 *                 description: رمز FCM المراد إلغاء تسجيله
 *     responses:
 *       200:
 *         description: تم إلغاء تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 *     x-screen: "SettingsScreen"
 *     deprecated: true
 */
// DEPRECATED: Firebase FCM token endpoints - Use /api/notifications/token instead

export default router;
