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
import { cacheChatData, invalidateUserCache } from '../../utils/cacheHelpers.js';

/**
 * Helper function to safely format image URLs
 */
function getImageUrl(imageField, defaultUrl = null) {
  if (!imageField) return defaultUrl;
  
  if (typeof imageField === 'string') return imageField;
  if (imageField.url) return imageField.url;
  if (Array.isArray(imageField) && imageField.length > 0) {
    return imageField[0].url || imageField[0];
  }
  
  return defaultUrl;
}

/**
 * Helper function to format user data for chat
 */
function formatUserForChat(user) {
  if (!user) return null;
  
  return {
    _id: user._id,
    displayName: user.displayName || 'مستخدم',
    profileImage: getImageUrl(user.profileImage, user.photoURL),
    isOnline: user.isOnline || false,
    lastSeen: user.lastSeen || user.updatedAt,
    isVerified: user.isVerified || false,
    role: user.role || 'user'
  };
}

/**
 * Helper function to format message data for Flutter
 */
function formatMessage(message, currentUserId) {
  if (!message) return null;
  
  // Get formatted content based on message type (like WhatsApp)
  let displayContent = '';
  
  if (message.isDeleted) {
    displayContent = '🗑️ تم حذف هذه الرسالة';
  } else {
    switch (message.messageType) {
      case 'image':
        displayContent = message.attachments && message.attachments.length > 1 ? 
          `🖼️ ${message.attachments.length} صور` : '🖼️ صورة';
        break;
      case 'file':
        displayContent = message.attachments && message.attachments.length > 1 ? 
          `📎 ${message.attachments.length} ملفات` : '📎 ملف';
        break;
      case 'voice':
        displayContent = '🎵 رسالة صوتية';
        break;
      case 'location':
        displayContent = '📍 موقع';
        break;
      case 'contact':
        displayContent = '👤 جهة اتصال';
        break;
      default:
        displayContent = message.content || message.text || '';
        break;
    }
  }
  
  return {
    _id: message._id,
    content: displayContent, // Use formatted content for display (includes icon)
    originalContent: message.content || message.text || '', // Keep original content for editing
    messageType: message.messageType || 'text',
    isFromMe: message.isFromMe !== undefined ? message.isFromMe : (message.sender?._id?.toString() === currentUserId?.toString()),
    sender: formatUserForChat(message.sender),
    attachments: message.attachments || [],
    images: message.images || [],
    isRead: message.isRead || false,
    readAt: message.readAt,
    isEdited: message.isEdited || false,
    isDeleted: message.isDeleted || false,
    replyTo: message.replyTo ? {
      _id: message.replyTo._id,
      content: message.replyTo.content || message.replyTo.text || '',
      sender: formatUserForChat(message.replyTo.sender)
    } : null,
    sentAt: message.sentAt || message.createdAt,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt
  };
}

/**
 * Helper function to format chat data for Flutter
 */
function formatChat(chat, currentUserId) {
  if (!chat) return null;
  
  // Get the other user in the chat
  const otherUser = chat.members?.find(member => 
    member._id?.toString() !== currentUserId?.toString()
  );
  
  return {
    _id: chat._id,
    otherUser: formatUserForChat(otherUser),
    lastMessage: chat.lastMessage ? formatMessage(chat.lastMessage, currentUserId) : null,
    unreadCount: chat.unreadCount || 0,
    isArchived: chat.isArchived || false,
    isMuted: chat.isMuted || false,
    lastActivity: chat.lastActivity || chat.updatedAt,
    createdAt: chat.createdAt,
    updatedAt: chat.updatedAt
  };
}

/**
 * Get user chats with enhanced formatting for Flutter - Performance Optimized
 */
