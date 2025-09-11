import notificationModel from '../../../DB/models/notification.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import { sendPushNotificationToUser, updateUserFCMToken, removeUserFCMToken } from '../../utils/pushNotifications.js';
import { cacheNotifications, invalidateUserCache } from '../../utils/cacheHelpers.js';

/**
 * Get user notifications with pagination
 */
export const getNotifications = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;
    const filter = { user: userId };

    // Get notifications and counts in parallel
    const [notifications, totalCount, unreadCount] = await Promise.all([
      notificationModel
        .find(filter)
        .populate('sender', 'displayName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      notificationModel.countDocuments(filter),
      notificationModel.countDocuments({ user: userId, isRead: false })
    ]);

    // Format notifications for mobile app
    const formattedNotifications = await Promise.all(notifications.map(async (notification) => {
      let senderInfo = null;
      
      // إذا كان sender موجود في populate
      if (notification.sender) {
        senderInfo = {
          _id: notification.sender._id,
          displayName: notification.sender.displayName,
          profileImage: notification.sender.profileImage?.url || notification.sender.profileImage
        };
      } 
      // إذا لم يكن sender موجود، نحاول الحصول عليه من data.senderId
      else if (notification.data?.senderId) {
        try {
          const senderUser = await userModel.findById(notification.data.senderId)
            .select('displayName profileImage photoURL')
            .lean();
          
          if (senderUser) {
            senderInfo = {
              _id: senderUser._id,
              displayName: senderUser.displayName,
              profileImage: senderUser.profileImage?.url || senderUser.profileImage || senderUser.photoURL
            };
          }
        } catch (error) {
          console.warn('Error fetching sender info:', error);
        }
      }

      return {
        _id: notification._id,
        title: notification.title?.ar || notification.title,
        message: notification.message?.ar || notification.message,
        type: notification.type,
        isRead: notification.isRead,
        sender: senderInfo,
        data: notification.data || {},
        createdAt: notification.createdAt
      };
    }));

    const response = {
      notifications: formattedNotifications,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: (page - 1) * limit + notifications.length < totalCount
      },
      summary: {
        total: totalCount,
        unread: unreadCount
      }
    };

    res.success(response, 'تم جلب الإشعارات بنجاح');
  } catch (error) {
    console.error('Get notifications error:', error);
    next(new Error('حدث خطأ أثناء جلب الإشعارات', { cause: 500 }));
  }
});

/**
 * Mark notification as read
 */
export const markAsRead = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await notificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.fail(null, 'الإشعار غير موجود أو مقروء بالفعل', 404);
    }

    // Invalidate user cache
    await invalidateUserCache(userId);

    res.success({ isRead: true }, 'تم وضع علامة مقروء على الإشعار');
  } catch (error) {
    console.error('Mark as read error:', error);
    next(new Error('حدث خطأ أثناء تحديث حالة الإشعار', { cause: 500 }));
  }
});

/**
 * Mark all notifications as read
 */
export const markAllAsRead = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;

    const result = await notificationModel.updateMany(
      { user: userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    // Invalidate user cache to ensure immediate updates
    await invalidateUserCache(userId);
    
    console.log(`🔄 Marked ${result.modifiedCount} notifications as read for user ${userId}, cache invalidated`);

    res.success({
      markedCount: result.modifiedCount
    }, 'تم وضع علامة مقروء على جميع الإشعارات');
  } catch (error) {
    console.error('Mark all as read error:', error);
    next(new Error('حدث خطأ أثناء تحديث الإشعارات', { cause: 500 }));
  }
});

/**
 * Delete notification
 */
export const deleteNotification = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { notificationId } = req.params;
    const userId = req.user._id;

    const notification = await notificationModel.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.fail(null, 'الإشعار غير موجود', 404);
    }

    res.success(null, 'تم حذف الإشعار بنجاح');
  } catch (error) {
    console.error('Delete notification error:', error);
    next(new Error('حدث خطأ أثناء حذف الإشعار', { cause: 500 }));
  }
});

/**
 * Get notification settings
 */
export const getNotificationSettings = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const user = await userModel
      .findById(req.user._id)
      .select('notificationSettings')
      .lean();

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    const defaultSettings = {
      pushNotifications: true,
      emailNotifications: true,
      messageNotifications: true,
      followNotifications: true,
      artworkNotifications: true,
      marketingNotifications: false
    };

    const settings = { ...defaultSettings, ...user.notificationSettings };

    res.success(settings, 'تم جلب إعدادات الإشعارات بنجاح');
  } catch (error) {
    console.error('Get notification settings error:', error);
    next(new Error('حدث خطأ أثناء جلب إعدادات الإشعارات', { cause: 500 }));
  }
});

