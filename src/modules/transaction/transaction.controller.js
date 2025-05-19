import transactionModel from '../../../DB/models/transaction.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import mongoose from 'mongoose';

/**
 * Calculate commission rate based on transaction amount
 * Higher transaction amounts get lower commission rates
 */
function calculateCommission(amount) {
  if (amount < 500) {
    return amount * 0.1; // 10% for transactions under 500
  } else if (amount < 2000) {
    return amount * 0.08; // 8% for transactions between 500-2000
  } else if (amount < 5000) {
    return amount * 0.06; // 6% for transactions between 2000-5000
  } else {
    return amount * 0.04; // 4% for transactions over 5000
  }
}

/**
 * إنشاء معاملة جديدة لشراء عمل فني
 */
export const createArtworkTransaction = asyncHandler(async (req, res) => {
  const { artworkId, paymentMethod, paymentId, shippingAddress } = req.body;
  const buyer = req.user._id;
  
  // التحقق من وجود العمل الفني وأنه متاح للبيع
  const artwork = await artworkModel.findById(artworkId);
  if (!artwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }
  
  if (!artwork.isAvailable) {
    return res.fail(null, 'العمل الفني غير متاح للشراء', 400);
  }
  
  // التحقق من وجود الفنان
  const seller = artwork.artist;
  const artist = await userModel.findById(seller);
  if (!artist) {
    return res.fail(null, 'بيانات الفنان غير موجودة', 404);
  }
  
  // Verify buyer is not the seller
  if (buyer.toString() === seller.toString()) {
    return res.fail(null, 'لا يمكنك شراء العمل الفني الخاص بك', 400);
  }
  
  // حساب العمولة (15٪ من سعر العمل الفني)
  const amount = artwork.price;
  const commissionAmount = calculateCommission(amount);
  const netAmount = amount - commissionAmount;
  
  // إنشاء المعاملة
  const transaction = await transactionModel.create({
    buyer,
    seller,
    artwork: artworkId,
    amount,
    commissionAmount,
    netAmount,
    currency: 'SAR', // Default currency
    paymentMethod,
    paymentId,
    shippingAddress,
    status: 'pending' // Initial status
  });
  
  // تحديث حالة العمل الفني (في التطبيق الحقيقي، يتم هذا بعد اكتمال الدفع)
  if (process.env.NODE_ENV !== 'production') {
    // هذا للاختبار فقط، في الإنتاج سيتم التحديث عبر webhook من بوابة الدفع
    artwork.isAvailable = false;
    await artwork.save();
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();
  }
  
  res.success(transaction, 'تم إنشاء عملية الشراء بنجاح، في انتظار تأكيد الدفع', 201);
});

/**
 * إنشاء معاملة جديدة لطلب خاص
 */
export const createSpecialRequestTransaction = asyncHandler(async (req, res) => {
  const { specialRequestId, paymentMethod, paymentId, shippingAddress } = req.body;
  const buyer = req.user._id;
  
  // التحقق من وجود الطلب الخاص
  const specialRequest = await specialRequestModel.findById(specialRequestId);
  if (!specialRequest) {
    return res.fail(null, 'الطلب الخاص غير موجود', 404);
  }
  
  if (specialRequest.status !== 'accepted') {
    return res.fail(null, 'الطلب الخاص غير مقبول بعد للدفع', 400);
  }
  
  // Verify buyer is the requester
  if (buyer.toString() !== specialRequest.sender.toString()) {
    return res.fail(null, 'غير مصرح لك بالدفع لهذا الطلب', 403);
  }
  
  // التحقق من وجود الفنان
  const seller = specialRequest.artist;
  const artist = await userModel.findById(seller);
  if (!artist) {
    return res.fail(null, 'بيانات الفنان غير موجودة', 404);
  }
  
  // حساب العمولة (10٪ من سعر الطلب الخاص)
  const amount = specialRequest.budget;
  const commissionAmount = calculateCommission(amount);
  const netAmount = amount - commissionAmount;
  
  // إنشاء المعاملة
  const transaction = await transactionModel.create({
    buyer,
    seller,
    specialRequest: specialRequestId,
    amount,
    commissionAmount,
    netAmount,
    currency: 'SAR', // Default currency
    paymentMethod,
    paymentId,
    shippingAddress,
    status: 'pending' // Initial status
  });
  
  // تحديث حالة الطلب الخاص (في التطبيق الحقيقي، يتم هذا بعد اكتمال الدفع)
  if (process.env.NODE_ENV !== 'production') {
    // هذا للاختبار فقط، في الإنتاج سيتم التحديث عبر webhook من بوابة الدفع
    specialRequest.status = 'completed';
    specialRequest.completedAt = new Date();
    await specialRequest.save();
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();
  }
  
  res.success(transaction, 'تم إنشاء عملية الدفع للطلب الخاص بنجاح', 201);
});

