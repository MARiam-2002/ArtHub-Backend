import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { getPaginationParams } from '../../utils/pagination.js';
import { sendPushNotificationToUser } from '../../utils/pushNotifications.js';

/**
 * إنشاء طلب خاص جديد
 */
export const createSpecialRequest = asyncHandler(async (req, res) => {
  const { artist, requestType, description, budget, deadline, attachments } = req.body;
  const sender = req.user._id;

  // التحقق من وجود الفنان
  const artistExists = await userModel.findOne({ _id: artist, role: 'artist' });
  if (!artistExists) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  // إنشاء الطلب
  const specialRequest = await specialRequestModel.create({
    sender,
    artist,
    requestType,
    description,
    budget,
    deadline: deadline ? new Date(deadline) : undefined,
    attachments: attachments || []
  });

  // إرسال إشعار للفنان
  const user = await userModel.findById(sender).select('displayName');

  // إرسال إشعار للفنان
  await sendPushNotificationToUser(
    artist,
    {
      title: 'طلب خاص جديد',
      body: `لديك طلب خاص جديد من ${user.displayName}`
    },
    {
      screen: 'SPECIAL_REQUEST_DETAILS',
      requestId: specialRequest._id.toString(),
      type: 'new_special_request'
    }
  );

  res.status(201).success(specialRequest, 'تم إنشاء الطلب الخاص بنجاح');
});

/**
 * الحصول على طلبات المستخدم
 */
export const getUserRequests = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status } = req.query;

  // بناء الاستعلام
  const query = { sender: userId };
  if (status && ['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
    query.status = status;
  }

  // تنفيذ الاستعلام
  const [requests, totalCount] = await Promise.all([
    specialRequestModel
      .find(query)
      .populate('artist', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    specialRequestModel.countDocuments(query)
  ]);

  // إعداد معلومات الصفحات
  const paginationMeta = {
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: limit
  };

  res.success({ requests, pagination: paginationMeta }, 'تم جلب الطلبات بنجاح');
});

/**
 * الحصول على طلبات الفنان
 */
export const getArtistRequests = asyncHandler(async (req, res) => {
  const artistId = req.user._id;
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status } = req.query;

  // التحقق من أن المستخدم فنان
  if (req.user.role !== 'artist') {
    return res.fail(null, 'غير مصرح لك بعرض طلبات الفنانين', 403);
  }

  // بناء الاستعلام
  const query = { artist: artistId };
  if (status && ['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
    query.status = status;
  }

  // تنفيذ الاستعلام
  const [requests, totalCount] = await Promise.all([
    specialRequestModel
      .find(query)
      .populate('sender', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    specialRequestModel.countDocuments(query)
  ]);

  // إعداد معلومات الصفحات
  const paginationMeta = {
    currentPage: page,
    totalPages: Math.ceil(totalCount / limit),
    totalItems: totalCount,
    itemsPerPage: limit
  };

  res.success({ requests, pagination: paginationMeta }, 'تم جلب طلبات الفنان بنجاح');
});

/**
 * الحصول على إحصائيات طلبات الفنان
 */
export const getArtistRequestStats = asyncHandler(async (req, res) => {
  const artistId = req.user._id;

  // التحقق من أن المستخدم فنان
  if (req.user.role !== 'artist') {
    return res.fail(null, 'غير مصرح لك بعرض إحصائيات الفنانين', 403);
  }

  // الحصول على إحصائيات الطلبات
  const stats = await specialRequestModel.aggregate([
    { $match: { artist: mongoose.Types.ObjectId(artistId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' }
      }
    }
  ]);

  // تنسيق النتائج
  const formattedStats = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0,
    totalBudget: 0
  };

  stats.forEach(stat => {
    if (stat._id) {
      formattedStats[stat._id] = stat.count;
      if (stat._id === 'completed') {
        formattedStats.totalBudget = stat.totalBudget;
      }
    }
  });

  // إضافة العدد الإجمالي
  formattedStats.total =
    formattedStats.pending +
    formattedStats.accepted +
    formattedStats.rejected +
    formattedStats.completed;

  res.success(formattedStats, 'تم جلب إحصائيات الطلبات بنجاح');
});

/**
 * الحصول على تفاصيل طلب محدد
 */
export const getRequestById = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  // جلب الطلب
  const request = await specialRequestModel
    .findById(requestId)
    .populate('sender', 'displayName profileImage email')
    .populate('artist', 'displayName profileImage email');

  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }

  // التحقق من أن المستخدم هو صاحب الطلب أو الفنان
  const isSender = request.sender._id.toString() === userId.toString();
  const isArtist = request.artist._id.toString() === userId.toString();

  if (!isSender && !isArtist) {
    return res.fail(null, 'غير مصرح لك بعرض هذا الطلب', 403);
  }

  res.success(request, 'تم جلب تفاصيل الطلب بنجاح');
});

