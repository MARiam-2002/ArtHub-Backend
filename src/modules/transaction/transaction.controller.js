import transactionModel from '../../../DB/models/transaction.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import notificationModel from '../../../DB/models/notification.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { createNotificationHelper } from '../notification/notification.controller.js';
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
 * إنشاء معاملة جديدة (موحدة للأعمال الفنية والطلبات الخاصة)
 */
export const createTransaction = asyncHandler(async (req, res) => {
  const { items, payment, shipping, installments, discountCode, notes, metadata } = req.body;
  const buyer = req.user._id;

  // التحقق من صحة العناصر وحساب الأسعار
  const processedItems = [];
  let subtotal = 0;
  let seller = null;

  for (const item of items) {
    let itemData = null;
    let itemPrice = 0;
    let itemSeller = null;

    if (item.artworkId) {
      // التحقق من العمل الفني
      const artwork = await artworkModel.findById(item.artworkId).populate('artist');
      if (!artwork) {
        return res.fail(null, `العمل الفني غير موجود: ${item.artworkId}`, 404);
      }
      if (!artwork.isAvailable) {
        return res.fail(null, `العمل الفني غير متاح للشراء: ${artwork.title}`, 400);
      }

      itemData = artwork;
      itemPrice = artwork.price;
      itemSeller = artwork.artist._id;
    } else if (item.specialRequestId) {
      // التحقق من الطلب الخاص
      const specialRequest = await specialRequestModel.findById(item.specialRequestId).populate('artist');
      if (!specialRequest) {
        return res.fail(null, `الطلب الخاص غير موجود: ${item.specialRequestId}`, 404);
      }
      if (specialRequest.status !== 'accepted') {
        return res.fail(null, 'الطلب الخاص غير مقبول للدفع', 400);
      }
      if (specialRequest.sender.toString() !== buyer.toString()) {
        return res.fail(null, 'غير مصرح لك بالدفع لهذا الطلب', 403);
      }

      itemData = specialRequest;
      itemPrice = specialRequest.budget;
      itemSeller = specialRequest.artist._id;
    }

    // التحقق من أن جميع العناصر من نفس البائع
    if (seller && seller.toString() !== itemSeller.toString()) {
      return res.fail(null, 'جميع العناصر يجب أن تكون من نفس البائع', 400);
    }
    seller = itemSeller;

    // التحقق من أن المشتري ليس البائع
    if (buyer.toString() === seller.toString()) {
      return res.fail(null, 'لا يمكنك شراء العناصر الخاصة بك', 400);
    }

    // حساب أسعار العنصر
    const quantity = item.quantity || 1;
    const unitPrice = itemPrice;
    const totalPrice = unitPrice * quantity;
    const discountAmount = 0; // يمكن إضافة منطق الخصم هنا
    const finalPrice = totalPrice - discountAmount;

    processedItems.push({
      artwork: item.artworkId || undefined,
      specialRequest: item.specialRequestId || undefined,
      quantity,
      unitPrice,
      totalPrice,
      discountAmount,
      finalPrice
    });

    subtotal += finalPrice;
  }

  // التحقق من وجود البائع
  const sellerUser = await userModel.findById(seller);
  if (!sellerUser) {
    return res.fail(null, 'بيانات البائع غير موجودة', 404);
  }

  // حساب الرسوم والضرائب
  const itemType = processedItems[0].artwork ? 'artwork' : 'specialRequest';
  const commissionAmount = calculateCommission(subtotal);
  const taxAmount = transactionModel.calculateTax(subtotal, shipping.address.country);
  const shippingCost = shipping.cost || 0;
  const totalAmount = subtotal + taxAmount + shippingCost;
  const netAmount = subtotal - commissionAmount;

  // إعداد بيانات التقسيط إذا كان مفعلاً
  let installmentData = null;
  if (installments?.enabled) {
    const installmentAmount = totalAmount / installments.totalInstallments;
    const schedule = [];
    
    for (let i = 1; i <= installments.totalInstallments; i++) {
      const dueDate = new Date();
      dueDate.setMonth(dueDate.getMonth() + i);
      
      schedule.push({
        installmentNumber: i,
        amount: installmentAmount,
        dueDate,
        status: i === 1 ? 'paid' : 'pending' // القسط الأول مدفوع مقدماً
      });
    }

    installmentData = {
      enabled: true,
      totalInstallments: installments.totalInstallments,
      paidInstallments: 1,
      installmentAmount,
      nextDueDate: schedule[1]?.dueDate,
      schedule
    };
  }

  // إنشاء المعاملة
  const transaction = await transactionModel.create({
    buyer,
    seller,
    items: processedItems,
    pricing: {
      subtotal,
      discountAmount: 0, // يمكن إضافة منطق الخصم
      taxAmount,
      shippingCost,
      commissionAmount,
      totalAmount,
      netAmount
    },
    currency: 'SAR',
    payment: {
      ...payment,
      fees: payment.fees || 0
    },
    shipping,
    installments: installmentData,
    metadata: {
      ...metadata,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop'
    },
    notes,
    status: installments?.enabled ? 'processing' : 'pending'
  });

  // تحديث حالة العناصر (في بيئة التطوير فقط)
  if (process.env.NODE_ENV !== 'production') {
    for (const item of processedItems) {
      if (item.artwork) {
        await artworkModel.findByIdAndUpdate(item.artwork, { isAvailable: false });
      } else if (item.specialRequest) {
        await specialRequestModel.findByIdAndUpdate(item.specialRequest, { 
          status: 'completed',
          completedAt: new Date()
        });
      }
    }
    
    // تحديث حالة المعاملة للاختبار
    transaction.status = 'completed';
    transaction.completedAt = new Date();
    await transaction.save();
  }

  // إرسال إشعار للبائع
  await createNotificationHelper({
    recipient: seller,
    type: 'transaction_created',
    title: 'طلب شراء جديد',
    message: `تم إنشاء طلب شراء جديد بقيمة ${totalAmount} ريال`,
    data: { transactionId: transaction._id }
  });

  // إرسال إشعار للمشتري
  await createNotificationHelper({
    recipient: buyer,
    type: 'transaction_created',
    title: 'تم إنشاء الطلب',
    message: `تم إنشاء طلب الشراء بنجاح، رقم المعاملة: ${transaction.transactionNumber}`,
    data: { transactionId: transaction._id }
  });

  res.success(transaction, 'تم إنشاء المعاملة بنجاح', 201);
});

