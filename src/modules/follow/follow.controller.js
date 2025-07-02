import followModel from '../../../DB/models/follow.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendFollowNotification } from '../../utils/pushNotifications.js';
import { getPaginationParams } from '../../utils/pagination.js';

/**
 * Follow an artist
 * @desc Create a follow relationship between user and artist
 * @route POST /api/follow/follow
 * @access Private
 */
export const followArtist = asyncHandler(async (req, res) => {
  const follower = req.user._id;
  const { artistId } = req.body;

  // Check if user is trying to follow themselves
  if (follower.toString() === artistId) {
    return res.fail(null, 'لا يمكنك متابعة نفسك', 400);
  }

  // Check if artist exists and is active
  const artist = await userModel.findById(artistId).select('displayName userName isActive');
  if (!artist) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  if (!artist.isActive) {
    return res.fail(null, 'حساب الفنان غير نشط', 400);
  }

  // Check if already following
  const existingFollow = await followModel.findOne({ 
    follower, 
    following: artistId 
  });

  if (existingFollow) {
    return res.fail(null, 'أنت تتابع هذا الفنان بالفعل', 409);
  }

  // Create follow relationship
  const followRecord = await followModel.create({ 
    follower, 
    following: artistId 
  });

  // Send notification to artist (don't wait for it)
  sendFollowNotification(
    artistId,
    follower.toString(),
    req.user.displayName || req.user.userName
  ).catch(error => {
    console.error('Failed to send follow notification:', error);
  });

  res.success(
    {
      _id: followRecord._id,
      artistId,
      artistName: artist.displayName || artist.userName,
      followedAt: followRecord.createdAt
    },
    'تمت المتابعة بنجاح',
    201
  );
});

/**
 * Unfollow an artist
 * @desc Remove follow relationship between user and artist
 * @route POST /api/follow/unfollow
 * @access Private
 */
export const unfollowArtist = asyncHandler(async (req, res) => {
  const follower = req.user._id;
  const { artistId } = req.body;

  // Check if follow relationship exists
  const followRelation = await followModel.findOne({
    follower,
    following: artistId
  });

  if (!followRelation) {
    return res.fail(null, 'أنت لا تتابع هذا الفنان', 400);
  }

  // Remove follow relationship
  await followModel.deleteOne({ follower, following: artistId });

  res.success(null, 'تم إلغاء المتابعة بنجاح');
});

/**
 * Toggle follow status (follow/unfollow)
 * @desc Toggle follow relationship between user and artist
 * @route POST /api/follow/toggle
 * @access Private
 */
export const toggleFollow = asyncHandler(async (req, res) => {
  const follower = req.user._id;
  const { artistId } = req.body;

  // Check if user is trying to follow themselves
  if (follower.toString() === artistId) {
    return res.fail(null, 'لا يمكنك متابعة نفسك', 400);
  }

  // Check if artist exists
  const artist = await userModel.findById(artistId).select('displayName userName isActive');
  if (!artist) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  if (!artist.isActive) {
    return res.fail(null, 'حساب الفنان غير نشط', 400);
  }

  // Check current follow status
  const existingFollow = await followModel.findOne({
    follower,
    following: artistId
  });

  let action;
  let followRecord = null;

  if (existingFollow) {
    // Unfollow
    await followModel.deleteOne({ follower, following: artistId });
    action = 'unfollowed';
  } else {
    // Follow
    followRecord = await followModel.create({
      follower,
      following: artistId
    });
    action = 'followed';

    // Send notification (don't wait)
    sendFollowNotification(
      artistId,
      follower.toString(),
      req.user.displayName || req.user.userName
    ).catch(error => {
      console.error('Failed to send follow notification:', error);
    });
  }

  const responseData = {
    action,
    artistId,
    artistName: artist.displayName || artist.userName,
    isFollowing: action === 'followed'
  };

  if (followRecord) {
    responseData.followedAt = followRecord.createdAt;
  }

  const message = action === 'followed' ? 'تمت المتابعة بنجاح' : 'تم إلغاء المتابعة بنجاح';
  res.success(responseData, message);
});

/**
 * Get artist followers
 * @desc Get paginated list of artist followers
 * @route GET /api/follow/followers/:artistId
 * @access Public
 */
export const getFollowers = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Check if artist exists
  const artist = await userModel.findById(artistId).select('displayName userName');
  if (!artist) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get followers with user details
  const [followers, totalCount] = await Promise.all([
    followModel
      .find({ following: artistId })
      .populate('follower', 'displayName userName profileImage job isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    followModel.countDocuments({ following: artistId })
  ]);

  // Format followers data
  const formattedFollowers = followers
    .filter(f => f.follower && f.follower.isActive !== false) // Filter out inactive users
    .map(f => ({
      _id: f.follower._id,
      displayName: f.follower.displayName || f.follower.userName,
      profileImage: f.follower.profileImage,
      job: f.follower.job,
      followedAt: f.createdAt
    }));

  // Pagination info
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  const response = {
    followers: formattedFollowers,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
      limit: parseInt(limit)
    },
    artist: {
      _id: artistId,
      name: artist.displayName || artist.userName
    }
  };

  res.success(response, 'تم جلب المتابعين بنجاح');
});

