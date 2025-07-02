import chatModel from '../../../DB/models/chat.model.js';
import messageModel from '../../../DB/models/message.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { sendChatMessageNotification } from '../../utils/pushNotifications.js';
import { sendNotification } from '../notification/notification.controller.js';
import { sendToChat, sendToUser } from '../../utils/socketService.js';
import jwt from 'jsonwebtoken';

/**
 * جلب قائمة المحادثات للمستخدم الحالي
 */
export const getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // جلب جميع المحادثات مع آخر رسالة والمستخدم الآخر
  const chats = await chatModel
    .find({
      members: userId
    })
    .populate({
      path: 'members',
      match: { _id: { $ne: userId } },
      select: 'displayName profileImage'
    })
    .populate({
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'displayName profileImage'
      }
    })
    .sort({ updatedAt: -1 });

  // تحميل آخر رسالة لكل محادثة
  const formattedChats = await Promise.all(
    chats.map(async chat => {
      // جلب آخر رسالة إذا لم تكن موجودة
      let lastMessage = chat.lastMessage;
      if (!lastMessage) {
        lastMessage = await messageModel
          .findOne({ chat: chat._id })
          .sort({ createdAt: -1 })
          .select('sender content createdAt');
      }

      // المستخدم الآخر في المحادثة
      const otherUser = chat.members[0]; // هذا سيكون المستخدم الآخر لأننا استبعدنا المستخدم الحالي في الاستعلام

      // عدد الرسائل غير المقروءة
      const unreadCount = await messageModel.countDocuments({
        chat: chat._id,
        sender: { $ne: userId },
        isRead: false
      });

      return {
        _id: chat._id,
        otherUser: {
          _id: otherUser?._id,
          displayName: otherUser?.displayName,
          profileImage: otherUser?.profileImage
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content || lastMessage.text, // دعم الاصدارات القديمة والجديدة
              isFromMe: lastMessage.sender.toString() === userId.toString(),
              createdAt: lastMessage.createdAt
            }
          : null,
        unreadCount,
        updatedAt: chat.updatedAt
      };
    })
  );

  res.success(formattedChats, 'تم جلب المحادثات بنجاح');
});

/**
 * جلب رسائل محادثة معينة
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  // التحقق من وجود المحادثة وأن المستخدم مشارك فيها
  const chat = await chatModel
    .findOne({
      _id: chatId,
      members: userId
    })
    .populate({
      path: 'members',
      match: { _id: { $ne: userId } },
      select: 'displayName profileImage'
    });

  if (!chat) {
    return res.fail(null, 'المحادثة غير موجودة أو غير مصرح بالوصول إليها', 404);
  }

  // جلب الرسائل
  const messages = await messageModel
    .find({ chat: chatId })
    .sort({ createdAt: 1 })
    .populate('sender', 'displayName profileImage');

  // تنسيق الرسائل
  const formattedMessages = messages.map(msg => ({
    _id: msg._id,
    content: msg.content || msg.text, // دعم الاصدارات القديمة والجديدة
    isFromMe: msg.sender._id.toString() === userId.toString(),
    sender: {
      _id: msg.sender._id,
      displayName: msg.sender.displayName,
      profileImage: msg.sender.profileImage
    },
    isRead: msg.isRead,
    createdAt: msg.createdAt
  }));

  // معلومات المستخدم الآخر في المحادثة
  const otherUser = chat.members[0]; // هذا سيكون المستخدم الآخر لأننا استبعدنا المستخدم الحالي في الاستعلام

  // تحديث حالة قراءة الرسائل
  await markAsRead(req, res, false); // تمرير false لمنع الرد المباشر

  res.success(
    {
      chat: {
        _id: chat._id,
        otherUser: {
          _id: otherUser?._id,
          displayName: otherUser?.displayName,
          profileImage: otherUser?.profileImage
        }
      },
      messages: formattedMessages
    },
    'تم جلب الرسائل بنجاح'
  );
});

/**
 * إرسال رسالة جديدة
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  // تحقق من وجود المحادثة ومن أن المستخدم عضو فيها
  const chat = await chatModel.findOne({
    _id: chatId,
    members: userId,
    isDeleted: { $ne: true }
  });

  if (!chat) {
    return res.status(404).json({
      success: false,
      message: 'المحادثة غير موجودة',
      error: 'Chat not found'
    });
  }

  // الحصول على معرف المستخدم الآخر
  const receiverId = chat.members.find(member => member.toString() !== userId.toString());

  // إنشاء رسالة جديدة
  const message = await messageModel.create({
    chat: chatId,
    sender: userId,
    content: content, // استخدام حقل content بدلاً من text
    isRead: false,
    sentAt: new Date()
  });

  // تحديث آخر رسالة في المحادثة
  chat.lastMessage = message._id;
  chat.updatedAt = new Date();
  await chat.save();

  // إعادة قراءة الرسالة مع معلومات المرسل
  const populatedMessage = await messageModel
    .findById(message._id)
    .populate('sender', 'displayName profileImage');

  // إعداد الرسالة المنسقة للرد
  const formattedMessage = {
    _id: populatedMessage._id,
    content: populatedMessage.content,
    isFromMe: true,
    sender: {
      _id: populatedMessage.sender._id,
      displayName: populatedMessage.sender.displayName,
      profileImage: populatedMessage.sender.profileImage
    },
    isRead: populatedMessage.isRead,
    createdAt: populatedMessage.createdAt
  };

  // إرسال الرسالة عبر Socket.io
  sendToChat(chatId, 'new_message', {
    ...formattedMessage,
    isFromMe: false, // سيتم عكسها للمستلم
    chatId
  });

  // إرسال تحديث للمحادثات للمستلم
  sendToUser(receiverId, 'update_chat_list', { chatId });

  res.status(201).json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح',
    data: formattedMessage
  });
});

/**
 * إنشاء محادثة جديدة
 */
