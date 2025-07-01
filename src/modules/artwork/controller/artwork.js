import artworkModel from '../../../../DB/models/artwork.model.js';
import userModel from '../../../../DB/models/user.model.js';
import reviewModel from '../../../../DB/models/review.model.js';
import { getPaginationParams } from '../../../utils/pagination.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

// جلب كل الأعمال الفنية مع بيانات الفنان
export const getAllArtworks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, 12);
  const [artworks, totalCount] = await Promise.all([
    artworkModel
      .find({})
      .populate({ path: 'artist', select: 'email job profileImage displayName' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    artworkModel.countDocuments({})
  ]);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({ artworks, pagination: paginationMeta }, 'تم جلب الأعمال الفنية بنجاح');
});

// جلب تفاصيل عمل فني
export const getArtworkById = asyncHandler(async (req, res) => {
  const artwork = await artworkModel
    .findById(req.params.id)
    .populate({ path: 'artist', select: 'displayName profileImage job' })
    .populate({ path: 'category', select: 'name' });

  if (!artwork) {
    return res.fail(null, 'العمل غير موجود', 404);
  }

  // زيادة عدد المشاهدات
  artwork.viewCount = (artwork.viewCount || 0) + 1;
  await artwork.save();

  // جلب المراجعات والتقييمات
  const [reviews, stats] = await Promise.all([
    reviewModel
      .find({ artwork: artwork._id })
      .populate('user', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .limit(5),
    reviewModel.aggregate([
      { $match: { artwork: artwork._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          ratings: {
            $push: '$rating'
          }
        }
      }
    ])
  ]);

  // استخراج إحصائيات التقييم
  const avgRating = stats[0]?.avgRating || 0;
  const reviewsCount = stats[0]?.count || 0;

  // حساب توزيع التقييمات (1-5 نجوم)
  const ratingDistribution = stats[0]?.ratings
    ? Array(5)
        .fill(0)
        .map((_, i) => stats[0].ratings.filter(r => Math.round(r) === i + 1).length)
    : [0, 0, 0, 0, 0];

  // أعمال مشابهة
  const similarArtworks = await artworkModel
    .find({
      _id: { $ne: artwork._id },
      $or: [{ category: artwork.category }, { artist: artwork.artist._id }]
    })
    .limit(4)
    .populate('artist', 'displayName profileImage');

  // معلومات الفنان
  const artist = await userModel.findById(artwork.artist._id);

  // متوسط تقييم الفنان
  const artistRating = await reviewModel.aggregate([
    { $match: { artist: artist._id } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  // عدد المبيعات للعمل الفني
  const salesCount = artwork.salesCount || 0;

  // تحقق إذا كان المستخدم قد قام بالتقييم مسبقًا
  let userReview = null;
  if (req.user) {
    userReview = await reviewModel.findOne({
      artwork: artwork._id,
      user: req.user._id
    });
  }

  res.success(
    {
      artwork,
      artist: {
        ...artist.toObject(),
        avgRating: artistRating[0]?.avgRating || 0
      },
      avgRating,
      reviewsCount,
      ratingDistribution,
      reviews,
      similarArtworks,
      salesCount,
      userReview: userReview
        ? {
            rating: userReview.rating,
            comment: userReview.comment
          }
        : null
    },
    'تم جلب تفاصيل العمل الفني بنجاح'
  );
});

// إنشاء عمل فني جديد
export const createArtwork = asyncHandler(async (req, res) => {
  const { title, description, image, price, category, tags } = req.body;
  const artist = req.user._id;

  const artwork = await artworkModel.create({
    title,
    description,
    image,
    price,
    category,
    artist,
    tags: tags || []
  });

  res.success(artwork, 'تم إضافة العمل الفني بنجاح', 201);
});

// تحديث عمل فني
export const updateArtwork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, image, price, category, tags } = req.body;

  const artwork = await artworkModel.findOneAndUpdate(
    { _id: id, artist: req.user._id },
    { title, description, image, price, category, tags },
    { new: true }
  );

  if (!artwork) {
    return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
  }

  res.success(artwork, 'تم تحديث العمل الفني بنجاح');
});

// حذف عمل فني
export const deleteArtwork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const artwork = await artworkModel.findOneAndDelete({ _id: id, artist: req.user._id });

  if (!artwork) {
    return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
  }

  res.success(null, 'تم حذف العمل الفني بنجاح');
});

