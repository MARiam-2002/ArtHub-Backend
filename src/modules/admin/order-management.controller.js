import { asyncHandler } from '../../utils/asyncHandler.js';
import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import transactionModel from '../../../DB/models/transaction.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';

/**
 * @desc    جلب جميع الطلبات مع الفلترة والبحث (يشمل كلا النوعين)
 * @route   GET /api/admin/orders
 * @access  Private (Admin, SuperAdmin)
 */
export const getAllOrders = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const {
    page = 1,
    limit = 20,
    search,
    artistId,
    status,
    dateFrom,
    dateTo,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    exportData = false,
    orderType = 'all'
  } = req.query;

  // بناء معايير البحث للطلبات الخاصة
  const specialRequestMatch = { isDeleted: { $ne: true } };
  const transactionMatch = { isDeleted: { $ne: true } };
  
  // فلترة حسب الفنان
  if (artistId && mongoose.Types.ObjectId.isValid(artistId)) {
    specialRequestMatch.artist = new mongoose.Types.ObjectId(artistId);
    transactionMatch.seller = new mongoose.Types.ObjectId(artistId);
  }
  
  // فلترة حسب الحالة
  if (status) {
    if (['pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled'].includes(status)) {
      specialRequestMatch.status = status;
    }
    if (['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed'].includes(status)) {
      transactionMatch.status = status;
    }
  }
  
  // فلترة حسب التاريخ
  if (dateFrom || dateTo) {
    const dateFilter = {};
    if (dateFrom) dateFilter.$gte = new Date(dateFrom);
    if (dateTo) dateFilter.$lte = new Date(dateTo);
    
    specialRequestMatch.createdAt = dateFilter;
    transactionMatch.createdAt = dateFilter;
  }
  
  // البحث النصي
  if (search) {
    const searchFilter = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'sender.displayName': { $regex: search, $options: 'i' } },
      { 'artist.displayName': { $regex: search, $options: 'i' } }
    ];
    specialRequestMatch.$or = searchFilter;
    
    const transactionSearchFilter = [
      { 'items.artwork.title': { $regex: search, $options: 'i' } },
      { 'buyer.displayName': { $regex: search, $options: 'i' } },
      { 'seller.displayName': { $regex: search, $options: 'i' } }
    ];
    transactionMatch.$or = transactionSearchFilter;
  }

  // حساب التخطيط
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  // تجميع البيانات للطلبات الخاصة
  const specialRequestPipeline = [
    { $match: specialRequestMatch },
    {
      $lookup: {
        from: 'users',
        localField: 'sender',
        foreignField: '_id',
        as: 'senderData'
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
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryData'
      }
    },
    {
      $addFields: {
        sender: { $arrayElemAt: ['$senderData', 0] },
        artist: { $arrayElemAt: ['$artistData', 0] },
        category: { $arrayElemAt: ['$categoryData', 0] },
        orderType: 'special',
        price: { $coalesce: ['$finalPrice', '$quotedPrice', '$budget'] }
      }
    },
    {
      $project: {
        senderData: 0,
        artistData: 0,
        categoryData: 0
      }
    }
  ];

  // تجميع البيانات للمعاملات
  const transactionPipeline = [
    { $match: transactionMatch },
    {
      $lookup: {
        from: 'users',
        localField: 'buyer',
        foreignField: '_id',
        as: 'buyerData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'seller',
        foreignField: '_id',
        as: 'sellerData'
      }
    },
    {
      $lookup: {
        from: 'artworks',
        localField: 'items.artwork',
        foreignField: '_id',
        as: 'artworkData'
      }
    },
    {
      $addFields: {
        buyer: { $arrayElemAt: ['$buyerData', 0] },
        seller: { $arrayElemAt: ['$sellerData', 0] },
        artwork: { $arrayElemAt: ['$artworkData', 0] },
        orderType: 'transaction',
        title: { $arrayElemAt: ['$artworkData.title', 0] },
        description: { $arrayElemAt: ['$artworkData.description', 0] },
        price: '$pricing.totalAmount',
        sender: { $arrayElemAt: ['$buyerData', 0] },
        artist: { $arrayElemAt: ['$sellerData', 0] }
      }
    },
    {
      $project: {
        buyerData: 0,
        sellerData: 0,
        artworkData: 0
      }
    }
  ];

  let allOrders = [];

  // جلب البيانات حسب النوع المطلوب
  if (orderType === 'all' || orderType === 'special') {
    const specialRequests = await specialRequestModel.aggregate(specialRequestPipeline);
    allOrders.push(...specialRequests);
  }

  if (orderType === 'all' || orderType === 'transaction') {
    const transactions = await transactionModel.aggregate(transactionPipeline);
    allOrders.push(...transactions);
  }

  // ترتيب وفلترة النتائج
  allOrders.sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    return sortDirection === 1 ? 
      (aValue > bValue ? 1 : -1) : 
      (aValue < bValue ? 1 : -1);
  });

  const totalCount = allOrders.length;
  const paginatedOrders = allOrders.slice(skip, skip + parseInt(limit));

  // تنسيق البيانات للعرض
  const formattedOrders = paginatedOrders.map(order => ({
    _id: order._id,
    orderType: order.orderType,
    title: order.title,
    description: order.description,
    price: order.price,
    currency: order.currency || 'SAR',
    orderDate: order.createdAt,
    artist: {
      _id: order.artist?._id,
      name: order.artist?.displayName || 'غير محدد',
      profileImage: order.artist?.profileImage || order.artist?.photoURL
    },
    customer: {
      _id: order.sender?._id,
      name: order.sender?.displayName || 'غير محدد',
      profileImage: order.sender?.profileImage || order.sender?.photoURL
    },
    status: {
      value: order.status,
      label: getStatusLabel(order.status, order.orderType),
      color: getStatusColor(order.status, order.orderType)
    },
    requestType: order.orderType === 'special' ? {
      value: order.requestType,
      label: getRequestTypeLabel(order.requestType)
    } : {
      value: 'artwork_purchase',
      label: 'شراء عمل فني'
    },
    priority: order.orderType === 'special' ? {
      value: order.priority,
      label: getPriorityLabel(order.priority)
    } : null,
    deadline: order.deadline,
    estimatedDelivery: order.estimatedDelivery,
    currentProgress: order.currentProgress || 0,
    attachments: order.attachments || [],
    deliverables: order.deliverables || []
  }));

  // إذا كان التصدير مطلوب
  if (exportData === 'true') {
    const exportData = formattedOrders.map(order => ({
      'رقم الطلب': order._id,
      'نوع الطلب': order.orderType === 'special' ? 'طلب خاص' : 'شراء عمل فني',
      'اسم الطلب': order.title,
      'الوصف': order.description,
      'السعر': order.price,
      'العملة': order.currency,
      'تاريخ الطلب': order.orderDate,
      'الفنان': order.artist?.name || 'غير محدد',
      'العميل': order.customer?.name || 'غير محدد',
      'الحالة': order.status.label,
      'الأولوية': order.priority?.label || 'غير محدد',
      'نوع الطلب': order.requestType.label,
      'تاريخ التسليم المتوقع': order.estimatedDelivery,
      'تاريخ الإكمال': order.completedAt
    }));

    return res.json({
      success: true,
      message: 'تم تصدير بيانات الطلبات بنجاح',
      data: {
        orders: exportData,
        totalCount: totalCount,
        exportFormat: 'CSV'
      }
    });
  }

  res.json({
    success: true,
    message: 'تم جلب الطلبات بنجاح',
    data: {
      orders: formattedOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / parseInt(limit))
      },
      filters: {
        availableArtists: await getAvailableArtists(),
        availableStatuses: getAvailableStatuses(),
        orderTypes: [
          { value: 'all', label: 'جميع الطلبات' },
          { value: 'special', label: 'الطلبات الخاصة' },
          { value: 'transaction', label: 'شراء الأعمال الفنية' }
        ]
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