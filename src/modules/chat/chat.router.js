import { Router } from 'express';
import * as chatController from './chat.controller.js';
import { verifyFirebaseToken } from '../../middleware/firebase.middleware.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as chatValidation from './chat.validation.js';

const router = Router();

/**
 * @swagger
 * /api/chat:
 *   get:
 *     tags:
 *       - Chat
 *     summary: الحصول على محادثات المستخدم
 *     description: استرجاع جميع محادثات المستخدم المسجل الدخول
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب المحادثات بنجاح
 */
router.get('/', isAuthenticated, chatController.getUserChats);

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   get:
 *     tags:
 *       - Chat
 *     summary: الحصول على رسائل محادثة
 *     description: استرجاع جميع الرسائل في محادثة معينة
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المحادثة
 *     responses:
 *       200:
 *         description: تم جلب الرسائل بنجاح
 *       404:
 *         description: المحادثة غير موجودة
 */
router.get(
  '/:chatId/messages', 
  isAuthenticated,
  isValidation(chatValidation.getMessagesSchema),
  chatController.getMessages
);

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   post:
 *     tags:
 *       - Chat
 *     summary: إرسال رسالة
 *     description: إرسال رسالة جديدة في محادثة معينة
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المحادثة
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: نص الرسالة
 *     responses:
 *       201:
 *         description: تم إرسال الرسالة بنجاح
 *       404:
 *         description: المحادثة غير موجودة
 */
router.post(
  '/:chatId/messages', 
  isAuthenticated,
  isValidation(chatValidation.sendMessageSchema),
  chatController.sendMessage
);

/**
 * @swagger
 * /api/chat/create:
 *   post:
 *     tags:
 *       - Chat
 *     summary: إنشاء محادثة
 *     description: إنشاء محادثة جديدة مع مستخدم آخر
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: معرف المستخدم الآخر
 *     responses:
 *       201:
 *         description: تم إنشاء المحادثة بنجاح
 *       404:
 *         description: المستخدم غير موجود
 */
router.post(
  '/create', 
  isAuthenticated,
  isValidation(chatValidation.createChatSchema),
  chatController.createChat
);

/**
 * @swagger
 * /api/chat/{chatId}/read:
 *   post:
 *     tags:
 *       - Chat
 *     summary: تحديث حالة قراءة الرسائل
 *     description: تعيين جميع الرسائل في محادثة معينة كمقروءة
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: chatId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف المحادثة
 *     responses:
 *       200:
 *         description: تم تحديث حالة القراءة بنجاح
 *       404:
 *         description: المحادثة غير موجودة
 */
router.post(
  '/:chatId/read', 
  isAuthenticated,
  isValidation(chatValidation.markAsReadSchema),
  chatController.markAsRead
);

export default router; 