import followModel from '../../../DB/models/follow.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureConnection } from '../../utils/mongodbUtils.js';
import { createNotification } from '../notification/notification.controller.js';

/**
 * Toggle follow/unfollow artist
 */
export const toggleFollow = asyncHandler(async (req, res, next) => {
  try {
    await ensureConnection();
    
    const follower = req.user._id;
    const { artistId } = req.body;

    // Check if user is trying to follow themselves
    if (follower.toString() === artistId) {
      return res.fail(null, 'لا يمكنك متابعة نفسك', 400);
    }

    // Check if artist exists and is active
    const artist = await userModel
      .findOne({ _id: artistId, role: 'artist', isActive: true })
      .select('displayName profileImage')
      .lean();

    if (!artist) {
      return res.fail(null, 'الفنان غير موجود أو غير نشط', 404);
    }

    // Check current follow status
    const existingFollow = await followModel.findOne({
      follower,
      following: artistId
    });

    let action, isFollowing;

    if (existingFollow) {
      // Unfollow
      await followModel.deleteOne({ follower, following: artistId });
      action = 'unfollowed';
      isFollowing = false;
    } else {
      // Follow
      await followModel.create({
        follower,
        following: artistId
      });
      action = 'followed';
      isFollowing = true;

      // Send notification to artist
      try {
        await createNotification({
          user: artistId,
          title: 'متابع جديد',
          message: `${req.user.displayName} بدأ بمتابعتك`,
          type: 'follow',
          sender: follower,
          data: {
            followerId: follower.toString(),
            followerName: req.user.displayName
          }
        });
      } catch (notificationError) {
        console.error('Failed to send follow notification:', notificationError);
      }
    }

    const message = action === 'followed' ? 'تمت المتابعة بنجاح' : 'تم إلغاء المتابعة بنجاح';
    
    res.success({
      action,
      isFollowing,
      artist: {
        _id: artist._id,
        displayName: artist.displayName,
        profileImage: artist.profileImage?.url
      }
    }, message);
  } catch (error) {
    console.error('Toggle follow error:', error);
    next(new Error('حدث خطأ أثناء تغيير حالة المتابعة', { cause: 500 }));
  }
});

/**
 * Get user followers
 */
export const getFollowers = asyncHandler(async (req, res, next) => {
  try {
    await ensureConnection();
    
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get followers with user details
    const [followers, totalCount] = await Promise.all([
      followModel
        .find({ following: userId })
        .populate('follower', 'displayName profileImage job bio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      followModel.countDocuments({ following: userId })
    ]);

    const formattedFollowers = followers.map(follow => ({
      _id: follow.follower._id,
      displayName: follow.follower.displayName,
      profileImage: follow.follower.profileImage?.url,
      job: follow.follower.job,
      bio: follow.follower.bio,
      followedAt: follow.createdAt
    }));

    const response = {
      followers: formattedFollowers,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + followers.length < totalCount
      }
    };

    res.success(response, 'تم جلب المتابعين بنجاح');
  } catch (error) {
    console.error('Get followers error:', error);
    next(new Error('حدث خطأ أثناء جلب المتابعين', { cause: 500 }));
  }
});

/**
 * Get user following
 */
export const getFollowing = asyncHandler(async (req, res, next) => {
  try {
    await ensureConnection();
    
    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get following with artist details
    const [following, totalCount] = await Promise.all([
      followModel
        .find({ follower: userId })
        .populate('following', 'displayName profileImage job bio')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      followModel.countDocuments({ follower: userId })
    ]);

    const formattedFollowing = following.map(follow => ({
      _id: follow.following._id,
      displayName: follow.following.displayName,
      profileImage: follow.following.profileImage?.url,
      job: follow.following.job,
      bio: follow.following.bio,
      followedAt: follow.createdAt
    }));

    const response = {
      following: formattedFollowing,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        hasNextPage: skip + following.length < totalCount
      }
    };

    res.success(response, 'تم جلب المتابَعين بنجاح');
  } catch (error) {
    console.error('Get following error:', error);
    next(new Error('حدث خطأ أثناء جلب المتابَعين', { cause: 500 }));
  }
});

/**
 * Check if user is following artist
 */
export const checkFollowStatus = asyncHandler(async (req, res, next) => {
  try {
    await ensureConnection();
    
    const follower = req.user._id;
    const { artistId } = req.params;

    const isFollowing = await followModel.findOne({
      follower,
      following: artistId
    }).lean();

    res.success({
      isFollowing: !!isFollowing,
      artistId
    }, 'تم التحقق من حالة المتابعة');
  } catch (error) {
    console.error('Check follow status error:', error);
    next(new Error('حدث خطأ أثناء التحقق من حالة المتابعة', { cause: 500 }));
  }
});

/**
 * Get user follow stats
 */
export const getFollowStats = asyncHandler(async (req, res, next) => {
  try {
    await ensureConnection();
    
    const { userId } = req.params;

    const [followersCount, followingCount] = await Promise.all([
      followModel.countDocuments({ following: userId }),
      followModel.countDocuments({ follower: userId })
    ]);

    res.success({
      followersCount,
      followingCount
    }, 'تم جلب إحصائيات المتابعة بنجاح');
  } catch (error) {
    console.error('Get follow stats error:', error);
    next(new Error('حدث خطأ أثناء جلب إحصائيات المتابعة', { cause: 500 }));
  }
});
