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
            ...Object.fromEntries(
              Object.entries(data).map(([key, value]) => [key, String(value)])
            ),
            click_action: 'FLUTTER_NOTIFICATION_CLICK',
            screen: data.screen || 'default',
            id: data.id || '',
            timestamp: data.timestamp || Date.now().toString(),
            language: preferredLanguage
          },
          android: {
            priority: 'high',
            ttl: 60 * 60 * 1000, // ساعة واحدة
            directBootOk: true, // السماح بالإشعارات أثناء وضع Direct Boot
            notification: {
              sound: 'default',
              default_sound: true,
              default_vibrate_timings: true,
              channel_id: 'arthub_high_importance_channel', // استخدام القناة الجديدة عالية الأهمية
              icon: 'notification_icon', // استخدام الأيقونة الجديدة
              priority: 'max', // أقصى أولوية
              visibility: 'public', // عرض المحتوى على شاشة القفل
              color: '#2196F3',
              ticker: 'ArtHub notification', // نص يظهر في شريط الحالة
              tag: `arthub_${Date.now()}`, // تاج فريد لكل إشعار
              notification_count: 1, // عدد الإشعارات
              default_vibrate_timings: true,
              vibrate_timings: ['100s', '200s', '100s', '100s'], // نمط اهتزاز مخصص
              sticky: false, // عدم تثبيت الإشعار
              notification_priority: 'PRIORITY_MAX' // أقصى أولوية للإشعار
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
      .select('fcmTokens preferredLanguage');

    // Group users by language preference for batch notifications
    const usersByLanguage = {
      ar: [],
      en: []
    };

    users.forEach(user => {
      if (user.fcmTokens && user.fcmTokens.length > 0) {
        const lang = user.preferredLanguage || 'ar';
        user.fcmTokens.forEach(token => {
          usersByLanguage[lang].push({
            token: token,
            userId: user._id
          });
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

      // Split tokens into batches of 500 (FCM limit)
      const batchSize = 500;
      const tokenBatches = [];
      for (let i = 0; i < tokens.length; i += batchSize) {
        tokenBatches.push(tokens.slice(i, i + batchSize));
      }

      const notificationTitle =
        typeof notification.title === 'object'
          ? notification.title[lang] || notification.title.ar
          : notification.title;

      const notificationBody =
        typeof notification.body === 'object'
          ? notification.body[lang] || notification.body.ar
          : notification.body;

      // Base message configuration
      const baseMessage = {
        notification: {
          title: notificationTitle,
          body: notificationBody
        },
        data: {
          ...Object.fromEntries(
            Object.entries(data).map(([key, value]) => [key, String(value)])
          ),
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
          screen: data.screen || 'default',
          timestamp: data.timestamp || Date.now().toString(),
          language: lang
        },
        android: {
          priority: 'high',
          ttl: 60 * 60 * 1000, // 1 hour
          directBootOk: true,
          notification: {
            sound: 'default',
            default_sound: true,
            default_vibrate_timings: true,
            channel_id: 'arthub_high_importance_channel',
            icon: 'notification_icon',
            priority: 'max',
            visibility: 'public',
            color: '#2196F3',
            tag: `arthub_${Date.now()}`
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
              content_available: true,
              'mutable-content': 1
            }
          }
        }
      };

      // Process each batch
      let langSuccessCount = 0;
      let langFailureCount = 0;
      const langFailedTokens = [];

      // Send batches in parallel for better performance
      const batchPromises = tokenBatches.map(async (batchTokens) => {
        try {
          const message = {
            ...baseMessage,
            tokens: batchTokens
          };

          const response = await admin.messaging().sendEachForMulticast(message);
          console.log(`Batch: ${response.successCount}/${batchTokens.length} notifications sent for ${lang}`);
          
          // Process failed tokens
          if (response.failureCount > 0) {
            const batchFailedTokens = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                batchFailedTokens.push({
                  token: batchTokens[idx],
                  error: resp.error.message,
                  code: resp.error.code
                });
              }
            });
            return {
              successCount: response.successCount,
              failureCount: response.failureCount,
              failedTokens: batchFailedTokens
            };
          }
          
          return {
            successCount: response.successCount,
            failureCount: 0,
            failedTokens: []
          };
        } catch (error) {
          console.error(`Batch sending error: ${error.message}`);
          return {
            successCount: 0,
            failureCount: batchTokens.length,
            failedTokens: batchTokens.map(token => ({
              token,
              error: error.message,
              code: error.code || 'unknown_error'
            }))
          };
        }
      });

      // Wait for all batches to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Aggregate results
      batchResults.forEach(result => {
        langSuccessCount += result.successCount;
        langFailureCount += result.failureCount;
        langFailedTokens.push(...result.failedTokens);
      });

      console.log(`${langSuccessCount} notifications sent successfully for language: ${lang}`);

      results.successCount += langSuccessCount;
      results.failureCount += langFailureCount;

      results.byLanguage[lang] = {
        sent: tokens.length,
        success: langSuccessCount,
        failure: langFailureCount
      };

      if (langFailedTokens.length > 0) {
        console.log(`Failed tokens for ${lang}:`, langFailedTokens);
        results.byLanguage[lang].failedTokens = langFailedTokens;
        
        // Identify permanently invalid tokens to remove
        const permanentErrorCodes = [
          'messaging/invalid-registration-token',
          'messaging/registration-token-not-registered'
        ];
        
        const tokensToRemove = langFailedTokens
          .filter(item => permanentErrorCodes.includes(item.code))
          .map(item => item.token);
        
        if (tokensToRemove.length > 0) {
          try {
            await userModel.updateMany(
              { fcmTokens: { $in: tokensToRemove } },
              { $pull: { fcmTokens: { $in: tokensToRemove } } }
            );
            console.log(`Removed ${tokensToRemove.length} invalid FCM tokens from database`);
          } catch (dbError) {
            console.error('Error removing invalid tokens:', dbError);
          }
        }
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

/**
 * Clean up invalid FCM tokens periodically
 * @returns {Promise<Object>} - Cleanup statistics
 */
export const cleanupInvalidFCMTokens = async () => {
  try {
    console.log('Starting FCM token cleanup process...');
    
    // Find users with FCM tokens
    const users = await userModel.find({ fcmTokens: { $exists: true, $ne: [] } });
    console.log(`Found ${users.length} users with FCM tokens`);
    
    let totalTokens = 0;
    let validTokens = 0;
    let invalidTokens = 0;
    
    // Process each user individually
    for (const user of users) {
      if (!user.fcmTokens || user.fcmTokens.length === 0) continue;
      
      totalTokens += user.fcmTokens.length;
      
      // Split tokens into batches for validation (max 100 tokens per request)
      const batchSize = 100;
      const tokenBatches = [];
      for (let i = 0; i < user.fcmTokens.length; i += batchSize) {
        tokenBatches.push(user.fcmTokens.slice(i, i + batchSize));
      }
      
      // Validate each batch of tokens
      for (const batchTokens of tokenBatches) {
        try {
          // Send a silent test message to validate tokens
          const message = {
            data: { type: 'token_validation' },
            tokens: batchTokens,
            android: {
              priority: 'normal',
              ttl: 0, // Don't store the message
              directBootOk: true
            },
            apns: {
              payload: {
                aps: {
                  'content-available': 1,
                  badge: 0
                }
              },
              headers: {
                'apns-priority': '5', // Low priority
                'apns-push-type': 'background'
              }
            }
          };
          
          const response = await admin.messaging().sendEachForMulticast(message);
          
          // Identify valid and failed tokens
          const failedTokens = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(batchTokens[idx]);
            }
          });
          
          validTokens += (batchTokens.length - failedTokens.length);
          invalidTokens += failedTokens.length;
          
          // Remove failed tokens from database
          if (failedTokens.length > 0) {
            await userModel.updateOne(
              { _id: user._id },
              { $pull: { fcmTokens: { $in: failedTokens } } }
            );
            console.log(`Removed ${failedTokens.length} failed tokens for user ${user._id}`);
          }
        } catch (error) {
          console.error(`Error validating tokens for user ${user._id}:`, error);
        }
      }
    }
    
    console.log(`FCM token cleanup statistics:`);
    console.log(`- Total tokens: ${totalTokens}`);
    console.log(`- Valid tokens: ${validTokens}`);
    console.log(`- Invalid tokens: ${invalidTokens}`);
    
    return {
      totalTokens,
      validTokens,
      invalidTokens
    };
  } catch (error) {
    console.error('Error in FCM token cleanup process:', error);
    throw error;
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
  chatId,
  messageType = 'text'
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

    // Determine notification content based on message type
    let notificationBody = {
      ar: '',
      en: ''
    };

    switch (messageType) {
      case 'voice':
        notificationBody = {
          ar: 'رسالة صوتية جديدة',
          en: 'New Voice Message'
        };
        break;
      case 'image':
        notificationBody = {
          ar: 'صورة جديدة',
          en: 'New Image'
        };
        break;
      case 'file':
        notificationBody = {
          ar: 'ملف جديد',
          en: 'New File'
        };
        break;
      case 'location':
        notificationBody = {
          ar: 'موقع جديد',
          en: 'New Location'
        };
        break;
      case 'contact':
        notificationBody = {
          ar: 'جهة اتصال جديدة',
          en: 'New Contact'
        };
        break;
      default: // text
        notificationBody = {
          ar: messageText ? messageText.substring(0, 100) : 'رسالة جديدة',
          en: messageText ? messageText.substring(0, 100) : 'New Message'
        };
    }

    return sendPushNotificationToUser(
      receiverId,
      {
        title: {
          ar: senderName || 'رسالة جديدة',
          en: senderName || 'New Message'
        },
        body: notificationBody
      },
      {
        screen: 'CHAT_DETAIL',
        chatId: chatId.toString(),
        senderId: senderId.toString(),
        type: messageType === 'voice' ? 'voice' : 'chat_message',
        messageType: messageType,
        unreadCount: unreadCount.toString(),
        timestamp: Date.now().toString()
      }
    );
  } catch (error) {
    console.error('Error sending chat notification:', error);
    // Fallback to basic notification without unread count
    let notificationBody = {
      ar: '',
      en: ''
    };

    switch (messageType) {
      case 'voice':
        notificationBody = {
          ar: 'رسالة صوتية جديدة',
          en: 'New Voice Message'
        };
        break;
      case 'image':
        notificationBody = {
          ar: 'صورة جديدة',
          en: 'New Image'
        };
        break;
      case 'file':
        notificationBody = {
          ar: 'ملف جديد',
          en: 'New File'
        };
        break;
      default:
        notificationBody = {
          ar: messageText ? messageText.substring(0, 100) : 'رسالة جديدة',
          en: messageText ? messageText.substring(0, 100) : 'New Message'
        };
    }

    return sendPushNotificationToUser(
      receiverId,
      {
        title: {
          ar: senderName || 'رسالة جديدة',
          en: senderName || 'New Message'
        },
        body: notificationBody
      },
      {
        screen: 'CHAT_DETAIL',
        chatId: chatId.toString(),
        senderId: senderId.toString(),
        type: messageType === 'voice' ? 'voice' : 'chat_message',
        messageType: messageType,
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
