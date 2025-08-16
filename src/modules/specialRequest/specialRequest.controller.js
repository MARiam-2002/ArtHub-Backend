import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';
import { getPaginationParams } from '../../utils/pagination.js';
import { sendSpecialRequestNotification } from '../../utils/pushNotifications.js';
import transactionModel from '../../../DB/models/transaction.model.js';

/**
 * Helper function to safely format image URLs
 */
function getImageUrl(imageField, defaultUrl = null) {
  if (!imageField) return defaultUrl;
  
  if (typeof imageField === 'string') return imageField;
  if (imageField.url) return imageField.url;
  if (Array.isArray(imageField) && imageField.length > 0) {
    return imageField[0].url || imageField[0];
  }
  
  return defaultUrl;
}

/**
 * Helper function to get multiple image URLs from array
 */
function getImageUrls(imagesField, limit = 10) {
  if (!imagesField || !Array.isArray(imagesField)) return [];
  
  return imagesField.slice(0, limit).map(img => {
    if (typeof img === 'string') return img;
    return img.url || img;
  }).filter(Boolean);
}

/**
 * Helper function to format attachment data for Flutter
 */
function formatAttachments(attachments) {
  if (!Array.isArray(attachments)) return [];
  
  return attachments.map(attachment => ({
    url: attachment.url || attachment,
    type: attachment.type || 'image',
    name: attachment.name || 'مرفق',
    description: attachment.description || '',
    size: attachment.size || 0,
    uploadedAt: attachment.uploadedAt || new Date()
  }));
}

/**
 * Helper function to format user data for special requests
 */
function formatUserForRequest(user) {
  if (!user) return null;
  
  return {
    _id: user._id,
    displayName: user.displayName || 'مستخدم',
    profileImage: getImageUrl(user.profileImage, user.photoURL),
    job: user.job || 'فنان',
    rating: user.averageRating ? parseFloat(user.averageRating.toFixed(1)) : 0,
    reviewsCount: user.reviewsCount || 0,
    isVerified: user.isVerified || false,
    role: user.role || 'user',
    email: user.email || '',
    phone: user.phone || ''
  };
}

/**
 * Helper function to format special request data for Flutter
 */
function formatSpecialRequest(request) {
  if (!request) return null;
  
  return {
    _id: request._id,
    title: request.title || 'طلب خاص',
    description: request.description || '',
    requestType: request.requestType || 'other',
    requestTypeLabel: getRequestTypeLabel(request.requestType),
    budget: request.budget || 0,
    currency: request.currency || 'SAR',
    duration: request.duration || 7, // المدة المطلوبة
    quotedPrice: request.quotedPrice || null,
    finalPrice: request.finalPrice || null,
    status: request.status || 'pending',
    statusLabel: getStatusLabel(request.status),
    priority: request.priority || 'medium',
    priorityLabel: getPriorityLabel(request.priority),
    
    // User information
    sender: formatUserForRequest(request.sender),
    artist: formatUserForRequest(request.artist),
    
    // Category information
    category: request.category ? {
      _id: request.category._id,
      name: request.category.name?.ar || request.category.name || 'فئة',
      image: getImageUrl(request.category.image)
    } : null,
    
    // Media and attachments
    attachments: formatAttachments(request.attachments),
    deliverables: formatAttachments(request.deliverables),
    
    // Additional information
    tags: request.tags || [],
    response: request.response || null,
    finalNote: request.finalNote || null,
    
    // Progress tracking
    currentProgress: request.currentProgress || 0,
    usedRevisions: request.usedRevisions || 0,
    maxRevisions: request.maxRevisions || 3,
    allowRevisions: request.allowRevisions !== false,
    
    // Dates
    deadline: request.deadline || null,
    estimatedDelivery: request.estimatedDelivery || null,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    acceptedAt: request.acceptedAt || null,
    completedAt: request.completedAt || null,
    
    // Specifications
    specifications: request.specifications || null,
    communicationPreferences: request.communicationPreferences || null,
    
    // Metadata
    isPrivate: request.isPrivate || false,
    
    // Calculated fields
    remainingDays: request.remainingDays || null,
    canEdit: request.status === 'pending',
    canCancel: ['pending', 'accepted'].includes(request.status),
    canComplete: request.status === 'in_progress' || request.status === 'review'
  };
}

