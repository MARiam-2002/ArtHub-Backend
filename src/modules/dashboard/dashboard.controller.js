import { asyncHandler } from '../../utils/asyncHandler.js';
import userModel from '../../../DB/models/user.model.js';
import transactionModel from '../../../DB/models/transaction.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import mongoose from 'mongoose';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';

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
  
  // تحديد عدد الشهور المطلوبة حسب الفترة
  let monthsToShow = 12;
  switch (period) {
    case '1month':
      monthsToShow = 1;
      break;
    case '3months':
      monthsToShow = 3;
      break;
    case '6months':
      monthsToShow = 6;
      break;
    case '9months':
      monthsToShow = 9;
      break;
    case '12months':
    default:
      monthsToShow = 12;
      break;
  }
  
  // تحضير بيانات الرسوم البيانية من البيانات الفعلية
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  for (let i = monthsToShow - 1; i >= 0; i--) {
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
      month: months[11 - (monthsToShow - 1 - i)], // ترتيب صحيح للشهور
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
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const targetMonth = currentMonth - i;
    const targetYear = currentYear;
    
    const monthKey = `${targetYear}-${targetMonth}`;
    const monthData = revenueByMonth[monthKey] || {
      totalRevenue: 0,
      orderCount: 0,
      averageOrderValue: 0
    };
    
    revenueChartData.push({
      month: months[11 - (monthsToShow - 1 - i)], // ترتيب صحيح للشهور
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
  const { limit = 3, year, month } = req.query;
  
  let startDate = new Date();
  let endDate = new Date();
  
  // تحديد الفترة الزمنية بناءً على المعاملات
  if (year && month) {
    // فلترة محددة بالسنة والشهر
    const yearNum = parseInt(year);
    const monthNum = parseInt(month) - 1; // الشهر يبدأ من 0 في JavaScript
    
    if (yearNum < 1900 || yearNum > 2100 || monthNum < 0 || monthNum > 11) {
      return res.status(400).json({
        success: false,
        message: 'السنة أو الشهر غير صحيح',
        data: null
      });
    }
    
    startDate = new Date(yearNum, monthNum, 1);
    endDate = new Date(yearNum, monthNum + 1, 0, 23, 59, 59, 999);
  } else {
    // إذا لم يتم تحديد السنة والشهر، استخدم الشهر الماضي كافتراضي
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
    // جلب أعمال الفنان في الفترة المحددة
    {
      $lookup: {
        from: 'artworks',
        let: { artistId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$artist', '$$artistId'] },
              createdAt: { $gte: startDate, $lte: endDate }
            }
          }
        ],
        as: 'artworks'
      }
    },
    // جلب تقييمات الفنان في الفترة المحددة
    {
      $lookup: {
        from: 'reviews',
        let: { artistId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ['$artist', '$$artistId'] },
              createdAt: { $gte: startDate, $lte: endDate }
            }
          }
        ],
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
                  { $gte: ['$createdAt', startDate] },
                  { $lte: ['$createdAt', endDate] }
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

  // إضافة معلومات الفترة المحددة للاستجابة
  const periodInfo = year && month 
    ? { year: parseInt(year), month: parseInt(month), type: 'specific' }
    : { type: 'default', period: 'last_month' };

  res.status(200).json({
    success: true,
    message: 'تم جلب بيانات الفنانين بنجاح',
    data: topArtists,
    periodInfo
  });
}); 

/**
 * @desc    تحليل المبيعات - إحصائيات عامة
 * @route   GET /api/dashboard/sales/analytics
 * @access  Private (Admin, SuperAdmin)
 */
