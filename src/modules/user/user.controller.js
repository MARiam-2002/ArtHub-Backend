import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import bcryptjs from 'bcryptjs';
import followModel from '../../../DB/models/follow.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import mongoose from 'mongoose';
import transactionModel from '../../../DB/models/transaction.model.js';
import notificationModel from '../../../DB/models/notification.model.js';
import tokenModel from '../../../DB/models/token.model.js';
import chatModel from '../../../DB/models/chat.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import cloudinary from '../../utils/cloudinary.js';
// Removed errorHandler import - using direct error handling instead

/**
 * تحديث صورة الغلاف للمستخدم
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const updateCoverImage = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    
    // التحقق من وجود المستخدم
    const user = await userModel.findById(userId);
    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // التحقق من وجود ملف الصورة
    if (!req.file) {
      return res.fail(null, 'يرجى رفع صورة غلاف', 400);
    }

    console.log('🔄 تحديث صورة الغلاف للمستخدم:', userId);
    console.log('📁 الملف المرفوع:', req.file.originalname);

    try {
      // التحقق من وجود صورة غلاف سابقة
      if (user.coverImages && user.coverImages.length > 0) {
        console.log('📁 يوجد صورة غلاف سابقة، سيتم تحديثها...');
        
        // رفع الصورة مع public_id الموجود
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          req.file.path,
          {
            public_id: user.coverImages[0].id, // استخدام الـ public_id الموجود
            overwrite: true
          }
        );
        
        console.log('✅ تم تحديث صورة الغلاف بنجاح');
        console.log('🔗 الرابط الجديد:', secure_url);
        console.log('🆔 Public ID المحدث:', public_id);
        
        // تحديث بيانات الصورة
        user.coverImages[0].url = secure_url;
        
      } else {
        console.log('📁 لا يوجد صورة غلاف سابقة، سيتم إنشاء واحدة جديدة...');
        
        // إنشاء صورة غلاف جديدة
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: `arthub/user-covers/${user._id}`,
            transformation: [
              { width: 1200, height: 400, crop: 'fill', gravity: 'center' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          }
        );
        
        console.log('✅ تم رفع صورة الغلاف الجديدة بنجاح');
        console.log('🔗 الرابط:', secure_url);
        console.log('🆔 Public ID:', public_id);
        
        // إنشاء بيانات الصورة الجديدة
        user.coverImages = [{
          url: secure_url,
          id: public_id,
          type: 'cover'
        }];
      }
      
      console.log('✅ تم معالجة صورة الغلاف بنجاح');
      
      await user.save();
      
      res.success({
        _id: user._id,
        displayName: user.displayName,
        coverImages: user.coverImages,
        updatedAt: user.updatedAt
      }, 'تم تحديث صورة الغلاف بنجاح');
      
    } catch (error) {
      console.error('❌ خطأ في رفع صورة الغلاف:', error);
      
      return res.fail(null, 'فشل في رفع صورة الغلاف: ' + error.message, 400);
    }
    
  } catch (error) {
    console.error('Update cover image error:', error);
    next(new Error('حدث خطأ أثناء تحديث صورة الغلاف', { cause: 500 }));
  }
});

/**
 * تبديل العمل الفني في قائمة المفضلة
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const toggleWishlist = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { artworkId } = req.body;

    // التحقق من وجود العمل الفني
    const artwork = await artworkModel.findById(artworkId).lean();
    if (!artwork) {
      return res.fail(null, 'العمل الفني غير موجود', 404);
    }

    // التحقق من وجود المستخدم
    const user = await userModel.findById(userId);
    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    const index = user.wishlist.findIndex(id => id.toString() === artworkId);
    let action, message;

    if (index > -1) {
      // إزالة من المفضلة
      user.wishlist.splice(index, 1);
      action = 'removed';
      message = 'تم إزالة العمل من المفضلة';
    } else {
      // إضافة إلى المفضلة
      user.wishlist.push(artworkId);
      action = 'added';
      message = 'تم إضافة العمل إلى المفضلة';
    }

    await user.save();

    res.success({
      action,
      isInWishlist: action === 'added',
      wishlistCount: user.wishlist.length,
      artworkTitle: artwork.title
    }, message);
  } catch (error) {
    console.error('Toggle wishlist error:', error);
    next(new Error('حدث خطأ أثناء تحديث المفضلة', { cause: 500 }));
  }
});

export const getWishlist = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const user = await userModel
      .findById(req.user._id)
      .select('wishlist')
      .lean();

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    const totalItems = user.wishlist.length;
    const wishlistIds = user.wishlist.slice(skip, skip + Number(limit));

    const artworks = await artworkModel
      .find({ _id: { $in: wishlistIds } })
      .populate('artist', 'displayName profileImage job')
      .populate('category', 'name')
      .select('title image images price currency artist category isAvailable createdAt viewCount likeCount')
      .lean();

    // Maintain the order of wishlist
    const orderedArtworks = wishlistIds.map(id => 
      artworks.find(artwork => artwork._id.toString() === id.toString())
    ).filter(Boolean);

    const response = {
      artworks: formatArtworks(orderedArtworks),
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        hasNextPage: skip + orderedArtworks.length < totalItems
      }
    };

    res.success(response, 'تم جلب قائمة المفضلة بنجاح');
  } catch (error) {
    console.error('Get wishlist error:', error);
    next(new Error('حدث خطأ أثناء جلب قائمة المفضلة', { cause: 500 }));
  }
});

/**
 * تحديث الملف الشخصي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const updateProfile = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const updateData = {};

    // Only update provided fields
    const allowedFields = ['displayName', 'email'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Handle password update if provided
    if (req.body.password) {
      const hashedPassword = await bcryptjs.hash(req.body.password, 12);
      updateData.password = hashedPassword;
    }

    // التحقق من أن البريد الإلكتروني فريد إذا تم تحديثه
    if (req.body.email) {
      const existingUser = await userModel.findOne({ 
        email: req.body.email, 
        _id: { $ne: userId } 
      });
      
      if (existingUser) {
        return res.fail(null, 'البريد الإلكتروني مستخدم بالفعل', 400);
      }
    }

    // جلب المستخدم الحالي
    const currentUser = await userModel.findById(userId);
    if (!currentUser) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // Handle profile image if provided
    if (req.file) {
      // التحقق من وجود path للملف
      if (!req.file.path) {
        console.log('⚠️ File uploaded but no path available');
        return res.fail(null, 'ملف الصورة غير صالح', 400);
      }

      try {
        // التحقق من نوع الملف
        if (!req.file.mimetype || !req.file.mimetype.startsWith('image/')) {
          return res.fail(null, 'يجب أن يكون الملف صورة', 400);
        }

        // التحقق من حجم الملف (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
          return res.fail(null, 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 400);
        }

        // حذف الصورة القديمة من Cloudinary إذا كانت موجودة
        if (currentUser.profileImage && currentUser.profileImage.id) {
          try {
            await cloudinary.uploader.destroy(currentUser.profileImage.id);
            console.log('🗑️ Old image deleted successfully');
          } catch (error) {
            console.log('⚠️ Error deleting old image:', error.message);
          }
        }

        // رفع الصورة الجديدة إلى Cloudinary
        console.log('🔄 Starting image upload to Cloudinary...');
        console.log('📁 File path:', req.file.path);
        console.log('📏 File size:', req.file.size);
        console.log('📄 File type:', req.file.mimetype);

        const { secure_url, public_id } = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: `arthub/user-profiles/${currentUser._id}`,
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto', fetch_format: 'auto' }
            ]
          }
        );
        
        console.log('✅ New image uploaded successfully');
        console.log('🔗 URL:', secure_url);
        console.log('🆔 Public ID:', public_id);
        
        // إنشاء بيانات الصورة الجديدة
        updateData.profileImage = {
          url: secure_url,
          id: public_id,
        };
      } catch (uploadError) {
        console.error('❌ Image upload error:', uploadError);
        console.error('❌ Error details:', {
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack
        });
        return res.fail(null, 'حدث خطأ أثناء رفع الصورة', 400);
      }
    }

    const updatedUser = await userModel
      .findByIdAndUpdate(userId, updateData, { 
        new: true, 
        runValidators: true 
      })
      .select('-password');

    if (!updatedUser) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    res.success(updatedUser, 'تم تحديث الملف الشخصي بنجاح');
  } catch (error) {
    console.error('Update profile error:', error);
    next(new Error('حدث خطأ أثناء تحديث الملف الشخصي', { cause: 500 }));
  }
});

/**
 * تغيير كلمة المرور
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { currentPassword, newPassword } = req.body;
    const userId = req.user._id;

    // Get user with password
    const user = await userModel.findById(userId).select('+password');
    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.fail(null, 'كلمة المرور الحالية غير صحيحة', 400);
    }

    // Hash new password and update
    const hashedNewPassword = await bcryptjs.hash(newPassword, 12);
    await userModel.findByIdAndUpdate(userId, { password: hashedNewPassword });

    res.success(null, 'تم تغيير كلمة المرور بنجاح');
  } catch (error) {
    console.error('Change password error:', error);
    next(new Error('حدث خطأ أثناء تغيير كلمة المرور', { cause: 500 }));
  }
});

/**
 * جلب بيانات الفنان
 */
