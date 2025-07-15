import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';

/**
 * Helper function to safely extract and format image URLs with fallbacks
 */
function getImageUrl(imageField, defaultUrl = null) {
  if (!imageField) return defaultUrl;
  
  // Handle different image formats
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
function getImageUrls(imagesField, limit = 5) {
  if (!imagesField || !Array.isArray(imagesField)) return [];
  
  return imagesField.slice(0, limit).map(img => {
    if (typeof img === 'string') return img;
    return img.url || img;
  }).filter(Boolean);
}

/**
 * Helper function to format artist data with proper image handling
 */
function formatArtists(artists) {
  if (!Array.isArray(artists)) return [];
  
  return artists.map(artist => ({
    _id: artist._id,
    displayName: artist.displayName || 'فنان غير معروف',
    job: artist.job || 'فنان',
    profileImage: getImageUrl(artist.profileImage, artist.photoURL),
    coverImages: getImageUrls(artist.coverImages, 3),
    rating: artist.averageRating ? parseFloat(artist.averageRating.toFixed(1)) : 0,
    totalRating: artist.totalRating || 0,
    reviewsCount: artist.reviewsCount || 0,
    isVerified: artist.isVerified || false,
    followersCount: artist.followersCount || 0,
    artworksCount: artist.artworksCount || 0,
  }));
}

/**
 * Helper function to format artwork data with proper image handling
 */
function formatArtworks(artworks) {
  if (!Array.isArray(artworks)) return [];
  
  return artworks.map(artwork => ({
    _id: artwork._id,
    title: artwork.title?.ar || artwork.title || 'عمل فني',
    description: artwork.description?.ar || artwork.description || '',
    mainImage: getImageUrl(artwork.image),
    images: getImageUrls(artwork.images),
    allImages: [
      getImageUrl(artwork.image),
      ...getImageUrls(artwork.images)
    ].filter(Boolean),
    price: artwork.price || 0,
    currency: artwork.currency || 'SAR',
    dimensions: artwork.dimensions || null,
    medium: artwork.medium || null,
    year: artwork.year || null,
    tags: artwork.tags || [],
    artist: artwork.artist ? {
      _id: artwork.artist._id,
      displayName: artwork.artist.displayName || 'فنان غير معروف',
      profileImage: getImageUrl(artwork.artist.profileImage, artwork.artist.photoURL),
      job: artwork.artist.job || 'فنان',
      isVerified: artwork.artist.isVerified || false,
    } : null,
    category: artwork.category ? {
      _id: artwork.category._id,
      name: artwork.category.name?.ar || artwork.category.name || 'تصنيف',
      image: getImageUrl(artwork.category.image),
    } : null,
    stats: {
      likeCount: artwork.likeCount || 0,
      viewCount: artwork.viewCount || 0,
      rating: artwork.averageRating ? parseFloat(artwork.averageRating.toFixed(1)) : 0,
      reviewsCount: artwork.reviewsCount || 0,
    },
    availability: {
      isAvailable: artwork.isAvailable !== false,
      isFeatured: artwork.isFeatured || false,
    },
    dates: {
      createdAt: artwork.createdAt,
      updatedAt: artwork.updatedAt,
    }
  }));
}

/**
 * Helper function to format category data with proper image handling
 */
function formatCategories(categories) {
  if (!Array.isArray(categories)) return [];
  
  return categories.map(category => ({
    _id: category._id,
    name: category.name?.ar || category.name || 'تصنيف',
    description: category.description?.ar || category.description || '',
    image: getImageUrl(category.image),
    artworksCount: category.artworksCount || 0,
  }));
}

/**
 * Main controller to get all data for the home screen
 * Optimized for Flutter integration with proper image handling
 */
export const getHomeData = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    const userId = req.user?._id;

    const [
      categories,
      featuredArtists,
      featuredArtworks,
      latestArtists,
      mostRatedArtworks,
      trendingArtworks,
    ] = await Promise.all([
      // 1. Categories with artwork count
      categoryModel.aggregate([
        { $match: {} },
        { $lookup: { from: 'artworks', localField: '_id', foreignField: 'category', as: 'artworks' } },
        { $addFields: { artworksCount: { $size: '$artworks' } } },
        { $project: { name: 1, image: 1, artworksCount: 1 } },
        { $sort: { artworksCount: -1 } },
        { $limit: 8 }
      ]),

      // 2. Featured Artists (Top Rated with follower count)
      userModel.aggregate([
        { $match: { role: 'artist', isActive: true, isDeleted: false } },
        { $lookup: { from: 'follows', localField: '_id', foreignField: 'following', as: 'followers' } },
        { $lookup: { from: 'artworks', localField: '_id', foreignField: 'artist', as: 'artworks' } },
        // Get artist reviews (reviews for the artist himself)
        {
          $lookup: {
            from: 'reviews',
            let: { artistId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$artist', '$$artistId'] },
                  status: 'active',
                  $or: [
                    { artwork: { $exists: false } },
                    { artwork: null }
                  ]
                }
              }
            ],
            as: 'artistReviews'
          }
        },
        // Get all reviews for artist's artworks (not used in rating now)
        {
          $lookup: {
            from: 'reviews',
            let: { artistId: '$_id' },
            pipeline: [
              {
                $lookup: {
                  from: 'artworks',
                  localField: 'artwork',
                  foreignField: '_id',
                  as: 'artworkData'
                }
              },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $arrayElemAt: ['$artworkData.artist', 0] }, '$$artistId'] },
                      { $ne: ['$artwork', null] }
                    ]
                  },
                  status: 'active'
                }
              }
            ],
            as: 'artworkReviews'
          }
        },
        {
          $addFields: {
            // Only artist reviews are used for rating
            totalRating: { $ifNull: [{ $sum: '$artistReviews.rating' }, 0] },
            totalReviewsCount: { $size: '$artistReviews' },
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: '$artistReviews' }, 0] },
                then: { 
                  $divide: [
                    { $ifNull: [{ $sum: '$artistReviews.rating' }, 0] },
                    { $size: '$artistReviews' }
                  ]
                },
                else: 0
              }
            },
            followersCount: { $size: '$followers' },
            artworksCount: { $size: '$artworks' },
          }
        },
        { $sort: { averageRating: -1, totalReviewsCount: -1, followersCount: -1 } },
        { $limit: 6 },
        { 
          $project: { 
            displayName: 1, 
            profileImage: 1, 
            photoURL: 1, 
            coverImages: 1,
            averageRating: 1, 
            totalRating: 1,
            reviewsCount: '$totalReviewsCount',
            followersCount: 1,
            artworksCount: 1,
            job: 1,
            isVerified: 1
          } 
        }
      ]),

      // 3. Featured Artworks (Most Liked and Viewed)
      artworkModel.find({ isAvailable: true, isFeatured: true })
        .sort({ likeCount: -1, viewCount: -1 })
        .limit(6)
        .populate({ 
          path: 'artist', 
          select: 'displayName profileImage photoURL job isVerified' 
        })
        .populate({ 
          path: 'category', 
          select: 'name image' 
        })
        .select('title description image images price currency dimensions medium year tags artist category likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
        .lean(),

      // 4. Latest Artists (Recently Joined)
      userModel.aggregate([
        { $match: { role: 'artist', isActive: true, isDeleted: false } },
        { $lookup: { from: 'follows', localField: '_id', foreignField: 'following', as: 'followers' } },
        { $lookup: { from: 'artworks', localField: '_id', foreignField: 'artist', as: 'artworks' } },
        // Get artist reviews (reviews for the artist himself)
        {
          $lookup: {
            from: 'reviews',
            let: { artistId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$artist', '$$artistId'] },
                  status: 'active',
                  $or: [
                    { artwork: { $exists: false } },
                    { artwork: null }
                  ]
                }
              }
            ],
            as: 'artistReviews'
          }
        },
        // Get all reviews for artist's artworks (not used in rating now)
        {
          $lookup: {
            from: 'reviews',
            let: { artistId: '$_id' },
            pipeline: [
              {
                $lookup: {
                  from: 'artworks',
                  localField: 'artwork',
                  foreignField: '_id',
                  as: 'artworkData'
                }
              },
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: [{ $arrayElemAt: ['$artworkData.artist', 0] }, '$$artistId'] },
                      { $ne: ['$artwork', null] }
                    ]
                  },
                  status: 'active'
                }
              }
            ],
            as: 'artworkReviews'
          }
        },
        {
          $addFields: {
            // Only artist reviews are used for rating
            totalRating: { $ifNull: [{ $sum: '$artistReviews.rating' }, 0] },
            totalReviewsCount: { $size: '$artistReviews' },
            averageRating: {
              $cond: {
                if: { $gt: [{ $size: '$artistReviews' }, 0] },
                then: { 
                  $divide: [
                    { $ifNull: [{ $sum: '$artistReviews.rating' }, 0] },
                    { $size: '$artistReviews' }
                  ]
                },
                else: 0
              }
            },
            followersCount: { $size: '$followers' },
            artworksCount: { $size: '$artworks' },
          }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 6 },
        { 
          $project: { 
            displayName: 1, 
            profileImage: 1, 
            photoURL: 1, 
            coverImages: 1,
            averageRating: 1, 
            totalRating: 1,
            reviewsCount: '$totalReviewsCount',
            followersCount: 1,
            artworksCount: 1,
            job: 1,
            isVerified: 1
          } 
        }
      ]),
        
      // 5. Most Rated Artworks
      artworkModel.aggregate([
        { $match: { isAvailable: true } },
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'artwork', as: 'reviews' } },
        {
          $addFields: {
            averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
            reviewsCount: { $size: '$reviews' },
          },
        },
        { $match: { reviewsCount: { $gt: 0 } } },
        { $sort: { averageRating: -1, reviewsCount: -1 } },
        { $limit: 6 },
        { $lookup: { from: 'users', localField: 'artist', foreignField: '_id', as: 'artist' } },
        { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1, description: 1, image: 1, images: 1, price: 1, currency: 1, 
            dimensions: 1, medium: 1, year: 1, tags: 1, artist: 1, category: 1,
            likeCount: 1, viewCount: 1, averageRating: 1, reviewsCount: 1,
            isAvailable: 1, isFeatured: 1, createdAt: 1, updatedAt: 1
          },
        },
      ]),

      // 6. Trending Artworks (High Views Recently)
      artworkModel.find({ isAvailable: true })
        .sort({ viewCount: -1, createdAt: -1 })
        .limit(6)
        .populate({ 
          path: 'artist', 
          select: 'displayName profileImage photoURL job isVerified' 
        })
        .populate({ 
          path: 'category', 
          select: 'name image' 
        })
        .select('title description image images price currency dimensions medium year tags artist category likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
        .lean(),
    ]);

    // 7. Personalized Artworks (Based on User History)
    let personalizedArtworks = [];
    if (userId) {
      const user = await userModel.findById(userId)
        .select('recentlyViewed wishlist')
        .lean();
      
      const recentCategories = user?.recentlyViewed?.map(h => h.category).filter(Boolean) || [];
      const wishlistIds = user?.wishlist?.map(id => new mongoose.Types.ObjectId(id)) || [];
      
      const excludedIds = [
        ...featuredArtworks.map(a => a._id),
        ...mostRatedArtworks.map(a => a._id),
        ...trendingArtworks.map(a => a._id),
      ].map(id => new mongoose.Types.ObjectId(id));

      if (recentCategories.length > 0) {
        personalizedArtworks = await artworkModel.find({
          $or: [
            { category: { $in: recentCategories } },
            { _id: { $in: wishlistIds } }
          ],
          _id: { $nin: excludedIds },
          isAvailable: true,
        })
        .limit(6)
        .populate({ 
          path: 'artist', 
          select: 'displayName profileImage photoURL job isVerified' 
        })
        .populate({ 
          path: 'category', 
          select: 'name image' 
        })
        .select('title description image images price currency dimensions medium year tags artist category likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
        .lean();
      }
    }
    
    // Fallback for personalized content
    if (personalizedArtworks.length < 6) {
      const extraNeeded = 6 - personalizedArtworks.length;
      const allExcludedIds = [
        ...featuredArtworks.map(a => a._id),
        ...mostRatedArtworks.map(a => a._id),
        ...trendingArtworks.map(a => a._id),
        ...personalizedArtworks.map(a => a._id),
      ].map(id => new mongoose.Types.ObjectId(id));

      const fallbackArtworks = await artworkModel.find({ 
        isAvailable: true, 
        _id: { $nin: allExcludedIds } 
      })
      .sort({ likeCount: -1, createdAt: -1 })
      .limit(extraNeeded)
      .populate({ 
        path: 'artist', 
        select: 'displayName profileImage photoURL job isVerified' 
      })
      .populate({ 
        path: 'category', 
        select: 'name image' 
      })
      .select('title description image images price currency dimensions medium year tags artist category likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
      .lean();
      
      personalizedArtworks.push(...fallbackArtworks);
    }

    // Prepare response with proper structure for Flutter
    const response = {
      success: true,
      message: 'تم جلب بيانات الصفحة الرئيسية بنجاح',
      data: {
        categories: formatCategories(categories),
        featuredArtists: formatArtists(featuredArtists),
        featuredArtworks: formatArtworks(featuredArtworks),
        latestArtists: formatArtists(latestArtists),
        mostRatedArtworks: formatArtworks(mostRatedArtworks),
        trendingArtworks: formatArtworks(trendingArtworks),
        personalizedArtworks: formatArtworks(personalizedArtworks),
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId || null,
        isAuthenticated: !!userId,
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Home data error:', error);
    next(new Error('حدث خطأ أثناء جلب بيانات الصفحة الرئيسية', { cause: 500 }));
  }
});

/**
 * Search artworks and artists with improved structure for Flutter
 */
export const search = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { q, type = 'all', page = 1, limit = 20, sortBy = 'relevance' } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'يجب أن يكون النص المبحوث عنه أكثر من حرفين',
        data: null
      });
    }

    const skip = (page - 1) * limit;
    const searchText = q.trim();
    const searchRegex = new RegExp(searchText, 'i');
    
    let sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions = { price: 1 };
        break;
      case 'price_high':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'newest':
        sortOptions = { createdAt: -1 };
        break;
      case 'popular':
        sortOptions = { viewCount: -1, likeCount: -1 };
        break;
      default:
        sortOptions = { viewCount: -1, createdAt: -1 };
    }

    let results = {};

    if (type === 'artworks' || type === 'all') {
      const artworkQuery = {
        isAvailable: true,
        $or: [
          { 'title.ar': searchRegex },
          { 'title.en': searchRegex },
          { 'description.ar': searchRegex },
          { 'description.en': searchRegex },
          { tags: { $in: [searchRegex] } }
        ]
      };

      const [artworks, totalArtworks] = await Promise.all([
        artworkModel
          .find(artworkQuery)
          .populate({ 
            path: 'artist', 
            select: 'displayName profileImage photoURL job isVerified' 
          })
          .populate({ 
            path: 'category', 
            select: 'name image' 
          })
          .select('title description image images price currency dimensions medium year tags artist category likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
          .sort(sortOptions)
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        artworkModel.countDocuments(artworkQuery)
      ]);

      results.artworks = {
        data: formatArtworks(artworks),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalArtworks / limit),
          totalItems: totalArtworks,
          hasNextPage: skip + artworks.length < totalArtworks,
          hasPrevPage: Number(page) > 1
        }
      };
    }

    if (type === 'artists' || type === 'all') {
      const artistQuery = {
        role: 'artist',
        isActive: true,
        isDeleted: false,
        $or: [
          { displayName: searchRegex },
          { job: searchRegex },
          { bio: searchRegex }
        ]
      };

      const [artists, totalArtists] = await Promise.all([
        userModel.aggregate([
          { $match: artistQuery },
          { $lookup: { from: 'follows', localField: '_id', foreignField: 'following', as: 'followers' } },
          { $lookup: { from: 'artworks', localField: '_id', foreignField: 'artist', as: 'artworks' } },
          { $lookup: { from: 'reviews', localField: '_id', foreignField: 'artist', as: 'reviews' } },
          {
            $addFields: {
              followersCount: { $size: '$followers' },
              artworksCount: { $size: '$artworks' },
              averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
              reviewsCount: { $size: '$reviews' },
            }
          },
          { $sort: { followersCount: -1, averageRating: -1 } },
          { $skip: skip },
          { $limit: Number(limit) },
          { 
            $project: { 
              displayName: 1, 
              profileImage: 1, 
              photoURL: 1, 
              coverImages: 1,
              job: 1, 
              bio: 1,
              isVerified: 1,
              followersCount: 1,
              artworksCount: 1,
              averageRating: 1,
              reviewsCount: 1
            } 
          }
        ]),
        userModel.countDocuments(artistQuery)
      ]);

      results.artists = {
        data: formatArtists(artists),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalArtists / limit),
          totalItems: totalArtists,
          hasNextPage: skip + artists.length < totalArtists,
          hasPrevPage: Number(page) > 1
        }
      };
    }

    res.status(200).json({
      success: true,
      message: 'تم البحث بنجاح',
      data: results,
      meta: {
        searchQuery: searchText,
        searchType: type,
        sortBy: sortBy,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Search error:', error);
    next(new Error('حدث خطأ أثناء البحث', { cause: 500 }));
  }
});

