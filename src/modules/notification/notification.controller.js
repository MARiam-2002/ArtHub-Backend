import notificationModel from '../../../DB/models/notification.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getNotifications = asyncHandler(async (req, res) => {
  const notifications = await notificationModel.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, data: notifications });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationModel.findOneAndUpdate({ _id: id, user: req.user._id }, { isRead: true });
  res.json({ success: true });
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const { id } = req.params;
  await notificationModel.findOneAndDelete({ _id: id, user: req.user._id });
  res.json({ success: true });
});

export const createNotification = async ({ user, title, message, type = 'other', ref, refModel }) => {
  await notificationModel.create({ user, title, message, type, ref, refModel });
}; 