export const getArtistProfile = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { artistId } = req.params;

    // جلب بيانات الفنان
    const artist = await userModel
      .findOne({ _id: artistId, role: 'artist', isActive: true })
      .select('-password')
      .lean();

    if (!artist) {
      return res.fail(null, 'الفنان غير موجود', 404);
    }

    // جلب عدد المتابعين
    const followersCount = await followModel.countDocuments({ following: artistId });

    // جلب إحصائيات التقييمات
    const reviewStats = await reviewModel.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(artistId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    // جلب أعمال الفنان
    const artworks = await artworkModel.find({ artist: artistId }).sort({ createdAt: -1 }).limit(10);

    // جلب عدد المبيعات
    const salesCount = await transactionModel.countDocuments({
      seller: artistId,
      status: 'completed'
    });

    // التحقق مما إذا كان المستخدم الحالي يتابع هذا الفنان
    let isFollowing = false;
    if (req.user) {
      isFollowing = await followModel
        .findOne({
          follower: req.user._id,
          following: artistId
        })
        .lean();
    }

    // جمع وإرجاع البيانات
    res.status(200).json({
      success: true,
      message: 'تم جلب بيانات الفنان بنجاح',
      data: {
        artist: {
          _id: artist._id,
          displayName: artist.displayName,
          email: artist.email,
          profileImage: artist.profileImage?.url,
          coverImage: artist.coverImage?.url,
          bio: artist.bio,
          job: artist.job,
          location: artist.location,
          website: artist.website,
          socialMedia: artist.socialMedia,
          joinDate: artist.createdAt
        },
        stats: {
          followersCount,
          artworksCount: artworks.length,
          salesCount,
          avgRating: reviewStats[0]?.avgRating || 0,
          reviewsCount: reviewStats[0]?.totalReviews || 0
        },
        isFollowing: !!isFollowing,
        artworks
      }
    });
  } catch (error) {
    console.error('Get artist profile error:', error);
    next(new Error('حدث خطأ أثناء جلب بيانات الفنان', { cause: 500 }));
  }
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
  const [artworksCount, wishlistCount, followingCount, followersCount] =
    await Promise.all([
      artworkModel.countDocuments({ artist: userId }),
      userModel.findById(userId).then(user => user?.wishlist?.length || 0),
      followModel.countDocuments({ follower: userId }),
      followModel.countDocuments({ following: userId })
    ]);

  res.success(
    { artworksCount, wishlistCount, followingCount, followersCount },
    'تم جلب إحصائيات المستخدم بنجاح'
  );
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const followers = await followModel
    .find({ following: userId })
    .populate({
      path: 'follower',
      select: 'displayName profileImage job'
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const totalCount = await followModel.countDocuments({ following: userId });
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.success(
    {
      followers: followers.map(f => f.follower),
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    },
    'تم جلب المتابعين بنجاح'
  );
});

