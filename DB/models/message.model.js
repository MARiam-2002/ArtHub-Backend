import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       required:
 *         - chat
 *         - sender
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         chat:
 *           type: string
 *           description: ID of the chat this message belongs to
 *         sender:
 *           type: string
 *           description: ID of the user who sent this message
 *         content:
 *           type: string
 *           description: Message content
 *         messageType:
 *           type: string
 *           enum: [text, image, file, voice, location, contact]
 *           description: Type of message
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *           description: Array of file attachments
 *         replyTo:
 *           type: string
 *           description: ID of the message being replied to
 *         isForwarded:
 *           type: boolean
 *           description: Indicates if message was forwarded
 *         forwardedFrom:
 *           type: string
 *           description: Original sender of forwarded message
 *         location:
 *           type: object
 *           description: Location data for location messages
 *         contact:
 *           type: object
 *           description: Contact data for contact messages
 *         isRead:
 *           type: boolean
 *           description: Indicates if message has been read by recipient
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when message was read
 *         isFromMe:
 *           type: boolean
 *           description: Indicates if message is from the current user (for UI positioning)
 *         isEdited:
 *           type: boolean
 *           description: Indicates if message was edited
 *         editHistory:
 *           type: array
 *           items:
 *             type: object
 *           description: History of message edits
 *         isDeleted:
 *           type: boolean
 *           description: Indicates if message was deleted
 *         deletedFor:
 *           type: array
 *           items:
 *             type: string
 *           description: Users for whom this message is deleted
 *         sentAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when message was sent
 *         deliveredAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when message was delivered
 *         metadata:
 *           type: object
 *           description: Additional message metadata
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Sub-schema for file attachments
const AttachmentSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'file', 'voice'],
    required: true
  },
  name: {
    type: String,
    maxlength: 255
  },
  size: {
    type: Number,
    max: 50 * 1024 * 1024 // 50MB max
  },
  mimeType: {
    type: String
  },
  duration: {
    type: Number // for voice messages in seconds
  },
  dimensions: {
    width: Number,
    height: Number
  },
  thumbnail: {
    type: String // URL to thumbnail for images/videos
  }
}, { _id: false });

// Sub-schema for location data
const LocationSchema = new Schema({
  latitude: {
    type: Number,
    required: true,
    min: -90,
    max: 90
  },
  longitude: {
    type: Number,
    required: true,
    min: -180,
    max: 180
  },
  address: {
    type: String,
    maxlength: 500
  },
  placeName: {
    type: String,
    maxlength: 200
  }
}, { _id: false });