/**
 * Get user following list
 * @desc Get paginated list of artists that user is following
 * @route GET /api/follow/following/:userId
 * @access Public
 */
export const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  // Check if user exists
  const user = await userModel.findById(userId).select('displayName userName');
  if (!user) {
    return res.fail(null, 'المستخدم غير موجود', 404);
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get following with artist details
  const [following, totalCount] = await Promise.all([
    followModel
      .find({ follower: userId })
      .populate('following', 'displayName userName profileImage job isActive')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    followModel.countDocuments({ follower: userId })
  ]);

  // Format following data
  const formattedFollowing = following
    .filter(f => f.following && f.following.isActive !== false) // Filter out inactive artists
    .map(f => ({
      _id: f.following._id,
      displayName: f.following.displayName || f.following.userName,
      profileImage: f.following.profileImage,
      job: f.following.job,
      followedAt: f.createdAt
    }));

  // Pagination info
  const totalPages = Math.ceil(totalCount / parseInt(limit));

  const response = {
    following: formattedFollowing,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1,
      limit: parseInt(limit)
    },
    user: {
      _id: userId,
      name: user.displayName || user.userName
    }
  };

  res.success(response, 'تم جلب المتابَعين بنجاح');
});

/**
 * Check follow status
 * @desc Check if current user is following a specific artist
 * @route GET /api/follow/status/:artistId
 * @access Public (returns false if not authenticated)
 */
export const checkFollowStatus = asyncHandler(async (req, res) => {
  const { artistId } = req.params;

  // If user is not authenticated, return false
  if (!req.user) {
    return res.success({ isFollowing: false }, 'حالة المتابعة');
  }

  // Check if follow relationship exists
  const isFollowing = await followModel.findOne({
    follower: req.user._id,
    following: artistId
  });

  res.success(
    { 
      isFollowing: !!isFollowing,
      artistId 
    }, 
    'تم التحقق من حالة المتابعة'
  );
});

/**
 * Get follow statistics for an artist
 * @desc Get follower count and following count for an artist
 * @route GET /api/follow/stats/:artistId
 * @access Public
 */
export const getFollowStats = asyncHandler(async (req, res) => {
  const { artistId } = req.params;

  // Check if artist exists
  const artist = await userModel.findById(artistId).select('displayName userName');
  if (!artist) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  // Get counts
  const [followersCount, followingCount] = await Promise.all([
    followModel.countDocuments({ following: artistId }),
    followModel.countDocuments({ follower: artistId })
  ]);

  const stats = {
    artistId,
    artistName: artist.displayName || artist.userName,
    followersCount,
    followingCount
  };

  res.success(stats, 'تم جلب إحصائيات المتابعة بنجاح');
});

/**
 * Get follow status between authenticated user and target user
 */
export const getFollowStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const followerId = req.user._id;

  // Check if following
  const followRelation = await followModel.findOne({
    follower: followerId,
    following: userId
  });

  res.success({
    isFollowing: !!followRelation,
    followedAt: followRelation?.createdAt || null
  }, 'تم التحقق من حالة المتابعة بنجاح');
});

/**
 * Get my followers
 */
export const getMyFollowers = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, search } = req.query;

  // Build search query
  let searchQuery = {};
  if (search) {
    searchQuery = {
      $or: [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get followers with user details
  const followers = await followModel
    .find({ following: userId })
    .populate({
      path: 'follower',
      select: 'displayName email profileImage bio isActive',
      match: { isActive: true, ...searchQuery }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Filter out null followers (inactive users)
  const activeFollowers = followers.filter(f => f.follower).map(f => ({
    ...f.follower,
    followedAt: f.createdAt
  }));

  // Get total count
  const totalCount = await followModel.countDocuments({ following: userId });

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.success({
    followers: activeFollowers,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  }, 'تم جلب قائمة المتابعين بنجاح');
});

/**
 * Get my following
 */
export const getMyFollowing = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, search } = req.query;

  // Build search query
  let searchQuery = {};
  if (search) {
    searchQuery = {
      $or: [
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get following with user details
  const following = await followModel
    .find({ follower: userId })
    .populate({
      path: 'following',
      select: 'displayName email profileImage bio isActive',
      match: { isActive: true, ...searchQuery }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // Filter out null following (inactive users)
  const activeFollowing = following.filter(f => f.following).map(f => ({
    ...f.following,
    followedAt: f.createdAt
  }));

  // Get total count
  const totalCount = await followModel.countDocuments({ follower: userId });

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.success({
    following: activeFollowing,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  }, 'تم جلب قائمة المتابَعين بنجاح');
});
