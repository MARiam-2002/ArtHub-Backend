import chatModel from '../../../DB/models/chat.model.js';
import messageModel from '../../../DB/models/message.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { sendChatMessageNotification } from '../../utils/pushNotifications.js';

/**
 * جلب قائمة المحادثات للمستخدم الحالي
 */
export const getUserChats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // جلب جميع المحادثات مع آخر رسالة والمستخدم الآخر
  const chats = await chatModel.find({
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
  const formattedChats = await Promise.all(chats.map(async (chat) => {
    // جلب آخر رسالة إذا لم تكن موجودة
    let lastMessage = chat.lastMessage;
    if (!lastMessage) {
      lastMessage = await messageModel.findOne({ chat: chat._id })
        .sort({ createdAt: -1 })
        .select('sender text createdAt');
    }
      
    // المستخدم الآخر في المحادثة
    const otherUser = chat.members[0]; // هذا سيكون المستخدم الآخر لأننا استبعدنا المستخدم الحالي في الاستعلام
    
    // عدد الرسائل غير المقروءة
    const unreadCount = chat.unreadCounts?.get(userId.toString()) || 0;
    
    return {
      _id: chat._id,
      otherUser: {
        _id: otherUser?._id,
        displayName: otherUser?.displayName,
        profileImage: otherUser?.profileImage
      },
      lastMessage: lastMessage ? {
        text: lastMessage.text,
        isFromMe: lastMessage.sender.toString() === userId.toString(),
        createdAt: lastMessage.createdAt
      } : null,
      unreadCount,
      updatedAt: chat.updatedAt
    };
  }));
  
  res.success(formattedChats, 'تم جلب المحادثات بنجاح');
});

/**
 * جلب رسائل محادثة معينة
 */
export const getMessages = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  
  // التحقق من وجود المحادثة وأن المستخدم مشارك فيها
  const chat = await chatModel.findOne({
    _id: chatId,
    members: userId
  }).populate({
    path: 'members',
    match: { _id: { $ne: userId } },
    select: 'displayName profileImage'
  });
  
  if (!chat) {
    return res.fail(null, 'المحادثة غير موجودة أو غير مصرح بالوصول إليها', 404);
  }
  
  // إعادة تعيين عدد الرسائل غير المقروءة
  if (chat.unreadCounts && chat.unreadCounts.get(userId.toString()) > 0) {
    chat.unreadCounts.set(userId.toString(), 0);
    await chat.save();
  }
  
  // جلب الرسائل
  const messages = await messageModel.find({ chat: chatId })
    .sort({ createdAt: 1 })
    .populate('sender', 'displayName profileImage');
  
  // تنسيق الرسائل
  const formattedMessages = messages.map(msg => ({
    _id: msg._id,
    text: msg.text,
    isFromMe: msg.sender._id.toString() === userId.toString(),
    sender: {
      _id: msg.sender._id,
      displayName: msg.sender.displayName,
      profileImage: msg.sender.profileImage
    },
    createdAt: msg.createdAt
  }));
  
  // معلومات المستخدم الآخر في المحادثة
  const otherUser = chat.members[0]; // هذا سيكون المستخدم الآخر لأننا استبعدنا المستخدم الحالي في الاستعلام
  
  res.success({
    chat: {
      _id: chat._id,
      otherUser: {
        _id: otherUser?._id,
        displayName: otherUser?.displayName,
        profileImage: otherUser?.profileImage
      }
    },
    messages: formattedMessages
  }, 'تم جلب الرسائل بنجاح');
});

/**
 * إرسال رسالة جديدة
 */
export const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { text } = req.body;
  const userId = req.user._id;
  
  // التحقق من وجود المحادثة وأن المستخدم مشارك فيها
  const chat = await chatModel.findOne({
    _id: chatId,
    members: userId
  });
  
  if (!chat) {
    return res.fail(null, 'المحادثة غير موجودة أو غير مصرح بالوصول إليها', 404);
  }
  
  // إنشاء الرسالة
  const message = await messageModel.create({
    chat: chatId,
    sender: userId,
    text
  });
  
  // تحميل بيانات المرسل
  await message.populate('sender', 'displayName profileImage');
  
  // تحديث آخر رسالة وعدد الرسائل غير المقروءة
  const otherUserId = chat.members.find(m => m.toString() !== userId.toString());
  
  if (otherUserId) {
    // زيادة عدد الرسائل غير المقروءة للمستخدم الآخر
    const unreadCount = (chat.unreadCounts?.get(otherUserId.toString()) || 0) + 1;
    
    if (!chat.unreadCounts) {
      chat.unreadCounts = new Map();
    }
    
    chat.unreadCounts.set(otherUserId.toString(), unreadCount);
    
    // تحديث آخر رسالة
    chat.lastMessage = message._id;
    chat.updatedAt = Date.now();
    
    await chat.save();
    
    // إرسال إشعار للمستخدم الآخر
    const sender = await userModel.findById(userId).select('displayName');
    
    await sendChatMessageNotification(
      otherUserId.toString(),
      userId.toString(),
      sender.displayName,
      text,
      chatId.toString()
    );
  }
  
  // تنسيق الرسالة للرد
  const formattedMessage = {
    _id: message._id,
    text: message.text,
    isFromMe: true,
    sender: {
      _id: message.sender._id,
      displayName: message.sender.displayName,
      profileImage: message.sender.profileImage
    },
    createdAt: message.createdAt
  };
  
  res.status(201).success(formattedMessage, 'تم إرسال الرسالة بنجاح');
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
      $all: [
        mongoose.Types.ObjectId(userId), 
        mongoose.Types.ObjectId(otherUserId)
      ] 
    }
  });
  
  if (existingChat) {
    return res.success({
      _id: existingChat._id,
      otherUser: {
        _id: otherUser._id,
        displayName: otherUser.displayName,
        profileImage: otherUser.profileImage
      }
    }, 'المحادثة موجودة بالفعل');
  }
  
  // إنشاء محادثة جديدة
  const unreadCounts = new Map();
  unreadCounts.set(userId.toString(), 0);
  unreadCounts.set(otherUserId.toString(), 0);
  
  const chat = await chatModel.create({
    members: [userId, otherUserId],
    unreadCounts
  });
  
  res.status(201).success({
    _id: chat._id,
    otherUser: {
      _id: otherUser._id,
      displayName: otherUser.displayName,
      profileImage: otherUser.profileImage
    }
  }, 'تم إنشاء المحادثة بنجاح');
});

/**
 * تحديث حالة قراءة الرسائل
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const userId = req.user._id;
  
  // التحقق من وجود المحادثة وأن المستخدم مشارك فيها
  const chat = await chatModel.findOne({
    _id: chatId,
    members: userId
  });
  
  if (!chat) {
    return res.fail(null, 'المحادثة غير موجودة أو غير مصرح بالوصول إليها', 404);
  }
  
  // إعادة تعيين عدد الرسائل غير المقروءة
  if (!chat.unreadCounts) {
    chat.unreadCounts = new Map();
  }
  
  chat.unreadCounts.set(userId.toString(), 0);
  await chat.save();
  
  res.success(null, 'تم تحديث حالة قراءة الرسائل بنجاح');
});

/**
 * واجهة بديلة للتوافق - الحصول على محادثات المستخدم
 */
export const getChats = asyncHandler(async (req, res) => {
  return getUserChats(req, res);
}); 