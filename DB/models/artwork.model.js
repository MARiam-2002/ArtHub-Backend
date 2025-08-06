import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Artwork:
 *       type: object
 *       required:
 *         - title
 *         - description
 *         - price
 *         - image
 *         - artist
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف العمل الفني
 *         title:
 *           type: string
 *           description: عنوان العمل الفني
 *         description:
 *           type: string
 *           description: وصف تفصيلي للعمل الفني
 *         price:
 *           type: number
 *           description: سعر العمل الفني
 *         image:
 *           type: string
 *           description: رابط صورة العمل الفني الرئيسية
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: قائمة بصور إضافية للعمل الفني
 *         artist:
 *           type: string
 *           description: معرف الفنان
 *         category:
 *           type: string
 *           description: معرف الفئة
 *         medium:
 *           type: string
 *           description: وسيط العمل الفني (زيت، أكريليك، إلخ)
 *         year:
 *           type: number
 *           description: سنة إنتاج العمل الفني
 *         isFeatured:
 *           type: boolean
 *           description: هل العمل مميز (للصفحة الرئيسية)
 *         isAvailable:
 *           type: boolean
 *           description: هل العمل متاح للبيع
 *         viewCount:
 *           type: number
 *           description: عدد مرات العرض
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إضافة العمل الفني
 */
const artworkSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    image: {
      type: String,
      required: true
    },
    images: [
      {
        type: String
      }
    ],
    artist: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
    category: {
      type: Types.ObjectId,
      ref: 'Category',
      required: true
    },
    medium: {
      type: String,
      trim: true
    },
    year: {
      type: Number
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    viewCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['available', 'sold', 'reserved', 'deleted'],
      default: 'available'
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// إنشاء فهارس لتحسين أداء البحث
artworkSchema.index({ title: 'text', description: 'text' });
artworkSchema.index({ artist: 1 });
artworkSchema.index({ category: 1 });
artworkSchema.index({ price: 1 });
artworkSchema.index({ createdAt: -1 });
artworkSchema.index({ isFeatured: 1, createdAt: -1 });

// دالة لزيادة عداد المشاهدات
artworkSchema.methods.incrementViewCount = async function () {
  this.viewCount += 1;
  return this.save();
};

// ربط افتراضي بالتقييمات
artworkSchema.virtual('reviews', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'artwork'
});

const artworkModel = mongoose.models.Artwork || model('Artwork', artworkSchema);
export default artworkModel;
