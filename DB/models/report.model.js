import mongoose, { Schema, Types, model } from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Report:
 *       type: object
 *       required:
 *         - reporter
 *         - reason
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف التقرير
 *         reporter:
 *           type: string
 *           description: معرف المستخدم المبلغ
 *         contentType:
 *           type: string
 *           enum: [artwork, image, user, comment, message]
 *           description: نوع المحتوى المبلغ عنه
 *         contentId:
 *           type: string
 *           description: معرف المحتوى المبلغ عنه
 *         targetUser:
 *           type: string
 *           description: معرف المستخدم الذي تم الإبلاغ عنه
 *         reason:
 *           type: string
 *           enum: [inappropriate, copyright, spam, offensive, harassment, other]
 *           description: سبب الإبلاغ
 *         description:
 *           type: string
 *           description: وصف تفصيلي للإبلاغ
 *         status:
 *           type: string
 *           enum: [pending, resolved, rejected]
 *           description: حالة الإبلاغ
 *         adminNotes:
 *           type: string
 *           description: ملاحظات المدير على الإبلاغ
 *         resolvedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ حل الإبلاغ
 */
const reportSchema = new Schema({
  reporter: { type: Types.ObjectId, ref: "User", required: true },
  contentType: { 
    type: String, 
    enum: ["artwork", "image", "user", "comment", "message"],
    required: true 
  },
  contentId: { type: Types.ObjectId, required: true },
  targetUser: { type: Types.ObjectId, ref: "User" },
  reason: { 
    type: String, 
    enum: ["inappropriate", "copyright", "spam", "offensive", "harassment", "other"],
    required: true 
  },
  description: { type: String },
  status: { 
    type: String, 
    enum: ["pending", "resolved", "rejected"], 
    default: "pending" 
  },
  adminNotes: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

// تحديث تاريخ الحل عند تغيير الحالة إلى resolved
reportSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// إنشاء فهرس مركب على نوع المحتوى ومعرف المحتوى
reportSchema.index({ contentType: 1, contentId: 1 });

const reportModel = mongoose.models.Report || model("Report", reportSchema);
export default reportModel; 