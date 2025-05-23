import notificationModel from '../../../DB/models/notification.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { sendPushNotificationToUser } from '../../utils/pushNotifications.js';

/**
 * Ø¬Ù„Ø¨ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
 * @swagger
 * /api/notifications:
 *   get:
 *     tags:
 *       - Notifications
 *     summary: Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
 *     description: Ø§Ø³ØªØ±Ø¬Ø§Ø¹ Ø¬Ù…ÙŠØ¹ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…Ø³Ø¬Ù„ Ø§Ù„Ø¯Ø®ÙˆÙ„ Ù…Ø¹ Ø¯Ø¹Ù… Ø§Ù„ØªØ±Ø¬Ù…Ø© ÙˆØ§Ù„Ù„ØºØ§Øª Ø§Ù„Ù…ØªØ¹Ø¯Ø¯Ø©
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Ø±Ù‚Ù… Ø§Ù„ØµÙØ­Ø©
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Ø¹Ø¯Ø¯ Ø§Ù„Ø¹Ù†Ø§ØµØ± ÙÙŠ Ø§Ù„ØµÙØ­Ø©
 *       - name: unreadOnly
 *         in: query
 *         schema:
 *           type: boolean
 *           default: false
 *         description: Ø¹Ø±Ø¶ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ØºÙŠØ± Ø§Ù„Ù…Ù‚Ø±ÙˆØ¡Ø© ÙÙ‚Ø·
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ar, en]
 *           default: ar
 *         description: Ø§Ù„Ù„ØºØ© Ø§Ù„Ù…ÙØ¶Ù„Ø© Ù„Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
 *     responses:
 *       200:
 *         description: ØªÙ… Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­
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
 *                   example: ØªÙ… Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­
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
 *                             example: 60d21b4667d0d8992e610c85
 *                           title:
 *                             type: string
 *                             example: Ù„Ø¯ÙŠÙƒ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©
 *                           message:
 *                             type: string
 *                             example: Ø£Ø±Ø³Ù„ Ù„Ùƒ Ø£Ø­Ù…Ø¯ Ø±Ø³Ø§Ù„Ø© Ø¬Ø¯ÙŠØ¯Ø©
 *                           type:
 *                             type: string
 *                             example: message
 *                           isRead:
 *                             type: boolean
 *                             example: false
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: 2023-05-15T10:30:45.123Z
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                           example: 1
 *                         totalPages:
 *                           type: number
 *                           example: 5
 *                         totalItems:
 *                           type: number
 *                           example: 85
 *                         itemsPerPage:
 *                           type: number
 *                           example: 20
 *                         hasNextPage:
 *                           type: boolean
 *                           example: true
 *                         hasPrevPage:
 *                           type: boolean
 *                           example: false
 *                         unreadCount:
 *                           type: number
 *                           example: 3
 *       401:
 *         description: ØºÙŠØ± Ù…ØµØ±Ø­ Ø¨Ù‡
 *       500:
 *         description: Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly, language = 'ar' } = req.query;
  const { skip } = getPaginationParams({ page, limit });
  
  // Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ø±Ø´Ø­
  const filter = { user: userId };
  if (unreadOnly === 'true') {
    filter.isRead = false;
  }
  
  // Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ø¹ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„Ù…Ø±Ø³Ù„
  const [notifications, totalCount] = await Promise.all([
    notificationModel.find(filter)
      .populate('sender', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    notificationModel.countDocuments(filter)
  ]);
  
  // Ø¹Ø¯Ø¯ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ØºÙŠØ± Ø§Ù„Ù…Ù‚Ø±ÙˆØ¡Ø©
  const unreadCount = await notificationModel.countDocuments({ 
    user: userId,
    isRead: false
  });
  
  // ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¥Ù„Ù‰ Ø§Ù„Ù„ØºØ© Ø§Ù„Ù…Ø·Ù„ÙˆØ¨Ø©
  const localizedNotifications = notifications.map(notification => {
    return notification.getLocalizedContent(language);
  });
  
  // Ø¥Ø¹Ø¯Ø§Ø¯ Ù…Ø¹Ù„ÙˆÙ…Ø§Øª Ø§Ù„ØµÙØ­Ø§Øª
  const paginationMeta = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    totalItems: totalCount,
    itemsPerPage: parseInt(limit),
    unreadCount,
    hasNextPage: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
    hasPrevPage: parseInt(page) > 1
  };
  
  res.success({ 
    notifications: localizedNotifications, 
    pagination: paginationMeta 
  }, 'ØªÙ… Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­');
});

/**
 * ÙˆØ¶Ø¹ Ø¹Ù„Ø§Ù…Ø© "Ù…Ù‚Ø±ÙˆØ¡" Ø¹Ù„Ù‰ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: ÙˆØ¶Ø¹ Ø¹Ù„Ø§Ù…Ø© "Ù…Ù‚Ø±ÙˆØ¡" Ø¹Ù„Ù‰ Ø¥Ø´Ø¹Ø§Ø±
 *     description: ØªØ¹ÙŠÙŠÙ† Ø¥Ø´Ø¹Ø§Ø± Ù…Ø¹ÙŠÙ† ÙƒÙ…Ù‚Ø±ÙˆØ¡
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Ù…Ø¹Ø±Ù Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
 *       - name: language
 *         in: query
 *         schema:
 *           type: string
 *           enum: [ar, en]
 *           default: ar
 *         description: Ø§Ù„Ù„ØºØ© Ø§Ù„Ù…ÙØ¶Ù„Ø© Ù„Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
 *     responses:
 *       200:
 *         description: ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†Ø¬Ø§Ø­
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
 *                   example: ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†Ø¬Ø§Ø­
 *                 data:
 *                   type: object
 *       404:
 *         description: Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯
 *       401:
 *         description: ØºÙŠØ± Ù…ØµØ±Ø­ Ø¨Ù‡
 *       500:
 *         description: Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  const { language = 'ar' } = req.query;
  
  // ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ø§Ù„Ù‚Ø±Ø§Ø¡Ø© Ù„Ù„Ø¥Ø´Ø¹Ø§Ø±
  const notification = await notificationModel.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
  
  if (!notification) {
    return res.fail(null, 'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯', 404);
  }
  
  const localizedNotification = notification.getLocalizedContent(language);
  
  res.success(localizedNotification, 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ù‚Ø±Ø§Ø¡Ø© Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†Ø¬Ø§Ø­');
});

/**
 * ÙˆØ¶Ø¹ Ø¹Ù„Ø§Ù…Ø© "Ù…Ù‚Ø±ÙˆØ¡" Ø¹Ù„Ù‰ Ø¬Ù…ÙŠØ¹ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
 * @swagger
 * /api/notifications/read-all:
 *   patch:
 *     tags:
 *       - Notifications
 *     summary: ÙˆØ¶Ø¹ Ø¹Ù„Ø§Ù…Ø© "Ù…Ù‚Ø±ÙˆØ¡" Ø¹Ù„Ù‰ Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
 *     description: ØªØ¹ÙŠÙŠÙ† Ø¬Ù…ÙŠØ¹ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ÙƒÙ…Ù‚Ø±ÙˆØ¡Ø©
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ù‚Ø±Ø§Ø¡Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­
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
 *                   example: ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ù‚Ø±Ø§Ø¡Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­
 *                 data:
 *                   type: object
 *                   properties:
 *                     modifiedCount:
 *                       type: number
 *                       example: 5
 *       401:
 *         description: ØºÙŠØ± Ù…ØµØ±Ø­ Ø¨Ù‡
 *       500:
 *         description: Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // ØªØ­Ø¯ÙŠØ« Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª ØºÙŠØ± Ø§Ù„Ù…Ù‚Ø±ÙˆØ¡Ø©
  const result = await notificationModel.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
  
  res.success({ 
    modifiedCount: result.modifiedCount 
  }, 'ØªÙ… ØªØ­Ø¯ÙŠØ« Ø­Ø§Ù„Ø© Ù‚Ø±Ø§Ø¡Ø© Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­');
});

/**
 * Ø­Ø°Ù Ø¥Ø´Ø¹Ø§Ø±
 * @swagger
 * /api/notifications/{notificationId}:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Ø­Ø°Ù Ø¥Ø´Ø¹Ø§Ø±
 *     description: Ø­Ø°Ù Ø¥Ø´Ø¹Ø§Ø± Ù…Ø¹ÙŠÙ†
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: notificationId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: Ù…Ø¹Ø±Ù Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
 *     responses:
 *       200:
 *         description: ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†Ø¬Ø§Ø­
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
 *                   example: ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†Ø¬Ø§Ø­
 *       404:
 *         description: Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯
 *       401:
 *         description: ØºÙŠØ± Ù…ØµØ±Ø­ Ø¨Ù‡
 *       500:
 *         description: Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  
  // Ø­Ø°Ù Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
  const notification = await notificationModel.findOneAndDelete({
    _id: notificationId,
    user: userId
  });
  
  if (!notification) {
    return res.fail(null, 'Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯', 404);
  }
  
  res.success(null, 'ØªÙ… Ø­Ø°Ù Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø¨Ù†Ø¬Ø§Ø­');
});

/**
 * Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
 * @swagger
 * /api/notifications:
 *   delete:
 *     tags:
 *       - Notifications
 *     summary: Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
 *     description: Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: ØªÙ… Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­
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
 *                   example: ØªÙ… Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletedCount:
 *                       type: number
 *                       example: 12
 *       401:
 *         description: ØºÙŠØ± Ù…ØµØ±Ø­ Ø¨Ù‡
 *       500:
 *         description: Ø®Ø·Ø£ ÙÙŠ Ø§Ù„Ø®Ø§Ø¯Ù…
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  const result = await notificationModel.deleteMany({ user: userId });
  
  res.success({ 
    deletedCount: result.deletedCount 
  }, 'ØªÙ… Ø­Ø°Ù Ø¬Ù…ÙŠØ¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­');
});

/**
 * Ø¥Ù†Ø´Ø§Ø¡ Ø¥Ø´Ø¹Ø§Ø± (Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø¯Ø§Ø®Ù„ÙŠ)
 */