/**
 * Helper function to get request type label
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
    'concept_art': 'فن تصوري',
    'other': 'أخرى'
  };
  return labels[type] || 'نوع غير محدد';
}

/**
 * Helper function to get status label
 */
function getStatusLabel(status) {
  const labels = {
    'pending': 'في الانتظار',
    'accepted': 'مقبول',
    'rejected': 'مرفوض',
    'in_progress': 'قيد التنفيذ',
    'review': 'قيد المراجعة',
    'completed': 'مكتمل',
    'cancelled': 'ملغي'
  };
  return labels[status] || 'حالة غير محددة';
}

/**
 * Helper function to get priority label
 */
function getPriorityLabel(priority) {
  const labels = {
    'low': 'منخفض',
    'medium': 'متوسط',
    'high': 'عالي',
    'urgent': 'عاجل'
  };
  return labels[priority] || 'أولوية غير محددة';
}

/**
 * دالة تلخيص الطلب الخاص
 */
function summarizeSpecialRequest(request) {
  const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341492/image_8_l86jgo.png';
  let image = PLACEHOLDER_IMAGE;
  if (request.requestType === 'ready_artwork' && request.artwork && request.artwork.image) {
    image = request.artwork.image;
  }
  return {
    _id: request._id,
    requestType: request.requestType,
    description: request.description,
    budget: request.budget,
    duration: request.duration,
    status: request.status,
    createdAt: request.createdAt,
    technicalDetails: request.specifications?.technicalDetails || null,
    artist: formatUserForRequest(request.artist),
    sender: formatUserForRequest(request.sender),
    orderType: 'special',
    image
  };
}

/**
 * دالة تلخيص الطلب العادي (transaction)
 */
function summarizeTransaction(tx) {
  const PLACEHOLDER_IMAGE = 'https://res.cloudinary.com/dgzucjqgi/image/upload/v1752341492/image_8_l86jgo.png';
  let image = PLACEHOLDER_IMAGE;
  // جلب صورة العمل الفني من العنصر الأول
  if (tx.items?.[0]?.artwork) {
    if (typeof tx.items[0].artwork === 'object' && tx.items[0].artwork.image) {
      image = tx.items[0].artwork.image;
    }
  }
  return {
    _id: tx._id,
    requestType: 'regular_order',
    description: tx.items?.[0]?.description || tx.notes || 'طلب عادي',
    budget: tx.pricing?.totalAmount || 0,
    duration: null,
    status: tx.status,
    createdAt: tx.createdAt,
    technicalDetails: null,
    artist: formatUserForRequest(tx.seller),
    sender: formatUserForRequest(tx.buyer),
    orderType: 'regular',
    image
  };
}

/**
 * إنشاء طلب خاص جديد - Enhanced for Flutter
 */
