
import cloudinary from '../../../utils/cloudinary.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import fs from 'fs';
import imageModel from '../../../../DB/models/image.model.js';
import userModel from '../../../../DB/models/user.model.js';

/**
 * Upload one or multiple images to Cloudinary
 * Supports both traditional auth and Firebase auth
 */
export const uploadImages = asyncHandler(async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'لم يتم توفير ملفات الصور' 
      });
    }

    const userId = req.user._id || req.user.uid;
    const uploadPromises = req.files.map(file => {
      return new Promise((resolve, reject) => {
        // Set up transformation options
        const uploadOptions = {
          folder: 'artworks',
          resource_type: 'image',
          quality: 'auto',
          fetch_format: 'auto',
          transformation: [
            { width: 800, crop: 'limit' }, // Standard size for artworks
            { quality: 'auto:good' } // Optimize quality
          ]
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
              title: title || 'بدون عنوان',
              description: description || '',
              tags: tags ? (Array.isArray(tags) ? tags : tags.split(',')) : [],
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
    return res.status(201).json({ 
      success: true, 
      message: 'تم رفع الصور بنجاح',
      data: uploaded 
    });
  } catch (err) {
    // Clean up any temporary files if error occurs
    if (req.files && req.files.length) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء رفع الصور',
      error: err.message
    });
  }
});

/**
 * Get all images uploaded by the authenticated user with pagination and filtering
 */
export const getUserImages = asyncHandler(async (req, res) => {
  const userId = req.user._id || req.user.uid;
  const { page = 1, limit = 20, category, sortBy = 'createdAt', sortOrder = -1 } = req.query;
  
  const filter = { user: userId };
  if (category) filter.category = category;
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const sortOptions = {};
  sortOptions[sortBy] = parseInt(sortOrder);
  
  const [images, totalCount] = await Promise.all([
    imageModel.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit)),
    imageModel.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(totalCount / parseInt(limit));
  
  return res.status(200).json({
    success: true,
    message: 'تم استرجاع الصور بنجاح',
    data: {
      images,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});

/**
 * Get image details by ID with optimized response for mobile
 */
export const getImageById = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  
  const image = await imageModel.findById(imageId)
    .populate({
      path: 'user',
      select: 'displayName profileImage job'
    });
  
  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'الصورة غير موجودة'
    });
  }
  
  // Increment view count
  image.viewCount += 1;
  await image.save();
  
  // Get related images by same user or category
  const relatedImages = await imageModel.find({
    $or: [
      { user: image.user._id, _id: { $ne: image._id } },
      { category: image.category, _id: { $ne: image._id } }
    ]
  })
  .limit(6)
  .select('url title');
  
  return res.status(200).json({
    success: true,
    message: 'تم استرجاع بيانات الصورة بنجاح',
    data: {
      ...image.toObject(),
      relatedImages
    }
  });
});

/**
 * Update image metadata with validation
 */
export const updateImageMetadata = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const { title, description, tags, category, isPublic } = req.body;
  const userId = req.user._id || req.user.uid;
  
  const image = await imageModel.findOne({ 
    _id: imageId, 
    user: userId
  });
  
  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'الصورة غير موجودة أو ليس لديك صلاحية لتعديلها'
    });
  }
  
  // Update fields if provided
  if (title !== undefined) image.title = title;
  if (description !== undefined) image.description = description;
  if (tags !== undefined) {
    image.tags = Array.isArray(tags) ? tags : tags.split(',').map(tag => tag.trim());
  }
  if (category !== undefined) image.category = category;
  if (isPublic !== undefined) image.isPublic = isPublic;
  
  await image.save();
  
  return res.status(200).json({
    success: true,
    message: 'تم تحديث بيانات الصورة بنجاح',
    data: image
  });
});

/**
 * Delete image with proper cleanup
 */
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const userId = req.user._id || req.user.uid;
  
  if (!publicId) {
    return res.status(400).json({
      success: false,
      message: 'لم يتم توفير معرف الصورة'
    });
  }
  
  // Check if the image belongs to the user
  const image = await imageModel.findOne({ 
    publicId, 
    user: userId
  });
  
  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'الصورة غير موجودة أو ليس لديك صلاحية لحذفها'
    });
  }
  
  // Delete from Cloudinary
  await cloudinary.uploader.destroy(publicId);
  
  // Delete from MongoDB
  await imageModel.deleteOne({ publicId });
  
  return res.status(200).json({
    success: true,
    message: 'تم حذف الصورة بنجاح'
  });
});

/**
 * Get popular categories with image counts and sample images
 */
export const getImageCategories = asyncHandler(async (req, res) => {
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
  
  return res.status(200).json({
    success: true,
    message: 'تم استرجاع التصنيفات بنجاح',
    data: categories
  });
});

/**
 * Feature to set an image as featured
 */
export const setImageAsFeatured = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const userId = req.user._id || req.user.uid;
  
  // Check if the image belongs to the user
  const image = await imageModel.findOne({
    _id: imageId,
    user: userId
  });
  
  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'الصورة غير موجودة أو ليس لديك صلاحية لتعديلها'
    });
  }
  
  // Toggle featured status
  image.isFeatured = !image.isFeatured;
  await image.save();
  
  return res.status(200).json({
    success: true,
    message: image.isFeatured ? 'تم تعيين الصورة كمميزة' : 'تم إلغاء تعيين الصورة كمميزة',
    data: { isFeatured: image.isFeatured }
  });
});

/**
 * Search images with multiple filters
 */
export const searchImages = asyncHandler(async (req, res) => {
  const { query, category, tags, page = 1, limit = 20 } = req.query;
  
  const filter = {};
  
  // Build search filters
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ];
  }
  
  if (category) {
    filter.category = category;
  }
  
  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray };
  }
  
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [images, totalCount] = await Promise.all([
    imageModel.find(filter)
      .populate({
        path: 'user',
        select: 'displayName profileImage job'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    imageModel.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(totalCount / parseInt(limit));
  
  return res.status(200).json({
    success: true,
    message: 'تم استرجاع نتائج البحث بنجاح',
    data: {
      images,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalCount,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }
  });
});
