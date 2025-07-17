import { asyncHandler } from '../../utils/asyncHandler.js';
import reportModel from '../../../DB/models/report.model.js';
import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';

/**
 * @desc    جلب جميع البلاغات مع التفاصيل
 * @route   GET /api/admin/reports
 * @access  Private (Admin, SuperAdmin)
 */
export const getAllReports = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { page = 1, limit = 20 } = req.query;
  
  // حساب التخطي للصفحة
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // جلب البلاغات مع تفاصيل المستخدمين
  const reports = await reportModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'reporter',
        foreignField: '_id',
        as: 'reporterData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'targetUser',
        foreignField: '_id',
        as: 'targetUserData'
      }
    },
    {
      $lookup: {
        from: 'artworks',
        localField: 'contentId',
        foreignField: '_id',
        as: 'artworkData'
      }
    },
    {
      $addFields: {
        reporterName: { $arrayElemAt: ['$reporterData.displayName', 0] },
        reporterEmail: { $arrayElemAt: ['$reporterData.email', 0] },
        targetUserName: { $arrayElemAt: ['$targetUserData.displayName', 0] },
        targetUserEmail: { $arrayElemAt: ['$targetUserData.email', 0] },
        artworkTitle: { $arrayElemAt: ['$artworkData.title', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        contentType: 1,
        reason: 1,
        description: 1,
        status: 1,
        adminNotes: 1,
        createdAt: 1,
        resolvedAt: 1,
        reporterName: 1,
        reporterEmail: 1,
        targetUserName: 1,
        targetUserEmail: 1,
        artworkTitle: 1
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: parseInt(limit)
    }
  ]);

  // جلب إجمالي عدد البلاغات
  const totalReports = await reportModel.countDocuments({});

  // تنسيق البيانات للعرض
  const formattedReports = reports.map((report, index) => ({
    id: skip + index + 1,
    _id: report._id,
    complainant: report.reporterName || 'مستخدم',
    complainantEmail: report.reporterEmail,
    artist: report.targetUserName || 'فنان',
    artistEmail: report.targetUserEmail,
    reportType: getReportTypeText(report.reason),
    date: report.createdAt,
    description: report.description,
    status: report.status,
    statusText: getStatusText(report.status)
  }));

  res.status(200).json({
    success: true,
    message: 'تم جلب البلاغات بنجاح',
    data: {
      reports: formattedReports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReports,
        pages: Math.ceil(totalReports / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    جلب تفاصيل بلاغ محدد
 * @route   GET /api/admin/reports/:id
 * @access  Private (Admin, SuperAdmin)
 */
export const getReportDetails = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف البلاغ غير صالح',
      data: null
    });
  }

  const report = await reportModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'reporter',
        foreignField: '_id',
        as: 'reporterData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'targetUser',
        foreignField: '_id',
        as: 'targetUserData'
      }
    },
    {
      $lookup: {
        from: 'artworks',
        localField: 'contentId',
        foreignField: '_id',
        as: 'artworkData'
      }
    },
    {
      $addFields: {
        reporterName: { $arrayElemAt: ['$reporterData.displayName', 0] },
        reporterEmail: { $arrayElemAt: ['$reporterData.email', 0] },
        reporterImage: { $arrayElemAt: ['$reporterData.profileImage', 0] },
        targetUserName: { $arrayElemAt: ['$targetUserData.displayName', 0] },
        targetUserEmail: { $arrayElemAt: ['$targetUserData.email', 0] },
        targetUserImage: { $arrayElemAt: ['$targetUserData.profileImage', 0] },
        artworkTitle: { $arrayElemAt: ['$artworkData.title', 0] },
        artworkImage: { $arrayElemAt: ['$artworkData.image', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        contentType: 1,
        reason: 1,
        description: 1,
        status: 1,
        adminNotes: 1,
        createdAt: 1,
        resolvedAt: 1,
        reporterName: 1,
        reporterEmail: 1,
        reporterImage: 1,
        targetUserName: 1,
        targetUserEmail: 1,
        targetUserImage: 1,
        artworkTitle: 1,
        artworkImage: 1
      }
    }
  ]);

  if (!report || report.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'البلاغ غير موجود',
      data: null
    });
  }

  const reportData = report[0];

  res.status(200).json({
    success: true,
    message: 'تم جلب تفاصيل البلاغ بنجاح',
    data: {
      description: reportData.description
    }
  });
});

/**
 * @desc    حذف بلاغ
 * @route   DELETE /api/admin/reports/:id
 * @access  Private (Admin, SuperAdmin)
 */