export const createNotification = asyncHandler(async (sender, recipient, titleAr, bodyAr, data = {}, titleEn = '', bodyEn = '') => {
  try {
    // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙˆØ¬ÙˆØ¯ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…ÙŠÙ†
    const [senderExists, recipientExists] = await Promise.all([
      sender ? userModel.exists({ _id: sender }) : Promise.resolve(true),
      userModel.exists({ _id: recipient })
    ]);
    
    if (!senderExists || !recipientExists) {
      console.error('Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ - Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±');
      return null;
    }
    
    // Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ù…Ø¹ Ø¯Ø¹Ù… Ø§Ù„Ù„ØºØ§Øª Ø§Ù„Ù…ØªØ¹Ø¯Ø¯Ø©
    const notification = await notificationModel.create({
      sender,
      user: recipient,
      title: {
        ar: titleAr,
        en: titleEn || titleAr
      },
      message: {
        ar: bodyAr,
        en: bodyEn || bodyAr
      },
      data
    });
    
    // Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø± ÙÙˆØ±ÙŠ Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù… (Ø¥Ø°Ø§ ÙƒØ§Ù† Ù…ÙØ¹Ù„Ø§Ù‹)
    try {
      // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ØªÙØ¶ÙŠÙ„Ø§Øª Ø§Ù„Ù„ØºØ© Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…
      const user = await userModel.findById(recipient).select('language');
      const userLang = user?.language || 'ar';
      
      await sendPushNotificationToUser(
        recipient,
        { 
          title: {
            ar: titleAr,
            en: titleEn || titleAr
          }, 
          body: {
            ar: bodyAr,
            en: bodyEn || bodyAr
          }
        },
        { 
          ...data, 
          notificationId: notification._id.toString(),
          language: userLang
        }
      );
    } catch (pushError) {
      console.error('Ø®Ø·Ø£ ÙÙŠ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ÙÙˆØ±ÙŠ:', pushError);
      // Ø§Ø³ØªÙ…Ø± Ø¹Ù„Ù‰ Ø§Ù„Ø±ØºÙ… Ù…Ù† ÙØ´Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ÙÙˆØ±ÙŠ
    }
    
    return notification;
  } catch (error) {
    console.error('Ø®Ø·Ø£ ÙÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±:', error);
    return null;
  }
});

