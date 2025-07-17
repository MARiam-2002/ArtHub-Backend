import { asyncHandler } from '../../utils/asyncHandler.js';
import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import transactionModel from '../../../DB/models/transaction.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';

/**
 * @desc    جلب جميع الطلبات (بدون فلترة أو بحث، فقط pagination)
 * @route   GET /api/admin/orders
 * @access  Private (Admin, SuperAdmin)
 */
export const getAllOrders = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // جلب الطلبات الخاصة
  const specialRequests = await specialRequestModel.find({ isDeleted: { $ne: true } })
    .populate('sender', 'displayName profileImage')
    .populate('artist', 'displayName profileImage')
    .lean();

  // جلب المعاملات (الطلبات العادية)
  const transactions = await transactionModel.find({ isDeleted: { $ne: true } })
    .populate('buyer', 'displayName profileImage')
    .populate('seller', 'displayName profileImage')
    .lean();

  // دمج النتائج في مصفوفة واحدة
  const allOrders = [
    ...specialRequests.map(order => ({
      _id: order._id,
      title: order.title || 'طلب خاص',
      description: order.description || '',
      price: order.finalPrice || order.quotedPrice || order.budget || 0,
      artist: order.artist,
      customer: order.sender,
      status: order.status,
      orderType: 'special',
      createdAt: order.createdAt
    })),
    ...transactions.map(order => ({
      _id: order._id,
      title: order.description || 'طلب شراء عمل فني',
      description: order.description || '',
      price: order.pricing?.totalAmount || 0,
      artist: order.seller,
      customer: order.buyer,
      status: order.status,
      orderType: 'transaction',
      createdAt: order.createdAt
    }))
  ];

  // ترتيب النتائج حسب الأحدث
  allOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // pagination
  const paginatedOrders = allOrders.slice(skip, skip + limit);

  res.json({
    success: true,
    data: {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total: allOrders.length,
        pages: Math.ceil(allOrders.length / limit)
      }
    }
  });
});

/**
 * @desc    جلب تفاصيل طلب واحد
 * @route   GET /api/admin/orders/:id
 * @access  Private (Admin, SuperAdmin)
 */
export const getOrderDetails = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الطلب غير صالح',
      data: null
    });
  }

  const order = await specialRequestModel.findById(id)
    .populate('sender', 'displayName profileImage photoURL email phone job')
    .populate('artist', 'displayName profileImage photoURL email phone job portfolioImages')
    .populate('category', 'name nameAr image')
    .lean();

  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'الطلب غير موجود',
      data: null
    });
  }

  // جلب الإحصائيات الإضافية
  const [artistStats, customerStats] = await Promise.all([
    getArtistStats(order.artist._id),
    getCustomerStats(order.sender._id)
  ]);

  const orderDetails = {
    _id: order._id,
    title: order.title,
    description: order.description,
    requestType: {
      value: order.requestType,
      label: getRequestTypeLabel(order.requestType)
    },
    budget: order.budget,
    quotedPrice: order.quotedPrice,
    finalPrice: order.finalPrice,
    currency: order.currency,
    status: {
      value: order.status,
      label: getStatusLabel(order.status),
      color: getStatusColor(order.status)
    },
    priority: {
      value: order.priority,
      label: getPriorityLabel(order.priority)
    },
    artist: {
      ...order.artist,
      stats: artistStats
    },
    customer: {
      ...order.sender,
      stats: customerStats
    },
    category: order.category,
    deadline: order.deadline,
    estimatedDelivery: order.estimatedDelivery,
    currentProgress: order.currentProgress || 0,
    usedRevisions: order.usedRevisions || 0,
    maxRevisions: order.maxRevisions || 3,
    attachments: order.attachments || [],
    deliverables: order.deliverables || [],
    milestones: order.milestones || [],
    revisions: order.revisions || [],
    specifications: order.specifications,
    communicationPreferences: order.communicationPreferences,
    tags: order.tags || [],
    response: order.response,
    finalNote: order.finalNote,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    acceptedAt: order.acceptedAt,
    startedAt: order.startedAt,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt
  };

  res.json({
    success: true,
    message: 'تم جلب تفاصيل الطلب بنجاح',
    data: orderDetails
  });
});

/**
 * @desc    تحديث حالة الطلب
 * @route   PATCH /api/admin/orders/:id/status
 * @access  Private (Admin, SuperAdmin)
 */
