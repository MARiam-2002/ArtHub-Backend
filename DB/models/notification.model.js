import mongoose, { Schema, Types, model } from "mongoose";

const notificationSchema = new Schema({
  user: { type: Types.ObjectId, ref: "User", required: true },
  title: { 
    ar: { type: String, required: true },
    en: { type: String }
  },
  message: { 
    ar: { type: String, required: true },
    en: { type: String }
  },
  type: { type: String, enum: ["request", "message", "review", "system", "other"], default: "other" },
  isRead: { type: Boolean, default: false },
  ref: { type: Types.ObjectId, refPath: 'refModel' },
  refModel: { type: String, enum: ["SpecialRequest", "Artwork", "Message", "User"] },
  data: { type: Object, default: {} }
}, { timestamps: true });

// إضافة طريقة لاسترجاع الإشعار باللغة المفضلة
notificationSchema.methods.getLocalizedContent = function(language = 'ar') {
  return {
    _id: this._id,
    user: this.user,
    title: this.title[language] || this.title.ar,
    message: this.message[language] || this.message.ar,
    type: this.type,
    isRead: this.isRead,
    ref: this.ref,
    refModel: this.refModel,
    data: this.data,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const notificationModel = mongoose.models.Notification || model("Notification", notificationSchema);
export default notificationModel; 