/**
 * Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ Ø¬Ù…ÙŠØ¹ Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
 * @param {Object} req - ÙƒØ§Ø¦Ù† Ø§Ù„Ø·Ù„Ø¨
 * @param {Object} res - ÙƒØ§Ø¦Ù† Ø§Ù„Ø§Ø³ØªØ¬Ø§Ø¨Ø©
 * @returns {Object} Ø§Ø³ØªØ¬Ø§Ø¨Ø© JSON Ù…Ø¹ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, language } = req.query;
  const preferredLanguage = language || req.user.preferredLanguage || 'ar';
  
  // Ø¬Ù„Ø¨ Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø¹Ø¯Ø¯ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…
  const totalNotifications = await notificationModel.countDocuments({ user: userId });
  
  // Ø­Ø³Ø§Ø¨ Ø¹Ø¯Ø¯ Ø§Ù„ØµÙØ­Ø§Øª
  const totalPages = Math.ceil(totalNotifications / limit);
  
  // Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ù…Ø¹ Ø§Ù„ØªØµÙØ­
  const notifications = await notificationModel.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();
  
  // ØªØ­ÙˆÙŠÙ„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¥Ù„Ù‰ Ø§Ù„Ù†Ù…ÙˆØ°Ø¬ Ø§Ù„Ù…Ø­Ù„ÙŠ Ø­Ø³Ø¨ Ø§Ù„Ù„ØºØ© Ø§Ù„Ù…ÙØ¶Ù„Ø©
  const localizedNotifications = notifications.map(notification => {
    return {
      ...notification,
      title: notification.title[preferredLanguage] || notification.title.ar,
      message: notification.message[preferredLanguage] || notification.message.ar
    };
  });
  
  res.status(200).json({
    success: true,
    message: preferredLanguage === 'ar' ? 'ØªÙ… Ø¬Ù„Ø¨ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±Ø§Øª Ø¨Ù†Ø¬Ø§Ø­' : 'Notifications retrieved successfully',
    data: {
      notifications: localizedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount: totalNotifications,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

/**
 * Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø± Ù„Ù…Ø³ØªØ®Ø¯Ù… (Ù„Ù„Ø§Ø³ØªØ®Ø¯Ø§Ù… Ø§Ù„Ø®Ø§Ø±Ø¬ÙŠ)
 * @param {string} userId - Ù…Ø¹Ø±Ù Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…ØªÙ„Ù‚ÙŠ
 * @param {string} title - Ø¹Ù†ÙˆØ§Ù† Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
 * @param {string} message - Ù†Øµ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
 * @param {Object} data - Ø¨ÙŠØ§Ù†Ø§Øª Ø¥Ø¶Ø§ÙÙŠØ© Ù„Ù„Ø¥Ø´Ø¹Ø§Ø±
 * @returns {Promise<Object>} - Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„Ø°ÙŠ ØªÙ… Ø¥Ù†Ø´Ø§Ø¤Ù‡
 */