export const getChats = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { page = 1, limit = 20, search = '' } = req.query;
    const skip = (page - 1) * limit;

    // Build query for searching
    let searchQuery = { 
      members: { $in: [userId] }, 
      isDeleted: { $ne: true } 
    };

    let searchUsers = [];
    if (search.trim()) {
      // Search in other user's display name
      searchUsers = await userModel.find({
        displayName: { $regex: search, $options: 'i' }
      }).select('_id').lean();
      
      const userIds = searchUsers.map(user => user._id);
      searchQuery.members = { $in: [userId, ...userIds] };
    }

    // Parallel operations for better performance
    const [chats, totalCount, totalUnreadCount] = await Promise.all([
      chatModel
        .find(searchQuery)
        .populate({
          path: 'members',
          select: 'displayName profileImage photoURL isOnline lastSeen isVerified role'
        })
        .populate({
          path: 'lastMessage',
          select: 'content text messageType sender isRead readAt sentAt createdAt',
          populate: {
            path: 'sender',
            select: 'displayName profileImage photoURL'
          }
        })
        .sort({ lastActivity: -1, updatedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      
      chatModel.countDocuments(searchQuery),
      
      // Get total unread count in parallel
      messageModel.countDocuments({
        chat: { $in: [] }, // Will be updated after chats are fetched
        sender: { $ne: userId },
        isRead: false
      })
    ]);

    // Update unread count query with actual chat IDs
    const actualUnreadCount = chats.length > 0 ? await messageModel.countDocuments({
      chat: { $in: chats.map(chat => chat._id) },
      sender: { $ne: userId },
      isRead: false
    }) : 0;

    // Format chats for Flutter
    const formattedChats = chats.map(chat => formatChat(chat, userId));

    res.success({
      chats: formattedChats,
      totalUnreadCount: actualUnreadCount,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + chats.length < totalCount,
        hasPrevPage: Number(page) > 1
      }
    }, 'تم جلب المحادثات بنجاح', 200, {
      timestamp: new Date().toISOString(),
      userId: userId
    });

  } catch (error) {
    console.error('Get chats error:', error);
    return res.fail(null, 'حدث خطأ أثناء جلب المحادثات', 500);
  }
});

/**
 * Get or create chat with user - Enhanced for Flutter with Performance Optimization
 */
export const getOrCreateChat = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { otherUserId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المستخدم غير صالح',
        data: null
      });
    }

    // Parallel operations for better performance
    const [otherUser, existingChat] = await Promise.all([
      // Check if user exists and is active
      userModel
        .findOne({ _id: otherUserId, isActive: true, isDeleted: false })
        .select('displayName profileImage photoURL isOnline lastSeen isVerified role')
        .lean(),
      
      // Check if chat already exists
      chatModel.findOne({
        members: { $all: [userId, otherUserId] },
        isDeleted: { $ne: true }
      })
      .populate({
        path: 'members',
        select: 'displayName profileImage photoURL isOnline lastSeen isVerified role'
      })
      .populate({
        path: 'lastMessage',
        select: 'content text messageType sender isRead readAt sentAt createdAt',
        populate: {
          path: 'sender',
          select: 'displayName profileImage photoURL'
        }
      })
      .lean()
    ]);

    if (!otherUser) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود أو غير نشط',
        data: null
      });
    }

    let chat = existingChat;

    if (!chat) {
      // Create new chat with optimized approach
      const newChat = await chatModel.create({
        members: [userId, otherUserId],
        sender: userId,
        receiver: otherUserId,
        chatType: 'private'
      });

      // Populate the newly created chat with parallel operations
      const [populatedChat] = await Promise.all([
        chatModel.findById(newChat._id)
          .populate({
            path: 'members',
            select: 'displayName profileImage photoURL isOnline lastSeen isVerified role'
          })
          .lean(),
        
        // Invalidate cache for both users immediately
        invalidateUserCache(userId),
        invalidateUserCache(otherUserId)
      ]);

      chat = populatedChat;
        
      // Send new chat event via Socket.IO (non-blocking)
      setImmediate(() => {
        try {
          const formattedChat = formatChat(chat, userId);
          console.log('📡 Sending new_chat event to users:', userId, otherUserId);
          sendToUser(userId, 'new_chat', formattedChat);
          sendToUser(otherUserId, 'new_chat', formattedChat);
        } catch (socketError) {
          console.warn('Socket.IO new chat notification failed:', socketError);
        }
      });
    } else {
      // For existing chats, invalidate cache in background
      setImmediate(() => {
        invalidateUserCache(userId);
        invalidateUserCache(otherUserId);
      });
    }

    const response = {
      success: true,
      message: 'تم إنشاء المحادثة بنجاح',
      data: {
        chat: formatChat(chat, userId)
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Get or create chat error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إنشاء المحادثة',
      error: error.message
    });
  }
});

