import reviewModel from '../../../DB/models/review.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import transactionModel from '../../../DB/models/transaction.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getPaginationParams } from '../../utils/pagination.js';
import { createNotification } from '../notification/notification.controller.js';
import mongoose from 'mongoose';

/**
 * إنشاء تقييم جديد لعمل فني
 * @route POST /api/reviews/artwork
 * @access Private
 */
export const createArtworkReview = asyncHandler(async (req, res, next) => {
  const { artwork, rating, title, comment, pros, cons, subRatings, isRecommended } = req.body;
  const userId = req.user._id;

  // التحقق من صحة معرف العمل الفني
  if (!mongoose.Types.ObjectId.isValid(artwork)) {
    return res.fail(null, 'معرف العمل الفني غير صالح', 400);
  }

  // التحقق من وجود العمل الفني
  const artworkDoc = await artworkModel.findById(artwork).lean();
  if (!artworkDoc) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  // منع تقييم العمل الفني الخاص بالمستخدم
  if (artworkDoc.artist.toString() === userId.toString()) {
    return res.fail(null, 'لا يمكنك تقييم عملك الفني الخاص', 400);
  }

  // التحقق من عدم وجود تقييم سابق
  const existingReview = await reviewModel.findOne({ 
    user: userId, 
    artwork,
    status: { $ne: 'deleted' }
  });

  if (existingReview) {
    return res.fail(null, 'لقد قمت بتقييم هذا العمل الفني مسبقاً. يمكنك تحديث تقييمك بدلاً من ذلك.', 400);
  }

  // التحقق من المشتريات المعتمدة
  const verifiedPurchase = await transactionModel.findOne({
    buyer: userId,
    'items.artwork': artwork,
    status: 'completed'
  });

  // جمع البيانات الوصفية
  const metadata = {
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
    deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
    language: req.get('Accept-Language')?.split(',')[0] || 'ar'
  };

  // إنشاء التقييم الجديد
  const reviewData = {
    user: userId,
    artwork,
    artist: artworkDoc.artist,
    rating,
    title,
    comment,
    pros: pros?.filter(p => p && p.trim()),
    cons: cons?.filter(c => c && c.trim()),
    subRatings,
    isRecommended,
    isVerifiedPurchase: !!verifiedPurchase,
    metadata,
    status: 'active'
  };

  const review = await reviewModel.create(reviewData);

  // تحديث متوسط تقييم العمل الفني
  const ratingStats = await reviewModel.getAverageRating(artwork, 'artwork');
  await artworkModel.findByIdAndUpdate(artwork, {
    rating: ratingStats.avgRating || 0,
    reviewsCount: ratingStats.count || 0
  });

  // إرسال إشعار للفنان
  try {
    await createNotification({
      userId: artworkDoc.artist,
      type: 'artwork_reviewed',
      title: 'تقييم جديد لعملك الفني',
      message: `تم تقييم عملك الفني "${artworkDoc.title}" بـ ${rating} نجوم`,
      data: {
        artworkId: artwork,
        reviewId: review._id,
        rating
      }
    });
  } catch (notificationError) {
    console.error('خطأ في إرسال الإشعار:', notificationError);
  }

  // إرجاع التقييم مع البيانات المطلوبة
  const populatedReview = await reviewModel
    .findById(review._id)
    .populate('user', 'displayName userName profileImage')
    .populate('artwork', 'title images')
    .lean();

  res.success(populatedReview, 'تم إضافة التقييم بنجاح', 201);
});

/**
 * تحديث تقييم عمل فني موجود
 * @route PUT /api/reviews/artwork/:reviewId
 * @access Private
 */
