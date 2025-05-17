
import mongoose, { Schema, Types, model } from "mongoose";

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
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *             text:
 *               type: string
 *             sender:
 *               type: string
 *             createdAt:
 *               type: string
 *               format: date-time
 *           description: Last message sent in this chat
 *         unreadCounts:
 *           type: object
 *           additionalProperties:
 *             type: number
 *           description: Number of unread messages per user
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const chatSchema = new Schema({
  members: [{
    type: Types.ObjectId,
    ref: "User",
    required: true
  }],
  lastMessage: {
    text: String,
    sender: {
      type: Types.ObjectId,
      ref: "User"
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  unreadCounts: {
    type: Map,
    of: Number,
    default: {}
  }
}, { timestamps: true });

// Ensure at least 2 members in the chat
chatSchema.pre('save', function(next) {
  if (this.members.length < 2) {
    const error = new Error('Chat must have at least 2 members');
    return next(error);
  }
  next();
});

// Create compound index for faster chat lookup
chatSchema.index({ members: 1 });

// Method to update last message
chatSchema.methods.updateLastMessage = function(message) {
  this.lastMessage = {
    text: message.text,
    sender: message.sender,
    createdAt: message.createdAt
  };
  return this.save();
};

// Method to increment unread count for users
chatSchema.methods.incrementUnreadCount = function(messageId, senderId) {
  this.members.forEach(memberId => {
    // Don't increment for the sender
    if (memberId.toString() !== senderId.toString()) {
      const currentCount = this.unreadCounts.get(memberId.toString()) || 0;
      this.unreadCounts.set(memberId.toString(), currentCount + 1);
    }
  });
  return this.save();
};

// Method to reset unread count for a user
chatSchema.methods.resetUnreadCount = function(userId) {
  this.unreadCounts.set(userId.toString(), 0);
  return this.save();
};

/**
 * Static method to find or create chat between users
 * @param {Array} memberIds - Array of user IDs
 * @returns {Promise} - Promise with chat object
 */
chatSchema.statics.findOrCreateChat = async function(memberIds) {
  // Sort IDs to ensure consistent lookup
  const sortedIds = [...memberIds].sort();
  
  // Try to find existing chat
  let chat = await this.findOne({
    members: { $all: sortedIds, $size: sortedIds.length }
  });
  
  // Create new chat if none exists
  if (!chat) {
    chat = await this.create({
      members: sortedIds,
      unreadCounts: new Map(sortedIds.map(id => [id.toString(), 0]))
    });
  }
  
  return chat;
};

/**
 * Static method to find chats for a user
 * @param {ObjectId} userId - User ID
 * @returns {Promise} - Promise with array of populated chats
 */
chatSchema.statics.findUserChats = function(userId) {
  return this.find({ members: userId })
    .populate('members', 'email displayName profileImage')
    .populate('lastMessage.sender', 'email displayName profileImage')
    .sort({ 'lastMessage.createdAt': -1 })
    .exec();
};

const chatModel = mongoose.models.Chat || model("Chat", chatSchema);
export default chatModel;