export const getFollowing = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const [following, totalCount] = await Promise.all([
      followModel
        .find({ follower: req.user._id })
        .populate('following', 'displayName profileImage job bio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      followModel.countDocuments({ follower: req.user._id })
    ]);

    const followingList = following.map(follow => follow.following);

    res.success({
      following: followingList,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + following.length < totalCount
      }
    }, 'تم جلب قائمة المتابعين بنجاح');
  } catch (error) {
    next(new Error('حدث خطأ أثناء جلب قائمة المتابعين', { cause: 500 }));
  }
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
  const favoriteArtworks = await artworkModel
    .find({
      _id: { $in: user.wishlist }
    })
    .populate({
      path: 'artist',
      select: 'displayName profileImage'
    })
    .select('title description images price category');

  res.success(favoriteArtworks, 'تم جلب الأعمال الفنية المفضلة بنجاح');
});

export const discoverArtists = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = 'newest' } = req.query;
  const skip = (page - 1) * limit;

  // Base query for artists
  const baseQuery = { role: 'artist' };

  // Different sorting options
  let sortOption = {};
  switch (sort) {
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
        const artists = await userModel
          .find({
            _id: { $in: artistIds },
            role: 'artist'
          })
          .select('displayName email profileImage job coverImages createdAt');

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

        return res.success(
          {
            artists: sortedArtists,
            pagination: {
              currentPage: parseInt(page),
              totalPages: Math.ceil(totalCount / limit),
              totalCount,
              hasNextPage: skip + sortedArtists.length < totalCount,
              hasPrevPage: page > 1
            }
          },
          'تم جلب الفنانين بنجاح'
        );
      }

      // Fallback to newest if no followers data
      sortOption = { createdAt: -1 };
      break;

    case 'recommended':
      // If user is logged in, recommend based on followed artists' categories
      if (req.user) {
        // Get artists the user follows
        const following = await followModel
          .find({ follower: req.user._id })
          .select('following')
          .lean();

        if (following.length > 0) {
          const followingIds = following.map(f => f.following);

          // Find artists with similar attributes but not already followed
          const recommendedArtists = await userModel
            .find({
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

          return res.success(
            {
              artists: recommendedArtists,
              pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                hasNextPage: skip + recommendedArtists.length < totalCount,
                hasPrevPage: page > 1
              }
            },
            'تم جلب الفنانين الموصى بهم بنجاح'
          );
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
  const artists = await userModel
    .find(baseQuery)
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit))
    .select('displayName email profileImage job coverImages createdAt');

  // Add follower count to each artist
  const artistsWithCounts = await Promise.all(
    artists.map(async artist => {
      const followersCount = await followModel.countDocuments({ following: artist._id });
      artist._doc.followersCount = followersCount;
      return artist;
    })
  );

  // Get total count for pagination
  const totalCount = await userModel.countDocuments(baseQuery);

  res.success(
    {
      artists: artistsWithCounts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        hasNextPage: skip + artists.length < totalCount,
        hasPrevPage: page > 1
      }
    },
    'تم جلب الفنانين بنجاح'
  );
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
  const successMessage =
    language === 'ar' ? 'تم تحديث اللغة المفضلة بنجاح' : 'Language preference updated successfully';

  return res.status(200).json({
    success: true,
    message: successMessage,
    data: {
      preferredLanguage: updatedUser.preferredLanguage
    }
  });
});

