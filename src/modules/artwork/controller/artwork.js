import artworkModel from '../../../../DB/models/artwork.model.js';
import userModel from '../../../../DB/models/user.model.js';
import categoryModel from '../../../../DB/models/category.model.js';
import reviewModel from '../../../../DB/models/review.model.js';
import { getPaginationParams } from '../../../utils/pagination.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';

/**
 * جلب الأعمال المميزة
 * @route GET /api/artworks/featured
 * @access Public
 */
export const getFeaturedArtworks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, 12);

  const [artworks, totalCount] = await Promise.all([
    artworkModel
      .find({ isAvailable: true, isFeatured: true })
      .populate({ 
        path: 'artist', 
        select: 'displayName profileImage job isActive',
        match: { isActive: true }
      })
      .populate({ path: 'category', select: 'name' })
      .sort({ likeCount: -1, viewCount: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    artworkModel.countDocuments({ isAvailable: true, isFeatured: true })
  ]);

  // تصفية الأعمال التي لديها فنانين نشطين فقط
  const activeArtworks = artworks.filter(artwork => artwork.artist);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({ 
    artworks: activeArtworks, 
    pagination: paginationMeta
  }, 'تم جلب الأعمال المميزة بنجاح');
});

/**
 * جلب كل الأعمال الفنية مع بيانات الفنان والتصفية المتقدمة
 * @route GET /api/artworks
 * @access Public
 */
export const getAllArtworks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, 12);
  const { status = 'available', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // بناء فلتر البحث
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  // بناء خيارات الترتيب
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [artworks, totalCount] = await Promise.all([
    artworkModel
      .find(filter)
      .populate({ 
        path: 'artist', 
        select: 'displayName profileImage job isActive',
        match: { isActive: true }
      })
      .populate({ path: 'category', select: 'name' })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    artworkModel.countDocuments(filter)
  ]);

  // تصفية الأعمال التي لديها فنانين نشطين فقط
  const activeArtworks = artworks.filter(artwork => artwork.artist);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({ 
    artworks: activeArtworks, 
    pagination: paginationMeta,
    filters: { status, sortBy, sortOrder }
  }, 'تم جلب الأعمال الفنية بنجاح');
});

/**
 * جلب تفاصيل عمل فني مع معلومات شاملة
 * @route GET /api/artworks/:id
 * @access Public
 */