/**
 * الحصول على قائمة معاملات المستخدم مع فلترة وبحث متقدم
 */
export const getUserTransactions = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const userId = req.user._id;
  const { 
    status, 
    type, 
    startDate, 
    endDate, 
    minAmount, 
    maxAmount, 
    search,
    sortBy,
    sortOrder 
  } = req.query;

  // بناء الاستعلام
  let query = {};

  // فلترة حسب نوع المعاملة
  if (type === 'buying') {
    query.buyer = userId;
  } else if (type === 'selling') {
    query.seller = userId;
  } else {
    query.$or = [{ buyer: userId }, { seller: userId }];
  }

  // فلترة حسب الحالة
  if (status) {
    query.status = status;
  }

  // فلترة حسب التاريخ
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  // فلترة حسب المبلغ
  if (minAmount || maxAmount) {
    query['pricing.totalAmount'] = {};
    if (minAmount) query['pricing.totalAmount'].$gte = parseFloat(minAmount);
    if (maxAmount) query['pricing.totalAmount'].$lte = parseFloat(maxAmount);
  }

  // البحث النصي
  if (search) {
    query.$or = [
      { transactionNumber: { $regex: search, $options: 'i' } },
      { notes: { $regex: search, $options: 'i' } }
    ];
  }

  // إعداد الترتيب
  const sortOptions = {};
  sortOptions[sortBy || 'createdAt'] = sortOrder === 'asc' ? 1 : -1;

  const [transactions, totalCount] = await Promise.all([
    transactionModel
      .find(query)
      .populate('buyer', 'displayName email profileImage')
      .populate('seller', 'displayName email profileImage')
      .populate('items.artwork', 'title image price category')
      .populate('items.specialRequest', 'requestType description budget')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    transactionModel.countDocuments(query)
  ]);

  // إضافة معلومات إضافية لكل معاملة
  const enrichedTransactions = transactions.map(transaction => ({
    ...transaction,
    userRole: transaction.buyer._id.toString() === userId.toString() ? 'buyer' : 'seller',
    itemsCount: transaction.items.length,
    ageInDays: Math.floor((Date.now() - transaction.createdAt) / (1000 * 60 * 60 * 24))
  }));

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({ 
    transactions: enrichedTransactions, 
    pagination: paginationMeta,
    summary: {
      totalTransactions: totalCount,
      totalAmount: transactions.reduce((sum, t) => sum + t.pricing.totalAmount, 0),
      averageAmount: totalCount > 0 ? transactions.reduce((sum, t) => sum + t.pricing.totalAmount, 0) / totalCount : 0
    }
  }, 'تم جلب المعاملات بنجاح');
});

