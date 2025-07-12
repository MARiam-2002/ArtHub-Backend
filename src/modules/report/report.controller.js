import reportModel from '../../../DB/models/report.model.js';
import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import notificationModel from '../../../DB/models/notification.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { createNotification } from '../notification/notification.controller.js';
import mongoose from 'mongoose';

/**
 * إنشاء تقرير جديد
 * @route POST /api/reports
 * @access Private
 */
export const createReport = asyncHandler(async (req, res) => {
  const { contentType, contentId, reason, description, priority = 'medium', evidence = [] } = req.body;
  const reporter = req.user._id;

  // التحقق من صحة معرف المحتوى
  if (!mongoose.Types.ObjectId.isValid(contentId)) {
    return res.fail(null, 'معرف المحتوى غير صالح', 400);
  }

  // التحقق من وجود المحتوى المبلغ عنه وتحديد المستخدم المستهدف
  let targetUser;
  let contentExists = false;
  let contentTitle = '';

  try {
    switch (contentType) {
      case 'artwork':
        const artwork = await artworkModel.findById(contentId).lean();
        if (artwork) {
          contentExists = true;
          targetUser = artwork.artist;
          contentTitle = artwork.title || 'عمل فني';
        }
        break;
        
      case 'user':
        const user = await userModel.findById(contentId).lean();
        if (user) {
          contentExists = true;
          targetUser = contentId;
          contentTitle = user.displayName || 'مستخدم';
        }
        break;
        
      case 'review':
        // يمكن إضافة منطق للمراجعات هنا
        contentExists = true;
        targetUser = contentId; // مؤقتاً
        contentTitle = 'مراجعة';
        break;
        
      case 'specialRequest':
        // يمكن إضافة منطق للطلبات الخاصة هنا
        contentExists = true;
        targetUser = contentId; // مؤقتاً
        contentTitle = 'طلب خاص';
        break;
        
      default:
        return res.fail(null, 'نوع المحتوى غير مدعوم', 400);
    }
  } catch (error) {
    return res.fail(null, 'حدث خطأ أثناء التحقق من المحتوى', 500);
  }

  if (!contentExists) {
    return res.fail(null, 'المحتوى المبلغ عنه غير موجود', 404);
  }

  // منع الإبلاغ عن المحتوى الخاص بالمستخدم نفسه
  if (targetUser && targetUser.toString() === reporter.toString()) {
    return res.fail(null, 'لا يمكنك الإبلاغ عن محتواك الخاص', 400);
  }

  // التحقق من عدم وجود تقرير سابق نشط
  const existingReport = await reportModel.findOne({
    reporter,
    contentType,
    contentId,
    status: { $in: ['pending', 'investigating'] }
  }).lean();

  if (existingReport) {
    return res.fail(null, 'لديك تقرير نشط بالفعل لهذا المحتوى', 400);
  }

  // إنشاء التقرير
  const reportData = {
    reporter,
    contentType,
    contentId,
    targetUser,
    reason,
    description: description?.trim(),
    priority,
    evidence: evidence.length > 0 ? evidence : undefined,
    metadata: {
      contentTitle,
      reporterIP: req.ip,
      userAgent: req.get('User-Agent')
    }
  };

  const report = await reportModel.create(reportData);

  // إرسال إشعار للمدراء بالتقرير الجديد
  try {
    const admins = await userModel.find({ role: 'admin' }).select('_id').lean();
    const notificationPromises = admins.map(admin => 
      createNotification({
        userId: admin._id,
        type: 'report_created',
        title: 'تقرير جديد',
        message: `تم إنشاء تقرير جديد بخصوص ${contentTitle}`,
        data: {
          reportId: report._id,
          contentType,
          reason,
          priority
        }
      })
    );
    
    await Promise.allSettled(notificationPromises);
  } catch (notificationError) {
    console.error('خطأ في إرسال الإشعارات:', notificationError);
  }

  // إرجاع التقرير مع معلومات إضافية
  const populatedReport = await reportModel
    .findById(report._id)
    .populate('reporter', 'displayName email')
    .populate('targetUser', 'displayName email')
    .lean();

  res.success(populatedReport, 'تم إرسال التقرير بنجاح، سيتم مراجعته قريباً', 201);
});