export const updateArtworkReview = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, title, comment, pros, cons, subRatings, isRecommended } = req.body;
  const userId = req.user._id;

  // التحقق من صحة معرف التقييم
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.fail(null, 'معرف التقييم غير صالح', 400);
  }

  // البحث عن التقييم
  const existingReview = await reviewModel.findOne({
    _id: reviewId,
    user: userId,
    status: { $ne: 'deleted' }
  });

  if (!existingReview) {
    return res.fail(null, 'التقييم غير موجود أو لا يمكن تحديثه', 404);
  }

  // تحديث بيانات التقييم
  existingReview.rating = rating;
  existingReview.title = title;
  existingReview.comment = comment;
  existingReview.pros = pros?.filter(p => p && p.trim()) || [];
  existingReview.cons = cons?.filter(c => c && c.trim()) || [];
  existingReview.subRatings = subRatings;
  existingReview.isRecommended = isRecommended;

  await existingReview.save();

  // تحديث متوسط تقييم العمل الفني
  const ratingStats = await reviewModel.getAverageRating(existingReview.artwork, 'artwork');
  await artworkModel.findByIdAndUpdate(existingReview.artwork, {
    rating: ratingStats.avgRating || 0,
    reviewsCount: ratingStats.count || 0
  });

  // إرجاع التقييم المحدث
  const updatedReview = await reviewModel
    .findById(reviewId)
    .populate('user', 'displayName userName profileImage')
    .populate('artwork', 'title images')
    .lean();

  res.success(updatedReview, 'تم تحديث التقييم بنجاح');
});

/**
 * جلب تقييمات عمل فني مع إحصائيات متقدمة
 * @route GET /api/reviews/artwork/:artworkId
 * @access Public
 */
export const getArtworkReviews = asyncHandler(async (req, res, next) => {
  const { artworkId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query, 10);
  const { rating, sortBy = 'createdAt', sortOrder = 'desc', verified, recommended, search } = req.query;

  // التحقق من صحة معرف العمل الفني
  if (!mongoose.Types.ObjectId.isValid(artworkId)) {
    return res.fail(null, 'معرف العمل الفني غير صالح', 400);
  }

  // التحقق من وجود العمل الفني
  const artwork = await artworkModel.findById(artworkId).lean();
  if (!artwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  // بناء فلتر البحث
  const filter = {
    artwork: artworkId,
    status: 'active'
  };

  if (rating) filter.rating = parseInt(rating);
  if (verified !== undefined) filter.isVerifiedPurchase = verified === 'true';
  if (recommended !== undefined) filter.isRecommended = recommended === 'true';
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { comment: { $regex: search, $options: 'i' } }
    ];
  }

  // بناء معايير الترتيب
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // جلب التقييمات والإحصائيات بشكل متوازي
  const [reviews, totalCount, ratingStats, distribution] = await Promise.all([
    reviewModel
      .find(filter)
      .populate('user', 'displayName userName profileImage')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    
    reviewModel.countDocuments(filter),
    
    reviewModel.getAverageRating(artworkId, 'artwork'),
    
    reviewModel.getRatingDistribution(artworkId, 'artwork')
  ]);

  // حساب إحصائيات إضافية
  const verifiedCount = await reviewModel.countDocuments({
    artwork: artworkId,
    status: 'active',
    isVerifiedPurchase: true
  });

  const recommendedCount = await reviewModel.countDocuments({
    artwork: artworkId,
    status: 'active',
    isRecommended: true
  });

  // معلومات الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  const responseData = {
    reviews,
    stats: {
      avgRating: Math.round((ratingStats.avgRating || 0) * 10) / 10,
      totalReviews: totalCount,
      distribution,
      verifiedCount,
      recommendedCount,
      recommendationRate: totalCount > 0 ? Math.round((recommendedCount / totalCount) * 100) : 0
    },
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    }
  };

  res.success(responseData, 'تم جلب التقييمات بنجاح');
});

/**
 * إنشاء تقييم جديد لفنان
 * @route POST /api/reviews/artist
 * @access Private
 */
