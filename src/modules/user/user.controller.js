import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import bcryptjs from 'bcryptjs';
import followModel from '../../../DB/models/follow.model.js';
import reviewModel from '../../../DB/models/review.model.js';

export const toggleWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { artworkId } = req.body;
  const user = await userModel.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const index = user.wishlist.findIndex(id => id.toString() === artworkId);
  let action;
  if (index > -1) {
    user.wishlist.splice(index, 1);
    action = 'removed';
  } else {
    user.wishlist.push(artworkId);
    action = 'added';
  }
  await user.save();
  res.json({ success: true, action });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user._id).populate({
    path: 'wishlist',
    model: 'Artwork',
  });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user.wishlist });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { displayName, job, profileImage, coverImages } = req.body;
  const user = await userModel.findByIdAndUpdate(
    userId,
    { displayName, job, profileImage, coverImages },
    { new: true }
  );
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;
  const user = await userModel.findById(userId).select('+password');
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) return res.status(400).json({ success: false, message: 'كلمة المرور القديمة غير صحيحة' });
  user.password = await bcryptjs.hash(newPassword, Number(process.env.SALT_ROUND));
  await user.save();
  res.json({ success: true });
});

export const getArtistProfile = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const artist = await userModel.findById(artistId).select('displayName profileImage job coverImages email');
  if (!artist || artist.role !== 'artist') return res.status(404).json({ success: false, message: 'الفنان غير موجود' });
  const followersCount = await followModel.countDocuments({ following: artistId });
  const artworks = await artworkModel.find({ artist: artistId }).sort({ createdAt: -1 });
  const artworksCount = artworks.length;
  const stats = await reviewModel.aggregate([
    { $match: { artist: artist._id } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  const avgRating = stats[0]?.avgRating || 0;
  const reviewsCount = stats[0]?.count || 0;
  res.json({
    success: true,
    data: {
      artist,
      followersCount,
      artworksCount,
      avgRating,
      reviewsCount,
      artworks,
    },
  });
}); 