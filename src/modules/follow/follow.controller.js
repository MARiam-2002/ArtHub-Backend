import followModel from '../../../DB/models/follow.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const followArtist = asyncHandler(async (req, res) => {
  const follower = req.user._id;
  const { artistId } = req.body;
  if (follower.toString() === artistId) return res.status(400).json({ success: false, message: 'لا يمكنك متابعة نفسك.' });
  const exists = await followModel.findOne({ follower, following: artistId });
  if (exists) return res.status(400).json({ success: false, message: 'أنت تتابع هذا الفنان بالفعل.' });
  await followModel.create({ follower, following: artistId });
  res.status(201).json({ success: true, message: 'تمت المتابعة.' });
});

export const unfollowArtist = asyncHandler(async (req, res) => {
  const follower = req.user._id;
  const { artistId } = req.body;
  await followModel.deleteOne({ follower, following: artistId });
  res.json({ success: true, message: 'تم إلغاء المتابعة.' });
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const followers = await followModel.find({ following: artistId }).populate('follower', 'email');
  res.json({ success: true, data: followers });
});

export const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const following = await followModel.find({ follower: userId }).populate('following', 'email');
  res.json({ success: true, data: following });
}); 