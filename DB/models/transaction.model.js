import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     TransactionItem:
 *       type: object
 *       properties:
 *         artwork:
 *           type: string
 *           description: معرف العمل الفني
 *         specialRequest:
 *           type: string
 *           description: معرف الطلب الخاص
 *         quantity:
 *           type: number
 *           minimum: 1
 *           description: الكمية
 *         unitPrice:
 *           type: number
 *           minimum: 0
 *           description: السعر للوحدة الواحدة
 *         totalPrice:
 *           type: number
 *           minimum: 0
 *           description: إجمالي السعر للعنصر
 *         discountAmount:
 *           type: number
 *           minimum: 0
 *           description: مبلغ الخصم
 *         finalPrice:
 *           type: number
 *           minimum: 0
 *           description: السعر النهائي بعد الخصم
 * 
 *     PaymentDetails:
 *       type: object
 *       properties:
 *         method:
 *           type: string
 *           enum: [credit_card, debit_card, bank_transfer, paypal, stripe, apple_pay, google_pay, mada, stc_pay, other]
 *           description: طريقة الدفع
 *         provider:
 *           type: string
 *           description: مزود خدمة الدفع
 *         transactionId:
 *           type: string
 *           description: معرف المعاملة من مزود الدفع
 *         reference:
 *           type: string
 *           description: المرجع من مزود الدفع
 *         cardLast4:
 *           type: string
 *           description: آخر 4 أرقام من البطاقة
 *         cardBrand:
 *           type: string
 *           description: نوع البطاقة (Visa, Mastercard, etc.)
 *         fees:
 *           type: number
 *           description: رسوم الدفع
 * 
 *     ShippingDetails:
 *       type: object
 *       properties:
 *         address:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
 *             addressLine1:
 *               type: string
 *             addressLine2:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             postalCode:
 *               type: string
 *             country:
 *               type: string
 *             phoneNumber:
 *               type: string
 *         method:
 *           type: string
 *           enum: [standard, express, overnight, pickup]
 *           description: طريقة الشحن
 *         cost:
 *           type: number
 *           description: تكلفة الشحن
 *         estimatedDays:
 *           type: number
 *           description: عدد الأيام المتوقعة للتسليم
 *         tracking:
 *           type: object
 *           properties:
 *             provider:
 *               type: string
 *             trackingNumber:
 *               type: string
 *             trackingUrl:
 *               type: string
 *             status:
 *               type: string
 *               enum: [pending, shipped, in_transit, delivered, returned]
 *             shippedAt:
 *               type: string
 *               format: date-time
 *             deliveredAt:
 *               type: string
 *               format: date-time
 *             estimatedDelivery:
 *               type: string
 *               format: date-time
 * 
 *     Transaction:
 *       type: object
 *       required:
 *         - buyer
 *         - seller
 *         - items
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف المعاملة
 *         transactionNumber:
 *           type: string
 *           description: رقم المعاملة الفريد
 *         buyer:
 *           type: string
 *           description: معرف المشتري
 *         seller:
 *           type: string
 *           description: معرف البائع (الفنان)
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TransactionItem'
 *           description: عناصر المعاملة
 *         pricing:
 *           type: object
 *           properties:
 *             subtotal:
 *               type: number
 *               description: المجموع الفرعي
 *             discountAmount:
 *               type: number
 *               description: إجمالي الخصم
 *             taxAmount:
 *               type: number
 *               description: ضريبة القيمة المضافة
 *             shippingCost:
 *               type: number
 *               description: تكلفة الشحن
 *             commissionAmount:
 *               type: number
 *               description: عمولة المنصة
 *             totalAmount:
 *               type: number
 *               description: إجمالي المبلغ
 *             netAmount:
 *               type: number
 *               description: صافي المبلغ للبائع
 *         currency:
 *           type: string
 *           description: العملة
 *         payment:
 *           $ref: '#/components/schemas/PaymentDetails'
 *         shipping:
 *           $ref: '#/components/schemas/ShippingDetails'
 *         status:
 *           type: string
 *           enum: [pending, processing, confirmed, shipped, delivered, completed, cancelled, refunded, disputed]
 *           description: حالة المعاملة
 *         statusHistory:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *               updatedBy:
 *                 type: string
 *               reason:
 *                 type: string
 *               notes:
 *                 type: string
 *         installments:
 *           type: object
 *           properties:
 *             enabled:
 *               type: boolean
 *             totalInstallments:
 *               type: number
 *             paidInstallments:
 *               type: number
 *             installmentAmount:
 *               type: number
 *             nextDueDate:
 *               type: string
 *               format: date-time
 *             schedule:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   installmentNumber:
 *                     type: number
 *                   amount:
 *                     type: number
 *                   dueDate:
 *                     type: string
 *                     format: date-time
 *                   paidAt:
 *                     type: string
 *                     format: date-time
 *                   status:
 *                     type: string
 *                     enum: [pending, paid, overdue, failed]
 *         refund:
 *           type: object
 *           properties:
 *             requested:
 *               type: boolean
 *             requestedAt:
 *               type: string
 *               format: date-time
 *             requestedBy:
 *               type: string
 *             reason:
 *               type: string
 *             amount:
 *               type: number
 *             status:
 *               type: string
 *               enum: [pending, approved, rejected, processed]
 *             processedAt:
 *               type: string
 *               format: date-time
 *             refundId:
 *               type: string
 *         dispute:
 *           type: object
 *           properties:
 *             active:
 *               type: boolean
 *             openedAt:
 *               type: string
 *               format: date-time
 *             openedBy:
 *               type: string
 *             reason:
 *               type: string
 *             description:
 *               type: string
 *             status:
 *               type: string
 *               enum: [open, investigating, resolved, closed]
 *             resolution:
 *               type: string
 *             resolvedAt:
 *               type: string
 *               format: date-time
 *         metadata:
 *           type: object
 *           properties:
 *             userAgent:
 *               type: string
 *             ipAddress:
 *               type: string
 *             deviceType:
 *               type: string
 *             location:
 *               type: object
 *               properties:
 *                 country:
 *                   type: string
 *                 city:
 *                   type: string
 *             source:
 *               type: string
 *               enum: [web, mobile_app, api]
 *         notes:
 *           type: string
 *           description: ملاحظات إضافية
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إنشاء المعاملة
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ آخر تحديث
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إتمام المعاملة
 */