export const updateNotificationSettings = asyncHandler(async (req, res, next) => {
  try {
    const { notificationSettings } = req.body;

    const user = await userModel
      .findByIdAndUpdate(
        req.user._id,
        { notificationSettings },
        { new: true, runValidators: true }
      )
      .select('notificationSettings');

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    res.success(user.notificationSettings, 'تم تحديث إعدادات الإشعارات بنجاح');
  } catch (error) {
    next(new Error('حدث خطأ أثناء تحديث إعدادات الإشعارات', { cause: 500 }));
  }
});

/**
 * Delete user account (soft delete)
 */
export const deleteAccount = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { password } = req.body;
    const userId = req.user._id;

    // Verify password
    const user = await userModel.findById(userId).select('+password');
    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    const isPasswordValid = await bcryptjs.compare(password, user.password);
    if (!isPasswordValid) {
      return res.fail(null, 'كلمة المرور غير صحيحة', 400);
    }

    // Soft delete - mark as inactive instead of hard delete
    await userModel.findByIdAndUpdate(userId, { 
      isActive: false,
      deletedAt: new Date()
    });

    res.success(null, 'تم حذف الحساب بنجاح');
  } catch (error) {
    console.error('Delete account error:', error);
    next(new Error('حدث خطأ أثناء حذف الحساب', { cause: 500 }));
  }
});