export const createSpecialRequest = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const {
      artist,
      requestType,
      description,
      budget,
      duration,
      technicalDetails, // اختياري
      currency = 'SAR',
      artwork// جديد
    } = req.body;

    const senderId = req.user._id;

    // Validate required fields
    if (!artist || !requestType || !description || !budget || !duration) {
      return res.status(400).json({
        success: false,
        message: 'المعلومات المطلوبة: الفنان، نوع العمل، الوصف التفصيلي، الميزانية المقترحة، والمدة المطلوبة',
        data: null
      });
    }

    // Validate artist ID
    if (!mongoose.Types.ObjectId.isValid(artist)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الفنان غير صالح',
        data: null
      });
    }

    // التحقق من وجود الفنان وأنه نشط
    const artistExists = await userModel.findOne({ 
      _id: artist, 
      role: 'artist',
      isActive: true,
      isDeleted: false
    }).select('displayName profileImage photoURL job averageRating reviewsCount isVerified email phone').lean();

    if (!artistExists) {
      return res.status(404).json({
        success: false,
        message: 'الفنان غير موجود أو غير نشط',
        data: null
      });
    }

    // إنشاء الطلب
    const requestData = {
      sender: senderId,
      artist,
      requestType,
      description: description.trim(),
      budget: Number(budget),
      duration: Number(duration),
      currency,
    };

    if (artwork) {
      requestData.artwork = artwork;
    }

    if (technicalDetails) {
      requestData.specifications = { technicalDetails };
    }

    const specialRequest = await specialRequestModel.create(requestData);

    // Populate the created request
    const populatedRequest = await specialRequestModel.findById(specialRequest._id)
      .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
      .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
      .populate('category', 'name image')
      .lean();

    // إرسال إشعار للفنان
    const senderUser = await userModel.findById(senderId).select('displayName').lean();
    const senderName = senderUser?.displayName || 'مستخدم';

    try {
      await sendSpecialRequestNotification(
        artist,
        'new_request',
        senderName,
        description.substring(0, 50),
        specialRequest.requestType // تمرير نوع الطلب (custom_artwork أو ready_artwork)
      );
    } catch (notificationError) {
      console.warn('Push notification failed:', notificationError);
    }

    const response = {
      success: true,
      message: 'تم إنشاء الطلب الخاص بنجاح',
      data: {
        specialRequest: summarizeSpecialRequest(populatedRequest)
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: senderId
      }
    };

    res.status(201).json(response);

  } catch (error) {
    console.error('Create special request error:', error);
    next(new Error('حدث خطأ أثناء إنشاء الطلب الخاص', { cause: 500 }));
  }
});

/**
 * الحصول على طلبات المستخدم - Enhanced for Flutter
 */
export const getUserRequests = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const userId = req.user._id;
    const { page = 1, limit = 10, status, requestType, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // التحقق من إذا كان limit=full
    const isFullRequest = limit === 'full';
    
    // إذا كان limit=full، لا نحتاج pagination
    const { skip } = isFullRequest ? { skip: 0 } : getPaginationParams({ page, limit });

    // بناء الاستعلام للطلبات الخاصة
    const specialQuery = { sender: userId };
    if (status && ['pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled'].includes(status)) {
      specialQuery.status = status;
    }
    if (requestType) {
      specialQuery.requestType = requestType;
    }
    if (priority) {
      specialQuery.priority = priority;
    }

    // جلب الطلبات الخاصة فقط
    const specialRequests = await specialRequestModel.find(specialQuery)
      .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
      .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
      .populate('artwork', 'title image')
      .lean();

    // تلخيص ودمج
    const summarizedSpecial = specialRequests.map(r => ({ ...summarizeSpecialRequest(r), orderType: 'special' }));
    let allRequests = [...summarizedSpecial];

    // ترتيب حسب createdAt
    allRequests = allRequests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // إذا كان limit=full، نرسل جميع الطلبات بدون pagination
    const finalRequests = isFullRequest ? allRequests : allRequests.slice(skip, skip + Number(limit));

    // pagination meta
    const paginationMeta = isFullRequest ? {
      currentPage: 1,
      totalPages: 1,
      totalItems: allRequests.length,
      itemsPerPage: allRequests.length,
      hasNextPage: false,
      hasPrevPage: false,
      isFullRequest: true
    } : {
      currentPage: Number(page),
      totalPages: Math.ceil(allRequests.length / Number(limit)),
      totalItems: allRequests.length,
      itemsPerPage: Number(limit),
      hasNextPage: skip + finalRequests.length < allRequests.length,
      hasPrevPage: Number(page) > 1,
      isFullRequest: false
    };

    res.status(200).json({
      success: true,
      message: isFullRequest ? 'تم جلب جميع الطلبات بنجاح' : 'تم جلب الطلبات بنجاح',
      data: {
        requests: finalRequests,
        pagination: paginationMeta,
        totalCount: allRequests.length
      },
      meta: {
        userId: userId,
        filters: { status, requestType, priority, sortBy, sortOrder },
        isFullRequest
      }
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    next(new Error('حدث خطأ أثناء جلب الطلبات', { cause: 500 }));
  }
});

/**
 * الحصول على طلبات الفنان - Enhanced for Flutter
 */