export const updateOrderStatus = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { status, reason, estimatedDelivery } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الطلب غير صالح',
      data: null
    });
  }

  const order = await specialRequestModel.findById(id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'الطلب غير موجود',
      data: null
    });
  }

  // التحقق من صحة الحالة الجديدة
  const validStatuses = ['pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'حالة الطلب غير صالحة',
      data: null
    });
  }

  // تحديث الحالة والبيانات المرتبطة
  order.status = status;
  
  if (estimatedDelivery) {
    order.estimatedDelivery = new Date(estimatedDelivery);
  }

  // تحديث التواريخ حسب الحالة
  const now = new Date();
  switch (status) {
    case 'accepted':
      order.acceptedAt = now;
      break;
    case 'in_progress':
      order.startedAt = now;
      break;
    case 'completed':
      order.completedAt = now;
      order.currentProgress = 100;
      break;
    case 'cancelled':
      order.cancelledAt = now;
      order.cancellationReason = reason;
      break;
  }

  await order.save();

  // إرسال إشعار للمستخدمين
  try {
    await sendOrderStatusNotification(order, status);
  } catch (error) {
    console.warn('Failed to send notification:', error);
  }

  res.json({
    success: true,
    message: 'تم تحديث حالة الطلب بنجاح',
    data: {
      _id: order._id,
      status: {
        value: order.status,
        label: getStatusLabel(order.status),
        color: getStatusColor(order.status)
      },
      updatedAt: order.updatedAt
    }
  });
});

/**
 * @desc    حذف طلب
 * @route   DELETE /api/admin/orders/:id
 * @access  Private (Admin, SuperAdmin)
 */
export const deleteOrder = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الطلب غير صالح',
      data: null
    });
  }

  const order = await specialRequestModel.findById(id);
  if (!order) {
    return res.status(404).json({
      success: false,
      message: 'الطلب غير موجود',
      data: null
    });
  }

  // حذف ناعم
  order.isDeleted = true;
  await order.save();

  res.json({
    success: true,
    message: 'تم حذف الطلب بنجاح',
    data: null
  });
});

/**
 * @desc    جلب إحصائيات الطلبات
 * @route   GET /api/admin/orders/statistics
 * @access  Private (Admin, SuperAdmin)
 */
export const getOrderStatistics = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { period = '30days' } = req.query;
  
  let startDate = new Date();
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

  const matchCriteria = {
    createdAt: { $gte: startDate },
    isDeleted: { $ne: true }
  };

  // إحصائيات الحالات
  const statusStats = await specialRequestModel.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: { $coalesce: ['$finalPrice', '$quotedPrice', '$budget'] } }
      }
    }
  ]);

  // إحصائيات الفنانين
  const artistStats = await specialRequestModel.aggregate([
    { $match: matchCriteria },
    {
      $group: {
        _id: '$artist',
        orderCount: { $sum: 1 },
        totalRevenue: { $sum: { $coalesce: ['$finalPrice', '$quotedPrice', '$budget'] } }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $addFields: {
        artistName: { $arrayElemAt: ['$artistData.displayName', 0] }
      }
    },
    {
      $sort: { orderCount: -1 }
    },
    {
      $limit: 10
    }
  ]);

  // إحصائيات إضافية
  const [totalOrders, totalRevenue, averageOrderValue] = await Promise.all([
    specialRequestModel.countDocuments(matchCriteria),
    specialRequestModel.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          total: { $sum: { $coalesce: ['$finalPrice', '$quotedPrice', '$budget'] } }
        }
      }
    ]),
    specialRequestModel.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: null,
          average: { $avg: { $coalesce: ['$finalPrice', '$quotedPrice', '$budget'] } }
        }
      }
    ])
  ]);

  res.json({
    success: true,
    message: 'تم جلب إحصائيات الطلبات بنجاح',
    data: {
      period,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
      averageOrderValue: averageOrderValue[0]?.average || 0,
      statusBreakdown: statusStats,
      topArtists: artistStats
    }
  });
});

/**
 * جلب الفنانين المتاحين
 */
async function getAvailableArtists() {
  const artists = await userModel.find({ 
    role: 'artist', 
    isDeleted: { $ne: true } 
  })
  .select('displayName profileImage photoURL')
  .lean();

  return artists.map(artist => ({
    _id: artist._id,
    name: artist.displayName,
    profileImage: artist.profileImage || artist.photoURL
  }));
}

/**
 * جلب الحالات المتاحة (محدثة لتدعم كلا النوعين)
 */
function getAvailableStatuses() {
  return {
    special: [
      { value: 'pending', label: 'قيد الانتظار', color: '#FFA500' },
      { value: 'accepted', label: 'مقبول', color: '#4CAF50' },
      { value: 'rejected', label: 'مرفوض', color: '#F44336' },
      { value: 'in_progress', label: 'قيد التنفيذ', color: '#2196F3' },
      { value: 'review', label: 'قيد المراجعة', color: '#9C27B0' },
      { value: 'completed', label: 'مكتمل', color: '#4CAF50' },
      { value: 'cancelled', label: 'ملغي', color: '#757575' }
    ],
    transaction: [
      { value: 'pending', label: 'قيد الانتظار', color: '#FFA500' },
      { value: 'processing', label: 'قيد المعالجة', color: '#2196F3' },
      { value: 'confirmed', label: 'مؤكد', color: '#4CAF50' },
      { value: 'shipped', label: 'تم الشحن', color: '#9C27B0' },
      { value: 'delivered', label: 'تم التسليم', color: '#4CAF50' },
      { value: 'completed', label: 'مكتمل', color: '#4CAF50' },
      { value: 'cancelled', label: 'ملغي', color: '#757575' },
      { value: 'refunded', label: 'مسترد', color: '#F44336' },
      { value: 'disputed', label: 'متنازع عليه', color: '#FF9800' }
    ]
  };
}