/**
 * Get chat messages with enhanced formatting for Flutter - Performance Optimized
 */
export const getMessages = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId } = req.params;
    const userId = req.user._id;
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المحادثة غير صالح',
        data: null
      });
    }

    // Parallel operations for better performance
    const [chat, messages, totalCount] = await Promise.all([
      // Check if user is member of chat
      chatModel.findOne({
        _id: chatId,
        members: { $in: [userId] },
        isDeleted: { $ne: true }
      })
      .populate({
        path: 'members',
        select: 'displayName profileImage photoURL isOnline lastSeen isVerified role'
      })
      .populate({
        path: 'lastMessage',
        select: 'content text messageType sender isRead readAt sentAt createdAt',
        populate: {
          path: 'sender',
          select: 'displayName profileImage photoURL'
        }
      })
      .lean(),
      
      // Get messages
      messageModel
        .find({ chat: chatId, isDeleted: { $ne: true } })
        .populate({
          path: 'sender',
          select: 'displayName profileImage photoURL isVerified role'
        })
        .populate({
          path: 'replyTo',
          select: 'content text messageType sender createdAt',
          populate: {
            path: 'sender',
            select: 'displayName profileImage photoURL'
          }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      
      // Get total count
      messageModel.countDocuments({ chat: chatId, isDeleted: { $ne: true } })
    ]);

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'المحادثة غير موجودة أو لا تملك صلاحية الوصول إليها',
        data: null
      });
    }

    // Format messages for Flutter
    const formattedMessages = messages
      .reverse()
      .map(message => formatMessage(message, userId));

    // Mark messages as read in background (non-blocking)
    setImmediate(async () => {
      try {
        await messageModel.updateMany(
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
        
        // Invalidate cache for both users
        const otherUser = chat.members.find(member => 
          member._id.toString() !== userId.toString()
        );
        if (otherUser) {
          await Promise.all([
            invalidateUserCache(userId),
            invalidateUserCache(otherUser._id)
          ]);
        }
      } catch (markReadError) {
        console.warn('Mark messages as read failed:', markReadError);
      }
    });

    res.success({
      chat: formatChat(chat, userId),
      messages: formattedMessages,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + messages.length < totalCount,
        hasPrevPage: Number(page) > 1
      }
    }, 'تم جلب الرسائل بنجاح', 200, {
      timestamp: new Date().toISOString(),
      userId: userId
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return res.fail(null, 'حدث خطأ أثناء جلب الرسائل', 500);
  }
});

/**
 * Send message with enhanced features for Flutter
 */