/**
 * الحصول على قائمة معاملات المستخدم
 */
export const getUserTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const userId = req.user._id;
  
  // المستخدم يمكنه رؤية المعاملات التي هو طرف فيها (كمشتري أو بائع)
  const query = {
    $or: [{ buyer: userId }, { seller: userId }]
  };
  
  // فلترة حسب النوع إذا تم تحديده
  if (req.query.type === 'buying') {
    query.buyer = userId;
    delete query.$or;
  } else if (req.query.type === 'selling') {
    query.seller = userId;
    delete query.$or;
  }
  
  // فلترة حسب الحالة
  if (req.query.status && ['pending', 'completed', 'failed', 'refunded'].includes(req.query.status)) {
    query.status = req.query.status;
  }
  
  const [transactions, totalCount] = await Promise.all([
    transactionModel.find(query)
      .populate('buyer', 'displayName email profileImage')
      .populate('seller', 'displayName email profileImage')
      .populate('artwork', 'title image price')
      .populate('specialRequest', 'requestType description budget')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    transactionModel.countDocuments(query)
  ]);
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  
  res.success({ transactions, pagination: paginationMeta }, 'تم جلب المعاملات بنجاح');
});

/**
 * الحصول على تفاصيل معاملة
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  
  const transaction = await transactionModel.findById(transactionId)
    .populate('buyer', 'displayName email profileImage')
    .populate('seller', 'displayName email profileImage')
    .populate('artwork')
    .populate('specialRequest');
  
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }
  
  // Check permissions: must be admin, buyer or seller
  if (req.user.role !== 'admin' && 
      transaction.buyer._id.toString() !== req.user._id.toString() && 
      transaction.seller._id.toString() !== req.user._id.toString()) {
    return res.fail(null, 'غير مصرح لك بعرض هذه المعاملة', 403);
  }
  
  res.success(transaction, 'تم جلب تفاصيل المعاملة بنجاح');
});

/**
 * تحديث معلومات الشحن والتتبع (للبائع/الفنان فقط)
 */
export const updateShippingInfo = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { provider, trackingNumber, trackingUrl, estimatedDelivery } = req.body;
  const sellerId = req.user._id;
  
  const transaction = await transactionModel.findOne({
    _id: transactionId,
    seller: sellerId,
    status: 'completed' // يمكن تحديث معلومات الشحن فقط للمعاملات المكتملة
  });
  
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة أو لا يمكن تحديثها', 404);
  }
  
  // تحديث معلومات الشحن
  transaction.trackingInfo = {
    provider,
    trackingNumber,
    trackingUrl,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
    shippedAt: new Date()
  };
  
  await transaction.save();
  
  res.success(transaction, 'تم تحديث معلومات الشحن بنجاح');
});

/**
 * الحصول على إحصائيات المعاملات للمدير
 */
export const getTransactionStats = asyncHandler(async (req, res) => {
  // التحقق من أن المستخدم هو مدير
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض إحصائيات المعاملات', 403);
  }
  
  // إحصائيات عامة
  const [totalStats, monthlyStats] = await Promise.all([
    transactionModel.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' }
        }
      }
    ]),
    
    // إحصائيات شهرية (آخر 6 أشهر)
    transactionModel.aggregate([
      {
        $match: {
          createdAt: { 
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 6)) 
          }
        }
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          totalCommission: { $sum: '$commissionAmount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ]);
  
  // تنسيق الإحصائيات
  const stats = {
    overall: {
      total: 0,
      totalAmount: 0,
      totalCommission: 0,
      byStatus: {}
    },
    monthly: []
  };
  
  // معالجة الإحصائيات العامة
  totalStats.forEach(item => {
    stats.overall.total += item.count;
    stats.overall.totalAmount += item.totalAmount;
    stats.overall.totalCommission += item.totalCommission;
    stats.overall.byStatus[item._id] = {
      count: item.count,
      amount: item.totalAmount,
      commission: item.totalCommission
    };
  });
  
  // معالجة الإحصائيات الشهرية
  const monthNames = [
    'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];
  
  monthlyStats.forEach(item => {
    stats.monthly.push({
      month: item._id.month,
      year: item._id.year,
      label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
      count: item.count,
      totalAmount: item.totalAmount,
      totalCommission: item.totalCommission
    });
  });
  
  res.success(stats, 'تم جلب إحصائيات المعاملات بنجاح');
});

/**
 * Update transaction status
 * This would be called from payment webhooks or admin
 */
export const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { status, trackingInfo, notes } = req.body;
  
  // Only admin or seller can update transaction status
  const transaction = await transactionModel.findById(transactionId)
    .populate('seller', '_id')
    .populate('buyer', '_id');
  
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }
  
  // Check permissions: must be admin or the seller
  if (req.user.role !== 'admin' && transaction.seller._id.toString() !== req.user._id.toString()) {
    return res.fail(null, 'غير مصرح لك بتحديث حالة هذه المعاملة', 403);
  }
  
  // Update transaction
  transaction.status = status;
  
  if (status === 'completed') {
    transaction.completedAt = new Date();
  }
  
  if (trackingInfo) {
    transaction.trackingInfo = {
      ...transaction.trackingInfo,
      ...trackingInfo,
    };
    
    // Set shipping date if not already set
    if (trackingInfo.trackingNumber && !transaction.trackingInfo.shippedAt) {
      transaction.trackingInfo.shippedAt = new Date();
    }
  }
  
  if (notes) {
    transaction.notes = notes;
  }
  
  await transaction.save();
  
  // Send notification to buyer about status update (can be implemented later)
  
  res.success(transaction, 'تم تحديث حالة المعاملة بنجاح');
});