/**
 * Get single artwork details for Flutter
 */
export const getSingleArtwork = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { id } = req.params;
    const userId = req.user?._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف العمل الفني غير صالح',
        data: null
      });
    }

    const artwork = await artworkModel.findById(id)
      .populate({ 
        path: 'artist', 
        select: 'displayName profileImage photoURL job bio isVerified createdAt' 
      })
      .populate({ 
        path: 'category', 
        select: 'name image description' 
      })
      .lean();

    if (!artwork) {
      return res.status(404).json({
        success: false,
        message: 'العمل الفني غير موجود',
        data: null
      });
    }

    // Increment view count
    await artworkModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    // Get reviews for this artwork
    const reviewModel = (await import('../../../DB/models/review.model.js')).default;
    const reviews = await reviewModel.find({ artwork: id, status: 'active' })
      .populate('user', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .lean();

    // Calculate average rating and count
    const reviewsCount = reviews.length;
    const rating = reviewsCount
      ? parseFloat((reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsCount).toFixed(2))
      : 0;

    // Format reviews for frontend (show all reviews)
    const reviewsList = reviews
      .map(r => ({
        _id: r._id,
        user: {
          _id: r.user?._id,
          displayName: r.user?.displayName,
          profileImage: getImageUrl(r.user?.profileImage),
        },
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt,
      }));

    // Removed user review section - only showing all reviews

    // Get artist reviews (reviews for the artist, not the artwork)
    let artistReviews = [];
    let artistRating = 0;
    let artistReviewsCount = 0;
    
    if (artwork.artist) {
      const artistReviewModel = (await import('../../../DB/models/review.model.js')).default;
      
      // Get artist reviews (reviews where artwork field doesn't exist)
      const artistReviewsData = await artistReviewModel.find({ 
        artist: artwork.artist._id, 
        status: 'active',
        $or: [
          { artwork: { $exists: false } },
          { artwork: null }
        ]
      })
      .populate('user', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

      console.log('Found artist reviews:', artistReviewsData.length);

      // Format artist reviews (show all reviews)
      artistReviews = artistReviewsData
        .map(r => ({
          _id: r._id,
          user: {
            _id: r.user?._id,
            displayName: r.user?.displayName,
            profileImage: getImageUrl(r.user?.profileImage),
          },
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt,
        }));

      // Calculate artist average rating for artist reviews only
      const artistStats = await artistReviewModel.aggregate([
        { 
          $match: { 
            artist: artwork.artist._id, 
            status: 'active',
            $or: [
              { artwork: { $exists: false } },
              { artwork: null }
            ]
          } 
        },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            count: { $sum: 1 }
          }
        }
      ]);

      if (artistStats.length > 0) {
        artistRating = parseFloat(artistStats[0].avgRating.toFixed(1));
        artistReviewsCount = artistStats[0].count;
      }

      // Removed user artist review section - only showing all reviews
    }

    // Get related artworks
    const relatedArtworks = await artworkModel.find({
      _id: { $ne: id },
      $or: [
        { category: artwork.category?._id },
        { artist: artwork.artist?._id }
      ],
      isAvailable: true
    })
    .populate({ 
      path: 'artist', 
      select: 'displayName profileImage photoURL job isVerified' 
    })
    .populate({ 
      path: 'category', 
      select: 'name image' 
    })
    .select('title description image images price currency artist category likeCount viewCount averageRating reviewsCount isAvailable isFeatured')
    .sort({ viewCount: -1, likeCount: -1 })
    .limit(6)
    .lean();

    // Check if user liked this artwork
    let isLiked = false;
    if (userId) {
      const user = await userModel.findById(userId).select('wishlist').lean();
      isLiked = user?.wishlist?.some(wid => wid.toString() === id.toString()) || false;
    }

    // Build response
    const formattedArtwork = {
      ...formatArtworks([artwork])[0],
      isLiked: isLiked,
      stats: {
        ...formatArtworks([artwork])[0].stats,
        rating,
        reviewsCount
      }
    };

    const response = {
      success: true,
      message: 'تم جلب تفاصيل العمل الفني بنجاح',
      data: {
        artwork: formattedArtwork,
        // All artwork reviews
        reviews: reviewsList,
        // Artist reviews section
        artistReviews: {
          rating: artistRating,
          reviewsCount: artistReviewsCount,
          reviews: artistReviews
        },
        // Related artworks
        relatedArtworks: formatArtworks(relatedArtworks),
        // Total statistics
        totals: {
          artworkReviews: {
            total: reviewsCount,
            rating: rating
          },
          artistReviews: {
            total: artistReviewsCount,
            rating: artistRating
          }
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId || null,
        isAuthenticated: !!userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get single artwork error:', error);
    next(new Error('حدث خطأ أثناء جلب تفاصيل العمل الفني', { cause: 500 }));
  }
});

