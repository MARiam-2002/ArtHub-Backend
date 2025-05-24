import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import imageModel from '../../../DB/models/image.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import bcryptjs from 'bcryptjs';
import followModel from '../../../DB/models/follow.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import mongoose from 'mongoose';
import transactionModel from '../../../DB/models/transaction.model.js';
import notificationModel from '../../../DB/models/notification.model.js';
import tokenModel from '../../../DB/models/token.model.js';
import chatModel from '../../../DB/models/chat.model.js';

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

export const discoverArtists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'newest' } = req.query;
  const skip = (page - 1) * limit;
  
  // Base query for artists
  const baseQuery = { role: 'artist' };
  
  // Different sorting options
  let sortOption = {};
  switch(sort) {
    case 'popular':
      // Sort by number of followers (requires aggregation)
      const artistsByFollowers = await followModel.aggregate([
        { $group: { _id: '$following', followersCount: { $sum: 1 } } },
        { $sort: { followersCount: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
      ]);
      
      if (artistsByFollowers.length > 0) {
        const artistIds = artistsByFollowers.map(item => item._id);
        
        // Get the actual artist documents
        const artists = await userModel.find({ 
          _id: { $in: artistIds }, 
          role: 'artist' 
        }).select('displayName email profileImage job coverImages createdAt');
        
        // Sort them in the same order as the aggregation result
        const sortedArtists = [];
        artistIds.forEach(id => {
          const artist = artists.find(a => a._id.toString() === id.toString());
          if (artist) {
            // Add follower count to each artist
            const followerData = artistsByFollowers.find(
              item => item._id.toString() === id.toString()
            );
            artist._doc.followersCount = followerData.followersCount;
            sortedArtists.push(artist);
          }
        });
        
        // Count total artists for pagination
        const totalCount = await userModel.countDocuments(baseQuery);
        
        return res.success({
          artists: sortedArtists,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            hasNextPage: skip + sortedArtists.length < totalCount,
            hasPrevPage: page > 1
          }
        }, 'تم جلب الفنانين بنجاح');
      }
      
      // Fallback to newest if no followers data
      sortOption = { createdAt: -1 };
      break;
      
    case 'recommended':
      // If user is logged in, recommend based on followed artists' categories
      if (req.user) {
        // Get artists the user follows
        const following = await followModel.find({ follower: req.user._id })
          .select('following')
          .lean();
        
        if (following.length > 0) {
          const followingIds = following.map(f => f.following);
          
          // Find artists with similar attributes but not already followed
          const recommendedArtists = await userModel.find({
            _id: { $nin: followingIds },
            role: 'artist'
          })
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .select('displayName email profileImage job coverImages createdAt');
          
          const totalCount = await userModel.countDocuments({
            _id: { $nin: followingIds },
            role: 'artist'
          });
          
          return res.success({
            artists: recommendedArtists,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(totalCount / limit),
              totalCount,
              hasNextPage: skip + recommendedArtists.length < totalCount,
              hasPrevPage: page > 1
            }
          }, 'تم جلب الفنانين الموصى بهم بنجاح');
        }
      }
      
      // Fallback to newest if no recommendations possible
      sortOption = { createdAt: -1 };
      break;
      
    case 'newest':
    default:
      sortOption = { createdAt: -1 };
      break;
  }
  
  // Standard query approach
  const artists = await userModel.find(baseQuery)
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit))
    .select('displayName email profileImage job coverImages createdAt');
  
  // Add follower count to each artist
  const artistsWithCounts = await Promise.all(artists.map(async (artist) => {
    const followersCount = await followModel.countDocuments({ following: artist._id });
    artist._doc.followersCount = followersCount;
    return artist;
  }));
  
  // Get total count for pagination
  const totalCount = await userModel.countDocuments(baseQuery);
  
  res.success({
    artists: artistsWithCounts,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
      hasNextPage: skip + artists.length < totalCount,
      hasPrevPage: page > 1
    }
  }, 'تم جلب الفنانين بنجاح');
});

/**
 * تحديث اللغة المفضلة للمستخدم
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 * @returns {Object} استجابة JSON مع حالة النجاح ورسالة
 */
