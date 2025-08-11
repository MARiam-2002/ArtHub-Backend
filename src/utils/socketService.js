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
export const initializeSocketIO = server => {
  io = new Server(server, {
    cors: {
      origin: '*', // Update with your frontend origins in production
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Map to track active users and their socket connections
  const userSocketMap = new Map();

  io.on('connection', socket => {
    console.log(`New socket connection: ${socket.id}`);

    // Authenticate socket connection
    socket.on('authenticate', async data => {
      try {
        const { userId } = data;
        if (!userId) {
          socket.emit('error', { message: 'Authentication failed' });
          return;
        }

        // Store user's socket connection
        socket.userId = userId;
        userSocketMap.set(userId, socket.id);

        // Update user's online status
        await userModel.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date()
        });

        console.log(`User ${userId} authenticated with socket ${socket.id}`);
        socket.emit('authenticated', { userId });

        // Join user's personal room for direct messages
        socket.join(`user:${userId}`);

        // Broadcast user online status to all connected users
        socket.broadcast.emit('user_status_changed', {
          userId,
          isOnline: true,
          lastSeen: new Date()
        });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // Handle joining a chat room
    socket.on('join_chat', async data => {
      try {
        const { chatId } = data;
        const userId = socket.userId;

        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Verify user belongs to this chat
        const chat = await chatModel.findOne({
          _id: chatId,
          members: { $in: [userId] }
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

    // Handle leaving a chat room
    socket.on('leave_chat', data => {
      const { chatId } = data;
      socket.leave(`chat:${chatId}`);
      console.log(`User left chat ${chatId}`);
    });

    // Handle typing indicators
    socket.on('typing', data => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('typing', { chatId, userId: socket.userId });
    });

    socket.on('stop_typing', data => {
      const { chatId } = data;
      socket.to(`chat:${chatId}`).emit('stop_typing', { chatId, userId: socket.userId });
    });

    // Handle read receipts
    socket.on('mark_read', async data => {
      try {
        const { chatId } = data;
        const userId = socket.userId;

        if (!userId) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

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

        // Update user's offline status
        userModel.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        }).then(() => {
          console.log(`User ${socket.userId} offline status updated`);
        }).catch(err => {
          console.error('Error updating user offline status:', err);
        });

        // Broadcast user offline status to all connected users
        socket.broadcast.emit('user_status_changed', {
          userId: socket.userId,
          isOnline: false,
          lastSeen: new Date()
        });
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

  console.log(`📤 Sending ${event} to user ${userId}:`, data);
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

  console.log(`📤 Sending ${event} to chat ${chatId}:`, data);
  io.to(`chat:${chatId}`).emit(event, data);
};

export default {
  initializeSocketIO,
  getIO,
  sendToUser,
  sendToChat
};