/**
 * Get artist profile for Flutter
 */
export const getArtistProfile = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?._id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف الفنان غير صالح',
        data: null
      });
    }

    const skip = (page - 1) * limit;

    const [artist, artworks, totalArtworks] = await Promise.all([
      userModel.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id), role: 'artist', isActive: true, isDeleted: false } },
        { $lookup: { from: 'follows', localField: '_id', foreignField: 'following', as: 'followers' } },
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'artist', as: 'reviews' } },
        {
          $addFields: {
            followersCount: { $size: '$followers' },
            averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
            reviewsCount: { $size: '$reviews' },
          }
        },
        { 
          $project: { 
            displayName: 1, 
            profileImage: 1, 
            photoURL: 1, 
            coverImages: 1,
            job: 1, 
            bio: 1,
            isVerified: 1,
            followersCount: 1,
            averageRating: 1,
            reviewsCount: 1,
            createdAt: 1
          } 
        }
      ]),
      
      artworkModel.find({ artist: id, isAvailable: true })
        .populate({ 
          path: 'category', 
          select: 'name image' 
        })
        .select('title description image images price currency category likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      artworkModel.countDocuments({ artist: id, isAvailable: true })
    ]);

    if (!artist || artist.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'الفنان غير موجود',
        data: null
      });
    }

    // Check if current user is following this artist
    let isFollowing = false;
    if (userId) {
      const followDoc = await mongoose.connection.db.collection('follows').findOne({
        follower: new mongoose.Types.ObjectId(userId),
        following: new mongoose.Types.ObjectId(id)
      });
      isFollowing = !!followDoc;
    }

    const response = {
      success: true,
      message: 'تم جلب ملف الفنان بنجاح',
      data: {
        artist: {
          ...formatArtists([artist[0]])[0],
          isFollowing: isFollowing
        },
        artworks: formatArtworks(artworks.map(artwork => ({
          ...artwork,
          artist: artist[0]
        }))),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalArtworks / limit),
          totalItems: totalArtworks,
          hasNextPage: skip + artworks.length < totalArtworks,
          hasPrevPage: Number(page) > 1
        }
      },
      meta: {
        timestamp: new Date().toISOString(),
        userId: userId || null,
        isAuthenticated: !!userId
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get artist profile error:', error);
    next(new Error('حدث خطأ أثناء جلب ملف الفنان', { cause: 500 }));
  }
});

