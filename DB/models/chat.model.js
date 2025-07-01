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
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
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
    }
  },
  { timestamps: true }
);

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

  next();
});

// Create compound index for faster chat lookup
chatSchema.index({ members: 1 });
chatSchema.index({ sender: 1, receiver: 1 }, { unique: true });
chatSchema.index({ updatedAt: -1 }); // For sorting chats by most recent

/**
 * Static method to find or create chat between users
 * @param {String} senderId - ID of the user initiating the chat
 * @param {String} receiverId - ID of the recipient
 * @returns {Promise} - Promise with chat object
 */
chatSchema.statics.findOrCreateChat = async function (senderId, receiverId) {
  // Try to find existing chat between these users
  let chat = await this.findOne({
    members: {
      $all: [mongoose.Types.ObjectId(senderId), mongoose.Types.ObjectId(receiverId)]
    },
    isDeleted: { $ne: true }
  });

  // Create new chat if none exists
  if (!chat) {
    chat = await this.create({
      members: [senderId, receiverId],
      sender: senderId,
      receiver: receiverId
    });
  }

  return chat;
};

/**
 * Static method to find chats for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise} - Promise with array of populated chats
 */
chatSchema.statics.findUserChats = function (userId) {
  return this.find({
    members: userId,
    isDeleted: { $ne: true }
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
    .sort({ updatedAt: -1 })
    .exec();
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
