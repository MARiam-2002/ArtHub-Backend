
import mongoose, { Schema, Types, model } from "mongoose";

const imageSchema = new Schema({
  user: { 
    type: Types.ObjectId, 
    ref: "User", 
    required: true 
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
    default: 'Untitled'
  },
  description: { 
    type: String,
    default: '' 
  },
  tags: [{ 
    type: String 
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
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Add indexes for better query performance
imageSchema.index({ user: 1, createdAt: -1 });
imageSchema.index({ category: 1, createdAt: -1 });
imageSchema.index({ tags: 1 });
imageSchema.index({ isFeatured: 1, createdAt: -1 });

const imageModel = mongoose.models.Image || model("Image", imageSchema);
export default imageModel;
