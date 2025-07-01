import mongoose, { Schema, Types, model } from 'mongoose';

const reviewSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    artwork: { type: Types.ObjectId, ref: 'Artwork' },
    artist: { type: Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String }
  },
  { timestamps: true }
);

const reviewModel = mongoose.models.Review || model('Review', reviewSchema);
export default reviewModel;