export const getArtworkById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const artwork = await artworkModel
    .findById(id)
    .populate({ 
      path: 'artist', 
      select: 'displayName profileImage job bio socialLinks isActive',
      match: { isActive: true }
    })
    .populate({ path: 'category', select: 'name description' });

  if (!artwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  if (!artwork.artist) {
    return res.fail(null, 'الفنان غير نشط', 404);
  }

  // زيادة عدد المشاهدات بشكل آمن
  await artworkModel.findByIdAndUpdate(
    id,
    { $inc: { viewCount: 1 } },
    { new: false }
  );

  // جلب المراجعات والتقييمات بشكل متوازي
  const [reviews, ratingStats, artistStats] = await Promise.all([
    reviewModel
      .find({ artwork: artwork._id })
      .populate('user', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean(),
    
    reviewModel.aggregate([
      { $match: { artwork: artwork._id } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          ratings: { $push: '$rating' }
        }
      }
    ]),

    // إحصائيات الفنان
    Promise.all([
      artworkModel.countDocuments({ artist: artwork.artist._id }),
      reviewModel.aggregate([
        { 
          $lookup: {
            from: 'artworks',
            localField: 'artwork',
            foreignField: '_id',
            as: 'artworkData'
          }
        },
        { $unwind: '$artworkData' },
        { $match: { 'artworkData.artist': artwork.artist._id } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ])
    ])
  ]);

  // معالجة إحصائيات التقييم
  const avgRating = ratingStats[0]?.avgRating || 0;
  const reviewsCount = ratingStats[0]?.count || 0;
  const ratingDistribution = ratingStats[0]?.ratings
    ? Array(5).fill(0).map((_, i) => 
        ratingStats[0].ratings.filter(r => Math.round(r) === i + 1).length
      )
    : [0, 0, 0, 0, 0];

  // معالجة إحصائيات الفنان
  const [artistArtworksCount, artistRatingData] = artistStats;
  const artistAvgRating = artistRatingData[0]?.avgRating || 0;
  const artistTotalReviews = artistRatingData[0]?.totalReviews || 0;

  // أعمال مشابهة محسنة
  const similarArtworks = await artworkModel
    .find({
      _id: { $ne: artwork._id },
      $or: [
        { category: artwork.category?._id },
        { artist: artwork.artist._id },
        { tags: { $in: artwork.tags || [] } }
      ],
      status: 'available'
    })
    .populate('artist', 'displayName profileImage')
    .populate('category', 'name')
    .limit(6)
    .lean();

  // تحقق من تقييم المستخدم الحالي
  let userReview = null;
  if (req.user) {
    userReview = await reviewModel.findOne({
      artwork: artwork._id,
      user: req.user._id
    }).lean();
  }

  // تحديث بيانات العمل الفني مع العدد المحدث للمشاهدات
  artwork.viewCount = (artwork.viewCount || 0) + 1;

  res.success({
    artwork: {
      ...artwork.toObject(),
      viewCount: artwork.viewCount
    },
    artist: {
      ...artwork.artist.toObject(),
      stats: {
        totalArtworks: artistArtworksCount,
        avgRating: artistAvgRating,
        totalReviews: artistTotalReviews
      }
    },
    rating: {
      average: avgRating,
      count: reviewsCount,
      distribution: ratingDistribution
    },
    reviews,
    similarArtworks,
    userReview: userReview ? {
      rating: userReview.rating,
      comment: userReview.comment,
      createdAt: userReview.createdAt
    } : null
  }, 'تم جلب تفاصيل العمل الفني بنجاح');
});

/**
 * إنشاء عمل فني جديد
 * @route POST /api/artworks
 * @access Private (Artists only)
 */
