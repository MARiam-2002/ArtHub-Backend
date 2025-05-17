
import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import imageModel from '../../../DB/models/image.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import bcryptjs from 'bcryptjs';
import followModel from '../../../DB/models/follow.model.js';
import reviewModel from '../../../DB/models/review.model.js';

export const toggleWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { artworkId } = req.body;
  const user = await userModel.findById(userId);
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
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
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  res.json({ success: true, data: user.wishlist });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { displayName, job, profileImage, coverImages } = req.body;
  
  // Create update object with only provided fields
  const updateData = {};
  if (displayName !== undefined) updateData.displayName = displayName;
  if (job !== undefined) updateData.job = job;
  if (profileImage !== undefined) updateData.profileImage = profileImage;
  if (coverImages !== undefined) updateData.coverImages = coverImages;
  
  const user = await userModel.findByIdAndUpdate(
    userId,
    updateData,
    { new: true }
  ).select('-password');
  
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  
  res.json({ 
    success: true, 
    message: 'تم تحديث الملف الشخصي بنجاح',
    data: user 
  });
});

export const changePassword = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { oldPassword, newPassword } = req.body;
  
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ 
      success: false, 
      message: 'يجب توفير كلمة المرور القديمة والجديدة' 
    });
  }
  
  const user = await userModel.findById(userId).select('+password');
  if (!user) return res.status(404).json({ success: false, message: 'المستخدم غير موجود' });
  
  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) return res.status(400).json({ success: false, message: 'كلمة المرور القديمة غير صحيحة' });
  
  user.password = await bcryptjs.hash(newPassword, Number(process.env.SALT_ROUND || 8));
  await user.save();
  
  res.json({ 
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح' 
  });
});

export const getArtistProfile = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const artist = await userModel.findById(artistId).select('displayName profileImage job coverImages email');
  
  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({ 
      success: false, 
      message: 'الفنان غير موجود' 
    });
  }
  
  // Get followers count
  const followersCount = await followModel.countDocuments({ following: artistId });
  
  // Get artist's artworks
  const artworks = await artworkModel.find({ artist: artistId }).sort({ createdAt: -1 }).limit(10);
  
  // Get artist's images
  const images = await imageModel.find({ user: artistId, isPublic: true })
    .sort({ viewCount: -1, createdAt: -1 })
    .limit(10);
  
  // Get artwork count
  const artworksCount = await artworkModel.countDocuments({ artist: artistId });
  
  // Get images count
  const imagesCount = await imageModel.countDocuments({ user: artistId, isPublic: true });
  
  // Get average rating
  const stats = await reviewModel.aggregate([
    { $match: { artist: artist._id } },
    { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
  ]);
  
  const avgRating = stats[0]?.avgRating || 0;
  const reviewsCount = stats[0]?.count || 0;
  
  // Check if logged in user is following this artist
  let isFollowing = false;
  if (req.user && req.user._id) {
    const followRecord = await followModel.findOne({ 
      follower: req.user._id, 
      following: artistId 
    });
    isFollowing = !!followRecord;
  }
  
  res.json({
    success: true,
    data: {
      artist,
      followersCount,
      artworksCount,
      imagesCount,
      avgRating,
      reviewsCount,
      isFollowing,
      artworks,
      images
    },
  });
});

export const followArtist = asyncHandler(async (req, res) => {
  const followerId = req.user._id;
  const { artistId } = req.params;
  
  // Check if user is trying to follow themselves
  if (followerId.toString() === artistId) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكنك متابعة نفسك'
    });
  }
  
  // Check if artist exists
  const artist = await userModel.findById(artistId);
  if (!artist) {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود'
    });
  }
  
  // Check if already following
  const existingFollow = await followModel.findOne({
    follower: followerId,
    following: artistId
  });
  
  if (existingFollow) {
    return res.status(400).json({
      success: false,
      message: 'أنت بالفعل تتابع هذا الفنان'
    });
  }
  
  // Create follow relationship
  await followModel.create({
    follower: followerId,
    following: artistId
  });
  
  // Get updated follower count
  const followersCount = await followModel.countDocuments({ following: artistId });
  
  return res.status(200).json({
    success: true,
    message: 'تمت متابعة الفنان بنجاح',
    data: {
      isFollowing: true,
      followersCount
    }
  });
});

export const unfollowArtist = asyncHandler(async (req, res) => {
  const followerId = req.user._id;
  const { artistId } = req.params;
  
  // Check if follow relationship exists
  const existingFollow = await followModel.findOne({
    follower: followerId,
    following: artistId
  });
  
  if (!existingFollow) {
    return res.status(400).json({
      success: false,
      message: 'أنت لا تتابع هذا الفنان'
    });
  }
  
  // Remove follow relationship
  await followModel.deleteOne({
    follower: followerId,
    following: artistId
  });
  
  // Get updated follower count
  const followersCount = await followModel.countDocuments({ following: artistId });
  
  return res.status(200).json({
    success: true,
    message: 'تم إلغاء متابعة الفنان بنجاح',
    data: {
      isFollowing: false,
      followersCount
    }
  });
});

export const getUserStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // Get artwork and image counts
  const [artworksCount, imagesCount, wishlistCount, followingCount, followersCount] = await Promise.all([
    artworkModel.countDocuments({ artist: userId }),
    imageModel.countDocuments({ user: userId }),
    userModel.findById(userId).then(user => user?.wishlist?.length || 0),
    followModel.countDocuments({ follower: userId }),
    followModel.countDocuments({ following: userId })
  ]);
  
  return res.status(200).json({
    success: true,
    data: {
      artworksCount,
      imagesCount,
      wishlistCount,
      followingCount,
      followersCount
    }
  });
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const followers = await followModel.find({ following: userId })
    .populate({
      path: 'follower',
      select: 'displayName profileImage job'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const totalCount = await followModel.countDocuments({ following: userId });
  const totalPages = Math.ceil(totalCount / parseInt(limit));
  
  return res.status(200).json({
    success: true,
    data: {
      followers: followers.map(f => f.follower),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

export const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const following = await followModel.find({ follower: userId })
    .populate({
      path: 'following',
      select: 'displayName profileImage job'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));
    
  const totalCount = await followModel.countDocuments({ follower: userId });
  const totalPages = Math.ceil(totalCount / parseInt(limit));
  
  return res.status(200).json({
    success: true,
    data: {
      following: following.map(f => f.following),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});
