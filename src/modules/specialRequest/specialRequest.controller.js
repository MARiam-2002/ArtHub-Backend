import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';

/**
 * إنشاء طلب خاص جديد
 */
export const createSpecialRequest = asyncHandler(async (req, res) => {
  const { artist, requestType, description, budget, deadline, attachments } = req.body;
  const sender = req.user._id;
  
  // التحقق مما إذا كان الفنان موجودًا
  const artistExists = await userModel.findOne({ _id: artist, role: 'artist' });
  if (!artistExists) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }
  
  const request = await specialRequestModel.create({
    sender,
    artist,
    requestType,
    description,
    budget,
    deadline: deadline || undefined,
    attachments: attachments || []
  });
  
  // إرسال إشعار للفنان (يمكن إضافته لاحقًا)
  
  res.success(request, 'تم إنشاء الطلب الخاص بنجاح', 201);
});

/**
 * الحصول على طلبات المستخدم المرسلة
 */
export const getUserRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, sortBy, sortOrder } = req.query;
  
  // بناء استعلام البحث
  const query = { sender: req.user._id };
  if (status && ['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
    query.status = status;
  }
  
  // تحديد ترتيب النتائج
  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1; // افتراضيًا: الأحدث أولاً
  }
  
  const [requests, totalCount] = await Promise.all([
    specialRequestModel.find(query)
      .populate('artist', 'displayName email job profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    specialRequestModel.countDocuments(query)
  ]);
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  
  res.success({ requests, pagination: paginationMeta }, 'تم جلب طلبات المستخدم بنجاح');
});

/**
 * الحصول على الطلبات المرسلة إلى الفنان
 */
export const getArtistRequests = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, sortBy, sortOrder } = req.query;
  
  // التحقق من أن المستخدم هو فنان
  const user = await userModel.findById(req.user._id);
  if (user.role !== 'artist') {
    return res.fail(null, 'غير مصرح لك بعرض طلبات الفنانين', 403);
  }
  
  // بناء استعلام البحث
  const query = { artist: req.user._id };
  if (status && ['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
    query.status = status;
  }
  
  // تحديد ترتيب النتائج
  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1; // افتراضيًا: الأحدث أولاً
  }
  
  const [requests, totalCount] = await Promise.all([
    specialRequestModel.find(query)
      .populate('sender', 'displayName email job profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    specialRequestModel.countDocuments(query)
  ]);
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  
  res.success({ requests, pagination: paginationMeta }, 'تم جلب طلبات الفنان بنجاح');
});

/**
 * الحصول على تفاصيل طلب خاص بواسطة المعرف
 */
export const getRequestById = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  
  const request = await specialRequestModel.findById(requestId)
    .populate('sender', 'displayName email job profileImage')
    .populate('artist', 'displayName email job profileImage');
  
  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }
  
  // التحقق من أن المستخدم هو المرسل أو الفنان
  if (request.sender._id.toString() !== req.user._id.toString() && 
      request.artist._id.toString() !== req.user._id.toString()) {
    return res.fail(null, 'غير مصرح لك بعرض هذا الطلب', 403);
  }
  
  res.success(request, 'تم جلب تفاصيل الطلب بنجاح');
});

/**
 * تحديث حالة الطلب (للفنان)
 */
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { status, response } = req.body;
  
  if (!['pending', 'accepted', 'rejected', 'completed'].includes(status)) {
    return res.fail(null, 'حالة غير صالحة', 400);
  }
  
  const request = await specialRequestModel.findOne({ _id: requestId, artist: req.user._id });
  
  if (!request) {
    return res.fail(null, 'الطلب غير موجود أو غير مصرح', 404);
  }
  
  // تحديث حالة الطلب
  request.status = status;
  if (response) {
    request.response = response;
  }
  
  await request.save();
  
  // إرسال إشعار للمستخدم بتغيير الحالة (يمكن إضافته لاحقًا)
  
  res.success(request, 'تم تحديث حالة الطلب بنجاح');
});

/**
 * إضافة تعليق أو رد إلى الطلب
 */
export const addResponseToRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { response } = req.body;
  
  const request = await specialRequestModel.findById(requestId);
  
  if (!request) {
    return res.fail(null, 'الطلب غير موجود', 404);
  }
  
  // التحقق من أن المستخدم هو المرسل أو الفنان
  if (request.sender.toString() !== req.user._id.toString() && 
      request.artist.toString() !== req.user._id.toString()) {
    return res.fail(null, 'غير مصرح لك بتعديل هذا الطلب', 403);
  }
  
  request.response = response;
  await request.save();
  
  res.success(request, 'تم إضافة الرد بنجاح');
});

/**
 * إكمال الطلب (للفنان)
 */
export const completeRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  const { deliverables, finalNote } = req.body;
  
  const request = await specialRequestModel.findOne({ _id: requestId, artist: req.user._id });
  
  if (!request) {
    return res.fail(null, 'الطلب غير موجود أو غير مصرح', 404);
  }
  
  if (request.status !== 'accepted') {
    return res.fail(null, 'لا يمكن إكمال طلب غير مقبول', 400);
  }
  
  // تحديث حالة الطلب وإضافة روابط التسليم والملاحظات النهائية
  request.status = 'completed';
  request.deliverables = deliverables || [];
  request.finalNote = finalNote;
  request.completedAt = new Date();
  
  await request.save();
  
  // إرسال إشعار للمستخدم (يمكن إضافته لاحقًا)
  
  res.success(request, 'تم إكمال الطلب بنجاح');
});

/**
 * حذف طلب (للمرسل فقط)
 */
export const deleteRequest = asyncHandler(async (req, res) => {
  const { requestId } = req.params;
  
  const request = await specialRequestModel.findOne({ _id: requestId, sender: req.user._id });
  
  if (!request) {
    return res.fail(null, 'الطلب غير موجود أو غير مصرح بحذفه', 404);
  }
  
  // لا يمكن حذف الطلبات المقبولة أو المكتملة
  if (['accepted', 'completed'].includes(request.status)) {
    return res.fail(null, 'لا يمكن حذف طلب مقبول أو مكتمل', 400);
  }
  
  await specialRequestModel.deleteOne({ _id: requestId });
  
  res.success(null, 'تم حذف الطلب بنجاح');
});

/**
 * الحصول على إحصائيات الطلبات للفنان
 */
export const getArtistRequestStats = asyncHandler(async (req, res) => {
  // التحقق من أن المستخدم هو فنان
  const user = await userModel.findById(req.user._id);
  if (user.role !== 'artist') {
    return res.fail(null, 'غير مصرح لك بعرض إحصائيات الفنانين', 403);
  }
  
  const stats = await specialRequestModel.aggregate([
    { $match: { artist: req.user._id } },
    { $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' }
      }
    }
  ]);
  
  // تنسيق البيانات
  const formattedStats = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0,
    totalBudget: 0
  };
  
  stats.forEach(stat => {
    formattedStats[stat._id] = stat.count;
    if (stat._id === 'completed') {
      formattedStats.totalBudget = stat.totalBudget;
    }
  });
  
  res.success(formattedStats, 'تم جلب إحصائيات الطلبات بنجاح');
}); 