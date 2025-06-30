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
 *         content:
 *           type: string
 *           description: Message content
 *         text:
 *           type: string
 *           description: Legacy message content (for backward compatibility)
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of image URLs attached to this message
 *         isRead:
 *           type: boolean
 *           description: Indicates if message has been read by recipient
 *         readBy:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of user IDs who have read this message (legacy field)
 *         isDeleted:
 *           type: boolean
 *           description: Indicates if message was deleted
 *         sentAt:
 *           type: date
 *           description: Timestamp when message was sent
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
  content: {
    type: String
  },
  // Legacy field for backward compatibility
  text: {
    type: String
  },
  images: [{
    type: String
  }],
  // New field for Socket.io implementation
  isRead: {
    type: Boolean,
    default: false
  },
  // Legacy field for backward compatibility
  readBy: [{
    type: Types.ObjectId,
    ref: "User"
  }],
  // Allow messages to be deleted
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Explicit timestamp for when the message was sent
  sentAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Ensure a message has either content or images
messageSchema.pre('save', function(next) {
  // Handle backward compatibility - copy text to content if content is missing
  if (!this.content && this.text) {
    this.content = this.text;
  }
  
  // Copy content to text for backward compatibility
  if (this.content && !this.text) {
    this.text = this.content;
  }
  
  if (!this.content && (!this.images || this.images.length === 0)) {
    const error = new Error('Message must have either content or images');
    return next(error);
  }
  next();
});

// Add sender to readBy automatically for backward compatibility
messageSchema.pre('save', function(next) {
  if (this.isNew) {
    this.readBy = [this.sender];
    
    // Mark as read by the sender
    if (this.sender) {
      this.isRead = false;
    }
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
    messageObject.content = "تم حذف هذه الرسالة";
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
      sender: { $ne: userId },
      isRead: false 
    },
    { 
      isRead: true,
      $addToSet: { readBy: userId } // Keep legacy field updated
    }
  ).exec();
};

const messageModel = mongoose.models.Message || model("Message", messageSchema);
export default messageModel;