// Sub-schema for contact data
const ContactSchema = new Schema({
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  phone: {
    type: String,
    validate: {
      validator: function(v) {
        return /^\+?[1-9]\d{1,14}$/.test(v);
      },
      message: 'رقم الهاتف غير صالح'
    }
  },
  email: {
    type: String,
    validate: {
      validator: function(v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'البريد الإلكتروني غير صالح'
    }
  },
  organization: {
    type: String,
    maxlength: 100
  }
}, { _id: false });

// Sub-schema for edit history
const EditHistorySchema = new Schema({
  originalContent: {
    type: String,
    required: true
  },
  editedAt: {
    type: Date,
    default: Date.now
  },
  reason: {
    type: String,
    maxlength: 200
  }
}, { _id: false });

const messageSchema = new Schema(
  {
    chat: {
      type: Types.ObjectId,
      ref: 'Chat',
      required: true,
      index: true
    },
    sender: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      maxlength: 2000
    },
    // Message type
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'voice', 'location', 'contact'],
      default: 'text'
    },
    // File attachments
    attachments: [AttachmentSchema],
    // Reply functionality
    replyTo: {
      type: Types.ObjectId,
      ref: 'Message'
    },
    // Forward functionality
    isForwarded: {
      type: Boolean,
      default: false
    },
    forwardedFrom: {
      type: Types.ObjectId,
      ref: 'User'
    },
    forwardedMessageId: {
      type: Types.ObjectId,
      ref: 'Message'
    },
    // Location data
    location: LocationSchema,
    // Contact data
    contact: ContactSchema,
    // Read status
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    // Message ownership - for Flutter UI positioning
    isFromMe: {
      type: Boolean,
      default: false,
      description: 'Indicates if message is from the current user (for UI positioning)'
    },
    // Edit functionality
    isEdited: {
      type: Boolean,
      default: false
    },
    editHistory: [EditHistorySchema],
    // Delete functionality
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedFor: [
      {
        type: Types.ObjectId,
        ref: 'User'
      }
    ],
    deletedAt: {
      type: Date
    },
    // Message status timestamps
    sentAt: {
      type: Date,
      default: Date.now
    },
    deliveredAt: {
      type: Date
    },
    // Legacy fields for backward compatibility
    text: {
      type: String
    },
    images: [
      {
        type: String
      }
    ],
    readBy: [
      {
        type: Types.ObjectId,
        ref: 'User'
      }
    ],
    // Message metadata
    metadata: {
      deviceInfo: {
        platform: String,
        version: String,
        userAgent: String
      },
      ipAddress: String,
      location: {
        country: String,
        city: String,
        timezone: String
      },
      reactions: [
        {
          userId: {
            type: Types.ObjectId,
            ref: 'User'
          },
          emoji: {
            type: String,
            maxlength: 10
          },
          createdAt: {
            type: Date,
            default: Date.now
          }
        }
      ],
      mentions: [
        {
          type: Types.ObjectId,
          ref: 'User'
        }
      ],
      hashtags: [String],
      links: [
        {
          url: String,
          title: String,
          description: String,
          image: String,
          domain: String
        }
      ]
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if message is deleted for a specific user
messageSchema.virtual('isDeletedFor').get(function() {
  return function(userId) {
    if (this.isDeleted) {
      return this.deletedFor.length === 0 || 
             this.deletedFor.some(id => id.toString() === userId.toString());
    }
    return this.deletedFor.some(id => id.toString() === userId.toString());
  };
});

// Virtual for getting message status
messageSchema.virtual('status').get(function() {
  if (this.isDeleted) return 'deleted';
  if (this.readAt) return 'read';
  if (this.deliveredAt) return 'delivered';
  return 'sent';
});

// Virtual for getting formatted content based on type
messageSchema.virtual('formattedContent').get(function() {
  if (this.isDeleted) return 'تم حذف هذه الرسالة';
  
  switch (this.messageType) {
    case 'image':
      return this.attachments.length > 1 ? 
        `${this.attachments.length} صور` : 'صورة';
    case 'file':
      return this.attachments.length > 1 ? 
        `${this.attachments.length} ملفات` : 'ملف';
    case 'voice':
      return 'رسالة صوتية';
    case 'location':
      return 'موقع';
    case 'contact':
      return 'جهة اتصال';
    default:
      return this.content || this.text || '';
  }
});

// Ensure a message has either content or attachments or location or contact
messageSchema.pre('save', function (next) {
  // Handle backward compatibility - copy text to content if content is missing
  if (!this.content && this.text) {
    this.content = this.text;
  }

  // Copy content to text for backward compatibility
  if (this.content && !this.text) {
    this.text = this.content;
  }

  // Convert old images array to new attachments format
  if (this.images && this.images.length > 0 && this.attachments.length === 0) {
    this.attachments = this.images.map(url => ({
      url,
      type: 'image'
    }));
    this.messageType = 'image';
  }

  // Validate message content based on type
  const hasContent = this.content && this.content.trim().length > 0;
  const hasAttachments = this.attachments && this.attachments.length > 0;
  const hasLocation = this.location && this.location.latitude && this.location.longitude;
  const hasContact = this.contact && this.contact.name;

  if (!hasContent && !hasAttachments && !hasLocation && !hasContact) {
    const error = new Error('Message must have either content, attachments, location, or contact data');
    return next(error);
  }

  // Set message type based on content
  if (!this.messageType || this.messageType === 'text') {
    if (hasLocation) {
      this.messageType = 'location';
    } else if (hasContact) {
      this.messageType = 'contact';
    } else if (hasAttachments) {
      // Determine type from first attachment
      const firstAttachment = this.attachments[0];
      this.messageType = firstAttachment.type;
    } else {
      this.messageType = 'text';
    }
  }

  // Extract mentions from content
  if (this.content) {
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const mentions = [];
    let match;
    
    while ((match = mentionRegex.exec(this.content)) !== null) {
      const userId = match[2];
      if (mongoose.Types.ObjectId.isValid(userId)) {
        mentions.push(userId);
      }
    }
    
    if (mentions.length > 0) {
      this.metadata = this.metadata || {};
      this.metadata.mentions = mentions;
    }
  }

  // Extract hashtags from content
  if (this.content) {
    const hashtagRegex = /#([^\s#]+)/g;
    const hashtags = [];
    let match;
    
    while ((match = hashtagRegex.exec(this.content)) !== null) {
      hashtags.push(match[1]);
    }
    
    if (hashtags.length > 0) {
      this.metadata = this.metadata || {};
      this.metadata.hashtags = hashtags;
    }
  }

  // Extract links from content
  if (this.content) {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const links = [];
    let match;
    
    while ((match = urlRegex.exec(this.content)) !== null) {
      const url = match[1];
      const domain = new URL(url).hostname;
      links.push({
        url,
        domain
      });
    }
    
    if (links.length > 0) {
      this.metadata = this.metadata || {};
      this.metadata.links = links;
    }
  }

  // Add sender to readBy automatically for backward compatibility
  if (this.isNew) {
    this.readBy = [this.sender];
    this.deliveredAt = new Date();
  }

  next();
});

// Update chat's last message and message count when a new message is saved
messageSchema.post('save', async function() {
  if (this.isNew && !this.isDeleted) {
    const chatModel = mongoose.model('Chat');
    
    // Update chat's last message and increment message count
    await chatModel.findByIdAndUpdate(this.chat, {
      lastMessage: this._id,
      lastActivity: new Date(),
      $inc: { messageCount: 1 }
    });

    // Increment unread count for other chat members
    const chat = await chatModel.findById(this.chat);
    if (chat) {
      const otherMembers = chat.members.filter(memberId => 
        memberId.toString() !== this.sender.toString()
      );
      
      for (const memberId of otherMembers) {
        await chat.incrementUnreadCount(memberId);
      }
    }
  }
});

// Create compound indexes for faster message lookup
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ chat: 1, messageType: 1 });
messageSchema.index({ sender: 1, createdAt: -1 });
messageSchema.index({ isDeleted: 1, deletedFor: 1 });
messageSchema.index({ 'metadata.mentions': 1 });
messageSchema.index({ 'metadata.hashtags': 1 });

