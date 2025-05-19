import admin from './firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';

/**
 * @module notifications
 * @description Unified module for all push notification functionality in ArtHub application
 */

/**
 * Send push notification to a specific user
 * @param {string} userId - MongoDB user ID
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Promise} - Result of the notification send operation
 */
export const sendPushNotificationToUser = async (userId, notification, data = {}) => {
  try {
    // Get user's FCM token
    const user = await userModel.findById(userId).select('fcmToken');
    
    if (!user || !user.fcmToken) {
      console.log(`User ${userId} doesn't have an FCM token`);
      return { success: false, message: 'No FCM token found for user' };
    }
    
    // Send notification to the device
    const message = {
      token: user.fcmToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        // Always include these for routing in Flutter
        screen: data.screen || 'default',
        id: data.id || '',
        timestamp: data.timestamp || Date.now().toString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          default_sound: true,
          default_vibrate_timings: true,
          channel_id: 'arthub_channel',
          icon: 'ic_notification'
        }
      },
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
    
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users
 * @param {Array<string>} userIds - Array of MongoDB user IDs
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Promise} - Results of the notification send operations
 */
export const sendPushNotificationToMultipleUsers = async (userIds, notification, data = {}) => {
  try {
    // Get users' FCM tokens
    const users = await userModel.find({ _id: { $in: userIds } }).select('fcmToken');
    
    // Filter out users without FCM tokens
    const tokens = users.filter(user => user.fcmToken).map(user => user.fcmToken);
    
    if (tokens.length === 0) {
      console.log('No FCM tokens found for selected users');
      return { success: false, message: 'No FCM tokens found' };
    }
    
    // Send notification to multiple devices
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        screen: data.screen || 'default',
        timestamp: data.timestamp || Date.now().toString(),
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          default_sound: true,
          default_vibrate_timings: true,
          channel_id: 'arthub_channel',
          icon: 'ic_notification'
        }
      },
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
      },
      tokens: tokens
    };
    
    const response = await admin.messaging().sendMulticast(message);
    console.log(`${response.successCount} notifications sent successfully`);
    
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push({
            token: tokens[idx],
            error: resp.error.message
          });
        }
      });
      console.log('List of tokens that failed to receive the message:', failedTokens);
    }
    
    return { 
      success: true, 
      successCount: response.successCount, 
      failureCount: response.failureCount 
    };
  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to a specific topic
 * @param {string} topic - Topic name
 * @param {Object} notification - Notification data
 * @param {string} notification.title - Notification title
 * @param {string} notification.body - Notification body
 * @param {Object} data - Additional data to send with notification
 * @returns {Promise} - Result of the notification send operation
 */
export const sendPushNotificationToTopic = async (topic, notification, data = {}) => {
  try {
    const message = {
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        screen: data.screen || 'default',
        timestamp: data.timestamp || Date.now().toString(),
      },
      topic: topic
    };
    
    const response = await admin.messaging().send(message);
    console.log('Notification to topic sent successfully:', response);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('Error sending topic notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Subscribe users to a topic
 * @param {Array<string>} tokens - FCM tokens to subscribe
 * @param {string} topic - Topic name
 * @returns {Promise} - Result of the subscription operation
 */
export const subscribeToTopic = async (tokens, topic) => {
  try {
    const response = await admin.messaging().subscribeToTopic(tokens, topic);
    console.log('Successfully subscribed to topic:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error subscribing to topic:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Unsubscribe users from a topic
 * @param {Array<string>} tokens - FCM tokens to unsubscribe
 * @param {string} topic - Topic name
 * @returns {Promise} - Result of the unsubscription operation
 */
export const unsubscribeFromTopic = async (tokens, topic) => {
  try {
    const response = await admin.messaging().unsubscribeFromTopic(tokens, topic);
    console.log('Successfully unsubscribed from topic:', response);
    return { success: true, response };
  } catch (error) {
    console.error('Error unsubscribing from topic:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update FCM token for a user
 * @param {string} userId - MongoDB user ID
 * @param {string} fcmToken - New FCM token
 * @returns {Promise<boolean>} - Success status
 */
export const updateUserFCMToken = async (userId, fcmToken) => {
  try {
    if (!userId || !fcmToken) {
      return false;
    }
    
    await userModel.findByIdAndUpdate(userId, { fcmToken });
    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
};

// ===== PREDEFINED NOTIFICATION FUNCTIONS =====

/**
 * Send a chat message notification
 * @param {string} receiverId - User ID of message recipient
 * @param {string} senderId - User ID of message sender
 * @param {string} senderName - Display name of sender
 * @param {string} messageText - Content of the message
 * @param {string} chatId - Chat ID
 * @returns {Promise} - Notification result
 */
export const sendChatMessageNotification = async (receiverId, senderId, senderName, messageText, chatId) => {
  return sendPushNotificationToUser(
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
 * @param {string} artistId - Artist user ID
 * @param {string} commenterId - Commenter user ID
 * @param {string} commenterName - Name of the commenter
 * @param {string} artworkId - Artwork ID
 * @param {string} artworkTitle - Title of the artwork
 * @returns {Promise} - Notification result
 */
export const sendCommentNotification = async (artistId, commenterId, commenterName, artworkId, artworkTitle) => {
  return sendPushNotificationToUser(
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
 * @param {string} artistId - Artist user ID
 * @param {string} followerId - Follower user ID
 * @param {string} followerName - Name of the follower
 * @returns {Promise} - Notification result
 */
export const sendFollowNotification = async (artistId, followerId, followerName) => {
  return sendPushNotificationToUser(
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
 * Send transaction notification
 * @param {string} userId - User to notify
 * @param {string} transactionType - Type of transaction (purchase, sale, etc)
 * @param {string} amount - Transaction amount
 * @param {string} itemName - Name of the item involved
 * @returns {Promise} - Notification result
 */
export const sendTransactionNotification = async (userId, transactionType, amount, itemName) => {
  const title = transactionType === 'purchase' ? 'عملية شراء ناجحة' : 'عملية بيع ناجحة';
  const body = transactionType === 'purchase' 
    ? `تم شراء "${itemName}" بنجاح بمبلغ ${amount}`
    : `تم بيع "${itemName}" بنجاح بمبلغ ${amount}`;
    
  return sendPushNotificationToUser(
    userId,
    { title, body },
    {
      screen: 'TRANSACTION_DETAILS',
      type: 'transaction',
      transactionType,
      timestamp: Date.now().toString()
    }
  );
};

// ===== ALIASES FOR BACKWARD COMPATIBILITY =====

/**
 * @deprecated Use sendPushNotificationToUser instead
 */
export const sendPushToUser = sendPushNotificationToUser;

/**
 * @deprecated Use sendChatMessageNotification instead
 */
export const sendChatNotification = sendChatMessageNotification;

// Default export with all functions
export default {
  // Main notification functions
  sendPushNotificationToUser,
  sendPushNotificationToMultipleUsers,
  sendPushNotificationToTopic,
  subscribeToTopic,
  unsubscribeFromTopic,
  updateUserFCMToken,
  
  // Predefined notification types
  sendChatMessageNotification,
  sendCommentNotification,
  sendFollowNotification,
  sendTransactionNotification,
  
  // Aliases for backward compatibility
  sendPushToUser,
  sendChatNotification
};
