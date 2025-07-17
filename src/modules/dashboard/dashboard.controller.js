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
  const { period = '12months' } = req.query;
  
  let startDate = new Date();
  let endDate = new Date();
  
  // تحديد الفترة الزمنية
  switch (period) {
    case '1month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '9months':
      startDate.setMonth(startDate.getMonth() - 9);
      break;
    case '12months':
    default:
      startDate.setMonth(startDate.getMonth() - 12);
      break;
  }

  // 🟩 قسم الطلبات - Aggregation للطلبات
  const ordersAggregation = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      } 
    },
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
        inProgressOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        rejectedOrders: {
          $sum: { 
            $cond: [
              { $in: ['$status', ['cancelled', 'rejected']] }, 
              1, 
              0
            ] 
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ];

  // 🟦 قسم الإيرادات - Aggregation للإيرادات
  const revenueAggregation = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        orderCount: { $sum: 1 },
        averageOrderValue: { $avg: '$pricing.totalAmount' }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ];

  // حساب الإيرادات الأسبوعية والشهرية
  const weeklyMonthlyRevenue = [
    { 
      $match: { 
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          week: { $week: '$createdAt' }
        },
        revenue: { $sum: '$pricing.totalAmount' }
      }
    },
    {
      $group: {
        _id: null,
        weeklyRevenue: { $sum: '$revenue' },
        monthlyRevenue: { $sum: '$revenue' }
      }
    }
  ];

  // تنفيذ Aggregations
  const [ordersData, revenueData, weeklyMonthlyData] = await Promise.all([
    transactionModel.aggregate(ordersAggregation),
    transactionModel.aggregate(revenueAggregation),
    transactionModel.aggregate(weeklyMonthlyRevenue)
  ]);

  // تنسيق البيانات للرسوم البيانية
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  // 🟩 تحضير بيانات الطلبات من البيانات الفعلية
  const ordersChartData = [];
  
  // حساب الإحصائيات الإجمالية من البيانات الفعلية
  let pendingTotal = 0;
  let completedTotal = 0;
  let rejectedTotal = 0;
  
  // تجميع البيانات الفعلية حسب الشهر
  const ordersByMonth = {};
  
  ordersData.forEach(order => {
    const monthKey = `${order._id.year}-${order._id.month}`;
    if (!ordersByMonth[monthKey]) {
      ordersByMonth[monthKey] = {
        total: 0,
        completed: 0,
        inProgress: 0,
        rejected: 0
      };
    }
    
    ordersByMonth[monthKey].total += order.totalOrders;
    ordersByMonth[monthKey].completed += order.completedOrders;
    ordersByMonth[monthKey].inProgress += order.inProgressOrders;
    ordersByMonth[monthKey].rejected += order.rejectedOrders;
  });
  
  // حساب الإجماليات
  Object.values(ordersByMonth).forEach(monthData => {
    pendingTotal += monthData.inProgress;
    completedTotal += monthData.completed;
    rejectedTotal += monthData.rejected;
  });
  
  // تحضير بيانات الرسوم البيانية من البيانات الفعلية
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  for (let i = 11; i >= 0; i--) {
    const targetMonth = currentMonth - i;
    const targetYear = currentYear;
    
    const monthKey = `${targetYear}-${targetMonth}`;
    const monthData = ordersByMonth[monthKey] || {
      total: 0,
      completed: 0,
      inProgress: 0,
      rejected: 0
    };
    
    ordersChartData.push({
      month: months[11 - i], // ترتيب عكسي للشهور
      value: monthData.total,
      completed: monthData.completed,
      inProgress: monthData.inProgress,
      rejected: monthData.rejected
    });
  }

  // 🟦 تحضير بيانات الإيرادات من البيانات الفعلية
  const revenueChartData = [];
  
  // تجميع البيانات الفعلية حسب الشهر
  const revenueByMonth = {};
  
  revenueData.forEach(revenue => {
    const monthKey = `${revenue._id.year}-${revenue._id.month}`;
    if (!revenueByMonth[monthKey]) {
      revenueByMonth[monthKey] = {
        totalRevenue: 0,
        orderCount: 0,
        averageOrderValue: 0
      };
    }
    
    revenueByMonth[monthKey].totalRevenue += revenue.totalRevenue;
    revenueByMonth[monthKey].orderCount += revenue.orderCount;
  });
  
  // حساب متوسط قيمة الطلب لكل شهر
  Object.values(revenueByMonth).forEach(monthData => {
    monthData.averageOrderValue = monthData.orderCount > 0 
      ? monthData.totalRevenue / monthData.orderCount 
      : 0;
  });
  
  // تحضير بيانات الرسوم البيانية من البيانات الفعلية
  for (let i = 11; i >= 0; i--) {
    const targetMonth = currentMonth - i;
    const targetYear = currentYear;
    
    const monthKey = `${targetYear}-${targetMonth}`;
    const monthData = revenueByMonth[monthKey] || {
      totalRevenue: 0,
      orderCount: 0,
      averageOrderValue: 0
    };
    
    revenueChartData.push({
      month: months[11 - i], // ترتيب عكسي للشهور
      value: monthData.totalRevenue,
      orderCount: monthData.orderCount,
      averageOrderValue: Math.round(monthData.averageOrderValue)
    });
  }
  
  // حساب الإيرادات الأسبوعية والشهرية والسنوية من البيانات الفعلية
  const weeklyRevenue = weeklyMonthlyData.length > 0 ? weeklyMonthlyData[0].weeklyRevenue : 0;
  const monthlyRevenue = weeklyMonthlyData.length > 0 ? weeklyMonthlyData[0].monthlyRevenue : 0;
  const yearlyRevenue = revenueData.reduce((total, month) => total + month.totalRevenue, 0);

  res.status(200).json({
    success: true,
    message: 'تم جلب بيانات الرسوم البيانية بنجاح',
    data: {
      orders: {
        chartData: ordersChartData,
        summary: {
          inProgress: pendingTotal,
          completed: completedTotal,
          rejected: rejectedTotal
        }
      },
      revenue: {
        chartData: revenueChartData,
        summary: {
          weekly: weeklyRevenue,
          monthly: monthlyRevenue,
          yearly: yearlyRevenue
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
  const { limit = 3, period = '1month' } = req.query;
  
  let startDate = new Date();
  
  switch (period) {
    case '1week':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '1month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1year':
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