export const sendNotification = asyncHandler(async (recipient, title, message, data = {}) => {
  try {
    // Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† ÙˆØ¬ÙˆØ¯ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…
    const recipientExists = await userModel.exists({ _id: recipient });
    
    if (!recipientExists) {
      console.error('Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù… Ø§Ù„Ù…ØªÙ„Ù‚ÙŠ ØºÙŠØ± Ù…ÙˆØ¬ÙˆØ¯ - Ù„Ø§ ÙŠÙ…ÙƒÙ† Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±');
      return null;
    }
    
    // Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±
    const notification = await notificationModel.create({
      user: recipient,
      title: {
        ar: title,
        en: title // Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù†ÙØ³ Ø§Ù„Ø¹Ù†ÙˆØ§Ù† Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø¥Ø°Ø§ Ù„Ù… ÙŠØªÙ… ØªÙˆÙÙŠØ± ØªØ±Ø¬Ù…Ø©
      },
      message: {
        ar: message,
        en: message // Ø§Ø³ØªØ®Ø¯Ø§Ù… Ù†ÙØ³ Ø§Ù„Ù†Øµ Ù„Ù„ØºØ© Ø§Ù„Ø¥Ù†Ø¬Ù„ÙŠØ²ÙŠØ© Ø¥Ø°Ø§ Ù„Ù… ÙŠØªÙ… ØªÙˆÙÙŠØ± ØªØ±Ø¬Ù…Ø©
      },
      data
    });
    
    // Ø¥Ø±Ø³Ø§Ù„ Ø¥Ø´Ø¹Ø§Ø± ÙÙˆØ±ÙŠ
    try {
      // Ø§Ù„Ø­ØµÙˆÙ„ Ø¹Ù„Ù‰ ØªÙØ¶ÙŠÙ„Ø§Øª Ø§Ù„Ù„ØºØ© Ù„Ù„Ù…Ø³ØªØ®Ø¯Ù…
      const user = await userModel.findById(recipient).select('language');
      const userLang = user?.language || 'ar';
      
      await sendPushNotificationToUser(
        recipient,
        { 
          title: {
            ar: title,
            en: title
          }, 
          body: {
            ar: message,
            en: message
          }
        },
        { 
          ...data, 
          notificationId: notification._id.toString(),
          language: userLang
        }
      );
    } catch (pushError) {
      console.error('Ø®Ø·Ø£ ÙÙŠ Ø¥Ø±Ø³Ø§Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ÙÙˆØ±ÙŠ:', pushError);
      // Ø§Ø³ØªÙ…Ø± Ø¹Ù„Ù‰ Ø§Ù„Ø±ØºÙ… Ù…Ù† ÙØ´Ù„ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø± Ø§Ù„ÙÙˆØ±ÙŠ
    }
    
    return notification;
  } catch (error) {
    console.error('Ø®Ø·Ø£ ÙÙŠ Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø¥Ø´Ø¹Ø§Ø±:', error);
    return null;
  }
});

// ØªØµØ¯ÙŠØ± Ø§Ù„Ø¯ÙˆØ§Ù„ Ø§Ù„Ù…Ø³ØªØ®Ø¯Ù…Ø©
export {
  markAsRead as markNotificationAsRead,       // Ù„Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø§Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
  markAllAsRead as markAllNotificationsAsRead // Ù„Ù„Ø­ÙØ§Ø¸ Ø¹Ù„Ù‰ Ø§Ù„ØªÙˆØ§ÙÙ‚ Ù…Ø¹ Ø§Ù„ÙƒÙˆØ¯ Ø§Ù„Ù‚Ø¯ÙŠÙ…
}; 
