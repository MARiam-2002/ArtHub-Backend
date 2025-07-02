import notificationModel from '../../../DB/models/notification.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { sendPushNotificationToUser } from '../../utils/pushNotifications.js';

/**
 * الحصول على إشعارات المستخدم مع فلترة متقدمة
 * @desc Get user notifications with advanced filtering
 * @route GET /api/notifications
 * @access Private
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const {
    page = 1,
    limit = 20,
    unreadOnly,
    type,
    language = 'ar',
    dateFrom,
    dateTo
  } = req.query;

  const { skip } = getPaginationParams({ page: parseInt(page), limit: parseInt(limit) });

  // بناء استعلام الفلترة
  const filter = { user: userId };

  if (unreadOnly === 'true') {
    filter.isRead = false;
  }

  if (type) {
    filter.type = type;
  }

  // فلترة حسب التاريخ
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) {
      filter.createdAt.$gte = new Date(dateFrom);
    }
    if (dateTo) {
      filter.createdAt.$lte = new Date(dateTo);
    }
  }

  try {
    // جلب الإشعارات والإحصائيات بشكل متوازي
    const [notifications, totalCount, unreadCount] = await Promise.all([
      notificationModel
        .find(filter)
        .populate({
          path: 'sender',
          select: 'displayName profileImage username',
          strictPopulate: false
        })
        .populate({
          path: 'ref',
          strictPopulate: false
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      notificationModel.countDocuments(filter),
      notificationModel.countDocuments({ user: userId, isRead: false })
    ]);

    // تحويل الإشعارات إلى اللغة المطلوبة
    const localizedNotifications = notifications.map(notification => ({
      _id: notification._id,
      title: notification.title?.[language] || notification.title?.ar || '',
      message: notification.message?.[language] || notification.message?.ar || '',
      type: notification.type,
      isRead: notification.isRead,
      sender: notification.sender,
      ref: notification.ref,
      refModel: notification.refModel,
      data: notification.data || {},
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt
    }));

    // إعداد معلومات الصفحات
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    const paginationMeta = {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
      unreadCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    };

    res.success(
      {
        notifications: localizedNotifications,
        pagination: paginationMeta,
        summary: {
          total: totalCount,
          unread: unreadCount,
          read: totalCount - unreadCount
        }
      },
      language === 'ar' ? 'تم جلب الإشعارات بنجاح' : 'Notifications retrieved successfully'
    );
  } catch (error) {
    console.error('خطأ في جلب الإشعارات:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء جلب الإشعارات' : 'Error retrieving notifications',
      500
    );
  }
});

/**
 * وضع علامة "مقروء" على إشعار واحد
 * @desc Mark single notification as read
 * @route PATCH /api/notifications/:notificationId/read
 * @access Private
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  const { language = 'ar' } = req.query;

  try {
    // تحديث حالة القراءة مع التحقق من الملكية
    const notification = await notificationModel.findOneAndUpdate(
      { _id: notificationId, user: userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      },
      { new: true }
    ).lean();

    if (!notification) {
      return res.fail(
        null,
        language === 'ar' ? 'الإشعار غير موجود أو مقروء بالفعل' : 'Notification not found or already read',
        404
      );
    }

    // تحويل الإشعار إلى اللغة المطلوبة
    const localizedNotification = {
      _id: notification._id,
      title: notification.title?.[language] || notification.title?.ar || '',
      message: notification.message?.[language] || notification.message?.ar || '',
      type: notification.type,
      isRead: notification.isRead,
      readAt: notification.readAt,
      data: notification.data || {},
      createdAt: notification.createdAt
    };

    res.success(
      localizedNotification,
      language === 'ar' ? 'تم وضع علامة مقروء على الإشعار بنجاح' : 'Notification marked as read successfully'
    );
  } catch (error) {
    console.error('خطأ في تحديث حالة الإشعار:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء تحديث حالة الإشعار' : 'Error updating notification status',
      500
    );
  }
});

/**
 * وضع علامة "مقروء" على جميع إشعارات المستخدم
 * @desc Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 * @access Private
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { language = 'ar' } = req.query;

  try {
    // تحديث جميع الإشعارات غير المقروءة
    const result = await notificationModel.updateMany(
      { user: userId, isRead: false },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    res.success(
      {
        modifiedCount: result.modifiedCount,
        message: language === 'ar' 
          ? `تم وضع علامة مقروء على ${result.modifiedCount} إشعار`
          : `${result.modifiedCount} notifications marked as read`
      },
      language === 'ar' ? 'تم وضع علامة مقروء على جميع الإشعارات بنجاح' : 'All notifications marked as read successfully'
    );
  } catch (error) {
    console.error('خطأ في تحديث جميع الإشعارات:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء تحديث الإشعارات' : 'Error updating notifications',
      500
    );
  }
});

/**
 * حذف إشعار واحد
 * @desc Delete single notification
 * @route DELETE /api/notifications/:notificationId
 * @access Private
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  const { language = 'ar' } = req.query;

  try {
    // حذف الإشعار مع التحقق من الملكية
    const notification = await notificationModel.findOneAndDelete({
      _id: notificationId,
      user: userId
    });

    if (!notification) {
      return res.fail(
        null,
        language === 'ar' ? 'الإشعار غير موجود' : 'Notification not found',
        404
      );
    }

    res.success(
      { deletedId: notificationId },
      language === 'ar' ? 'تم حذف الإشعار بنجاح' : 'Notification deleted successfully'
    );
  } catch (error) {
    console.error('خطأ في حذف الإشعار:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء حذف الإشعار' : 'Error deleting notification',
      500
    );
  }
});

/**
 * حذف جميع إشعارات المستخدم
 * @desc Delete all user notifications
 * @route DELETE /api/notifications
 * @access Private
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { language = 'ar' } = req.query;

  try {
    const result = await notificationModel.deleteMany({ user: userId });

    res.success(
      {
        deletedCount: result.deletedCount,
        message: language === 'ar'
          ? `تم حذف ${result.deletedCount} إشعار`
          : `${result.deletedCount} notifications deleted`
      },
      language === 'ar' ? 'تم حذف جميع الإشعارات بنجاح' : 'All notifications deleted successfully'
    );
  } catch (error) {
    console.error('خطأ في حذف جميع الإشعارات:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء حذف الإشعارات' : 'Error deleting notifications',
      500
    );
  }
});

/**
 * تسجيل رمز FCM للإشعارات الفورية
 * @desc Register FCM token for push notifications
 * @route POST /api/notifications/token
 * @access Private
 */
