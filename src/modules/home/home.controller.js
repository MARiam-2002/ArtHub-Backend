import artworkModel from '../../../DB/models/artwork.model.js';
import userModel from '../../../DB/models/user.model.js';
import categoryModel from '../../../DB/models/category.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';

export const getHomeData = asyncHandler(async (req, res, next) => {
  try {
    // التصنيفات
    const categories = await categoryModel.find({}).limit(10);

    // أفضل الفنانين (حسب التقييمات وعدد الأعمال)
    const topArtists = await userModel.aggregate([
      { $match: { role: 'artist' } },
      {
        $lookup: {
          from: 'reviews',
          localField: '_id',
          foreignField: 'artist',
          as: 'reviews'
        }
      },
      {
        $lookup: {
          from: 'artworks',
          localField: '_id',
          foreignField: 'artist',
          as: 'artworks'
        }
      },
      {
        $addFields: {
          averageRating: {
            $cond: [{ $eq: [{ $size: '$reviews' }, 0] }, 0, { $avg: '$reviews.rating' }]
          },
          artworksCount: { $size: '$artworks' },
          reviewsCount: { $size: '$reviews' }
        }
      },
      {
        $sort: {
          averageRating: -1,
          reviewsCount: -1,
          artworksCount: -1
        }
      },
      { $limit: 4 },
      {
        $project: {
          _id: 1,
          displayName: 1,
          profileImage: 1,
          job: 1,
          averageRating: 1,
          reviewsCount: 1
        }
      }
    ]);

    // أعمال مميزة
    const featuredArtworks = await artworkModel
      .find({})
      .sort({ viewCount: -1, rating: -1 })
      .limit(8)
      .populate('artist', 'displayName profileImage job');

    // أحدث الأعمال الفنية
    const latestArtworks = await artworkModel
      .find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('artist', 'displayName profileImage job');

    // أعمال مخصصة للمستخدم (إذا كان مسجل)
    let personalizedArtworks = [];
    if (req.user) {
      // هنا يمكن استخدام تفضيلات المستخدم أو سجل تصفحه لعرض أعمال مخصصة
      // مثال بسيط: عرض أعمال من نفس فئات الأعمال التي شاهدها
      const userViewedCategories = await artworkModel
        .find({
          _id: { $in: req.user.viewedArtworks || [] }
        })
        .distinct('category');

      if (userViewedCategories.length > 0) {
        personalizedArtworks = await artworkModel
          .find({
            category: { $in: userViewedCategories }
          })
          .sort({ createdAt: -1 })
          .limit(6)
          .populate('artist', 'displayName profileImage job');
      } else {
        // إذا لم يكن هناك سجل، نعرض أعمال عشوائية
        personalizedArtworks = await artworkModel.aggregate([{ $sample: { size: 6 } }]);

        // نضيف بيانات الفنان للأعمال العشوائية
        const artistIds = personalizedArtworks.map(a => a.artist);
        const artists = await userModel
          .find({
            _id: { $in: artistIds }
          })
          .select('displayName profileImage job');

        const artistsMap = artists.reduce((map, artist) => {
          map[artist._id.toString()] = artist;
          return map;
        }, {});

        personalizedArtworks = personalizedArtworks.map(artwork => ({
          ...artwork,
          artist: artistsMap[artwork.artist.toString()]
        }));
      }
    }

    res.success(
      {
        categories,
        topArtists,
        featuredArtworks,
        latestArtworks,
        personalizedArtworks
      },
      'تم جلب بيانات الصفحة الرئيسية بنجاح'
    );
  } catch (err) {
    next(err);
  }
});

