import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Transaction:
 *       type: object
 *       required:
 *         - buyer
 *         - amount
 *         - artwork
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف المعاملة
 *         buyer:
 *           type: string
 *           description: معرف المشتري
 *         seller:
 *           type: string
 *           description: معرف البائع (الفنان)
 *         artwork:
 *           type: string
 *           description: معرف العمل الفني
 *         specialRequest:
 *           type: string
 *           description: معرف الطلب الخاص (اختياري)
 *         amount:
 *           type: number
 *           description: قيمة المعاملة
 *         commissionAmount:
 *           type: number
 *           description: قيمة العمولة للمنصة
 *         netAmount:
 *           type: number
 *           description: صافي المبلغ للفنان
 *         currency:
 *           type: string
 *           description: عملة المعاملة
 *         paymentMethod:
 *           type: string
 *           description: طريقة الدفع
 *         paymentId:
 *           type: string
 *           description: معرف عملية الدفع من البوابة
 *         status:
 *           type: string
 *           description: حالة المعاملة
 *           enum: [pending, completed, failed, refunded]
 *         shippingAddress:
 *           type: object
 *           description: عنوان الشحن
 *         trackingInfo:
 *           type: object
 *           description: معلومات تتبع الشحن
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إنشاء المعاملة
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إتمام المعاملة
 */
const transactionSchema = new Schema(
  {
    buyer: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
    seller: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
    artwork: {
      type: Types.ObjectId,
      ref: 'Artwork'
    },
    specialRequest: {
      type: Types.ObjectId,
      ref: 'SpecialRequest'
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    commissionAmount: {
      type: Number,
      default: 0
    },
    netAmount: {
      type: Number,
      default: function () {
        return this.amount - this.commissionAmount;
      }
    },
    currency: {
      type: String,
      default: 'SAR'
    },
    paymentMethod: {
      type: String,
      enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'other'],
      required: true
    },
    paymentId: {
      type: String
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    shippingAddress: {
      fullName: String,
      addressLine1: String,
      addressLine2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phoneNumber: String
    },
    trackingInfo: {
      provider: String,
      trackingNumber: String,
      trackingUrl: String,
      estimatedDelivery: Date,
      shippedAt: Date
    },
    completedAt: {
      type: Date
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// عند إكمال معاملة، تحديث حالة العمل الفني إلى "مباع"
transactionSchema.pre('save', async function (next) {
  try {
    if (this.isModified('status') && this.status === 'completed' && this.artwork) {
      this.completedAt = new Date();

      // تحديث العمل الفني إلى "مباع"
      const artworkModel = mongoose.model('Artwork');
      await artworkModel.findByIdAndUpdate(this.artwork, {
        isAvailable: false
      });
    }
    next();
  } catch (error) {
    next(error);
  }
});

const transactionModel = mongoose.models.Transaction || model('Transaction', transactionSchema);
export default transactionModel;
