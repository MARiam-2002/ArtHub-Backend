import { asyncHandler } from '../../utils/asyncHandler.js';
import userModel from '../../../DB/models/user.model.js';
import transactionModel from '../../../DB/models/transaction.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import notificationModel from '../../../DB/models/notification.model.js';
import reportModel from '../../../DB/models/report.model.js';
import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import { ApiFeatures } from '../../utils/apiFeatures.js';
import mongoose from 'mongoose';

/**
 * @desc    Get dashboard main statistics
 * @route   GET /api/v1/dashboard/statistics
 * @access  Private (Admin)
 */
export const getDashboardStatistics = asyncHandler(async (req, res, next) => {
  // احصائيات المستخدمين
  const totalUsers = await userModel.countDocuments({ isDeleted: false });
  const activeUsers = await userModel.countDocuments({ 
    status: 'active', 
    isDeleted: false 
  });
  const totalArtists = await userModel.countDocuments({ 
    role: 'artist', 
    isDeleted: false 
  });
  const activeArtists = await userModel.countDocuments({ 
    role: 'artist', 
    status: 'active', 
    isDeleted: false 
  });

  // احصائيات الإيرادات
  const totalRevenueResult = await transactionModel.aggregate([
    { $match: { status: 'completed' } },
    { $group: { _id: null, totalRevenue: { $sum: '$pricing.totalAmount' } } },
  ]);
  const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].totalRevenue : 0;

  // احصائيات الأعمال الفنية
  const totalArtworks = await artworkModel.countDocuments();
  const availableArtworks = await artworkModel.countDocuments({ status: 'available' });
  const soldArtworks = await artworkModel.countDocuments({ status: 'sold' });

  // احصائيات الطلبات
  const totalOrders = await transactionModel.countDocuments();
  const pendingOrders = await transactionModel.countDocuments({ status: 'pending' });
  const completedOrders = await transactionModel.countDocuments({ status: 'completed' });

  // احصائيات التقييمات
  const totalReviews = await reviewModel.countDocuments();
  const pendingReviews = await reviewModel.countDocuments({ status: 'pending' });
  const averageRatingResult = await reviewModel.aggregate([
    { $group: { _id: null, averageRating: { $avg: '$rating' } } },
  ]);
  const averageRating = averageRatingResult.length > 0 ? 
    Math.round(averageRatingResult[0].averageRating * 10) / 10 : 0;

  // احصائيات التقارير
  const totalReports = await reportModel.countDocuments();
  const pendingReports = await reportModel.countDocuments({ status: 'pending' });

  // احصائيات الطلبات الخاصة
  const totalSpecialRequests = await specialRequestModel.countDocuments();
  const pendingSpecialRequests = await specialRequestModel.countDocuments({ 
    status: 'pending' 
  });

  res.status(200).json({
    success: true,
    message: 'Dashboard statistics fetched successfully.',
    data: {
      users: {
        total: totalUsers,
        active: activeUsers,
        artists: totalArtists,
        activeArtists: activeArtists
      },
      revenue: {
        total: totalRevenue,
        currency: 'SAR'
      },
      artworks: {
        total: totalArtworks,
        available: availableArtworks,
        sold: soldArtworks
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        completed: completedOrders
      },
      reviews: {
        total: totalReviews,
        pending: pendingReviews,
        averageRating: averageRating
      },
      reports: {
        total: totalReports,
        pending: pendingReports
      },
      specialRequests: {
        total: totalSpecialRequests,
        pending: pendingSpecialRequests
      }
    },
  });
});

/**
 * @desc    Get dashboard charts data (orders and revenue statistics)
 * @route   GET /api/v1/dashboard/charts
 * @access  Private (Admin)
 */