export const getSalesAnalytics = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { period = '30days' } = req.query;
  
  let startDate = new Date();
  let previousPeriodStart = new Date();
  
  // تحديد الفترة الزمنية
  switch (period) {
    case '7days':
      startDate.setDate(startDate.getDate() - 7);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 14);
      break;
    case '30days':
      startDate.setDate(startDate.getDate() - 30);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 60);
      break;
    case '90days':
      startDate.setDate(startDate.getDate() - 90);
      previousPeriodStart.setDate(previousPeriodStart.getDate() - 180);
      break;
    case '1year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 2);
      break;
  }

  // استيراد نموذج الطلبات الخاصة
  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;

  // إحصائيات الفترة الحالية - الطلبات المكتملة
  const currentPeriodStats = await specialRequestModel.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startDate },
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } }
      }
    }
  ]);

  // إحصائيات الفترة السابقة للمقارنة
  const previousPeriodStats = await specialRequestModel.aggregate([
    { 
      $match: { 
        createdAt: { $gte: previousPeriodStart, $lt: startDate },
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
        totalOrders: { $sum: 1 },
        averageOrderValue: { $avg: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } }
      }
    }
  ]);

  // أفضل فنان مبيعاً
  const topSellingArtist = await specialRequestModel.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startDate },
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $group: {
        _id: '$artist',
        totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
        orderCount: { $sum: 1 },
        artistName: { $first: { $arrayElemAt: ['$artistData.displayName', 0] } },
        artistImage: { $first: { $arrayElemAt: ['$artistData.profileImage.url', 0] } }
      }
    },
    {
      $sort: { totalSales: -1 }
    },
    {
      $limit: 1
    }
  ]);

  const currentStats = currentPeriodStats[0] || { totalSales: 0, totalOrders: 0, averageOrderValue: 0 };
  const previousStats = previousPeriodStats[0] || { totalSales: 0, totalOrders: 0, averageOrderValue: 0 };

  // حساب النسب المئوية
  const salesPercentageChange = previousStats.totalSales > 0 
    ? Math.round(((currentStats.totalSales - previousStats.totalSales) / previousStats.totalSales) * 100)
    : 0;

  const ordersPercentageChange = previousStats.totalOrders > 0
    ? Math.round(((currentStats.totalOrders - previousStats.totalOrders) / previousStats.totalOrders) * 100)
    : 0;

  res.status(200).json({
    success: true,
    message: 'تم جلب تحليل المبيعات بنجاح',
    data: {
      period,
      topSellingArtist: topSellingArtist[0] ? {
        name: topSellingArtist[0].artistName,
        image: topSellingArtist[0].artistImage,
        sales: topSellingArtist[0].totalSales,
        orders: topSellingArtist[0].orderCount
      } : null,
      totalOrders: {
        value: currentStats.totalOrders,
        percentageChange: ordersPercentageChange,
        isPositive: ordersPercentageChange >= 0
      },
      totalSales: {
        value: currentStats.totalSales,
        percentageChange: salesPercentageChange,
        isPositive: salesPercentageChange >= 0
      },
      averageOrderValue: currentStats.averageOrderValue
    }
  });
});

/**
 * @desc    تتبع المبيعات - بيانات الرسم البياني
 * @route   GET /api/dashboard/sales/trends
 * @access  Private (Admin, SuperAdmin)
 */