export const registerFCMToken = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { token, deviceType } = req.body;
  const { language = 'ar' } = req.query;

  try {
    // تحديث أو إضافة رمز FCM للمستخدم
    const user = await userModel.findById(userId);
    if (!user) {
      return res.fail(
        null,
        language === 'ar' ? 'المستخدم غير موجود' : 'User not found',
        404
      );
    }

    // إضافة الرمز إلى قائمة الرموز أو تحديثه
    const tokenExists = user.fcmTokens?.some(t => t.token === token);
    
    if (!tokenExists) {
      const newToken = {
        token,
        deviceType: deviceType || 'unknown',
        addedAt: new Date(),
        isActive: true
      };

      await userModel.findByIdAndUpdate(
        userId,
        { 
          $push: { fcmTokens: newToken },
          $set: { lastActiveAt: new Date() }
        }
      );
    } else {
      // تحديث الرمز الموجود
      await userModel.findOneAndUpdate(
        { _id: userId, 'fcmTokens.token': token },
        { 
          $set: { 
            'fcmTokens.$.isActive': true,
            'fcmTokens.$.lastUsedAt': new Date(),
            lastActiveAt: new Date()
          }
        }
      );
    }

    res.success(
      { 
        token,
        deviceType: deviceType || 'unknown',
        registered: !tokenExists
      },
      language === 'ar' ? 'تم تسجيل رمز الإشعارات بنجاح' : 'FCM token registered successfully'
    );
  } catch (error) {
    console.error('خطأ في تسجيل رمز FCM:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء تسجيل رمز الإشعارات' : 'Error registering FCM token',
      500
    );
  }
});

/**
 * إلغاء تسجيل رمز FCM
 * @desc Unregister FCM token
 * @route DELETE /api/notifications/token
 * @access Private
 */