export const getArtistRequests = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const artistId = req.user._id;
    const { page = 1, limit = 10, status, requestType, priority, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    // التحقق من إذا كان limit=full
    const isFullRequest = limit === 'full';
    
    // إذا كان limit=full، لا نحتاج pagination
    const { skip } = isFullRequest ? { skip: 0 } : getPaginationParams({ page, limit });

    // التحقق من أن المستخدم فنان
    if (req.user.role !== 'artist') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بعرض طلبات الفنانين',
        data: null
      });
    }

    // بناء الاستعلام
    const query = { artist: artistId };
    
    if (status && ['pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
    if (requestType) {
      query.requestType = requestType;
    }
    
    if (priority) {
      query.priority = priority;
    }

    // بناء خيارات الترتيب
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // تنفيذ الاستعلام - إذا كان limit=full، لا نطبق limit
    const [requests, totalCount] = await Promise.all([
      specialRequestModel
        .find(query)
        .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
        .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
        .populate('category', 'name image')
        .sort(sortOptions)
        .skip(isFullRequest ? 0 : skip)
        .limit(isFullRequest ? 0 : Number(limit)) // 0 means no limit
        .lean(),
      specialRequestModel.countDocuments(query)
    ]);

    // Format requests for Flutter
    const formattedRequests = requests.map(request => formatSpecialRequest(request));

    // إعداد معلومات الصفحات
    const paginationMeta = isFullRequest ? {
      currentPage: 1,
      totalPages: 1,
      totalItems: totalCount,
      itemsPerPage: totalCount,
      hasNextPage: false,
      hasPrevPage: false,
      isFullRequest: true
    } : {
      currentPage: Number(page),
      totalPages: Math.ceil(totalCount / Number(limit)),
      totalItems: totalCount,
      itemsPerPage: Number(limit),
      hasNextPage: skip + requests.length < totalCount,
      hasPrevPage: Number(page) > 1,
      isFullRequest: false
    };

    // Get status counts for filters
    const statusCounts = await specialRequestModel.aggregate([
      { $match: { artist: artistId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const statusCountsMap = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    const response = {
      success: true,
      message: isFullRequest ? 'تم جلب جميع طلبات الفنان بنجاح' : 'تم جلب طلبات الفنان بنجاح',
      data: {
        requests: formattedRequests,
        pagination: paginationMeta,
        statusCounts: statusCountsMap,
        totalCount
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: artistId,
        filters: { status, requestType, priority, sortBy, sortOrder },
        isFullRequest
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get artist requests error:', error);
    next(new Error('حدث خطأ أثناء جلب طلبات الفنان', { cause: 500 }));
  }
});

/**
 * الحصول على تفاصيل طلب محدد - Enhanced for Flutter
 */
export const getRequestById = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { requestId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الطلب غير صالح',
        data: null
      });
    }

    // جلب الطلب مع تفاصيل كاملة
    const request = await specialRequestModel
      .findById(requestId)
      .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
      .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
      .populate('category', 'name image')
      .lean();

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
        data: null
      });
    }

    // التحقق من أن المستخدم هو صاحب الطلب أو الفنان
    const isSender = request.sender._id.toString() === userId.toString();
    const isArtist = request.artist._id.toString() === userId.toString();

    if (!isSender && !isArtist) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بعرض هذا الطلب',
        data: null
      });
    }

    const response = {
      success: true,
      message: 'تم جلب تفاصيل الطلب بنجاح',
      data: {
        specialRequest: formatSpecialRequest(request),
        userRelation: {
          isSender,
          isArtist,
          canEdit: isSender && request.status === 'pending',
          canAccept: isArtist && request.status === 'pending',
          canReject: isArtist && request.status === 'pending',
          canComplete: isArtist && ['accepted', 'in_progress'].includes(request.status),
          canCancel: (isSender && ['pending', 'accepted'].includes(request.status)) || 
                    (isArtist && request.status === 'pending')
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get request by ID error:', error);
    next(new Error('حدث خطأ أثناء جلب تفاصيل الطلب', { cause: 500 }));
  }
});

/**
 * تحديث حالة الطلب - Enhanced for Flutter
 */