export const createArtistReview = asyncHandler(async (req, res, next) => {
  const { artist, rating, title, comment, pros, cons, isRecommended } = req.body;
  const userId = req.user._id;

  // التحقق من صحة معرف الفنان
  if (!mongoose.Types.ObjectId.isValid(artist)) {
    return res.fail(null, 'معرف الفنان غير صالح', 400);
  }

  // التحقق من وجود الفنان
  const artistDoc = await userModel.findOne({ 
    _id: artist, 
    role: { $in: ['artist', 'admin'] } 
  }).lean();

  if (!artistDoc) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  // منع تقييم النفس
  if (artist === userId.toString()) {
    return res.fail(null, 'لا يمكنك تقييم نفسك', 400);
  }

  // التحقق من عدم وجود تقييم سابق
  const existingReview = await reviewModel.findOne({ 
    user: userId, 
    artist,
    status: { $ne: 'deleted' }
  });

  if (existingReview) {
    return res.fail(null, 'لقد قمت بتقييم هذا الفنان مسبقاً. يمكنك تحديث تقييمك بدلاً من ذلك.', 400);
  }

  // التحقق من التعامل السابق مع الفنان
  const hasTransaction = await transactionModel.findOne({
    $or: [
      { buyer: userId, seller: artist },
      { seller: userId, buyer: artist }
    ],
    status: 'completed'
  });

  // جمع البيانات الوصفية
  const metadata = {
    userAgent: req.get('User-Agent'),
    ipAddress: req.ip,
    deviceType: req.get('User-Agent')?.includes('Mobile') ? 'mobile' : 'desktop',
    language: req.get('Accept-Language')?.split(',')[0] || 'ar'
  };

  // إنشاء التقييم الجديد
  const reviewData = {
    user: userId,
    artist,
    rating,
    title,
    comment,
    pros: pros?.filter(p => p && p.trim()),
    cons: cons?.filter(c => c && c.trim()),
    isRecommended,
    isVerifiedPurchase: !!hasTransaction,
    metadata,
    status: 'active'
  };

  const review = await reviewModel.create(reviewData);

  // إرسال إشعار للفنان
  try {
    await createNotification({
      userId: artist,
      type: 'artist_reviewed',
      title: 'تقييم جديد لملفك الشخصي',
      message: `تم تقييم ملفك الشخصي بـ ${rating} نجوم`,
      data: {
        reviewId: review._id,
        rating
      }
    });
  } catch (notificationError) {
    console.error('خطأ في إرسال الإشعار:', notificationError);
  }

  // إرجاع التقييم مع البيانات المطلوبة
  const populatedReview = await reviewModel
    .findById(review._id)
    .populate('user', 'displayName userName profileImage')
    .populate('artist', 'displayName userName profileImage')
    .lean();

  res.success(populatedReview, 'تم إضافة تقييم الفنان بنجاح', 201);
});

/**
 * تحديث تقييم فنان موجود
 * @route PUT /api/reviews/artist/:reviewId
 * @access Private
 */
export const updateArtistReview = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;
  const { rating, title, comment, pros, cons, isRecommended } = req.body;
  const userId = req.user._id;

  // التحقق من صحة معرف التقييم
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.fail(null, 'معرف التقييم غير صالح', 400);
  }

  // البحث عن التقييم
  const existingReview = await reviewModel.findOne({
    _id: reviewId,
    user: userId,
    artist: { $exists: true },
    status: { $ne: 'deleted' }
  });

  if (!existingReview) {
    return res.fail(null, 'التقييم غير موجود أو لا يمكن تحديثه', 404);
  }

  // تحديث بيانات التقييم
  existingReview.rating = rating;
  existingReview.title = title;
  existingReview.comment = comment;
  existingReview.pros = pros?.filter(p => p && p.trim()) || [];
  existingReview.cons = cons?.filter(c => c && c.trim()) || [];
  existingReview.isRecommended = isRecommended;

  await existingReview.save();

  // إرجاع التقييم المحدث
  const updatedReview = await reviewModel
    .findById(reviewId)
    .populate('user', 'displayName userName profileImage')
    .populate('artist', 'displayName userName profileImage')
    .lean();

  res.success(updatedReview, 'تم تحديث تقييم الفنان بنجاح');
});

/**
 * جلب تقييمات فنان مع إحصائيات متقدمة
 * @route GET /api/reviews/artist/:artistId
 * @access Public
 */