export const createArtwork = asyncHandler(async (req, res) => {
  console.log('🔍 createArtwork called');
  console.log('📝 Request body:', req.body);
  console.log('📁 Request files:', req.files ? req.files.length : 'No files');
  
  const { title, price, category, description } = req.body;
  const artist = req.user._id;

  console.log('👤 Artist ID:', artist);
  console.log('📋 Data:', { title, price, category, description });

  // البحث عن الفئة بالاسم بدلاً من المعرف
  let categoryDoc = null;
  if (category) {
    // البحث بالاسم (case-insensitive)
    categoryDoc = await categoryModel.findOne({
      name: { $regex: new RegExp(`^${category}$`, 'i') }
    });
    
    console.log('🏷️ Category found:', categoryDoc ? categoryDoc.name : 'Not found');
    
    if (!categoryDoc) {
      return res.fail(null, 'الفئة المحددة غير موجودة', 400);
    }
  }

  // التحقق من عدم وجود عمل بنفس العنوان للفنان
  const existingArtwork = await artworkModel.findOne({
    title: title.trim(),
    artist,
    status: { $ne: 'deleted' }
  });

  if (existingArtwork) {
    return res.fail(null, 'لديك عمل فني بنفس العنوان بالفعل', 400);
  }

  // معالجة الصور المرفوعة
  let imagesArr = [];
  let mainImage = '';
  
  console.log('🖼️ Processing images...');
  console.log('📁 req.files:', req.files);
  console.log('📁 req.files type:', typeof req.files);
  console.log('📁 req.files length:', req.files ? req.files.length : 'undefined');
  
  // إذا تم رفع ملفات
  if (req.files && req.files.length > 0) {
    console.log('📁 Processing images:', req.files.length, 'files');
    
    // التحقق من عدد الصور (5 صور كحد أقصى)
    if (req.files.length > 5) {
      return res.fail(null, 'يمكن إضافة 5 صور على الأكثر', 400);
    }

    try {
      const cloudinary = await import('cloudinary');
      cloudinary.v2.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET
      });

      console.log('☁️ Cloudinary configured');

      // رفع جميع الصور
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          console.log(`📤 Uploading image ${index + 1}:`, file.originalname);
          console.log(`📤 File path:`, file.path);
          console.log(`📤 File size:`, file.size);
          
          const { secure_url, public_id, format, bytes } = await cloudinary.v2.uploader.upload(
            file.path,
            {
              folder: `arthub/artworks/${artist}/${Date.now()}`,
              resource_type: 'image',
              allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'],
              transformation: [
                { width: 1920, height: 1080, crop: 'limit' },
                { quality: 'auto:good' }
              ]
            }
          );

          console.log(`✅ Image ${index + 1} uploaded:`, secure_url);
          
          // الصورة الأولى هي الصورة الرئيسية
          if (index === 0) {
            mainImage = secure_url;
          }
          
          return secure_url;
        } catch (error) {
          console.error(`❌ Error uploading image ${index + 1}:`, error);
          throw new Error(`فشل في رفع الصورة: ${file.originalname}`);
        }
      });

      imagesArr = await Promise.all(uploadPromises);
      console.log('✅ All images uploaded successfully');
      
    } catch (error) {
      console.error('❌ Error processing images:', error);
      return res.fail(null, 'فشل في رفع الصور: ' + error.message, 400);
    }
  } else {
    console.log('⚠️ No files found in request');
  }
  
  // التحقق من وجود صور على الأقل
  if (imagesArr.length === 0) {
    return res.fail(null, 'يجب إضافة صورة واحدة على الأقل للعمل الفني', 400);
  }

  const artwork = await artworkModel.create({
    title: title.trim(),
    description: description || title.trim(), // استخدام العنوان كوصف إذا لم يتم توفير وصف
    price,
    category: categoryDoc._id, // استخدام معرف الفئة الذي تم العثور عليه
    artist,
    image: mainImage, // الصورة الرئيسية
    images: imagesArr, // جميع الصور كقائمة
    status: 'available',
    viewCount: 0,
    createdAt: new Date()
  });

  // جلب العمل الفني مع معلومات الفنان والفئة
  const populatedArtwork = await artworkModel.findById(artwork._id)
    .populate('artist', 'displayName profileImage')
    .populate('category', 'name')
    .lean();

  res.success(populatedArtwork, 'تم إنشاء العمل الفني بنجاح', 201);
});

/**
 * تحديث عمل فني
 * @route PUT /api/artworks/:id
 * @access Private (Owner only)
 */
export const updateArtwork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = { ...req.body };

  // التحقق من وجود العمل الفني وملكيته
  const existingArtwork = await artworkModel.findOne({
    _id: id,
    artist: req.user._id
  });

  if (!existingArtwork) {
    return res.fail(null, 'العمل الفني غير موجود أو ليس لديك صلاحية تعديله', 404);
  }

  // التحقق من الفئة إذا تم تحديثها
  if (updateData.category && updateData.category !== existingArtwork.category.toString()) {
    const categoryExists = await categoryModel.findById(updateData.category);
    if (!categoryExists) {
      return res.fail(null, 'الفئة المحددة غير موجودة', 400);
    }
  }

  // التحقق من عدم تكرار العنوان إذا تم تحديثه
  if (updateData.title && updateData.title.trim() !== existingArtwork.title) {
    const duplicateTitle = await artworkModel.findOne({
      title: updateData.title.trim(),
      artist: req.user._id,
      _id: { $ne: id }
    });

    if (duplicateTitle) {
      return res.fail(null, 'لديك عمل فني بنفس العنوان بالفعل', 400);
    }
  }

  // تنظيف البيانات
  if (updateData.title) updateData.title = updateData.title.trim();
  if (updateData.description) updateData.description = updateData.description.trim();
  
  updateData.updatedAt = new Date();

  const artwork = await artworkModel.findByIdAndUpdate(
    id,
    updateData,
    { new: true, runValidators: true }
  )
  .populate('artist', 'displayName profileImage')
  .populate('category', 'name');

  res.success(artwork, 'تم تحديث العمل الفني بنجاح');
});