// Transaction Item Schema
const transactionItemSchema = new Schema({
  artwork: {
    type: Types.ObjectId,
    ref: 'Artwork'
  },
  specialRequest: {
    type: Types.ObjectId,
    ref: 'SpecialRequest'
  },
  quantity: {
    type: Number,
    default: 1,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  discountAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  finalPrice: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

// Payment Details Schema
const paymentDetailsSchema = new Schema({
  method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'bank_transfer', 'paypal', 'stripe', 'apple_pay', 'google_pay', 'mada', 'stc_pay', 'other'],
    required: true
  },
  provider: {
    type: String,
    required: true
  },
  transactionId: {
    type: String
  },
  reference: {
    type: String
  },
  cardLast4: {
    type: String,
    match: /^\d{4}$/
  },
  cardBrand: {
    type: String,
    enum: ['visa', 'mastercard', 'amex', 'mada', 'other']
  },
  fees: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Shipping Details Schema
const shippingDetailsSchema = new Schema({
  address: {
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, required: true, default: 'SA' },
    phoneNumber: { type: String, required: true }
  },
  method: {
    type: String,
    enum: ['standard', 'express', 'overnight', 'pickup'],
    default: 'standard'
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  estimatedDays: {
    type: Number,
    default: 7,
    min: 1
  },
  tracking: {
    provider: String,
    trackingNumber: String,
    trackingUrl: String,
    status: {
      type: String,
      enum: ['pending', 'shipped', 'in_transit', 'delivered', 'returned'],
      default: 'pending'
    },
    shippedAt: Date,
    deliveredAt: Date,
    estimatedDelivery: Date
  }
}, { _id: false });

// Status History Schema
const statusHistorySchema = new Schema({
  status: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: Types.ObjectId,
    ref: 'User'
  },
  reason: String,
  notes: String
}, { _id: false });

// Installment Schedule Schema
const installmentScheduleSchema = new Schema({
  installmentNumber: {
    type: Number,
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  dueDate: {
    type: Date,
    required: true
  },
  paidAt: Date,
  status: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'failed'],
    default: 'pending'
  }
}, { _id: false });

// Main Transaction Schema
const transactionSchema = new Schema(
  {
    transactionNumber: {
      type: String,
      unique: true,
      required: true
    },
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
    items: [transactionItemSchema],
    
    // Pricing breakdown
    pricing: {
      subtotal: {
        type: Number,
        required: true,
        min: 0
      },
      discountAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      taxAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      shippingCost: {
        type: Number,
        default: 0,
        min: 0
      },
      commissionAmount: {
        type: Number,
        default: 0,
        min: 0
      },
      totalAmount: {
        type: Number,
        required: true,
        min: 0
      },
      netAmount: {
        type: Number,
        required: true,
        min: 0
      }
    },
    
    currency: {
      type: String,
      default: 'SAR',
      enum: ['SAR', 'USD', 'EUR', 'AED']
    },
    
    payment: paymentDetailsSchema,
    shipping: shippingDetailsSchema,
    
    status: {
      type: String,
      enum: ['pending', 'processing', 'confirmed', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded', 'disputed'],
      default: 'pending'
    },
    
    statusHistory: [statusHistorySchema],
    
    // Installment support
    installments: {
      enabled: {
        type: Boolean,
        default: false
      },
      totalInstallments: {
        type: Number,
        min: 2,
        max: 12
      },
      paidInstallments: {
        type: Number,
        default: 0
      },
      installmentAmount: {
        type: Number,
        min: 0
      },
      nextDueDate: Date,
      schedule: [installmentScheduleSchema]
    },
    
    // Refund tracking
    refund: {
      requested: {
        type: Boolean,
        default: false
      },
      requestedAt: Date,
      requestedBy: {
        type: Types.ObjectId,
        ref: 'User'
      },
      reason: String,
      amount: {
        type: Number,
        min: 0
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'processed'],
        default: 'pending'
      },
      processedAt: Date,
      refundId: String
    },
    
    // Dispute management
    dispute: {
      active: {
        type: Boolean,
        default: false
      },
      openedAt: Date,
      openedBy: {
        type: Types.ObjectId,
        ref: 'User'
      },
      reason: {
        type: String,
        enum: ['not_received', 'not_as_described', 'damaged', 'unauthorized', 'other']
      },
      description: String,
      status: {
        type: String,
        enum: ['open', 'investigating', 'resolved', 'closed'],
        default: 'open'
      },
      resolution: String,
      resolvedAt: Date
    },
    
    // Metadata for analytics and security
    metadata: {
      userAgent: String,
      ipAddress: String,
      deviceType: {
        type: String,
        enum: ['mobile', 'desktop', 'tablet', 'unknown'],
        default: 'unknown'
      },
      location: {
        country: String,
        city: String
      },
      source: {
        type: String,
        enum: ['web', 'mobile_app', 'api'],
        default: 'web'
      }
    },
    
    notes: {
      type: String,
      maxlength: 1000
    },
    
    completedAt: Date
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ seller: 1, createdAt: -1 });
transactionSchema.index({ transactionNumber: 1 }, { unique: true });
transactionSchema.index({ status: 1 });
transactionSchema.index({ 'payment.transactionId': 1 });
transactionSchema.index({ 'shipping.tracking.trackingNumber': 1 });
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ 'items.artwork': 1 });
transactionSchema.index({ 'items.specialRequest': 1 });