/**
 * Get artworks by category for Flutter
 */
export const getArtworksByCategory = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { id } = req.params;
    const { page = 1, limit = 20, sortBy = 'newest' } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'معرف التصنيف غير صالح',
        data: null
      });
    }

    const skip = (page - 1) * limit;
    
    let sortOptions = {};
    switch (sortBy) {
      case 'price_low':
        sortOptions = { price: 1 };
        break;
      case 'price_high':
        sortOptions = { price: -1 };
        break;
      case 'rating':
        sortOptions = { averageRating: -1 };
        break;
      case 'popular':
        sortOptions = { viewCount: -1, likeCount: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const [category, artworks, totalArtworks] = await Promise.all([
      categoryModel.findById(id).lean(),
      
      artworkModel.find({ category: id, isAvailable: true })
        .populate({ 
          path: 'artist', 
          select: 'displayName profileImage photoURL job isVerified' 
        })
        .select('title description image images price currency artist likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
        .sort(sortOptions)
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      artworkModel.countDocuments({ category: id, isAvailable: true })
    ]);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'التصنيف غير موجود',
        data: null
      });
    }

    const response = {
      success: true,
      message: 'تم جلب أعمال التصنيف بنجاح',
      data: {
        category: formatCategories([{ ...category, artworksCount: totalArtworks }])[0],
        artworks: formatArtworks(artworks.map(artwork => ({
          ...artwork,
          category: category
        }))),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalArtworks / limit),
          totalItems: totalArtworks,
          hasNextPage: skip + artworks.length < totalArtworks,
          hasPrevPage: Number(page) > 1
        }
      },
      meta: {
        sortBy: sortBy,
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get artworks by category error:', error);
    next(new Error('حدث خطأ أثناء جلب أعمال التصنيف', { cause: 500 }));
  }
});

/**
 * Get trending artworks for explore section
 */
export const getTrendingArtworks = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [artworks, total] = await Promise.all([
      artworkModel
        .find({ isAvailable: true })
        .populate({ 
          path: 'artist', 
          select: 'displayName profileImage photoURL job isVerified' 
        })
        .populate({ 
          path: 'category', 
          select: 'name image' 
        })
        .select('title description image images price currency dimensions medium year tags artist category likeCount viewCount averageRating reviewsCount isAvailable isFeatured createdAt updatedAt')
        .sort({ viewCount: -1, likeCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      artworkModel.countDocuments({ isAvailable: true })
    ]);

    const response = {
      success: true,
      message: 'تم جلب الأعمال الرائجة بنجاح',
      data: {
        artworks: formatArtworks(artworks),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNextPage: skip + artworks.length < total,
          hasPrevPage: Number(page) > 1
        }
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Trending artworks error:', error);
    next(new Error('حدث خطأ أثناء جلب الأعمال الرائجة', { cause: 500 }));
  }
});