/**
 * الحصول على تفاصيل معاملة محددة
 */
export const getTransactionById = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const userId = req.user._id;

  const transaction = await transactionModel
    .findById(transactionId)
    .populate('buyer', 'displayName email profileImage phoneNumber')
    .populate('seller', 'displayName email profileImage phoneNumber')
    .populate('items.artwork', 'title description image price category artist')
    .populate('items.specialRequest', 'requestType description budget requirements artist')
    .populate('statusHistory.updatedBy', 'displayName email');

  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }

  // التحقق من الصلاحية
  const isOwner = transaction.buyer._id.toString() === userId.toString() || 
                  transaction.seller._id.toString() === userId.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.fail(null, 'غير مصرح لك بعرض هذه المعاملة', 403);
  }

  // إضافة معلومات إضافية
  const transactionData = transaction.toObject({ virtuals: true });
  transactionData.userRole = transaction.buyer._id.toString() === userId.toString() ? 'buyer' : 'seller';
  transactionData.canCancel = transaction.status === 'pending' && 
                              transaction.buyer._id.toString() === userId.toString();
  transactionData.canRefund = ['completed', 'delivered'].includes(transaction.status) &&
                              transaction.buyer._id.toString() === userId.toString();
  transactionData.canDispute = ['completed', 'delivered'].includes(transaction.status) &&
                               !transaction.dispute?.active;

  res.success(transactionData, 'تم جلب تفاصيل المعاملة بنجاح');
});

/**
 * تحديث حالة المعاملة
 */
export const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { status, reason, notes, trackingInfo } = req.body;
  const userId = req.user._id;

  const transaction = await transactionModel.findById(transactionId);
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }

  // التحقق من الصلاحية
  const isSeller = transaction.seller.toString() === userId.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSeller && !isAdmin) {
    return res.fail(null, 'غير مصرح لك بتعديل هذه المعاملة', 403);
  }

  // التحقق من صحة التحديث
  const validTransitions = {
    'pending': ['processing', 'confirmed', 'cancelled'],
    'processing': ['confirmed', 'cancelled'],
    'confirmed': ['shipped', 'cancelled'],
    'shipped': ['delivered', 'returned'],
    'delivered': ['completed'],
    'completed': ['refunded'],
    'cancelled': [],
    'refunded': [],
    'disputed': ['resolved']
  };

  if (!validTransitions[transaction.status]?.includes(status)) {
    return res.fail(null, `لا يمكن تغيير حالة المعاملة من ${transaction.status} إلى ${status}`, 400);
  }

  // تحديث معلومات التتبع إذا كانت متوفرة
  if (trackingInfo && status === 'shipped') {
    transaction.shipping.tracking = {
      ...transaction.shipping.tracking,
      ...trackingInfo,
      status: 'shipped',
      shippedAt: new Date()
    };
  }

  // تحديث الحالة
  await transaction.updateStatus(status, userId, reason, notes);

  // إرسال إشعارات
  const notificationData = {
    transactionId: transaction._id,
    transactionNumber: transaction.transactionNumber,
    status
  };

  // إشعار للمشتري
  await createNotificationHelper({
    recipient: transaction.buyer,
    type: 'transaction_status_updated',
    title: 'تحديث حالة الطلب',
    message: `تم تحديث حالة طلبك رقم ${transaction.transactionNumber} إلى: ${status}`,
    data: notificationData
  });

  // إشعار للبائع (إذا لم يكن هو المحدث)
  if (transaction.seller.toString() !== userId.toString()) {
    await createNotificationHelper({
      recipient: transaction.seller,
      type: 'transaction_status_updated',
      title: 'تحديث حالة الطلب',
      message: `تم تحديث حالة الطلب رقم ${transaction.transactionNumber} إلى: ${status}`,
      data: notificationData
    });
  }

  res.success(transaction, 'تم تحديث حالة المعاملة بنجاح');
});