export const updateRequestStatus = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { requestId } = req.params;
    const { status, response: responseText, estimatedDelivery, quotedPrice } = req.body;
    const artistId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الطلب غير صالح',
        data: null
      });
    }

    // التحقق من أن المستخدم فنان
    if (req.user.role !== 'artist') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بتحديث حالة الطلب',
        data: null
      });
    }

    // Validate status
    if (!['pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'حالة الطلب غير صالحة',
        data: null
      });
    }

    // جلب الطلب
    const request = await specialRequestModel.findOne({
      _id: requestId,
      artist: artistId
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
        data: null
      });
    }

    // تحديث حالة الطلب
    const updateData = {
      status,
      updatedAt: new Date()
    };

    if (responseText) {
      updateData.response = responseText;
    }

    if (estimatedDelivery) {
      updateData.estimatedDelivery = new Date(estimatedDelivery);
    }

    if (quotedPrice) {
      updateData.quotedPrice = Number(quotedPrice);
    }

    // Set status-specific timestamps
    if (status === 'accepted') {
      updateData.acceptedAt = new Date();
      if (!request.startedAt) {
        updateData.startedAt = new Date();
      }
    } else if (status === 'completed') {
      updateData.completedAt = new Date();
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
    }

    const updatedRequest = await specialRequestModel.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    )
    .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('category', 'name image')
    .lean();

    // إرسال إشعار للمستخدم
    const statusMessages = {
      accepted: 'تم قبول طلبك الخاص',
      rejected: 'تم رفض طلبك الخاص',
      in_progress: 'بدء العمل على طلبك الخاص',
      review: 'طلبك الخاص قيد المراجعة',
      completed: 'تم إكمال طلبك الخاص'
    };

    if (statusMessages[status]) {
      try {
        const artistName = updatedRequest.artist?.displayName || 'الفنان';
        await sendSpecialRequestNotification(
          request.sender.toString(),
          status,
          artistName,
          updatedRequest.title || 'طلب خاص',
          updatedRequest.requestType, // تمرير نوع الطلب
          responseText || `تم تحديث حالة طلبك إلى: ${getStatusLabel(status)}`
        );
      } catch (notificationError) {
        console.warn('Push notification failed:', notificationError);
      }
    }

    const response = {
      success: true,
      message: `تم تحديث حالة الطلب إلى "${getStatusLabel(status)}" بنجاح`,
      data: {
        specialRequest: formatSpecialRequest(updatedRequest)
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: artistId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Update request status error:', error);
    next(new Error('حدث خطأ أثناء تحديث حالة الطلب', { cause: 500 }));
  }
});

/**
 * إضافة رد على الطلب - Enhanced for Flutter
 */
export const addResponseToRequest = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { requestId } = req.params;
    const { response: responseText, attachments = [] } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الطلب غير صالح',
        data: null
      });
    }

    if (!responseText || !responseText.trim()) {
      return res.status(400).json({
        success: false,
        message: 'نص الرد مطلوب',
        data: null
      });
    }

    // جلب الطلب
    const request = await specialRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
        data: null
      });
    }

    // التحقق من أن المستخدم هو صاحب الطلب أو الفنان
    const isSender = request.sender.toString() === userId.toString();
    const isArtist = request.artist.toString() === userId.toString();

    if (!isSender && !isArtist) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بإضافة رد على هذا الطلب',
        data: null
      });
    }

    // إضافة الرد
    const updateData = {
      response: responseText.trim(),
      updatedAt: new Date()
    };

    if (attachments && attachments.length > 0) {
      updateData.attachments = [
        ...request.attachments,
        ...attachments.map(attachment => ({
          url: attachment.url || attachment,
          type: attachment.type || 'document',
          name: attachment.name || 'مرفق الرد',
          description: attachment.description || 'مرفق مع الرد',
          uploadedAt: new Date()
        }))
      ];
    }

    const updatedRequest = await specialRequestModel.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    )
    .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('category', 'name image')
    .lean();

    // إرسال إشعار للطرف الآخر
    const recipientId = isSender ? request.artist.toString() : request.sender.toString();
    const sender = await userModel.findById(userId).select('displayName').lean();
    const senderName = sender?.displayName || 'مستخدم';

    try {
      await sendSpecialRequestNotification(
        recipientId,
        'response',
        senderName,
        request.title || 'طلب خاص',
        request.requestType // تمرير نوع الطلب
      );
    } catch (notificationError) {
      console.warn('Push notification failed:', notificationError);
    }

    const response = {
      success: true,
      message: 'تم إضافة الرد بنجاح',
      data: {
        specialRequest: formatSpecialRequest(updatedRequest)
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Add response error:', error);
    next(new Error('حدث خطأ أثناء إضافة الرد', { cause: 500 }));
  }
});

