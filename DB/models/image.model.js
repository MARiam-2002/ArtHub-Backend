
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
 *           type: string
 *           description: Title of the image
 *         description:
 *           type: string
 *           description: Description of the image
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
    type: String,
    default: 'بدون عنوان',
    index: true
  },
  description: { 
    type: String,
    default: '' 
  },
  tags: [{ 
    type: String,
    index: true 
  }],
  category: { 
    type: String,
    index: true 
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
  isPublic: {
    type: Boolean,
    default: true,
    index: true
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
}, { timestamps: true });

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

// Method to increment view count
imageSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Ensure virtuals are included when converting to JSON
imageSchema.set('toJSON', { virtuals: true });
imageSchema.set('toObject', { virtuals: true });

const imageModel = mongoose.models.Image || model("Image", imageSchema);
export default imageModel;
