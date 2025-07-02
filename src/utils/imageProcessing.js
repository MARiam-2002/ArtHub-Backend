import cloudinary from './cloudinary.js';
import { uploadOptimizedImage, getOptimizationSettings } from './cloudinary.js';
import fs from 'fs';

/**
 * Process and optimize an image before uploading to Cloudinary
 * @param {string} imagePath - Path to the image file
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const processAndUploadImage = async (imagePath, options = {}) => {
  try {
    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      throw new Error(`File not found: ${imagePath}`);
    }
    
    // Get optimization settings based on image type and options
    const optimizationSettings = getOptimizationSettings(imagePath, options);
    
    // Upload image with optimization
    const result = await uploadOptimizedImage(imagePath, {
      ...optimizationSettings,
      ...options
    });
    
    // Clean up temporary file if requested
    if (options.cleanup !== false) {
      try {
        fs.unlinkSync(imagePath);
      } catch (unlinkError) {
        console.warn(`Failed to delete temporary file ${imagePath}:`, unlinkError);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Image processing error:', error);
    throw error;
  }
};

/**
 * Moderate image content using Cloudinary's moderation capabilities
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<Object>} - Moderation result
 */
export const moderateImage = async (publicId) => {
  try {
    // Use Cloudinary's moderation capabilities
    const result = await cloudinary.uploader.explicit(publicId, {
      moderation: 'aws_rek'
    });
    
    return {
      isApproved: result.moderation?.[0]?.status === 'approved',
      moderationLabels: result.moderation?.[0]?.results || [],
      publicId
    };
  } catch (error) {
    console.error('Image moderation error:', error);
    return { 
      isApproved: false, 
      error: error.message,
      publicId
    };
  }
};

/**
 * Check if image contains inappropriate content
 * @param {string} publicId - Cloudinary public ID of the image
 * @returns {Promise<boolean>} - True if image is safe, false otherwise
 */
export const isSafeImage = async (publicId) => {
  const moderationResult = await moderateImage(publicId);
  
  if (!moderationResult.isApproved) {
    return false;
  }
  
  // Check for specific labels that indicate inappropriate content
  const unsafeLabels = ['Explicit Nudity', 'Violence', 'Visually Disturbing', 'Hate Symbols'];
  
  if (moderationResult.moderationLabels?.length > 0) {
    for (const label of moderationResult.moderationLabels) {
      if (unsafeLabels.includes(label.name) && label.confidence > 70) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Process image batch
 * @param {Array<string>} imagePaths - Array of image paths
 * @param {Object} options - Upload options
 * @returns {Promise<Array<Object>>} - Array of upload results
 */
export const processBatchImages = async (imagePaths, options = {}) => {
  const results = [];
  const batchSize = 5; // Process 5 images at a time
  
  // Process in batches
  for (let i = 0; i < imagePaths.length; i += batchSize) {
    const batch = imagePaths.slice(i, i + batchSize);
    const batchPromises = batch.map(path => processAndUploadImage(path, options));
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    // Add successful results
    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error(`Failed to process image ${batch[index]}:`, result.reason);
        results.push({ error: result.reason.message, path: batch[index] });
      }
    });
  }
  
  return results;
};

export default {
  processAndUploadImage,
  moderateImage,
  isSafeImage,
  processBatchImages
}; 