export const deleteReport = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف البلاغ غير صالح',
      data: null
    });
  }

  const report = await reportModel.findById(id);
  
  if (!report) {
    return res.status(404).json({
      success: false,
      message: 'البلاغ غير موجود',
      data: null
    });
  }

  // حذف البلاغ
  await reportModel.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'تم حذف البلاغ بنجاح',
    data: {
      _id: report._id,
      deletedAt: new Date()
    }
  });
});

/**
 * @desc    تصدير بيانات البلاغات
 * @route   GET /api/admin/reports/export
 * @access  Private (Admin, SuperAdmin)
 */
export const exportReports = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { format = 'json' } = req.query;

  // جلب جميع البلاغات مع التفاصيل
  const reports = await reportModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'reporter',
        foreignField: '_id',
        as: 'reporterData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'targetUser',
        foreignField: '_id',
        as: 'targetUserData'
      }
    },
    {
      $addFields: {
        reporterName: { $arrayElemAt: ['$reporterData.displayName', 0] },
        reporterEmail: { $arrayElemAt: ['$reporterData.email', 0] },
        targetUserName: { $arrayElemAt: ['$targetUserData.displayName', 0] },
        targetUserEmail: { $arrayElemAt: ['$targetUserData.email', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        reason: 1,
        description: 1,
        status: 1,
        createdAt: 1,
        resolvedAt: 1,
        reporterName: 1,
        reporterEmail: 1,
        targetUserName: 1,
        targetUserEmail: 1
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  if (format === 'csv') {
    // تحويل البيانات إلى CSV
    const csvData = [
      ['الرقم', 'المشتكي', 'البريد الإلكتروني', 'الفنان', 'نوع البلاغ', 'الوصف', 'الحالة', 'التاريخ'],
      ...reports.map((report, index) => [
        index + 1,
        report.reporterName || 'مستخدم',
        report.reporterEmail || '',
        report.targetUserName || 'فنان',
        getReportTypeText(report.reason),
        report.description || '',
        getStatusText(report.status),
        new Date(report.createdAt).toLocaleDateString('ar-SA')
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reports-export.csv"');
    res.send(csvData);
  } else {
    res.status(200).json({
      success: true,
      message: 'تم تصدير بيانات البلاغات بنجاح',
      data: {
        totalReports: reports.length,
        reports: reports.map((report, index) => ({
          id: index + 1,
          complainant: report.reporterName || 'مستخدم',
          artist: report.targetUserName || 'فنان',
          reportType: getReportTypeText(report.reason),
          description: report.description,
          status: getStatusText(report.status),
          date: report.createdAt
        }))
      }
    });
  }
});

/**
 * @desc    جلب إحصائيات البلاغات
 * @route   GET /api/admin/reports/statistics
 * @access  Private (Admin, SuperAdmin)
 */
export const getReportsStatistics = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();

  // إحصائيات عامة
  const [totalReports, pendingReports, resolvedReports, rejectedReports] = await Promise.all([
    reportModel.countDocuments({}),
    reportModel.countDocuments({ status: 'pending' }),
    reportModel.countDocuments({ status: 'resolved' }),
    reportModel.countDocuments({ status: 'rejected' })
  ]);

  // إحصائيات حسب نوع البلاغ
  const reportsByType = await reportModel.aggregate([
    {
      $group: {
        _id: '$reason',
        count: { $sum: 1 }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);

  // إحصائيات حسب الحالة
  const reportsByStatus = await reportModel.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'تم جلب إحصائيات البلاغات بنجاح',
    data: {
      summary: {
        total: totalReports,
        pending: pendingReports,
        resolved: resolvedReports,
        rejected: rejectedReports
      },
      byType: reportsByType.map(item => ({
        type: getReportTypeText(item._id),
        count: item.count
      })),
      byStatus: reportsByStatus.map(item => ({
        status: getStatusText(item._id),
        count: item.count
      }))
    }
  });
});

// Helper functions
function getReportTypeText(reason) {
  const types = {
    'inappropriate': 'محتوى غير مناسب',
    'copyright': 'انتهاك حقوق الملكية',
    'spam': 'رسائل مزعجة',
    'offensive': 'محتوى مسيء',
    'harassment': 'تحرش',
    'other': 'أخرى',
    // إضافة أنواع جديدة بناءً على الصورة
    'delay_delivery': 'تأخير في التسليم',
    'low_quality': 'جودة منخفضة',
    'unavailable_communication': 'تواصل غير متاح',
    'artwork_damage': 'خدش في العمل',
    'color_mismatch': 'ألوان غير مطابقة',
    'size_incorrect': 'مقاس غير صحيح'
  };
  return types[reason] || 'غير محدد';
}

function getStatusText(status) {
  const statuses = {
    'pending': 'تحت المراجعة',
    'resolved': 'تم الحل',
    'rejected': 'مرفوض',
    'reviewed': 'تمت المراجعة'
  };
  return statuses[status] || 'غير محدد';
} 