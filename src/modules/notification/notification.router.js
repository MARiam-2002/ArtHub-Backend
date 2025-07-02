import { Router } from 'express';
import * as notificationController from './notification.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken } from '../../middleware/firebase-auth.middleware.js';
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
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: الحصول على إشعارات المستخدم مع فلترة متقدمة
 *     description: |
 *       استرجاع إشعارات المستخدم مع إمكانيات فلترة وتصفح متقدمة
 *       
 *       **مميزات الـ API:**
 *       - فلترة حسب النوع والحالة والتاريخ
 *       - ترقيم الصفحات مع معلومات شاملة
 *       - دعم اللغتين العربية والإنجليزية
 *       - إحصائيات سريعة (المجموع، غير المقروء، المقروء)
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       // GET /api/notifications
 *       final response = await dio.get('/api/notifications', 
 *         queryParameters: {
 *           'page': 1,
 *           'limit': 20,
 *           'unreadOnly': false,
 *           'type': 'message',
 *           'language': 'ar'
 *         }
 *       );
 *       ```
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
 *         example: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: عدد العناصر في الصفحة
 *         example: 20
 *       - name: unreadOnly
 *         in: query
 *         schema:
 *           type: boolean
 *         description: عرض الإشعارات غير المقروءة فقط
 *         example: false
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["request", "message", "review", "system", "other"]
 *         description: فلترة حسب نوع الإشعار
 *         example: "message"
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["ar", "en"]
 *           default: "ar"
 *         description: لغة الإشعارات
 *         example: "ar"
 *       - name: dateFrom
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ البداية للفلترة
 *         example: "2024-01-01"
 *       - name: dateTo
 *         in: query
 *         schema:
 *           type: string
 *           format: date
 *         description: تاريخ النهاية للفلترة
 *         example: "2024-12-31"
 *     responses:
 *       200:
 *         description: تم جلب الإشعارات بنجاح
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
 *                   example: "تم جلب الإشعارات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     notifications:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           title:
 *                             type: string
 *                             example: "رسالة جديدة"
 *                           message:
 *                             type: string
 *                             example: "لديك رسالة جديدة من أحمد"
 *                           type:
 *                             type: string
 *                             example: "message"
 *                           isRead:
 *                             type: boolean
 *                             example: false
 *                           sender:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               displayName:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                           data:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: integer
 *                           example: 1
 *                         totalPages:
 *                           type: integer
 *                           example: 5
 *                         totalItems:
 *                           type: integer
 *                           example: 95
 *                         unreadCount:
 *                           type: integer
 *                           example: 12
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 95
 *                         unread:
 *                           type: integer
 *                           example: 12
 *                         read:
 *                           type: integer
 *                           example: 83
 *       400:
 *         description: خطأ في المعاملات
 *       401:
 *         description: غير مصرح
 *     x-screen: "NotificationsScreen"
 */
router.get(
  '/',
  isAuthenticated,
  isValidation(notificationQuerySchema, 'query'),
  notificationController.getUserNotifications
);

/**
 * @swagger
 * /api/notifications/firebase:
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
  notificationController.getUserNotifications
);

/**
 * @swagger
 * /api/notifications/stats:
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
router.get(
  '/stats',
  isAuthenticated,
  isValidation(notificationStatsQuerySchema, 'query'),
  notificationController.getNotificationStats
);

/**
 * @swagger
 * /api/notifications/settings:
 *   get:
 *     tags:
 *       - Notification Settings
 *     summary: الحصول على إعدادات الإشعارات
 *     description: جلب إعدادات الإشعارات الحالية للمستخدم
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
 *         description: تم جلب الإعدادات بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/NotificationSettingsSchema'
 *     x-screen: "NotificationSettingsScreen"
 *   put:
 *     tags:
 *       - Notification Settings
 *     summary: تحديث إعدادات الإشعارات
 *     description: |
 *       تحديث تفضيلات الإشعارات للمستخدم
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.put('/api/notifications/settings',
 *         data: {
 *           'enablePush': true,
 *           'enableEmail': false,
 *           'categories': {
 *             'messages': true,
 *             'requests': true,
 *             'reviews': false
 *           }
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
 *             $ref: '#/components/schemas/NotificationSettingsSchema'
 *     responses:
 *       200:
 *         description: تم تحديث الإعدادات بنجاح
 *       400:
 *         description: خطأ في البيانات المرسلة
 *     x-screen: "NotificationSettingsScreen"
 */
router.get('/settings', isAuthenticated, notificationController.getNotificationSettings);
router.put(
  '/settings',
  isAuthenticated,
  isValidation(notificationSettingsSchema),
  notificationController.updateNotificationSettings
);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: وضع علامة "مقروء" على إشعار
 *     description: |
 *       تعيين إشعار معين كمقروء
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.patch(
 *         '/api/notifications/${notificationId}/read'
 *       );
 *       ```
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: معرف الإشعار
 *         example: "507f1f77bcf86cd799439011"
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["ar", "en"]
 *           default: "ar"
 *         description: لغة الاستجابة
 *     responses:
 *       200:
 *         description: تم وضع علامة مقروء على الإشعار بنجاح
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
 *                   example: "تم وضع علامة مقروء على الإشعار بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     message:
 *                       type: string
 *                     isRead:
 *                       type: boolean
 *                       example: true
 *                     readAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: الإشعار غير موجود أو مقروء بالفعل
 *     x-screen: "NotificationDetailScreen"
 */
