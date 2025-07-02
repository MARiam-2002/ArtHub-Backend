import { Router } from 'express';
import * as chatController from './chat.controller.js';
import { requireAuth } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  createChatSchema,
  sendMessageSchema,
  getMessagesQuerySchema,
  chatIdParamSchema,
  getUserChatsQuerySchema
} from './chat.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف المحادثة
 *         participants:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/User'
 *           description: المشاركون في المحادثة
 *         lastMessage:
 *           $ref: '#/components/schemas/Message'
 *         unreadCount:
 *           type: number
 *           description: عدد الرسائل غير المقروءة
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     Message:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف الرسالة
 *         chat:
 *           type: string
 *           description: معرف المحادثة
 *         sender:
 *           $ref: '#/components/schemas/User'
 *         content:
 *           type: string
 *           description: محتوى الرسالة
 *         messageType:
 *           type: string
 *           enum: [text, image, file]
 *           default: text
 *           description: نوع الرسالة
 *         readBy:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               readAt:
 *                 type: string
 *                 format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat and messaging functionality
 */

/**
 * @swagger
 * /api/chat:
 *   get:
 *     summary: Get user chats
 *     tags: [Chat]
 *     description: Get paginated list of user chats
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
 *         description: Chats retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', requireAuth, chatController.getChats);

/**
 * @swagger
 * /api/chat/create:
 *   post:
 *     summary: Get or create chat with user
 *     tags: [Chat]
 *     description: Get existing chat or create new chat with another user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otherUserId
 *             properties:
 *               otherUserId:
 *                 type: string
 *                 description: ID of the user to chat with
 *     responses:
 *       200:
 *         description: Chat created or retrieved successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/create', requireAuth, chatController.getOrCreateChat);

/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [Chat]
 *     description: Get paginated list of messages in a chat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
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
 *           default: 50
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.get('/:chatId/messages', requireAuth, chatController.getMessages);

/**
 * @swagger
 * /api/chat/{chatId}/send:
 *   post:
 *     summary: Send message
 *     tags: [Chat]
 *     description: Send a message in a chat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.post('/:chatId/send', requireAuth, chatController.sendMessage);

/**
 * @swagger
 * /api/chat/{chatId}/read:
 *   patch:
 *     summary: Mark messages as read
 *     tags: [Chat]
 *     description: Mark all messages in a chat as read
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Messages marked as read
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.patch('/:chatId/read', requireAuth, chatController.markAsRead);

/**
 * @swagger
 * /api/chat/{chatId}:
 *   delete:
 *     summary: Delete chat
 *     tags: [Chat]
 *     description: Delete a chat (soft delete)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Server error
 */
router.delete('/:chatId', requireAuth, chatController.deleteChat);

// Get Socket Token (for real-time messaging)
/**
 * @swagger
 * /api/chat/socket-token:
 *   get:
 *     tags: [Chat]
 *     summary: Get socket token
 *     description: Get a temporary token for Socket.io connection
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Socket token generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       description: Socket connection token
 *                     userId:
 *                       type: string
 *                       description: User ID
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: Token expiration time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/socket-token', requireAuth, chatController.getSocketToken);

export default router;
