import notificationModel from '../../../DB/models/notification.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationModel.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.success(notifications, 'تم جلب الإشعارات بنجاح');
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationModel.findOneAndUpdate({ _id: id, user: req.user._id }, { isRead: true });
  res.success(null, 'تم تعليم الإشعار كمقروء');
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationModel.findOneAndDelete({ _id: id, user: req.user._id });
  res.success(null, 'تم حذف الإشعار بنجاح');
});

export const createNotification = async ({ user, title, message, type = 'other', ref, refModel }) => {
  await notificationModel.create({ user, title, message, type, ref, refModel });
}; 