export const getArtistReviews = asyncHandler(async (req, res, next) => {
  const { artistId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query, 10);
  const { rating, sortBy = 'createdAt', sortOrder = 'desc', verified, recommended, search } = req.query;

  // التحقق من صحة معرف الفنان
  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.fail(null, 'معرف الفنان غير صالح', 400);
  }

  // التحقق من وجود الفنان
  const artist = await userModel.findOne({ 
    _id: artistId, 
    role: { $in: ['artist', 'admin'] }
  }).lean();

  if (!artist) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  // بناء فلتر البحث
  const filter = {
    artist: artistId,
    status: 'active'
  };

  if (rating) filter.rating = parseInt(rating);
  if (verified !== undefined) filter.isVerifiedPurchase = verified === 'true';
  if (recommended !== undefined) filter.isRecommended = recommended === 'true';
  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { comment: { $regex: search, $options: 'i' } }
    ];
  }

  // بناء معايير الترتيب
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // جلب التقييمات والإحصائيات بشكل متوازي
  const [reviews, totalCount, ratingStats, distribution] = await Promise.all([
    reviewModel
      .find(filter)
      .populate('user', 'displayName userName profileImage')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    
    reviewModel.countDocuments(filter),
    
    reviewModel.getAverageRating(artistId, 'artist'),
    
    reviewModel.getRatingDistribution(artistId, 'artist')
  ]);

  // حساب إحصائيات إضافية
  const verifiedCount = await reviewModel.countDocuments({
    artist: artistId,
    status: 'active',
    isVerifiedPurchase: true
  });

  const recommendedCount = await reviewModel.countDocuments({
    artist: artistId,
    status: 'active',
    isRecommended: true
  });

  // معلومات الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  const responseData = {
    reviews,
    stats: {
      avgRating: Math.round((ratingStats.avgRating || 0) * 10) / 10,
      totalReviews: totalCount,
      distribution,
      verifiedCount,
      recommendedCount,
      recommendationRate: totalCount > 0 ? Math.round((recommendedCount / totalCount) * 100) : 0
    },
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    }
  };

  res.success(responseData, 'تم جلب تقييمات الفنان بنجاح');
});

/**
 * حذف تقييم
 * @route DELETE /api/reviews/:reviewId
 * @access Private
 */
export const deleteReview = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;
  const userId = req.user._id;

  // التحقق من صحة معرف التقييم
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.fail(null, 'معرف التقييم غير صالح', 400);
  }

  // البحث عن التقييم
  const review = await reviewModel.findOne({
    _id: reviewId,
    user: userId,
    status: { $ne: 'deleted' }
  });

  if (!review) {
    return res.fail(null, 'التقييم غير موجود أو لا يمكن حذفه', 404);
  }

  // وضع علامة حذف بدلاً من الحذف الفعلي
  review.status = 'deleted';
  await review.save();

  // تحديث إحصائيات العمل الفني أو الفنان
  if (review.artwork) {
    const ratingStats = await reviewModel.getAverageRating(review.artwork, 'artwork');
    await artworkModel.findByIdAndUpdate(review.artwork, {
      rating: ratingStats.avgRating || 0,
      reviewsCount: ratingStats.count || 0
    });
  }

  res.success(null, 'تم حذف التقييم بنجاح');
});

/**
 * تمييز التقييم كمفيد أو إلغاء التمييز
 * @route POST /api/reviews/:reviewId/helpful
 * @access Private
 */
export const markReviewAsHelpful = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;
  const { helpful } = req.body;
  const userId = req.user._id;

  // التحقق من صحة معرف التقييم
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.fail(null, 'معرف التقييم غير صالح', 400);
  }

  // البحث عن التقييم
  const review = await reviewModel.findOne({
    _id: reviewId,
    status: 'active'
  });

  if (!review) {
    return res.fail(null, 'التقييم غير موجود', 404);
  }

  // منع تمييز التقييم الخاص بالمستخدم
  if (review.user.toString() === userId.toString()) {
    return res.fail(null, 'لا يمكنك تمييز تقييمك الخاص', 400);
  }

  // تطبيق التمييز أو إلغاؤه
  if (helpful) {
    review.markAsHelpful(userId);
  } else {
    review.unmarkAsHelpful(userId);
  }

  await review.save();

  res.success({
    reviewId,
    helpfulVotes: review.helpfulVotes,
    isMarkedHelpful: review.interactions.helpful.includes(userId)
  }, helpful ? 'تم تمييز التقييم كمفيد' : 'تم إلغاء تمييز التقييم');
});

