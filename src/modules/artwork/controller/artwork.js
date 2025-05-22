import artworkModel from '../../../../DB/models/artwork.model.js';
import userModel from '../../../../DB/models/user.model.js';
import reviewModel from '../../../../DB/models/review.model.js';
import { getPaginationParams } from '../../../utils/pagination.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

// جلب كل الأعمال الفنية مع بيانات الفنان
export const getAllArtworks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, 12);
  const [artworks, totalCount] = await Promise.all([
    artworkModel.find({})
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
  const artwork = await artworkModel.findById(req.params.id)
    .populate({ path: 'artist', select: 'displayName profileImage job' })
    .populate({ path: 'category', select: 'name' });
  
  if (!artwork) return res.fail(null, 'العمل غير موجود', 404);
  
  // زيادة عدد المشاهدات
  artwork.viewCount = (artwork.viewCount || 0) + 1;
  await artwork.save();
  
  // جلب المراجعات والتقييمات
  const [reviews, stats] = await Promise.all([
    reviewModel.find({ artwork: artwork._id })
      .populate('user', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .limit(5),
    reviewModel.aggregate([
      { $match: { artwork: artwork._id } },
      { 
        $group: { 
          _id: null, 
          avgRating: { $avg: "$rating" }, 
          count: { $sum: 1 },
          ratings: {
            $push: "$rating"
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
    ? Array(5).fill(0).map((_, i) => 
        stats[0].ratings.filter(r => Math.round(r) === i + 1).length
      )
    : [0, 0, 0, 0, 0];
  
  // أعمال مشابهة
  const similarArtworks = await artworkModel.find({
    _id: { $ne: artwork._id },
    $or: [
      { category: artwork.category },
      { artist: artwork.artist._id }
    ]
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
        avgRating: { $avg: "$rating" }
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
  
  res.success({ 
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
    userReview: userReview ? {
      rating: userReview.rating,
      comment: userReview.comment
    } : null
  }, 'تم جلب تفاصيل العمل الفني بنجاح');
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
  
  if (!artwork) return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
  
  res.success(artwork, 'تم تحديث العمل الفني بنجاح');
});

// حذف عمل فني
export const deleteArtwork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const artwork = await artworkModel.findOneAndDelete({ _id: id, artist: req.user._id });
  
  if (!artwork) return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
  
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
    artworkModel.find({ artist: artistId })
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
    artworkModel.find({ category: categoryId })
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
  const { 
    query, 
    minPrice, 
    maxPrice, 
    minRating,
    category,
    artist,
    tags,
    sortBy,
    sortOrder
  } = req.query;
  
  const { page, limit, skip } = getPaginationParams(req.query);
  
  // بناء استعلام البحث
  const searchQuery = {};
  
  // البحث بالنص في العنوان والوصف
  if (query) {
    searchQuery.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ];
  }
  
  // تصفية حسب السعر
  if (minPrice !== undefined || maxPrice !== undefined) {
    searchQuery.price = {};
    if (minPrice !== undefined) searchQuery.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) searchQuery.price.$lte = Number(maxPrice);
  }
  
  // تصفية حسب الفئة
  if (category) {
    searchQuery.category = category;
  }
  
  // تصفية حسب الفنان
  if (artist) {
    searchQuery.artist = artist;
  }
  
  // تصفية حسب الوسوم
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    searchQuery.tags = { $in: tagArray };
  }
  
  // تحديد ترتيب النتائج
  const sort = {};
  const validSortFields = ['price', 'createdAt', 'title', 'rating'];
  
  if (sortBy && validSortFields.includes(sortBy)) {
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1; // افتراضيًا: الأحدث أولاً
  }
  
  // تنفيذ البحث
  const [artworks, totalCount] = await Promise.all([
    artworkModel.find(searchQuery)
      .populate({ path: 'artist', select: 'email job profileImage displayName' })
      .populate({ path: 'category', select: 'name' })
      .sort(sort)
      .skip(skip)
      .limit(limit),
    artworkModel.countDocuments(searchQuery)
  ]);
  
  // إذا تم طلب التصفية حسب التقييم، نحتاج لمعالجة خاصة
  let filteredArtworks = [...artworks];
  
  if (minRating !== undefined) {
    // جلب تقييمات كل عمل فني
    const artworkIds = artworks.map(artwork => artwork._id);
    
    const ratings = await reviewModel.aggregate([
      { $match: { artwork: { $in: artworkIds } } },
      { $group: { _id: '$artwork', avgRating: { $avg: '$rating' } } }
    ]);
    
    // خريطة للتقييمات
    const ratingMap = {};
    ratings.forEach(rating => {
      ratingMap[rating._id.toString()] = rating.avgRating;
    });
    
    // تصفية الأعمال حسب التقييم
    filteredArtworks = artworks.filter(artwork => {
      const artworkId = artwork._id.toString();
      const rating = ratingMap[artworkId] || 0;
      return rating >= Number(minRating);
    });
  }
  
  // تطبيق بيانات التقييم على النتائج
  const artworksWithRatings = await Promise.all(filteredArtworks.map(async (artwork) => {
    const stats = await reviewModel.aggregate([
      { $match: { artwork: artwork._id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);
    
    const avgRating = stats[0]?.avgRating || 0;
    const reviewsCount = stats[0]?.count || 0;
    
    return {
      ...artwork.toObject(),
      avgRating,
      reviewsCount
    };
  }));
  
  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(
    minRating !== undefined ? filteredArtworks.length : totalCount
  );
  
  res.success(
    { artworks: artworksWithRatings, pagination: paginationMeta },
    'تم جلب نتائج البحث بنجاح'
  );
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
  const similarArtworks = await artworkModel.find(query)
    .populate({ path: 'artist', select: 'email job profileImage displayName' })
    .limit(Number(limit));
  
  res.success(similarArtworks, 'تم جلب الأعمال المشابهة بنجاح');
}); 