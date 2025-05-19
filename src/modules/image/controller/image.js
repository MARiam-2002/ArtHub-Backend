import cloudinary from '../../../utils/cloudinary.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import fs from 'fs';
import imageModel from '../../../../DB/models/image.model.js';

export const uploadImages = asyncHandler(async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    if (!files || files.length === 0) {
      return res.fail(null, 'لم يتم توفير ملفات الصور', 400);
    }
    
    const uploaded = await Promise.all(files.map(async file => {
      try {
        const result = await cloudinary.uploader.upload(file.path, { 
          folder: 'artworks',
          resource_type: 'image',
          quality: 'auto'
        });
        
        // حذف الملف المؤقت بعد الرفع إذا كان موجوداً
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        
        return result.secure_url;
      } catch (error) {
        console.error('خطأ أثناء رفع الصورة:', error);
        // حذف الملف في حالة الفشل إذا كان موجوداً
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
        throw error;
      }
    }));
    
    res.success(uploaded, 'تم رفع الصور بنجاح', 201);
  } catch (err) {
    console.error('خطأ عام في رفع الصور:', err);
    
    // تنظيف الملفات المؤقتة في حالة الخطأ
    if (req.files && req.files.length) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (e) {
            console.error('خطأ أثناء حذف الملف المؤقت:', e);
          }
        }
      });
    }
    
    res.fail(err, 'حدث خطأ أثناء رفع الصور', 500);
  }
}); 

// Add the missing controller functions

// Get user images
export const getUserImages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, category } = req.query;
  
  const query = { user: userId };
  if (category) query.category = category;
  
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };
  
  const images = await imageModel.find(query)
    .skip((options.page - 1) * options.limit)
    .limit(options.limit)
    .sort(options.sort);
  
  const total = await imageModel.countDocuments(query);
  
  res.status(200).json({
    success: true,
    data: images,
    pagination: {
      total,
      page: options.page,
      limit: options.limit,
      pages: Math.ceil(total / options.limit)
    }
  });
});

// Get image by ID
export const getImageById = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  
  const image = await imageModel.findById(imageId);
  if (!image) {
    return res.fail(null, 'الصورة غير موجودة', 404);
  }
  
  // Increment view count
  await image.incrementViewCount();
  
  res.success(image, 'تم استرجاع بيانات الصورة بنجاح');
});

// Update image metadata
export const updateImageMetadata = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const userId = req.user.id;
  const { title, description, tags, category } = req.body;
  
  const image = await imageModel.findById(imageId);
  if (!image) {
    return res.fail(null, 'الصورة غير موجودة', 404);
  }
  
  // Check ownership
  if (image.user.toString() !== userId) {
    return res.fail(null, 'غير مصرح لك بتعديل هذه الصورة', 403);
  }
  
  // Update only provided fields
  if (title) image.title = title;
  if (description !== undefined) image.description = description;
  if (tags) image.tags = tags;
  if (category) image.category = category;
  
  await image.save();
  
  res.success(image, 'تم تحديث بيانات الصورة بنجاح');
});

// Delete image
export const deleteImage = asyncHandler(async (req, res) => {
  const { publicId } = req.params;
  const userId = req.user.id;
  
  const image = await imageModel.findOne({ publicId });
  if (!image) {
    return res.fail(null, 'الصورة غير موجودة', 404);
  }
  
  // Check ownership
  if (image.user.toString() !== userId) {
    return res.fail(null, 'غير مصرح لك بحذف هذه الصورة', 403);
  }
  
  // Delete from Cloudinary
  await cloudinary.uploader.destroy(publicId);
  
  // Delete from database
  await imageModel.deleteOne({ _id: image._id });
  
  res.success(null, 'تم حذف الصورة بنجاح');
});

// Get image categories
export const getImageCategories = asyncHandler(async (req, res) => {
  // Aggregate to get categories and their counts
  const categories = await imageModel.aggregate([
    { $match: { isPublic: true } },
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { name: "$_id", count: 1, _id: 0 } }
  ]);
  
  res.success(categories, 'تم استرجاع التصنيفات بنجاح');
});