export const getSalesTrends = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { period = '12months' } = req.query;
  
  let startDate = new Date();
  
  // تحديد الفترة الزمنية حسب الصورة
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

  // استيراد نموذج الطلبات الخاصة
  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;

  // تجميع البيانات الشهرية
  const monthlySales = await specialRequestModel.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startDate },
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
        totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
        orderCount: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  // تنسيق البيانات للرسم البياني
  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  // تحديد عدد الشهور المطلوبة حسب الفترة
  let monthsToShow = 12;
  switch (period) {
    case '1month':
      monthsToShow = 1;
      break;
    case '3months':
      monthsToShow = 3;
      break;
    case '6months':
      monthsToShow = 6;
      break;
    case '9months':
      monthsToShow = 9;
      break;
    case '12months':
    default:
      monthsToShow = 12;
      break;
  }

  // إنشاء بيانات الرسم البياني
  const chartData = [];
  const salesData = {};
  
  // تحويل البيانات إلى كائن للبحث السريع
  monthlySales.forEach(item => {
    const key = `${item._id.year}-${item._id.month}`;
    salesData[key] = {
      sales: item.totalSales,
      orders: item.orderCount
    };
  });

  // ملء البيانات للشهور المطلوبة
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - i);
    
    const year = targetDate.getFullYear();
    const month = targetDate.getMonth() + 1;
    const monthName = months[month - 1];
    
    const key = `${year}-${month}`;
    const data = salesData[key] || { sales: 0, orders: 0 };
    
    chartData.push({
      month: monthName,
      sales: data.sales,
      orders: data.orders
    });
  }

  // حساب الإحصائيات الإجمالية
  const totalSales = monthlySales.reduce((sum, item) => sum + item.totalSales, 0);
  const totalOrders = monthlySales.reduce((sum, item) => sum + item.orderCount, 0);
  const averageMonthlySales = monthlySales.length > 0 ? totalSales / monthlySales.length : 0;

  // أفضل فنان مبيعاً للفترة المحددة
  const topSellingArtist = await specialRequestModel.aggregate([
    { 
      $match: { 
        createdAt: { $gte: startDate },
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $group: {
        _id: '$artist',
        totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
        orderCount: { $sum: 1 },
        artistName: { $first: { $arrayElemAt: ['$artistData.displayName', 0] } },
        artistImage: { $first: { $arrayElemAt: ['$artistData.profileImage.url', 0] } }
      }
    },
    {
      $sort: { totalSales: -1 }
    },
    {
      $limit: 1
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'تم جلب بيانات تتبع المبيعات بنجاح',
    data: {
      period,
      chartData,
      summary: {
        totalSales,
        totalOrders,
        averageMonthlySales,
        topSellingArtist: topSellingArtist[0] ? {
          name: topSellingArtist[0].artistName,
          image: topSellingArtist[0].artistImage,
          sales: topSellingArtist[0].totalSales,
          orders: topSellingArtist[0].orderCount
        } : null
      }
    }
  });
});

/**
 * @desc    أفضل الفنانين مبيعاً
 * @route   GET /api/dashboard/sales/top-artists
 * @access  Private (Admin, SuperAdmin)
 */
export const getTopSellingArtists = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { limit = 10, page = 1 } = req.query;
  
  // استيراد نموذج الطلبات الخاصة
  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;

  const parsedLimit = parseInt(limit);
  const parsedPage = parseInt(page);
  const skip = (parsedPage - 1) * parsedLimit;

  // جلب أفضل الفنانين (جميع البيانات)
  const currentPeriodArtists = await specialRequestModel.aggregate([
    { 
      $match: { 
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $group: {
        _id: '$artist',
        totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
        orderCount: { $sum: 1 },
        artistName: { $first: { $arrayElemAt: ['$artistData.displayName', 0] } },
        artistImage: { $first: { $arrayElemAt: ['$artistData.profileImage.url', 0] } },
        artistJob: { $first: { $arrayElemAt: ['$artistData.job', 0] } },
        artistRating: { $first: { $arrayElemAt: ['$artistData.averageRating', 0] } },
        artistReviewsCount: { $first: { $arrayElemAt: ['$artistData.reviewsCount', 0] } },
        artistIsVerified: { $first: { $arrayElemAt: ['$artistData.isVerified', 0] } }
      }
    },
    {
      $sort: { totalSales: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: parsedLimit
    }
  ]);

  // حساب النمو مقارنة بالشهر السابق
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const previousMonthArtists = await specialRequestModel.aggregate([
    { 
      $match: { 
        createdAt: { $gte: lastMonth },
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $group: {
        _id: '$artist',
        previousSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
        previousOrders: { $sum: 1 }
      }
    }
  ]);

  // تحويل البيانات السابقة إلى كائن للبحث السريع
  const previousData = {};
  previousMonthArtists.forEach(artist => {
    previousData[artist._id.toString()] = {
      sales: artist.previousSales,
      orders: artist.previousOrders
    };
  });

  // حساب النمو وإضافة البيانات الإضافية
  const artistsWithGrowth = currentPeriodArtists.map(artist => {
    const previous = previousData[artist._id.toString()] || { sales: 0, orders: 0 };
    
    const salesGrowth = previous.sales > 0 
      ? Math.round(((artist.totalSales - previous.sales) / previous.sales) * 100)
      : 0;
    
    const ordersGrowth = previous.orders > 0
      ? Math.round(((artist.orderCount - previous.orders) / previous.orders) * 100)
      : 0;

    return {
      _id: artist._id,
      name: artist.artistName,
      image: artist.artistImage,
      job: artist.artistJob || 'فنان',
      rating: artist.artistRating || 0,
      reviewsCount: artist.artistReviewsCount || 0,
      isVerified: artist.artistIsVerified || false,
      sales: artist.totalSales,
      orders: artist.orderCount,
      growth: {
        sales: salesGrowth,
        orders: ordersGrowth,
        isPositive: salesGrowth >= 0
      }
    };
  });

  // حساب إجمالي عدد الفنانين للـ pagination
  const totalArtists = await specialRequestModel.aggregate([
    { 
      $match: { 
        status: 'completed',
        isDeleted: { $ne: true }
      } 
    },
    {
      $group: {
        _id: '$artist'
      }
    },
    {
      $count: 'total'
    }
  ]);

  const total = totalArtists[0]?.total || 0;

  res.status(200).json({
    success: true,
    message: 'تم جلب أفضل الفنانين مبيعاً بنجاح',
    data: {
      artists: artistsWithGrowth,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit),
        hasNext: parsedPage < Math.ceil(total / parsedLimit),
        hasPrev: parsedPage > 1
      }
    }
  });
});

