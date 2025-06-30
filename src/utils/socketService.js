import { Server } from 'socket.io';
import http from 'http';
import chatModel from '../../DB/models/chat.model.js';
import messageModel from '../../DB/models/message.model.js';
import userModel from '../../DB/models/user.model.js';
import { createMultilingualNotification, sendPushNotificationToUser } from './pushNotifications.js';

let io;

/**
 * Initialize Socket.io server
 * @param {http.Server} server - HTTP server to attach Socket.io to
 */
export const initializeSocketIO = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Update with your frontend origins in production
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Map to track active users and their socket connections
  const userSocketMap = new Map();

  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Authenticate socket connection
    socket.on('authenticate', async (data) => {
      try {
        const { userId } = data;
        if (!userId) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }

        // Store user's socket connection
        socket.userId = userId;
        userSocketMap.set(userId, socket.id);

        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        socket.emit('authenticated', { userId });

        // Join user's personal room for direct messages
        socket.join(`user:${userId}`);
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Handle joining a chat room
    socket.on('join_chat', async (data) => {
      try {
        const { chatId, userId } = data;
        
        // Verify user belongs to this chat
        const chat = await chatModel.findOne({
          _id: chatId,
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        });

        if (!chat) {
          socket.emit('error', { message: 'Unauthorized to join this chat' });
          return;
        }

        // Join the chat room
        socket.join(`chat:${chatId}`);
        console.log(`User ${userId} joined chat ${chatId}`);
        
        // Mark messages as read when joining chat
        await messageModel.updateMany(
          { 
            chat: chatId, 
            sender: { $ne: userId }, 
            isRead: false 
          },
          { isRead: true }
        );
        
        // Notify about read status
        io.to(`chat:${chatId}`).emit('messages_read', { 
          chatId, 
          readBy: userId 
        });
      } catch (error) {
        console.error('Error joining chat:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { chatId, content, senderId, receiverId } = data;
        
        if (!chatId || !content || !senderId) {
          socket.emit('error', { message: 'Invalid message data' });
          return;
        }

        // Create and save the message
        const newMessage = await messageModel.create({
          chat: chatId,
          sender: senderId,
          content,
          sentAt: new Date()
        });
        
        // Update chat's last message
        await chatModel.findByIdAndUpdate(chatId, {
          lastMessage: newMessage._id,
          updatedAt: new Date()
        });

        // Populate sender info before emitting
        const populatedMessage = await messageModel.findById(newMessage._id)
          .populate('sender', 'displayName profileImage');

        // Emit to the chat room
        io.to(`chat:${chatId}`).emit('new_message', populatedMessage);
        
        // Send notification to receiver if they're not in the chat room
        if (receiverId) {
          const receiverSocketId = userSocketMap.get(receiverId);
          const receiverInRoom = receiverSocketId && 
                               io.sockets.adapter.rooms.get(`chat:${chatId}`)?.has(receiverSocketId);
          
          if (!receiverInRoom) {
            // Get sender name for the notification
            const sender = await userModel.findById(senderId).select('displayName');
            const senderName = sender?.displayName || 'مستخدم';
            
            // Send push notification
            try {
              await sendPushNotificationToUser(
                receiverId,
                createMultilingualNotification(
                  'رسالة جديدة',
                  'New Message',
                  `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
                  `${senderName}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`
                ),
                {
                  type: 'chat',
                  chatId,
                  senderId
                }
              );
            } catch (notificationError) {
              console.error('Failed to send message notification:', notificationError);
            }
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Handle typing indicators
    socket.on('typing', (data) => {
      const { chatId, userId } = data;
      socket.to(`chat:${chatId}`).emit('user_typing', { chatId, userId });
    });

    socket.on('stop_typing', (data) => {
      const { chatId, userId } = data;
      socket.to(`chat:${chatId}`).emit('user_stopped_typing', { chatId, userId });
    });

    // Handle read receipts
    socket.on('mark_read', async (data) => {
      try {
        const { chatId, userId } = data;
        
        // Update messages as read
        await messageModel.updateMany(
          { 
            chat: chatId, 
            sender: { $ne: userId }, 
            isRead: false 
          },
          { isRead: true }
        );
        
        // Broadcast read status to the chat
        io.to(`chat:${chatId}`).emit('messages_read', { 
          chatId, 
          readBy: userId 
        });
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
        console.log(`User ${socket.userId} disconnected`);
      }
    });
  });

  console.log('Socket.IO server initialized');
  return io;
};

/**
 * Get the Socket.io instance
 * @returns {Server} The Socket.io server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};

/**
 * Send a message to a specific user
 * @param {string} userId - The user ID to send the message to
 * @param {string} event - The event name
 * @param {Object} data - The data to send
 */
export const sendToUser = (userId, event, data) => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  
  io.to(`user:${userId}`).emit(event, data);
};

/**
 * Send a message to a chat room
 * @param {string} chatId - The chat ID
 * @param {string} event - The event name
 * @param {Object} data - The data to send
 */
export const sendToChat = (chatId, event, data) => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  
  io.to(`chat:${chatId}`).emit(event, data);
};

export default {
  initializeSocketIO,
  getIO,
  sendToUser,
  sendToChat
}; 