/**
 * حذف عمل فني (حذف ناعم)
 * @route DELETE /api/artworks/:id
 * @access Private (Owner only)
 */
export const deleteArtwork = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const artwork = await artworkModel.findOneAndUpdate(
    { _id: id, artist: req.user._id },
    { 
      status: 'deleted',
      deletedAt: new Date()
    },
    { new: true }
  );

  if (!artwork) {
    return res.fail(null, 'العمل الفني غير موجود أو ليس لديك صلاحية حذفه', 404);
  }

  res.success(null, 'تم حذف العمل الفني بنجاح');
});

/**
 * جلب الأعمال الفنية حسب الفنان
 * @route GET /api/artworks/artist/:artistId
 * @access Public
 */
export const getArtworksByArtist = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query, 12);
  const { status = 'available' } = req.query;

  // التحقق من وجود الفنان ونشاطه
  const artist = await userModel.findOne({ 
    _id: artistId, 
    role: 'artist',
    isActive: true 
  }).lean();

  if (!artist) {
    return res.fail(null, 'الفنان غير موجود أو غير نشط', 404);
  }

  // بناء فلتر البحث
  const filter = { artist: artistId };
  if (status && status !== 'all') {
    filter.status = status;
  }

  const [artworks, totalCount, artistStats] = await Promise.all([
    artworkModel
      .find(filter)
      .populate({ path: 'artist', select: 'displayName profileImage job' })
      .populate({ path: 'category', select: 'name' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    
    artworkModel.countDocuments(filter),
    
    // إحصائيات الفنان
    artworkModel.aggregate([
      { $match: { artist: artistId } },
      {
        $group: {
          _id: null,
          totalArtworks: { $sum: 1 },
          availableArtworks: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          soldArtworks: {
            $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] }
          },
          totalViews: { $sum: '$viewCount' },
          avgPrice: { $avg: '$price' }
        }
      }
    ])
  ]);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  const stats = artistStats[0] || {
    totalArtworks: 0,
    availableArtworks: 0,
    soldArtworks: 0,
    totalViews: 0,
    avgPrice: 0
  };

  res.success({
    artist: {
      ...artist,
      stats
    },
    artworks,
    pagination: paginationMeta
  }, 'تم جلب أعمال الفنان بنجاح');
});

/**
 * جلب الأعمال الفنية حسب الفئة
 * @route GET /api/artworks/category/:categoryId
 * @access Public
 */
export const getArtworksByCategory = asyncHandler(async (req, res) => {
  const { categoryId } = req.params;
  const { page, limit, skip } = getPaginationParams(req.query, 12);
  const { sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // التحقق من وجود الفئة
  const category = await categoryModel.findById(categoryId).lean();
  if (!category) {
    return res.fail(null, 'الفئة غير موجودة', 404);
  }

  // بناء خيارات الترتيب
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [artworks, totalCount] = await Promise.all([
    artworkModel
      .find({ category: categoryId, status: 'available' })
      .populate({ 
        path: 'artist', 
        select: 'displayName profileImage job',
        match: { isActive: true }
      })
      .populate({ path: 'category', select: 'name description' })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    
    artworkModel.countDocuments({ category: categoryId, status: 'available' })
  ]);

  // تصفية الأعمال التي لديها فنانين نشطين فقط
  const activeArtworks = artworks.filter(artwork => artwork.artist);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);

  res.success({
    category,
    artworks: activeArtworks,
    pagination: paginationMeta
  }, 'تم جلب الأعمال حسب الفئة بنجاح');
});