/**
 * Get buyer transactions (purchases)
 */
export const getBuyerTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status } = req.query;
  
  // Build query
  const query = { buyer: req.user._id };
  if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    query.status = status;
  }
  
  const [transactions, totalCount] = await Promise.all([
    transactionModel.find(query)
      .populate('seller', 'displayName email profileImage')
      .populate('artwork', 'title image price')
      .populate('specialRequest', 'requestType description budget')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    transactionModel.countDocuments(query)
  ]);
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  
  res.success({ transactions, pagination: paginationMeta }, 'تم جلب قائمة المشتريات بنجاح');
});

/**
 * Get seller transactions (sales)
 */
export const getSellerTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status } = req.query;
  
  // Build query
  const query = { seller: req.user._id };
  if (status && ['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    query.status = status;
  }
  
  const [transactions, totalCount] = await Promise.all([
    transactionModel.find(query)
      .populate('buyer', 'displayName email profileImage')
      .populate('artwork', 'title image price')
      .populate('specialRequest', 'requestType description budget')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    transactionModel.countDocuments(query)
  ]);
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  
  res.success({ transactions, pagination: paginationMeta }, 'تم جلب قائمة المبيعات بنجاح');
});

/**
 * Update shipping/tracking information
 */
export const updateTrackingInfo = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { trackingNumber, provider, trackingUrl, estimatedDelivery } = req.body;
  
  const transaction = await transactionModel.findById(transactionId);
  
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }
  
  // Check permissions: must be admin or the seller
  if (req.user.role !== 'admin' && transaction.seller.toString() !== req.user._id.toString()) {
    return res.fail(null, 'غير مصرح لك بتحديث معلومات الشحن', 403);
  }
  
  // Update tracking info
  transaction.trackingInfo = {
    ...transaction.trackingInfo,
    trackingNumber,
    provider,
    trackingUrl,
    estimatedDelivery: estimatedDelivery ? new Date(estimatedDelivery) : undefined,
    shippedAt: new Date()
  };
  
  await transaction.save();
  
  // Send notification to buyer about shipment (can be implemented later)
  
  res.success(transaction, 'تم تحديث معلومات الشحن بنجاح');
});

/**
 * Get sales statistics for seller
 */
