import notificationModel from '../../../DB/models/notification.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureConnection } from '../../utils/mongodbUtils.js';
import { sendPushNotificationToUser } from '../../utils/pushNotifications.js';

/**
 * Get user notifications
 */
export const getNotifications = asyncHandler(async (req, res, next) => {
  try {
    await ensureConnection();
    
    const userId = req.user._id;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = { user: userId };
    if (unreadOnly === 'true') {
      filter.isRead = false;
    }

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
    const formattedNotifications = notifications.map(notification => ({
      _id: notification._id,
      title: notification.title?.ar || notification.title,
      message: notification.message?.ar || notification.message,
      type: notification.type,
      isRead: notification.isRead,
      sender: notification.sender ? {
        _id: notification.sender._id,
        displayName: notification.sender.displayName,
        profileImage: notification.sender.profileImage?.url
      } : null,
      data: notification.data || {},
      createdAt: notification.createdAt
    }));

    const response = {
      notifications: formattedNotifications,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + notifications.length < totalCount
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
    await ensureConnection();
    
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
    await ensureConnection();
    
    const userId = req.user._id;

    const result = await notificationModel.updateMany(
      { user: userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

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
    await ensureConnection();
    
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
    await ensureConnection();
    
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
    await ensureConnection();
    
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
 * Create notification helper function
 */
export const createNotification = async (data) => {
  try {
    await ensureConnection();
    
    const {
      user,
      title,
      message,
      type = 'general',
      sender = null,
      data: extraData = {},
      ref = null,
      refModel = null
    } = data;

    // Create notification
    const notification = await notificationModel.create({
      user,
      title: typeof title === 'string' ? { ar: title, en: title } : title,
      message: typeof message === 'string' ? { ar: message, en: message } : message,
      type,
      sender,
      data: extraData,
      ref,
      refModel
    });

    // Send push notification if user has enabled it
    const recipient = await userModel.findById(user).select('notificationSettings fcmTokens');
    if (recipient?.notificationSettings?.pushNotifications !== false && recipient?.fcmTokens?.length > 0) {
      await sendPushNotificationToUser(user, {
        title: notification.title.ar,
        body: notification.message.ar,
        data: {
          type: notification.type,
          notificationId: notification._id.toString(),
          ...extraData
        }
      });
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};
