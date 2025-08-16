import admin from './firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';
import notificationModel from '../../DB/models/notification.model.js';

/**
 * @module notifications
 * @description Unified module for all push notification functionality in ArtHub application
 * Supports multilingual notifications (Arabic and English)
 */

/**
 * Send push notification to a specific user with language preference support
 * @param {string} userId - MongoDB user ID
 * @param {Object} notification - Notification data
 * @param {Object} notification.title - Notification title object with ar and en properties
 * @param {Object} notification.body - Notification body object with ar and en properties
 * @param {Object} data - Additional data to send with notification
 * @param {Object} options - Additional options
 * @returns {Promise} - Result of the notification send operation
 */
export const sendPushNotificationToUser = async (userId, notification, data = {}, options = {}) => {
  try {
    // Get user's FCM tokens and language preference
    const user = await userModel.findById(userId).select('fcmTokens preferredLanguage');

    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`User ${userId} doesn't have any FCM tokens`);
      return { success: false, message: 'No FCM tokens found for user' };
    }

    const preferredLanguage = user.preferredLanguage || 'ar';

    // Determine notification title and body based on language preference
    const notificationTitle =
      typeof notification.title === 'object'
        ? notification.title[preferredLanguage] || notification.title.ar
        : notification.title;

    const notificationBody =
      typeof notification.body === 'object'
        ? notification.body[preferredLanguage] || notification.body.ar
        : notification.body;

    // Save notification to database if requested (async - don't wait)
    if (options.saveToDatabase !== false) {
      notificationModel.create({
        user: userId,
        title: {
          ar: typeof notification.title === 'object' ? notification.title.ar : notification.title,
          en: typeof notification.title === 'object' ? notification.title.en : notification.title
        },
        message: {
          ar: typeof notification.body === 'object' ? notification.body.ar : notification.body,
          en: typeof notification.body === 'object' ? notification.body.en : notification.body
        },
        type: data.type || 'system',
        ref: data.refId || null,
        refModel: data.refModel || null,
        data: {
          ...data,
          screen: data.screen || 'default'
        }
      }).catch(dbError => {
        console.error('Error saving notification to database:', dbError);
      });
    }

    // Send to all tokens in parallel for better performance
    const sendPromises = user.fcmTokens.map(async (token, index) => {
      try {
        const singleMessage = {
          token: token,
          notification: {
            title: notificationTitle,
            body: notificationBody
          },
          data: {
            ...data,
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            screen: data.screen || 'default',
            id: data.id || '',
            timestamp: data.timestamp || Date.now().toString(),
            language: preferredLanguage
          },
          android: {
            priority: 'high',
            ttl: 60 * 60 * 1000, // ساعة واحدة
            notification: {
              sound: 'default',
              default_sound: true,
              default_vibrate_timings: true,
              channel_id: 'arthub_channel',
              icon: 'ic_notification',
              priority: 'high',
              color: '#2196F3'
            }
          },
          apns: {
            headers: {
              'apns-priority': '10',
              'apns-expiration': (Math.floor(Date.now() / 1000) + 3600).toString()
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
        
        const response = await admin.messaging().send(singleMessage);
        return { success: true, messageId: response, tokenIndex: index };
      } catch (error) {
        console.log(`Failed to send to token ${index + 1}: ${error.message}`);
        return { success: false, error: error.message, tokenIndex: index };
      }
    });

    // Wait for all notifications to complete
    const results = await Promise.all(sendPromises);
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    // Remove failed tokens
    if (failureCount > 0) {
      const failedTokens = results
        .filter(result => !result.success)
        .map(result => user.fcmTokens[result.tokenIndex]);
      
      if (failedTokens.length > 0) {
        await userModel.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: failedTokens } }
        });
        console.log(`Removed ${failedTokens.length} failed FCM tokens for user ${userId}`);
      }
    }
    
    return { 
      success: successCount > 0, 
      successCount,
      failureCount,
      messageIds: results.filter(r => r.success).map(r => r.messageId)
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send push notification to multiple users with language preferences
 * @param {Array<string>} userIds - Array of MongoDB user IDs
 * @param {Object} notification - Notification data
 * @param {Object} notification.title - Notification title object with ar and en properties
 * @param {Object} notification.body - Notification body object with ar and en properties
 * @param {Object} data - Additional data to send with notification
 * @param {Object} options - Additional options
 * @returns {Promise} - Results of the notification send operations
 */
export const sendPushNotificationToMultipleUsers = async (
  userIds,
  notification,
  data = {},
  options = {}
) => {
  try {
    // Get users' FCM tokens and language preferences
    const users = await userModel
      .find({ _id: { $in: userIds } })
      .select('fcmToken preferredLanguage');

    // Group users by language preference for batch notifications
    const usersByLanguage = {
      ar: [],
      en: []
    };

    users.forEach(user => {
      if (user.fcmToken) {
        const lang = user.preferredLanguage || 'ar';
        usersByLanguage[lang].push({
          token: user.fcmToken,
          userId: user._id
        });
      }
    });

    const results = {
      success: true,
      successCount: 0,
      failureCount: 0,
      byLanguage: {}
    };

    // Save notifications to database if requested
    if (options.saveToDatabase !== false) {
      const notificationsToInsert = users.map(user => ({
        user: user._id,
        title: {
          ar: typeof notification.title === 'object' ? notification.title.ar : notification.title,
          en: typeof notification.title === 'object' ? notification.title.en : notification.title
        },
        message: {
          ar: typeof notification.body === 'object' ? notification.body.ar : notification.body,
          en: typeof notification.body === 'object' ? notification.body.en : notification.body
        },
        type: data.type || 'system',
        ref: data.refId || null,
        refModel: data.refModel || null,
        data: {
          ...data,
          screen: data.screen || 'default'
        }
      }));

      try {
        await notificationModel.insertMany(notificationsToInsert);
      } catch (dbError) {
        console.error('Error saving notifications to database:', dbError);
      }
    }

    // Send notifications for each language group
    for (const lang of ['ar', 'en']) {
      const tokens = usersByLanguage[lang].map(u => u.token);

      if (tokens.length === 0) {
        continue;
      }

      const notificationTitle =
        typeof notification.title === 'object'
          ? notification.title[lang] || notification.title.ar
          : notification.title;

      const notificationBody =
        typeof notification.body === 'object'
          ? notification.body[lang] || notification.body.ar
          : notification.body;

      // Send notification to multiple devices
      const message = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          screen: data.screen || 'default',
          timestamp: data.timestamp || Date.now().toString(),
          language: lang
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
      console.log(`${response.successCount} notifications sent successfully for language: ${lang}`);

      results.successCount += response.successCount;
      results.failureCount += response.failureCount;

      results.byLanguage[lang] = {
        sent: tokens.length,
        success: response.successCount,
        failure: response.failureCount
      };

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
        console.log(`Failed tokens for ${lang}:`, failedTokens);
        results.byLanguage[lang].failedTokens = failedTokens;
      }
    }

    return results;
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
        body: notification.body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
        screen: data.screen || 'default',
        timestamp: data.timestamp || Date.now().toString()
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

    // Add token to user's fcmTokens array if not already present
    await userModel.findByIdAndUpdate(userId, {
      $addToSet: { fcmTokens: fcmToken }
    });
    return true;
  } catch (error) {
    console.error('Error updating FCM token:', error);
    return false;
  }
};

