import mongoose, { Schema, Types, model } from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     SpecialRequest:
 *       type: object
 *       required:
 *         - sender
 *         - artist
 *         - requestType
 *         - description
 *         - budget
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف الطلب الخاص
 *         sender:
 *           type: string
 *           description: معرف المستخدم المرسل للطلب
 *         artist:
 *           type: string
 *           description: معرف الفنان
 *         requestType:
 *           type: string
 *           description: نوع الطلب الخاص
 *         description:
 *           type: string
 *           description: وصف تفصيلي للطلب
 *         budget:
 *           type: number
 *           description: ميزانية الطلب
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected, completed]
 *           description: حالة الطلب
 *         response:
 *           type: string
 *           description: رد الفنان على الطلب
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: الموعد النهائي للطلب
 *         attachments:
 *           type: array
 *           items:
 *             type: string
 *           description: قائمة بروابط الملفات المرفقة بالطلب
 *         deliverables:
 *           type: array
 *           items:
 *             type: string
 *           description: قائمة بروابط ملفات التسليم
 *         finalNote:
 *           type: string
 *           description: ملاحظة نهائية عند إكمال الطلب
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إكمال الطلب
 */
const specialRequestSchema = new Schema({
  sender: { type: Types.ObjectId, ref: "User", required: true },
  artist: { type: Types.ObjectId, ref: "User", required: true },
  requestType: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["pending", "accepted", "rejected", "completed"], 
    default: "pending"
  },
  response: { type: String },
  deadline: { type: Date },
  attachments: [{ type: String }],
  deliverables: [{ type: String }],
  finalNote: { type: String },
  completedAt: { type: Date }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// إضافة حقل افتراضي لحساب المدة المتبقية حتى الموعد النهائي
specialRequestSchema.virtual('remainingDays').get(function() {
  if (!this.deadline) return null;
  
  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays > 0 ? diffDays : 0;
});

// إضافة حقل افتراضي للتحقق مما إذا كان الموعد النهائي قد انقضى
specialRequestSchema.virtual('isOverdue').get(function() {
  if (!this.deadline) return false;
  
  const today = new Date();
  const deadline = new Date(this.deadline);
  
  return today > deadline && this.status !== 'completed' && this.status !== 'rejected';
});

const specialRequestModel = mongoose.models.SpecialRequest || model("SpecialRequest", specialRequestSchema);
export default specialRequestModel; 