/**
 * الإبلاغ عن تقييم
 * @route POST /api/reviews/:reviewId/report
 * @access Private
 */
export const reportReview = asyncHandler(async (req, res, next) => {
  const { reviewId } = req.params;
  const { reason, description } = req.body;
  const userId = req.user._id;

  // التحقق من صحة معرف التقييم
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.fail(null, 'معرف التقييم غير صالح', 400);
  }

  // البحث عن التقييم
  const review = await reviewModel.findOne({
    _id: reviewId,
    status: 'active'
  });

  if (!review) {
    return res.fail(null, 'التقييم غير موجود', 404);
  }

  // منع الإبلاغ عن التقييم الخاص بالمستخدم
  if (review.user.toString() === userId.toString()) {
    return res.fail(null, 'لا يمكنك الإبلاغ عن تقييمك الخاص', 400);
  }

  // التحقق من عدم الإبلاغ المسبق
  if (review.interactions.reported.includes(userId)) {
    return res.fail(null, 'لقد قمت بالإبلاغ عن هذا التقييم مسبقاً', 400);
  }

  // تسجيل الإبلاغ
  review.reportReview(userId);

  // إذا تجاوز عدد الإبلاغات حد معين، إخفاء التقييم
  if (review.reportedCount >= 5) {
    review.status = 'reported';
  }

  await review.save();

  // إرسال إشعار للمدراء
  try {
    const admins = await userModel.find({ role: 'admin' }).select('_id');
    for (const admin of admins) {
      await createNotification({
        userId: admin._id,
        type: 'review_reported',
        title: 'تقييم مبلغ عنه',
        message: `تم الإبلاغ عن تقييم بسبب: ${reason}`,
        data: {
          reviewId,
          reason,
          description,
          reporterId: userId
        }
      });
    }
  } catch (notificationError) {
    console.error('خطأ في إرسال الإشعار:', notificationError);
  }

  res.success(null, 'تم الإبلاغ عن التقييم بنجاح');
});

/**
 * جلب تقييمات المستخدم
 * @route GET /api/reviews/my
 * @access Private
 */
