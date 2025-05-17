
import { Schema, model, Types } from 'mongoose';

const chatSchema = new Schema({
  // Members of the chat
  members: [{ 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  }],
  
  // Last message for preview
  lastMessage: { 
    type: Types.ObjectId, 
    ref: 'Message' 
  },
  
  // Firebase references
  firebaseChatId: { 
    type: String 
  },
  
  // For tracking unread messages
  unreadCount: {
    type: Map,
    of: Number,
    default: {}
  },
  
  // Chat type (private, group)
  type: {
    type: String,
    enum: ['private', 'group'],
    default: 'private'
  },
  
  // For group chats
  name: {
    type: String
  },
  
  // Group admin(s)
  admin: [{
    type: Types.ObjectId,
    ref: 'User'
  }],
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for getting message count
chatSchema.virtual('messageCount', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'chat',
  count: true
});

export default model('Chat', chatSchema);
