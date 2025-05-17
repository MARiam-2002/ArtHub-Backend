
import admin from './firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';

/**
 * Send push notification to a specific user
 * @param {string} userId - The ID of the user to send notification to
 * @param {object} notification - Notification object with title and body
 * @param {object} data - Additional data to send with the notification
 * @returns {Promise} - Promise with the messaging response
 */
export const sendPushNotificationToUser = async (userId, notification, data = {}) => {
  try {
    // Get the user's FCM token
    const user = await userModel.findById(userId);
    
    if (!user || !user.fcmToken) {
      console.log(`User ${userId} has no FCM token registered`);
      return null;
    }
    
    // Format the message
    const message = {
      token: user.fcmToken,
      notification,
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          default_sound: true,
          default_vibrate_timings: true,
          default_light_settings: true,
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
    
    // Send the message
    const response = await admin.messaging().send(message);
    console.log('Push notification sent successfully:', response);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
};

/**
 * Send push notification to multiple users
 * @param {Array<string>} userIds - Array of user IDs
 * @param {object} notification - Notification object with title and body
 * @param {object} data - Additional data to send with the notification
 * @returns {Promise} - Promise with the messaging response
 */
export const sendPushNotificationToUsers = async (userIds, notification, data = {}) => {
  try {
    // Get users' FCM tokens
    const users = await userModel.find({ _id: { $in: userIds } });
    const tokens = users
      .filter(user => user.fcmToken)
      .map(user => user.fcmToken);
    
    if (tokens.length === 0) {
      console.log('No valid FCM tokens found for the specified users');
      return null;
    }
    
    // Format the message for multiple tokens
    const message = {
      tokens: tokens,
      notification,
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          default_sound: true,
          default_vibrate_timings: true,
          default_light_settings: true,
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1
          }
        }
      }
    };
    
    // Send the message to multiple devices
    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} messages were sent successfully`);
    return response;
  } catch (error) {
    console.error('Error sending multicast push notifications:', error);
    return null;
  }
};

/**
 * Send chat message push notification
 * @param {string} receiverId - Recipient user ID 
 * @param {string} senderName - Sender's name
 * @param {string} messageText - Message content
 * @returns {Promise} - Promise with the messaging response
 */
export const sendChatMessageNotification = async (receiverId, senderName, messageText) => {
  return sendPushNotificationToUser(
    receiverId,
    {
      title: senderName,
      body: messageText.substring(0, 100) // Limit preview text
    },
    {
      type: 'chat_message',
      sender_name: senderName
    }
  );
};

/**
 * Send artwork comment notification
 * @param {string} artistId - Artist user ID
 * @param {string} commenterName - Name of the commenter
 * @param {string} artworkTitle - Title of the artwork
 * @returns {Promise} - Promise with the messaging response
 */
export const sendArtworkCommentNotification = async (artistId, commenterName, artworkTitle) => {
  return sendPushNotificationToUser(
    artistId,
    {
      title: 'تعليق جديد',
      body: `قام ${commenterName} بالتعليق على عملك الفني "${artworkTitle}"`
    },
    {
      type: 'artwork_comment',
      artwork_title: artworkTitle
    }
  );
};

export default {
  sendPushNotificationToUser,
  sendPushNotificationToUsers,
  sendChatMessageNotification,
  sendArtworkCommentNotification
};
