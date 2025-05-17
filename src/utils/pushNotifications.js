
import admin from './firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';

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
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          default_sound: true,
          default_vibrate_timings: true,
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
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
      },
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          default_sound: true,
          default_vibrate_timings: true,
        }
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
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
 * Set user's new FCM token
 * @param {string} userId - User MongoDB ID
 * @param {string} fcmToken - New FCM token
 * @returns {Promise} - Updated user document
 */
export const updateUserFCMToken = async (userId, fcmToken) => {
  try {
    const user = await userModel.findByIdAndUpdate(
      userId,
      { fcmToken },
      { new: true }
    );
    
    if (!user) {
      return { success: false, message: 'User not found' };
    }
    
    return { success: true, user };
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return { success: false, error: error.message };
  }
};