/**
 * Update notification settings
 */
export const updateNotificationSettings = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { notificationSettings } = req.body;
    const userId = req.user._id;

    const user = await userModel.findByIdAndUpdate(
      userId,
      { notificationSettings },
      { new: true, runValidators: true }
    ).select('notificationSettings');

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    res.success(user.notificationSettings, 'تم تحديث إعدادات الإشعارات بنجاح');
  } catch (error) {
    console.error('Update notification settings error:', error);
    next(new Error('حدث خطأ أثناء تحديث إعدادات الإشعارات', { cause: 500 }));
  }
});

/**
 * Delete all notifications for user
 */
export const deleteAllNotifications = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;

    const result = await notificationModel.deleteMany({ user: userId });

    // Invalidate user cache to ensure immediate updates
    await invalidateUserCache(userId);
    
    console.log(`🗑️ Deleted ${result.deletedCount} notifications for user ${userId}, cache invalidated`);

    res.success({
      deletedCount: result.deletedCount
    }, 'تم حذف جميع الإشعارات بنجاح');
  } catch (error) {
    console.error('Delete all notifications error:', error);
    next(new Error('حدث خطأ أثناء حذف الإشعارات', { cause: 500 }));
  }
});

/**
 * Helper function to create notification
 */
export const createNotification = async (data) => {
  try {
    await ensureDatabaseConnection();
    
    const { userId, type, title, message, sender, data: notificationData } = data;

    // Create notification
    const notification = await notificationModel.create({
      user: userId,
      type,
      title,
      message,
      sender,
      data: notificationData
    });

    // Send push notification if user has enabled it
    const user = await userModel.findById(userId).select('notificationSettings fcmTokens');
    
    if (user?.notificationSettings?.pushNotifications !== false && user?.fcmTokens?.length > 0) {
      await sendPushNotificationToUser(userId, {
        title: title?.ar || title,
        body: message?.ar || message,
        data: notificationData || {}
      });
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

/**
 * Register FCM token for user
 */
export const registerFCMToken = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { token, deviceType } = req.body;
    const userId = req.user._id;

    if (!token) {
      return res.fail(null, 'رمز FCM مطلوب', 400);
    }

    // Add FCM token to user
    const success = await updateUserFCMToken(userId, token);
    
    if (!success) {
      return res.fail(null, 'فشل في تسجيل رمز الإشعارات', 500);
    }

    res.success({
      token,
      deviceType: deviceType || 'unknown',
      registered: true
    }, 'تم تسجيل رمز الإشعارات بنجاح');
  } catch (error) {
    console.error('Register FCM token error:', error);
    next(new Error('حدث خطأ أثناء تسجيل رمز الإشعارات', { cause: 500 }));
  }
});

/**
 * Unregister FCM token for user
 */
export const unregisterFCMToken = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { token } = req.body;
    const userId = req.user._id;

    if (!token) {
      return res.fail(null, 'رمز FCM مطلوب', 400);
    }

    // Remove FCM token from user
    const success = await removeUserFCMToken(userId, token);
    
    if (!success) {
      return res.fail(null, 'فشل في إلغاء تسجيل رمز الإشعارات', 500);
    }

    res.success({
      token,
      unregistered: true
    }, 'تم إلغاء تسجيل رمز الإشعارات بنجاح');
  } catch (error) {
    console.error('Unregister FCM token error:', error);
    next(new Error('حدث خطأ أثناء إلغاء تسجيل رمز الإشعارات', { cause: 500 }));
  }
});

/**
 * Get user's FCM tokens (for debugging)
 */
export const getUserFCMTokens = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;

    const user = await userModel.findById(userId).select('fcmTokens');
    
    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    res.success({
      tokens: user.fcmTokens || [],
      count: user.fcmTokens ? user.fcmTokens.length : 0
    }, 'تم جلب رموز الإشعارات بنجاح');
  } catch (error) {
    console.error('Get FCM tokens error:', error);
    next(new Error('حدث خطأ أثناء جلب رموز الإشعارات', { cause: 500 }));
  }
});
