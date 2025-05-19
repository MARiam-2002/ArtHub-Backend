import reportModel from '../../../DB/models/report.model.js';
import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import imageModel from '../../../DB/models/image.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import mongoose from 'mongoose';

/**
 * إنشاء تقرير جديد
 */
export const createReport = asyncHandler(async (req, res) => {
  const { contentType, contentId, reason, description } = req.body;
  const reporter = req.user._id;
  
  // التحقق من وجود المحتوى المبلغ عنه
  let targetUser;
  let contentExists = false;
  
  switch (contentType) {
    case 'artwork':
      const artwork = await artworkModel.findById(contentId);
      if (artwork) {
        contentExists = true;
        targetUser = artwork.artist;
      }
      break;
    case 'image':
      const image = await imageModel.findById(contentId);
      if (image) {
        contentExists = true;
        targetUser = image.user;
      }
      break;
    case 'user':
      const user = await userModel.findById(contentId);
      if (user) {
        contentExists = true;
        targetUser = contentId;
      }
      break;
    // يمكن إضافة المزيد من الأنواع هنا مثل التعليقات والرسائل
    default:
      return res.fail(null, 'نوع محتوى غير صالح', 400);
  }
  
  if (!contentExists) {
    return res.fail(null, 'المحتوى المبلغ عنه غير موجود', 404);
  }
  
  // التحقق من عدم وجود تقرير سابق للمحتوى ذاته من نفس المستخدم
  const existingReport = await reportModel.findOne({
    reporter,
    contentType,
    contentId,
    status: { $ne: 'rejected' } // بحيث يمكن الإبلاغ مرة أخرى إذا تم رفض التقرير السابق
  });
  
  if (existingReport) {
    return res.fail(null, 'لقد قمت بالإبلاغ عن هذا المحتوى من قبل', 400);
  }
  
  // إنشاء التقرير
  const report = await reportModel.create({
    reporter,
    contentType,
    contentId,
    targetUser,
    reason,
    description
  });
  
  res.success(report, 'تم إرسال التقرير بنجاح، سيتم مراجعته', 201);
});

/**
 * الحصول على تقارير المستخدم
 */
export const getUserReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status } = req.query;
  
  // بناء استعلام البحث
  const query = { reporter: req.user._id };
  if (status && ['pending', 'resolved', 'rejected'].includes(status)) {
    query.status = status;
  }
  
  const [reports, totalCount] = await Promise.all([
    reportModel.find(query)
      .populate('targetUser', 'displayName email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    reportModel.countDocuments(query)
  ]);
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  
  res.success({ reports, pagination: paginationMeta }, 'تم جلب التقارير بنجاح');
});

/**
 * الحصول على تفاصيل تقرير
 */
export const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  
  const report = await reportModel.findById(reportId)
    .populate('reporter', 'displayName email')
    .populate('targetUser', 'displayName email');
  
  if (!report) {
    return res.fail(null, 'التقرير غير موجود', 404);
  }
  
  // التحقق من أن المستخدم هو المبلغ أو مدير
  if (report.reporter._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض هذا التقرير', 403);
  }
  
  res.success(report, 'تم جلب تفاصيل التقرير بنجاح');
});

/**
 * حذف تقرير (للمستخدم المبلغ فقط)
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  
  const report = await reportModel.findOne({
    _id: reportId,
    reporter: req.user._id,
    status: 'pending' // يمكن حذف التقرير فقط إذا كان قيد الانتظار
  });
  
  if (!report) {
    return res.fail(null, 'التقرير غير موجود أو لا يمكن حذفه', 404);
  }
  
  await reportModel.deleteOne({ _id: reportId });
  
  res.success(null, 'تم حذف التقرير بنجاح');
});

/**
 * عرض إحصائيات التقارير (للمدير فقط)
 */
export const getReportStats = asyncHandler(async (req, res) => {
  // التحقق من أن المستخدم هو مدير
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض إحصائيات التقارير', 403);
  }
  
  const stats = await reportModel.aggregate([
    {
      $group: {
        _id: {
          status: '$status',
          contentType: '$contentType'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.contentType',
        statuses: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    }
  ]);
  
  // تنسيق النتائج
  const formattedStats = {
    total: 0,
    pending: 0,
    resolved: 0,
    rejected: 0,
    byType: {}
  };
  
  stats.forEach(item => {
    formattedStats.byType[item._id] = {
      total: item.total,
      pending: 0,
      resolved: 0,
      rejected: 0
    };
    
    item.statuses.forEach(statusItem => {
      formattedStats.byType[item._id][statusItem.status] = statusItem.count;
      formattedStats[statusItem.status] += statusItem.count;
    });
    
    formattedStats.total += item.total;
  });
  
  res.success(formattedStats, 'تم جلب إحصائيات التقارير بنجاح');
});

/**
 * الحصول على قائمة التقارير (للمدير فقط)
 */
export const getAllReports = asyncHandler(async (req, res) => {
  // التحقق من أن المستخدم هو مدير
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض قائمة التقارير', 403);
  }
  
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, contentType, sortBy, sortOrder } = req.query;
  
  // بناء استعلام البحث
  const query = {};
  if (status && ['pending', 'resolved', 'rejected'].includes(status)) {
    query.status = status;
  }
  if (contentType && ['artwork', 'image', 'user', 'comment', 'message'].includes(contentType)) {
    query.contentType = contentType;
  }
  
  // تحديد ترتيب النتائج
  const sort = {};
  if (sortBy) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1; // افتراضيًا: الأحدث أولاً
  }
  
  const [reports, totalCount] = await Promise.all([
    reportModel.find(query)
      .populate('reporter', 'displayName email')
      .populate('targetUser', 'displayName email')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    reportModel.countDocuments(query)
  ]);
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  
  res.success({ reports, pagination: paginationMeta }, 'تم جلب قائمة التقارير بنجاح');
});

/**
 * تحديث حالة التقرير (للمدير فقط)
 */
export const updateReportStatus = asyncHandler(async (req, res) => {
  // التحقق من أن المستخدم هو مدير
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بتحديث حالة التقارير', 403);
  }
  
  const { reportId } = req.params;
  const { status, adminNotes } = req.body;
  
  const report = await reportModel.findById(reportId);
  if (!report) {
    return res.fail(null, 'التقرير غير موجود', 404);
  }
  
  // تحديث حالة التقرير
  report.status = status;
  if (adminNotes) {
    report.adminNotes = adminNotes;
  }
  
  await report.save();
  
  res.success(report, 'تم تحديث حالة التقرير بنجاح');
}); 