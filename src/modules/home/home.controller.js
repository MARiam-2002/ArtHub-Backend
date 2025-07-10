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
    profileImage: getImageUrl(artist.profileImage),
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
    image: getImageUrl(artwork.images),
    price: artwork.price,
    currency: artwork.currency || 'SAR',
    artist: artwork.artist ? {
      _id: artwork.artist._id,
      displayName: artwork.artist.displayName,
      profileImage: getImageUrl(artwork.artist.profileImage),
    } : null,
    category: artwork.category ? {
      _id: artwork.category._id,
      name: artwork.category.name?.ar || artwork.category.name,
    } : null,
    likeCount: artwork.likeCount || 0,
    rating: artwork.averageRating ? parseFloat(artwork.averageRating.toFixed(1)) : 0,
  }));
}

/**
 * Main controller to get all data for the home screen.
 * Final correct version with fixed aggregations and populations.
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
      categoryModel.find().limit(8).select('name image').populate('image', 'url').lean(),

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
        { $lookup: { from: 'images', localField: 'profileImage', foreignField: '_id', as: 'profileImage' } },
        { $unwind: { path: '$profileImage', preserveNullAndEmptyArrays: true } },
        { $project: { displayName: 1, profileImage: 1, averageRating: 1, reviewsCount: 1, job: 1 } }
      ]),

      // 3. Featured Artworks (Trending)
      artworkModel.find({ isAvailable: true })
        .sort({ viewCount: -1, likeCount: -1 })
        .limit(6)
        .populate({ path: 'images', select: 'url' })
        .populate({
          path: 'artist',
          select: 'displayName profileImage',
          populate: { path: 'profileImage', select: 'url' }
        })
        .populate({ path: 'category', select: 'name' })
        .select('title images price currency artist category likeCount')
        .lean(),

      // 4. Latest Artists
      userModel.find({ role: 'artist', isActive: true })
        .sort({ createdAt: -1 })
        .limit(6)
        .select('displayName profileImage job')
        .populate('profileImage', 'url')
        .lean(),
        
      // 5. Most Rated Artworks - Using Aggregation correctly now
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
        { $lookup: { from: 'images', localField: 'images', foreignField: '_id', as: 'images' } },
        { $lookup: { from: 'users', localField: 'artist', foreignField: '_id', as: 'artist' } },
        { $unwind: { path: '$artist', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'images', localField: 'artist.profileImage', foreignField: '_id', as: 'artist.profileImage' } },
        { $unwind: { path: '$artist.profileImage', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'categories', localField: 'category', foreignField: '_id', as: 'category' } },
        { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            title: 1,
            images: 1,
            price: 1,
            currency: 1,
            'artist._id': '$artist._id',
            'artist.displayName': '$artist.displayName',
            'artist.profileImage': '$artist.profileImage',
            'category._id': '$category._id',
            'category.name': '$category.name',
            likeCount: 1,
            averageRating: 1,
          },
        },
      ]),
    ]);

    // 6. Personalized Artworks
    let personalizedArtworks = [];
    if (userId) {
      const user = await userModel.findById(userId).select('recentlyViewed.category').lean();
      const recentCategories = user?.recentlyViewed?.map(h => h.category).filter(Boolean) || [];

      if (recentCategories.length > 0) {
        const excludedIds = [
          ...featuredArtworks.map(a => a._id),
          ...mostRatedArtworks.map(a => a._id),
        ].map(id => new mongoose.Types.ObjectId(id));

        personalizedArtworks = await artworkModel.find({
            category: { $in: recentCategories },
            _id: { $nin: excludedIds },
            isAvailable: true,
          })
          .limit(6)
          .populate({ path: 'images', select: 'url' })
          .populate({
            path: 'artist',
            select: 'displayName profileImage',
            populate: { path: 'profileImage', select: 'url' },
          })
          .populate({ path: 'category', select: 'name' })
          .select('title images price currency artist category likeCount rating')
          .lean();
      }
    }
    
    // Fallback for personalized content
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
            .populate({ path: 'images', select: 'url' })
            .populate({
                path: 'artist',
                select: 'displayName profileImage',
                populate: { path: 'profileImage', select: 'url' }
            })
            .populate({ path: 'category', select: 'name' })
            .select('title images price currency artist category likeCount rating')
            .lean();
        personalizedArtworks.push(...fallbackArtworks);
    }

    res.status(200).json({
      success: true,
      message: 'تم جلب بيانات الصفحة الرئيسية بنجاح',
      data: {
        categories: categories.map(c => ({ _id: c._id, name: c.name?.ar || c.name, image: getImageUrl(c.image) })),
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