/**
 * @desc    تحميل تقرير المبيعات
 * @route   GET /api/dashboard/sales/report
 * @access  Private (Admin, SuperAdmin)
 */
export const downloadSalesReport = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { period = '30days', format = 'json' } = req.query;
  
  let startDate = new Date();
  
  // تحديد الفترة الزمنية
  switch (period) {
    case '7days':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30days':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90days':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // استيراد نموذج الطلبات الخاصة
  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;

  // جلب جميع البيانات المطلوبة للتقرير
  const [salesData, topArtists, monthlyTrends] = await Promise.all([
    // إحصائيات المبيعات العامة
    specialRequestModel.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: 'completed',
          isDeleted: { $ne: true }
        } 
      },
      {
        $group: {
          _id: null,
          totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } }
        }
      }
    ]),
    
    // أفضل الفنانين
    specialRequestModel.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
          status: 'completed',
          isDeleted: { $ne: true }
        } 
      },
      {
        $lookup: {
          from: 'users',
          localField: 'artist',
          foreignField: '_id',
          as: 'artistData'
        }
      },
      {
        $group: {
          _id: '$artist',
          totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
          orderCount: { $sum: 1 },
          artistName: { $first: { $arrayElemAt: ['$artistData.displayName', 0] } }
        }
      },
      {
        $sort: { totalSales: -1 }
      },
      {
        $limit: 10
      }
    ]),
    
    // الاتجاهات الشهرية
    specialRequestModel.aggregate([
      { 
        $match: { 
          createdAt: { $gte: startDate },
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
          totalSales: { $sum: { $ifNull: ['$finalPrice', '$quotedPrice', '$budget'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);

  const summary = salesData[0] || { totalSales: 0, totalOrders: 0, averageOrderValue: 0 };

  // تنسيق البيانات للتقرير
  const reportData = {
    period,
    generatedAt: new Date().toISOString(),
    summary: {
      totalSales: summary.totalSales,
      totalOrders: summary.totalOrders,
      averageOrderValue: summary.averageOrderValue
    },
    topArtists: topArtists.map(artist => ({
      name: artist.artistName,
      sales: artist.totalSales,
      orders: artist.orderCount
    })),
    monthlyTrends: monthlyTrends.map(trend => ({
      month: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
      sales: trend.totalSales,
      orders: trend.orderCount
    }))
  };

  if (format === 'csv') {
    // تحويل البيانات إلى CSV
    const csvData = [
      ['الفترة', period],
      ['تاريخ التقرير', new Date().toISOString()],
      ['إجمالي المبيعات', summary.totalSales],
      ['إجمالي الطلبات', summary.totalOrders],
      ['متوسط قيمة الطلب', summary.averageOrderValue],
      [],
      ['أفضل الفنانين'],
      ['الاسم', 'المبيعات', 'عدد الطلبات'],
      ...topArtists.map(artist => [artist.artistName, artist.totalSales, artist.orderCount]),
      [],
      ['الاتجاهات الشهرية'],
      ['الشهر', 'المبيعات', 'عدد الطلبات'],
      ...monthlyTrends.map(trend => [
        `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}`,
        trend.totalSales,
        trend.orderCount
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${period}.csv`);
    res.send(csvContent);
  } else {
    // إرجاع البيانات بصيغة JSON
    res.status(200).json({
      success: true,
      message: 'تم إنشاء تقرير المبيعات بنجاح',
      data: reportData
    });
  }
}); 

/**
 * @desc    الإحصائيات الشاملة للوحة التحكم مع التصفية حسب السنة
 * @route   GET /api/dashboard/overview
 * @access  Private (Admin)
 */
export const getDashboardOverview = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
      const { year } = req.query;
    let selectedYear;
    
    // إذا لم يتم تحديد سنة، استخدم السنة الحالية
    if (!year) {
      selectedYear = new Date().getFullYear();
    } else {
      selectedYear = parseInt(year);
      
      // التحقق من صحة السنة إذا تم تحديدها
      if (isNaN(selectedYear)) {
        return res.status(400).json({
          success: false,
          message: 'السنة يجب أن تكون رقماً صحيحاً',
          data: null
        });
      }
    }

  // تحديد الفترة الزمنية للسنة المحددة
  const startDate = new Date(selectedYear, 0, 1); // بداية السنة
  const endDate = new Date(selectedYear, 11, 31, 23, 59, 59, 999); // نهاية السنة
  
  // الفترة السابقة للمقارنة
  const previousYearStart = new Date(selectedYear - 1, 0, 1);
  const previousYearEnd = new Date(selectedYear - 1, 11, 31, 23, 59, 59, 999);

  try {
    // 🟩 1. الإحصائيات الرئيسية للسنة المحددة
    const [
      currentYearUsers,
      currentYearArtists,
      currentYearRevenue,
      previousYearUsers,
      previousYearArtists,
      previousYearRevenue
    ] = await Promise.all([
      // المستخدمين في السنة الحالية
      userModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: false
      }),
      // الفنانين في السنة الحالية
      userModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        role: 'artist',
        isDeleted: false
      }),
      // الإيرادات في السنة الحالية
      transactionModel.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          } 
        },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.totalAmount' } } }
      ]),
      // المستخدمين في السنة السابقة
      userModel.countDocuments({
        createdAt: { $gte: previousYearStart, $lte: previousYearEnd },
        isDeleted: false
      }),
      // الفنانين في السنة السابقة
      userModel.countDocuments({
        createdAt: { $gte: previousYearStart, $lte: previousYearEnd },
        role: 'artist',
        isDeleted: false
      }),
      // الإيرادات في السنة السابقة
      transactionModel.aggregate([
        { 
          $match: { 
            status: 'completed',
            createdAt: { $gte: previousYearStart, $lte: previousYearEnd }
          } 
        },
        { $group: { _id: null, totalRevenue: { $sum: '$pricing.totalAmount' } } }
      ])
    ]);

    // حساب النسب المئوية
    const usersPercentageChange = previousYearUsers > 0 
      ? Math.round(((currentYearUsers - previousYearUsers) / previousYearUsers) * 100)
      : 0;

    const artistsPercentageChange = previousYearArtists > 0
      ? Math.round(((currentYearArtists - previousYearArtists) / previousYearArtists) * 100)
      : 0;

    const currentRevenue = currentYearRevenue.length > 0 ? currentYearRevenue[0].totalRevenue : 0;
    const previousRevenue = previousYearRevenue.length > 0 ? previousYearRevenue[0].totalRevenue : 0;
    
    const revenuePercentageChange = previousRevenue > 0
      ? Math.round(((currentRevenue - previousRevenue) / previousRevenue) * 100)
      : 0;

    // 🟦 2. أفضل الفنانين أداءً للسنة المحددة
    const topArtists = await userModel.aggregate([
      { 
        $match: { 
          role: 'artist',
          isActive: true,
          isDeleted: false
        } 
      },
      // جلب أعمال الفنان في السنة المحددة
      {
        $lookup: {
          from: 'artworks',
          let: { artistId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$artist', '$$artistId'] },
                createdAt: { $gte: startDate, $lte: endDate }
              }
            }
          ],
          as: 'artworks'
        }
      },
      // جلب تقييمات الفنان في السنة المحددة
      {
        $lookup: {
          from: 'reviews',
          let: { artistId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$artist', '$$artistId'] },
                createdAt: { $gte: startDate, $lte: endDate }
              }
            }
          ],
          as: 'reviews'
        }
      },
      // جلب مبيعات الفنان في السنة المحددة
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
                    { $gte: ['$createdAt', startDate] },
                    { $lte: ['$createdAt', endDate] }
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
        $limit: 5
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
            artworks: '$artworksCount',
            salesCount: '$salesCount'
          }
        }
      }
    ]);

    // 🟨 3. تتبع المبيعات الشهري للسنة المحددة
    const monthlySalesData = await transactionModel.aggregate([
      { 
        $match: { 
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
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
    ]);

    // تنسيق بيانات المبيعات الشهرية
    const months = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    const salesChartData = [];
    const salesByMonth = {};

    // تجميع البيانات حسب الشهر
    monthlySalesData.forEach(sale => {
      const monthKey = sale._id.month;
      salesByMonth[monthKey] = {
        totalRevenue: sale.totalRevenue,
        orderCount: sale.orderCount,
        averageOrderValue: Math.round(sale.averageOrderValue)
      };
    });

    // تحضير البيانات للرسم البياني
    for (let month = 1; month <= 12; month++) {
      const monthData = salesByMonth[month] || {
        totalRevenue: 0,
        orderCount: 0,
        averageOrderValue: 0
      };

      salesChartData.push({
        month: months[month - 1],
        revenue: monthData.totalRevenue,
        orders: monthData.orderCount,
        averageOrder: monthData.averageOrderValue
      });
    }

    // حساب الإجماليات
    const totalRevenue = salesChartData.reduce((sum, month) => sum + month.revenue, 0);
    const totalOrders = salesChartData.reduce((sum, month) => sum + month.orders, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 🟪 4. إحصائيات إضافية
    const [
      totalArtworks,
      totalReviews,
      activeArtistsCount,
      completedOrders
    ] = await Promise.all([
      // إجمالي الأعمال الفنية في السنة
      artworkModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }),
      // إجمالي التقييمات في السنة
      reviewModel.countDocuments({
        createdAt: { $gte: startDate, $lte: endDate },
        isDeleted: { $ne: true }
      }),
      // الفنانين النشطين
      userModel.countDocuments({
        role: 'artist',
        status: 'active',
        isDeleted: false
      }),
      // الطلبات المكتملة في السنة
      transactionModel.countDocuments({
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      })
    ]);

    const response = {
      success: true,
      message: `تم جلب الإحصائيات الشاملة لعام ${selectedYear} بنجاح`,
      data: {
        year: selectedYear,
        period: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString()
        },
        // الإحصائيات الرئيسية
        statistics: {
          totalUsers: {
            value: currentYearUsers,
            percentageChange: usersPercentageChange,
            isPositive: usersPercentageChange >= 0
          },
          activeArtists: {
            value: currentYearArtists,
            percentageChange: artistsPercentageChange,
            isPositive: artistsPercentageChange >= 0
          },
          totalRevenue: {
            value: currentRevenue,
            percentageChange: revenuePercentageChange,
            isPositive: revenuePercentageChange >= 0,
            currency: 'SAR'
          }
        },
        // أفضل الفنانين أداءً
        topArtists: {
          artists: topArtists,
          count: topArtists.length
        },
        // تتبع المبيعات
        salesTrends: {
          chartData: salesChartData,
          summary: {
            totalRevenue,
            totalOrders,
            averageOrderValue: Math.round(averageOrderValue),
            completedOrders
          }
        },
        // إحصائيات إضافية
        additionalStats: {
          totalArtworks,
          totalReviews,
          activeArtistsCount,
          completedOrders
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        year: selectedYear,
        previousYear: selectedYear - 1
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء جلب الإحصائيات الشاملة',
      error: error.message
    });
  }
}); 