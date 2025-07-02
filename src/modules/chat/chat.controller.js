import chatModel from '../../../DB/models/chat.model.js';
import messageModel from '../../../DB/models/message.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';
import { sendChatMessageNotification } from '../../utils/pushNotifications.js';
import { createNotification } from '../notification/notification.controller.js';
import { sendToChat, sendToUser } from '../../utils/socketService.js';
import jwt from 'jsonwebtoken';

/**
 * Get user chats
 */
export const getChats = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get chats with other user info and last message
    const chats = await chatModel.aggregate([
      {
        $match: {
          members: userId,
          isDeleted: { $ne: true }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'members',
          foreignField: '_id',
          as: 'memberDetails'
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: 'lastMessage',
          foreignField: '_id',
          as: 'lastMessageDetails'
        }
      },
      {
        $addFields: {
          otherUser: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$memberDetails',
                  cond: { $ne: ['$$this._id', userId] }
                }
              },
              0
            ]
          },
          lastMessage: { $arrayElemAt: ['$lastMessageDetails', 0] }
        }
      },
      {
        $lookup: {
          from: 'messages',
          let: { chatId: '$_id', currentUserId: userId },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$chat', '$$chatId'] },
                    { $ne: ['$sender', '$$currentUserId'] },
                    { $eq: ['$isRead', false] }
                  ]
                }
              }
            },
            { $count: 'unread' }
          ],
          as: 'unreadCount'
        }
      },
      {
        $project: {
          _id: 1,
          otherUser: {
            _id: '$otherUser._id',
            displayName: '$otherUser.displayName',
            profileImage: '$otherUser.profileImage'
          },
          lastMessage: {
            content: '$lastMessage.content',
            sender: '$lastMessage.sender',
            createdAt: '$lastMessage.createdAt'
          },
          unreadCount: { $ifNull: [{ $arrayElemAt: ['$unreadCount.unread', 0] }, 0] },
          updatedAt: 1
        }
      },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) }
    ]);

    // Format chats for mobile app
    const formattedChats = chats.map(chat => ({
      _id: chat._id,
      otherUser: {
        _id: chat.otherUser._id,
        displayName: chat.otherUser.displayName,
        profileImage: chat.otherUser.profileImage?.url
      },
      lastMessage: chat.lastMessage ? {
        content: chat.lastMessage.content,
        isFromMe: chat.lastMessage.sender?.toString() === userId.toString(),
        createdAt: chat.lastMessage.createdAt
      } : null,
      unreadCount: chat.unreadCount,
      updatedAt: chat.updatedAt
    }));

    const totalCount = await chatModel.countDocuments({
      members: userId,
      isDeleted: { $ne: true }
    });

    const response = {
      chats: formattedChats,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + chats.length < totalCount
      }
    };

    res.success(response, 'تم جلب المحادثات بنجاح');
  } catch (error) {
    console.error('Get chats error:', error);
    next(new Error('حدث خطأ أثناء جلب المحادثات', { cause: 500 }));
  }
});

/**
 * Get or create chat with user
 */
export const getOrCreateChat = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { otherUserId } = req.body;

    // Check if user exists
    const otherUser = await userModel
      .findOne({ _id: otherUserId, isActive: true })
      .select('displayName profileImage')
      .lean();

    if (!otherUser) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // Check if chat already exists
    let chat = await chatModel.findOne({
      members: { $all: [userId, otherUserId] },
      isDeleted: { $ne: true }
    });

    if (!chat) {
      // Create new chat
      chat = await chatModel.create({
        members: [userId, otherUserId],
        createdBy: userId
      });
    }

    res.success({
      _id: chat._id,
      otherUser: {
        _id: otherUser._id,
        displayName: otherUser.displayName,
        profileImage: otherUser.profileImage?.url
      },
      createdAt: chat.createdAt
    }, 'تم إنشاء المحادثة بنجاح');
  } catch (error) {
    console.error('Get or create chat error:', error);
    next(new Error('حدث خطأ أثناء إنشاء المحادثة', { cause: 500 }));
  }
});

/**
 * Get chat messages
 */