export const sendMessage = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId } = req.params;
    const { content, messageType = 'text', attachments = [], images = [], replyTo } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المحادثة غير صالح',
        data: null
      });
    }

    // Validate message content
    if (!content?.trim() && (!attachments || attachments.length === 0) && (!images || images.length === 0) && (!req.files || req.files.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'محتوى الرسالة أو المرفقات مطلوبة',
        data: null
      });
    }

    // Check if user is member of chat
    const chat = await chatModel.findOne({
      _id: chatId,
      members: { $in: [userId] },
      isDeleted: { $ne: true }
    }).lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'المحادثة غير موجودة أو غير مصرح بالوصول إليها',
        data: null
      });
    }

    // Get receiver ID
    const receiverId = chat.members.find(member => member.toString() !== userId.toString());

    // Validate reply-to message if provided
    let replyToMessage = null;
    if (replyTo && mongoose.Types.ObjectId.isValid(replyTo)) {
      replyToMessage = await messageModel.findOne({
        _id: replyTo,
        chat: chatId
      }).lean();
    }

    // معالجة الملفات المرفوعة (صور، صوت، فيديو)
    let uploadedAttachments = [];
    if (req.files && req.files.length > 0) {
      try {
        console.log('📎 Processing chat attachments:', req.files.length, 'files');
        
        const cloudinary = await import('cloudinary');
        cloudinary.v2.config({
          cloud_name: process.env.CLOUD_NAME,
          api_key: process.env.API_KEY,
          api_secret: process.env.API_SECRET
        });

        // رفع جميع الملفات
        const uploadPromises = req.files.map(async (file, index) => {
          try {
            console.log(`📤 Uploading file ${index + 1}:`, file.originalname);
            
            // تحديد نوع الملف
            let fileType = 'file';
            if (file.mimetype.startsWith('image/')) {
              fileType = 'image';
            } else if (file.mimetype.startsWith('audio/')) {
              fileType = 'voice';
            } else if (file.mimetype.startsWith('video/')) {
              fileType = 'video';
            }
            
            const { secure_url, public_id, format, bytes } = await cloudinary.v2.uploader.upload(
              file.path,
              {
                folder: `arthub/chat-messages/${chatId}/${Date.now()}`,
                resource_type: 'auto', // يدعم جميع أنواع الملفات
                allowed_formats: [
                  // صور
                  'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
                  // صوت
                  'mp3', 'wav', 'aac', 'flac', 'ogg',
                  // فيديو
                  'mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm', '3gp', 'flv',
                  // مستندات
                  'pdf', 'doc', 'docx', 'txt'
                ],
                transformation: fileType === 'image' ? [
                  { width: 1920, height: 1080, crop: 'limit' },
                  { quality: 'auto:good' }
                ] : undefined
              }
            );

            console.log(`✅ File ${index + 1} uploaded:`, secure_url);
            
            return {
              url: secure_url,
              type: fileType,
              name: file.originalname,
              size: bytes,
              mimeType: file.mimetype,
              duration: fileType === 'voice' ? undefined : undefined, // سيتم إضافة duration للصوت لاحقاً
              dimensions: fileType === 'image' ? { width: 0, height: 0 } : undefined
            };
          } catch (error) {
            console.error(`❌ Error uploading file ${index + 1}:`, error);
            throw new Error(`فشل في رفع الملف: ${file.originalname}`);
          }
        });

        uploadedAttachments = await Promise.all(uploadPromises);
        console.log('✅ All chat files uploaded successfully');
        
      } catch (error) {
        console.error('❌ Error processing chat files:', error);
        return res.status(400).json({
          success: false,
          message: 'فشل في رفع الملفات المرفقة: ' + error.message,
          data: null
        });
      }
    }

    // دمج المرفقات المرفوعة مع المرفقات الموجودة
    const allAttachments = [...(attachments || []), ...uploadedAttachments];

    // Create message
    const messageData = {
      chat: chatId,
      sender: userId,
      content: content?.trim() || '',
      messageType: uploadedAttachments.length > 0 ? uploadedAttachments[0].type : messageType,
      attachments: allAttachments,
      images: images || [],
      isRead: false,
      isFromMe: true, // هذه الرسالة من المستخدم الحالي
      sentAt: new Date()
    };

    // Add reply reference if valid
    if (replyToMessage) {
      messageData.replyTo = replyTo;
    }

    // Support legacy 'text' field for backward compatibility
    if (messageType === 'text') {
      messageData.text = content?.trim() || '';
    }

    // Parallel operations for better performance
    const [message, sender] = await Promise.all([
      // Create message
      messageModel.create(messageData),
      
      // Get sender info for notifications
      userModel.findById(userId).select('displayName').lean()
    ]);

    // Update chat last message and activity in parallel with message population
    const [populatedMessage] = await Promise.all([
      // Populate message with sender info
      messageModel
        .findById(message._id)
        .populate({
          path: 'sender',
          select: 'displayName profileImage photoURL isVerified role'
        })
        .populate({
          path: 'replyTo',
          select: 'content text messageType sender createdAt',
          populate: {
            path: 'sender',
            select: 'displayName profileImage photoURL'
          }
        })
        .lean(),
      
      // Update chat last message and activity
      chatModel.findByIdAndUpdate(chatId, {
        lastMessage: message._id,
        lastActivity: new Date()
      })
    ]);

    // Format message for response
    const formattedMessage = formatMessage(populatedMessage, userId);

    // Send notifications in background (non-blocking)
    setImmediate(async () => {
      try {
        // Send real-time notification via Socket.IO
        const unreadCount = await messageModel.countDocuments({
          chat: chatId,
          sender: { $ne: receiverId },
          isRead: false,
          isDeleted: { $ne: true }
        });

        // Send to both users in the private chat
        // Send to sender (for confirmation)
        sendToUser(userId, 'new_message', {
          chatId: chatId,
          message: formattedMessage,
          unreadCount: unreadCount
        });
        
        // Send to receiver (the other person in the chat)
        if (receiverId) {
          sendToUser(receiverId, 'new_message', {
            chatId: chatId,
            message: formattedMessage,
            unreadCount: unreadCount
          });
        }

        // Send push notification to receiver
        if (receiverId) {
          const senderName = sender?.displayName || 'مستخدم';
          
          // إرسال الإشعارات مباشرة إذا كان لدى المستخدم FCM tokens
          const receiver = await userModel.findById(receiverId).select('fcmTokens displayName email');
          
          if (receiver && receiver.fcmTokens && receiver.fcmTokens.length > 0) {
            await sendChatMessageNotification(
              receiverId,
              userId,
              senderName,
              content,
              chatId,
              messageType
            );
            
            console.log(`✅ Push notification sent to ${receiver.displayName || receiver.email}`);
          } else {
            console.log(`⚠️  No FCM tokens found for user ${receiverId}`);
          }
        }

        // Invalidate cache for both users
        await Promise.all([
          invalidateUserCache(userId),
          receiverId ? invalidateUserCache(receiverId) : Promise.resolve()
        ]);
      } catch (notificationError) {
        console.warn('Background notification operations failed:', notificationError);
      }
    });

    const response = {
      success: true,
      message: 'تم إرسال الرسالة بنجاح',
      data: {
        message: formattedMessage
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Send message error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء إرسال الرسالة',
      error: error.message
    });
  }
});

