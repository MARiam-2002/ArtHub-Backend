import reportModel from '../../../DB/models/report.model.js';
import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import notificationModel from '../../../DB/models/notification.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { createNotification } from '../notification/notification.controller.js';
import mongoose from 'mongoose';

/**
 * الحصول على جميع التقارير (للمدير)
 * @route GET /api/reports/admin/all
 * @access Private (Admin)
 */
export const getAllReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, contentType, reason, priority, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

  // بناء استعلام البحث
  const query = {};
  
  if (status) query.status = status;
  if (contentType) query.contentType = contentType;
  if (reason) query.reason = reason;
  if (priority) query.priority = priority;
  
  // البحث في الوصف أو عنوان المحتوى
  if (search) {
    query.$or = [
      { description: { $regex: search, $options: 'i' } },
      { 'metadata.contentTitle': { $regex: search, $options: 'i' } }
    ];
  }

  // تحديد ترتيب النتائج
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [reports, totalCount] = await Promise.all([
    reportModel
      .find(query)
      .populate('reporter', 'displayName email profileImage')
      .populate('targetUser', 'displayName email profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    reportModel.countDocuments(query)
  ]);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({
    reports,
    pagination: paginationMeta
  }, 'تم جلب قائمة التقارير بنجاح');
});

/**
 * الحصول على إحصائيات التقارير (للمدير)
 * @route GET /api/reports/admin/stats
 * @access Private (Admin)
 */
export const getReportStats = asyncHandler(async (req, res) => {
  const { period = 'month', groupBy = 'status', dateFrom, dateTo } = req.query;

  // بناء استعلام التاريخ
  const dateQuery = {};
  if (dateFrom || dateTo) {
    dateQuery.createdAt = {};
    if (dateFrom) dateQuery.createdAt.$gte = new Date(dateFrom);
    if (dateTo) dateQuery.createdAt.$lte = new Date(dateTo);
  } else {
    // استخدام الفترة المحددة
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = null;
    }
    
    if (startDate) {
      dateQuery.createdAt = { $gte: startDate };
    }
  }

  // إحصائيات عامة
  const generalStats = await reportModel.aggregate([
    { $match: dateQuery },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        investigating: { $sum: { $cond: [{ $eq: ['$status', 'investigating'] }, 1, 0] } },
        resolved: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
        mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
        lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
      }
    }
  ]);

  // إحصائيات حسب معيار التجميع
  let groupedStats = [];
  
  switch (groupBy) {
    case 'status':
      groupedStats = await reportModel.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      break;
      
    case 'contentType':
      groupedStats = await reportModel.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$contentType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      break;
      
    case 'reason':
      groupedStats = await reportModel.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$reason',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      break;
      
    case 'priority':
      groupedStats = await reportModel.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: '$priority',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      break;
      
    case 'date':
      groupedStats = await reportModel.aggregate([
        { $match: dateQuery },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
      ]);
      break;
  }

  // إحصائيات الاتجاهات (آخر 7 أيام)
  const trendStats = await reportModel.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } },
    { $limit: 7 }
  ]);

  const stats = generalStats[0] || {
    total: 0,
    pending: 0,
    investigating: 0,
    resolved: 0,
    rejected: 0,
    highPriority: 0,
    mediumPriority: 0,
    lowPriority: 0
  };

  res.success({
    general: stats,
    grouped: groupedStats,
    trends: trendStats,
    period,
    groupBy
  }, 'تم جلب إحصائيات التقارير بنجاح');
});

/**
 * تحديث حالة تقرير (للمدير)
 * @route PATCH /api/reports/admin/:reportId/status
 * @access Private (Admin)
 */