/**
 * البحث المتقدم في الأعمال الفنية
 * @route GET /api/artworks/search
 * @access Public
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
    status = 'available',
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 12
  } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);

  // بناء فلتر البحث
  const filter = {};

  // البحث النصي
  if (query && query.trim()) {
    filter.$or = [
      { title: { $regex: query.trim(), $options: 'i' } },
      { description: { $regex: query.trim(), $options: 'i' } },
      { tags: { $elemMatch: { $regex: query.trim(), $options: 'i' } } }
    ];
  }

  // فلتر السعر
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = parseFloat(minPrice);
    if (maxPrice) filter.price.$lte = parseFloat(maxPrice);
  }

  // فلتر الفئة
  if (category) filter.category = category;

  // فلتر الفنان
  if (artist) filter.artist = artist;

  // فلتر الوسوم
  if (tags && Array.isArray(tags)) {
    filter.tags = { $in: tags };
  }

  // فلتر الحالة
  if (status && status !== 'all') {
    filter.status = status;
  }

  // بناء خيارات الترتيب
  let sortOptions = {};
  
  if (minRating && sortBy === 'rating') {
    // للبحث بالتقييم، نحتاج aggregation pipeline
    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'artwork',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          avgRating: { $avg: '$reviews.rating' },
          reviewCount: { $size: '$reviews' }
        }
      },
      {
        $match: {
          avgRating: { $gte: parseFloat(minRating) }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'artist',
          foreignField: '_id',
          as: 'artist'
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'category',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          'artist.isActive': true
        }
      },
      {
        $project: {
          title: 1,
          description: 1,
          images: 1,
          price: 1,
          status: 1,
          tags: 1,
          viewCount: 1,
          createdAt: 1,
          avgRating: 1,
          reviewCount: 1,
          'artist.displayName': 1,
          'artist.profileImage': 1,
          'artist.job': 1,
          'category.name': 1
        }
      },
      { $sort: { avgRating: sortOrder === 'asc' ? 1 : -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const [artworks, totalCount] = await Promise.all([
      artworkModel.aggregate(pipeline),
      artworkModel.aggregate([
        ...pipeline.slice(0, -3), // Remove sort, skip, limit
        { $count: 'total' }
      ])
    ]);

    const total = totalCount[0]?.total || 0;
    const totalPages = Math.ceil(total / parseInt(limit));

    return res.success({
      artworks,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: total,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      },
      searchParams: { query, minPrice, maxPrice, minRating, category, artist, tags, status, sortBy, sortOrder }
    }, 'تم البحث عن الأعمال الفنية بنجاح');
  }

  // للبحث العادي بدون تقييم
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [artworks, totalCount] = await Promise.all([
    artworkModel
      .find(filter)
      .populate({ 
        path: 'artist', 
        select: 'displayName profileImage job',
        match: { isActive: true }
      })
      .populate({ path: 'category', select: 'name' })
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    
    artworkModel.countDocuments(filter)
  ]);

  // تصفية الأعمال التي لديها فنانين نشطين فقط
  const activeArtworks = artworks.filter(artwork => artwork.artist);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.success({
    artworks: activeArtworks,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    },
    searchParams: { query, minPrice, maxPrice, category, artist, tags, status, sortBy, sortOrder }
  }, 'تم البحث عن الأعمال الفنية بنجاح');
});

/**
 * الحصول على الأعمال المقترحة (المشابهة)
 * @route GET /api/artworks/:id/similar
 * @access Public
 */