/**
 * Mark chat messages as read
 */
export const markAsRead = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المحادثة غير صالح',
        data: null
      });
    }

    // Check if user is member of chat
    const chat = await chatModel.findOne({
      _id: chatId,
      members: { $in: [userId] },
      isDeleted: { $ne: true }
    }).lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'المحادثة غير موجودة أو غير مصرح بالوصول إليها',
        data: null
      });
    }

    // Mark messages as read and get other user for cache invalidation
    const [result, otherUser] = await Promise.all([
      messageModel.updateMany(
        {
          chat: chatId,
          sender: { $ne: userId },
          isRead: false
        },
        { 
          isRead: true, 
          readAt: new Date() 
        }
      ),
      
      // Get other user for cache invalidation
      userModel.findOne({
        _id: { $in: chat.members.filter(member => member.toString() !== userId.toString()) }
      }).select('_id').lean()
    ]);

    // Send notifications and invalidate cache in background
    setImmediate(async () => {
      try {
        // Send real-time notification about read status
        sendToChat(chatId, 'messages_read', {
          chatId,
          readBy: userId,
          readAt: new Date().toISOString()
        });

        // Invalidate cache for both users
        await Promise.all([
          invalidateUserCache(userId),
          otherUser ? invalidateUserCache(otherUser._id) : Promise.resolve()
        ]);
      } catch (backgroundError) {
        console.warn('Background operations failed:', backgroundError);
      }
    });

    const response = {
      success: true,
      message: 'تم تمييز الرسائل كمقروءة بنجاح',
      data: {
        modifiedCount: result.modifiedCount
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Mark as read error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تمييز الرسائل كمقروءة',
      error: error.message
    });
  }
});

/**
 * Delete message - Enhanced for Flutter
 */
