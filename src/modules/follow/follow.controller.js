import followModel from '../../../DB/models/follow.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendFollowNotification } from '../../utils/pushNotifications.js';
import { getPaginationParams } from '../../utils/pagination.js';

export const followArtist = asyncHandler(async (req, res, next) => {
  const follower = req.user._id;
  const { artistId } = req.body;

  // التحقق من أن المستخدم لا يحاول متابعة نفسه
  if (follower.toString() === artistId) {
    return res.status(400).json({
      success: false,
      message: 'لا يمكنك متابعة نفسك.'
    });
  }

  // التحقق من وجود الفنان
  const artist = await userModel.findById(artistId);
  if (!artist) {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود.'
    });
  }

  // التحقق من عدم وجود متابعة مسبقة
  const exists = await followModel.findOne({ follower, following: artistId });
  if (exists) {
    return res.status(400).json({
      success: false,
      message: 'أنت تتابع هذا الفنان بالفعل.'
    });
  }

  // إنشاء علاقة متابعة جديدة
  await followModel.create({ follower, following: artistId });

  // إرسال إشعار للفنان
  await sendFollowNotification(
    artistId,
    follower.toString(),
    req.user.displayName || req.user.userName
  );

  res.status(201).json({
    success: true,
    message: 'تمت المتابعة بنجاح.'
  });
});

export const unfollowArtist = asyncHandler(async (req, res, next) => {
  const follower = req.user._id;
  const { artistId } = req.body;

  // التحقق من وجود متابعة
  const followRelation = await followModel.findOne({
    follower,
    following: artistId
  });

  if (!followRelation) {
    return res.status(400).json({
      success: false,
      message: 'أنت لا تتابع هذا الفنان.'
    });
  }

  // حذف علاقة المتابعة
  await followModel.deleteOne({ follower, following: artistId });

  res.json({
    success: true,
    message: 'تم إلغاء المتابعة بنجاح.'
  });
});

export const getFollowers = asyncHandler(async (req, res, next) => {
  const { artistId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // التحقق من وجود الفنان
  const artist = await userModel.findById(artistId);
  if (!artist) {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود.'
    });
  }

  // جلب المتابعين مع التصفح
  const [followers, totalCount] = await Promise.all([
    followModel
      .find({ following: artistId })
      .populate('follower', 'displayName userName profileImage job')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    followModel.countDocuments({ following: artistId })
  ]);

  // تنسيق البيانات
  const formattedFollowers = followers.map(f => ({
    _id: f.follower._id,
    displayName: f.follower.displayName || f.follower.userName,
    profileImage: f.follower.profileImage,
    job: f.follower.job,
    followedAt: f.createdAt
  }));

  // معلومات الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    message: 'تم جلب المتابعين بنجاح',
    data: {
      followers: formattedFollowers,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    }
  });
});

export const getFollowing = asyncHandler(async (req, res, next) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  // التحقق من وجود المستخدم
  const user = await userModel.findById(userId);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود.'
    });
  }

  // جلب الفنانين المتابعين مع التصفح
  const [following, totalCount] = await Promise.all([
    followModel
      .find({ follower: userId })
      .populate('following', 'displayName userName profileImage job')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    followModel.countDocuments({ follower: userId })
  ]);

  // تنسيق البيانات
  const formattedFollowing = following.map(f => ({
    _id: f.following._id,
    displayName: f.following.displayName || f.following.userName,
    profileImage: f.following.profileImage,
    job: f.following.job,
    followedAt: f.createdAt
  }));

  // معلومات الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    message: 'تم جلب المتابَعين بنجاح',
    data: {
      following: formattedFollowing,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    }
  });
});

export const checkFollowStatus = asyncHandler(async (req, res, next) => {
  const { artistId } = req.params;

  if (!req.user) {
    return res.json({
      success: true,
      data: { isFollowing: false }
    });
  }

  const isFollowing = await followModel.findOne({
    follower: req.user._id,
    following: artistId
  });

  res.json({
    success: true,
    data: { isFollowing: !!isFollowing }
  });
});