/**
 * تحديث معلومات التتبع
 */
export const updateTrackingInfo = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { provider, trackingNumber, trackingUrl, estimatedDelivery, status } = req.body;
  const userId = req.user._id;

  const transaction = await transactionModel.findById(transactionId);
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }

  // التحقق من الصلاحية
  const isSeller = transaction.seller.toString() === userId.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isSeller && !isAdmin) {
    return res.fail(null, 'غير مصرح لك بتعديل معلومات التتبع', 403);
  }

  // تحديث معلومات التتبع
  transaction.shipping.tracking = {
    ...transaction.shipping.tracking,
    provider,
    trackingNumber,
    trackingUrl,
    estimatedDelivery,
    status: status || 'shipped',
    shippedAt: transaction.shipping.tracking.shippedAt || new Date()
  };

  await transaction.save();

  // إرسال إشعار للمشتري
  await createNotificationHelper({
    recipient: transaction.buyer,
    type: 'tracking_updated',
    title: 'تحديث معلومات الشحن',
    message: `تم تحديث معلومات شحن طلبك رقم ${transaction.transactionNumber}`,
    data: {
      transactionId: transaction._id,
      trackingNumber,
      trackingUrl
    }
  });

  res.success(transaction.shipping.tracking, 'تم تحديث معلومات التتبع بنجاح');
});

/**
 * طلب استرداد
 */
export const requestRefund = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { amount, reason, type } = req.body;
  const userId = req.user._id;

  const transaction = await transactionModel.findById(transactionId);
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }

  // التحقق من الصلاحية
  if (transaction.buyer.toString() !== userId.toString()) {
    return res.fail(null, 'غير مصرح لك بطلب استرداد لهذه المعاملة', 403);
  }

  // التحقق من إمكانية الاسترداد
  if (!['completed', 'delivered'].includes(transaction.status)) {
    return res.fail(null, 'لا يمكن طلب الاسترداد لهذه المعاملة في حالتها الحالية', 400);
  }

  if (transaction.refund.requested) {
    return res.fail(null, 'تم طلب الاسترداد مسبقاً لهذه المعاملة', 400);
  }

  // تحديد مبلغ الاسترداد
  const refundAmount = type === 'partial' && amount ? 
    Math.min(amount, transaction.pricing.totalAmount) : 
    transaction.pricing.totalAmount;

  // معالجة طلب الاسترداد
  await transaction.processRefund(refundAmount, reason, userId);

  // إرسال إشعار للبائع
  await createNotificationHelper({
    recipient: transaction.seller,
    type: 'refund_requested',
    title: 'طلب استرداد',
    message: `تم طلب استرداد للطلب رقم ${transaction.transactionNumber}`,
    data: {
      transactionId: transaction._id,
      refundAmount,
      reason
    }
  });

  res.success(transaction.refund, 'تم تقديم طلب الاسترداد بنجاح');
});

/**
 * فتح نزاع
 */
export const openDispute = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { reason, description, evidence } = req.body;
  const userId = req.user._id;

  const transaction = await transactionModel.findById(transactionId);
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }

  // التحقق من الصلاحية
  const isParty = transaction.buyer.toString() === userId.toString() || 
                  transaction.seller.toString() === userId.toString();

  if (!isParty) {
    return res.fail(null, 'غير مصرح لك بفتح نزاع لهذه المعاملة', 403);
  }

  // التحقق من إمكانية فتح النزاع
  if (transaction.dispute.active) {
    return res.fail(null, 'يوجد نزاع مفتوح بالفعل لهذه المعاملة', 400);
  }

  if (!['completed', 'delivered', 'shipped'].includes(transaction.status)) {
    return res.fail(null, 'لا يمكن فتح نزاع لهذه المعاملة في حالتها الحالية', 400);
  }

  // فتح النزاع
  await transaction.openDispute(reason, description, userId);

  // تحديث حالة المعاملة
  transaction.status = 'disputed';
  await transaction.save();

  // إرسال إشعار للطرف الآخر
  const otherParty = transaction.buyer.toString() === userId.toString() ? 
    transaction.seller : transaction.buyer;

  await createNotificationHelper({
    recipient: otherParty,
    type: 'dispute_opened',
    title: 'نزاع جديد',
    message: `تم فتح نزاع للطلب رقم ${transaction.transactionNumber}`,
    data: {
      transactionId: transaction._id,
      reason,
      description
    }
  });

  res.success(transaction.dispute, 'تم فتح النزاع بنجاح');
});