export const unregisterFCMToken = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { token } = req.body;
  const { language = 'ar' } = req.query;

  try {
    // إزالة الرمز من قائمة رموز المستخدم
    const result = await userModel.findByIdAndUpdate(
      userId,
      { 
        $pull: { fcmTokens: { token } },
        $set: { lastActiveAt: new Date() }
      },
      { new: true }
    );

    if (!result) {
      return res.fail(
        null,
        language === 'ar' ? 'المستخدم غير موجود' : 'User not found',
        404
      );
    }

    res.success(
      { 
        token,
        unregistered: true
      },
      language === 'ar' ? 'تم إلغاء تسجيل رمز الإشعارات بنجاح' : 'FCM token unregistered successfully'
    );
  } catch (error) {
    console.error('خطأ في إلغاء تسجيل رمز FCM:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء إلغاء تسجيل رمز الإشعارات' : 'Error unregistering FCM token',
      500
    );
  }
});

/**
 * إنشاء إشعار جديد (للاستخدام الداخلي والخارجي)
 * @desc Create new notification
 * @route POST /api/notifications
 * @access Private (Admin only)
 */
export const createNotification = asyncHandler(async (req, res) => {
  const {
    recipient,
    title,
    message,
    type = 'other',
    ref,
    refModel,
    data = {},
    sendPush = true
  } = req.body;
  const { language = 'ar' } = req.query;

  try {
    // التحقق من وجود المستخدم المتلقي
    const recipientUser = await userModel.findById(recipient).select('language fcmTokens');
    if (!recipientUser) {
      return res.fail(
        null,
        language === 'ar' ? 'المستخدم المتلقي غير موجود' : 'Recipient user not found',
        404
      );
    }

    // إنشاء الإشعار
    const notification = await notificationModel.create({
      user: recipient,
      sender: req.user?._id,
      title,
      message,
      type,
      ref,
      refModel,
      data
    });

    // إرسال إشعار فوري إذا كان مطلوباً
    if (sendPush && recipientUser.fcmTokens?.length > 0) {
      try {
        const userLang = recipientUser.language || 'ar';
        await sendPushNotificationToUser(
          recipient,
          {
            title: title,
            body: message
          },
          {
            ...data,
            notificationId: notification._id.toString(),
            type,
            language: userLang
          }
        );
      } catch (pushError) {
        console.error('خطأ في إرسال الإشعار الفوري:', pushError);
        // استمر حتى لو فشل الإشعار الفوري
      }
    }

    // تحويل الإشعار إلى اللغة المطلوبة
    const localizedNotification = {
      _id: notification._id,
      title: notification.title?.[language] || notification.title?.ar || '',
      message: notification.message?.[language] || notification.message?.ar || '',
      type: notification.type,
      isRead: notification.isRead,
      data: notification.data || {},
      createdAt: notification.createdAt
    };

    res.success(
      localizedNotification,
      language === 'ar' ? 'تم إنشاء الإشعار بنجاح' : 'Notification created successfully',
      201
    );
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء إنشاء الإشعار' : 'Error creating notification',
      500
    );
  }
});

/**
 * إرسال إشعارات متعددة
 * @desc Send bulk notifications
 * @route POST /api/notifications/bulk
 * @access Private (Admin only)
 */