/**
 * البحث المتقدم عن المستخدمين
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const searchUsers = asyncHandler(async (req, res, next) => {
  try {
    const { query, role, location, verified, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // بناء استعلام البحث
    const searchQuery = {};

    // البحث النصي
    if (query) {
      searchQuery.$or = [
        { displayName: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } },
        { job: { $regex: query, $options: 'i' } },
        { bio: { $regex: query, $options: 'i' } }
      ];
    }

    // فلترة حسب الدور
    if (role) {
      searchQuery.role = role;
    }

    // فلترة حسب الموقع
    if (location) {
      searchQuery.location = { $regex: location, $options: 'i' };
    }

    // فلترة حسب التحقق
    if (verified !== undefined) {
      searchQuery.isVerified = verified === 'true';
    }

    // استبعاد المستخدمين المحذوفين وغير النشطين
    searchQuery.isDeleted = { $ne: true };
    searchQuery.isActive = true;

    // تنفيذ البحث مع الإحصائيات
    const [users, totalCount] = await Promise.all([
      userModel
        .find(searchQuery)
        .select('displayName email profileImage job location bio role isVerified createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      userModel.countDocuments(searchQuery)
    ]);

    // إضافة إحصائيات لكل مستخدم
    const usersWithStats = await Promise.all(
      users.map(async user => {
        const stats = await Promise.all([
          followModel.countDocuments({ following: user._id }),
          followModel.countDocuments({ follower: user._id }),
          artworkModel.countDocuments({ artist: user._id, isAvailable: true })
        ]);

        return {
          ...user,
          stats: {
            followersCount: stats[0],
            followingCount: stats[1],
            artworksCount: stats[2]
          }
        };
      })
    );

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.success({
      users: usersWithStats,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
        limit: parseInt(limit)
      }
    }, 'تم البحث عن المستخدمين بنجاح');
  } catch (error) {
    return next(new Error('حدث خطأ أثناء البحث عن المستخدمين', { cause: 500 }));
  }
});

/**
 * الحصول على الملف الشخصي الكامل للمستخدم الحالي
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const getMyProfile = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;

    // جلب بيانات المستخدم
    const user = await userModel
      .findById(userId)
      .select('-password')
      .lean();

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // جلب الإحصائيات
    const [
      followersCount,
      followingCount,
      artworksCount,
      salesCount,
      reviewsCount
    ] = await Promise.all([
      followModel.countDocuments({ following: userId }),
      followModel.countDocuments({ follower: userId }),
      artworkModel.countDocuments({ artist: userId, isAvailable: true }),
      transactionModel.countDocuments({ seller: userId, status: 'completed' }),
      reviewModel.countDocuments({ artist: userId })
    ]);

    // حساب متوسط التقييم
    const avgRating = await reviewModel.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]);

    res.success({
      user,
      stats: {
        followersCount,
        followingCount,
        artworksCount,
        salesCount,
        reviewsCount,
        avgRating: avgRating[0]?.avgRating || 0
      }
    }, 'تم جلب الملف الشخصي بنجاح');
  } catch (error) {
    return next(new Error('حدث خطأ أثناء جلب الملف الشخصي', { cause: 500 }));
  }
});

/**
 * تحديث إعدادات الخصوصية
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const updatePrivacySettings = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { profileVisibility, showEmail, showPhone, allowMessages, showActivity } = req.body;

    // بناء كائن التحديث
    const updateData = {};
    if (profileVisibility !== undefined) {
      updateData['privacySettings.profileVisibility'] = profileVisibility;
    }
    if (showEmail !== undefined) {
      updateData['privacySettings.showEmail'] = showEmail;
    }
    if (showPhone !== undefined) {
      updateData['privacySettings.showPhone'] = showPhone;
    }
    if (allowMessages !== undefined) {
      updateData['privacySettings.allowMessages'] = allowMessages;
    }
    if (showActivity !== undefined) {
      updateData['privacySettings.showActivity'] = showActivity;
    }

    // تحديث إعدادات الخصوصية
    const user = await userModel
      .findByIdAndUpdate(userId, { $set: updateData }, { new: true })
      .select('privacySettings');

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    res.success({
      privacySettings: user.privacySettings
    }, 'تم تحديث إعدادات الخصوصية بنجاح');
  } catch (error) {
    return next(new Error('حدث خطأ أثناء تحديث إعدادات الخصوصية', { cause: 500 }));
  }
});

/**
 * الحصول على إحصائيات شاملة للمستخدم
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const getDetailedStats = asyncHandler(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { period = 'all' } = req.query; // all, month, week, year

    // تحديد فترة الإحصائيات
    let dateFilter = {};
    if (period !== 'all') {
      const now = new Date();
      switch (period) {
        case 'week':
          dateFilter = { createdAt: { $gte: new Date(now.setDate(now.getDate() - 7)) } };
          break;
        case 'month':
          dateFilter = { createdAt: { $gte: new Date(now.setMonth(now.getMonth() - 1)) } };
          break;
        case 'year':
          dateFilter = { createdAt: { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) } };
          break;
      }
    }

    // الإحصائيات الأساسية
    const [
      totalArtworks,
      totalFollowers,
      totalFollowing,
      totalSales,
      totalEarnings,
      totalViews
    ] = await Promise.all([
      artworkModel.countDocuments({ artist: userId, ...dateFilter }),
      followModel.countDocuments({ following: userId, ...dateFilter }),
      followModel.countDocuments({ follower: userId, ...dateFilter }),
      transactionModel.countDocuments({ seller: userId, status: 'completed', ...dateFilter }),
      transactionModel.aggregate([
        { $match: { seller: new mongoose.Types.ObjectId(userId), status: 'completed', ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      artworkModel.aggregate([
        { $match: { artist: new mongoose.Types.ObjectId(userId), ...dateFilter } },
        { $group: { _id: null, total: { $sum: '$views' } } }
      ])
    ]);

    // إحصائيات الفئات
    const categoryStats = await artworkModel.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(userId), ...dateFilter } },
      { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'categoryInfo' } },
      { $unwind: '$categoryInfo' },
      { $group: { _id: '$categoryInfo.name', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // إحصائيات شهرية للعام الحالي
    const monthlyStats = await artworkModel.aggregate([
      {
        $match: {
          artist: new mongoose.Types.ObjectId(userId),
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          artworks: { $sum: 1 },
          views: { $sum: '$views' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.success({
      overview: {
        totalArtworks,
        totalFollowers,
        totalFollowing,
        totalSales,
        totalEarnings: totalEarnings[0]?.total || 0,
        totalViews: totalViews[0]?.total || 0
      },
      categoryStats,
      monthlyStats,
      period
    }, 'تم جلب الإحصائيات التفصيلية بنجاح');
  } catch (error) {
    return next(new Error('حدث خطأ أثناء جلب الإحصائيات', { cause: 500 }));
  }
});

/**
 * Get user profile
 */
