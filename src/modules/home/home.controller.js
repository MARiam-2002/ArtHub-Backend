import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';

/**
 * Get home screen data - optimized for mobile app
 * Returns categories, featured artists, and artworks sections
 */
export const getHomeData = asyncHandler(async (req, res, next) => {
  try {
    await ensureDatabaseConnection();

    // Get all data in parallel for better performance
    const [categories, featuredArtists, featuredArtworks, latestArtworks] = await Promise.all([
      // Categories for home screen
      categoryModel.find({ isActive: true })
        .select('name image')
        .limit(8)
        .lean(),

      // Featured Artists (top rated)
      userModel.aggregate([
        { $match: { role: 'artist', isActive: true } },
        {
          $lookup: {
            from: 'artworks',
            localField: '_id',
            foreignField: 'artist',
            as: 'artworks'
          }
        },
        {
          $lookup: {
            from: 'reviews',
            localField: '_id',
            foreignField: 'artist',
            as: 'reviews'
          }
        },
        {
          $addFields: {
            averageRating: {
              $cond: [
                { $eq: [{ $size: '$reviews' }, 0] },
                0,
                { $avg: '$reviews.rating' }
              ]
            },
            artworksCount: { $size: '$artworks' },
            reviewsCount: { $size: '$reviews' }
          }
        },
        {
          $sort: { averageRating: -1, artworksCount: -1 }
        },
        { $limit: 6 },
        {
          $project: {
            displayName: 1,
            profileImage: 1,
            job: 1,
            averageRating: { $round: ['$averageRating', 1] },
            reviewsCount: 1,
            artworksCount: 1
          }
        }
      ]),

      // Featured Artworks (trending)
      artworkModel
        .find({ isAvailable: true })
        .sort({ viewCount: -1, likeCount: -1 })
        .limit(10)
        .populate('artist', 'displayName profileImage job')
        .populate('category', 'name')
        .select('title images price currency artist category viewCount likeCount createdAt')
        .lean(),

      // Latest Artworks
      artworkModel
        .find({ isAvailable: true })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('artist', 'displayName profileImage job')
        .populate('category', 'name')
        .select('title images price currency artist category createdAt')
        .lean()
    ]);

    const responseData = {
      categories: categories.map(cat => ({
        _id: cat._id,
        name: cat.name?.ar || cat.name,
        image: cat.image?.url || cat.image
      })),
      featuredArtists: featuredArtists.map(artist => ({
        _id: artist._id,
        displayName: artist.displayName,
        profileImage: artist.profileImage?.url,
        job: artist.job,
        rating: artist.averageRating || 0,
        reviewsCount: artist.reviewsCount || 0,
        artworksCount: artist.artworksCount || 0
      })),
      featuredArtworks: formatArtworks(featuredArtworks),
      latestArtworks: formatArtworks(latestArtworks)
    };

    res.success(responseData, 'تم جلب بيانات الصفحة الرئيسية بنجاح');
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

/**
 * Format artworks for consistent response
 */
function formatArtworks(artworks) {
  return artworks.map(artwork => ({
    _id: artwork._id,
    title: artwork.title?.ar || artwork.title,
    images: artwork.images?.map(img => ({
      url: img.url,
      optimizedUrl: img.optimizedUrl || img.url
    })) || [],
    price: artwork.price,
    currency: artwork.currency || 'SAR',
    artist: {
      _id: artwork.artist?._id,
      displayName: artwork.artist?.displayName,
      profileImage: artwork.artist?.profileImage?.url,
      job: artwork.artist?.job
    },
    category: {
      _id: artwork.category?._id,
      name: artwork.category?.name?.ar || artwork.category?.name
    },
    viewCount: artwork.viewCount || 0,
    likeCount: artwork.likeCount || 0,
    createdAt: artwork.createdAt
  }));
}
