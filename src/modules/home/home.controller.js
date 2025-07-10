import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';

/**
 * Helper function to format artwork data for responses, returning only the first image.
 */
function formatArtworks(artworks) {
  if (!Array.isArray(artworks)) return [];
  return artworks.map(artwork => {
    // Extract the first image URL, if available
    const mainImage = (artwork.images && artwork.images.length > 0)
      ? (typeof artwork.images[0] === 'object' ? artwork.images[0].url : artwork.images[0])
      : null;

    return {
      _id: artwork._id,
      title: artwork.title?.ar || artwork.title,
      image: mainImage,
      price: artwork.price,
      currency: artwork.currency || 'SAR',
      artist: {
        _id: artwork.artist?._id,
        displayName: artwork.artist?.displayName,
        profileImage: artwork.artist?.profileImage?.url || artwork.artist?.profileImage,
      },
      category: {
        _id: artwork.category?._id,
        name: artwork.category?.name?.ar || artwork.category?.name,
      },
      likeCount: artwork.likeCount || 0,
    };
  });
}

/**
 * Get home screen data - Rewritten for performance and stability
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
    ] = await Promise.all([
      // 1. Categories
      categoryModel.find().limit(8).select('name image').lean(),

      // 2. Featured Artists (Top Rated) - Simplified Query
      userModel.find({ role: 'artist', isActive: true })
        .sort({ rating: -1, reviewCount: -1 })
        .limit(6)
        .select('displayName profileImage job rating reviewCount')
        .lean(),

      // 3. Featured Artworks (Trending)
      artworkModel.find({ isAvailable: true })
        .sort({ viewCount: -1, likeCount: -1 })
        .limit(6)
        .select('title images price currency artist category likeCount')
        .populate('artist', 'displayName profileImage')
        .populate('category', 'name')
        .lean(),

      // 4. Latest Artists
      userModel.find({ role: 'artist', isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('displayName profileImage job')
        .lean(),
        
      // 5. Most Rated Artworks
      artworkModel.find({ isAvailable: true, 'rating.average': { $gt: 0 } })
        .sort({ 'rating.average': -1, 'rating.count': -1 })
        .limit(6)
        .select('title images price currency artist category likeCount')
        .populate('artist', 'displayName profileImage')
        .populate('category', 'name')
        .lean(),
    ]);

    // 6. Personalized Artworks (if user is logged in)
    let personalizedArtworks = [];
    if (userId) {
      const user = await userModel.findById(userId).select('recentlyViewed.category').lean();
      const recentCategories = user?.recentlyViewed?.map(h => h.category).filter(Boolean) || [];

      if (recentCategories.length > 0) {
        const excludedIds = [
          ...featuredArtworks.map(a => a._id),
          ...mostRatedArtworks.map(a => a._id),
        ];

        personalizedArtworks = await artworkModel.find({
            category: { $in: recentCategories },
            _id: { $nin: excludedIds },
            isAvailable: true
          })
          .limit(6)
          .select('title images price currency artist category likeCount')
          .populate('artist', 'displayName profileImage')
          .populate('category', 'name')
          .lean();
      }
    }
    
    // If no personalized artworks, fill with more trending ones
    if (personalizedArtworks.length < 6) {
        const extraNeeded = 6 - personalizedArtworks.length;
        const allExcludedIds = [
            ...featuredArtworks.map(a => a._id),
            ...mostRatedArtworks.map(a => a._id),
            ...personalizedArtworks.map(a => a._id),
        ];
        const fallbackArtworks = await artworkModel.find({ isAvailable: true, _id: { $nin: allExcludedIds } })
            .sort({ likeCount: -1, createdAt: -1 })
            .limit(extraNeeded)
            .select('title images price currency artist category likeCount')
            .populate('artist', 'displayName profileImage')
            .populate('category', 'name')
            .lean();
        personalizedArtworks.push(...fallbackArtworks);
    }


    res.status(200).json({
      success: true,
      message: 'تم جلب بيانات الصفحة الرئيسية بنجاح',
      data: {
        categories: categories.map(c => ({ _id: c._id, name: c.name?.ar || c.name, image: c.image?.url || c.image })),
        featuredArtists,
        featuredArtworks: formatArtworks(featuredArtworks),
        latestArtists,
        mostRatedArtworks: formatArtworks(mostRatedArtworks),
        personalizedArtworks: formatArtworks(personalizedArtworks),
      },
    });

  } catch (error) {
    console.error('Home data error:', error);
    next(new Error('حدث خطأ أثناء جلب بيانات الصفحة الرئيسية', { cause: 500 }));
  }
});

/**
 * Search artworks and artists
 */
export const search = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();
    
    const { q, type = 'artworks', page = 1, limit = 20 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.fail(null, 'يجب أن يكون النص المبحوث عنه أكثر من حرفين', 400);
    }

    const skip = (page - 1) * limit;
    const searchText = q.trim();

    let results = {};

    if (type === 'artworks' || type === 'all') {
      const artworkQuery = {
        isAvailable: true,
        $or: [
          { 'title.ar': { $regex: searchText, $options: 'i' } },
          { 'title.en': { $regex: searchText, $options: 'i' } },
          { 'description.ar': { $regex: searchText, $options: 'i' } },
          { 'description.en': { $regex: searchText, $options: 'i' } },
          { tags: { $in: [new RegExp(searchText, 'i')] } }
        ]
      };

      const [artworks, totalArtworks] = await Promise.all([
        artworkModel
          .find(artworkQuery)
          .populate('artist', 'displayName profileImage job')
          .populate('category', 'name')
          .select('title images price currency artist category viewCount likeCount')
          .sort({ viewCount: -1, createdAt: -1 })
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
          hasNextPage: skip + artworks.length < totalArtworks
        }
      };
    }

    if (type === 'artists' || type === 'all') {
      const artistQuery = {
        role: 'artist',
        isActive: true,
        $or: [
          { displayName: { $regex: searchText, $options: 'i' } },
          { job: { $regex: searchText, $options: 'i' } },
          { bio: { $regex: searchText, $options: 'i' } }
        ]
      };

      const [artists, totalArtists] = await Promise.all([
        userModel
          .find(artistQuery)
          .select('displayName profileImage job bio')
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        userModel.countDocuments(artistQuery)
      ]);

      results.artists = {
        data: artists.map(artist => ({
          _id: artist._id,
          displayName: artist.displayName,
          profileImage: artist.profileImage?.url,
          job: artist.job,
          bio: artist.bio
        })),
        pagination: {
          currentPage: Number(page),
          totalPages: Math.ceil(totalArtists / limit),
          totalItems: totalArtists,
          hasNextPage: skip + artists.length < totalArtists
        }
      };
    }

    res.success(results, 'تم البحث بنجاح');
  } catch (error) {
    console.error('Search error:', error);
    next(new Error('حدث خطأ أثناء البحث', { cause: 500 }));
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
        .populate('artist', 'displayName profileImage job')
        .populate('category', 'name')
        .select('title images price currency artist category viewCount likeCount createdAt')
        .sort({ viewCount: -1, likeCount: -1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      artworkModel.countDocuments({ isAvailable: true })
    ]);

    const response = {
      artworks: formatArtworks(artworks),
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNextPage: skip + artworks.length < total
      }
    };

    res.success(response, 'تم جلب الأعمال الرائجة بنجاح');
  } catch (error) {
    console.error('Trending artworks error:', error);
    next(new Error('حدث خطأ أثناء جلب الأعمال الرائجة', { cause: 500 }));
  }
});