/**
 * تحديث حالة الطلب
 */
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status, response } = req.body;
  const artistId = req.user._id;

  // التحقق من أن المستخدم فنان
  if (req.user.role !== 'artist') {
    return res.fail(null, 'غير مصرح لك بتحديث حالة الطلب', 403);
  }

  // جلب الطلب
  const request = await specialRequestModel.findOne({
    _id: requestId,
    artist: artistId
  });

  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }

  // تحديث حالة الطلب
  request.status = status;
  if (response) {
    request.response = response;
  }

  // إذا تم إكمال الطلب، تعيين تاريخ الإكمال
  if (status === 'completed') {
    request.completedAt = new Date();
  }

  await request.save();

  // إرسال إشعار للمستخدم
  const statusMessages = {
    accepted: 'تم قبول طلبك الخاص',
    rejected: 'تم رفض طلبك الخاص',
    completed: 'تم إكمال طلبك الخاص'
  };

  if (statusMessages[status]) {
    await sendPushNotificationToUser(
      request.sender.toString(),
      {
        title: statusMessages[status],
        body:
          response ||
          `تم ${status === 'accepted' ? 'قبول' : status === 'rejected' ? 'رفض' : 'إكمال'} طلبك الخاص`
      },
      {
        screen: 'SPECIAL_REQUEST_DETAILS',
        requestId: request._id.toString(),
        type: 'special_request_update'
      }
    );
  }

  res.success(request, `تم تحديث حالة الطلب إلى "${status}" بنجاح`);
});

/**
 * إضافة رد على الطلب
 */
export const addResponseToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { response } = req.body;
  const userId = req.user._id;

  // جلب الطلب
  const request = await specialRequestModel.findById(requestId);

  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }

  // التحقق من أن المستخدم هو صاحب الطلب أو الفنان
  const isSender = request.sender.toString() === userId.toString();
  const isArtist = request.artist.toString() === userId.toString();

  if (!isSender && !isArtist) {
    return res.fail(null, 'غير مصرح لك بإضافة رد على هذا الطلب', 403);
  }

  // إضافة الرد
  request.response = response;
  await request.save();

  // إرسال إشعار للطرف الآخر
  const recipientId = isSender ? request.artist.toString() : request.sender.toString();
  const sender = await userModel.findById(userId).select('displayName');

  await sendPushNotificationToUser(
    recipientId,
    {
      title: 'رد جديد على الطلب الخاص',
      body: `تم إضافة رد جديد من ${sender.displayName} على الطلب الخاص`
    },
    {
      screen: 'SPECIAL_REQUEST_DETAILS',
      requestId: request._id.toString(),
      type: 'special_request_response'
    }
  );

  res.success(request, 'تم إضافة الرد بنجاح');
});

/**
 * إكمال الطلب
 */
export const completeRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { deliverables, finalNote } = req.body;
  const artistId = req.user._id;

  // التحقق من أن المستخدم فنان
  if (req.user.role !== 'artist') {
    return res.fail(null, 'غير مصرح لك بإكمال الطلب', 403);
  }

  // جلب الطلب
  const request = await specialRequestModel.findOne({
    _id: requestId,
    artist: artistId
  });

  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }

  // التحقق من أن الطلب مقبول
  if (request.status !== 'accepted') {
    return res.fail(null, 'لا يمكن إكمال طلب غير مقبول', 400);
  }

  // تحديث الطلب
  request.status = 'completed';
  request.deliverables = deliverables || [];
  if (finalNote) {
    request.finalNote = finalNote;
  }
  request.completedAt = new Date();

  await request.save();

  // إرسال إشعار للمستخدم
  await sendPushNotificationToUser(
    request.sender.toString(),
    {
      title: 'تم إكمال طلبك الخاص',
      body: 'قام الفنان بإكمال طلبك الخاص وتسليم العمل'
    },
    {
      screen: 'SPECIAL_REQUEST_DETAILS',
      requestId: request._id.toString(),
      type: 'special_request_completed'
    }
  );

  res.success(request, 'تم إكمال الطلب بنجاح');
});

/**
 * حذف طلب
 */
export const deleteRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  // جلب الطلب
  const request = await specialRequestModel.findById(requestId);

  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }

  // التحقق من أن المستخدم هو صاحب الطلب
  if (request.sender.toString() !== userId.toString()) {
    return res.fail(null, 'غير مصرح لك بحذف هذا الطلب', 403);
  }

  // التحقق من أن حالة الطلب تسمح بالحذف
  if (request.status !== 'pending' && request.status !== 'rejected') {
    return res.fail(null, 'لا يمكن حذف طلب مقبول أو مكتمل', 400);
  }

  // حذف الطلب
  await specialRequestModel.findByIdAndDelete(requestId);

  res.success(null, 'تم حذف الطلب بنجاح');
});

/**
 * إلغاء طلب خاص
 */
export const cancelSpecialRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const userId = req.user._id;

  // البحث عن الطلب
  const request = await specialRequestModel.findById(requestId);

  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }

  // التحقق من أن المستخدم هو صاحب الطلب
  if (request.sender.toString() !== userId.toString()) {
    return res.fail(null, 'غير مصرح لك بإلغاء هذا الطلب', 403);
  }

  // التحقق من حالة الطلب (يمكن إلغاء الطلبات في حالة الانتظار أو المقبولة فقط)
  if (!['pending', 'accepted'].includes(request.status)) {
    return res.fail(null, 'لا يمكن إلغاء هذا الطلب في حالته الحالية', 400);
  }

  // تحديث حالة الطلب إلى ملغي
  request.status = 'cancelled';
  request.cancellationReason = req.body.cancellationReason || 'تم الإلغاء من قبل المستخدم';
  request.cancelledAt = new Date();
  await request.save();

  // إرسال إشعار للفنان
  const user = await userModel.findById(userId).select('displayName');

  await sendPushNotificationToUser(
    request.artist,
    {
      title: 'تم إلغاء طلب خاص',
      body: `قام ${user.displayName} بإلغاء الطلب الخاص`
    },
    {
      screen: 'SPECIAL_REQUEST_DETAILS',
      requestId: request._id.toString(),
      type: 'cancelled_special_request'
    }
  );

  res.success({ success: true }, 'تم إلغاء الطلب الخاص بنجاح');
});
