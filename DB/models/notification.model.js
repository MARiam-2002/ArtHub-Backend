import mongoose, { Schema, Types, model } from "mongoose";

const notificationSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ["request", "message", "review", "system", "other"], default: "other" },
  isRead: { type: Boolean, default: false },
  ref: { type: Types.ObjectId, refPath: 'refModel' },
  refModel: { type: String, enum: ["SpecialRequest", "Artwork", "Message", "User"] },
}, { timestamps: true });

const notificationModel = mongoose.models.Notification || model("Notification", notificationSchema);
export default notificationModel; 