/**
 * الحصول على تقارير المستخدم
 * @route GET /api/reports/my
 * @access Private
 */
export const getUserReports = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, contentType, reason, sortBy = 'createdAt', sortOrder = 'desc', search } = req.query;

  // بناء استعلام البحث
  const query = { reporter: req.user._id };
  
  if (status) query.status = status;
  if (contentType) query.contentType = contentType;
  if (reason) query.reason = reason;
  
  // البحث في الوصف
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
      .populate('targetUser', 'displayName email profileImage')
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .lean(),
    reportModel.countDocuments(query)
  ]);

  // إضافة إحصائيات سريعة
  const stats = await reportModel.aggregate([
    { $match: { reporter: req.user._id } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const statusStats = stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({
    reports,
    pagination: paginationMeta,
    stats: statusStats
  }, 'تم جلب التقارير بنجاح');
});

/**
 * الحصول على تفاصيل تقرير
 * @route GET /api/reports/:reportId
 * @access Private
 */
export const getReportById = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.fail(null, 'معرف التقرير غير صالح', 400);
  }

  const report = await reportModel
    .findById(reportId)
    .populate('reporter', 'displayName email profileImage')
    .populate('targetUser', 'displayName email profileImage')
    .lean();

  if (!report) {
    return res.fail(null, 'التقرير غير موجود', 404);
  }

  // التحقق من الصلاحيات
  const isOwner = report.reporter._id.toString() === req.user._id.toString();
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return res.fail(null, 'غير مصرح لك بعرض هذا التقرير', 403);
  }

  // إضافة معلومات إضافية للمدراء
  if (isAdmin) {
    // إضافة تاريخ التقارير السابقة لنفس المحتوى
    const relatedReports = await reportModel
      .find({
        contentType: report.contentType,
        contentId: report.contentId,
        _id: { $ne: report._id }
      })
      .populate('reporter', 'displayName')
      .select('reporter reason status createdAt')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    report.relatedReports = relatedReports;
  }

  res.success(report, 'تم جلب تفاصيل التقرير بنجاح');
});

/**
 * حذف تقرير
 * @route DELETE /api/reports/:reportId
 * @access Private
 */
export const deleteReport = asyncHandler(async (req, res) => {
  const { reportId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.fail(null, 'معرف التقرير غير صالح', 400);
  }

  const report = await reportModel.findOne({
    _id: reportId,
    reporter: req.user._id,
    status: { $in: ['pending', 'rejected'] } // يمكن حذف التقرير إذا كان معلقاً أو مرفوضاً
  });

  if (!report) {
    return res.fail(null, 'التقرير غير موجود أو لا يمكن حذفه', 404);
  }

  await reportModel.deleteOne({ _id: reportId });

  res.success(null, 'تم حذف التقرير بنجاح');
});

/**
 * الحصول على جميع التقارير (للمدراء)
 * @route GET /api/reports/admin/all
 * @access Admin
 */
export const getAllReports = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض قائمة التقارير', 403);
  }

  const { page, limit, skip } = getPaginationParams(req.query);
  const {
    status,
    contentType,
    reason,
    priority,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    dateFrom,
    dateTo,
    search
  } = req.query;

  // بناء استعلام البحث
  const query = {};
  
  if (status) query.status = status;
  if (contentType) query.contentType = contentType;
  if (reason) query.reason = reason;
  if (priority) query.priority = priority;

  // تصفية التاريخ
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  // البحث النصي
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
 * إحصائيات التقارير
 * @route GET /api/reports/admin/stats
 * @access Admin
 */
