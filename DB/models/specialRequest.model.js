import mongoose, { Schema, Types, model } from 'mongoose';

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
 *         - title
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
 *           enum: [custom_artwork, portrait, logo_design, illustration, digital_art, traditional_art, animation, graphic_design, character_design, concept_art, other]
 *           description: نوع الطلب الخاص
 *         title:
 *           type: string
 *           description: عنوان الطلب
 *         description:
 *           type: string
 *           description: وصف تفصيلي للطلب
 *         budget:
 *           type: number
 *           description: ميزانية الطلب
 *         currency:
 *           type: string
 *           enum: [SAR, USD, EUR, AED]
 *           description: عملة الميزانية
 *         quotedPrice:
 *           type: number
 *           description: السعر المقتبس من الفنان
 *         finalPrice:
 *           type: number
 *           description: السعر النهائي المتفق عليه
 *         status:
 *           type: string
 *           enum: [pending, accepted, rejected, in_progress, review, completed, cancelled]
 *           description: حالة الطلب
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: أولوية الطلب
 *         category:
 *           type: string
 *           description: فئة الطلب
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: علامات الطلب
 *         response:
 *           type: string
 *           description: رد الفنان على الطلب
 *         deadline:
 *           type: string
 *           format: date-time
 *           description: الموعد النهائي للطلب
 *         estimatedDelivery:
 *           type: string
 *           format: date-time
 *           description: تاريخ التسليم المتوقع
 *         attachments:
 *           type: array
 *           items:
 *             type: object
 *           description: قائمة بالملفات المرفقة بالطلب
 *         specifications:
 *           type: object
 *           description: مواصفات العمل المطلوب
 *         communicationPreferences:
 *           type: object
 *           description: تفضيلات التواصل
 *         deliverables:
 *           type: array
 *           items:
 *             type: object
 *           description: قائمة بملفات التسليم
 *         milestones:
 *           type: array
 *           items:
 *             type: object
 *           description: مراحل العمل
 *         revisions:
 *           type: array
 *           items:
 *             type: object
 *           description: التعديلات المطلوبة
 *         finalNote:
 *           type: string
 *           description: ملاحظة نهائية عند إكمال الطلب
 *         workingHours:
 *           type: number
 *           description: ساعات العمل المقدرة
 *         usedRevisions:
 *           type: number
 *           description: عدد التعديلات المستخدمة
 *         allowRevisions:
 *           type: boolean
 *           description: السماح بالتعديلات
 *         maxRevisions:
 *           type: number
 *           description: الحد الأقصى للتعديلات
 *         isPrivate:
 *           type: boolean
 *           description: هل الطلب خاص
 *         completedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إكمال الطلب
 *         acceptedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ قبول الطلب
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ بداية العمل
 *         cancellationReason:
 *           type: string
 *           description: سبب إلغاء الطلب
 *         cancelledAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ إلغاء الطلب
 *         refundRequested:
 *           type: boolean
 *           description: طلب استرداد
 *         refundAmount:
 *           type: number
 *           description: مبلغ الاسترداد
 *         clientFeedback:
 *           type: string
 *           description: ملاحظات العميل
 *         artistRating:
 *           type: number
 *           description: تقييم الفنان
 *         clientRating:
 *           type: number
 *           description: تقييم العميل
 *         metadata:
 *           type: object
 *           description: بيانات إضافية
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Sub-schema for attachments
const AttachmentSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['image', 'document', 'reference'],
    required: true
  },
  name: {
    type: String,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 200
  },
  size: {
    type: Number
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Sub-schema for specifications
const SpecificationsSchema = new Schema({
  dimensions: {
    width: Number,
    height: Number,
    unit: {
      type: String,
      enum: ['px', 'cm', 'in', 'mm'],
      default: 'px'
    }
  },
  format: {
    type: String,
    enum: ['digital', 'print', 'both']
  },
  resolution: Number,
  colorMode: {
    type: String,
    enum: ['RGB', 'CMYK', 'Grayscale']
  },
  fileFormat: [{
    type: String,
    enum: ['PNG', 'JPG', 'JPEG', 'SVG', 'PDF', 'AI', 'PSD', 'EPS']
  }],
  additionalRequirements: {
    type: String,
    maxlength: 1000
  },
  // New field for technical details/specifications (مقاسات أو تفاصيل فنية)
  technicalDetails: {
    type: String,
    maxlength: 1000
  }
}, { _id: false });

// Sub-schema for communication preferences
const CommunicationPreferencesSchema = new Schema({
  preferredMethod: {
    type: String,
    enum: ['chat', 'email', 'phone', 'video_call'],
    default: 'chat'
  },
  timezone: String,
  availableHours: {
    start: String,
    end: String
  },
  language: {
    type: String,
    default: 'ar'
  }
}, { _id: false });

// Sub-schema for deliverables
const DeliverableSchema = new Schema({
  url: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['final', 'preview', 'source', 'documentation'],
    required: true
  },
  name: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 200
  },
  size: Number,
  format: String,
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

// Sub-schema for milestones
const MilestoneSchema = new Schema({
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  dueDate: Date,
  percentage: {
    type: Number,
    min: 0,
    max: 100
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  completedAt: Date,
  deliverables: [String] // URLs to milestone deliverables
}, { _id: true });

// Sub-schema for revisions
const RevisionSchema = new Schema({
  requestedBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  feedback: {
    type: String,
    required: true,
    maxlength: 1000
  },
  specificChanges: [{
    type: String,
    maxlength: 200
  }],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  attachments: [String], // URLs to reference images/files
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  response: String,
  responseAttachments: [String],
  completedAt: Date,
  requestedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

// Sub-schema for progress updates
const ProgressUpdateSchema = new Schema({
  progress: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  note: {
    type: String,
    maxlength: 500
  },
  attachments: [String],
  milestone: {
    type: Types.ObjectId
  },
  updatedBy: {
    type: Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

const specialRequestSchema = new Schema(
  {
    sender: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    artist: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true
    },
    requestType: { 
      type: String, 
      required: true,
      enum: [
        'custom_artwork',
        'portrait',
        'logo_design',
        'illustration',
        'digital_art',
        'traditional_art',
        'animation',
        'graphic_design',
        'character_design',
        'concept_art',
        'other'
      ],
      index: true
    },
    title: {
      type: String,
      // كان required: true
      required: false,
      maxlength: 100,
      index: 'text'
    },
    description: { 
      type: String, 
      required: true,
      maxlength: 2000,
      index: 'text'
    },
    budget: { 
      type: Number, 
      required: true,
      min: 10,
      max: 100000,
      index: true
    },
    currency: {
      type: String,
      enum: ['SAR', 'USD', 'EUR', 'AED'],
      default: 'SAR'
    },
    // Duration in days (المدة المطلوبة)
    duration: {
      type: Number,
      min: 1,
      max: 365,
      default: 7,
      index: true
    },
    quotedPrice: {
      type: Number,
      min: 0
    },
    finalPrice: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'in_progress', 'review', 'completed', 'cancelled'],
      default: 'pending',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
      index: true
    },
    category: {
      type: Types.ObjectId,
      ref: 'Category'
    },
    tags: [{
      type: String,
      maxlength: 30
    }],
    response: { 
      type: String,
      maxlength: 1000
    },
    deadline: { 
      type: Date,
      index: true
    },
    estimatedDelivery: {
      type: Date
    },
    // Enhanced attachments
    attachments: [AttachmentSchema],
    // Work specifications
    specifications: SpecificationsSchema,
    // Communication preferences
    communicationPreferences: CommunicationPreferencesSchema,
    // Deliverables
    deliverables: [DeliverableSchema],
    // Project milestones
    milestones: [MilestoneSchema],
    // Revision requests
    revisions: [RevisionSchema],
    // Progress tracking
    progressUpdates: [ProgressUpdateSchema],
    currentProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    finalNote: { 
      type: String,
      maxlength: 1000
    },
    workingHours: {
      type: Number,
      min: 0
    },
    usedRevisions: {
      type: Number,
      min: 0,
      default: 0
    },
    allowRevisions: {
      type: Boolean,
      default: true
    },
    maxRevisions: {
      type: Number,
      min: 0,
      max: 10,
      default: 3
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    // Status timestamps
    completedAt: { 
      type: Date 
    },
    acceptedAt: {
      type: Date
    },
    startedAt: {
      type: Date
    },
    rejectedAt: {
      type: Date
    },
    // Cancellation details
    cancellationReason: { 
      type: String,
      maxlength: 500
    },
    cancelledAt: { 
      type: Date 
    },
    cancelledBy: {
      type: Types.ObjectId,
      ref: 'User'
    },
    // Refund information
    refundRequested: {
      type: Boolean,
      default: false
    },
    refundAmount: {
      type: Number,
      min: 0
    },
    refundProcessedAt: {
      type: Date
    },
    // Feedback and ratings
    clientFeedback: {
      type: String,
      maxlength: 500
    },
    artistRating: {
      type: Number,
      min: 1,
      max: 5
    },
    clientRating: {
      type: Number,
      min: 1,
      max: 5
    },
    // Additional metadata
    metadata: {
      sourceIP: String,
      userAgent: String,
      deviceInfo: {
        platform: String,
        version: String
      },
      referrer: String,
      utm: {
        source: String,
        medium: String,
        campaign: String
      },
      analytics: {
        viewCount: {
          type: Number,
          default: 0
        },
        lastViewed: Date,
        timeSpent: Number, // in seconds
        interactionCount: {
          type: Number,
          default: 0
        }
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for remaining days until deadline
specialRequestSchema.virtual('remainingDays').get(function () {
  if (!this.deadline) {
    return null;
  }

  const today = new Date();
  const deadline = new Date(this.deadline);
  const diffTime = deadline - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays > 0 ? diffDays : 0;
});

// Virtual for checking if deadline has passed
specialRequestSchema.virtual('isOverdue').get(function () {
  if (!this.deadline) {
    return false;
  }

  const today = new Date();
  const deadline = new Date(this.deadline);

  return today > deadline && !['completed', 'rejected', 'cancelled'].includes(this.status);
});

// Virtual for calculating total project duration
specialRequestSchema.virtual('projectDuration').get(function () {
  if (!this.acceptedAt) {
    return null;
  }

  const endDate = this.completedAt || new Date();
  const startDate = this.acceptedAt;
  const diffTime = endDate - startDate;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
});

// Virtual for completion percentage
specialRequestSchema.virtual('completionPercentage').get(function () {
  if (this.status === 'completed') return 100;
  if (this.status === 'cancelled' || this.status === 'rejected') return 0;
  
  return this.currentProgress || 0;
});

// Virtual for revision usage percentage
specialRequestSchema.virtual('revisionUsagePercentage').get(function () {
  if (this.maxRevisions === 0) return 0;
  return Math.round((this.usedRevisions / this.maxRevisions) * 100);
});

// Virtual for status display in Arabic
specialRequestSchema.virtual('statusArabic').get(function () {
  const statusMap = {
    pending: 'في الانتظار',
    accepted: 'مقبول',
    rejected: 'مرفوض',
    in_progress: 'قيد التنفيذ',
    review: 'قيد المراجعة',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };
  return statusMap[this.status] || this.status;
});

// Virtual for priority display in Arabic
specialRequestSchema.virtual('priorityArabic').get(function () {
  const priorityMap = {
    low: 'منخفضة',
    medium: 'متوسطة',
    high: 'عالية',
    urgent: 'عاجلة'
  };
  return priorityMap[this.priority] || this.priority;
});

// Pre-save middleware
specialRequestSchema.pre('save', function (next) {
  // Update status timestamps
  if (this.isModified('status')) {
    const now = new Date();
    
    switch (this.status) {
      case 'accepted':
        if (!this.acceptedAt) this.acceptedAt = now;
        break;
      case 'in_progress':
        if (!this.startedAt) this.startedAt = now;
        break;
      case 'completed':
        if (!this.completedAt) this.completedAt = now;
        this.currentProgress = 100;
        break;
      case 'rejected':
        if (!this.rejectedAt) this.rejectedAt = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }

  // Validate revision limits
  if (this.usedRevisions > this.maxRevisions) {
    return next(new Error('عدد التعديلات المستخدمة يتجاوز الحد المسموح'));
  }

  // Set final price if not set
  if (this.status === 'completed' && !this.finalPrice && this.quotedPrice) {
    this.finalPrice = this.quotedPrice;
  }

  next();
});

// Post-save middleware for analytics
specialRequestSchema.post('save', async function(doc) {
  // Update view count and interaction metrics
  if (doc.isModified('metadata.analytics.viewCount')) {
    doc.metadata.analytics.lastViewed = new Date();
  }
});

// Indexes for performance optimization
specialRequestSchema.index({ sender: 1, status: 1 });
specialRequestSchema.index({ artist: 1, status: 1 });
specialRequestSchema.index({ status: 1, priority: 1 });
specialRequestSchema.index({ requestType: 1, status: 1 });
specialRequestSchema.index({ budget: 1, currency: 1 });
specialRequestSchema.index({ deadline: 1, status: 1 });
specialRequestSchema.index({ createdAt: -1 });
specialRequestSchema.index({ updatedAt: -1 });
specialRequestSchema.index({ completedAt: -1 });
specialRequestSchema.index({ isPrivate: 1, status: 1 });
specialRequestSchema.index({ 'metadata.analytics.viewCount': -1 });

// Text search index
specialRequestSchema.index({ 
  title: 'text', 
  description: 'text', 
  tags: 'text' 
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 1
  }
});

/**
 * Static method to find requests with advanced filtering
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Query options
 * @returns {Promise} - Promise with filtered requests
 */
specialRequestSchema.statics.findWithFilters = function (filters = {}, options = {}) {
  const {
    page = 1,
    limit = 10,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    search,
    populate = true
  } = options;

  const skip = (page - 1) * limit;
  const sortDirection = sortOrder === 'asc' ? 1 : -1;

  // Build match criteria
  const matchCriteria = { ...filters };

  // Add search functionality
  if (search) {
    matchCriteria.$text = { $search: search };
  }

  let query = this.find(matchCriteria)
    .sort({ [sortBy]: sortDirection })
    .skip(skip)
    .limit(limit);

  // Add population if requested
  if (populate) {
    query = query
      .populate('sender', 'displayName profileImage email')
      .populate('artist', 'displayName profileImage email portfolioImages')
      .populate('category', 'name nameAr');
  }

  return query;
};

/**
 * Static method to get request statistics
 * @param {Object} filters - Filter criteria
 * @param {Object} options - Aggregation options
 * @returns {Promise} - Promise with statistics
 */
specialRequestSchema.statics.getStats = async function (filters = {}, options = {}) {
  const {
    groupBy = 'status',
    period = 'month',
    startDate,
    endDate
  } = options;

  // Build date range
  let dateRange = {};
  if (startDate && endDate) {
    dateRange = {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  } else if (period !== 'all') {
    const now = new Date();
    const periodStart = new Date();
    
    switch (period) {
      case 'day':
        periodStart.setDate(now.getDate() - 1);
        break;
      case 'week':
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'month':
        periodStart.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        periodStart.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
    }
    
    if (period !== 'all') {
      dateRange.createdAt = { $gte: periodStart };
    }
  }

  const pipeline = [
    {
      $match: {
        ...filters,
        ...dateRange
      }
    },
    {
      $group: {
        _id: `$${groupBy}`,
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' },
        averageBudget: { $avg: '$budget' },
        totalQuotedPrice: { $sum: '$quotedPrice' },
        averageQuotedPrice: { $avg: '$quotedPrice' },
        totalFinalPrice: { $sum: '$finalPrice' },
        averageCompletionTime: {
          $avg: {
            $cond: [
              { $ne: ['$completedAt', null] },
              {
                $divide: [
                  { $subtract: ['$completedAt', '$acceptedAt'] },
                  1000 * 60 * 60 * 24 // Convert to days
                ]
              },
              null
            ]
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ];

  const stats = await this.aggregate(pipeline);

  // Calculate overall statistics
  const overallStats = await this.aggregate([
    {
      $match: {
        ...filters,
        ...dateRange
      }
    },
    {
      $group: {
        _id: null,
        totalRequests: { $sum: 1 },
        totalBudget: { $sum: '$budget' },
        averageBudget: { $avg: '$budget' },
        completedRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledRequests: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        },
        averageRating: { $avg: '$artistRating' }
      }
    }
  ]);

  return {
    breakdown: stats,
    overall: overallStats[0] || {},
    period,
    groupBy
  };
};

/**
 * Static method to get trending request types
 * @param {Number} limit - Number of results to return
 * @param {Object} timeframe - Time period for analysis
 * @returns {Promise} - Promise with trending types
 */
specialRequestSchema.statics.getTrendingTypes = async function (limit = 10, timeframe = 'month') {
  const now = new Date();
  const startDate = new Date();
  
  switch (timeframe) {
    case 'week':
      startDate.setDate(now.getDate() - 7);
      break;
    case 'month':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case 'quarter':
      startDate.setMonth(now.getMonth() - 3);
      break;
    default:
      startDate.setMonth(now.getMonth() - 1);
  }

  return this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
        status: { $ne: 'cancelled' }
      }
    },
    {
      $group: {
        _id: '$requestType',
        count: { $sum: 1 },
        averageBudget: { $avg: '$budget' },
        completionRate: {
          $avg: {
            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
          }
        }
      }
    },
    {
      $sort: { count: -1 }
    },
    {
      $limit: limit
    }
  ]);
};

/**
 * Instance method to add progress update
 * @param {Number} progress - Progress percentage (0-100)
 * @param {String} note - Progress note
 * @param {ObjectId} updatedBy - User who updated progress
 * @param {Array} attachments - Attachment URLs
 * @returns {Promise} - Promise with updated document
 */
specialRequestSchema.methods.addProgressUpdate = function(progress, note, updatedBy, attachments = []) {
  this.progressUpdates.push({
    progress,
    note,
    updatedBy,
    attachments
  });
  
  this.currentProgress = progress;
  
  // Auto-update status based on progress
  if (progress === 100 && this.status === 'in_progress') {
    this.status = 'review';
  } else if (progress > 0 && this.status === 'accepted') {
    this.status = 'in_progress';
  }
  
  return this.save();
};

/**
 * Instance method to add revision request
 * @param {ObjectId} requestedBy - User requesting revision
 * @param {String} feedback - Revision feedback
 * @param {Array} specificChanges - Specific changes requested
 * @param {String} priority - Revision priority
 * @param {Array} attachments - Reference attachments
 * @returns {Promise} - Promise with updated document
 */
specialRequestSchema.methods.addRevisionRequest = function(requestedBy, feedback, specificChanges = [], priority = 'medium', attachments = []) {
  if (this.usedRevisions >= this.maxRevisions) {
    throw new Error('تم استنفاد عدد التعديلات المسموح بها');
  }
  
  this.revisions.push({
    requestedBy,
    feedback,
    specificChanges,
    priority,
    attachments
  });
  
  this.usedRevisions += 1;
  this.status = 'review';
  
  return this.save();
};

/**
 * Instance method to complete milestone
 * @param {ObjectId} milestoneId - Milestone ID
 * @param {Array} deliverables - Milestone deliverables
 * @returns {Promise} - Promise with updated document
 */
specialRequestSchema.methods.completeMilestone = function(milestoneId, deliverables = []) {
  const milestone = this.milestones.id(milestoneId);
  if (!milestone) {
    throw new Error('المرحلة غير موجودة');
  }
  
  milestone.status = 'completed';
  milestone.completedAt = new Date();
  milestone.deliverables = deliverables;
  
  // Calculate overall progress based on completed milestones
  const completedMilestones = this.milestones.filter(m => m.status === 'completed');
  const totalPercentage = this.milestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
  const completedPercentage = completedMilestones.reduce((sum, m) => sum + (m.percentage || 0), 0);
  
  if (totalPercentage > 0) {
    this.currentProgress = Math.round((completedPercentage / totalPercentage) * 100);
  }
  
  return this.save();
};

/**
 * Instance method to calculate estimated completion date
 * @returns {Date} - Estimated completion date
 */
specialRequestSchema.methods.getEstimatedCompletion = function() {
  if (this.estimatedDelivery) {
    return this.estimatedDelivery;
  }
  
  if (this.deadline) {
    return this.deadline;
  }
  
  // Calculate based on average completion time for similar requests
  const averageDays = 14; // Default estimate
  const estimatedDate = new Date();
  estimatedDate.setDate(estimatedDate.getDate() + averageDays);
  
  return estimatedDate;
};

const specialRequestModel =
  mongoose.models.SpecialRequest || model('SpecialRequest', specialRequestSchema);
export default specialRequestModel;