/**
 * جلب إحصائيات الفنان
 */
async function getArtistStats(artistId) {
  const stats = await specialRequestModel.aggregate([
    { $match: { artist: new mongoose.Types.ObjectId(artistId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalRevenue: { $sum: { $coalesce: ['$finalPrice', '$quotedPrice', '$budget'] } },
        averageRating: { $avg: '$artistRating' }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    completedOrders: 0,
    totalRevenue: 0,
    averageRating: 0
  };
}

/**
 * جلب إحصائيات العميل
 */
async function getCustomerStats(customerId) {
  const stats = await specialRequestModel.aggregate([
    { $match: { sender: new mongoose.Types.ObjectId(customerId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        completedOrders: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
        totalSpent: { $sum: { $coalesce: ['$finalPrice', '$quotedPrice', '$budget'] } },
        averageRating: { $avg: '$clientRating' }
      }
    }
  ]);

  return stats[0] || {
    totalOrders: 0,
    completedOrders: 0,
    totalSpent: 0,
    averageRating: 0
  };
}

/**
 * إرسال إشعار بتغيير حالة الطلب
 */
async function sendOrderStatusNotification(order, newStatus) {
  const { sendPushNotificationToUser } = await import('../../utils/pushNotifications.js');
  
  const statusLabels = {
    'accepted': 'تم قبول طلبك',
    'rejected': 'تم رفض طلبك',
    'in_progress': 'تم بدء العمل على طلبك',
    'completed': 'تم إكمال طلبك',
    'cancelled': 'تم إلغاء طلبك'
  };

  const message = statusLabels[newStatus] || 'تم تحديث حالة طلبك';

  // إشعار للعميل
  await sendPushNotificationToUser(
    order.sender,
    {
      title: 'تحديث حالة الطلب',
      body: `${message}: ${order.title}`
    },
    {
      screen: 'ORDER_DETAILS',
      orderId: order._id.toString(),
      type: 'order_status_update'
    }
  );

  // إشعار للفنان
  await sendPushNotificationToUser(
    order.artist,
    {
      title: 'تحديث حالة الطلب',
      body: `${message}: ${order.title}`
    },
    {
      screen: 'ORDER_DETAILS',
      orderId: order._id.toString(),
      type: 'order_status_update'
    }
  );
}

/**
 * تسميات الحالات (محدثة لتدعم كلا النوعين)
 */
function getStatusLabel(status, orderType = 'special') {
  const specialLabels = {
    'pending': 'قيد الانتظار',
    'accepted': 'مقبول',
    'rejected': 'مرفوض',
    'in_progress': 'قيد التنفيذ',
    'review': 'قيد المراجعة',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  };

  const transactionLabels = {
    'pending': 'قيد الانتظار',
    'processing': 'قيد المعالجة',
    'confirmed': 'مؤكد',
    'shipped': 'تم الشحن',
    'delivered': 'تم التسليم',
    'completed': 'مكتمل',
    'cancelled': 'ملغي',
    'refunded': 'مسترد',
    'disputed': 'متنازع عليه'
  };

  const labels = orderType === 'transaction' ? transactionLabels : specialLabels;
  return labels[status] || status;
}

/**
 * ألوان الحالات (محدثة لتدعم كلا النوعين)
 */
function getStatusColor(status, orderType = 'special') {
  const specialColors = {
    'pending': '#FFA500',
    'accepted': '#4CAF50',
    'rejected': '#F44336',
    'in_progress': '#2196F3',
    'review': '#9C27B0',
    'completed': '#4CAF50',
    'cancelled': '#757575'
  };

  const transactionColors = {
    'pending': '#FFA500',
    'processing': '#2196F3',
    'confirmed': '#4CAF50',
    'shipped': '#9C27B0',
    'delivered': '#4CAF50',
    'completed': '#4CAF50',
    'cancelled': '#757575',
    'refunded': '#F44336',
    'disputed': '#FF9800'
  };

  const colors = orderType === 'transaction' ? transactionColors : specialColors;
  return colors[status] || '#757575';
}

/**
 * تسميات أنواع الطلبات
 */
function getRequestTypeLabel(type) {
  const labels = {
    'custom_artwork': 'عمل فني مخصص',
    'portrait': 'بورتريه',
    'logo_design': 'تصميم شعار',
    'illustration': 'رسم توضيحي',
    'digital_art': 'فن رقمي',
    'traditional_art': 'فن تقليدي',
    'animation': 'رسوم متحركة',
    'graphic_design': 'تصميم جرافيك',
    'character_design': 'تصميم شخصيات',
    'concept_art': 'فن المفاهيم',
    'other': 'أخرى'
  };
  return labels[type] || type;
}

/**
 * تسميات الأولويات
 */
function getPriorityLabel(priority) {
  const labels = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة'
  };
  return labels[priority] || priority;
} 