export const getReportStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض إحصائيات التقارير', 403);
  }

  const { period = 'month', groupBy = 'status', dateFrom, dateTo } = req.query;

  // تحديد فترة التاريخ
  let dateFilter = {};
  const now = new Date();
  
  if (dateFrom && dateTo) {
    dateFilter = {
      createdAt: {
        $gte: new Date(dateFrom),
        $lte: new Date(dateTo)
      }
    };
  } else {
    switch (period) {
      case 'day':
        dateFilter.createdAt = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
        break;
      case 'week':
        dateFilter.createdAt = { $gte: new Date(now.setDate(now.getDate() - 7)) };
        break;
      case 'month':
        dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
        break;
      case 'quarter':
        dateFilter.createdAt = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
        break;
      case 'year':
        dateFilter.createdAt = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
        break;
      default:
        // كل التقارير
        break;
    }
  }

  // الإحصائيات العامة
  const [
    totalReports,
    pendingReports,
    resolvedReports,
    rejectedReports,
    investigatingReports,
    escalatedReports,
    groupedStats,
    topReasons,
    recentActivity
  ] = await Promise.all([
    reportModel.countDocuments(dateFilter),
    reportModel.countDocuments({ ...dateFilter, status: 'pending' }),
    reportModel.countDocuments({ ...dateFilter, status: 'resolved' }),
    reportModel.countDocuments({ ...dateFilter, status: 'rejected' }),
    reportModel.countDocuments({ ...dateFilter, status: 'investigating' }),
    reportModel.countDocuments({ ...dateFilter, status: 'escalated' }),
    
    // إحصائيات مجمعة حسب المعيار المحدد
    reportModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: `$${groupBy}`,
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]),
    
    // أهم أسباب الإبلاغ
    reportModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$reason',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]),
    
    // النشاط الأخير
    reportModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ])
  ]);

  // تنسيق النتائج
  const stats = {
    summary: {
      total: totalReports,
      pending: pendingReports,
      investigating: investigatingReports,
      resolved: resolvedReports,
      rejected: rejectedReports,
      escalated: escalatedReports
    },
    groupedBy: {
      [groupBy]: groupedStats.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {})
    },
    topReasons: topReasons.map(item => ({
      reason: item._id,
      count: item.count
    })),
    activity: recentActivity.map(item => ({
      date: item._id,
      count: item.count
    }))
  };

  res.success(stats, 'تم جلب إحصائيات التقارير بنجاح');
});

/**
 * تحديث حالة التقرير
 * @route PATCH /api/reports/admin/:reportId/status
 * @access Admin
 */
export const updateReportStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بتحديث حالة التقارير', 403);
  }

  const { reportId } = req.params;
  const { status, adminNotes, actionTaken, notifyReporter = true } = req.body;

  if (!mongoose.Types.ObjectId.isValid(reportId)) {
    return res.fail(null, 'معرف التقرير غير صالح', 400);
  }

  const report = await reportModel.findById(reportId);
  if (!report) {
    return res.fail(null, 'التقرير غير موجود', 404);
  }

  // حفظ الحالة السابقة
  const previousStatus = report.status;

  // تحديث التقرير
  report.status = status;
  if (adminNotes) report.adminNotes = adminNotes.trim();
  if (actionTaken) report.actionTaken = actionTaken;
  report.reviewedBy = req.user._id;
  report.reviewedAt = new Date();

  // تحديث تاريخ الحل إذا تم حل التقرير
  if (status === 'resolved' && !report.resolvedAt) {
    report.resolvedAt = new Date();
  }

  await report.save();

  // إرسال إشعار للمبلغ إذا كان مطلوباً
  if (notifyReporter && report.reporter) {
    try {
      const statusMessages = {
        investigating: 'قيد المراجعة',
        resolved: 'تم حل التقرير',
        rejected: 'تم رفض التقرير',
        escalated: 'تم تصعيد التقرير'
      };

      await createNotification({
        userId: report.reporter,
        type: 'report_status_updated',
        title: 'تحديث حالة التقرير',
        message: `تم تحديث حالة تقريرك إلى: ${statusMessages[status]}`,
        data: {
          reportId: report._id,
          status,
          adminNotes: adminNotes || undefined
        }
      });
    } catch (notificationError) {
      console.error('خطأ في إرسال إشعار تحديث التقرير:', notificationError);
    }
  }

  // إرجاع التقرير المحدث
  const updatedReport = await reportModel
    .findById(reportId)
    .populate('reporter', 'displayName email')
    .populate('targetUser', 'displayName email')
    .populate('reviewedBy', 'displayName email')
    .lean();

  res.success(updatedReport, 'تم تحديث حالة التقرير بنجاح');
});

