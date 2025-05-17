import reviewModel from '../../../DB/models/review.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import mongoose from 'mongoose';
import { getPaginationParams } from '../../utils/pagination.js';

export const addArtworkReview = asyncHandler(async (req, res) => {
  const { artwork, rating, comment } = req.body;
  const user = req.user._id;
  const review = await reviewModel.create({ user, artwork, rating, comment });
  res.status(201).json({ success: true, data: review });
});

export const getArtworkReviews = asyncHandler(async (req, res) => {
  const { artworkId } = req.params;
  const reviews = await reviewModel.find({ artwork: artworkId }).populate('user', 'email');
  res.json({ success: true, data: reviews });
});

export const addArtistReview = asyncHandler(async (req, res) => {
  const { artist, rating, comment } = req.body;
  const user = req.user._id;
  const review = await reviewModel.create({ user, artist, rating, comment });
  res.status(201).json({ success: true, data: review });
});

export const getArtistReviews = asyncHandler(async (req, res) => {
  const { artistId } = req.params;
  const reviews = await reviewModel.find({ artist: artistId }).populate('user', 'email');
  res.json({ success: true, data: reviews });
});

export const getArtworkReviewsWithStats = asyncHandler(async (req, res) => {
  const { artworkId } = req.params.id ? { artworkId: req.params.id } : req.params;
  const { page, limit, skip } = getPaginationParams(req.query, 10);
  const [reviews, stats] = await Promise.all([
    reviewModel.find({ artwork: artworkId })
      .populate('user', 'email')
      .skip(skip)
      .limit(limit),
    reviewModel.aggregate([
      { $match: { artwork: typeof artworkId === 'string' ? new mongoose.Types.ObjectId(artworkId) : artworkId } },
      { $group: { _id: null, avgRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ])
  ]);
  const avgRating = stats[0]?.avgRating || 0;
  const reviewsCount = stats[0]?.count || 0;
  res.json({ success: true, data: { reviews, avgRating, reviewsCount, page, limit } });
}); 