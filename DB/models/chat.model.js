import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Chat:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         members:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs participating in this chat
 *         lastMessage:
 *           type: string
 *           description: Reference to the last message in this chat
 *         sender:
 *           type: string
 *           description: User who initiated the chat
 *         receiver:
 *           type: string
 *           description: Initial recipient of the chat
 *         isDeleted:
 *           type: boolean
 *           description: Indicates if the chat has been deleted
 *         isArchived:
 *           type: boolean
 *           description: Indicates if the chat is archived
 *         archivedBy:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who archived this chat
 *         settings:
 *           type: object
 *           description: Chat-specific settings for each user
 *         blockedUsers:
 *           type: array
 *           items:
 *             type: object
 *           description: Array of blocked user relationships
 *         messageCount:
 *           type: number
 *           description: Total number of messages in this chat
 *         lastActivity:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last activity in chat
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Sub-schema for user-specific chat settings
const ChatSettingsSchema = new Schema({
  userId: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  muteNotifications: {
    type: Boolean,
    default: false
  },
  muteUntil: {
    type: Date
  },
  theme: {
    type: String,
    enum: ['default', 'dark', 'blue', 'green', 'purple'],
    default: 'default'
  },
  wallpaper: {
    type: String // URL to wallpaper image
  },
  customName: {
    type: String,
    maxlength: 100
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  archivedAt: {
    type: Date
  },
  lastSeenMessageId: {
    type: Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

// Sub-schema for blocked users
const BlockedUserSchema = new Schema({
  blockedUser: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  blockedBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    maxlength: 500
  },
  blockedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const chatSchema = new Schema(
  {
    members: [
      {
        type: Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    lastMessage: {
      type: Types.ObjectId,
      ref: 'Message'
    },
    // Store the original sender and receiver for reference
    sender: {
      type: Types.ObjectId,
      ref: 'User'
    },
    receiver: {
      type: Types.ObjectId,
      ref: 'User'
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    isArchived: {
      type: Boolean,
      default: false
    },
    archivedBy: [
      {
        type: Types.ObjectId,
        ref: 'User'
      }
    ],
    // User-specific settings for this chat
    settings: [ChatSettingsSchema],
    // Blocked users in this chat
    blockedUsers: [BlockedUserSchema],
    // Chat statistics
    messageCount: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    },
    // Chat type (future enhancement for group chats)
    chatType: {
      type: String,
      enum: ['private', 'group'],
      default: 'private'
    },
    // Group chat specific fields (for future enhancement)
    groupName: {
      type: String,
      maxlength: 100
    },
    groupDescription: {
      type: String,
      maxlength: 500
    },
    groupImage: {
      type: String // URL to group image
    },
    admins: [
      {
        type: Types.ObjectId,
        ref: 'User'
      }
    ],
    // Chat metadata
    metadata: {
      totalMessages: {
        type: Number,
        default: 0
      },
      totalImages: {
        type: Number,
        default: 0
      },
      totalFiles: {
        type: Number,
        default: 0
      },
      totalVoiceMessages: {
        type: Number,
        default: 0
      },
      averageResponseTime: {
        type: Number, // in minutes
        default: 0
      },
      participationRate: {
        type: Map,
        of: Number // userId -> percentage
      }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for checking if chat is muted for a specific user
chatSchema.virtual('isMuted').get(function() {
  return function(userId) {
    const userSettings = this.settings.find(s => s.userId.toString() === userId.toString());
    if (!userSettings) return false;
    
    if (!userSettings.muteNotifications) return false;
    if (!userSettings.muteUntil) return true;
    
    return new Date() < userSettings.muteUntil;
  };
});

// Virtual for checking if a user is blocked
chatSchema.virtual('isUserBlocked').get(function() {
  return function(userId, targetUserId) {
    return this.blockedUsers.some(block => 
      block.blockedBy.toString() === userId.toString() && 
      block.blockedUser.toString() === targetUserId.toString()
    );
  };
});

// Virtual for getting unread count for a specific user
chatSchema.virtual('getUnreadCount').get(function() {
  return function(userId) {
    const userSettings = this.settings.find(s => s.userId.toString() === userId.toString());
    return userSettings ? userSettings.unreadCount : 0;
  };
});

// Ensure at least 2 members in the chat
chatSchema.pre('save', function (next) {
  if (this.members.length < 2) {
    const error = new Error('Chat must have at least 2 members');
    return next(error);
  }

  // Set sender and receiver if not already set
  if (this.isNew && this.members.length >= 2 && !this.sender) {
    this.sender = this.members[0];
    this.receiver = this.members[1];
  }

  // Initialize settings for new members
  if (this.isNew) {
    this.members.forEach(memberId => {
      if (!this.settings.find(s => s.userId.toString() === memberId.toString())) {
        this.settings.push({
          userId: memberId,
          muteNotifications: false,
          theme: 'default',
          isArchived: false,
          unreadCount: 0
        });
      }
    });
  }

  // Update last activity
  if (this.isModified('lastMessage')) {
    this.lastActivity = new Date();
  }

  next();
});

// Create compound indexes for faster chat lookup
chatSchema.index({ members: 1 });
chatSchema.index({ sender: 1, receiver: 1 });
chatSchema.index({ updatedAt: -1 });
chatSchema.index({ lastActivity: -1 });
chatSchema.index({ 'settings.userId': 1, 'settings.isArchived': 1 });
chatSchema.index({ 'settings.userId': 1, 'settings.unreadCount': 1 });
chatSchema.index({ isDeleted: 1, chatType: 1 });

/**
 * Static method to find or create chat between users
 * @param {String} senderId - ID of the user initiating the chat
 * @param {String} receiverId - ID of the recipient
 * @returns {Promise} - Promise with chat object
 */
chatSchema.statics.findOrCreateChat = async function (senderId, receiverId) {
  // Check if users are blocked
  const existingChat = await this.findOne({
    members: {
      $all: [mongoose.Types.ObjectId(senderId), mongoose.Types.ObjectId(receiverId)]
    },
    isDeleted: { $ne: true }
  });

  if (existingChat) {
    // Check if users are blocked
    const isBlocked = existingChat.isUserBlocked(senderId, receiverId) || 
                     existingChat.isUserBlocked(receiverId, senderId);
    
    if (isBlocked) {
      throw new Error('Cannot create chat with blocked user');
    }
    
    return existingChat;
  }

  // Create new chat if none exists
  const chat = await this.create({
    members: [senderId, receiverId],
    sender: senderId,
    receiver: receiverId,
    chatType: 'private'
  });

  return chat;
};

/**
 * Static method to find chats for a user with advanced filtering
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise} - Promise with array of populated chats
 */
chatSchema.statics.findUserChats = function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    search = '',
    hasUnread = null,
    sortBy = 'lastMessage',
    sortOrder = 'desc',
    includeArchived = false
  } = options;

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  // Build match criteria
  const matchCriteria = {
    members: userId,
    isDeleted: { $ne: true }
  };

  // Filter archived chats
  if (!includeArchived) {
    matchCriteria['settings'] = {
      $elemMatch: {
        userId: userId,
        isArchived: { $ne: true }
      }
    };
  }

  const pipeline = [
    { $match: matchCriteria },
    
    // Populate other user
    {
      $lookup: {
        from: 'users',
        localField: 'members',
        foreignField: '_id',
        as: 'memberDetails'
      }
    },
    
    // Populate last message
    {
      $lookup: {
        from: 'messages',
        localField: 'lastMessage',
        foreignField: '_id',
        as: 'lastMessageDetails'
      }
    },
    
    // Add computed fields
    {
      $addFields: {
        otherUser: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$memberDetails',
                cond: { $ne: ['$$this._id', mongoose.Types.ObjectId(userId)] }
              }
            },
            0
          ]
        },
        lastMessageData: { $arrayElemAt: ['$lastMessageDetails', 0] },
        userSettings: {
          $arrayElemAt: [
            {
              $filter: {
                input: '$settings',
                cond: { $eq: ['$$this.userId', mongoose.Types.ObjectId(userId)] }
              }
            },
            0
          ]
        }
      }
    },
    
    // Filter by search term if provided
    ...(search ? [{
      $match: {
        $or: [
          { 'otherUser.displayName': { $regex: search, $options: 'i' } },
          { 'lastMessageData.content': { $regex: search, $options: 'i' } }
        ]
      }
    }] : []),
    
    // Filter by unread status if specified
    ...(hasUnread !== null ? [{
      $match: {
        'userSettings.unreadCount': hasUnread ? { $gt: 0 } : 0
      }
    }] : []),
    
    // Sort
    {
      $sort: {
        [sortBy === 'lastMessage' ? 'lastActivity' : sortBy]: sortDirection
      }
    },
    
    // Pagination
    { $skip: skip },
    { $limit: limit },
    
    // Project final fields
    {
      $project: {
        _id: 1,
        otherUser: {
          _id: '$otherUser._id',
          displayName: '$otherUser.displayName',
          profileImage: '$otherUser.profileImage',
          isOnline: '$otherUser.isOnline',
          lastSeen: '$otherUser.lastSeen'
        },
        lastMessage: {
          content: '$lastMessageData.content',
          messageType: '$lastMessageData.messageType',
          isFromMe: { $eq: ['$lastMessageData.sender', mongoose.Types.ObjectId(userId)] },
          createdAt: '$lastMessageData.createdAt',
          isRead: '$lastMessageData.isRead'
        },
        unreadCount: '$userSettings.unreadCount',
        isArchived: '$userSettings.isArchived',
        isMuted: '$userSettings.muteNotifications',
        customName: '$userSettings.customName',
        lastActivity: 1,
        createdAt: 1,
        updatedAt: 1
      }
    }
  ];

  return this.aggregate(pipeline);
};

/**
 * Static method to get chat statistics for a user
 * @param {ObjectId} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise} - Promise with chat statistics
 */
chatSchema.statics.getChatStats = async function (userId, options = {}) {
  const {
    period = 'month',
    startDate,
    endDate,
    includeDetails = false
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
  } else {
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
      default:
        // 'all' - no date restriction
        break;
    }
    
    if (period !== 'all') {
      dateRange.createdAt = { $gte: periodStart };
    }
  }

  const pipeline = [
    {
      $match: {
        members: mongoose.Types.ObjectId(userId),
        isDeleted: { $ne: true },
        ...dateRange
      }
    },
    {
      $group: {
        _id: null,
        totalChats: { $sum: 1 },
        totalMessages: { $sum: '$messageCount' },
        averageMessagesPerChat: { $avg: '$messageCount' },
        activeChats: {
          $sum: {
            $cond: [
              { $gt: ['$lastActivity', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] },
              1,
              0
            ]
          }
        },
        archivedChats: {
          $sum: {
            $cond: [
              {
                $anyElementTrue: {
                  $map: {
                    input: '$settings',
                    as: 'setting',
                    in: {
                      $and: [
                        { $eq: ['$$setting.userId', mongoose.Types.ObjectId(userId)] },
                        { $eq: ['$$setting.isArchived', true] }
                      ]
                    }
                  }
                }
              },
              1,
              0
            ]
          }
        }
      }
    }
  ];

  const [stats] = await this.aggregate(pipeline);

  const result = {
    totalChats: stats?.totalChats || 0,
    totalMessages: stats?.totalMessages || 0,
    averageMessagesPerChat: Math.round(stats?.averageMessagesPerChat || 0),
    activeChats: stats?.activeChats || 0,
    archivedChats: stats?.archivedChats || 0,
    period
  };

  if (includeDetails) {
    // Get additional detailed statistics
    const detailedStats = await this.aggregate([
      {
        $match: {
          members: mongoose.Types.ObjectId(userId),
          isDeleted: { $ne: true },
          ...dateRange
        }
      },
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'chat',
          as: 'messages'
        }
      },
      {
        $addFields: {
          messagesByType: {
            $reduce: {
              input: '$messages',
              initialValue: {
                text: 0,
                image: 0,
                file: 0,
                voice: 0,
                location: 0,
                contact: 0
              },
              in: {
                text: {
                  $cond: [
                    { $eq: ['$$this.messageType', 'text'] },
                    { $add: ['$$value.text', 1] },
                    '$$value.text'
                  ]
                },
                image: {
                  $cond: [
                    { $eq: ['$$this.messageType', 'image'] },
                    { $add: ['$$value.image', 1] },
                    '$$value.image'
                  ]
                },
                file: {
                  $cond: [
                    { $eq: ['$$this.messageType', 'file'] },
                    { $add: ['$$value.file', 1] },
                    '$$value.file'
                  ]
                },
                voice: {
                  $cond: [
                    { $eq: ['$$this.messageType', 'voice'] },
                    { $add: ['$$value.voice', 1] },
                    '$$value.voice'
                  ]
                },
                location: {
                  $cond: [
                    { $eq: ['$$this.messageType', 'location'] },
                    { $add: ['$$value.location', 1] },
                    '$$value.location'
                  ]
                },
                contact: {
                  $cond: [
                    { $eq: ['$$this.messageType', 'contact'] },
                    { $add: ['$$value.contact', 1] },
                    '$$value.contact'
                  ]
                }
              }
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          messagesByType: {
            $mergeObjects: '$messagesByType'
          }
        }
      }
    ]);

    if (detailedStats.length > 0) {
      result.messagesByType = detailedStats[0].messagesByType;
    }
  }

  return result;
};

/**
 * Instance method to update user settings
 * @param {ObjectId} userId - User ID
 * @param {Object} settings - Settings to update
 */
chatSchema.methods.updateUserSettings = function(userId, settings) {
  const userSettingsIndex = this.settings.findIndex(s => 
    s.userId.toString() === userId.toString()
  );

  if (userSettingsIndex === -1) {
    // Create new settings for user
    this.settings.push({
      userId,
      ...settings
    });
  } else {
    // Update existing settings
    Object.assign(this.settings[userSettingsIndex], settings);
  }

  return this.save();
};

/**
 * Instance method to block/unblock a user
 * @param {ObjectId} blockedBy - User who is blocking
 * @param {ObjectId} blockedUser - User being blocked
 * @param {String} action - 'block' or 'unblock'
 * @param {String} reason - Reason for blocking
 */
chatSchema.methods.toggleBlockUser = function(blockedBy, blockedUser, action, reason = '') {
  if (action === 'block') {
    // Remove existing block if any
    this.blockedUsers = this.blockedUsers.filter(block => 
      !(block.blockedBy.toString() === blockedBy.toString() && 
        block.blockedUser.toString() === blockedUser.toString())
    );
    
    // Add new block
    this.blockedUsers.push({
      blockedBy,
      blockedUser,
      reason,
      blockedAt: new Date()
    });
  } else if (action === 'unblock') {
    // Remove block
    this.blockedUsers = this.blockedUsers.filter(block => 
      !(block.blockedBy.toString() === blockedBy.toString() && 
        block.blockedUser.toString() === blockedUser.toString())
    );
  }

  return this.save();
};

/**
 * Instance method to increment unread count for a user
 * @param {ObjectId} userId - User ID
 * @param {Number} increment - Amount to increment (default 1)
 */
chatSchema.methods.incrementUnreadCount = function(userId, increment = 1) {
  const userSettings = this.settings.find(s => 
    s.userId.toString() === userId.toString()
  );

  if (userSettings) {
    userSettings.unreadCount += increment;
    return this.save();
  }
};

/**
 * Instance method to reset unread count for a user
 * @param {ObjectId} userId - User ID
 */
chatSchema.methods.resetUnreadCount = function(userId) {
  const userSettings = this.settings.find(s => 
    s.userId.toString() === userId.toString()
  );

  if (userSettings) {
    userSettings.unreadCount = 0;
    return this.save();
  }
};

/**
 * Static method to count unread messages in a chat
 * @param {ObjectId} chatId - Chat ID
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Number>} - Promise with count of unread messages
 */
chatSchema.statics.countUnreadMessages = async function (chatId, userId) {
  const messageModel = mongoose.model('Message');
  return messageModel.countDocuments({
    chat: chatId,
    sender: { $ne: userId },
    isRead: false
  });
};

const chatModel = mongoose.models.Chat || model('Chat', chatSchema);
export default chatModel;
