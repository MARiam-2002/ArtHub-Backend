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
  
  // التحقق من إذا كان limit=full
  const isFullRequest = limit === 'full';
  
  // إذا كان limit=full، لا نحتاج pagination
  const skip = isFullRequest ? 0 : (parseInt(page) - 1) * parseInt(limit);
  
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
        reporterId: { $arrayElemAt: ['$reporterData._id', 0] },
        reporterRole: { $arrayElemAt: ['$reporterData.role', 0] },
        targetUserName: { $arrayElemAt: ['$targetUserData.displayName', 0] },
        targetUserEmail: { $arrayElemAt: ['$targetUserData.email', 0] },
        targetUserId: { $arrayElemAt: ['$targetUserData._id', 0] },
        targetUserRole: { $arrayElemAt: ['$targetUserData.role', 0] },
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
        reporterId: 1,
        reporterRole: 1,
        targetUserName: 1,
        targetUserEmail: 1,
        targetUserId: 1,
        targetUserRole: 1,
        artworkTitle: 1
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    ...(isFullRequest ? [] : [
      { $skip: skip },
      { $limit: parseInt(limit) }
    ])
  ]);

  // جلب إجمالي عدد البلاغات
  const totalReports = await reportModel.countDocuments({});

  // تنسيق البيانات للعرض
  const formattedReports = reports.map((report, index) => ({
    id: isFullRequest ? index + 1 : skip + index + 1,
    _id: report._id,
    complainant: {
      id: report.reporterId,
      name: report.reporterName || 'مستخدم',
      role: report.reporterRole,
      email: report.reporterEmail
    },
    artist: {
      id: report.targetUserId,
      name: report.targetUserName || 'فنان',
      role: report.targetUserRole,
      email: report.targetUserEmail
    },
    reportType: getReportTypeText(report.reason),
    date: report.createdAt,
    description: report.description,
    status: report.status,
    statusText: getStatusText(report.status)
  }));

  res.status(200).json({
    success: true,
    message: isFullRequest ? 'تم جلب جميع البلاغات بنجاح' : 'تم جلب البلاغات بنجاح',
    data: {
      reports: formattedReports,
      pagination: isFullRequest ? {
        page: 1,
        limit: formattedReports.length,
        total: totalReports,
        pages: 1,
        isFullRequest: true
      } : {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReports,
        pages: Math.ceil(totalReports / parseInt(limit)),
        isFullRequest: false
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
        reporterId: { $arrayElemAt: ['$reporterData._id', 0] },
        reporterRole: { $arrayElemAt: ['$reporterData.role', 0] },
        targetUserName: { $arrayElemAt: ['$targetUserData.displayName', 0] },
        targetUserEmail: { $arrayElemAt: ['$targetUserData.email', 0] },
        targetUserImage: { $arrayElemAt: ['$targetUserData.profileImage', 0] },
        targetUserId: { $arrayElemAt: ['$targetUserData._id', 0] },
        targetUserRole: { $arrayElemAt: ['$targetUserData.role', 0] },
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
        reporterId: 1,
        reporterRole: 1,
        targetUserName: 1,
        targetUserEmail: 1,
        targetUserImage: 1,
        targetUserId: 1,
        targetUserRole: 1,
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
      _id: reportData._id,
      contentType: reportData.contentType,
      reason: reportData.reason,
      description: reportData.description,
      status: reportData.status,
      adminNotes: reportData.adminNotes,
      createdAt: reportData.createdAt,
      resolvedAt: reportData.resolvedAt,
      reporter: {
        name: reportData.reporterName,
        email: reportData.reporterEmail,
        image: reportData.reporterImage,
        id: reportData.reporterId,
        role: reportData.reporterRole
      },
      targetUser: {
        name: reportData.targetUserName,
        email: reportData.targetUserEmail,
        image: reportData.targetUserImage,
        id: reportData.targetUserId,
        role: reportData.targetUserRole
      },
      artwork: {
        title: reportData.artworkTitle,
        image: reportData.artworkImage
      }
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
 * @desc    تحديث حالة بلاغ
 * @route   PATCH /api/admin/reports/:id/status
 * @access  Private (Admin, SuperAdmin)
 */
export const updateReportStatus = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { status } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف البلاغ غير صالح',
      data: null
    });
  }

  // التحقق من صحة الحالة
  const validStatuses = ['pending', 'resolved', 'rejected'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'حالة البلاغ غير صالحة',
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

  // تحديث البلاغ
  const updateData = { status };
  
  // إضافة تاريخ الحل إذا تم حل البلاغ
  if (status === 'resolved' && report.status !== 'resolved') {
    updateData.resolvedAt = new Date();
  }

  const updatedReport = await reportModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: 'تم تحديث حالة البلاغ بنجاح',
    data: {
      _id: updatedReport._id,
      status: updatedReport.status,
      statusText: getStatusText(updatedReport.status),
      resolvedAt: updatedReport.resolvedAt,
      updatedAt: updatedReport.updatedAt
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