export const deleteMessage = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { chatId, messageId } = req.params;
    const userId = req.user._id;
    const { deleteForEveryone = false } = req.body;

    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف المحادثة أو الرسالة غير صالح',
        data: null
      });
    }

    // Check if user is member of chat
    const chat = await chatModel.findOne({
      _id: chatId,
      members: { $in: [userId] },
      isDeleted: { $ne: true }
    }).lean();

    if (!chat) {
      return res.status(404).json({
        success: false,
        message: 'المحادثة غير موجودة أو غير مصرح بالوصول إليها',
        data: null
      });
    }

    // Find the message
    const message = await messageModel.findOne({
      _id: messageId,
      chat: chatId
    }).lean();

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'الرسالة غير موجودة',
        data: null
      });
    }

    // Check if user can delete this message
    const isMessageOwner = message.sender.toString() === userId.toString();
    const messageAgeInMinutes = (new Date() - new Date(message.createdAt)) / (1000 * 60);

    if (deleteForEveryone && (!isMessageOwner || messageAgeInMinutes > 60)) {
      return res.status(403).json({
        success: false,
        message: 'لا يمكن حذف الرسالة للجميع بعد مرور ساعة أو إذا لم تكن مالك الرسالة',
        data: null
      });
    }

    let updateQuery = {};
    if (deleteForEveryone) {
      // Delete for everyone
      updateQuery = {
        isDeleted: true,
        deletedAt: new Date(),
        content: 'تم حذف هذه الرسالة',
        text: 'تم حذف هذه الرسالة'
      };
    } else {
      // Delete for current user only
      updateQuery = {
        $addToSet: { deletedFor: userId }
      };
    }

    await messageModel.findByIdAndUpdate(messageId, updateQuery);

    // Send real-time notification about message deletion
    try {
      sendToChat(chatId, 'message_deleted', {
        messageId,
        deletedBy: userId,
        deleteForEveryone,
        deletedAt: new Date().toISOString()
      });
    } catch (socketError) {
      console.warn('Socket.IO delete notification failed:', socketError);
    }

    const response = {
      success: true,
      message: deleteForEveryone ? 'تم حذف الرسالة للجميع' : 'تم حذف الرسالة لك',
      data: {
        messageId,
        deleteForEveryone
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Delete message error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف الرسالة',
      error: error.message
    });
  }
});

/**
 * Get unread messages count
 */
export const getUnreadCount = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;

    // Get all user's chats
    const userChats = await chatModel.find({
      members: { $in: [userId] },
      isDeleted: { $ne: true }
    }).select('_id').lean();

    const chatIds = userChats.map(chat => chat._id);

    // Count unread messages
    const unreadCount = await messageModel.countDocuments({
      chat: { $in: chatIds },
      sender: { $ne: userId },
      isRead: false,
      isDeleted: { $ne: true }
    });

    const response = {
      success: true,
      message: 'تم جلب عدد الرسائل غير المقروءة بنجاح',
      data: {
        unreadCount
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get unread count error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب عدد الرسائل غير المقروءة',
      error: error.message
    });
  }
});

/**
 * Get unread counts for all chats separately
 */
export const getUnreadCounts = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;

    // Get all user's chats
    const userChats = await chatModel.find({
      members: { $in: [userId] },
      isDeleted: { $ne: true }
    }).select('_id').lean();

    const chatIds = userChats.map(chat => chat._id);

    // Count unread messages for each chat separately
    const unreadCounts = {};
    
    for (const chatId of chatIds) {
      const count = await messageModel.countDocuments({
        chat: chatId,
        sender: { $ne: userId },
        isRead: false,
        isDeleted: { $ne: true }
      });
      
      if (count > 0) {
        unreadCounts[chatId.toString()] = count;
      }
    }

    const response = {
      success: true,
      message: 'تم جلب عدد الرسائل غير المقروءة لكل محادثة بنجاح',
      data: {
        unreadCounts
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get unread counts error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب عدد الرسائل غير المقروءة',
      error: error.message
    });
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
      members: { $in: [userId] }
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
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء حذف المحادثة',
      error: error.message
    });
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