router.patch(
  '/:notificationId/read',
  isAuthenticated,
  isValidation(notificationIdSchema, 'params'),
  notificationController.markNotificationAsRead
);

/**
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: وضع علامة "مقروء" على جميع الإشعارات
 *     description: |
 *       تعيين جميع إشعارات المستخدم كمقروءة
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.patch('/api/notifications/read-all');
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
 *         description: تم وضع علامة مقروء على جميع الإشعارات بنجاح
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
 *                   example: "تم وضع علامة مقروء على جميع الإشعارات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: integer
 *                       example: 15
 *                     message:
 *                       type: string
 *                       example: "تم وضع علامة مقروء على 15 إشعار"
 *     x-screen: "NotificationsScreen"
 */
router.patch('/read-all', isAuthenticated, notificationController.markAllNotificationsAsRead);

/**
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: حذف إشعار
 *     description: |
 *       حذف إشعار معين
 *       
 *       **Flutter Integration:**
 *       ```dart
 *       final response = await dio.delete(
 *         '/api/notifications/${notificationId}'
 *       );
 *       ```
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^[0-9a-fA-F]{24}$"
 *         description: معرف الإشعار
 *         example: "507f1f77bcf86cd799439011"
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: ["ar", "en"]
 *           default: "ar"
 *         description: لغة الاستجابة
 *     responses:
 *       200:
 *         description: تم حذف الإشعار بنجاح
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
 *                   example: "تم حذف الإشعار بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *       404:
 *         description: الإشعار غير موجود
 *     x-screen: "NotificationDetailScreen"
 */
router.delete(
  '/:notificationId',
  isAuthenticated,
  isValidation(notificationIdSchema, 'params'),
  notificationController.deleteNotification
);

/**
 * @swagger
 * /api/notifications:
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
 * /api/notifications/bulk:
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
router.post(
  '/bulk',
  isAuthenticated,
  isValidation(bulkNotificationSchema),
  notificationController.sendBulkNotifications
);

/**
 * @swagger
 * /api/notifications/token:
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
 */
router.post('/token', isAuthenticated, isValidation(fcmTokenSchema), notificationController.registerFCMToken);
router.delete('/token', isAuthenticated, isValidation(fcmTokenSchema), notificationController.unregisterFCMToken);

/**
 * @swagger
 * /api/notifications/token/firebase:
 *   post:
 *     tags:
 *       - FCM Tokens
 *     summary: تسجيل رمز إشعارات FCM (Firebase)
 *     description: تسجيل رمز FCM للإشعارات الفورية باستخدام مصادقة Firebase
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
 *   delete:
 *     tags:
 *       - FCM Tokens
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
 *                 description: رمز FCM المراد إلغاء تسجيله
 *     responses:
 *       200:
 *         description: تم إلغاء تسجيل الرمز بنجاح
 *       400:
 *         description: الرمز مطلوب
 *     x-screen: "SettingsScreen"
 */
router.post('/token/firebase', verifyFirebaseToken, isValidation(fcmTokenSchema), notificationController.registerFCMToken);
router.delete('/token/firebase', verifyFirebaseToken, isValidation(fcmTokenSchema), notificationController.unregisterFCMToken);

export default router;