export const getProfile = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const user = await userModel
      .findById(req.user._id)
      .select('-password')
      .lean();

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // Get user stats
    const [artworksCount, followersCount, followingCount, wishlistCount] = await Promise.all([
      artworkModel.countDocuments({ artist: user._id }),
      followModel.countDocuments({ following: user._id }),
      followModel.countDocuments({ follower: user._id }),
      user.wishlist ? user.wishlist.length : 0
    ]);

    const profileData = {
      _id: user._id,
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage?.url,
      coverImage: user.coverImages && user.coverImages.length > 0 ? user.coverImages[0].url : null,
      bio: user.bio,
      job: user.job,
      location: user.location,
      website: user.website,
      socialMedia: user.socialMedia,
      isActive: user.isActive,
      createdAt: user.createdAt,
      stats: {
        artworksCount,
        followersCount,
        followingCount,
        wishlistCount
      }
    };

    res.success(profileData, 'تم جلب الملف الشخصي بنجاح');
  } catch (error) {
    console.error('Get profile error:', error);
    next(new Error('حدث خطأ أثناء جلب الملف الشخصي', { cause: 500 }));
  }
});

/**
 * Get user's own artworks (for artists)
 */
export const getMyArtworks = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = { artist: req.user._id };
    if (status) {
      query.isAvailable = status === 'available';
    }

    const [artworks, totalCount] = await Promise.all([
      artworkModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name')
        .lean(),
      artworkModel.countDocuments(query)
    ]);

    const formattedArtworks = artworks.map(artwork => ({
      _id: artwork._id,
      title: artwork.title,
      images: artwork.images,
      price: artwork.price,
      currency: artwork.currency || 'SAR',
      isAvailable: artwork.isAvailable,
      viewCount: artwork.viewCount || 0,
      likeCount: artwork.likeCount || 0,
      category: artwork.category,
      createdAt: artwork.createdAt
    }));

    res.success({
      artworks: formattedArtworks,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + artworks.length < totalCount
      }
    }, 'تم جلب أعمالك الفنية بنجاح');
  } catch (error) {
    next(new Error('حدث خطأ أثناء جلب الأعمال الفنية', { cause: 500 }));
  }
});