export const updateLanguagePreference = asyncHandler(async (req, res) => {
  const { language } = req.body;
  const userId = req.user._id;

  // التحقق من صحة اللغة
  if (!language || !['ar', 'en'].includes(language)) {
    return res.status(400).json({
      success: false,
      message: 'اللغة غير صالحة',
      error: 'يجب أن تكون اللغة إما "ar" للعربية أو "en" للإنجليزية'
    });
  }

  // تحديث تفضيل اللغة في قاعدة البيانات
  const updatedUser = await userModel.findByIdAndUpdate(
    userId,
    { preferredLanguage: language },
    { new: true }
  );

  if (!updatedUser) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      error: 'لم يتم العثور على المستخدم'
    });
  }

  // استجابة النجاح
  const successMessage = language === 'ar' 
    ? 'تم تحديث اللغة المفضلة بنجاح' 
    : 'Language preference updated successfully';

  return res.status(200).json({
    success: true,
    message: successMessage,
    data: {
      preferredLanguage: updatedUser.preferredLanguage
    }
  });
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { enablePush, enableEmail, muteChat } = req.body;
  
  // Build update object with only provided fields
  const notificationSettings = {};
  if (enablePush !== undefined) notificationSettings['notificationSettings.enablePush'] = enablePush;
  if (enableEmail !== undefined) notificationSettings['notificationSettings.enableEmail'] = enableEmail;
  if (muteChat !== undefined) notificationSettings['notificationSettings.muteChat'] = muteChat;
  
  if (Object.keys(notificationSettings).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'لم يتم توفير أي إعدادات للتحديث',
      error: 'No settings provided for update'
    });
  }
  
  // Update user's notification settings
  const user = await userModel.findByIdAndUpdate(
    userId,
    { $set: notificationSettings },
    { new: true }
  ).select('-password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      error: 'User not found'
    });
  }
  
  res.status(200).json({
    success: true,
    message: 'تم تحديث إعدادات الإشعارات بنجاح',
    data: {
      notificationSettings: user.notificationSettings
    }
  });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // التحقق من كلمة المرور إذا كانت متوفرة
  if (req.body.password) {
    const user = await userModel.findById(userId).select('+password');
    if (user && user.password) {
      const isMatch = await bcryptjs.compare(req.body.password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'كلمة المرور غير صحيحة',
          error: 'Incorrect password'
        });
      }
    }
  }
  
  // حذف جميع بيانات المستخدم المرتبطة
  // البدء بالمعاملات
  await Promise.all([
    // حذف المراجعات والتقييمات
    reviewModel.deleteMany({ user: userId }),
    
    // حذف الإشعارات
    notificationModel.deleteMany({ user: userId }),
    
    // حذف رموز الجلسات
    tokenModel.deleteMany({ user: userId }),
    
    // حذف المتابعات
    followModel.deleteMany({ 
      $or: [{ follower: userId }, { following: userId }] 
    }),
    
    // وضع علامة على الأعمال الفنية كمحذوفة بدلاً من حذفها فعلياً
    artworkModel.updateMany(
      { artist: userId },
      { isDeleted: true, isAvailable: false }
    ),
    
    // وضع علامة على المحادثات كمحذوفة
    chatModel.updateMany(
      { members: userId },
      { isDeleted: true }
    )
  ]);
  
  // حذف المستخدم نفسه (أو وضع علامة عليه كمحذوف)
  await userModel.findByIdAndUpdate(
    userId, 
    { 
      isDeleted: true,
      email: `deleted_${userId}@arthub.com`,
      displayName: 'مستخدم محذوف',
      firebaseUid: null,
      isActive: false
    }
  );
  
  res.status(200).json({
    success: true,
    message: 'تم حذف الحساب بنجاح',
  });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // حذف جميع رموز الجلسات للمستخدم
  await tokenModel.deleteMany({ user: userId });
  
  // إذا كان المستخدم يستخدم Firebase، يمكن إضافة خطوات إضافية هنا
  
  res.status(200).json({
    success: true,
    message: 'تم تسجيل الخروج من جميع الأجهزة بنجاح',
  });
});

export const deactivateAccount = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  
  // تحديث حالة المستخدم إلى غير نشط
  await userModel.findByIdAndUpdate(userId, { isActive: false });
  
  // إلغاء صلاحية جميع رموز الجلسات
  await tokenModel.updateMany(
    { user: userId },
    { isValid: false }
  );
  
  res.status(200).json({
    success: true,
    message: 'تم تعطيل الحساب بنجاح',
  });
});

export const reactivateAccount = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  // البحث عن المستخدم
  const user = await userModel.findOne({ email }).select('+password');
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'البريد الإلكتروني غير مسجل',
      error: 'Email not found'
    });
  }
  
  // التحقق من كلمة المرور
  if (user.password) {
    const isMatch = await bcryptjs.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'كلمة المرور غير صحيحة',
        error: 'Incorrect password'
      });
    }
  }
  
  // إعادة تنشيط الحساب
  if (!user.isActive) {
    user.isActive = true;
    await user.save();
  }
  
  res.status(200).json({
    success: true,
    message: 'تم إعادة تنشيط الحساب بنجاح',
  });
});
