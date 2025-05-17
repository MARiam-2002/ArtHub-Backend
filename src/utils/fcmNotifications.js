
import admin from './firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';

/**
 * Send push notification to Flutter app through Firebase Cloud Messaging
 * @param {string} userId - The user ID to send notification to
 * @param {object} notification - Notification object with title and body
 * @param {object} data - Additional data for Flutter app to handle
 * @returns {Promise} - FCM send result
 */
export const sendPushToUser = async (userId, notification, data = {}) => {
  try {
    // Find user and get FCM token
    const user = await userModel.findById(userId);
    
    if (!user || !user.fcmToken) {
      console.log(`User ${userId} has no FCM token registered`);
      return null;
    }
    
    // Format the message with optimizations for both Android and iOS
    const message = {
      token: user.fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
        ...notification
      },
      data: {
        ...data,
        // Convert any non-string values to strings for FCM
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        // Always include these for routing in Flutter
        screen: data.screen || 'default',
        id: data.id || '',
      },
      // Android specific config
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          channel_id: 'arthub_channel',
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          icon: 'ic_notification'
        }
      },
      // iOS specific config
      apns: {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
            content_available: true
          }
        }
      }
    };
    
    // Send the message
    const response = await admin.messaging().send(message);
    console.log('Push notification sent:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { error: error.message };
  }
};

/**
 * Send a chat message notification
 * Optimized for Flutter chat UI
 */
export const sendChatNotification = async (receiverId, senderId, senderName, messageText, chatId) => {
  return sendPushToUser(
    receiverId,
    {
      title: senderName || 'رسالة جديدة',
      body: messageText ? messageText.substring(0, 100) : 'صورة جديدة'
    },
    {
      screen: 'CHAT_DETAIL',
      chatId: chatId.toString(),
      senderId: senderId.toString(),
      type: 'chat_message',
      timestamp: Date.now().toString()
    }
  );
};

/**
 * Send notification for new artwork comment
 * Optimized for Flutter artwork detail screen
 */
export const sendCommentNotification = async (artistId, commenterId, commenterName, artworkId, artworkTitle) => {
  return sendPushToUser(
    artistId,
    {
      title: 'تعليق جديد',
      body: `قام ${commenterName} بالتعليق على "${artworkTitle}"`
    },
    {
      screen: 'ARTWORK_DETAIL',
      artworkId: artworkId.toString(),
      commenterId: commenterId.toString(),
      type: 'new_comment',
      timestamp: Date.now().toString()
    }
  );
};

/**
 * Send notification for new follower
 * Optimized for Flutter profile screen
 */
export const sendFollowNotification = async (artistId, followerId, followerName) => {
  return sendPushToUser(
    artistId,
    {
      title: 'متابع جديد',
      body: `بدأ ${followerName} بمتابعتك`
    },
    {
      screen: 'PROFILE_FOLLOWERS',
      followerId: followerId.toString(),
      type: 'new_follower',
      timestamp: Date.now().toString()
    }
  );
};

/**
 * Register or update FCM token for a user
 */
export const updateFcmToken = async (userId, fcmToken) => {
  if (!userId || !fcmToken) return false;
  
  try {
    await userModel.findByIdAndUpdate(userId, { fcmToken });
    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
};

export default {
  sendPushToUser,
  sendChatNotification,
  sendCommentNotification,
  sendFollowNotification,
  updateFcmToken
};
