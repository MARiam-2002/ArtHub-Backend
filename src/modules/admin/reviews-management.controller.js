import { asyncHandler } from '../../utils/asyncHandler.js';
import reviewModel from '../../../DB/models/review.model.js';
import userModel from '../../../DB/models/user.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';

/**
 * @desc    جلب جميع التقييمات مع التفاصيل
 * @route   GET /api/admin/reviews
 * @access  Private (Admin, SuperAdmin)
 */
export const getAllReviews = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { page = 1, limit = 20 } = req.query;
  
  // حساب التخطي للصفحة
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // جلب التقييمات مع تفاصيل المستخدم والفنان والعمل الفني
  const reviews = await reviewModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $lookup: {
        from: 'artworks',
        localField: 'artwork',
        foreignField: '_id',
        as: 'artworkData'
      }
    },
    {
      $addFields: {
        userName: { $arrayElemAt: ['$userData.displayName', 0] },
        artistName: { $arrayElemAt: ['$artistData.displayName', 0] },
        artworkTitle: { $arrayElemAt: ['$artworkData.title', 0] },
        artworkImage: { $arrayElemAt: ['$artworkData.image', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        rating: 1,
        comment: 1,
        createdAt: 1,
        userName: 1,
        artistName: 1,
        artworkTitle: 1,
        artworkImage: 1
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

  // جلب إجمالي عدد التقييمات
  const totalReviews = await reviewModel.countDocuments({});

  // تنسيق البيانات للعرض
  const formattedReviews = reviews.map((review, index) => ({
    id: skip + index + 1,
    _id: review._id,
    artworkTitle: review.artworkTitle || 'عمل فني',
    clientName: review.userName || 'مستخدم',
    artistName: review.artistName || 'فنان',
    rating: review.rating,
    date: review.createdAt,
    comment: review.comment,
    artworkImage: review.artworkImage
  }));

  res.status(200).json({
    success: true,
    message: 'تم جلب التقييمات بنجاح',
    data: {
      reviews: formattedReviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    جلب تفاصيل تعليق محدد
 * @route   GET /api/admin/reviews/:id
 * @access  Private (Admin, SuperAdmin)
 */
export const getReviewDetails = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف التقييم غير صالح',
      data: null
    });
  }

  const review = await reviewModel.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(id) }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $lookup: {
        from: 'artworks',
        localField: 'artwork',
        foreignField: '_id',
        as: 'artworkData'
      }
    },
    {
      $addFields: {
        userName: { $arrayElemAt: ['$userData.displayName', 0] },
        userEmail: { $arrayElemAt: ['$userData.email', 0] },
        userImage: { $arrayElemAt: ['$userData.profileImage', 0] },
        artistName: { $arrayElemAt: ['$artistData.displayName', 0] },
        artistEmail: { $arrayElemAt: ['$artistData.email', 0] },
        artistImage: { $arrayElemAt: ['$artistData.profileImage', 0] },
        artworkTitle: { $arrayElemAt: ['$artworkData.title', 0] },
        artworkImage: { $arrayElemAt: ['$artworkData.image', 0] },
        artworkDescription: { $arrayElemAt: ['$artworkData.description', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        rating: 1,
        comment: 1,
        createdAt: 1,
        updatedAt: 1,
        userName: 1,
        userEmail: 1,
        userImage: 1,
        artistName: 1,
        artistEmail: 1,
        artistImage: 1,
        artworkTitle: 1,
        artworkImage: 1,
        artworkDescription: 1
      }
    }
  ]);

  if (!review || review.length === 0) {
    return res.status(404).json({
      success: false,
      message: 'التقييم غير موجود',
      data: null
    });
  }

  const reviewData = review[0];

  res.status(200).json({
    success: true,
    message: 'تم جلب تفاصيل التقييم بنجاح',
    data: {
      _id: reviewData._id,
      rating: reviewData.rating,
      comment: reviewData.comment,
      createdAt: reviewData.createdAt,
      updatedAt: reviewData.updatedAt,
      client: {
        name: reviewData.userName,
        email: reviewData.userEmail,
        image: reviewData.userImage
      },
      artist: {
        name: reviewData.artistName,
        email: reviewData.artistEmail,
        image: reviewData.artistImage
      },
      artwork: {
        title: reviewData.artworkTitle,
        image: reviewData.artworkImage,
        description: reviewData.artworkDescription
      }
    }
  });
});

/**
 * @desc    حذف تقييم
 * @route   DELETE /api/admin/reviews/:id
 * @access  Private (Admin, SuperAdmin)
 */
export const deleteReview = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف التقييم غير صالح',
      data: null
    });
  }

  const review = await reviewModel.findById(id);
  
  if (!review) {
    return res.status(404).json({
      success: false,
      message: 'التقييم غير موجود',
      data: null
    });
  }

  // حذف التقييم
  await reviewModel.findByIdAndDelete(id);

  res.status(200).json({
    success: true,
    message: 'تم حذف التقييم بنجاح',
    data: {
      _id: review._id,
      deletedAt: new Date()
    }
  });
});