export const getDashboardCharts = asyncHandler(async (req, res, next) => {
  const { period = 'monthly' } = req.query;
  
  let groupBy, dateFormat;
  let startDate = new Date();
  
  switch (period) {
    case 'daily':
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
      dateFormat = '%Y-%m-%d';
      startDate.setDate(startDate.getDate() - 30);
      break;
    case 'weekly':
      groupBy = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
      dateFormat = '%Y-W%U';
      startDate.setDate(startDate.getDate() - 84);
      break;
    case 'yearly':
      groupBy = {
        year: { $year: '$createdAt' }
      };
      dateFormat = '%Y';
      startDate.setFullYear(startDate.getFullYear() - 3);
      break;
    default: // monthly
      groupBy = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
      dateFormat = '%Y-%m';
      startDate.setMonth(startDate.getMonth() - 12);
  }

  // احصائيات الطلبات
  const ordersData = await transactionModel.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: groupBy,
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // احصائيات الإيرادات
  const revenueData = await transactionModel.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startDate },
        status: 'completed'
      } 
    },
    {
      $group: {
        _id: groupBy,
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageOrderValue: { $avg: '$pricing.totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  // احصائيات المستخدمين الجدد
  const newUsersData = await userModel.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: groupBy,
        newUsers: { $sum: 1 },
        newArtists: {
          $sum: { $cond: [{ $eq: ['$role', 'artist'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  res.status(200).json({
    success: true,
    message: 'Dashboard charts data fetched successfully.',
    data: {
      period,
      orders: ordersData,
      revenue: revenueData,
      newUsers: newUsersData
    }
  });
});

/**
 * @desc    Get all users with pagination and filtering
 * @route   GET /api/v1/dashboard/users
 * @access  Private (Admin)
 */
export const getUsers = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, role, status, search } = req.query;
  
  let query = { isDeleted: false };
  
  if (role) query.role = role;
  if (status) query.status = status;
  if (search) {
    query.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  const users = await userModel
    .find(query)
    .select('-password -fcmTokens')
    .populate('profileImage')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalUsers = await userModel.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Users fetched successfully.',
    data: {
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1
      }
    }
  });
});

/**
 * @desc    Get user details by ID
 * @route   GET /api/v1/dashboard/users/:id
 * @access  Private (Admin)
 */
export const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const user = await userModel
    .findById(id)
    .select('-password -fcmTokens')
    .populate('profileImage');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  // احصائيات المستخدم
  const userStats = {};
  
  if (user.role === 'artist') {
    userStats.artworks = await artworkModel.countDocuments({ artist: id });
    userStats.sales = await transactionModel.countDocuments({
      seller: id,
      status: 'completed'
    });
    userStats.totalEarnings = await transactionModel.aggregate([
      { $match: { seller: new mongoose.Types.ObjectId(id), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]);
    userStats.totalEarnings = userStats.totalEarnings.length > 0 ? 
      userStats.totalEarnings[0].total : 0;
  } else {
    userStats.purchases = await transactionModel.countDocuments({
      buyer: id,
      status: 'completed'
    });
    userStats.totalSpent = await transactionModel.aggregate([
      { $match: { buyer: new mongoose.Types.ObjectId(id), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$pricing.totalAmount' } } }
    ]);
    userStats.totalSpent = userStats.totalSpent.length > 0 ? 
      userStats.totalSpent[0].total : 0;
  }

  userStats.reviews = await reviewModel.countDocuments({ user: id });
  userStats.reports = await reportModel.countDocuments({ reporter: id });

  res.status(200).json({
    success: true,
    message: 'User details fetched successfully.',
    data: {
      user,
      stats: userStats
    }
  });
});

/**
 * @desc    Update user status
 * @route   PATCH /api/v1/dashboard/users/:id/status
 * @access  Private (Admin)
 */
export const updateUserStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['active', 'inactive', 'banned'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be active, inactive, or banned.'
    });
  }

  const user = await userModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).select('-password -fcmTokens');

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'User status updated successfully.',
    data: { user }
  });
});

/**
 * @desc    Get all transactions/orders
 * @route   GET /api/v1/dashboard/orders
 * @access  Private (Admin)
 */
export const getOrders = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status, search } = req.query;
  
  let query = {};
  
  if (status) query.status = status;
  if (search) {
    query.transactionNumber = { $regex: search, $options: 'i' };
  }

  const orders = await transactionModel
    .find(query)
    .populate('buyer', 'displayName email')
    .populate('seller', 'displayName email')
    .populate('items.artwork', 'title image')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalOrders = await transactionModel.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Orders fetched successfully.',
    data: {
      orders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNextPage: page < Math.ceil(totalOrders / limit),
        hasPrevPage: page > 1
      }
    }
  });
});

/**
 * @desc    Get order details by ID
 * @route   GET /api/v1/dashboard/orders/:id
 * @access  Private (Admin)
 */
export const getOrderById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const order = await transactionModel
    .findById(id)
    .populate('buyer', 'displayName email profileImage')
    .populate('seller', 'displayName email profileImage')
    .populate('items.artwork', 'title image description price');

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'Order not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Order details fetched successfully.',
    data: { order }
  });
});

