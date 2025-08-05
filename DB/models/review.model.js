import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * Sub-schema for review attachments
 */
const AttachmentSchema = new Schema({
  url: { 
    type: String, 
    required: true,
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'رابط المرفق غير صالح'
    }
  },
  type: { 
    type: String, 
    enum: ['image', 'video', 'document'], 
    required: true 
  },
  caption: { 
    type: String, 
    maxlength: 200 
  },
  size: { 
    type: Number,
    min: 0 
  },
  mimeType: { 
    type: String 
  },
  thumbnail: { 
    type: String 
  },
  uploadedAt: { 
    type: Date, 
    default: Date.now 
  }
}, { _id: false });

/**
 * Sub-schema for working experience details (for artist reviews)
 */
const WorkingExperienceSchema = new Schema({
  projectType: {
    type: String,
    enum: ['commission', 'collaboration', 'purchase', 'consultation', 'workshop', 'exhibition', 'other'],
    default: 'purchase'
  },
  duration: {
    type: String,
    enum: ['less_than_week', 'one_to_two_weeks', 'two_to_four_weeks', 'one_to_three_months', 'more_than_three_months'],
    default: 'one_to_two_weeks'
  },
  budget: {
    type: String,
    enum: ['under_100', '100_500', '500_1000', '1000_5000', '5000_10000', 'over_10000'],
    default: '100_500'
  },
  complexity: {
    type: String,
    enum: ['simple', 'moderate', 'complex', 'very_complex'],
    default: 'moderate'
  },
  satisfaction: {
    type: String,
    enum: ['very_dissatisfied', 'dissatisfied', 'neutral', 'satisfied', 'very_satisfied'],
    default: 'satisfied'
  }
}, { _id: false });

/**
 * Sub-schema for purchase information
 */
const PurchaseInfoSchema = new Schema({
  transactionId: { 
    type: Types.ObjectId, 
    ref: 'Transaction' 
  },
  purchaseDate: { 
    type: Date 
  },
  purchasePrice: { 
    type: Number,
    min: 0 
  },
  currency: { 
    type: String, 
    enum: ['SAR', 'USD', 'EUR', 'AED'], 
    default: 'SAR' 
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'bank_transfer', 'paypal', 'apple_pay', 'stc_pay', 'other']
  },
  invoiceNumber: { 
    type: String 
  }
}, { _id: false });

/**
 * Sub-schema for review sentiment analysis
 */
const SentimentAnalysisSchema = new Schema({
  score: { 
    type: Number, 
    min: -1, 
    max: 1,
    default: 0 
  },
  confidence: { 
    type: Number, 
    min: 0, 
    max: 1,
    default: 0 
  },
  sentiment: { 
    type: String, 
    enum: ['positive', 'negative', 'neutral'],
    default: 'neutral' 
  },
  keywords: [{ 
    type: String 
  }],
  analyzedAt: { 
    type: Date, 
    default: Date.now 
  },
  version: { 
    type: String, 
    default: '1.0' 
  }
}, { _id: false });

/**
 * Sub-schema for moderation history
 */
