import notificationModel from '../../../DB/models/notification.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';

/**
 * جلب إشعارات المستخدم
 */
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, skip } = getPaginationParams(req.query);
  
  // جلب الإشعارات مع معلومات المرسل
  const [notifications, totalCount] = await Promise.all([
    notificationModel.find({ recipient: userId })
      .populate('sender', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    notificationModel.countDocuments({ recipient: userId })
  ]);
  
  // عدد الإشعارات غير المقروءة
  const unreadCount = await notificationModel.countDocuments({ 
    recipient: userId,
    isRead: false
  });
  
  // إعداد معلومات الصفحات
  const paginationMeta = {
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: limit,
    unreadCount
  };
  
  res.success({ 
    notifications, 
    pagination: paginationMeta 
  }, 'تم جلب الإشعارات بنجاح');
});

/**
 * وضع علامة "مقروء" على الإشعار
 */
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;
  
  // تحديث حالة القراءة للإشعار
  const notification = await notificationModel.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true },
    { new: true }
  );
  
  if (!notification) {
    return res.fail(null, 'الإشعار غير موجود', 404);
  }
  
  res.success(notification, 'تم تحديث حالة قراءة الإشعار بنجاح');
});

/**
 * وضع علامة "مقروء" على جميع إشعارات المستخدم
 */
export const markAllNotificationsAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // تحديث جميع الإشعارات غير المقروءة
  const result = await notificationModel.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true }
  );
  
  res.success({ 
    modifiedCount: result.modifiedCount 
  }, 'تم تحديث حالة قراءة جميع الإشعارات بنجاح');
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
    recipient: userId
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
  
  // حذف جميع إشعارات المستخدم
  const result = await notificationModel.deleteMany({
    recipient: userId
  });
  
  res.success({ 
    deletedCount: result.deletedCount 
  }, 'تم حذف جميع الإشعارات بنجاح');
});

/**
 * إنشاء إشعار (للاستخدام الداخلي)
 */
export const createNotification = asyncHandler(async (sender, recipient, title, body, data = {}) => {
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
    
    // إنشاء الإشعار
    const notification = await notificationModel.create({
      sender,
      recipient,
      title,
      body,
      data
    });
    
    return notification;
  } catch (error) {
    console.error('خطأ في إنشاء الإشعار:', error);
    return null;
  }
}); 