/**
 * Get user notifications settings
 */
export const getNotificationSettings = asyncHandler(async (req, res, next) => {
  try {
    const user = await userModel
      .findById(req.user._id)
      .select('notificationSettings')
      .lean();

    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    res.success(user.notificationSettings || {}, 'تم جلب إعدادات الإشعارات بنجاح');
  } catch (error) {
    next(new Error('حدث خطأ أثناء جلب إعدادات الإشعارات', { cause: 500 }));
  }
});

/**
 * تحديث bio (الوصف) للمستخدم
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const updateBio = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { bio } = req.body;
    
    // التحقق من وجود المستخدم
    const user = await userModel.findById(userId);
    if (!user) {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // التحقق من وجود bio
    if (!bio || bio.trim().length === 0) {
      return res.fail(null, 'يرجى إدخال وصف صحيح', 400);
    }

    // التحقق من طول bio (حد أقصى 500 حرف)
    if (bio.length > 500) {
      return res.fail(null, 'الوصف طويل جداً، الحد الأقصى 500 حرف', 400);
    }

    console.log('🔄 تحديث bio للمستخدم:', userId);
    console.log('📝 Bio الجديد:', bio);

    // تحديث bio
    user.bio = bio.trim();
    await user.save();
    
    console.log('✅ تم تحديث bio بنجاح');
    
    res.success({
      _id: user._id,
      displayName: user.displayName,
      bio: user.bio,
      updatedAt: user.updatedAt
    }, 'تم تحديث الوصف بنجاح');
    
  } catch (error) {
    console.error('Update bio error:', error);
    next(new Error('حدث خطأ أثناء تحديث الوصف', { cause: 500 }));
  }
});

/**
 * Get top artists
 */