// جلب الأعمال الفنية حسب الفنان
export const getArtworksByArtist = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  // التحقق من وجود الفنان
  const artist = await userModel.findOne({ _id: artistId, role: 'artist' });
  if (!artist) {
    return res.fail(null, 'الفنان غير موجود', 404);
  }

  const [artworks, totalCount] = await Promise.all([
    artworkModel
      .find({ artist: artistId })
      .populate({ path: 'artist', select: 'email job profileImage displayName' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    artworkModel.countDocuments({ artist: artistId })
  ]);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({ artworks, pagination: paginationMeta }, 'تم جلب أعمال الفنان بنجاح');
});

// جلب الأعمال الفنية حسب الفئة
export const getArtworksByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query);

  const [artworks, totalCount] = await Promise.all([
    artworkModel
      .find({ category: categoryId })
      .populate({ path: 'artist', select: 'email job profileImage displayName' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    artworkModel.countDocuments({ category: categoryId })
  ]);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({ artworks, pagination: paginationMeta }, 'تم جلب الأعمال حسب الفئة بنجاح');
});

/**
 * البحث المتقدم في الأعمال الفنية
 * يدعم البحث متعدد المعايير مثل السعر والتقييم والتاريخ والفنان والفئة والوسوم
 */
export const searchArtworks = asyncHandler(async (req, res) => {
  const { query, category, minPrice, maxPrice, page = 1, limit = 10, sort = 'newest' } = req.query;
  const skip = (page - 1) * parseInt(limit);

  // Build the search filter
  const filter = {};

  // Text search if query is provided
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }

  // Filter by category if provided
  if (category) {
    filter.category = category;
  }

  // Price filter
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) {
      filter.price.$gte = parseFloat(minPrice);
    }
    if (maxPrice) {
      filter.price.$lte = parseFloat(maxPrice);
    }
  }

  // Default to available artworks only
  filter.isAvailable = true;

  // Determine sort order
  let sortOption = {};
  switch (sort) {
    case 'priceAsc':
      sortOption = { price: 1 };
      break;
    case 'priceDesc':
      sortOption = { price: -1 };
      break;
    case 'popular':
      sortOption = { viewCount: -1 };
      break;
    case 'newest':
    default:
      sortOption = { createdAt: -1 };
      break;
  }

  try {
    // Execute query with pagination
    const [artworks, totalCount] = await Promise.all([
      artworkModel
        .find(filter)
        .populate('artist', 'displayName profileImage')
        .populate('category', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(parseInt(limit)),
      artworkModel.countDocuments(filter)
    ]);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.success(
      {
        artworks,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        },
        searchParams: {
          query,
          category,
          minPrice,
          maxPrice,
          sort
        }
      },
      'تم البحث عن الأعمال الفنية بنجاح'
    );
  } catch (error) {
    res.fail(null, 'خطأ في البحث عن الأعمال الفنية', 500);
  }
});

/**
 * الحصول على الأعمال المقترحة (المشابهة)
 * بناءً على العمل الفني الحالي، الفئة، السعر، الوسوم المشابهة
 */
export const getSimilarArtworks = asyncHandler(async (req, res) => {
  const { artworkId } = req.params;
  const { limit = 6 } = req.query;

  // الحصول على العمل الفني الحالي
  const currentArtwork = await artworkModel.findById(artworkId);
  if (!currentArtwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  // بناء استعلام للأعمال المشابهة
  const query = {
    _id: { $ne: currentArtwork._id }, // استبعاد العمل الحالي
    $or: [
      { category: currentArtwork.category }, // نفس الفئة
      { artist: currentArtwork.artist } // نفس الفنان
    ]
  };

  // إضافة نطاق سعري مشابه (± 30%)
  if (currentArtwork.price) {
    const priceRange = currentArtwork.price * 0.3;
    query.price = {
      $gte: currentArtwork.price - priceRange,
      $lte: currentArtwork.price + priceRange
    };
  }

  // إضافة وسوم مشابهة إذا كانت متوفرة
  if (currentArtwork.tags && currentArtwork.tags.length > 0) {
    query.$or.push({ tags: { $in: currentArtwork.tags } });
  }

  // الحصول على الأعمال المشابهة
  const similarArtworks = await artworkModel
    .find(query)
    .populate({ path: 'artist', select: 'email job profileImage displayName' })
    .limit(Number(limit));

  res.success(similarArtworks, 'تم جلب الأعمال المشابهة بنجاح');
});
