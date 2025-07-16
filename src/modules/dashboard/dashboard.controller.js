import { asyncHandler } from '../../utils/asyncHandler.js';
import userModel from '../../../DB/models/user.model.js';
import transactionModel from '../../../DB/models/transaction.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import mongoose from 'mongoose';

/**
 * @desc    الإحصائيات الرئيسية للوحة التحكم
 * @route   GET /api/dashboard/statistics
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
  const rejectedOrders = await transactionModel.countDocuments({ status: 'cancelled' });

  res.status(200).json({
    success: true,
    message: 'تم جلب الإحصائيات بنجاح',
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
        completed: completedOrders,
        rejected: rejectedOrders
      }
    },
  });
});

/**
 * @desc    بيانات الرسوم البيانية
 * @route   GET /api/dashboard/charts
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

  // تنسيق البيانات للرسوم البيانية
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // تحضير بيانات الإيرادات
  const revenueLabels = [];
  const revenueValues = [];
  let yearlyTotal = 0;
  let monthlyTotal = 0;
  let weeklyTotal = 0;

  revenueData.forEach(item => {
    if (period === 'monthly') {
      const monthIndex = item._id.month - 1;
      revenueLabels.push(months[monthIndex]);
      revenueValues.push(item.totalRevenue);
      yearlyTotal += item.totalRevenue;
      if (item._id.year === new Date().getFullYear()) {
        monthlyTotal += item.totalRevenue;
      }
    } else if (period === 'yearly') {
      revenueLabels.push(item._id.year.toString());
      revenueValues.push(item.totalRevenue);
      yearlyTotal += item.totalRevenue;
    }
  });

  // تحضير بيانات الطلبات
  const orderLabels = [];
  const orderValues = [];
  let pendingTotal = 0;
  let completedTotal = 0;
  let rejectedTotal = 0;

  ordersData.forEach(item => {
    if (period === 'monthly') {
      const monthIndex = item._id.month - 1;
      orderLabels.push(months[monthIndex]);
      orderValues.push(item.totalOrders);
      pendingTotal += item.pendingOrders;
      completedTotal += item.completedOrders;
      rejectedTotal += item.cancelledOrders;
    } else if (period === 'yearly') {
      orderLabels.push(item._id.year.toString());
      orderValues.push(item.totalOrders);
      pendingTotal += item.pendingOrders;
      completedTotal += item.completedOrders;
      rejectedTotal += item.cancelledOrders;
    }
  });

  // حساب الإحصائيات الأسبوعية والشهرية
  if (period === 'monthly') {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthData = revenueData.find(item => 
      item._id.year === currentYear && item._id.month === currentMonth + 1
    );
    
    if (currentMonthData) {
      monthlyTotal = currentMonthData.totalRevenue;
    }

    // حساب الأسبوع الحالي
    const currentWeek = Math.ceil(new Date().getDate() / 7);
    const currentWeekData = revenueData.find(item => 
      item._id.year === currentYear && 
      Math.ceil(item._id.day / 7) === currentWeek
    );
    
    if (currentWeekData) {
      weeklyTotal = currentWeekData.totalRevenue;
    }
  }

  res.status(200).json({
    success: true,
    message: 'تم جلب بيانات الرسوم البيانية بنجاح',
    data: {
      revenue: {
        labels: revenueLabels,
        data: revenueValues,
        summary: {
          yearly: yearlyTotal,
          monthly: monthlyTotal,
          weekly: weeklyTotal
        }
      },
      orders: {
        labels: orderLabels,
        data: orderValues,
        summary: {
          pending: pendingTotal,
          completed: completedTotal,
          rejected: rejectedTotal
        }
      }
    }
  });
});

/**
 * @desc    أفضل الفنانين أداءً
 * @route   GET /api/dashboard/artists/performance
 * @access  Private (Admin)
 */
export const getArtistsPerformance = asyncHandler(async (req, res, next) => {
  const { limit = 3, period = 'monthly' } = req.query;
  
  let startDate = new Date();
  
  switch (period) {
    case 'weekly':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'yearly':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default: // monthly
      startDate.setMonth(startDate.getMonth() - 1);
  }

  // جلب أفضل الفنانين أداءً
  const topArtists = await userModel.aggregate([
    { 
      $match: { 
        role: 'artist',
        isActive: true,
        isDeleted: false
      } 
    },
    // جلب أعمال الفنان
    {
      $lookup: {
        from: 'artworks',
        localField: '_id',
        foreignField: 'artist',
        as: 'artworks'
      }
    },
    // جلب تقييمات الفنان
    {
      $lookup: {
        from: 'reviews',
        localField: '_id',
        foreignField: 'artist',
        as: 'reviews'
      }
    },
    // جلب مبيعات الفنان
    {
      $lookup: {
        from: 'transactions',
        let: { artistId: '$_id' },
        pipeline: [
          {
            $lookup: {
              from: 'artworks',
              localField: 'artwork',
              foreignField: '_id',
              as: 'artworkData'
            }
          },
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: [{ $arrayElemAt: ['$artworkData.artist', 0] }, '$$artistId'] },
                  { $eq: ['$status', 'completed'] },
                  { $gte: ['$createdAt', startDate] }
                ]
              }
            }
          }
        ],
        as: 'sales'
      }
    },
    {
      $addFields: {
        artworksCount: { $size: '$artworks' },
        averageRating: { 
          $ifNull: [
            { $avg: '$reviews.rating' }, 
            0
          ] 
        },
        totalSales: { 
          $sum: '$sales.pricing.totalAmount' 
        },
        salesCount: { $size: '$sales' }
      }
    },
    {
      $match: {
        $or: [
          { artworksCount: { $gt: 0 } },
          { totalSales: { $gt: 0 } },
          { averageRating: { $gt: 0 } }
        ]
      }
    },
    {
      $sort: { 
        totalSales: -1, 
        averageRating: -1, 
        artworksCount: -1 
      }
    },
    {
      $limit: parseInt(limit)
    },
    {
      $project: {
        _id: 1,
        displayName: 1,
        profileImage: 1,
        job: 1,
        performance: {
          sales: '$totalSales',
          rating: { $round: ['$averageRating', 1] },
          artworks: '$artworksCount'
        }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'تم جلب بيانات الفنانين بنجاح',
    data: topArtists
  });
}); 