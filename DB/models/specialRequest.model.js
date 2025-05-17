import mongoose, { Schema, Types, model } from "mongoose";

const specialRequestSchema = new Schema({
  sender: { type: Types.ObjectId, ref: "User", required: true },
  artist: { type: Types.ObjectId, ref: "User", required: true },
  requestType: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  response: { type: String },
}, { timestamps: true });

const specialRequestModel = mongoose.models.SpecialRequest || model("SpecialRequest", specialRequestSchema);
export default specialRequestModel; 