export const getSimilarArtworks = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { limit = 6 } = req.query;

  // الحصول على العمل الفني الحالي
  const currentArtwork = await artworkModel.findById(id).lean();
  if (!currentArtwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  // بناء استعلام للأعمال المشابهة مع أولوية
  const pipeline = [
    {
      $match: {
        _id: { $ne: currentArtwork._id },
        status: 'available'
      }
    },
    {
      $addFields: {
        similarity: {
          $add: [
            // نفس الفئة (أولوية عالية)
            { $cond: [{ $eq: ['$category', currentArtwork.category] }, 3, 0] },
            // نفس الفنان (أولوية متوسطة)
            { $cond: [{ $eq: ['$artist', currentArtwork.artist] }, 2, 0] },
            // وسوم مشتركة (أولوية منخفضة)
            {
              $size: {
                $setIntersection: ['$tags', currentArtwork.tags || []]
              }
            },
            // نطاق سعري مشابه
            {
              $cond: [
                {
                  $and: [
                    { $gte: ['$price', currentArtwork.price * 0.7] },
                    { $lte: ['$price', currentArtwork.price * 1.3] }
                  ]
                },
                1,
                0
              ]
            }
          ]
        }
      }
    },
    { $match: { similarity: { $gt: 0 } } },
    { $sort: { similarity: -1, createdAt: -1 } },
    { $limit: parseInt(limit) },
    {
      $lookup: {
        from: 'users',
        localField: 'artist',
        foreignField: '_id',
        as: 'artist'
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    {
      $match: {
        'artist.isActive': true
      }
    },
    {
      $project: {
        title: 1,
        images: 1,
        price: 1,
        status: 1,
        viewCount: 1,
        createdAt: 1,
        similarity: 1,
        'artist.displayName': 1,
        'artist.profileImage': 1,
        'category.name': 1
      }
    }
  ];

  const similarArtworks = await artworkModel.aggregate(pipeline);

  res.success(similarArtworks, 'تم جلب الأعمال المشابهة بنجاح');
});

/**
 * الحصول على إحصائيات الأعمال الفنية
 * @route GET /api/artworks/stats
 * @access Public
 */
export const getArtworksStats = asyncHandler(async (req, res) => {
  const stats = await artworkModel.aggregate([
    {
      $group: {
        _id: null,
        totalArtworks: { $sum: 1 },
        availableArtworks: {
          $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
        },
        soldArtworks: {
          $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] }
        },
        reservedArtworks: {
          $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] }
        },
        totalViews: { $sum: '$viewCount' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    }
  ]);

  // إحصائيات حسب الفئة
  const categoryStats = await artworkModel.aggregate([
    { $match: { status: 'available' } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        avgPrice: { $avg: '$price' }
      }
    },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category'
      }
    },
    { $unwind: '$category' },
    {
      $project: {
        name: '$category.name',
        count: 1,
        avgPrice: { $round: ['$avgPrice', 2] }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);

  // أحدث الأعمال
  const recentArtworks = await artworkModel
    .find({ status: 'available' })
    .populate('artist', 'displayName profileImage')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  res.success({
    general: stats[0] || {
      totalArtworks: 0,
      availableArtworks: 0,
      soldArtworks: 0,
      reservedArtworks: 0,
      totalViews: 0,
      avgPrice: 0,
      minPrice: 0,
      maxPrice: 0
    },
    categoryStats,
    recentArtworks
  }, 'تم جلب إحصائيات الأعمال الفنية بنجاح');
});

/**
 * جلب أعمال الفنان الحالي (للوحة التحكم)
 * @route GET /api/artworks/my-artworks
 * @access Private (Artists only)
 */
