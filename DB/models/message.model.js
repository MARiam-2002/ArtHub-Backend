import mongoose, { Schema, Types, model } from "mongoose";

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
 *         text:
 *           type: string
 *           description: Message content
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs attached to this message
 *         readBy:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who have read this message
 *         isDeleted:
 *           type: boolean
 *           description: Indicates if message was deleted
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const messageSchema = new Schema({
  chat: {
    type: Types.ObjectId,
    ref: "Chat",
    required: true,
    index: true
  },
  sender: {
    type: Types.ObjectId,
    ref: "User",
    required: true
  },
  text: {
    type: String
  },
  images: [{
    type: String
  }],
  readBy: [{
    type: Types.ObjectId,
    ref: "User"
  }],
  // Allow messages to be deleted
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Ensure a message has either text or images
messageSchema.pre('save', function(next) {
  if (!this.text && (!this.images || this.images.length === 0)) {
    const error = new Error('Message must have either text or images');
    return next(error);
  }
  next();
});

// Add sender to readBy automatically
messageSchema.pre('save', function(next) {
  if (this.isNew) {
    this.readBy = [this.sender];
  }
  next();
});

// Create compound index for faster message lookup
messageSchema.index({ chat: 1, createdAt: -1 });

/**
 * Helper method to get sanitized message for deleted messages
 */
messageSchema.methods.toJSON = function() {
  const messageObject = this.toObject();
  
  // If message is deleted, redact the content but keep metadata
  if (messageObject.isDeleted) {
    messageObject.text = "تم حذف هذه الرسالة";
    messageObject.images = [];
  }
  
  return messageObject;
};

/**
 * Static method to find recent messages for a chat
 * @param {ObjectId} chatId - The chat ID
 * @param {Number} limit - Max number of messages to return
 */
messageSchema.statics.findRecentMessages = function(chatId, limit = 20) {
  return this.find({ chat: chatId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('sender', 'email displayName profileImage')
    .exec();
};

/**
 * Static method to mark messages as read
 * @param {ObjectId} chatId - The chat ID
 * @param {ObjectId} userId - User ID marking messages as read
 */
messageSchema.statics.markAsRead = function(chatId, userId) {
  return this.updateMany(
    { 
      chat: chatId, 
      readBy: { $ne: userId }
    },
    { 
      $addToSet: { readBy: userId } 
    }
  ).exec();
};

const messageModel = mongoose.models.Message || model("Message", messageSchema);
export default messageModel;