/**
 * تحديث متعدد للتقارير
 * @route PATCH /api/reports/admin/bulk-update
 * @access Admin
 */
export const bulkUpdateReports = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بتحديث التقارير', 403);
  }

  const { reportIds, status, adminNotes } = req.body;

  // التحقق من صحة معرفات التقارير
  const invalidIds = reportIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    return res.fail(null, `معرفات التقارير التالية غير صالحة: ${invalidIds.join(', ')}`, 400);
  }

  // تحديث التقارير
  const updateData = {
    status,
    reviewedBy: req.user._id,
    reviewedAt: new Date()
  };

  if (adminNotes) updateData.adminNotes = adminNotes.trim();
  if (status === 'resolved') updateData.resolvedAt = new Date();

  const result = await reportModel.updateMany(
    { _id: { $in: reportIds } },
    updateData
  );

  if (result.matchedCount === 0) {
    return res.fail(null, 'لم يتم العثور على تقارير للتحديث', 404);
  }

  res.success({
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount
  }, `تم تحديث ${result.modifiedCount} تقرير بنجاح`);
});

/**
 * الحصول على تقارير محتوى معين
 * @route GET /api/reports/content/:contentType/:contentId
 * @access Admin
 */
export const getContentReports = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض تقارير المحتوى', 403);
  }

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
      .populate('reviewedBy', 'displayName email')
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
    contentInfo: {
      contentType,
      contentId,
      totalReports: totalCount
    }
  }, 'تم جلب تقارير المحتوى بنجاح');
});

/**
 * تصدير التقارير
 * @route GET /api/reports/admin/export
 * @access Admin
 */
export const exportReports = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بتصدير التقارير', 403);
  }

  const { format = 'csv', status, contentType, dateFrom, dateTo } = req.query;

  // بناء استعلام التصدير
  const query = {};
  if (status) query.status = status;
  if (contentType) query.contentType = contentType;
  
  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const reports = await reportModel
    .find(query)
    .populate('reporter', 'displayName email')
    .populate('targetUser', 'displayName email')
    .populate('reviewedBy', 'displayName email')
    .sort({ createdAt: -1 })
    .lean();

  // تحضير البيانات للتصدير
  const exportData = reports.map(report => ({
    id: report._id,
    contentType: report.contentType,
    contentId: report.contentId,
    reporter: report.reporter?.displayName || 'غير معروف',
    reporterEmail: report.reporter?.email || '',
    targetUser: report.targetUser?.displayName || 'غير معروف',
    reason: report.reason,
    description: report.description || '',
    status: report.status,
    priority: report.priority || 'medium',
    adminNotes: report.adminNotes || '',
    actionTaken: report.actionTaken || '',
    reviewedBy: report.reviewedBy?.displayName || '',
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    resolvedAt: report.resolvedAt || ''
  }));

  // تحديد نوع المحتوى ونوع الملف
  let contentType_response, filename;
  
  switch (format) {
    case 'json':
      contentType_response = 'application/json';
      filename = `reports_${Date.now()}.json`;
      break;
    case 'xlsx':
      contentType_response = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      filename = `reports_${Date.now()}.xlsx`;
      break;
    default: // csv
      contentType_response = 'text/csv';
      filename = `reports_${Date.now()}.csv`;
  }

  res.setHeader('Content-Type', contentType_response);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

  if (format === 'json') {
    res.json(exportData);
  } else if (format === 'csv') {
    // تحويل إلى CSV
    const csvHeaders = Object.keys(exportData[0] || {}).join(',');
    const csvRows = exportData.map(row => Object.values(row).join(','));
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    res.send(csvContent);
  } else {
    // للـ XLSX يمكن استخدام مكتبة مثل xlsx
    res.fail(null, 'تنسيق التصدير غير مدعوم حالياً', 400);
  }
});