export const getMyArtworks = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query, 12);
  const { status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // بناء فلتر البحث
  const filter = { artist: req.user._id };
  if (status && status !== 'all') {
    filter.status = status;
  }

  // بناء خيارات الترتيب
  const sortOptions = {};
  sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const [artworks, totalCount, stats] = await Promise.all([
    artworkModel
      .find(filter)
      .populate({ path: 'category', select: 'name' })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .lean(),
    
    artworkModel.countDocuments(filter),
    
    // إحصائيات الفنان
    artworkModel.aggregate([
      { $match: { artist: req.user._id } },
      {
        $group: {
          _id: null,
          totalArtworks: { $sum: 1 },
          availableArtworks: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          soldArtworks: {
            $sum: { $cond: [{ $eq: ['$status', 'sold'] }, 1, 0] }
          },
          reservedArtworks: {
            $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] }
          },
          totalViews: { $sum: '$viewCount' },
          totalEarnings: {
            $sum: { $cond: [{ $eq: ['$status', 'sold'] }, '$price', 0] }
          }
        }
      }
    ])
  ]);

  const paginationMeta = getPaginationParams(req.query).getPaginationMetadata(totalCount);
  const artistStats = stats[0] || {
    totalArtworks: 0,
    availableArtworks: 0,
    soldArtworks: 0,
    reservedArtworks: 0,
    totalViews: 0,
    totalEarnings: 0
  };

  res.success({
    artworks,
    pagination: paginationMeta,
    stats: artistStats
  }, 'تم جلب أعمالك الفنية بنجاح');
});

/**
 * Toggle artwork favorite status
 */
export const toggleFavorite = asyncHandler(async (req, res) => {
  const { id: artworkId } = req.params;
  const userId = req.user._id;

  // Check if artwork exists
  const artwork = await artworkModel.findById(artworkId);
  if (!artwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  // Find user and check if artwork is in favorites
  const user = await userModel.findById(userId);
  const favoriteIndex = user.wishlist.findIndex(id => id.toString() === artworkId);

  let action, message;
  if (favoriteIndex > -1) {
    // Remove from favorites
    user.wishlist.splice(favoriteIndex, 1);
    action = 'removed';
    message = 'تم إزالة العمل من المفضلة';
  } else {
    // Add to favorites
    user.wishlist.push(artworkId);
    action = 'added';
    message = 'تم إضافة العمل إلى المفضلة';
  }

  await user.save();

  res.success({
    action,
    isFavorite: action === 'added',
    favoritesCount: user.wishlist.length
  }, message);
});

/**
 * Add review to artwork
 */
export const addReview = asyncHandler(async (req, res) => {
  const { artworkId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user._id;

  // Check if artwork exists
  const artwork = await artworkModel.findById(artworkId);
  if (!artwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  // Check if user already reviewed this artwork
  const existingReview = await reviewModel.findOne({
    artwork: artworkId,
    user: userId
  });

  if (existingReview) {
    return res.fail(null, 'لقد قمت بتقييم هذا العمل مسبقاً', 409);
  }

  // Create review
  const review = await reviewModel.create({
    artwork: artworkId,
    artist: artwork.artist,
    user: userId,
    rating,
    comment: comment || ''
  });

  // Update artwork rating
  const reviews = await reviewModel.find({ artwork: artworkId });
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  
  await artworkModel.findByIdAndUpdate(artworkId, {
    avgRating: Math.round(avgRating * 10) / 10,
    reviewsCount: reviews.length
  });

  const populatedReview = await reviewModel.findById(review._id)
    .populate('user', 'displayName profileImage');

  res.success(populatedReview, 'تم إضافة التقييم بنجاح', 201);
});

/**
 * Get artwork reviews
 */
export const getArtworkReviews = asyncHandler(async (req, res) => {
  const { artworkId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  // Check if artwork exists
  const artwork = await artworkModel.findById(artworkId);
  if (!artwork) {
    return res.fail(null, 'العمل الفني غير موجود', 404);
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // Get reviews
  const [reviews, totalCount] = await Promise.all([
    reviewModel.find({ artwork: artworkId })
      .populate('user', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    reviewModel.countDocuments({ artwork: artworkId })
  ]);

  const totalPages = Math.ceil(totalCount / parseInt(limit));

  res.success({
    reviews,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalItems: totalCount,
      itemsPerPage: parseInt(limit),
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  }, 'تم جلب التقييمات بنجاح');
});
