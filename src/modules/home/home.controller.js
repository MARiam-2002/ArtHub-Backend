import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import mongoose from 'mongoose';

/**
 * Helper function to safely extract a populated image URL.
 */
function getImageUrl(imageField) {
  if (!imageField) return null;
  const image = Array.isArray(imageField) ? imageField[0] : imageField;
  return image?.url || null;
}

/**
 * Helper function to format artist data for responses.
 */
function formatArtists(artists) {
  if (!Array.isArray(artists)) return [];
  return artists.map(artist => ({
    _id: artist._id,
    displayName: artist.displayName,
    job: artist.job,
    profileImage: artist.profileImage?.url || artist.photoURL || null, // Access URL directly
    rating: artist.averageRating ? parseFloat(artist.averageRating.toFixed(1)) : 0,
    reviewsCount: artist.reviewsCount || 0,
  }));
}

/**
 * Helper function to format artwork data for responses.
 */
function formatArtworks(artworks) {
  if (!Array.isArray(artworks)) return [];
  return artworks.map(artwork => ({
    _id: artwork._id,
    title: artwork.title?.ar || artwork.title,
    image: Array.isArray(artwork.images) && artwork.images.length > 0 ? artwork.images[0] : (artwork.image || null), // Access URL directly
    price: artwork.price,
    currency: artwork.currency || 'SAR',
    artist: artwork.artist ? {
      _id: artwork.artist._id,
      displayName: artwork.artist.displayName,
      profileImage: artwork.artist.profileImage?.url || artwork.artist.photoURL || null,
    } : null,
    category: artwork.category ? {
      _id: artwork.category._id,
      name: artwork.category.name?.ar || artwork.category.name,
    } : null,
    likeCount: artwork.likeCount || 0,
    rating: artwork.averageRating ? parseFloat(artwork.averageRating.toFixed(1)) : (artwork.rating?.average || 0),
  }));
}

/**
 * Main controller to get all data for the home screen.
 * Final version with simplified queries and no image population.
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

      // 2. Featured Artists (Top Rated)
      userModel.aggregate([
        { $match: { role: 'artist', isActive: true } },
        { $lookup: { from: 'reviews', localField: '_id', foreignField: 'artist', as: 'reviews' } },
        {
          $addFields: {
            averageRating: { $ifNull: [{ $avg: '$reviews.rating' }, 0] },
            reviewsCount: { $size: '$reviews' },
          }
        },
        { $sort: { averageRating: -1, reviewsCount: -1 } },
        { $limit: 6 },
        { $project: { displayName: 1, profileImage: 1, photoURL: 1, averageRating: 1, reviewsCount: 1, job: 1 } }
      ]),

      // 3. Featured Artworks (Trending) - No populate for images
      artworkModel.find({ isAvailable: true })
        .sort({ viewCount: -1, likeCount: -1 })
        .limit(6)
        .populate({ path: 'artist', select: 'displayName profileImage photoURL' })
        .populate({ path: 'category', select: 'name' })
        .select('title images image price currency artist category likeCount')
        .lean(),

      // 4. Latest Artists - No populate for images
      userModel.find({ role: 'artist', isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('displayName profileImage photoURL job')
        .lean(),
        
      // 5. Most Rated Artworks - Using Aggregation, no image lookups
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
            title: 1, images: 1, image: 1, price: 1, currency: 1, artist: 1, category: 1,
            likeCount: 1, averageRating: 1,
          },
        },
      ]),
    ]);

    // 6. Personalized Artworks - No populate for images
    let personalizedArtworks = [];
    if (userId) {
      const user = await userModel.findById(userId).select('recentlyViewed.category').lean();
      const recentCategories = user?.recentlyViewed?.map(h => h.category).filter(Boolean) || [];
      const excludedIds = [
        ...featuredArtworks.map(a => a._id),
        ...mostRatedArtworks.map(a => a._id),
      ].map(id => new mongoose.Types.ObjectId(id));

      if (recentCategories.length > 0) {
        personalizedArtworks = await artworkModel.find({
          category: { $in: recentCategories },
          _id: { $nin: excludedIds },
          isAvailable: true,
        })
        .limit(6)
        .populate('artist', 'displayName profileImage photoURL')
        .populate('category', 'name')
        .select('title images image price currency artist category likeCount')
        .lean();
      }
    }
    
    // Fallback for personalized content - No populate for images
    if (personalizedArtworks.length < 6) {
        const extraNeeded = 6 - personalizedArtworks.length;
        const allExcludedIds = [
            ...featuredArtworks.map(a => a._id),
            ...mostRatedArtworks.map(a => a._id),
            ...personalizedArtworks.map(a => a._id),
        ].map(id => new mongoose.Types.ObjectId(id));

        const fallbackArtworks = await artworkModel.find({ isAvailable: true, _id: { $nin: allExcludedIds } })
            .sort({ likeCount: -1, createdAt: -1 })
            .limit(extraNeeded)
            .populate('artist', 'displayName profileImage photoURL')
            .populate('category', 'name')
            .select('title images image price currency artist category likeCount')
            .lean();
        personalizedArtworks.push(...fallbackArtworks);
    }

    res.status(200).json({
      success: true,
      message: 'تم جلب بيانات الصفحة الرئيسية بنجاح',
      data: {
        categories: categories.map(c => ({ _id: c._id, name: c.name?.ar || c.name, image: c.image?.url || c.image || null })),
        featuredArtists: formatArtists(featuredArtists),
        featuredArtworks: formatArtworks(featuredArtworks),
        latestArtists: formatArtists(latestArtists),
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