/**
 * الحصول على إحصائيات المعاملات
 */
export const getTransactionStats = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { period, startDate, endDate, groupBy, includeRefunds, includeDisputes } = req.query;

  // بناء فلتر التاريخ
  let dateFilter = {};
  if (period && period !== 'all') {
    const now = new Date();
    const periodMap = {
      'day': () => new Date(now.setHours(0, 0, 0, 0)),
      'week': () => new Date(now.setDate(now.getDate() - 7)),
      'month': () => new Date(now.setMonth(now.getMonth() - 1)),
      'quarter': () => new Date(now.setMonth(now.getMonth() - 3)),
      'year': () => new Date(now.setFullYear(now.getFullYear() - 1))
    };
    
    if (periodMap[period]) {
      dateFilter.createdAt = { $gte: periodMap[period]() };
    }
  } else if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
    if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
  }

  // إحصائيات كمشتري
  const buyerStats = await transactionModel.getTransactionStats(userId, 'buyer');
  
  // إحصائيات كبائع
  const sellerStats = await transactionModel.getTransactionStats(userId, 'seller');

  // إحصائيات مفصلة بناءً على التجميع
  let detailedStats = [];
  const baseQuery = {
    $or: [{ buyer: userId }, { seller: userId }],
    ...dateFilter
  };

  if (!includeRefunds) {
    baseQuery.status = { $ne: 'refunded' };
  }
  if (!includeDisputes) {
    baseQuery['dispute.active'] = { $ne: true };
  }

  switch (groupBy) {
    case 'status':
      detailedStats = await transactionModel.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$pricing.totalAmount' },
            avgAmount: { $avg: '$pricing.totalAmount' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      break;

    case 'method':
      detailedStats = await transactionModel.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$payment.method',
            count: { $sum: 1 },
            totalAmount: { $sum: '$pricing.totalAmount' },
            avgAmount: { $avg: '$pricing.totalAmount' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      break;

    case 'currency':
      detailedStats = await transactionModel.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: '$currency',
            count: { $sum: 1 },
            totalAmount: { $sum: '$pricing.totalAmount' },
            avgAmount: { $avg: '$pricing.totalAmount' }
          }
        },
        { $sort: { count: -1 } }
      ]);
      break;

    case 'date':
      detailedStats = await transactionModel.aggregate([
        { $match: baseQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            totalAmount: { $sum: '$pricing.totalAmount' },
            avgAmount: { $avg: '$pricing.totalAmount' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
      ]);
      break;
  }

  // إحصائيات إضافية
  const additionalStats = await transactionModel.aggregate([
    { $match: baseQuery },
    {
      $group: {
        _id: null,
        totalCommission: { $sum: '$pricing.commissionAmount' },
        totalTax: { $sum: '$pricing.taxAmount' },
        totalShipping: { $sum: '$pricing.shippingCost' },
        avgProcessingTime: {
          $avg: {
            $subtract: [
              { $ifNull: ['$completedAt', new Date()] },
              '$createdAt'
            ]
          }
        }
      }
    }
  ]);

  res.success({
    summary: {
      buyer: buyerStats,
      seller: sellerStats,
      combined: {
        totalTransactions: buyerStats.totalTransactions + sellerStats.totalTransactions,
        totalAmount: buyerStats.totalAmount + sellerStats.totalAmount,
        avgAmount: (buyerStats.avgAmount + sellerStats.avgAmount) / 2
      }
    },
    detailed: detailedStats,
    additional: additionalStats[0] || {},
    period: period || 'custom',
    groupBy: groupBy || 'status'
  }, 'تم جلب الإحصائيات بنجاح');
});

/**
 * العمليات المجمعة على المعاملات
 */