/**
 * Helper method to get sanitized message for deleted messages
 */
messageSchema.methods.toJSON = function () {
  const messageObject = this.toObject();

  // If message is deleted, redact the content but keep metadata
  if (messageObject.isDeleted) {
    messageObject.content = 'تم حذف هذه الرسالة';
    messageObject.text = 'تم حذف هذه الرسالة';
    messageObject.attachments = [];
    messageObject.location = null;
    messageObject.contact = null;
  }

  return messageObject;
};

/**
 * Static method to find recent messages for a chat with advanced filtering
 * @param {ObjectId} chatId - The chat ID
 * @param {Object} options - Query options
 */
messageSchema.statics.findChatMessages = function (chatId, options = {}) {
  const {
    page = 1,
    limit = 50,
    before,
    after,
    messageType = 'all',
    search,
    startDate,
    endDate,
    userId
  } = options;

  const skip = (page - 1) * limit;
  
  // Build match criteria
  const matchCriteria = { 
    chat: chatId,
    isDeleted: false
  };

  // Filter by user's deleted messages
  if (userId) {
    matchCriteria.deletedFor = { $ne: mongoose.Types.ObjectId(userId) };
  }

  // Filter by message type
  if (messageType !== 'all') {
    matchCriteria.messageType = messageType;
  }

  // Filter by date range
  if (startDate || endDate) {
    matchCriteria.createdAt = {};
    if (startDate) matchCriteria.createdAt.$gte = new Date(startDate);
    if (endDate) matchCriteria.createdAt.$lte = new Date(endDate);
  }

  // Cursor-based pagination
  if (before) {
    matchCriteria._id = { $lt: mongoose.Types.ObjectId(before) };
  }
  if (after) {
    matchCriteria._id = { $gt: mongoose.Types.ObjectId(after) };
  }

  // Search in content
  if (search) {
    matchCriteria.$or = [
      { content: { $regex: search, $options: 'i' } },
      { text: { $regex: search, $options: 'i' } }
    ];
  }

  return this.find(matchCriteria)
    .populate('sender', 'displayName profileImage')
    .populate('replyTo', 'content sender messageType')
    .populate('forwardedFrom', 'displayName')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean();
};

/**
 * Static method to mark messages as read
 * @param {ObjectId} chatId - The chat ID
 * @param {ObjectId} userId - User ID marking messages as read
 * @param {Array} messageIds - Specific message IDs to mark as read (optional)
 */
messageSchema.statics.markAsRead = async function (chatId, userId, messageIds = null) {
  const query = {
    chat: chatId,
    sender: { $ne: userId },
    isRead: false
  };

  if (messageIds && messageIds.length > 0) {
    query._id = { $in: messageIds };
  }

  const result = await this.updateMany(query, {
    isRead: true,
    readAt: new Date(),
    $addToSet: { readBy: userId } // Keep legacy field updated
  });

  // Update chat unread count
  if (result.modifiedCount > 0) {
    const chatModel = mongoose.model('Chat');
    const chat = await chatModel.findById(chatId);
    if (chat) {
      await chat.resetUnreadCount(userId);
    }
  }

  return result;
};