export const getTopArtists = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const artists = await userModel.aggregate([
      { $match: { role: 'artist', isActive: true } },
      {
        $lookup: {
          from: 'artworks',
          localField: '_id',
          foreignField: 'artist',
          as: 'artworks'
        }
      },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'artist',
          as: 'reviews'
        }
      },
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'following',
          as: 'followers'
        }
      },
      {
        $addFields: {
          averageRating: {
            $cond: [
              { $eq: [{ $size: '$reviews' }, 0] },
              0,
              { $avg: '$reviews.rating' }
            ]
          },
          artworksCount: { $size: '$artworks' },
          reviewsCount: { $size: '$reviews' },
          followersCount: { $size: '$followers' }
        }
      },
      {
        $sort: { averageRating: -1, followersCount: -1, artworksCount: -1 }
      },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $project: {
          displayName: 1,
          profileImage: 1,
          job: 1,
          bio: 1,
          averageRating: { $round: ['$averageRating', 1] },
          reviewsCount: 1,
          artworksCount: 1,
          followersCount: 1
        }
      }
    ]);

    const total = await userModel.countDocuments({ role: 'artist', isActive: true });

    const response = {
      artists: artists.map(artist => ({
        _id: artist._id,
        displayName: artist.displayName,
        profileImage: artist.profileImage?.url,
        job: artist.job,
        bio: artist.bio,
        rating: artist.averageRating || 0,
        reviewsCount: artist.reviewsCount || 0,
        artworksCount: artist.artworksCount || 0,
        followersCount: artist.followersCount || 0
      })),
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: skip + artists.length < total
      }
    };

    res.success(response, 'تم جلب أفضل الفنانين بنجاح');
  } catch (error) {
    console.error('Get top artists error:', error);
    next(new Error('حدث خطأ أثناء جلب أفضل الفنانين', { cause: 500 }));
  }
});

/**
 * Get latest artists
 */
export const getLatestArtists = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const artists = await userModel.aggregate([
      { $match: { role: 'artist', isActive: true } },
      {
        $lookup: {
          from: 'artworks',
          localField: '_id',
          foreignField: 'artist',
          as: 'artworks'
        }
      },
      {
        $lookup: {
          from: 'follows',
          localField: '_id',
          foreignField: 'following',
          as: 'followers'
        }
      },
      {
        $addFields: {
          artworksCount: { $size: '$artworks' },
          followersCount: { $size: '$followers' }
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $project: {
          displayName: 1,
          profileImage: 1,
          job: 1,
          bio: 1,
          createdAt: 1,
          artworksCount: 1,
          followersCount: 1
        }
      }
    ]);

    const total = await userModel.countDocuments({ role: 'artist', isActive: true });

    const response = {
      artists: artists.map(artist => ({
        _id: artist._id,
        displayName: artist.displayName,
        profileImage: artist.profileImage?.url,
        job: artist.job,
        bio: artist.bio,
        joinDate: artist.createdAt,
        artworksCount: artist.artworksCount || 0,
        followersCount: artist.followersCount || 0
      })),
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: skip + artists.length < total
      }
    };

    res.success(response, 'تم جلب أحدث الفنانين بنجاح');
  } catch (error) {
    console.error('Get latest artists error:', error);
    next(new Error('حدث خطأ أثناء جلب أحدث الفنانين', { cause: 500 }));
  }
});

/**
 * Format artworks for consistent response
 */
function formatArtworks(artworks) {
  return artworks.map(artwork => {
    // Get the main image (prioritize image field, then first image from images array)
    let mainImage = null;
    if (artwork.image) {
      mainImage = artwork.image;
    } else if (artwork.images && artwork.images.length > 0) {
      const firstImage = artwork.images[0];
      if (typeof firstImage === 'string') {
        mainImage = firstImage;
      } else if (firstImage && typeof firstImage === 'object') {
        mainImage = firstImage.url || firstImage;
      }
    }
    
    return {
      _id: artwork._id,
      title: artwork.title?.ar || artwork.title,
      image: mainImage, // Single image key
      images: artwork.images?.map(img => {
        // Handle both string URLs and object URLs
        if (typeof img === 'string') {
          return {
            url: img,
            optimizedUrl: img
          };
        } else if (img && typeof img === 'object') {
          return {
            url: img.url || img,
            optimizedUrl: img.optimizedUrl || img.url || img
          };
        }
        return null;
      }).filter(Boolean) || [],
      price: artwork.price,
      currency: artwork.currency || 'SAR',
      category: {
        _id: artwork.category?._id,
        name: artwork.category?.name?.ar || artwork.category?.name
      },
      viewCount: artwork.viewCount || 0,
      likeCount: artwork.likeCount || 0,
      isAvailable: artwork.isAvailable,
      createdAt: artwork.createdAt
    };
  });
}
