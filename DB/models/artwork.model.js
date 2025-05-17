import mongoose, { Schema, Types, model } from "mongoose";

const artworkSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  images: [{ type: String, required: true }],
  price: { type: Number, required: true },
  status: { type: String, enum: ["available", "sold"], default: "available" },
  tags: [{ type: String }],
  category: { type: Types.ObjectId, ref: "Category" },
  artist: { type: Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

const artworkModel = mongoose.models.Artwork || model("Artwork", artworkSchema);
export default artworkModel; 