/**
 * Remove FCM token for a user
 * @param {string} userId - MongoDB user ID
 * @param {string} fcmToken - FCM token to remove
 * @returns {Promise<boolean>} - Success status
 */
export const removeUserFCMToken = async (userId, fcmToken) => {
  try {
    if (!userId || !fcmToken) {
      return false;
    }

    // Remove token from user's fcmTokens array
    await userModel.findByIdAndUpdate(userId, {
      $pull: { fcmTokens: fcmToken }
    });
    return true;
  } catch (error) {
    console.error('Error removing FCM token:', error);
    return false;
  }
};

// ===== PREDEFINED NOTIFICATION FUNCTIONS =====

/**
 * Send push notification for new chat message
 * @param {string} receiverId - Receiver user ID
 * @param {string} senderId - Sender user ID
 * @param {string} senderName - Name of the sender
 * @param {string} messageText - Message text content
 * @param {string} chatId - Chat ID
 * @returns {Promise} - Notification result
 */
export const sendChatMessageNotification = async (
  receiverId,
  senderId,
  senderName,
  messageText,
  chatId
) => {
  try {
    // Get unread count for this specific chat
    const messageModel = (await import('../../DB/models/message.model.js')).default;
    const unreadCount = await messageModel.countDocuments({
      chat: chatId,
      sender: { $ne: receiverId },
      isRead: false,
      isDeleted: { $ne: true }
    });

    return sendPushNotificationToUser(
      receiverId,
      {
        title: {
          ar: senderName || 'رسالة جديدة',
          en: senderName || 'New Message'
        },
        body: {
          ar: messageText ? messageText.substring(0, 100) : 'صورة جديدة',
          en: messageText ? messageText.substring(0, 100) : 'New Image'
        }
      },
      {
        screen: 'CHAT_DETAIL',
        chatId: chatId.toString(),
        senderId: senderId.toString(),
        type: 'chat_message',
        unreadCount: unreadCount.toString(),
        timestamp: Date.now().toString()
      }
    );
  } catch (error) {
    console.error('Error sending chat notification:', error);
    // Fallback to basic notification without unread count
    return sendPushNotificationToUser(
      receiverId,
      {
        title: {
          ar: senderName || 'رسالة جديدة',
          en: senderName || 'New Message'
        },
        body: {
          ar: messageText ? messageText.substring(0, 100) : 'صورة جديدة',
          en: messageText ? messageText.substring(0, 100) : 'New Image'
        }
      },
      {
        screen: 'CHAT_DETAIL',
        chatId: chatId.toString(),
        senderId: senderId.toString(),
        type: 'chat_message',
        timestamp: Date.now().toString()
      }
    );
  }
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
export const sendCommentNotification = async (
  artistId,
  commenterId,
  commenterName,
  artworkId,
  artworkTitle
) =>
  sendPushNotificationToUser(
    artistId,
    {
      title: {
        ar: 'تعليق جديد',
        en: 'New Comment'
      },
      body: {
        ar: `قام ${commenterName} بالتعليق على "${artworkTitle}"`,
        en: `${commenterName} commented on "${artworkTitle}"`
      }
    },
    {
      screen: 'ARTWORK_DETAIL',
      artworkId: artworkId.toString(),
      commenterId: commenterId.toString(),
      type: 'new_comment',
      timestamp: Date.now().toString()
    }
  );

/**
 * Send notification for new follower
 * @param {string} artistId - Artist user ID
 * @param {string} followerId - Follower user ID
 * @param {string} followerName - Name of the follower
 * @returns {Promise} - Notification result
 */
export const sendFollowNotification = async (artistId, followerId, followerName) =>
  sendPushNotificationToUser(
    artistId,
    {
      title: {
        ar: 'متابع جديد',
        en: 'New Follower'
      },
      body: {
        ar: `بدأ ${followerName} بمتابعتك`,
        en: `${followerName} started following you`
      }
    },
    {
      screen: 'PROFILE_FOLLOWERS',
      followerId: followerId.toString(),
      type: 'new_follower',
      timestamp: Date.now().toString()
    }
  );

/**
 * Send special request notification
 * @param {string} userId - User to notify
 * @param {string} notificationType - Type of notification (new_request, status_update, response, etc)
 * @param {string} senderName - Name of the sender
 * @param {string} requestTitle - Title of the request
 * @param {string} requestType - Type of request (custom_artwork, ready_artwork, etc)
 * @param {string} additionalInfo - Additional information
 * @returns {Promise} - Notification result
 */
export const sendSpecialRequestNotification = async (
  userId,
  notificationType,
  senderName,
  requestTitle,
  requestType = 'custom_artwork',
  additionalInfo = ''
) => {
  // تحديد نوع الطلب (خاص أم عادي)
  const isCustomRequest = requestType === 'custom_artwork';
  const requestTypeLabel = isCustomRequest ? 'خاص' : 'عادي';
  const requestTypeLabelEn = isCustomRequest ? 'Custom' : 'Ready';
  
  const notifications = {
    new_request: {
      title: {
        ar: `طلب ${requestTypeLabel} جديد`,
        en: `New ${requestTypeLabelEn} Request`
      },
      body: {
        ar: `لديك طلب ${requestTypeLabel} جديد من ${senderName}: ${requestTitle}`,
        en: `You have a new ${requestTypeLabelEn.toLowerCase()} request from ${senderName}: ${requestTitle}`
      }
    },
    status_update: {
      title: {
        ar: 'تحديث حالة الطلب',
        en: 'Request Status Update'
      },
      body: {
        ar: `تم تحديث حالة طلبك الخاص: ${additionalInfo}`,
        en: `Your special request status has been updated: ${additionalInfo}`
      }
    },
    response: {
      title: {
        ar: 'رد جديد على الطلب',
        en: 'New Response to Request'
      },
      body: {
        ar: `رد جديد من ${senderName} على طلبك الخاص`,
        en: `New response from ${senderName} to your special request`
      }
    },
    accepted: {
      title: {
        ar: `تم قبول طلبك ${requestTypeLabel}`,
        en: `Your ${requestTypeLabelEn} Request Accepted`
      },
      body: {
        ar: `تم قبول طلبك ${requestTypeLabel} من قبل ${senderName}`,
        en: `Your ${requestTypeLabelEn.toLowerCase()} request has been accepted by ${senderName}`
      }
    },
    rejected: {
      title: {
        ar: `تم رفض طلبك ${requestTypeLabel}`,
        en: `Your ${requestTypeLabelEn} Request Rejected`
      },
      body: {
        ar: `تم رفض طلبك ${requestTypeLabel} من قبل ${senderName}`,
        en: `Your ${requestTypeLabelEn.toLowerCase()} request has been rejected by ${senderName}`
      }
    },
    in_progress: {
      title: {
        ar: `بدء العمل على طلبك ${requestTypeLabel}`,
        en: `Work Started on Your ${requestTypeLabelEn} Request`
      },
      body: {
        ar: `بدأ ${senderName} العمل على طلبك ${requestTypeLabel}`,
        en: `${senderName} has started working on your ${requestTypeLabelEn.toLowerCase()} request`
      }
    },
    review: {
      title: {
        ar: `طلبك ${requestTypeLabel} قيد المراجعة`,
        en: `Your ${requestTypeLabelEn} Request Under Review`
      },
      body: {
        ar: `طلبك ${requestTypeLabel} قيد المراجعة من قبل ${senderName}`,
        en: `Your ${requestTypeLabelEn.toLowerCase()} request is under review by ${senderName}`
      }
    },
    completed: {
      title: {
        ar: `تم إكمال طلبك ${requestTypeLabel}`,
        en: `Your ${requestTypeLabelEn} Request Completed`
      },
      body: {
        ar: `تم إكمال طلبك ${requestTypeLabel} بنجاح من قبل ${senderName}`,
        en: `Your ${requestTypeLabelEn.toLowerCase()} request has been completed successfully by ${senderName}`
      }
    },
    cancelled: {
      title: {
        ar: `تم إلغاء طلب ${requestTypeLabel}`,
        en: `${requestTypeLabelEn} Request Cancelled`
      },
      body: {
        ar: `قام ${senderName} بإلغاء الطلب ${requestTypeLabel}`,
        en: `${senderName} has cancelled the ${requestTypeLabelEn.toLowerCase()} request`
      }
    }
  };

  const notification = notifications[notificationType] || notifications.new_request;

  return sendPushNotificationToUser(
    userId,
    notification,
    {
      screen: 'SPECIAL_REQUEST_DETAILS',
      type: 'special_request',
      requestType: requestType,
      senderName: senderName,
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

/**
 * Create a notification object with multilingual support
 * @param {string} titleAr - Arabic title
 * @param {string} titleEn - English title
 * @param {string} bodyAr - Arabic body
 * @param {string} bodyEn - English body
 * @returns {Object} - Notification object with language support
 */
export const createMultilingualNotification = (titleAr, titleEn, bodyAr, bodyEn) => ({
  title: {
    ar: titleAr,
    en: titleEn || titleAr // Fallback to Arabic if English not provided
  },
  body: {
    ar: bodyAr,
    en: bodyEn || bodyAr // Fallback to Arabic if English not provided
  }
});

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
  sendSpecialRequestNotification,

  // Aliases for backward compatibility
  sendPushToUser,
  sendChatNotification,

  // New functions
  createMultilingualNotification
};