const ModerationHistorySchema = new Schema({
  action: { 
    type: String, 
    enum: ['approved', 'rejected', 'hidden', 'flagged', 'restored'],
    required: true 
  },
  moderator: { 
    type: Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  reason: { 
    type: String,
    maxlength: 500 
  },
  notes: { 
    type: String,
    maxlength: 1000 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  automated: { 
    type: Boolean, 
    default: false 
  }
}, { _id: true });

/**
 * Sub-schema for review responses (artist/seller responses)
 */
const ResponseSchema = new Schema({
  responder: { 
    type: Types.ObjectId, 
    ref: 'User',
    required: true 
  },
  content: { 
    type: String, 
    required: true,
    maxlength: 1000 
  },
  responseDate: { 
    type: Date, 
    default: Date.now 
  },
  isPublic: { 
    type: Boolean, 
    default: true 
  },
  edited: { 
    type: Boolean, 
    default: false 
  },
  editedAt: { 
    type: Date 
  }
}, { _id: true });

/**
 * Main Review Schema
 */
const reviewSchema = new Schema(
  {
    // Basic Review Information
    user: { 
      type: Types.ObjectId, 
      ref: 'User', 
      required: true,
      index: true 
    },
    artwork: { 
      type: Types.ObjectId, 
      ref: 'Artwork',
      index: true 
    },
    artist: { 
      type: Types.ObjectId, 
      ref: 'User',
      index: true 
    },
    rating: { 
      type: Number, 
      min: 1, 
      max: 5, 
      required: true,
      index: true 
    },
    
    // Review Content
    title: { 
      type: String, 
      maxlength: 150,
      trim: true 
    },
    comment: { 
      type: String, 
      maxlength: 2000,
      trim: true 
    },
    
    // Detailed Feedback
    pros: [{ 
      type: String, 
      maxlength: 250,
      trim: true 
    }],
    cons: [{ 
      type: String, 
      maxlength: 250,
      trim: true 
    }],
    
    // Sub-ratings for artwork reviews
    subRatings: {
      creativity: { type: Number, min: 1, max: 5 },
      technique: { type: Number, min: 1, max: 5 },
      composition: { type: Number, min: 1, max: 5 },
      originality: { type: Number, min: 1, max: 5 },
      impact: { type: Number, min: 1, max: 5 },
      valueForMoney: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
      delivery: { type: Number, min: 1, max: 5 },
      professionalism: { type: Number, min: 1, max: 5 },
      responsiveness: { type: Number, min: 1, max: 5 }
    },
    
    // Review Metadata
    isVerifiedPurchase: { 
      type: Boolean, 
      default: false,
      index: true 
    },
    isRecommended: { 
      type: Boolean,
      index: true 
    },
    anonymous: { 
      type: Boolean, 
      default: false 
    },
    
    // Review Status and Moderation
    status: {
      type: String,
      enum: ['pending', 'active', 'hidden', 'reported', 'deleted', 'archived'],
      default: 'active',
      index: true
    },
    
    // Interaction Metrics
    helpfulVotes: { 
      type: Number, 
      default: 0,
      min: 0,
      index: true 
    },
    unhelpfulVotes: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    reportedCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    viewsCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    sharesCount: { 
      type: Number, 
      default: 0,
      min: 0 
    },
    
    // User Interactions
    interactions: {
      helpful: [{ 
        type: Types.ObjectId, 
        ref: 'User' 
      }],
      unhelpful: [{ 
        type: Types.ObjectId, 
        ref: 'User' 
      }],
      reported: [{ 
        type: Types.ObjectId, 
        ref: 'User' 
      }],
      bookmarked: [{ 
        type: Types.ObjectId, 
        ref: 'User' 
      }]
    },
    
    // Enhanced Features
    tags: [{ 
      type: String,
      maxlength: 30,
      trim: true 
    }],
    attachments: [AttachmentSchema],
    workingExperience: WorkingExperienceSchema,
    purchaseInfo: PurchaseInfoSchema,
    sentimentAnalysis: SentimentAnalysisSchema,
    
    // Responses and Moderation
    responses: [ResponseSchema],
    moderationHistory: [ModerationHistorySchema],
    
    // System Fields
    language: { 
      type: String, 
      enum: ['ar', 'en', 'fr'], 
      default: 'ar' 
    },
    source: { 
      type: String, 
      enum: ['web', 'mobile', 'api', 'import'], 
      default: 'web' 
    },
    version: { 
      type: Number, 
      default: 1 
    },
    
    // Legacy Support
    moderationNotes: { type: String },
    moderatedBy: { type: Types.ObjectId, ref: 'User' },
    moderatedAt: { type: Date },
    
    // Analytics and Tracking
    analytics: {
      readTime: { type: Number, default: 0 },
      engagementScore: { type: Number, default: 0 },
      qualityScore: { type: Number, default: 0 },
      influenceScore: { type: Number, default: 0 }
    },
    
    // Metadata
    metadata: {
      userAgent: { type: String },
      ipAddress: { type: String },
      deviceType: { 
        type: String, 
        enum: ['mobile', 'tablet', 'desktop', 'unknown'],
        default: 'unknown' 
      },
      platform: { 
        type: String, 
        enum: ['ios', 'android', 'web', 'unknown'],
        default: 'unknown' 
      },
      location: {
        country: { type: String },
        city: { type: String },
        coordinates: {
          lat: { type: Number },
          lng: { type: Number }
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

// Compound Indexes for Performance
reviewSchema.index({ user: 1, artwork: 1 }, { unique: true, sparse: true, name: 'user_artwork_unique' });
reviewSchema.index({ user: 1, artist: 1 }, { unique: true, sparse: true, name: 'user_artist_unique' });
reviewSchema.index({ artwork: 1, status: 1, rating: -1 }, { name: 'artwork_status_rating' });
reviewSchema.index({ artist: 1, status: 1, rating: -1 }, { name: 'artist_status_rating' });
reviewSchema.index({ status: 1, createdAt: -1 }, { name: 'status_created' });
reviewSchema.index({ helpfulVotes: -1, status: 1 }, { name: 'helpful_status' });
reviewSchema.index({ isVerifiedPurchase: 1, rating: -1 }, { name: 'verified_rating' });
reviewSchema.index({ createdAt: -1, rating: -1 }, { name: 'created_rating' });

// Text Search Index
reviewSchema.index({ 
  title: 'text', 
  comment: 'text', 
  'pros': 'text', 
  'cons': 'text',
  tags: 'text' 
}, { 
  weights: { 
    title: 10, 
    comment: 5, 
    pros: 3, 
    cons: 3,
    tags: 2 
  },
  name: 'review_text_search'
});

// Geospatial Index for Location-based Queries
reviewSchema.index({ 'metadata.location.coordinates': '2dsphere' });

// TTL Index for Soft Deleted Reviews
reviewSchema.index({ 
  deletedAt: 1 
}, { 
  expireAfterSeconds: 7776000, // 90 days
  partialFilterExpression: { status: 'deleted' }
});

// Virtual Fields
reviewSchema.virtual('calculatedRating').get(function() {
  if (!this.subRatings || Object.keys(this.subRatings).length === 0) {
    return this.rating;
  }
  
  const ratings = Object.values(this.subRatings).filter(r => r && r > 0);
  if (ratings.length === 0) return this.rating;
  
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return Math.round((sum / ratings.length) * 10) / 10;
});

reviewSchema.virtual('helpfulnessScore').get(function() {
  const totalVotes = this.helpfulVotes + this.unhelpfulVotes;
  if (totalVotes === 0) return 0;
  return Math.round((this.helpfulVotes / totalVotes) * 100);
});

reviewSchema.virtual('engagementRate').get(function() {
  const totalInteractions = this.helpfulVotes + this.unhelpfulVotes + this.reportedCount + this.sharesCount;
  if (this.viewsCount === 0) return 0;
  return Math.round((totalInteractions / this.viewsCount) * 100);
});

reviewSchema.virtual('responseTime').get(function() {
  if (!this.responses || this.responses.length === 0) return null;
  const firstResponse = this.responses[0];
  return firstResponse.responseDate - this.createdAt;
});

reviewSchema.virtual('hasResponse').get(function() {
  return this.responses && this.responses.length > 0;
});

reviewSchema.virtual('isRecent').get(function() {
  const daysDiff = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);
  return daysDiff <= 30;
});

reviewSchema.virtual('wordCount').get(function() {
  let count = 0;
  if (this.title) count += this.title.split(' ').length;
  if (this.comment) count += this.comment.split(' ').length;
  return count;
});

reviewSchema.virtual('readingTime').get(function() {
  const wordsPerMinute = 200; // Average reading speed
  const words = this.wordCount;
  return Math.ceil(words / wordsPerMinute);
});

reviewSchema.virtual('targetType').get(function() {
  return this.artwork ? 'artwork' : 'artist';
});

reviewSchema.virtual('targetId').get(function() {
  return this.artwork || this.artist;
});

// Instance Methods
reviewSchema.methods.markAsHelpful = function(userId) {
  if (!this.interactions.helpful.includes(userId)) {
    this.interactions.helpful.push(userId);
    this.helpfulVotes += 1;
    
    // Remove from unhelpful if exists
    const unhelpfulIndex = this.interactions.unhelpful.indexOf(userId);
    if (unhelpfulIndex > -1) {
      this.interactions.unhelpful.splice(unhelpfulIndex, 1);
      this.unhelpfulVotes -= 1;
    }
  }
  return this.save();
};

reviewSchema.methods.unmarkAsHelpful = function(userId) {
  const index = this.interactions.helpful.indexOf(userId);
  if (index > -1) {
    this.interactions.helpful.splice(index, 1);
    this.helpfulVotes -= 1;
  }
  return this.save();
};

reviewSchema.methods.markAsUnhelpful = function(userId) {
  if (!this.interactions.unhelpful.includes(userId)) {
    this.interactions.unhelpful.push(userId);
    this.unhelpfulVotes += 1;
    
    // Remove from helpful if exists
    const helpfulIndex = this.interactions.helpful.indexOf(userId);
    if (helpfulIndex > -1) {
      this.interactions.helpful.splice(helpfulIndex, 1);
      this.helpfulVotes -= 1;
    }
  }
  return this.save();
};

reviewSchema.methods.reportReview = function(userId, reason) {
  if (!this.interactions.reported.includes(userId)) {
    this.interactions.reported.push(userId);
    this.reportedCount += 1;
    
    // Add to moderation history
    this.moderationHistory.push({
      action: 'flagged',
      moderator: userId,
      reason: reason,
      automated: false
    });
  }
  return this.save();
};

reviewSchema.methods.addResponse = function(responderId, content, isPublic = true) {
  this.responses.push({
    responder: responderId,
    content: content,
    isPublic: isPublic
  });
  return this.save();
};

reviewSchema.methods.updateEngagementScore = function() {
  const helpfulWeight = 3;
  const viewWeight = 1;
  const shareWeight = 5;
  const responseWeight = 10;
  
  this.analytics.engagementScore = 
    (this.helpfulVotes * helpfulWeight) +
    (this.viewsCount * viewWeight) +
    (this.sharesCount * shareWeight) +
    (this.responses.length * responseWeight);
    
  return this.save();
};

reviewSchema.methods.calculateQualityScore = function() {
  let score = 0;
  
  // Content quality (40%)
  if (this.title) score += 10;
  if (this.comment && this.comment.length > 50) score += 20;
  if (this.pros && this.pros.length > 0) score += 5;
  if (this.cons && this.cons.length > 0) score += 5;
  
  // Verification (20%)
  if (this.isVerifiedPurchase) score += 20;
  
  // Engagement (20%)
  if (this.helpfulVotes > 0) score += Math.min(this.helpfulVotes * 2, 20);
  
  // Completeness (20%)
  if (this.subRatings && Object.keys(this.subRatings).length > 3) score += 10;
  if (this.attachments && this.attachments.length > 0) score += 10;
  
  this.analytics.qualityScore = Math.min(score, 100);
  return this.save();
};

// Static Methods
reviewSchema.statics.getAverageRating = async function(targetId, targetType = 'artwork') {
  const matchCondition = targetType === 'artwork' ? { artwork: targetId } : { artist: targetId };
  
  // إضافة شرط إضافي لتقييمات الفنان
  if (targetType === 'artist') {
    matchCondition.artwork = { $exists: false };
  }
  
  const result = await this.aggregate([
    { $match: { ...matchCondition, status: 'active' } },
    {
      $group: {
        _id: null,
        avgRating: { $avg: '$rating' },
        count: { $sum: 1 },
        ratings: { $push: '$rating' },
        avgSubRatings: {
          $avg: {
            $avg: {
              $filter: {
                input: { $objectToArray: '$subRatings' },
                cond: { $ne: ['$$this.v', null] }
              }
            }
          }
        }
      }
    }
  ]);
  
  return result[0] || { avgRating: 0, count: 0, ratings: [], avgSubRatings: 0 };
};

reviewSchema.statics.getRatingDistribution = async function(targetId, targetType = 'artwork') {
  const matchCondition = targetType === 'artwork' ? { artwork: targetId } : { artist: targetId };
  
  // إضافة شرط إضافي لتقييمات الفنان
  if (targetType === 'artist') {
    matchCondition.artwork = { $exists: false };
  }
  
  const result = await this.aggregate([
    { $match: { ...matchCondition, status: 'active' } },
    {
      $group: {
        _id: '$rating',
        count: { $sum: 1 }
      }
    },
    { $sort: { _id: -1 } }
  ]);
  
  const distribution = [0, 0, 0, 0, 0]; // 1-5 stars
  result.forEach(item => {
    if (item._id >= 1 && item._id <= 5) {
      distribution[item._id - 1] = item.count;
    }
  });
  
  return distribution.reverse(); // 5-1 stars
};

reviewSchema.statics.getReviewStats = async function(targetId, targetType = 'artwork', options = {}) {
  const matchCondition = targetType === 'artwork' ? { artwork: targetId } : { artist: targetId };
  
  if (options.dateRange) {
    matchCondition.createdAt = {
      $gte: options.dateRange.start,
      $lte: options.dateRange.end
    };
  }
  
  const pipeline = [
    { $match: { ...matchCondition, status: 'active' } },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalHelpfulVotes: { $sum: '$helpfulVotes' },
        totalViews: { $sum: '$viewsCount' },
        verifiedReviews: {
          $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
        },
        recommendedCount: {
          $sum: { $cond: ['$isRecommended', 1, 0] }
        },
        averageWordCount: {
          $avg: { $add: [
            { $size: { $split: [{ $ifNull: ['$title', ''] }, ' '] } },
            { $size: { $split: [{ $ifNull: ['$comment', ''] }, ' '] } }
          ]}
        },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ];
  
  const result = await this.aggregate(pipeline);
  return result[0] || {};
};

reviewSchema.statics.getTopReviewers = async function(limit = 10, period = 'month') {
  const dateLimit = new Date();
  if (period === 'week') dateLimit.setDate(dateLimit.getDate() - 7);
  else if (period === 'month') dateLimit.setMonth(dateLimit.getMonth() - 1);
  else if (period === 'year') dateLimit.setFullYear(dateLimit.getFullYear() - 1);
  
  return this.aggregate([
    {
      $match: {
        status: 'active',
        createdAt: { $gte: dateLimit }
      }
    },
    {
      $group: {
        _id: '$user',
        reviewCount: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalHelpfulVotes: { $sum: '$helpfulVotes' },
        verifiedReviews: {
          $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
        }
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: '_id',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $project: {
        user: {
          _id: '$user._id',
          displayName: '$user.displayName',
          userName: '$user.userName',
          profileImage: '$user.profileImage'
        },
        reviewCount: 1,
        averageRating: 1,
        totalHelpfulVotes: 1,
        verifiedReviews: 1,
        score: {
          $add: [
            { $multiply: ['$reviewCount', 2] },
            { $multiply: ['$totalHelpfulVotes', 3] },
            { $multiply: ['$verifiedReviews', 5] }
          ]
        }
      }
    },
    { $sort: { score: -1 } },
    { $limit: limit }
  ]);
};

reviewSchema.statics.getTrendingReviews = async function(limit = 20, timeframe = 'week') {
  const dateLimit = new Date();
  if (timeframe === 'day') dateLimit.setDate(dateLimit.getDate() - 1);
  else if (timeframe === 'week') dateLimit.setDate(dateLimit.getDate() - 7);
  else if (timeframe === 'month') dateLimit.setMonth(dateLimit.getMonth() - 1);
  
  return this.aggregate([
    {
      $match: {
        status: 'active',
        createdAt: { $gte: dateLimit }
      }
    },
    {
      $addFields: {
        trendingScore: {
          $add: [
            { $multiply: ['$helpfulVotes', 3] },
            { $multiply: ['$viewsCount', 1] },
            { $multiply: ['$sharesCount', 5] },
            { $multiply: [{ $size: '$responses' }, 10] }
          ]
        }
      }
    },
    { $sort: { trendingScore: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $lookup: {
        from: 'users',
        localField: 'user',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'artworks',
        localField: 'artwork',
        foreignField: '_id',
        as: 'artwork'
      }
    }
  ]);
};

reviewSchema.statics.getSentimentAnalysis = async function(targetId, targetType = 'artwork') {
  const matchCondition = targetType === 'artwork' ? { artwork: targetId } : { artist: targetId };
  
  return this.aggregate([
    { $match: { ...matchCondition, status: 'active' } },
    {
      $group: {
        _id: '$sentimentAnalysis.sentiment',
        count: { $sum: 1 },
        averageScore: { $avg: '$sentimentAnalysis.score' },
        averageConfidence: { $avg: '$sentimentAnalysis.confidence' }
      }
    },
    { $sort: { count: -1 } }
  ]);
};

reviewSchema.statics.bulkUpdateStatus = async function(reviewIds, newStatus, moderatorId, reason) {
  const result = await this.updateMany(
    { _id: { $in: reviewIds } },
    {
      $set: { status: newStatus },
      $push: {
        moderationHistory: {
          action: newStatus,
          moderator: moderatorId,
          reason: reason,
          timestamp: new Date(),
          automated: false
        }
      }
    }
  );
  
  return result;
};

reviewSchema.statics.getAnalytics = async function(options = {}) {
  const matchCondition = { status: 'active' };
  
  if (options.dateRange) {
    matchCondition.createdAt = {
      $gte: options.dateRange.start,
      $lte: options.dateRange.end
    };
  }
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        totalHelpfulVotes: { $sum: '$helpfulVotes' },
        totalViews: { $sum: '$viewsCount' },
        verifiedPurchases: {
          $sum: { $cond: ['$isVerifiedPurchase', 1, 0] }
        },
        recommendationRate: {
          $avg: { $cond: ['$isRecommended', 1, 0] }
        },
        averageEngagementScore: { $avg: '$analytics.engagementScore' },
        averageQualityScore: { $avg: '$analytics.qualityScore' }
      }
    }
  ]);
};

// Pre-save Middleware
reviewSchema.pre('save', function(next) {
  // Update version on modification
  if (this.isModified() && !this.isNew) {
    this.version += 1;
  }
  
  // Calculate quality score
  if (this.isModified(['title', 'comment', 'pros', 'cons', 'subRatings', 'attachments'])) {
    this.calculateQualityScore();
  }
  
  // Update engagement score
  if (this.isModified(['helpfulVotes', 'viewsCount', 'sharesCount', 'responses'])) {
    this.updateEngagementScore();
  }
  
  next();
});

// Post-save Middleware
reviewSchema.post('save', async function(doc) {
  // Update target (artwork/artist) rating
  try {
    const targetModel = doc.artwork ? 'Artwork' : 'User';
    const targetId = doc.artwork || doc.artist;
    const targetType = doc.artwork ? 'artwork' : 'artist';
    
    if (targetId) {
      const stats = await doc.constructor.getAverageRating(targetId, targetType);
      
      const updateData = {
        rating: stats.avgRating || 0,
        reviewsCount: stats.count || 0
      };
      
      await mongoose.model(targetModel).findByIdAndUpdate(targetId, updateData);
    }
  } catch (error) {
    console.error('Error updating target rating:', error);
  }
});

const reviewModel = mongoose.models.Review || model('Review', reviewSchema);
export default reviewModel;