export const sendBulkNotifications = asyncHandler(async (req, res) => {
  const {
    recipients,
    title,
    message,
    type = 'other',
    data = {},
    sendPush = true
  } = req.body;
  const { language = 'ar' } = req.query;

  try {
    // التحقق من وجود المستخدمين المتلقين
    const validUsers = await userModel.find({
      _id: { $in: recipients }
    }).select('_id language fcmTokens');

    if (validUsers.length === 0) {
      return res.fail(
        null,
        language === 'ar' ? 'لا يوجد مستخدمون صالحون للإرسال' : 'No valid recipients found',
        400
      );
    }

    const validUserIds = validUsers.map(user => user._id);

    // إنشاء الإشعارات بشكل مجمع
    const notifications = validUserIds.map(userId => ({
      user: userId,
      sender: req.user?._id,
      title,
      message,
      type,
      data
    }));

    const createdNotifications = await notificationModel.insertMany(notifications);

    // إرسال الإشعارات الفورية بشكل متوازي
    if (sendPush) {
      const pushPromises = validUsers
        .filter(user => user.fcmTokens?.length > 0)
        .map(async user => {
          try {
            const userLang = user.language || 'ar';
            await sendPushNotificationToUser(
              user._id,
              {
                title: title,
                body: message
              },
              {
                ...data,
                type,
                language: userLang,
                bulk: true
              }
            );
          } catch (pushError) {
            console.error(`خطأ في إرسال الإشعار الفوري للمستخدم ${user._id}:`, pushError);
          }
        });

      await Promise.allSettled(pushPromises);
    }

    res.success(
      {
        totalSent: createdNotifications.length,
        totalRecipients: recipients.length,
        validRecipients: validUserIds.length,
        invalidRecipients: recipients.length - validUserIds.length,
        notifications: createdNotifications.map(n => ({
          _id: n._id,
          user: n.user,
          createdAt: n.createdAt
        }))
      },
      language === 'ar' 
        ? `تم إرسال ${createdNotifications.length} إشعار بنجاح`
        : `${createdNotifications.length} notifications sent successfully`,
      201
    );
  } catch (error) {
    console.error('خطأ في إرسال الإشعارات المتعددة:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء إرسال الإشعارات' : 'Error sending bulk notifications',
      500
    );
  }
});

/**
 * الحصول على إحصائيات الإشعارات
 * @desc Get notification statistics
 * @route GET /api/notifications/stats
 * @access Private
 */
export const getNotificationStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period = 'month', groupBy, language = 'ar' } = req.query;

  try {
    // تحديد فترة الإحصائيات
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'day':
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 1)) };
        break;
      case 'week':
        dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case 'month':
        dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case 'year':
        dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
      default:
        dateFilter = {};
    }

    const baseFilter = { user: userId };
    if (Object.keys(dateFilter).length > 0) {
      baseFilter.createdAt = dateFilter;
    }

    // الإحصائيات الأساسية
    const [
      totalNotifications,
      unreadNotifications,
      readNotifications,
      typeStats,
      recentActivity
    ] = await Promise.all([
      notificationModel.countDocuments(baseFilter),
      notificationModel.countDocuments({ ...baseFilter, isRead: false }),
      notificationModel.countDocuments({ ...baseFilter, isRead: true }),
      // إحصائيات حسب النوع
      notificationModel.aggregate([
        { $match: baseFilter },
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // النشاط الأخير
      notificationModel.find(baseFilter)
        .sort({ createdAt: -1 })
        .limit(5)
        .select('type isRead createdAt')
        .lean()
    ]);

    // إحصائيات متقدمة حسب التجميع المطلوب
    let groupedStats = {};
    if (groupBy) {
      switch (groupBy) {
        case 'date':
          groupedStats = await notificationModel.aggregate([
            { $match: baseFilter },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 },
                unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } }
              }
            },
            { $sort: { '_id': -1 } },
            { $limit: 30 }
          ]);
          break;
        case 'status':
          groupedStats = {
            read: readNotifications,
            unread: unreadNotifications
          };
          break;
        default:
          groupedStats = typeStats;
      }
    }

    // حساب معدل القراءة
    const readRate = totalNotifications > 0 
      ? ((readNotifications / totalNotifications) * 100).toFixed(1)
      : 0;

    const stats = {
      summary: {
        total: totalNotifications,
        unread: unreadNotifications,
        read: readNotifications,
        readRate: `${readRate}%`
      },
      byType: typeStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentActivity,
      period,
      ...(groupBy && { [groupBy]: groupedStats })
    };

    res.success(
      stats,
      language === 'ar' ? 'تم جلب إحصائيات الإشعارات بنجاح' : 'Notification statistics retrieved successfully'
    );
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الإشعارات:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء جلب الإحصائيات' : 'Error retrieving notification statistics',
      500
    );
  }
});

/**
 * تحديث إعدادات الإشعارات للمستخدم
 * @desc Update user notification settings
 * @route PUT /api/notifications/settings
 * @access Private
 */