/**
 * إكمال الطلب - Enhanced for Flutter
 */
export const completeRequest = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { requestId } = req.params;
    const { deliverables = [], finalNote } = req.body;
    const artistId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الطلب غير صالح',
        data: null
      });
    }

    // التحقق من أن المستخدم فنان
    if (req.user.role !== 'artist') {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بإكمال الطلب',
        data: null
      });
    }

    // Validate deliverables
    if (!deliverables || deliverables.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'يجب إرفاق ملفات التسليم',
        data: null
      });
    }

    // جلب الطلب
    const request = await specialRequestModel.findOne({
      _id: requestId,
      artist: artistId
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
        data: null
      });
    }

    // التحقق من أن الطلب مقبول أو قيد التنفيذ
    if (!['accepted', 'in_progress', 'review'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إكمال طلب في هذه الحالة',
        data: null
      });
    }

    // تحديث الطلب
    const updateData = {
      status: 'completed',
      deliverables: deliverables.map(deliverable => ({
        url: deliverable.url,
        type: deliverable.type || 'final',
        name: deliverable.name || 'ملف التسليم',
        description: deliverable.description || '',
        uploadedAt: new Date()
      })),
      currentProgress: 100,
      completedAt: new Date(),
      updatedAt: new Date()
    };

    if (finalNote) {
      updateData.finalNote = finalNote;
    }

    const updatedRequest = await specialRequestModel.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    )
    .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('category', 'name image')
    .lean();

    // إرسال إشعار للمستخدم
    try {
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
    } catch (notificationError) {
      console.warn('Push notification failed:', notificationError);
    }

    const response = {
      success: true,
      message: 'تم إكمال الطلب بنجاح',
      data: {
        specialRequest: formatSpecialRequest(updatedRequest)
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: artistId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Complete request error:', error);
    next(new Error('حدث خطأ أثناء إكمال الطلب', { cause: 500 }));
  }
});

/**
 * حذف طلب خاص - بسيط ومباشر
 */
export const deleteRequest = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { requestId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الطلب غير صالح',
        data: null
      });
    }

    // جلب الطلب
    const request = await specialRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
        data: null
      });
    }

    // التحقق من أن المستخدم هو صاحب الطلب
    if (request.sender.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بحذف هذا الطلب',
        data: null
      });
    }

    // تحديث سبب الإلغاء قبل الحذف (اختياري)
    if (cancellationReason) {
      request.cancellationReason = getCancellationReasonLabel(cancellationReason);
      request.cancelledAt = new Date();
      request.cancelledBy = userId;
      await request.save();
    }

    // حذف الطلب من قاعدة البيانات
    await specialRequestModel.findByIdAndDelete(requestId);

    const response = {
      success: true,
      message: 'تم حذف الطلب بنجاح',
      data: {
        deletedRequestId: requestId,
        cancellationReason: cancellationReason || null
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Delete request error:', error);
    next(new Error('حدث خطأ أثناء حذف الطلب', { cause: 500 }));
  }
});

/**
 * Helper function to get cancellation reason label
 */
function getCancellationReasonLabel(reason) {
  const reasons = {
    'ordered_by_mistake': 'طلبت بالخطأ',
    'service_delayed': 'الخدمة تأخرت',
    'other_reasons': 'أسباب أخرى'
  };
  return reasons[reason] || reason;
}

/**
 * إلغاء طلب خاص - Enhanced for Flutter
 */