/**
 * @desc    Get all reviews with filtering
 * @route   GET /api/v1/dashboard/reviews
 * @access  Private (Admin)
 */
export const getReviews = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, status, rating } = req.query;
  
  let query = {};
  
  if (status) query.status = status;
  if (rating) query.rating = parseInt(rating);

  const reviews = await reviewModel
    .find(query)
    .populate('user', 'displayName email profileImage')
    .populate('artist', 'displayName email')
    .populate('artwork', 'title image')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

  const totalReviews = await reviewModel.countDocuments(query);

  res.status(200).json({
    success: true,
    message: 'Reviews fetched successfully.',
    data: {
      reviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / limit),
        totalReviews,
        hasNextPage: page < Math.ceil(totalReviews / limit),
        hasPrevPage: page > 1
      }
    }
  });
});

/**
 * @desc    Update review status
 * @route   PATCH /api/v1/dashboard/reviews/:id/status
 * @access  Private (Admin)
 */
export const updateReviewStatus = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid status. Must be pending, approved, or rejected.'
    });
  }

  const review = await reviewModel.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).populate('user', 'displayName email')
   .populate('artwork', 'title');

  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'Review not found.'
    });
  }

  res.status(200).json({
    success: true,
    message: 'Review status updated successfully.',
    data: { review }
  });
});

/**
 * @desc    Send notification to user or all users
 * @route   POST /api/v1/dashboard/notifications
 * @access  Private (Admin)
 */
export const sendNotification = asyncHandler(async (req, res, next) => {
  const { 
    title, 
    message, 
    type = 'system', 
    userId, 
    sendToAll = false 
  } = req.body;

  const notificationData = {
    title: { ar: title },
    message: { ar: message },
    type
  };

  if (sendToAll) {
    // إرسال إلى جميع المستخدمين
    const users = await userModel.find({ 
      status: 'active', 
      isDeleted: false 
    }).select('_id');
    
    const notifications = users.map(user => ({
      ...notificationData,
      user: user._id
    }));

    await notificationModel.insertMany(notifications);

    res.status(200).json({
      success: true,
      message: `Notification sent to ${users.length} users successfully.`,
      data: { sentCount: users.length }
    });
  } else if (userId) {
    // إرسال إلى مستخدم محدد
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const notification = await notificationModel.create({
      ...notificationData,
      user: userId
    });

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully.',
      data: { notification }
    });
  } else {
    return res.status(400).json({
      success: false,
      message: 'Either userId or sendToAll must be provided.'
    });
  }
});

/**
 * @desc    Get top performing artists
 * @route   GET /api/v1/dashboard/artists/top
 * @access  Private (Admin)
 */
export const getTopArtists = asyncHandler(async (req, res, next) => {
  const { limit = 10 } = req.query;

  const topArtists = await transactionModel.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id: '$seller',
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageRating: { $avg: '$rating' }
      }
    },
    { $sort: { totalRevenue: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'artist'
      }
    },
    { $unwind: '$artist' },
    {
      $project: {
        _id: 1,
        totalSales: 1,
        totalRevenue: 1,
        averageRating: 1,
        'artist.displayName': 1,
        'artist.email': 1,
        'artist.profileImage': 1
      }
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'Top artists fetched successfully.',
    data: { artists: topArtists }
  });
});

/**
 * @desc    Get recent activities
 * @route   GET /api/v1/dashboard/activities
 * @access  Private (Admin)
 */
export const getRecentActivities = asyncHandler(async (req, res, next) => {
  const { limit = 20 } = req.query;

  // أحدث الطلبات
  const recentOrders = await transactionModel
    .find()
    .populate('buyer', 'displayName')
    .populate('seller', 'displayName')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('transactionNumber status pricing.totalAmount createdAt');

  // أحدث المستخدمين
  const recentUsers = await userModel
    .find({ isDeleted: false })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('displayName email role createdAt');

  // أحدث التقييمات
  const recentReviews = await reviewModel
    .find()
    .populate('user', 'displayName')
    .populate('artwork', 'title')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('rating comment status createdAt');

  // أحدث التقارير
  const recentReports = await reportModel
    .find()
    .populate('reporter', 'displayName')
    .sort({ createdAt: -1 })
    .limit(5)
    .select('reason status contentType createdAt');

  res.status(200).json({
    success: true,
    message: 'Recent activities fetched successfully.',
    data: {
      orders: recentOrders,
      users: recentUsers,
      reviews: recentReviews,
      reports: recentReports
    }
  });
}); 