export const bulkUpdateTransactions = asyncHandler(async (req, res) => {
  const { transactionIds, action, reason, notes } = req.body;
  const userId = req.user._id;

  // التحقق من الصلاحية (المدير فقط)
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بتنفيذ العمليات المجمعة', 403);
  }

  // التحقق من وجود المعاملات
  const transactions = await transactionModel.find({
    _id: { $in: transactionIds }
  });

  if (transactions.length !== transactionIds.length) {
    return res.fail(null, 'بعض المعاملات غير موجودة', 404);
  }

  // تنفيذ العملية المطلوبة
  const results = [];
  const statusMap = {
    'cancel': 'cancelled',
    'confirm': 'confirmed',
    'ship': 'shipped',
    'complete': 'completed'
  };

  const newStatus = statusMap[action];
  if (!newStatus) {
    return res.fail(null, 'العملية غير صالحة', 400);
  }

  for (const transaction of transactions) {
    try {
      await transaction.updateStatus(newStatus, userId, reason, notes);
      results.push({
        transactionId: transaction._id,
        transactionNumber: transaction.transactionNumber,
        success: true,
        newStatus
      });

      // إرسال إشعارات
      await createNotificationHelper({
        recipient: transaction.buyer,
        type: 'transaction_bulk_updated',
        title: 'تحديث جماعي للطلبات',
        message: `تم تحديث حالة طلبك رقم ${transaction.transactionNumber}`,
        data: { transactionId: transaction._id, newStatus }
      });

    } catch (error) {
      results.push({
        transactionId: transaction._id,
        transactionNumber: transaction.transactionNumber,
        success: false,
        error: error.message
      });
    }
  }

  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;

  res.success({
    results,
    summary: {
      total: transactionIds.length,
      successful: successCount,
      failed: failureCount
    }
  }, `تم تحديث ${successCount} معاملة من أصل ${transactionIds.length}`);
});

/**
 * تصدير بيانات المعاملات
 */
