import mongoose, { Schema, Types, model } from 'mongoose';

const followSchema = new Schema(
  {
    follower: { type: Types.ObjectId, ref: 'User', required: true },
    following: { type: Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
);

const followModel = mongoose.models.Follow || model('Follow', followSchema);
export default followModel;