export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { language = 'ar' } = req.query;
  const settings = req.body;

  try {
    // تحديث إعدادات الإشعارات في ملف المستخدم
    const user = await userModel.findByIdAndUpdate(
      userId,
      { 
        $set: {
          'notificationSettings': {
            ...settings,
            updatedAt: new Date()
          }
        }
      },
      { new: true, select: 'notificationSettings' }
    );

    if (!user) {
      return res.fail(
        null,
        language === 'ar' ? 'المستخدم غير موجود' : 'User not found',
        404
      );
    }

    res.success(
      user.notificationSettings,
      language === 'ar' ? 'تم تحديث إعدادات الإشعارات بنجاح' : 'Notification settings updated successfully'
    );
  } catch (error) {
    console.error('خطأ في تحديث إعدادات الإشعارات:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء تحديث الإعدادات' : 'Error updating notification settings',
      500
    );
  }
});

/**
 * الحصول على إعدادات الإشعارات للمستخدم
 * @desc Get user notification settings
 * @route GET /api/notifications/settings
 * @access Private
 */
export const getNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { language = 'ar' } = req.query;

  try {
    const user = await userModel.findById(userId).select('notificationSettings');
    
    if (!user) {
      return res.fail(
        null,
        language === 'ar' ? 'المستخدم غير موجود' : 'User not found',
        404
      );
    }

    // الإعدادات الافتراضية
    const defaultSettings = {
      enablePush: true,
      enableEmail: false,
      enableSMS: false,
      language: 'ar',
      categories: {
        messages: true,
        requests: true,
        reviews: true,
        system: true,
        follows: true,
        sales: true
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      }
    };

    const settings = user.notificationSettings || defaultSettings;

    res.success(
      settings,
      language === 'ar' ? 'تم جلب إعدادات الإشعارات بنجاح' : 'Notification settings retrieved successfully'
    );
  } catch (error) {
    console.error('خطأ في جلب إعدادات الإشعارات:', error);
    res.fail(
      null,
      language === 'ar' ? 'حدث خطأ أثناء جلب الإعدادات' : 'Error retrieving notification settings',
      500
    );
  }
});

// دوال مساعدة للاستخدام الداخلي
/**
 * إنشاء إشعار (للاستخدام الداخلي)
 * @param {string} recipient - معرف المستخدم المتلقي
 * @param {Object} title - عنوان الإشعار بعدة لغات
 * @param {Object} message - نص الإشعار بعدة لغات
 * @param {string} type - نوع الإشعار
 * @param {string} sender - معرف المرسل (اختياري)
 * @param {Object} data - بيانات إضافية
 * @param {string} ref - معرف المرجع
 * @param {string} refModel - نموذج المرجع
 * @returns {Promise<Object|null>} - الإشعار المنشأ أو null في حالة الخطأ
 */
export const createNotificationHelper = async (
  recipient,
  title,
  message,
  type = 'other',
  sender = null,
  data = {},
  ref = null,
  refModel = null
) => {
  try {
    // التحقق من وجود المستخدم المتلقي
    const recipientExists = await userModel.exists({ _id: recipient });
    if (!recipientExists) {
      console.error('المستخدم المتلقي غير موجود - لا يمكن إنشاء الإشعار');
      return null;
    }

    // إنشاء الإشعار
    const notification = await notificationModel.create({
      user: recipient,
      sender,
      title,
      message,
      type,
      ref,
      refModel,
      data
    });

    // إرسال إشعار فوري
    try {
      const user = await userModel.findById(recipient).select('language fcmTokens');
      if (user && user.fcmTokens?.length > 0) {
        const userLang = user.language || 'ar';
        await sendPushNotificationToUser(
          recipient,
          {
            title: title,
            body: message
          },
          {
            ...data,
            notificationId: notification._id.toString(),
            type,
            language: userLang
          }
        );
      }
    } catch (pushError) {
      console.error('خطأ في إرسال الإشعار الفوري:', pushError);
    }

    return notification;
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return null;
  }
};

// تصدير الدوال للحفاظ على التوافق مع الكود القديم
export {
  markNotificationAsRead as markAsRead,
  markAllNotificationsAsRead as markAllAsRead,
  createNotificationHelper as sendNotification
};