// Virtual for total commission rate
transactionSchema.virtual('commissionRate').get(function() {
  if (this.pricing.subtotal > 0) {
    return (this.pricing.commissionAmount / this.pricing.subtotal) * 100;
  }
  return 0;
});

// Virtual for transaction age in days
transactionSchema.virtual('ageInDays').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for installment progress
transactionSchema.virtual('installmentProgress').get(function() {
  if (!this.installments.enabled) return null;
  return {
    percentage: (this.installments.paidInstallments / this.installments.totalInstallments) * 100,
    remaining: this.installments.totalInstallments - this.installments.paidInstallments,
    nextAmount: this.installments.installmentAmount
  };
});

// Generate unique transaction number
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Count transactions today
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));
    
    const count = await this.constructor.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay }
    });
    
    const sequence = (count + 1).toString().padStart(4, '0');
    this.transactionNumber = `TXN${year}${month}${day}${sequence}`;
  }
  
  // Add status history entry
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
      updatedBy: this._updatedBy || null,
      reason: this._statusReason || null,
      notes: this._statusNotes || null
    });
  }
  
  // Update completion date
  if (this.isModified('status') && this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }
  
  next();
});

// Static method to calculate commission
transactionSchema.statics.calculateCommission = function(amount, type = 'artwork') {
  const rates = {
    artwork: {
      tier1: { max: 500, rate: 0.10 },    // 10% for amounts under 500
      tier2: { max: 2000, rate: 0.08 },   // 8% for 500-2000
      tier3: { max: 5000, rate: 0.06 },   // 6% for 2000-5000
      tier4: { max: Infinity, rate: 0.04 } // 4% for over 5000
    },
    specialRequest: {
      tier1: { max: 1000, rate: 0.12 },   // 12% for amounts under 1000
      tier2: { max: 3000, rate: 0.10 },   // 10% for 1000-3000
      tier3: { max: 8000, rate: 0.08 },   // 8% for 3000-8000
      tier4: { max: Infinity, rate: 0.06 } // 6% for over 8000
    }
  };
  
  const tierRates = rates[type] || rates.artwork;
  
  for (const tier of Object.values(tierRates)) {
    if (amount <= tier.max) {
      return amount * tier.rate;
    }
  }
  
  return amount * 0.04; // Default fallback
};