export const cancelSpecialRequest = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { requestId } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(requestId)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الطلب غير صالح',
        data: null
      });
    }

    // البحث عن الطلب
    const request = await specialRequestModel.findById(requestId);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'الطلب غير موجود',
        data: null
      });
    }

    // التحقق من أن المستخدم هو صاحب الطلب أو الفنان
    const isSender = request.sender.toString() === userId.toString();
    const isArtist = request.artist.toString() === userId.toString();

    if (!isSender && !isArtist) {
      return res.status(403).json({
        success: false,
        message: 'غير مصرح لك بإلغاء هذا الطلب',
        data: null
      });
    }

    // التحقق من حالة الطلب (يمكن إلغاء الطلبات في حالة الانتظار أو المقبولة فقط)
    if (!['pending', 'accepted', 'in_progress'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'لا يمكن إلغاء هذا الطلب في حالته الحالية',
        data: null
      });
    }

    // تحديث حالة الطلب إلى ملغي
    const updateData = {
      status: 'cancelled',
      cancellationReason: cancellationReason || 'تم الإلغاء من قبل المستخدم',
      cancelledAt: new Date(),
      cancelledBy: userId,
      updatedAt: new Date()
    };

    const updatedRequest = await specialRequestModel.findByIdAndUpdate(
      requestId,
      updateData,
      { new: true }
    )
    .populate('sender', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('artist', 'displayName profileImage photoURL job averageRating reviewsCount isVerified email phone')
    .populate('category', 'name image')
    .lean();

    // إرسال إشعار للطرف الآخر
    const recipientId = isSender ? request.artist.toString() : request.sender.toString();
    const user = await userModel.findById(userId).select('displayName').lean();
    const userName = user?.displayName || 'مستخدم';

    try {
      await sendSpecialRequestNotification(
        recipientId,
        'cancelled',
        userName,
        request.title || 'طلب خاص',
        request.requestType // تمرير نوع الطلب
      );
    } catch (notificationError) {
      console.warn('Push notification failed:', notificationError);
    }

    const response = {
      success: true,
      message: 'تم إلغاء الطلب الخاص بنجاح',
      data: {
        specialRequest: formatSpecialRequest(updatedRequest)
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Cancel request error:', error);
    next(new Error('حدث خطأ أثناء إلغاء الطلب', { cause: 500 }));
  }
});

/**
 * Get request types for dropdown/selection
 */
export const getRequestTypes = asyncHandler(async (req, res, next) => {
  try {
    const requestTypes = [
      { value: 'custom_artwork', label: 'عمل فني مخصص', icon: 'palette' },
      { value: 'portrait', label: 'بورتريه', icon: 'person' },
      { value: 'logo_design', label: 'تصميم شعار', icon: 'business' },
      { value: 'illustration', label: 'رسم توضيحي', icon: 'brush' },
      { value: 'digital_art', label: 'فن رقمي', icon: 'computer' },
      { value: 'traditional_art', label: 'فن تقليدي', icon: 'colorize' },
      { value: 'animation', label: 'رسوم متحركة', icon: 'movie' },
      { value: 'graphic_design', label: 'تصميم جرافيك', icon: 'design_services' },
      { value: 'character_design', label: 'تصميم شخصيات', icon: 'face' },
      { value: 'concept_art', label: 'فن تصوري', icon: 'lightbulb' },
      { value: 'other', label: 'أخرى', icon: 'more_horiz' }
    ];

    const response = {
      success: true,
      message: 'تم جلب أنواع الطلبات بنجاح',
      data: {
        requestTypes
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get request types error:', error);
    next(new Error('حدث خطأ أثناء جلب أنواع الطلبات', { cause: 500 }));
  }
});

/**
 * Get cancellation reasons for dropdown
 */
export const getCancellationReasons = asyncHandler(async (req, res, next) => {
  try {
    const cancellationReasons = [
      { value: 'ordered_by_mistake', label: 'طلبت بالخطأ' },
      { value: 'service_delayed', label: 'الخدمة تأخرت' },
      { value: 'other_reasons', label: 'أسباب أخرى' }
    ];

    const response = {
      success: true,
      message: 'تم جلب أسباب الإلغاء بنجاح',
      data: {
        cancellationReasons
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get cancellation reasons error:', error);
    next(new Error('حدث خطأ أثناء جلب أسباب الإلغاء', { cause: 500 }));
  }
});