export const search = asyncHandler(async (req, res, next) => {
  const { q, type = 'all', category, price_min, price_max, page = 1, limit = 10 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (q) {
    query.$or = [
      { title: { $regex: q, $options: 'i' } },
      { description: { $regex: q, $options: 'i' } }
    ];
  }

  if (category) {
    query.category = category;
  }

  if (price_min || price_max) {
    query.price = {};
    if (price_min) {
      query.price.$gte = Number(price_min);
    }
    if (price_max) {
      query.price.$lte = Number(price_max);
    }
  }

  try {
    const results = {};
    let totalCount = 0;

    if (type === 'all' || type === 'artworks') {
      const [artworks, artworksCount] = await Promise.all([
        artworkModel
          .find(query)
          .populate('artist', 'displayName profileImage job')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(Number(limit)),
        artworkModel.countDocuments(query)
      ]);

      results.artworks = artworks;
      totalCount += artworksCount;
    }

    if (type === 'all' || type === 'artists') {
      const artistQuery = q
        ? {
            $or: [
              { displayName: { $regex: q, $options: 'i' } },
              { job: { $regex: q, $options: 'i' } }
            ],
            role: 'artist'
          }
        : { role: 'artist' };

      const [artists, artistsCount] = await Promise.all([
        userModel
          .find(artistQuery)
          .select('displayName profileImage job')
          .skip(skip)
          .limit(Number(limit)),
        userModel.countDocuments(artistQuery)
      ]);

      results.artists = artists;
      totalCount += artistsCount;
    }

    const totalPages = Math.ceil(totalCount / limit);
    const pagination = {
      currentPage: Number(page),
      totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    res.success(
      {
        ...results,
        pagination
      },
      'تم جلب نتائج البحث بنجاح'
    );
  } catch (err) {
    next(err);
  }
});

export const getTrendingContent = asyncHandler(async (req, res, next) => {
  const { type = 'all', limit = 10 } = req.query;

  try {
    const results = {};

    if (type === 'all' || type === 'artworks') {
      // أكثر الأعمال الفنية مشاهدة ومبيعًا
      results.trendingArtworks = await artworkModel
        .find({})
        .sort({ viewCount: -1, salesCount: -1 })
        .limit(Number(limit))
        .populate('artist', 'displayName profileImage job');
    }

    if (type === 'all' || type === 'artists') {
      // الفنانين الأكثر شهرة (الأعلى تقييمًا)
      results.trendingArtists = await userModel.aggregate([
        { $match: { role: 'artist' } },
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
              $cond: [{ $eq: [{ $size: '$reviews' }, 0] }, 0, { $avg: '$reviews.rating' }]
            },
            reviewsCount: { $size: '$reviews' }
          }
        },
        { $sort: { averageRating: -1, reviewsCount: -1 } },
        { $limit: Number(limit) },
        {
          $project: {
            _id: 1,
            displayName: 1,
            profileImage: 1,
            job: 1,
            averageRating: 1,
            reviewsCount: 1
          }
        }
      ]);
    }

    res.success(results, 'تم جلب المحتوى الرائج بنجاح');
  } catch (err) {
    next(err);
  }
});

export const getExploreContent = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  try {
    // مزيج من الأعمال الفنية والفنانين للاستكشاف
    const [artworks, artists, categories] = await Promise.all([
      artworkModel
        .find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit) * 0.7) // 70% من النتائج ستكون أعمال فنية
        .populate('artist', 'displayName profileImage job'),

      userModel
        .find({ role: 'artist' })
        .sort({ createdAt: -1 })
        .limit(Number(limit) * 0.3) // 30% من النتائج ستكون فنانين
        .select('displayName profileImage job'),

      categoryModel.find({}).limit(10)
    ]);

    const totalCount =
      (await artworkModel.countDocuments({})) +
      (await userModel.countDocuments({ role: 'artist' }));
    const totalPages = Math.ceil(totalCount / limit);

    const pagination = {
      currentPage: Number(page),
      totalPages,
      totalItems: totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    };

    res.success(
      {
        artworks,
        artists,
        categories,
        pagination
      },
      'تم جلب محتوى الاستكشاف بنجاح'
    );
  } catch (err) {
    next(err);
  }
});