// Static method to calculate tax (VAT)
transactionSchema.statics.calculateTax = function(amount, country = 'SA') {
  const taxRates = {
    'SA': 0.15, // 15% VAT in Saudi Arabia
    'AE': 0.05, // 5% VAT in UAE
    'US': 0.00, // No federal VAT in US
    'EU': 0.20  // Average EU VAT
  };
  
  const rate = taxRates[country] || 0.15;
  return amount * rate;
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = async function(userId, role = 'buyer') {
  const matchCondition = role === 'buyer' ? { buyer: userId } : { seller: userId };
  
  const stats = await this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$pricing.totalAmount' },
        avgAmount: { $avg: '$pricing.totalAmount' },
        completedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        refundedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'refunded'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    avgAmount: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    refundedTransactions: 0
  };
};

// Instance method to update status with tracking
transactionSchema.methods.updateStatus = function(newStatus, updatedBy, reason, notes) {
  this._updatedBy = updatedBy;
  this._statusReason = reason;
  this._statusNotes = notes;
  this.status = newStatus;
  return this.save();
};

// Instance method to process refund
transactionSchema.methods.processRefund = function(amount, reason, processedBy) {
  this.refund = {
    requested: true,
    requestedAt: new Date(),
    requestedBy: processedBy,
    reason,
    amount: amount || this.pricing.totalAmount,
    status: 'pending'
  };
  return this.save();
};

// Instance method to open dispute
transactionSchema.methods.openDispute = function(reason, description, openedBy) {
  this.dispute = {
    active: true,
    openedAt: new Date(),
    openedBy,
    reason,
    description,
    status: 'open'
  };
  return this.save();
};

const transactionModel = mongoose.models.Transaction || model('Transaction', transactionSchema);
export default transactionModel;