/**
 * Static method to get message statistics
 * @param {ObjectId} chatId - Chat ID (optional)
 * @param {ObjectId} userId - User ID (optional)
 * @param {Object} options - Query options
 */
messageSchema.statics.getMessageStats = async function (chatId = null, userId = null, options = {}) {
  const {
    period = 'month',
    startDate,
    endDate
  } = options;

  // Calculate date range
  let dateRange = {};
  if (startDate && endDate) {
    dateRange = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  } else if (period !== 'all') {
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
      case 'day':
        periodStart.setDate(now.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    dateRange.createdAt = { $gte: periodStart };
  }

  // Build match criteria
  const matchCriteria = {
    isDeleted: false,
    ...dateRange
  };

  if (chatId) matchCriteria.chat = mongoose.Types.ObjectId(chatId);
  if (userId) matchCriteria.sender = mongoose.Types.ObjectId(userId);

  const pipeline = [
    { $match: matchCriteria },
    {
      $group: {
        _id: null,
        totalMessages: { $sum: 1 },
        messagesByType: {
          $push: '$messageType'
        },
        averageMessageLength: {
          $avg: { $strLenCP: { $ifNull: ['$content', ''] } }
        },
        messagesWithAttachments: {
          $sum: {
            $cond: [
              { $gt: [{ $size: { $ifNull: ['$attachments', []] } }, 0] },
              1,
              0
            ]
          }
        },
        editedMessages: {
          $sum: { $cond: ['$isEdited', 1, 0] }
        },
        forwardedMessages: {
          $sum: { $cond: ['$isForwarded', 1, 0] }
        }
      }
    },
    {
      $addFields: {
        messagesByType: {
          $arrayToObject: {
            $map: {
              input: ['text', 'image', 'file', 'voice', 'location', 'contact'],
              as: 'type',
              in: {
                k: '$$type',
                v: {
                  $size: {
                    $filter: {
                      input: '$messagesByType',
                      cond: { $eq: ['$$this', '$$type'] }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  ];

  const [stats] = await this.aggregate(pipeline);

  return {
    totalMessages: stats?.totalMessages || 0,
    messagesByType: stats?.messagesByType || {},
    averageMessageLength: Math.round(stats?.averageMessageLength || 0),
    messagesWithAttachments: stats?.messagesWithAttachments || 0,
    editedMessages: stats?.editedMessages || 0,
    forwardedMessages: stats?.forwardedMessages || 0,
    period
  };
};

/**
 * Instance method to edit message content
 * @param {String} newContent - New message content
 * @param {String} reason - Reason for editing (optional)
 */
messageSchema.methods.editContent = function(newContent, reason = '') {
  // Store original content in edit history
  this.editHistory.push({
    originalContent: this.content,
    editedAt: new Date(),
    reason
  });

  // Update content
  this.content = newContent;
  this.text = newContent; // Backward compatibility
  this.isEdited = true;

  return this.save();
};

/**
 * Instance method to delete message for specific users
 * @param {Array} userIds - User IDs to delete message for
 * @param {Boolean} deleteForEveryone - Delete for all users
 */
messageSchema.methods.deleteForUsers = function(userIds = [], deleteForEveryone = false) {
  if (deleteForEveryone) {
    this.isDeleted = true;
    this.deletedAt = new Date();
    this.deletedFor = [];
  } else {
    userIds.forEach(userId => {
      if (!this.deletedFor.includes(userId)) {
        this.deletedFor.push(userId);
      }
    });
  }

  return this.save();
};

/**
 * Instance method to add reaction to message
 * @param {ObjectId} userId - User adding reaction
 * @param {String} emoji - Emoji reaction
 */
messageSchema.methods.addReaction = function(userId, emoji) {
  this.metadata = this.metadata || {};
  this.metadata.reactions = this.metadata.reactions || [];

  // Remove existing reaction from this user
  this.metadata.reactions = this.metadata.reactions.filter(
    reaction => reaction.userId.toString() !== userId.toString()
  );

  // Add new reaction
  this.metadata.reactions.push({
    userId,
    emoji,
    createdAt: new Date()
  });

  return this.save();
};

/**
 * Instance method to remove reaction from message
 * @param {ObjectId} userId - User removing reaction
 */
messageSchema.methods.removeReaction = function(userId) {
  this.metadata = this.metadata || {};
  this.metadata.reactions = this.metadata.reactions || [];

  // Remove reaction from this user
  this.metadata.reactions = this.metadata.reactions.filter(
    reaction => reaction.userId.toString() !== userId.toString()
  );

  return this.save();
};

const messageModel = mongoose.models.Message || model('Message', messageSchema);
export default messageModel;