export const getSellerStats = asyncHandler(async (req, res) => {
  // Check if user is an artist/seller
  const user = await userModel.findById(req.user._id);
  if (user.role !== 'artist') {
    return res.fail(null, 'هذه الاحصائيات متاحة فقط للفنانين', 403);
  }
  
  // Get current date and calculate date ranges
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);
  
  // Aggregate sales data
  const salesStats = await transactionModel.aggregate([
    { $match: { seller: req.user._id, status: 'completed' } },
    { $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$netAmount' },
        totalCommission: { $sum: '$commissionAmount' },
        avgOrderValue: { $avg: '$amount' }
      }
    }
  ]);
  
  // Monthly sales
  const monthlySales = await transactionModel.aggregate([
    { 
      $match: { 
        seller: req.user._id, 
        status: 'completed',
        createdAt: { $gte: thisYear }
      } 
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
        revenue: { $sum: '$netAmount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Current month sales
  const currentMonthSales = await transactionModel.aggregate([
    { 
      $match: { 
        seller: req.user._id, 
        status: 'completed',
        createdAt: { $gte: thisMonth }
      } 
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$netAmount' }
      }
    }
  ]);
  
  // Last month sales for comparison
  const lastMonthSales = await transactionModel.aggregate([
    { 
      $match: { 
        seller: req.user._id, 
        status: 'completed',
        createdAt: { $gte: lastMonth, $lt: thisMonth }
      } 
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        revenue: { $sum: '$netAmount' }
      }
    }
  ]);
  
  // Format stats
  const stats = {
    overall: {
      totalSales: salesStats[0]?.totalSales || 0,
      totalRevenue: salesStats[0]?.totalRevenue || 0,
      totalCommission: salesStats[0]?.totalCommission || 0,
      avgOrderValue: salesStats[0]?.avgOrderValue || 0
    },
    currentMonth: {
      sales: currentMonthSales[0]?.count || 0,
      revenue: currentMonthSales[0]?.revenue || 0
    },
    lastMonth: {
      sales: lastMonthSales[0]?.count || 0,
      revenue: lastMonthSales[0]?.revenue || 0
    },
    monthlySales: monthlySales.map(month => ({
      month: month._id,
      sales: month.count,
      revenue: month.revenue
    }))
  };
  
  // Calculate growth percentages
  if (stats.lastMonth.sales > 0) {
    stats.growth = {
      sales: ((stats.currentMonth.sales - stats.lastMonth.sales) / stats.lastMonth.sales) * 100,
      revenue: ((stats.currentMonth.revenue - stats.lastMonth.revenue) / stats.lastMonth.revenue) * 100
    };
  } else {
    stats.growth = {
      sales: stats.currentMonth.sales > 0 ? 100 : 0,
      revenue: stats.currentMonth.revenue > 0 ? 100 : 0
    };
  }
  
  res.success(stats, 'تم جلب إحصائيات المبيعات بنجاح');
});

/**
 * Get admin transaction statistics
 */
export const getAdminStats = asyncHandler(async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض إحصائيات المعاملات', 403);
  }
  
  // Get current date and calculate date ranges
  const now = new Date();
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisYear = new Date(now.getFullYear(), 0, 1);
  
  // Aggregate all sales data
  const overallStats = await transactionModel.aggregate([
    { $match: { status: 'completed' } },
    { $group: {
        _id: null,
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: '$amount' },
        totalCommission: { $sum: '$commissionAmount' },
        avgOrderValue: { $avg: '$amount' }
      }
    }
  ]);
  
  // Monthly commission revenue
  const monthlyCommission = await transactionModel.aggregate([
    { 
      $match: { 
        status: 'completed',
        createdAt: { $gte: thisYear }
      } 
    },
    {
      $group: {
        _id: { $month: '$createdAt' },
        count: { $sum: 1 },
        commission: { $sum: '$commissionAmount' },
        revenue: { $sum: '$amount' }
      }
    },
    { $sort: { _id: 1 } }
  ]);
  
  // Top selling artists
  const topArtists = await transactionModel.aggregate([
    { $match: { status: 'completed' } },
    { $group: {
        _id: '$seller',
        salesCount: { $sum: 1 },
        totalRevenue: { $sum: '$amount' }
      }
    },
    { $sort: { salesCount: -1 } },
    { $limit: 5 },
    { $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'sellerInfo'
      }
    },
    { $unwind: '$sellerInfo' },
    { $project: {
        _id: 1,
        salesCount: 1,
        totalRevenue: 1,
        'sellerInfo.displayName': 1,
        'sellerInfo.email': 1,
        'sellerInfo.profileImage': 1
      }
    }
  ]);
  
  // Format admin stats
  const stats = {
    overall: {
      totalSales: overallStats[0]?.totalSales || 0,
      totalRevenue: overallStats[0]?.totalRevenue || 0,
      totalCommission: overallStats[0]?.totalCommission || 0,
      avgOrderValue: overallStats[0]?.avgOrderValue || 0
    },
    monthlyStats: monthlyCommission.map(month => ({
      month: month._id,
      sales: month.count,
      commission: month.commission,
      revenue: month.revenue
    })),
    topArtists: topArtists.map(artist => ({
      id: artist._id,
      displayName: artist.sellerInfo.displayName,
      email: artist.sellerInfo.email,
      profileImage: artist.sellerInfo.profileImage,
      salesCount: artist.salesCount,
      totalRevenue: artist.totalRevenue
    }))
  };
  
  res.success(stats, 'تم جلب إحصائيات المعاملات بنجاح');
}); 