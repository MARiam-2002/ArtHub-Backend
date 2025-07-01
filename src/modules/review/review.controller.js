import reviewModel from '../../../DB/models/review.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { getPaginationParams } from '../../utils/pagination.js';

export const addArtworkReview = asyncHandler(async (req, res, next) => {
  const { artwork, rating, comment } = req.body;
  const user = req.user._id;

  // التحقق من وجود العمل الفني
  const artworkDoc = await artworkModel.findById(artwork);
  if (!artworkDoc) {
    return res.status(404).json({
      success: false,
      message: 'العمل الفني غير موجود'
    });
  }

  // التحقق من عدم وجود تقييم سابق
  const existingReview = await reviewModel.findOne({ user, artwork });
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'لقد قمت بتقييم هذا العمل الفني مسبقًا. يمكنك تحديث تقييمك بدلاً من ذلك.'
    });
  }

  // إنشاء تقييم جديد
  const review = await reviewModel.create({
    user,
    artwork,
    artist: artworkDoc.artist,
    rating,
    comment
  });

  // تحديث متوسط تقييم العمل الفني
  const avgRating = await reviewModel.aggregate([
    { $match: { artwork: mongoose.Types.ObjectId(artwork) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);

  if (avgRating.length > 0) {
    await artworkModel.findByIdAndUpdate(artwork, {
      rating: avgRating[0].avgRating
    });
  }

  // إرجاع التقييم مع معلومات المستخدم
  await review.populate('user', 'displayName userName profileImage');

  res.status(201).json({
    success: true,
    message: 'تم إضافة التقييم بنجاح',
    data: review
  });
});

export const updateArtworkReview = asyncHandler(async (req, res, next) => {
  const { artwork, rating, comment } = req.body;
  const user = req.user._id;

  // التحقق من وجود تقييم سابق
  const existingReview = await reviewModel.findOne({ user, artwork });
  if (!existingReview) {
    return res.status(404).json({
      success: false,
      message: 'لم يتم العثور على تقييم سابق لتحديثه'
    });
  }

  // تحديث التقييم
  existingReview.rating = rating;
  existingReview.comment = comment;
  await existingReview.save();

  // تحديث متوسط تقييم العمل الفني
  const avgRating = await reviewModel.aggregate([
    { $match: { artwork: mongoose.Types.ObjectId(artwork) } },
    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
  ]);

  if (avgRating.length > 0) {
    await artworkModel.findByIdAndUpdate(artwork, {
      rating: avgRating[0].avgRating
    });
  }

  // إرجاع التقييم المحدث مع معلومات المستخدم
  await existingReview.populate('user', 'displayName userName profileImage');

  res.json({
    success: true,
    message: 'تم تحديث التقييم بنجاح',
    data: existingReview
  });
});

export const getArtworkReviews = asyncHandler(async (req, res, next) => {
  const { artworkId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // التحقق من وجود العمل الفني
  const artwork = await artworkModel.findById(artworkId);
  if (!artwork) {
    return res.status(404).json({
      success: false,
      message: 'العمل الفني غير موجود'
    });
  }

  // جلب التقييمات مع التصفح
  const [reviews, totalCount, stats] = await Promise.all([
    reviewModel
      .find({ artwork: artworkId })
      .populate('user', 'displayName userName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    reviewModel.countDocuments({ artwork: artworkId }),
    reviewModel.aggregate([
      { $match: { artwork: mongoose.Types.ObjectId(artworkId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      }
    ])
  ]);

  // حساب توزيع التقييمات
  const ratingDistribution = [0, 0, 0, 0, 0]; // 1-5 نجوم

  if (stats.length > 0 && stats[0].ratings) {
    stats[0].ratings.forEach(rating => {
      const index = Math.floor(rating) - 1;
      if (index >= 0 && index < 5) {
        ratingDistribution[index]++;
      }
    });
  }

  // معلومات الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    message: 'تم جلب التقييمات بنجاح',
    data: {
      reviews,
      stats: {
        avgRating: stats.length > 0 ? stats[0].avgRating : 0,
        count: totalCount,
        distribution: ratingDistribution
      },
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    }
  });
});

export const addArtistReview = asyncHandler(async (req, res, next) => {
  const { artist, rating, comment } = req.body;
  const user = req.user._id;

  // التحقق من وجود الفنان
  const artistDoc = await userModel.findOne({ _id: artist, role: 'artist' });
  if (!artistDoc) {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود'
    });
  }

  // التحقق من عدم وجود تقييم سابق
  const existingReview = await reviewModel.findOne({ user, artist });
  if (existingReview) {
    return res.status(400).json({
      success: false,
      message: 'لقد قمت بتقييم هذا الفنان مسبقًا. يمكنك تحديث تقييمك بدلاً من ذلك.'
    });
  }

  // إنشاء تقييم جديد
  const review = await reviewModel.create({ user, artist, rating, comment });

  // إرجاع التقييم مع معلومات المستخدم
  await review.populate('user', 'displayName userName profileImage');

  res.status(201).json({
    success: true,
    message: 'تم إضافة تقييم الفنان بنجاح',
    data: review
  });
});

export const getArtistReviews = asyncHandler(async (req, res, next) => {
  const { artistId } = req.params;
  const { page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  // التحقق من وجود الفنان
  const artist = await userModel.findOne({ _id: artistId, role: 'artist' });
  if (!artist) {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود'
    });
  }

  // جلب التقييمات مع التصفح
  const [reviews, totalCount, stats] = await Promise.all([
    reviewModel
      .find({ artist: artistId })
      .populate('user', 'displayName userName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    reviewModel.countDocuments({ artist: artistId }),
    reviewModel.aggregate([
      { $match: { artist: mongoose.Types.ObjectId(artistId) } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      }
    ])
  ]);

  // حساب توزيع التقييمات (5 نجوم، 4 نجوم، إلخ)
  const ratingDistribution = [0, 0, 0, 0, 0]; // توزيع التقييمات (1-5 نجوم)

  if (stats.length > 0 && stats[0].ratings) {
    stats[0].ratings.forEach(rating => {
      const index = Math.floor(rating) - 1;
      if (index >= 0 && index < 5) {
        ratingDistribution[index]++;
      }
    });
  }

  // حساب النسب المئوية للتوزيع
  const totalRatings = ratingDistribution.reduce((acc, val) => acc + val, 0);
  const distributionPercentages = ratingDistribution.map(count =>
    totalRatings > 0 ? Math.round((count / totalRatings) * 100) : 0
  );

  // معلومات الصفحات
  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    message: 'تم جلب تقييمات الفنان بنجاح',
    data: {
      reviews,
      stats: {
        avgRating: stats.length > 0 ? parseFloat(stats[0].avgRating.toFixed(1)) : 0,
        count: totalCount,
        distribution: {
          counts: ratingDistribution.reverse(), // Reverse to show 5-star first
          percentages: distributionPercentages.reverse(),
          labels: ['5', '4', '3', '2', '1']
        }
      },
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalItems: totalCount,
        hasNextPage: Number(page) < totalPages,
        hasPrevPage: Number(page) > 1
      }
    }
  });
});

export const getArtworkReviewsWithStats = asyncHandler(async (req, res) => {
  const { artworkId } = req.params.id ? { artworkId: req.params.id } : req.params;
  const { page, limit, skip } = getPaginationParams(req.query, 10);
  const [reviews, stats] = await Promise.all([
    reviewModel.find({ artwork: artworkId }).populate('user', 'email').skip(skip).limit(limit),
    reviewModel.aggregate([
      {
        $match: {
          artwork:
            typeof artworkId === 'string' ? new mongoose.Types.ObjectId(artworkId) : artworkId
        }
      },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ])
  ]);
  const avgRating = stats[0]?.avgRating || 0;
  const reviewsCount = stats[0]?.count || 0;
  res.success(
    { reviews, avgRating, reviewsCount, page, limit },
    'تم جلب التقييمات والإحصائيات بنجاح'
  );
});
