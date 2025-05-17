
import { Schema, model, Types } from 'mongoose';

const messageSchema = new Schema({
  // Chat this message belongs to
  chat: { 
    type: Types.ObjectId, 
    ref: 'Chat', 
    required: true 
  },
  
  // Message sender
  sender: { 
    type: Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // Message content
  content: { 
    type: String, 
    required: true 
  },
  
  // Message type
  type: { 
    type: String, 
    enum: ['text', 'image', 'audio', 'video', 'file', 'location'], 
    default: 'text' 
  },
  
  // For media messages
  media: {
    url: String,
    publicId: String,
    thumbnail: String,
    duration: Number,
    size: Number
  },
  
  // For location sharing
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  
  // Read status - Map of user IDs to read timestamps
  readBy: {
    type: Map,
    of: Date,
    default: {}
  },
  
  // Firebase reference
  firebaseMessageId: String,
  
  // Delivery status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // For reply feature
  replyTo: { 
    type: Types.ObjectId,
    ref: 'Message'
  },
  
  // For message deletion
  isDeleted: {
    type: Boolean,
    default: false
  }
}, { 
  timestamps: true 
});

// Indexes for faster queries
messageSchema.index({ chat: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });

export default model('Message', messageSchema);