/**
 * @desc    تصدير بيانات التقييمات
 * @route   GET /api/admin/reviews/export
 * @access  Private (Admin, SuperAdmin)
 */
export const exportReviews = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { format = 'json' } = req.query;

  // جلب جميع التقييمات مع التفاصيل
  const reviews = await reviewModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $lookup: {
        from: 'artworks',
        localField: 'artwork',
        foreignField: '_id',
        as: 'artworkData'
      }
    },
    {
      $addFields: {
        userName: { $arrayElemAt: ['$userData.displayName', 0] },
        userEmail: { $arrayElemAt: ['$userData.email', 0] },
        artistName: { $arrayElemAt: ['$artistData.displayName', 0] },
        artistEmail: { $arrayElemAt: ['$artistData.email', 0] },
        artworkTitle: { $arrayElemAt: ['$artworkData.title', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        rating: 1,
        comment: 1,
        createdAt: 1,
        userName: 1,
        userEmail: 1,
        artistName: 1,
        artistEmail: 1,
        artworkTitle: 1
      }
    },
    {
      $sort: { createdAt: -1 }
    }
  ]);

  if (format === 'csv') {
    // تحويل البيانات إلى CSV
    const csvData = [
      ['الرقم', 'اسم العمل الفني', 'العميل', 'البريد الإلكتروني', 'الفنان', 'التقييم', 'التعليق', 'التاريخ'],
      ...reviews.map((review, index) => [
        index + 1,
        review.artworkTitle || 'عمل فني',
        review.userName || 'مستخدم',
        review.userEmail || '',
        review.artistName || 'فنان',
        review.rating,
        review.comment || '',
        new Date(review.createdAt).toLocaleDateString('ar-SA')
      ])
    ].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="reviews-export.csv"');
    res.send(csvData);
  } else {
    // تصدير بصيغة JSON
    res.status(200).json({
      success: true,
      message: 'تم تصدير بيانات التقييمات بنجاح',
      data: {
        totalReviews: reviews.length,
        exportedAt: new Date(),
        reviews: reviews.map((review, index) => ({
          id: index + 1,
          _id: review._id,
          artworkTitle: review.artworkTitle || 'عمل فني',
          clientName: review.userName || 'مستخدم',
          clientEmail: review.userEmail || '',
          artistName: review.artistName || 'فنان',
          artistEmail: review.artistEmail || '',
          rating: review.rating,
          comment: review.comment || '',
          createdAt: review.createdAt
        }))
      }
    });
  }
});

/**
 * @desc    إحصائيات التقييمات
 * @route   GET /api/admin/reviews/statistics
 * @access  Private (Admin, SuperAdmin)
 */
export const getReviewsStatistics = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();

  // إحصائيات عامة
  const [totalReviews, averageRating, ratingDistribution] = await Promise.all([
    reviewModel.countDocuments({}),
    reviewModel.aggregate([
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' }
        }
      }
    ]),
    reviewModel.aggregate([
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: -1 }
      }
    ])
  ]);

  // أفضل الفنانين تقييماً
  const topRatedArtists = await reviewModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $group: {
        _id: '$artist',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
        artistName: { $first: { $arrayElemAt: ['$artistData.displayName', 0] } },
        artistImage: { $first: { $arrayElemAt: ['$artistData.profileImage', 0] } }
      }
    },
    {
      $match: {
        totalReviews: { $gte: 3 } // على الأقل 3 تقييمات
      }
    },
    {
      $sort: { averageRating: -1, totalReviews: -1 }
    },
    {
      $limit: 5
    }
  ]);

  // أحدث التقييمات
  const latestReviews = await reviewModel.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'userData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artistData'
      }
    },
    {
      $addFields: {
        userName: { $arrayElemAt: ['$userData.displayName', 0] },
        artistName: { $arrayElemAt: ['$artistData.displayName', 0] }
      }
    },
    {
      $project: {
        _id: 1,
        rating: 1,
        comment: 1,
        createdAt: 1,
        userName: 1,
        artistName: 1
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: 5
    }
  ]);

  res.status(200).json({
    success: true,
    message: 'تم جلب إحصائيات التقييمات بنجاح',
    data: {
      overview: {
        totalReviews,
        averageRating: averageRating[0]?.averageRating || 0,
        ratingDistribution
      },
      topRatedArtists: topRatedArtists.map(artist => ({
        name: artist.artistName,
        image: artist.artistImage,
        averageRating: Math.round(artist.averageRating * 10) / 10,
        totalReviews: artist.totalReviews
      })),
      latestReviews: latestReviews.map(review => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        clientName: review.userName,
        artistName: review.artistName,
        createdAt: review.createdAt
      }))
    }
  });
}); 