export const getMyReviews = asyncHandler(async (req, res, next) => {
  const userId = req.user._id;
  const { page, limit, skip } = getPaginationParams(req.query, 10);
  const { type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // بناء فلتر البحث
  const filter = {
    user: userId,
    status: { $ne: 'deleted' }
  };

  if (type === 'artwork') {
    filter.artwork = { $exists: true };
  } else if (type === 'artist') {
    filter.artist = { $exists: true };
  }

  // بناء معايير الترتيب
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // جلب التقييمات والإحصائيات
  const [reviews, totalCount, stats] = await Promise.all([
    reviewModel
      .find(filter)
      .populate('artwork', 'title images')
      .populate('artist', 'displayName userName profileImage')
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    
    reviewModel.countDocuments(filter),
    
    reviewModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalHelpfulVotes: { $sum: '$helpfulVotes' },
          artworkReviews: {
            $sum: { $cond: [{ $ifNull: ['$artwork', false] }, 1, 0] }
          },
          artistReviews: {
            $sum: { $cond: [{ $ifNull: ['$artist', false] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  // معلومات الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  const responseData = {
    reviews,
    stats: stats[0] || {
      avgRating: 0,
      totalHelpfulVotes: 0,
      artworkReviews: 0,
      artistReviews: 0
    },
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      limit
    }
  };

  res.success(responseData, 'تم جلب تقييماتك بنجاح');
});

/**
 * جلب إحصائيات التقييمات (للمدراء)
 * @route GET /api/reviews/admin/stats
 * @access Private (Admin)
 */
export const getReviewsStats = asyncHandler(async (req, res, next) => {
  // التحقق من صلاحيات المدير
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بعرض إحصائيات التقييمات', 403);
  }

  const { period = 'month', groupBy = 'rating' } = req.query;

  // حساب تاريخ البداية حسب الفترة
  let dateFilter = {};
  const now = new Date();
  
  switch (period) {
    case 'day':
      dateFilter = { $gte: new Date(now.setHours(0, 0, 0, 0)) };
      break;
    case 'week':
      dateFilter = { $gte: new Date(now.setDate(now.getDate() - 7)) };
      break;
    case 'month':
      dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 1)) };
      break;
    case 'quarter':
      dateFilter = { $gte: new Date(now.setMonth(now.getMonth() - 3)) };
      break;
    case 'year':
      dateFilter = { $gte: new Date(now.setFullYear(now.getFullYear() - 1)) };
      break;
    default:
      dateFilter = {};
  }

  const matchCondition = { status: 'active' };
  if (Object.keys(dateFilter).length > 0) {
    matchCondition.createdAt = dateFilter;
  }

  // الحصول على الإحصائيات العامة
  const [
    totalReviews,
    artworkReviews,
    artistReviews,
    avgRating,
    topRatedContent,
    recentActivity
  ] = await Promise.all([
    reviewModel.countDocuments(matchCondition),
    
    reviewModel.countDocuments({ ...matchCondition, artwork: { $exists: true } }),
    
    reviewModel.countDocuments({ ...matchCondition, artist: { $exists: true } }),
    
    reviewModel.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]),
    
    reviewModel.aggregate([
      { $match: matchCondition },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]),
    
    reviewModel.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } },
      { $limit: 30 }
    ])
  ]);

  const responseData = {
    summary: {
      total: totalReviews,
      artworkReviews,
      artistReviews,
      avgRating: avgRating[0]?.avgRating || 0
    },
    distribution: topRatedContent,
    activity: recentActivity.reverse()
  };

  res.success(responseData, 'تم جلب إحصائيات التقييمات بنجاح');
});

/**
 * إدارة التقييم (للمدراء)
 * @route PATCH /api/reviews/:reviewId/moderate
 * @access Private (Admin)
 */
export const moderateReview = asyncHandler(async (req, res, next) => {
  // التحقق من صلاحيات المدير
  if (req.user.role !== 'admin') {
    return res.fail(null, 'غير مصرح لك بإدارة التقييمات', 403);
  }

  const { reviewId } = req.params;
  const { status, moderationNotes } = req.body;
  const userId = req.user._id;

  // التحقق من صحة معرف التقييم
  if (!mongoose.Types.ObjectId.isValid(reviewId)) {
    return res.fail(null, 'معرف التقييم غير صالح', 400);
  }

  // البحث عن التقييم
  const review = await reviewModel.findById(reviewId);
  if (!review) {
    return res.fail(null, 'التقييم غير موجود', 404);
  }

  // تحديث حالة التقييم
  review.status = status;
  review.moderationNotes = moderationNotes;
  review.moderatedBy = userId;
  review.moderatedAt = new Date();

  await review.save();

  // إرسال إشعار لصاحب التقييم
  try {
    let notificationMessage = '';
    switch (status) {
      case 'active':
        notificationMessage = 'تم قبول تقييمك وإعادة نشره';
        break;
      case 'hidden':
        notificationMessage = 'تم إخفاء تقييمك من قبل الإدارة';
        break;
      case 'deleted':
        notificationMessage = 'تم حذف تقييمك من قبل الإدارة';
        break;
    }

    if (notificationMessage) {
      await createNotification({
        userId: review.user,
        type: 'review_moderated',
        title: 'تحديث حالة التقييم',
        message: notificationMessage,
        data: {
          reviewId,
          status,
          moderationNotes
        }
      });
    }
  } catch (notificationError) {
    console.error('خطأ في إرسال الإشعار:', notificationError);
  }

  res.success(review, 'تم تحديث حالة التقييم بنجاح');
});

// دالة مساعدة للتوافق مع النسخة القديمة
export const getArtworkReviewsWithStats = getArtworkReviews;
