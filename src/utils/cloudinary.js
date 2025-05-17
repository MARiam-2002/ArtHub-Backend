
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true // Always use HTTPS
});

// Helper for generating optimized image URLs
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaults = {
    quality: 'auto',
    fetch_format: 'auto',
  };

  const transformation = { ...defaults, ...options };
  return cloudinary.url(publicId, transformation);
};

// Helper for image transformations commonly used in the app
export const imageTransformations = {
  thumbnail: { width: 150, height: 150, crop: 'fill' },
  profile: { width: 300, height: 300, crop: 'fill', gravity: 'face' },
  artwork: { quality: 'auto', fetch_format: 'auto' },
  responsive: { width: 'auto', dpr: 'auto', responsive: true }
};

export default cloudinary;
