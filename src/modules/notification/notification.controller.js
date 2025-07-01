import notificationModel from '../../../DB/models/notification.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { sendPushNotificationToUser } from '../../utils/pushNotifications.js';

/**
 * جلب إشعارات المستخدم
 */
export const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, unreadOnly, language = 'ar' } = req.query;
  const { skip } = getPaginationParams({ page, limit });

  // إنشاء المرشح
  const filter = { user: userId };
  if (unreadOnly === 'true') {
    filter.isRead = false;
  }

  // جلب الإشعارات مع معلومات المرسل
  const [notifications, totalCount] = await Promise.all([
    notificationModel
      .find(filter)
      .populate('sender', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    notificationModel.countDocuments(filter)
  ]);

  // عدد الإشعارات غير المقروءة
  const unreadCount = await notificationModel.countDocuments({
    user: userId,
    isRead: false
  });

  // تحويل الإشعارات إلى اللغة المطلوبة
  const localizedNotifications = notifications.map(notification =>
    notification.getLocalizedContent(language)
  );

  // إعداد معلومات الصفحات
  const paginationMeta = {
    currentPage: parseInt(page),
    totalPages: Math.ceil(totalCount / parseInt(limit)),
    totalItems: totalCount,
    itemsPerPage: parseInt(limit),
    unreadCount,
    hasNextPage: parseInt(page) < Math.ceil(totalCount / parseInt(limit)),
    hasPrevPage: parseInt(page) > 1
  };

  res.success(
    {
      notifications: localizedNotifications,
      pagination: paginationMeta
    },
    'تم جلب الإشعارات بنجاح'
  );
});

/**
 * وضع علامة "مقروء" على الإشعار
 */
export const markAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  const { language = 'ar' } = req.query;

  // تحديث حالة القراءة للإشعار
  const notification = await notificationModel.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.fail(null, 'الإشعار غير موجود', 404);
  }

  const localizedNotification = notification.getLocalizedContent(language);

  res.success(localizedNotification, 'تم تحديث حالة قراءة الإشعار بنجاح');
});

/**
 * وضع علامة "مقروء" على جميع إشعارات المستخدم
 */
export const markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // تحديث جميع الإشعارات غير المقروءة
  const result = await notificationModel.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );

  res.success(
    {
      modifiedCount: result.modifiedCount
    },
    'تم تحديث حالة قراءة جميع الإشعارات بنجاح'
  );
});

/**
 * حذف إشعار
 */
export const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  // حذف الإشعار
  const notification = await notificationModel.findOneAndDelete({
    _id: notificationId,
    user: userId
  });

  if (!notification) {
    return res.fail(null, 'الإشعار غير موجود', 404);
  }

  res.success(null, 'تم حذف الإشعار بنجاح');
});

/**
 * حذف جميع إشعارات المستخدم
 */
export const deleteAllNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  const result = await notificationModel.deleteMany({ user: userId });

  res.success(
    {
      deletedCount: result.deletedCount
    },
    'تم حذف جميع الإشعارات بنجاح'
  );
});

/**
 * إنشاء إشعار (للاستخدام الداخلي)
 */
export const createNotification = asyncHandler(
  async (sender, recipient, titleAr, bodyAr, data = {}, titleEn = '', bodyEn = '') => {
    try {
      // التحقق من وجود المستخدمين
      const [senderExists, recipientExists] = await Promise.all([
        sender ? userModel.exists({ _id: sender }) : Promise.resolve(true),
        userModel.exists({ _id: recipient })
      ]);

      if (!senderExists || !recipientExists) {
        console.error('المستخدم غير موجود - لا يمكن إنشاء الإشعار');
        return null;
      }

      // إنشاء الإشعار مع دعم اللغات المتعددة
      const notification = await notificationModel.create({
        sender,
        user: recipient,
        title: {
          ar: titleAr,
          en: titleEn || titleAr
        },
        message: {
          ar: bodyAr,
          en: bodyEn || bodyAr
        },
        data
      });

      // إرسال إشعار فوري للمستخدم (إذا كان مفعلاً)
      try {
        // الحصول على تفضيلات اللغة للمستخدم
        const user = await userModel.findById(recipient).select('language');
        const userLang = user?.language || 'ar';

        await sendPushNotificationToUser(
          recipient,
          {
            title: {
              ar: titleAr,
              en: titleEn || titleAr
            },
            body: {
              ar: bodyAr,
              en: bodyEn || bodyAr
            }
          },
          {
            ...data,
            notificationId: notification._id.toString(),
            language: userLang
          }
        );
      } catch (pushError) {
        console.error('خطأ في إرسال الإشعار الفوري:', pushError);
        // استمر على الرغم من فشل الإشعار الفوري
      }

      return notification;
    } catch (error) {
      console.error('خطأ في إنشاء الإشعار:', error);
      return null;
    }
  }
);

