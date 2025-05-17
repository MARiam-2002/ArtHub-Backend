
import cloudinary from '../../../utils/cloudinary.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import fs from 'fs';
import path from 'path';
import imageModel from '../../../../DB/models/image.model.js';

/**
 * Upload one or multiple images to Cloudinary
 * Supports both traditional auth and Firebase auth
 */
export const uploadImages = asyncHandler(async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.fail('No image files provided.', 'لم يتم توفير ملفات الصور', 400);
    }

    const userId = req.user._id || req.user.uid;
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        // Set up transformation options if needed
        const uploadOptions = {
          folder: 'artworks',
          resource_type: 'image',
          // Add additional options based on Flutter needs
          quality: 'auto',
          fetch_format: 'auto'
        };

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions,
          async (error, result) => {
            if (error) return reject(error);
            
            // Parse additional metadata from request if provided
            const { title, description, tags, category } = req.body;
            
            // Store image metadata in MongoDB with additional fields
            const image = await imageModel.create({
              user: userId,
              url: result.secure_url,
              publicId: result.public_id,
              title: title || 'Untitled',
              description: description || '',
              tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
              category: category || '',
              size: result.bytes,
              format: result.format,
              width: result.width,
              height: result.height
            });
            
            resolve({
              _id: image._id,
              url: result.secure_url,
              publicId: result.public_id,
              title: image.title,
              description: image.description,
              tags: image.tags,
              category: image.category,
              size: image.size,
              format: image.format,
              width: image.width,
              height: image.height
            });
          }
        );
        
        // Create a read stream from the file and pipe it to the upload stream
        const readStream = fs.createReadStream(file.path);
        readStream.pipe(uploadStream);
        
        // Clean up temp file after upload
        readStream.on('end', () => {
          fs.unlinkSync(file.path);
        });
      });
    });

    const uploaded = await Promise.all(uploadPromises);
    return res.success(uploaded, 'تم رفع الصور بنجاح', 201);
  } catch (err) {
    // Clean up any temporary files if error occurs
    if (req.files && req.files.length) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(err);
  }
});

/**
 * Get all images uploaded by the authenticated user
 */
export const getUserImages = asyncHandler(async (req, res, next) => {
  const userId = req.user._id || req.user.uid;
  const { page = 1, limit = 20, category } = req.query;
  
  const filter = { user: userId };
  if (category) filter.category = category;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [images, totalCount] = await Promise.all([
    imageModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    imageModel.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(totalCount / parseInt(limit));
  
  return res.success({
    images,
    pagination: {
      currentPage: parseInt(page),
      totalPages,
      totalCount,
      hasNextPage: parseInt(page) < totalPages,
      hasPrevPage: parseInt(page) > 1
    }
  }, 'تم استرجاع الصور بنجاح');
});

/**
 * Get image details by ID
 */
export const getImageById = asyncHandler(async (req, res, next) => {
  const { imageId } = req.params;
  
  const image = await imageModel.findById(imageId);
  
  if (!image) {
    return res.fail('Image not found', 'الصورة غير موجودة', 404);
  }
  
  return res.success(image, 'تم استرجاع بيانات الصورة بنجاح');
});

/**
 * Delete an image by its publicId
 */
export const deleteImage = asyncHandler(async (req, res, next) => {
  const { publicId } = req.params;
  
  if (!publicId) {
    return res.fail('No publicId provided.', 'لم يتم توفير معرف الصورة', 400);
  }
  
  // Check if the image belongs to the user
  const image = await imageModel.findOne({ 
    publicId, 
    user: req.user._id || req.user.uid
  });
  
  if (!image) {
    return res.fail('Image not found or you do not have permission to delete it.', 
                    'الصورة غير موجودة أو ليس لديك صلاحية لحذفها', 404);
  }
  
  // Delete from Cloudinary
  await cloudinary.uploader.destroy(publicId);
  
  // Delete from MongoDB
  await imageModel.deleteOne({ publicId });
  
  return res.success(null, 'تم حذف الصورة بنجاح');
});

/**
 * Update image metadata
 */
export const updateImageMetadata = asyncHandler(async (req, res, next) => {
  const { imageId } = req.params;
  const { title, description, tags, category } = req.body;
  
  const image = await imageModel.findOne({ 
    _id: imageId, 
    user: req.user._id || req.user.uid
  });
  
  if (!image) {
    return res.fail('Image not found or you do not have permission to update it.', 
                    'الصورة غير موجودة أو ليس لديك صلاحية لتعديلها', 404);
  }
  
  // Update fields if provided
  if (title !== undefined) image.title = title;
  if (description !== undefined) image.description = description;
  if (tags !== undefined) image.tags = Array.isArray(tags) ? tags : [tags];
  if (category !== undefined) image.category = category;
  
  await image.save();
  
  return res.success(image, 'تم تحديث بيانات الصورة بنجاح');
});

/**
 * Get popular categories with image counts
 */
export const getImageCategories = asyncHandler(async (req, res, next) => {
  const categories = await imageModel.aggregate([
    { $match: { category: { $exists: true, $ne: "" } } },
    { $group: { 
      _id: "$category", 
      count: { $sum: 1 },
      sampleImage: { $first: "$url" }
    }},
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
  
  return res.success(categories, 'تم استرجاع التصنيفات بنجاح');
});