export const updateReportStatus = asyncHandler(async (req, res) => {
  const { reportId } = req.params;
  const { status, adminNotes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.fail(null, 'معرف التقرير غير صالح', 400);
  }

  const report = await reportModel.findById(reportId);
  if (!report) {
    return res.fail(null, 'التقرير غير موجود', 404);
  }

  // التحقق من صحة الحالة الجديدة
  const validStatuses = ['pending', 'investigating', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.fail(null, 'الحالة غير صحيحة', 400);
  }

  // تحديث التقرير
  const updateData = { status };
  if (adminNotes) {
    updateData.adminNotes = adminNotes;
  }
  if (status === 'resolved' || status === 'rejected') {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = req.user._id;
  }

  const updatedReport = await reportModel.findByIdAndUpdate(
    reportId,
    updateData,
    { new: true }
  ).populate('reporter', 'displayName email')
   .populate('targetUser', 'displayName email')
   .lean();

  // إرسال إشعار للمبلغ إذا تم حل التقرير
  if ((status === 'resolved' || status === 'rejected') && report.reporter) {
    try {
      const notificationMessage = status === 'resolved' 
        ? 'تم حل التقرير الذي أرسلته بنجاح'
        : 'تم رفض التقرير الذي أرسلته';

      await createNotification({
        userId: report.reporter,
        type: 'report_status_updated',
        title: 'تحديث حالة التقرير',
        message: notificationMessage,
        data: {
          reportId: report._id,
          status,
          adminNotes
        }
      });
    } catch (notificationError) {
      console.error('خطأ في إرسال الإشعار:', notificationError);
    }
  }

  res.success(updatedReport, 'تم تحديث حالة التقرير بنجاح');
});

/**
 * تحديث متعدد للتقارير (للمدير)
 * @route PATCH /api/reports/admin/bulk-update
 * @access Private (Admin)
 */
export const bulkUpdateReports = asyncHandler(async (req, res) => {
  const { reportIds, status, adminNotes } = req.body;

  if (!Array.isArray(reportIds) || reportIds.length === 0) {
    return res.fail(null, 'يجب تحديد قائمة معرفات التقارير', 400);
  }

  // التحقق من صحة معرفات التقارير
  const validIds = reportIds.filter(id => mongoose.Types.ObjectId.isValid(id));
  if (validIds.length === 0) {
    return res.fail(null, 'لا توجد معرفات صحيحة للتقارير', 400);
  }

  // التحقق من صحة الحالة
  const validStatuses = ['pending', 'investigating', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.fail(null, 'الحالة غير صحيحة', 400);
  }

  // تحديث التقارير
  const updateData = { status };
  if (adminNotes) {
    updateData.adminNotes = adminNotes;
  }
  if (status === 'resolved' || status === 'rejected') {
    updateData.resolvedAt = new Date();
    updateData.resolvedBy = req.user._id;
  }

  const result = await reportModel.updateMany(
    { _id: { $in: validIds } },
    updateData
  );

  // إرسال إشعارات للمبلغين
  if ((status === 'resolved' || status === 'rejected')) {
    try {
      const reports = await reportModel.find({ _id: { $in: validIds } }).select('reporter');
      const uniqueReporters = [...new Set(reports.map(r => r.reporter.toString()))];
      
      const notificationMessage = status === 'resolved' 
        ? 'تم حل التقارير التي أرسلتها بنجاح'
        : 'تم رفض التقارير التي أرسلتها';

      const notificationPromises = uniqueReporters.map(reporterId => 
        createNotification({
          userId: reporterId,
          type: 'bulk_report_status_updated',
          title: 'تحديث حالة التقارير',
          message: notificationMessage,
          data: {
            status,
            adminNotes,
            count: validIds.length
          }
        })
      );
      
      await Promise.allSettled(notificationPromises);
    } catch (notificationError) {
      console.error('خطأ في إرسال الإشعارات:', notificationError);
    }
  }

  res.success({
    updatedCount: result.modifiedCount,
    totalRequested: reportIds.length,
    validIds: validIds.length
  }, `تم تحديث ${result.modifiedCount} تقرير بنجاح`);
});

/**
 * الحصول على تقارير محتوى معين (للمدير)
 * @route GET /api/reports/content/:contentType/:contentId
 * @access Private (Admin)
 */
export const getContentReports = asyncHandler(async (req, res) => {
  const { contentType, contentId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return res.fail(null, 'معرف المحتوى غير صالح', 400);
  }

  const query = { contentType, contentId };

  const [reports, totalCount] = await Promise.all([
    reportModel
      .find(query)
      .populate('reporter', 'displayName email profileImage')
      .populate('targetUser', 'displayName email profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    reportModel.countDocuments(query)
  ]);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({
    reports,
    pagination: paginationMeta,
    contentType,
    contentId
  }, 'تم جلب تقارير المحتوى بنجاح');
});
