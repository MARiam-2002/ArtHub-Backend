import { Router } from 'express';
import * as chatController from './chat.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './chat.validation.js';
import { fileUpload, filterObject } from '../../utils/multer.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat and messaging endpoints for real-time communication
 */

/**
 * @swagger
 * /chat:
 *   get:
 *     summary: Get user chats
 *     tags: [Chat]
 *     description: Get all chats for the authenticated user with pagination and search
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of chats per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in other user's display name
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
 *                 message:
 *                   type: string
 *                   example: "تم جلب المحادثات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chats:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           otherUser:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               displayName:
 *                                 type: string
 *                               profileImage:
 *                                 type: string
 *                               isOnline:
 *                                 type: boolean
 *                               lastSeen:
 *                                 type: string
 *                               isVerified:
 *                                 type: boolean
 *                           lastMessage:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               content:
 *                                 type: string
 *                               messageType:
 *                                 type: string
 *                               isFromMe:
 *                                 type: boolean
 *                               sentAt:
 *                                 type: string
 *                           unreadCount:
 *                             type: number
 *                           lastActivity:
 *                             type: string
 *                     totalUnreadCount:
 *                       type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalPages:
 *                           type: number
 *                         totalItems:
 *                           type: number
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, chatController.getChats);

/**
 * @swagger
 * /chat/create:
 *   post:
 *     summary: Create or get chat with user
 *     tags: [Chat]
 *     description: Create a new chat or get existing chat with another user
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
 *                 description: ID of the other user to chat with
 *     responses:
 *       201:
 *         description: Chat created or retrieved successfully
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
 *                   type: object
 *                   properties:
 *                     chat:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         otherUser:
 *                           type: object
 *                         lastMessage:
 *                           type: object
 *                         createdAt:
 *                           type: string
 *       400:
 *         description: Invalid user ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/create', authenticate, chatController.getOrCreateChat);

/**
 * @swagger
 * /chat/{chatId}/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [Chat]
 *     description: Get messages for a specific chat with pagination
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
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages per page
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
 *                 message:
 *                   type: string
 *                   example: "تم جلب الرسائل بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     chat:
 *                       type: object
 *                     messages:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           content:
 *                             type: string
 *                           messageType:
 *                             type: string
 *                           isFromMe:
 *                             type: boolean
 *                           sender:
 *                             type: object
 *                           attachments:
 *                             type: array
 *                           images:
 *                             type: array
 *                           isRead:
 *                             type: boolean
 *                           sentAt:
 *                             type: string
 *                           replyTo:
 *                             type: object
 *                     pagination:
 *                       type: object
 *       400:
 *         description: Invalid chat ID
 *       404:
 *         description: Chat not found or unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:chatId/messages', authenticate, chatController.getMessages);

/**
 * @swagger
 * /chat/{chatId}/send:
 *   post:
 *     summary: Send message
 *     tags: [Chat]
 *     description: Send a message to a specific chat
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content (optional if files are attached)
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file, voice, location, contact]
 *                 default: text
 *                 description: Type of message (auto-detected from uploaded files)
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (images, audio, video, documents) - max 10 files
 *               attachments:
 *                 type: string
 *                 description: JSON string of existing attachments
 *               images:
 *                 type: string
 *                 description: JSON string of existing image URLs
 *               replyTo:
 *                 type: string
 *                 description: Message ID to reply to
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content (required for text messages)
 *               messageType:
 *                 type: string
 *                 enum: [text, image, file, voice, location, contact]
 *                 default: text
 *                 description: Type of message
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *                     name:
 *                       type: string
 *                     size:
 *                       type: number
 *                 description: File attachments
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Image URLs
 *               replyTo:
 *                 type: string
 *                 description: Message ID to reply to
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
 *                   type: object
 *                   properties:
 *                     message:
 *                       type: object
 *       400:
 *         description: Invalid data or missing content
 *       404:
 *         description: Chat not found or unauthorized
 *       500:
 *         description: Server error
 */
// Create combined filter for chat files (images, audio, video, documents)
const chatFileFilter = [
  ...filterObject.image,
  ...filterObject.audio,
  ...filterObject.video,
  ...filterObject.document
];

router.post('/:chatId/send', authenticate, fileUpload(chatFileFilter).array('files', 10), chatController.sendMessage);

/**
 * @swagger
 * /chat/{chatId}/read:
 *   put:
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
 *                   example: "تم تمييز الرسائل كمقروءة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: number
 *       400:
 *         description: Invalid chat ID
 *       404:
 *         description: Chat not found or unauthorized
 *       500:
 *         description: Server error
 */
router.put('/:chatId/read', authenticate, chatController.markAsRead);

/**
 * @swagger
 * /chat/{chatId}/messages/{messageId}:
 *   delete:
 *     summary: Delete message
 *     tags: [Chat]
 *     description: Delete a message from a chat
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chatId
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat ID
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               deleteForEveryone:
 *                 type: boolean
 *                 default: false
 *                 description: Delete for everyone (only within 1 hour and by sender)
 *     responses:
 *       200:
 *         description: Message deleted successfully
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
 *                 data:
 *                   type: object
 *                   properties:
 *                     messageId:
 *                       type: string
 *                     deleteForEveryone:
 *                       type: boolean
 *       400:
 *         description: Invalid IDs
 *       403:
 *         description: Cannot delete message
 *       404:
 *         description: Chat or message not found
 *       500:
 *         description: Server error
 */
router.delete('/:chatId/messages/:messageId', authenticate, chatController.deleteMessage);

/**
 * @swagger
 * /chat/unread-count:
 *   get:
 *     summary: Get unread messages count
 *     tags: [Chat]
 *     description: Get total number of unread messages for the user
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
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
 *                   example: "تم جلب عدد الرسائل غير المقروءة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     unreadCount:
 *                       type: number
 *       500:
 *         description: Server error
 */
router.get('/unread-count', authenticate, chatController.getUnreadCount);

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         otherUser:
 *           $ref: '#/components/schemas/ChatUser'
 *         lastMessage:
 *           $ref: '#/components/schemas/ChatMessage'
 *         unreadCount:
 *           type: number
 *         isArchived:
 *           type: boolean
 *         isMuted:
 *           type: boolean
 *         lastActivity:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChatUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         displayName:
 *           type: string
 *         profileImage:
 *           type: string
 *         isOnline:
 *           type: boolean
 *         lastSeen:
 *           type: string
 *           format: date-time
 *         isVerified:
 *           type: boolean
 *         role:
 *           type: string
 *     ChatMessage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         content:
 *           type: string
 *         messageType:
 *           type: string
 *           enum: [text, image, file, voice, location, contact]
 *         isFromMe:
 *           type: boolean
 *         sender:
 *           $ref: '#/components/schemas/ChatUser'
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *               size:
 *                 type: number
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         isRead:
 *           type: boolean
 *         readAt:
 *           type: string
 *           format: date-time
 *         isEdited:
 *           type: boolean
 *         isDeleted:
 *           type: boolean
 *         replyTo:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             content:
 *               type: string
 *             sender:
 *               $ref: '#/components/schemas/ChatUser'
 *         sentAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

export default router;
