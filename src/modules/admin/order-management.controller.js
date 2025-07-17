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

  // دمج وتنسيق البيانات
  const allOrders = [
    ...specialRequests.map(order => ({
      _id: order._id,
      title: order.title,
      description: order.description,
      price: order.finalPrice || order.budget,
      currency: order.currency || 'SAR',
      orderDate: order.createdAt,
      artist: order.artist,
      customer: order.sender,
      status: {
        value: order.status,
        label: getStatusLabel(order.status),
        color: getStatusColor(order.status)
      },
      requestType: {
        value: order.requestType,
        label: getRequestTypeLabel(order.requestType)
      },
      priority: {
        value: order.priority,
        label: getPriorityLabel(order.priority)
      },
      deadline: order.deadline,
      estimatedDelivery: order.estimatedDelivery,
      currentProgress: order.currentProgress || 0,
      attachments: order.attachments || [],
      deliverables: order.deliverables || [],
      orderType: 'special_request'
    })),
    ...transactions.map(order => ({
      _id: order._id,
      title: `طلب ${order.transactionNumber}`,
      description: order.description || 'طلب عادي',
      price: order.pricing?.totalAmount || 0,
      currency: 'SAR',
      orderDate: order.createdAt,
      artist: order.seller,
      customer: order.buyer,
      status: {
        value: order.status,
        label: getStatusLabel(order.status),
        color: getStatusColor(order.status)
      },
      requestType: {
        value: 'regular_order',
        label: 'طلب عادي'
      },
      priority: {
        value: 'normal',
        label: 'عادي'
      },
      deadline: null,
      estimatedDelivery: null,
      currentProgress: order.status === 'completed' ? 100 : 0,
      attachments: [],
      deliverables: [],
      orderType: 'transaction'
    }))
  ];

  // تطبيق pagination
  const total = allOrders.length;
  const paginatedOrders = allOrders.slice(skip, skip + limit);

  // جلب الفلاتر المتاحة
  const availableArtists = await userModel.find({ 
    role: 'artist', 
    isDeleted: { $ne: true } 
  })
  .select('displayName profileImage')
  .lean();

  const availableStatuses = [
    { value: 'pending', label: 'قيد الانتظار', color: '#FF9800' },
    { value: 'accepted', label: 'مقبول', color: '#2196F3' },
    { value: 'rejected', label: 'مرفوض', color: '#F44336' },
    { value: 'in_progress', label: 'قيد التنفيذ', color: '#9C27B0' },
    { value: 'review', label: 'قيد المراجعة', color: '#FF5722' },
    { value: 'completed', label: 'مكتمل', color: '#4CAF50' },
    { value: 'cancelled', label: 'ملغي', color: '#607D8B' }
  ];

  res.json({
    success: true,
    message: 'تم جلب الطلبات بنجاح',
    data: {
      orders: paginatedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      filters: {
        availableArtists,
        availableStatuses
      }
    }
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
  const { status } = req.body;

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

  // تحديث الحالة فقط
  order.status = status;

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
      break;
    case 'cancelled':
      order.cancelledAt = now;
      break;
  }

  await order.save();

  // إرسال إشعارات للمستخدمين
  try {
    const { sendNotification } = await import('../../utils/pushNotifications.js');
    
    // إشعار للفنان
    if (order.artist) {
      await sendNotification({
        userId: order.artist,
        title: 'تحديث حالة الطلب',
        body: `تم تحديث حالة الطلب "${order.title}" إلى ${getStatusLabel(status)}`,
        data: {
          type: 'order_status_update',
          orderId: order._id.toString()
        }
      });
    }

    // إشعار للعميل
    if (order.sender) {
      await sendNotification({
        userId: order.sender,
        title: 'تحديث حالة الطلب',
        body: `تم تحديث حالة طلبك "${order.title}" إلى ${getStatusLabel(status)}`,
        data: {
          type: 'order_status_update',
          orderId: order._id.toString()
        }
      });
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
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

// Helper Functions
async function getAvailableArtists() {
  return await userModel.find({ 
    role: 'artist', 
    isDeleted: { $ne: true } 
  })
  .select('displayName profileImage')
  .lean();
}

function getAvailableStatuses() {
  return [
    { value: 'pending', label: 'قيد الانتظار', color: '#FF9800' },
    { value: 'accepted', label: 'مقبول', color: '#2196F3' },
    { value: 'rejected', label: 'مرفوض', color: '#F44336' },
    { value: 'in_progress', label: 'قيد التنفيذ', color: '#9C27B0' },
    { value: 'review', label: 'قيد المراجعة', color: '#FF5722' },
    { value: 'completed', label: 'مكتمل', color: '#4CAF50' },
    { value: 'cancelled', label: 'ملغي', color: '#607D8B' }
  ];
}

function getStatusLabel(status) {
  const statusMap = {
    pending: 'قيد الانتظار',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    in_progress: 'قيد التنفيذ',
    review: 'قيد المراجعة',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };
  return statusMap[status] || status;
}

function getStatusColor(status) {
  const colorMap = {
    pending: '#FF9800',
    accepted: '#2196F3',
    rejected: '#F44336',
    in_progress: '#9C27B0',
    review: '#FF5722',
    completed: '#4CAF50',
    cancelled: '#607D8B'
  };
  return colorMap[status] || '#999';
}

function getRequestTypeLabel(type) {
  const labels = {
    'custom_artwork': 'عمل فني مخصص',
    'portrait': 'بورتريه',
    'landscape': 'منظر طبيعي',
    'abstract': 'فن تجريدي',
    'digital_art': 'فن رقمي',
    'calligraphy': 'خط عربي',
    'illustration': 'رسم توضيحي',
    'regular_order': 'طلب عادي'
  };
  return labels[type] || type;
}

function getPriorityLabel(priority) {
  const labels = {
    'low': 'منخفضة',
    'medium': 'متوسطة',
    'high': 'عالية',
    'urgent': 'عاجلة',
    'normal': 'عادي'
  };
  return labels[priority] || priority;
} 