export const getMessages = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    // Check if user is member of chat
    const chat = await chatModel.findOne({
      _id: chatId,
      members: userId,
      isDeleted: { $ne: true }
    }).lean();

    if (!chat) {
      return res.fail(null, 'المحادثة غير موجودة أو غير مصرح بالوصول إليها', 404);
    }

    // Get messages
    const [messages, totalCount] = await Promise.all([
      messageModel
        .find({ chat: chatId })
        .populate('sender', 'displayName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      messageModel.countDocuments({ chat: chatId })
    ]);

    // Format messages for mobile app
    const formattedMessages = messages.reverse().map(message => ({
      _id: message._id,
      content: message.content,
      isFromMe: message.sender._id.toString() === userId.toString(),
      sender: {
        _id: message.sender._id,
        displayName: message.sender.displayName,
        profileImage: message.sender.profileImage?.url
      },
      isRead: message.isRead,
      createdAt: message.createdAt
    }));

    // Mark messages as read
    await messageModel.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    );

    const response = {
      messages: formattedMessages,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + messages.length < totalCount
      }
    };

    res.success(response, 'تم جلب الرسائل بنجاح');
  } catch (error) {
    console.error('Get messages error:', error);
    next(new Error('حدث خطأ أثناء جلب الرسائل', { cause: 500 }));
  }
});

/**
 * Send message
 */
export const sendMessage = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId } = req.params;
    const { content } = req.body;
    const userId = req.user._id;

    if (!content?.trim()) {
      return res.fail(null, 'محتوى الرسالة مطلوب', 400);
    }

    // Check if user is member of chat
    const chat = await chatModel.findOne({
      _id: chatId,
      members: userId,
      isDeleted: { $ne: true }
    });

    if (!chat) {
      return res.fail(null, 'المحادثة غير موجودة أو غير مصرح بالوصول إليها', 404);
    }

    // Get receiver ID
    const receiverId = chat.members.find(member => member.toString() !== userId.toString());

    // Create message
    const message = await messageModel.create({
      chat: chatId,
      sender: userId,
      content: content.trim(),
      isRead: false
    });

    // Update chat last message
    await chatModel.findByIdAndUpdate(chatId, {
      lastMessage: message._id,
      updatedAt: new Date()
    });

    // Populate message with sender info
    const populatedMessage = await messageModel
      .findById(message._id)
      .populate('sender', 'displayName profileImage')
      .lean();

    // Format message for response
    const formattedMessage = {
      _id: populatedMessage._id,
      content: populatedMessage.content,
      isFromMe: true,
      sender: {
        _id: populatedMessage.sender._id,
        displayName: populatedMessage.sender.displayName,
        profileImage: populatedMessage.sender.profileImage?.url
      },
      isRead: populatedMessage.isRead,
      createdAt: populatedMessage.createdAt
    };

    // Send notification to receiver
    try {
      await createNotification({
        userId: receiverId,
        title: 'رسالة جديدة',
        message: `${req.user.displayName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
        type: 'message',
        sender: userId,
        data: {
          chatId: chatId.toString(),
          messageId: message._id.toString()
        }
      });
    } catch (notificationError) {
      console.error('Failed to send message notification:', notificationError);
    }

    res.success(formattedMessage, 'تم إرسال الرسالة بنجاح');
  } catch (error) {
    console.error('Send message error:', error);
    next(new Error('حدث خطأ أثناء إرسال الرسالة', { cause: 500 }));
  }
});

/**
 * Mark messages as read
 */
export const markAsRead = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId } = req.params;
    const userId = req.user._id;

    // Check if user is member of chat
    const chat = await chatModel.findOne({
      _id: chatId,
      members: userId,
      isDeleted: { $ne: true }
    });

    if (!chat) {
      return res.fail(null, 'المحادثة غير موجودة', 404);
    }

    // Mark messages as read
    const result = await messageModel.updateMany(
      {
        chat: chatId,
        sender: { $ne: userId },
        isRead: false
      },
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    res.success({
      markedCount: result.modifiedCount
    }, 'تم وضع علامة مقروء على الرسائل');
  } catch (error) {
    console.error('Mark as read error:', error);
    next(new Error('حدث خطأ أثناء تحديث حالة الرسائل', { cause: 500 }));
  }
});

/**
 * Delete chat
 */
export const deleteChat = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId } = req.params;
    const userId = req.user._id;

    // Check if user is member of chat
    const chat = await chatModel.findOne({
      _id: chatId,
      members: userId
    });

    if (!chat) {
      return res.fail(null, 'المحادثة غير موجودة', 404);
    }

    // Soft delete chat
    await chatModel.findByIdAndUpdate(chatId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedBy: userId
    });

    res.success(null, 'تم حذف المحادثة بنجاح');
  } catch (error) {
    console.error('Delete chat error:', error);
    next(new Error('حدث خطأ أثناء حذف المحادثة', { cause: 500 }));
  }
});

/**
 * Get socket token for real-time messaging
 */
export const getSocketToken = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Generate a temporary token for socket connection
  const token = jwt.sign(
    { userId, type: 'socket' },
    process.env.TOKEN_KEY,
    { expiresIn: '1h' }
  );
  
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
  
  res.success({
    token,
    userId,
    expiresAt
  }, 'تم إنشاء رمز الاتصال بنجاح');
});