export const exportTransactions = asyncHandler(async (req, res) => {
  const { format, startDate, endDate, status, includeItems, includeShipping, includePayment } = req.query;
  const userId = req.user._id;

  // بناء الاستعلام
  let query = {
    $or: [{ buyer: userId }, { seller: userId }]
  };

  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  if (status && Array.isArray(status)) {
    query.status = { $in: status };
  }

  // جلب البيانات
  const transactions = await transactionModel
    .find(query)
    .populate('buyer', 'displayName email')
    .populate('seller', 'displayName email')
    .populate('items.artwork', 'title price')
    .populate('items.specialRequest', 'requestType budget')
    .sort({ createdAt: -1 })
    .lean();

  // تحضير البيانات للتصدير
  const exportData = transactions.map(transaction => {
    const baseData = {
      transactionNumber: transaction.transactionNumber,
      status: transaction.status,
      totalAmount: transaction.pricing.totalAmount,
      currency: transaction.currency,
      createdAt: transaction.createdAt,
      completedAt: transaction.completedAt,
      buyerName: transaction.buyer.displayName,
      sellerName: transaction.seller.displayName
    };

    if (includeItems === 'true') {
      baseData.itemsCount = transaction.items.length;
      baseData.items = transaction.items.map(item => ({
        type: item.artwork ? 'artwork' : 'specialRequest',
        title: item.artwork?.title || item.specialRequest?.requestType,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      }));
    }

    if (includeShipping === 'true') {
      baseData.shippingMethod = transaction.shipping.method;
      baseData.shippingCost = transaction.shipping.cost;
      baseData.shippingAddress = transaction.shipping.address;
    }

    if (includePayment === 'true') {
      baseData.paymentMethod = transaction.payment.method;
      baseData.paymentProvider = transaction.payment.provider;
    }

    return baseData;
  });

  // تحديد نوع المحتوى بناءً على التنسيق
  const contentTypes = {
    'csv': 'text/csv',
    'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pdf': 'application/pdf'
  };

  res.setHeader('Content-Type', contentTypes[format] || 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="transactions.${format}"`);

  // في التطبيق الحقيقي، ستحتاج إلى مكتبات لتحويل البيانات للتنسيقات المختلفة
  if (format === 'csv') {
    // تحويل إلى CSV (مبسط)
    const csvHeaders = Object.keys(exportData[0] || {}).join(',');
    const csvRows = exportData.map(row => Object.values(row).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    res.send(csvContent);
  } else {
    // إرجاع JSON كافتراضي
    res.success(exportData, `تم تصدير ${exportData.length} معاملة بنجاح`);
  }
});

/**
 * دفع قسط
 */
export const payInstallment = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { installmentNumber, amount, paymentMethod, paymentId } = req.body;
  const userId = req.user._id;

  const transaction = await transactionModel.findById(transactionId);
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }

  // التحقق من الصلاحية
  if (transaction.buyer.toString() !== userId.toString()) {
    return res.fail(null, 'غير مصرح لك بدفع أقساط هذه المعاملة', 403);
  }

  // التحقق من وجود نظام التقسيط
  if (!transaction.installments.enabled) {
    return res.fail(null, 'هذه المعاملة لا تستخدم نظام التقسيط', 400);
  }

  // العثور على القسط
  const installment = transaction.installments.schedule.find(
    inst => inst.installmentNumber === installmentNumber
  );

  if (!installment) {
    return res.fail(null, 'القسط المحدد غير موجود', 404);
  }

  if (installment.status === 'paid') {
    return res.fail(null, 'تم دفع هذا القسط مسبقاً', 400);
  }

  // تحديث حالة القسط
  installment.status = 'paid';
  installment.paidAt = new Date();

  // تحديث معلومات التقسيط العامة
  transaction.installments.paidInstallments += 1;
  
  // تحديد القسط التالي
  const nextInstallment = transaction.installments.schedule.find(
    inst => inst.status === 'pending'
  );
  transaction.installments.nextDueDate = nextInstallment?.dueDate || null;

  // التحقق من اكتمال جميع الأقساط
  if (transaction.installments.paidInstallments === transaction.installments.totalInstallments) {
    transaction.status = 'completed';
    transaction.completedAt = new Date();
  }

  await transaction.save();

  // إرسال إشعار
  await createNotificationHelper({
    recipient: transaction.seller,
    type: 'installment_paid',
    title: 'تم دفع قسط',
    message: `تم دفع القسط رقم ${installmentNumber} للطلب ${transaction.transactionNumber}`,
    data: {
      transactionId: transaction._id,
      installmentNumber,
      amount: installment.amount
    }
  });

  res.success({
    installment,
    installmentProgress: transaction.installmentProgress,
    transactionStatus: transaction.status
  }, 'تم دفع القسط بنجاح');
});

/**
 * إلغاء معاملة
 */
export const cancelTransaction = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;
  const { reason } = req.body;
  const userId = req.user._id;

  const transaction = await transactionModel.findById(transactionId);
  if (!transaction) {
    return res.fail(null, 'المعاملة غير موجودة', 404);
  }

  // التحقق من الصلاحية
  const canCancel = transaction.buyer.toString() === userId.toString() || 
                    req.user.role === 'admin';

  if (!canCancel) {
    return res.fail(null, 'غير مصرح لك بإلغاء هذه المعاملة', 403);
  }

  // التحقق من إمكانية الإلغاء
  if (!['pending', 'processing'].includes(transaction.status)) {
    return res.fail(null, 'لا يمكن إلغاء المعاملة في حالتها الحالية', 400);
  }

  // إلغاء المعاملة
  await transaction.updateStatus('cancelled', userId, reason, 'تم إلغاء المعاملة بواسطة المستخدم');

  // إعادة توفر العناصر
  for (const item of transaction.items) {
    if (item.artwork) {
      await artworkModel.findByIdAndUpdate(item.artwork, { isAvailable: true });
    } else if (item.specialRequest) {
      await specialRequestModel.findByIdAndUpdate(item.specialRequest, { 
        status: 'accepted' // إعادة للحالة المقبولة
      });
    }
  }

  // إرسال إشعارات
  await createNotificationHelper({
    recipient: transaction.seller,
    type: 'transaction_cancelled',
    title: 'تم إلغاء طلب',
    message: `تم إلغاء الطلب رقم ${transaction.transactionNumber}`,
    data: { transactionId: transaction._id, reason }
  });

  res.success(transaction, 'تم إلغاء المعاملة بنجاح');
});
