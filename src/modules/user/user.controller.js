import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import imageModel from '../../../DB/models/image.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import bcryptjs from 'bcryptjs';
import followModel from '../../../DB/models/follow.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import mongoose from 'mongoose';
import transactionModel from '../../../DB/models/transaction.model.js';

export const toggleWishlist = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { artworkId } = req.body;
  const user = await userModel.findById(userId);
  if (!user) return res.fail(null, 'المستخدم غير موجود', 404);
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
  res.success({ success: true, action });
});

export const getWishlist = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user._id).populate({
    path: 'wishlist',
    model: 'Artwork',
  });
  if (!user) return res.fail(null, 'المستخدم غير موجود', 404);
  res.success(user.wishlist, 'تم جلب قائمة المفضلة بنجاح');
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
  
  if (!user) return res.fail(null, 'المستخدم غير موجود', 404);
  
  res.success({ success: true, message: 'تم تحديث الملف الشخصي بنجاح', data: user });
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
  if (!user) return res.fail(null, 'المستخدم غير موجود', 404);
  
  const isMatch = await bcryptjs.compare(oldPassword, user.password);
  if (!isMatch) return res.fail(null, 'كلمة المرور القديمة غير صحيحة', 400);
  
  user.password = await bcryptjs.hash(newPassword, Number(process.env.SALT_ROUND || 8));
  await user.save();
  
  res.success(null, 'تم تغيير كلمة المرور بنجاح');
});

export const getArtistProfile = asyncHandler(async (req, res, next) => {
  const { artistId } = req.params;
  
  // جلب بيانات الفنان
  const artist = await userModel.findOne({ _id: artistId, role: 'artist' });
  
  if (!artist) {
    return res.status(404).json({
      success: false,
      message: "الفنان غير موجود"
    });
  }
  
  // جلب عدد المتابعين
  const followersCount = await followModel.countDocuments({ following: artistId });
  
  // جلب إحصائيات التقييمات
  const reviewStats = await reviewModel.aggregate([
    { $match: { artist: new mongoose.Types.ObjectId(artistId) } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: "$rating" },
        ratingsCount: { $sum: 1 }
      }
    }
  ]);
  
  // جلب أعمال الفنان
  const artworks = await artworkModel.find({ artist: artistId })
    .sort({ createdAt: -1 })
    .limit(10);
    
  // جلب عدد المبيعات
  const salesCount = await transactionModel.countDocuments({ seller: artistId, status: 'completed' });
  
  // التحقق مما إذا كان المستخدم الحالي يتابع هذا الفنان
  let isFollowing = false;
  if (req.user) {
    isFollowing = await followModel.findOne({ 
      follower: req.user._id, 
      following: artistId 
    }).lean();
  }
  
  // جمع وإرجاع البيانات
  res.status(200).json({
    success: true,
    message: "تم جلب بيانات الفنان بنجاح",
    data: {
      artist: {
        _id: artist._id,
        displayName: artist.displayName,
        email: artist.email,
        profileImage: artist.profileImage,
        coverImage: artist.coverImage,
        bio: artist.bio,
        job: artist.job,
        joinDate: artist.createdAt
      },
      stats: {
        followersCount,
        artworksCount: artworks.length,
        salesCount,
        avgRating: reviewStats[0]?.avgRating || 0,
        ratingsCount: reviewStats[0]?.ratingsCount || 0
      },
      isFollowing: !!isFollowing,
      artworks
    }
  });
});

export const followArtist = asyncHandler(async (req, res) => {
  const followerId = req.user._id;
  const { artistId } = req.params;
  
  // Check if user is trying to follow themselves
  if (followerId.toString() === artistId) {
    return res.fail(null, 'لا يمكنك متابعة نفسك', 400);
  }
  
  // Check if artist exists
  const artist = await userModel.findById(artistId);
  if (!artist) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }
  
  // Check if already following
  const existingFollow = await followModel.findOne({
    follower: followerId,
    following: artistId
  });
  
  if (existingFollow) {
    return res.fail(null, 'أنت بالفعل تتابع هذا الفنان', 400);
  }
  
  // Create follow relationship
  await followModel.create({
    follower: followerId,
    following: artistId
  });
  
  // Get updated follower count
  const followersCount = await followModel.countDocuments({ following: artistId });
  
  res.success({ isFollowing: true, followersCount }, 'تمت متابعة الفنان بنجاح');
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
    return res.fail(null, 'أنت لا تتابع هذا الفنان', 400);
  }
  
  // Remove follow relationship
  await followModel.deleteOne({
    follower: followerId,
    following: artistId
  });
  
  // Get updated follower count
  const followersCount = await followModel.countDocuments({ following: artistId });
  
  res.success({ isFollowing: false, followersCount }, 'تم إلغاء متابعة الفنان بنجاح');
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
  
  res.success({ artworksCount, imagesCount, wishlistCount, followingCount, followersCount }, 'تم جلب إحصائيات المستخدم بنجاح');
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
  
  res.success({ followers: followers.map(f => f.follower), pagination: {
    currentPage: parseInt(page),
    totalPages,
    totalCount,
    hasNextPage: parseInt(page) < totalPages,
    hasPrevPage: parseInt(page) > 1
  } }, 'تم جلب المتابعين بنجاح');
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
  
  res.success({ following: following.map(f => f.following), pagination: {
    currentPage: parseInt(page),
    totalPages,
    totalCount,
    hasNextPage: parseInt(page) < totalPages,
    hasPrevPage: parseInt(page) > 1
  } }, 'تم جلب المتابَعين بنجاح');
});

/**
 * جلب الأعمال الفنية المفضلة للمستخدم
 */
export const getFavoriteArtworks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // جلب معلومات المستخدم مع الأعمال المفضلة
  const user = await userModel.findById(userId).select('wishlist');
  
  if (!user) {
    return res.fail(null, 'المستخدم غير موجود', 404);
  }
  
  // جلب تفاصيل الأعمال الفنية المفضلة
  const favoriteArtworks = await artworkModel.find({
    _id: { $in: user.wishlist }
  }).populate({
    path: 'artist',
    select: 'displayName profileImage'
  }).select('title description images price category');
  
  res.success(favoriteArtworks, 'تم جلب الأعمال الفنية المفضلة بنجاح');
});