/**
 * الحصول على جميع إشعارات المستخدم
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, language } = req.query;
  const preferredLanguage = language || req.user.preferredLanguage || 'ar';

  // جلب إجمالي عدد الإشعارات للمستخدم
  const totalNotifications = await notificationModel.countDocuments({ user: userId });

  // حساب عدد الصفحات
  const totalPages = Math.ceil(totalNotifications / limit);

  // جلب الإشعارات مع التصفح
  const notifications = await notificationModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .lean();

  // تحويل الإشعارات إلى النموذج المحلي حسب اللغة المفضلة
  const localizedNotifications = notifications.map(notification => ({
    ...notification,
    title: notification.title[preferredLanguage] || notification.title.ar,
    message: notification.message[preferredLanguage] || notification.message.ar
  }));

  res.status(200).json({
    success: true,
    message:
      preferredLanguage === 'ar'
        ? 'تم جلب الإشعارات بنجاح'
        : 'Notifications retrieved successfully',
    data: {
      notifications: localizedNotifications,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount: totalNotifications,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

/**
 * إرسال إشعار لمستخدم (للاستخدام الخارجي)
 */
export const sendNotification = asyncHandler(async (recipient, title, message, data = {}) => {
  try {
    // التحقق من وجود المستخدم
    const recipientExists = await userModel.exists({ _id: recipient });

    if (!recipientExists) {
      console.error('المستخدم المتلقي غير موجود - لا يمكن إرسال الإشعار');
      return null;
    }

    // إنشاء الإشعار
    const notification = await notificationModel.create({
      user: recipient,
      title: {
        ar: title,
        en: title // استخدام نفس العنوان للغة الإنجليزية إذا لم يتم توفير ترجمة
      },
      message: {
        ar: message,
        en: message // استخدام نفس النص للغة الإنجليزية إذا لم يتم توفير ترجمة
      },
      data
    });

    // إرسال إشعار فوري
    try {
      // الحصول على تفضيلات اللغة للمستخدم
      const user = await userModel.findById(recipient).select('language');
      const userLang = user?.language || 'ar';

      await sendPushNotificationToUser(
        recipient,
        {
          title: {
            ar: title,
            en: title
          },
          body: {
            ar: message,
            en: message
          }
        },
        {
          ...data,
          notificationId: notification._id.toString(),
          language: userLang
        }
      );
    } catch (pushError) {
      console.error('خطأ في إرسال الإشعار الفوري:', pushError);
      // استمر على الرغم من فشل الإشعار الفوري
    }

    return notification;
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return null;
  }
});

/**
 * تسجيل رمز FCM للإشعارات الفورية
 */
export const registerFCMToken = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { token } = req.body;

  if (!token) {
    return res.fail(null, 'الرمز مطلوب', 400);
  }

  // تحديث رمز FCM للمستخدم
  await userModel.findByIdAndUpdate(userId, { fcmToken: token });

  res.success(null, 'تم تسجيل الرمز بنجاح');
});

/**
 * إلغاء تسجيل رمز FCM للإشعارات الفورية
 */
export const unregisterFCMToken = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { token } = req.body;

  if (!token) {
    return res.fail(null, 'الرمز مطلوب', 400);
  }

  // تحديث رمز FCM للمستخدم (إزالة الرمز)
  const user = await userModel.findById(userId);

  if (user && user.fcmToken === token) {
    await userModel.findByIdAndUpdate(userId, { $unset: { fcmToken: 1 } });
  }

  res.success(null, 'تم إلغاء تسجيل الرمز بنجاح');
});

// تصدير الدوال المستخدمة
export {
  markAsRead as markNotificationAsRead, // للحفاظ على التوافق مع الكود القديم
  markAllAsRead as markAllNotificationsAsRead // للحفاظ على التوافق مع الكود القديم
};
