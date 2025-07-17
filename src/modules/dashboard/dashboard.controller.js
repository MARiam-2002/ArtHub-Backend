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

  // حساب النسب المئوية مقارنة بالشهر الماضي
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const thisMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);

  // إحصائيات الشهر الحالي
  const currentMonthUsers = await userModel.countDocuments({
    createdAt: { $gte: thisMonth },
    isDeleted: false
  });

  const currentMonthArtists = await userModel.countDocuments({
    createdAt: { $gte: thisMonth },
    role: 'artist',
    isDeleted: false
  });

  const currentMonthRevenue = await transactionModel.aggregate([
    { 
      $match: { 
        status: 'completed',
        createdAt: { $gte: thisMonth }
      } 
    },
    { $group: { _id: null, totalRevenue: { $sum: '$pricing.totalAmount' } } },
  ]);

  // إحصائيات الشهر الماضي
  const lastMonthUsers = await userModel.countDocuments({
    createdAt: { $gte: lastMonth, $lt: thisMonth },
    isDeleted: false
  });

  const lastMonthArtists = await userModel.countDocuments({
    createdAt: { $gte: lastMonth, $lt: thisMonth },
    role: 'artist',
    isDeleted: false
  });

  const lastMonthRevenue = await transactionModel.aggregate([
    { 
      $match: { 
        status: 'completed',
        createdAt: { $gte: lastMonth, $lt: thisMonth }
      } 
    },
    { $group: { _id: null, totalRevenue: { $sum: '$pricing.totalAmount' } } },
  ]);

  // حساب النسب المئوية
  const usersPercentageChange = lastMonthUsers > 0 
    ? Math.round(((currentMonthUsers - lastMonthUsers) / lastMonthUsers) * 100)
    : 12; // قيمة افتراضية إذا لم تكن هناك بيانات سابقة

  const artistsPercentageChange = lastMonthArtists > 0
    ? Math.round(((currentMonthArtists - lastMonthArtists) / lastMonthArtists) * 100)
    : 8; // قيمة افتراضية إذا لم تكن هناك بيانات سابقة

  const currentRevenue = currentMonthRevenue.length > 0 ? currentMonthRevenue[0].totalRevenue : 0;
  const previousRevenue = lastMonthRevenue.length > 0 ? lastMonthRevenue[0].totalRevenue : 0;
  
  const revenuePercentageChange = previousRevenue > 0
    ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
    : -2.5; // قيمة افتراضية إذا لم تكن هناك بيانات سابقة

  res.status(200).json({
    success: true,
    message: 'تم جلب الإحصائيات بنجاح',
    data: {
      totalUsers: {
        value: totalUsers,
        percentageChange: usersPercentageChange,
        isPositive: usersPercentageChange >= 0
      },
      activeArtists: {
        value: activeArtists,
        percentageChange: artistsPercentageChange,
        isPositive: artistsPercentageChange >= 0
      },
      totalRevenue: {
        value: totalRevenue,
        percentageChange: revenuePercentageChange,
        isPositive: revenuePercentageChange >= 0,
        currency: 'SAR'
      }
    }
  });
});

/**
 * @desc    بيانات الرسوم البيانية
 * @route   GET /api/dashboard/charts
 * @access  Private (Admin)
 */
export const getDashboardCharts = asyncHandler(async (req, res, next) => {
  const { period = 'last_12_months' } = req.query;
  
  let startDate = new Date();
  
  // تحديد الفترة الزمنية
  switch (period) {
    case 'last_month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'last_3_months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'last_6_months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case 'last_9_months':
      startDate.setMonth(startDate.getMonth() - 9);
      break;
    case 'last_12_months':
    default:
      startDate.setMonth(startDate.getMonth() - 12);
      break;
  }

  // احصائيات الطلبات
  const ordersData = await transactionModel.aggregate([
    { $match: { createdAt: { $gte: startDate } } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalOrders: { $sum: 1 },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        rejectedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
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
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageOrderValue: { $avg: '$pricing.totalAmount' },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // تنسيق البيانات للرسوم البيانية
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // تحضير بيانات الطلبات
  const orderLabels = [];
  const orderValues = [];
  let pendingTotal = 0;
  let completedTotal = 0;
  let rejectedTotal = 0;

  ordersData.forEach(item => {
    const monthIndex = item._id.month - 1;
    orderLabels.push(months[monthIndex]);
    orderValues.push(item.totalOrders);
    pendingTotal += item.pendingOrders;
    completedTotal += item.completedOrders;
    rejectedTotal += item.rejectedOrders;
  });

  // تحضير بيانات الإيرادات
  const revenueLabels = [];
  const revenueValues = [];
  let yearlyTotal = 0;
  let monthlyTotal = 0;
  let weeklyTotal = 0;

  revenueData.forEach(item => {
    const monthIndex = item._id.month - 1;
    revenueLabels.push(months[monthIndex]);
    revenueValues.push(item.totalRevenue);
    yearlyTotal += item.totalRevenue;
    
    // حساب الإيرادات الشهرية والأسبوعية
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    
    if (item._id.year === currentYear) {
      if (item._id.month === currentMonth + 1) {
        monthlyTotal = item.totalRevenue;
      }
      // حساب الأسبوع الحالي (تقريبي)
      if (item._id.month === currentMonth + 1) {
        weeklyTotal = Math.round(item.totalRevenue / 4); // تقريب للأسبوع
      }
    }
  });

  // إذا لم تكن هناك بيانات للشهر الحالي، استخدم آخر قيمة
  if (monthlyTotal === 0 && revenueValues.length > 0) {
    monthlyTotal = revenueValues[revenueValues.length - 1];
  }

  res.status(200).json({
    success: true,
    message: 'تم جلب بيانات الرسوم البيانية بنجاح',
    data: {
      orders: {
        labels: orderLabels,
        data: orderValues,
        summary: {
          pending: pendingTotal,
          completed: completedTotal,
          rejected: rejectedTotal
        }
      },
      revenue: {
        labels: revenueLabels,
        data: revenueValues,
        summary: {
          yearly: yearlyTotal,
          monthly: monthlyTotal,
          weekly: weeklyTotal
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
  const { limit = 3, period = 'last_month' } = req.query;
  
  let startDate = new Date();
  
  switch (period) {
    case 'last_week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case 'last_month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case 'last_3_months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case 'last_6_months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case 'last_year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
      break;
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