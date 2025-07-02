import { Router } from 'express';
import * as chatController from './chat.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
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

// Get User Chats
/**
 * @swagger
 * /api/chat:
 *   get:
 *     tags: [Chat]
 *     summary: Get user chats
 *     description: Get all chats for the authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Chats retrieved successfully
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
 *                     chats:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Chat'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/', isAuthenticated, isValidation(getUserChatsQuerySchema), chatController.getUserChats);

// Create Chat
/**
 * @swagger
 * /api/chat:
 *   post:
 *     tags: [Chat]
 *     summary: Create chat
 *     description: Create a new chat with another user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantId
 *             properties:
 *               participantId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: ID of the user to chat with
 *                 example: "507f1f77bcf86cd799439011"
 *     responses:
 *       201:
 *         description: Chat created successfully
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
 *                   example: "تم إنشاء المحادثة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Chat'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 *       409:
 *         description: Chat already exists
 */
router.post('/', isAuthenticated, isValidation(createChatSchema), chatController.createChat);

// Get Chat Messages
/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   get:
 *     tags: [Chat]
 *     summary: Get chat messages
 *     description: Get all messages in a specific chat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Chat ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Messages per page
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get messages before this date
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Message'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not a participant in this chat
 *       404:
 *         description: Chat not found
 */
router.get('/:chatId/messages', isAuthenticated, isValidation(chatIdParamSchema), isValidation(getMessagesQuerySchema), chatController.getMessages);

// Send Message
/**
 * @swagger
 * /api/chat/{chatId}/messages:
 *   post:
 *     tags: [Chat]
 *     summary: Send message
 *     description: Send a new message in a specific chat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
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
 *                 minLength: 1
 *                 maxLength: 1000
 *                 description: Message content
 *                 example: "Hello, how are you?"
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file]
 *                 default: text
 *                 description: Type of message
 *     responses:
 *       201:
 *         description: Message sent successfully
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
 *                   example: "تم إرسال الرسالة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Message'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not a participant in this chat
 *       404:
 *         description: Chat not found
 */
router.post('/:chatId/messages', isAuthenticated, isValidation(chatIdParamSchema), isValidation(sendMessageSchema), chatController.sendMessage);

// Mark Messages as Read
/**
 * @swagger
 * /api/chat/{chatId}/read:
 *   post:
 *     tags: [Chat]
 *     summary: Mark messages as read
 *     description: Mark all messages in a chat as read by the current user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
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
 *                   example: "تم تحديث حالة القراءة بنجاح"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not a participant in this chat
 *       404:
 *         description: Chat not found
 */
router.post('/:chatId/read', isAuthenticated, isValidation(chatIdParamSchema), chatController.markAsRead);

// Delete Chat
/**
 * @swagger
 * /api/chat/{chatId}:
 *   delete:
 *     tags: [Chat]
 *     summary: Delete chat
 *     description: Delete a chat (participant only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Chat ID
 *     responses:
 *       200:
 *         description: Chat deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Not a participant in this chat
 *       404:
 *         description: Chat not found
 */
router.delete('/:chatId', isAuthenticated, isValidation(chatIdParamSchema), chatController.deleteChat);

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
router.get('/socket-token', isAuthenticated, chatController.getSocketToken);

export default router;