export const createChat = asyncHandler(async (req, res) => {
  const { userId: otherUserId } = req.body;
  const userId = req.user._id;

  // التحقق من وجود المستخدم الآخر
  const otherUser = await userModel.findById(otherUserId).select('displayName profileImage');

  if (!otherUser) {
    return res.fail(null, 'المستخدم غير موجود', 404);
  }

  // التحقق من عدم وجود محادثة مسبقًا
  const existingChat = await chatModel.findOne({
    members: {
      $all: [mongoose.Types.ObjectId(userId), mongoose.Types.ObjectId(otherUserId)]
    }
  });

  if (existingChat) {
    return res.success(
      {
        _id: existingChat._id,
        otherUser: {
          _id: otherUser._id,
          displayName: otherUser.displayName,
          profileImage: otherUser.profileImage
        }
      },
      'المحادثة موجودة بالفعل'
    );
  }

  // إنشاء محادثة جديدة
  const chat = await chatModel.create({
    members: [userId, otherUserId],
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // إرسال إشعار للمستخدم الآخر
  sendToUser(otherUserId, 'new_chat', {
    chatId: chat._id,
    user: {
      _id: req.user._id,
      displayName: req.user.displayName,
      profileImage: req.user.profileImage
    }
  });

  res.status(201).success(
    {
      _id: chat._id,
      otherUser: {
        _id: otherUser._id,
        displayName: otherUser.displayName,
        profileImage: otherUser.profileImage
      }
    },
    'تم إنشاء المحادثة بنجاح'
  );
});

/**
 * تحديث حالة قراءة الرسائل
 */
export const markAsRead = asyncHandler(async (req, res, shouldRespond = true) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  // التحقق من وجود المحادثة وأن المستخدم مشارك فيها
  const chat = await chatModel.findOne({
    _id: chatId,
    members: userId
  });

  if (!chat) {
    if (shouldRespond) {
      return res.fail(null, 'المحادثة غير موجودة أو غير مصرح بالوصول إليها', 404);
    }
    return;
  }

  // تحديث حالة قراءة الرسائل
  const result = await messageModel.updateMany(
    {
      chat: chatId,
      sender: { $ne: userId },
      isRead: false
    },
    { isRead: true }
  );

  // إرسال إشعار بالقراءة عبر Socket.io
  if (result.modifiedCount > 0) {
    sendToChat(chatId, 'messages_read', {
      chatId,
      readBy: userId
    });

    // إعلام المستخدم الآخر أيضًا
    const otherUserId = chat.members.find(member => member.toString() !== userId.toString());
    if (otherUserId) {
      sendToUser(otherUserId, 'update_chat_list', { chatId });
    }
  }

  if (shouldRespond) {
    res.success({ modifiedCount: result.modifiedCount }, 'تم تحديث حالة قراءة الرسائل بنجاح');
  }
});

/**
 * واجهة بديلة للتوافق - الحصول على محادثات المستخدم
 */
export const getChats = asyncHandler(async (req, res) => getUserChats(req, res));

/**
 * Delete a chat
 */
export const deleteChat = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;

  // Find the chat
  const chat = await chatModel.findById(chatId);
  if (!chat) {
    return res.fail(null, 'المحادثة غير موجودة', 404);
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(p => p.toString() === userId.toString());
  if (!isParticipant) {
    return res.fail(null, 'غير مصرح لك بحذف هذه المحادثة', 403);
  }

  // Delete the chat and all its messages
  await Promise.all([
    chatModel.findByIdAndDelete(chatId),
    messageModel.deleteMany({ chat: chatId })
  ]);

  res.success(null, 'تم حذف المحادثة بنجاح');
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
