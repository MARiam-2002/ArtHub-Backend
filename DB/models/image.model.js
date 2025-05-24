import mongoose, { Schema, Types, model } from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       required:
 *         - user
 *         - url
 *         - publicId
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         user:
 *           type: string
 *           description: Reference to User who uploaded the image
 *         url:
 *           type: string
 *           format: uri
 *           description: Public URL of the image on Cloudinary
 *         publicId:
 *           type: string
 *           description: Cloudinary public ID for this image
 *         title:
 *           type: object
 *           properties:
 *             ar:
 *               type: string
 *               description: Title in Arabic
 *             en:
 *               type: string
 *               description: Title in English
 *           description: Multilingual title of the image
 *         description:
 *           type: object
 *           properties:
 *             ar:
 *               type: string
 *               description: Description in Arabic
 *             en:
 *               type: string
 *               description: Description in English
 *           description: Multilingual description of the image
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Tags associated with the image
 *         category:
 *           type: string
 *           description: Category of the image
 *         size:
 *           type: number
 *           description: File size in bytes
 *         format:
 *           type: string
 *           description: File format (jpg, png, etc.)
 *         width:
 *           type: number
 *           description: Image width in pixels
 *         height:
 *           type: number
 *           description: Image height in pixels
 *         isPublic:
 *           type: boolean
 *           description: Whether the image is publicly visible
 *         isFeatured:
 *           type: boolean
 *           description: Whether this is a featured image
 *         viewCount:
 *           type: number
 *           description: Number of views this image has received
 *         likeCount:
 *           type: number
 *           description: Number of likes this image has received
 *         price:
 *           type: number
 *           description: Price of the artwork (if for sale)
 *         forSale:
 *           type: boolean
 *           description: Whether this image is available for purchase
 *         optimizationLevel:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Level of image optimization applied
 *         variants:
 *           type: object
 *           properties:
 *             thumbnail:
 *               type: string
 *               description: URL to thumbnail version
 *             small:
 *               type: string
 *               description: URL to small version
 *             medium:
 *               type: string
 *               description: URL to medium version
 *             large:
 *               type: string
 *               description: URL to large version
 *           description: Different size variants of the image
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date the image was uploaded
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date the image was last updated
 */
const imageSchema = new Schema({
  user: { 
    type: Types.ObjectId, 
    ref: "User", 
    required: true,
    index: true
  },
  url: { 
    type: String, 
    required: true 
  },
  publicId: { 
    type: String, 
    required: true 
  },
  title: {
    ar: { type: String, default: 'صورة بدون عنوان' },
    en: { type: String, default: 'Untitled Image' }
  },
  description: {
    ar: { type: String, default: '' },
    en: { type: String, default: '' }
  },
  tags: [{ 
    type: String,
    trim: true
  }],
  category: { 
    type: Types.ObjectId, 
    ref: "Category" 
  },
  size: { 
    type: Number 
  },
  format: { 
    type: String 
  },
  width: { 
    type: Number 
  },
  height: { 
    type: Number 
  },
  hasWatermark: {
    type: Boolean,
    default: false
  },
  album: {
    type: String,
    trim: true,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  forSale: {
    type: Boolean,
    default: false,
    index: true
  },
  colors: [{ 
    type: String 
  }],
  optimizedUrl: {
    type: String
  },
  optimizationLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  variants: {
    thumbnail: { type: String },
    small: { type: String },
    medium: { type: String },
    large: { type: String }
  },
  metadata: {
    type: Object,
    default: {}
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for computed image URL with transformations
imageSchema.virtual('thumbnailUrl').get(function() {
  // Replace the original URL with a thumbnail version
  return this.url.replace('/upload/', '/upload/c_thumb,w_200,h_200/');
});

// Virtual for medium sized image
imageSchema.virtual('mediumUrl').get(function() {
  return this.url.replace('/upload/', '/upload/c_scale,w_600/');
});

// Add indexes for better query performance
imageSchema.index({ user: 1, createdAt: -1 });
imageSchema.index({ category: 1, createdAt: -1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ isFeatured: 1, createdAt: -1 });
imageSchema.index({ forSale: 1, price: 1 });
imageSchema.index({ viewCount: -1 });
imageSchema.index({ publicId: 1 });
imageSchema.index({ "title.ar": "text", "title.en": "text", "description.ar": "text", "description.en": "text", tags: "text" });

// Method to increment view count
imageSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Method to get localized content
imageSchema.methods.getLocalizedContent = function(language = 'ar') {
  const result = this.toObject();
  result.title = this.title[language] || this.title.ar;
  result.description = this.description[language] || this.description.ar;
  return result;
};

// Virtual for stats
imageSchema.virtual('stats').get(function() {
  return {
    views: 0,
    downloads: 0,
    likes: 0
  };
});

const imageModel = mongoose.models.Image || model("Image", imageSchema);
export default imageModel;
