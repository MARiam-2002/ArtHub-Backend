import cloudinary, {
  uploadOptimizedImage,
  getOptimizedImageUrl,
  optimizeExistingImage,
  generateImageVariants,
  getOptimizationSettings
} from '../../../utils/cloudinary.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import { createErrorResponse } from '../../../utils/errorHandler.js';
import {
  sendPushNotificationToUser,
  createMultilingualNotification
} from '../../../utils/pushNotifications.js';
import fs from 'fs';
import imageModel from '../../../../DB/models/image.model.js';
import mongoose from 'mongoose';
import { processAndUploadImage, isSafeImage } from '../../../utils/imageProcessing.js';
import { nanoid } from 'nanoid';
import categoryModel from '../../../../DB/models/category.model.js';
import userModel from '../../../../DB/models/user.model.js';

/**
 * @swagger
 * /api/image/upload:
 *   post:
 *     tags:
 *       - Images
 *     summary: رفع صور مع تحسين الأداء
 *     description: رفع صورة واحدة أو أكثر مع إمكانية تطبيق العلامة المائية وتحسين أداء الصور
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: الصور المراد رفعها (الحد الأقصى 10)
 *               title:
 *                 type: string
 *                 description: عنوان الصورة (اختياري)
 *               description:
 *                 type: string
 *                 description: وصف الصورة (اختياري)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: الوسوم (اختياري)
 *               category:
 *                 type: string
 *                 description: تصنيف الصورة (اختياري)
 *               applyWatermark:
 *                 type: boolean
 *                 description: تطبيق علامة مائية (اختياري)
 *               optimizationLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: مستوى تحسين الصورة (اختياري)
 *     responses:
 *       201:
 *         description: تم رفع الصور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: تم رفع الصور بنجاح
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *       400:
 *         description: خطأ في البيانات المرسلة
 *       401:
 *         description: غير مصرح
 *       500:
 *         description: خطأ في الخادم
 */
export const uploadImage = asyncHandler(async (req, res, next) => {
  const { title, description, tags = [], category, applyWatermark = false, optimizationLevel = 'medium', isPrivate = false } = req.body;
  
  if (!req.file) {
    return next(new Error('يرجى تحميل صورة', { cause: 400 }));
  }

  try {
    // التحقق من وجود الفئة إذا تم تحديدها
    if (category) {
      const categoryExists = await categoryModel.findById(category);
      if (!categoryExists) {
        return next(new Error('الفئة المحددة غير موجودة', { cause: 400 }));
      }
    }

    // معالجة ورفع الصورة
    const uploadOptions = {
      folder: `arthub/images/${req.user._id}`,
      public_id: `${nanoid()}_${Date.now()}`,
      quality: optimizationLevel === 'high' ? 'auto:best' : optimizationLevel === 'low' ? 80 : 'auto:good',
      fetch_format: 'auto'
    };

    // تطبيق العلامة المائية إذا طُلب
    if (applyWatermark) {
      uploadOptions.transformation = [{
        overlay: {
          font_family: 'Arial',
          font_size: 20,
          text: `ArtHub © ${new Date().getFullYear()}`
        },
        color: '#FFFFFF',
        opacity: 60,
        gravity: 'south_east',
        x: 15,
        y: 15
      }];
    }

    const result = await processAndUploadImage(req.file.path, uploadOptions);

    // فحص أمان الصورة
    const isSafe = await isSafeImage(result.public_id);
    if (!isSafe) {
      await cloudinary.uploader.destroy(result.public_id);
      return next(new Error('الصورة غير مناسبة، يرجى تحميل صورة أخرى', { cause: 400 }));
    }

    // إنشاء سجل الصورة في قاعدة البيانات
    const imageData = {
      user: req.user._id,
      title: title || 'صورة بدون عنوان',
      description: description || '',
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      category: category || null,
      url: result.secure_url,
      publicId: result.public_id,
      size: result.bytes,
      format: result.format,
      width: result.width,
      height: result.height,
      hasWatermark: applyWatermark,
      optimizationLevel,
      isPrivate,
      views: 0,
      downloads: 0
    };

    const image = await imageModel.create(imageData);
    
    // تحديث إحصائيات المستخدم
    await userModel.findByIdAndUpdate(req.user._id, {
      $inc: { imagesCount: 1 }
    });

    // حذف الملف المؤقت
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      success: true,
      message: 'تم رفع الصورة بنجاح',
      data: image
    });

  } catch (error) {
    // حذف الملف المؤقت في حالة الخطأ
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(new Error('فشل في رفع الصورة', { cause: 500 }));
  }
});

/**
 * Upload multiple images with basic processing
 * This is required by the router but was missing from this file
 */
export const uploadImages = asyncHandler(async (req, res) => {
  try {
    const files = req.files || (req.file ? [req.file] : []);
    const userId = req.user._id;
    const { title, description, tags, category, applyWatermark } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم توفير أي صور للرفع',
        error: 'No images provided'
      });
    }

    const uploadedImages = [];

    // معالجة كل صورة
    for (const file of files) {
      const uploadOptions = {
        folder: 'arthub/images'
      };

      // تطبيق العلامة المائية إذا طلب المستخدم ذلك
      if (applyWatermark === 'true' || applyWatermark === true) {
        uploadOptions.transformation = [
          ...(uploadOptions.transformation || []),
          {
            overlay: {
              font_family: 'Arial',
              font_size: 20,
              text: `ArtHub - ${new Date().toISOString().split('T')[0]}`
            },
            color: '#FFFFFF',
            opacity: 50,
            gravity: 'south_east',
            x: 10,
            y: 10
          }
        ];
      }

      // رفع الصورة إلى كلاودينري
      const uploadResult = await cloudinary.uploader.upload(file.path, uploadOptions);

      // حفظ بيانات الصورة في قاعدة البيانات
      const imageData = {
        user: userId,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        title: title || 'صورة بدون عنوان',
        description: description || '',
        tags: tags ? (Array.isArray(tags) ? tags : [tags]) : [],
        category: category || null,
        size: uploadResult.bytes,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        hasWatermark: applyWatermark === 'true' || applyWatermark === true
      };

      const image = await imageModel.create(imageData);
      uploadedImages.push(image);

      // حذف الملف المؤقت
      fs.unlinkSync(file.path);
    }

    res.status(201).json({
      success: true,
      message: 'تم رفع الصور بنجاح',
      data: uploadedImages
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    // حذف الملفات المؤقتة في حالة حدوث خطأ
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    res.status(500).json({
      success: false,
      message: 'فشل في رفع الصور',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/image/upload/multiple:
 *   post:
 *     tags:
 *       - Images
 *     summary: رفع مجموعة صور
 *     description: رفع مجموعة من الصور دفعة واحدة مع تحسين الأداء
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: الصور المراد رفعها (الحد الأقصى 10)
 *               albumTitle:
 *                 type: string
 *                 description: عنوان الألبوم
 *               applyWatermark:
 *                 type: boolean
 *                 description: تطبيق علامة مائية
 *               optimizationLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: مستوى تحسين الصور
 *     responses:
 *       201:
 *         description: تم رفع الصور بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: تم رفع 5 صور بنجاح
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *       400:
 *         description: خطأ في البيانات المرسلة
 *       401:
 *         description: غير مصرح
 *       500:
 *         description: خطأ في الخادم
 */
export const uploadMultipleImages = asyncHandler(async (req, res, next) => {
  const { albumTitle, applyWatermark = false, optimizationLevel = 'medium', isPrivate = false } = req.body;
  
  if (!req.files || req.files.length === 0) {
          return next(new Error('يرجى تحميل صورة واحدة على الأقل', { cause: 400 }));
  }

  if (req.files.length > 10) {
          return next(new Error('لا يمكن رفع أكثر من 10 صور في المرة الواحدة', { cause: 400 }));
  }

  try {
    const uploadPromises = req.files.map(async (file, index) => {
      const uploadOptions = {
        folder: `arthub/albums/${req.user._id}`,
        public_id: `${nanoid()}_${Date.now()}_${index}`,
        quality: optimizationLevel === 'high' ? 'auto:best' : optimizationLevel === 'low' ? 80 : 'auto:good',
        fetch_format: 'auto'
      };

      if (applyWatermark) {
        uploadOptions.transformation = [{
          overlay: {
            font_family: 'Arial',
            font_size: 20,
            text: `ArtHub © ${new Date().getFullYear()}`
          },
          color: '#FFFFFF',
          opacity: 60,
          gravity: 'south_east',
          x: 15,
          y: 15
        }];
      }

      const result = await processAndUploadImage(file.path, uploadOptions);
      
      // فحص أمان الصورة
      const isSafe = await isSafeImage(result.public_id);
      if (!isSafe) {
        await cloudinary.uploader.destroy(result.public_id);
        throw new Error(`الصورة ${index + 1} غير مناسبة`);
      }

      // حذف الملف المؤقت
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return {
        user: req.user._id,
        title: `${albumTitle || 'ألبوم'} - صورة ${index + 1}`,
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        hasWatermark: applyWatermark,
        optimizationLevel,
        isPrivate,
        album: albumTitle,
        views: 0,
        downloads: 0
      };
    });

    const uploadResults = await Promise.all(uploadPromises);
    const savedImages = await imageModel.insertMany(uploadResults);

    // تحديث إحصائيات المستخدم
    await userModel.findByIdAndUpdate(req.user._id, {
      $inc: { imagesCount: savedImages.length }
    });

    res.status(201).json({
      success: true,
      message: `تم رفع ${savedImages.length} صور بنجاح`,
      data: savedImages
    });

  } catch (error) {
    // حذف الملفات المؤقتة في حالة الخطأ
    if (req.files) {
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }
    next(new Error(error.message || 'فشل في رفع الصور', { cause: 500 }));
  }
});

// Add the missing controller functions

// Get user images
export const getUserImages = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, category } = req.query;

  const query = { user: userId };
  if (category) {
    query.category = category;
  }

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }
  };

  const images = await imageModel
    .find(query)
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
export const getImageById = asyncHandler(async (req, res, next) => {
  const { imageId } = req.params;

  try {
    const image = await imageModel
      .findById(imageId)
      .populate('user', 'name avatar bio')
      .populate('category', 'name description')
      .lean();

    if (!image) {
      return next(new Error('الصورة غير موجودة', { cause: 404 }));
    }

    // التحقق من الخصوصية
    if (image.isPrivate && (!req.user || image.user._id.toString() !== req.user._id.toString())) {
      return next(new Error('غير مصرح لك بعرض هذه الصورة', { cause: 403 }));
    }

    // زيادة عدد المشاهدات (إذا لم يكن المالك)
    if (!req.user || image.user._id.toString() !== req.user._id.toString()) {
      await imageModel.findByIdAndUpdate(imageId, { $inc: { views: 1 } });
      image.views += 1;
    }

    // الحصول على صور مشابهة
    const similarImages = await imageModel
      .find({
        _id: { $ne: imageId },
        $or: [
          { category: image.category?._id },
          { tags: { $in: image.tags } },
          { user: image.user._id }
        ],
        isPrivate: false
      })
      .select('title url user category')
      .populate('user', 'name')
      .populate('category', 'name')
      .limit(6)
      .lean();

    res.status(200).json({
      success: true,
      message: 'تم جلب الصورة بنجاح',
      data: {
        ...image,
        similarImages
      }
    });

  } catch (error) {
    next(new Error('فشل في جلب الصورة', { cause: 500 }));
  }
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
  if (title) {
    image.title = title;
  }
  if (description !== undefined) {
    image.description = description;
  }
  if (tags) {
    image.tags = tags;
  }
  if (category) {
    image.category = category;
  }

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
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
    { $project: { name: '$_id', count: 1, _id: 0 } }
  ]);

  res.success(categories, 'تم استرجاع التصنيفات بنجاح');
});

export const getUserAlbums = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;

    // جلب جميع الألبومات المميزة للمستخدم
    const albums = await imageModel.aggregate([
      { $match: { user: mongoose.Types.ObjectId(userId), album: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$album',
          count: { $sum: 1 },
          coverImage: { $first: '$url' },
          updatedAt: { $max: '$updatedAt' }
        }
      },
      { $sort: { updatedAt: -1 } },
      {
        $project: {
          _id: 0,
          name: '$_id',
          count: 1,
          coverImage: 1,
          updatedAt: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      message: 'تم جلب الألبومات بنجاح',
      data: albums
    });
  } catch (error) {
    console.error('Error getting user albums:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب الألبومات',
      error: error.message
    });
  }
});

export const getAlbumImages = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { albumName } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * parseInt(limit);

    // التحقق من وجود الألبوم
    const albumExists = await imageModel.findOne({
      user: userId,
      album: albumName
    });

    if (!albumExists) {
      return res.status(404).json({
        success: false,
        message: 'الألبوم غير موجود',
        error: 'Album not found'
      });
    }

    // جلب الصور مع التصفح
    const [images, totalCount] = await Promise.all([
      imageModel
        .find({ user: userId, album: albumName })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      imageModel.countDocuments({ user: userId, album: albumName })
    ]);

    // إعداد معلومات التصفح
    const totalPages = Math.ceil(totalCount / parseInt(limit));

    res.status(200).json({
      success: true,
      message: 'تم جلب صور الألبوم بنجاح',
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
  } catch (error) {
    console.error('Error getting album images:', error);
    res.status(500).json({
      success: false,
      message: 'فشل في جلب صور الألبوم',
      error: error.message
    });
  }
});

/**
 * تحسين صورة موجودة وإنشاء نسخ محسنة مختلفة الأحجام
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const optimizeImage = asyncHandler(async (req, res) => {
  const { imageId } = req.params;
  const { optimizationLevel = 'medium' } = req.body;
  const userId = req.user._id;

  // التحقق من صلاحية مستوى التحسين
  if (!['low', 'medium', 'high'].includes(optimizationLevel)) {
    return res.status(400).json({
      success: false,
      message: 'مستوى تحسين غير صالح',
      error: 'مستوى التحسين يجب أن يكون إما low أو medium أو high'
    });
  }

  // البحث عن الصورة
  const image = await imageModel.findById(imageId);

  if (!image) {
    return res.status(404).json({
      success: false,
      message: 'الصورة غير موجودة',
      error: 'لم يتم العثور على صورة بهذا المعرف'
    });
  }

  // التحقق من ملكية الصورة
  if (image.user.toString() !== userId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'غير مصرح بتحسين هذه الصورة',
      error: 'يمكنك فقط تحسين الصور الخاصة بك'
    });
  }

  // تحسين الصورة
  const optimizationResult = await optimizeExistingImage(image.publicId, { optimizationLevel });

  if (!optimizationResult.success) {
    return res.status(500).json({
      success: false,
      message: 'فشل في تحسين الصورة',
      error: optimizationResult.error
    });
  }

  // تحديث الصورة في قاعدة البيانات
  const variants = generateImageVariants(image.publicId, { optimizationLevel });

  const updatedImage = await imageModel.findByIdAndUpdate(
    imageId,
    {
      optimizationLevel,
      optimizedUrl: variants.original,
      variants: {
        thumbnail: variants.thumbnail,
        small: variants.small,
        medium: variants.medium,
        large: variants.large
      }
    },
    { new: true }
  );

  return res.status(200).json({
    success: true,
    message: 'تم تحسين الصورة بنجاح',
    data: {
      _id: updatedImage._id,
      optimizedUrl: updatedImage.optimizedUrl,
      variants: updatedImage.variants,
      optimizationLevel: updatedImage.optimizationLevel
    }
  });
});

/**
 * تحسين جميع صور المستخدم
 * @param {Object} req - كائن الطلب
 * @param {Object} res - كائن الاستجابة
 */
export const optimizeAllUserImages = asyncHandler(async (req, res) => {
  const { optimizationLevel = 'medium' } = req.body;
  const userId = req.user._id;

  // التحقق من صلاحية مستوى التحسين
  if (!['low', 'medium', 'high'].includes(optimizationLevel)) {
    return res.status(400).json({
      success: false,
      message: 'مستوى تحسين غير صالح',
      error: 'مستوى التحسين يجب أن يكون إما low أو medium أو high'
    });
  }

  // البحث عن صور المستخدم
  const images = await imageModel.find({ user: userId });

  if (images.length === 0) {
    return res.status(200).json({
      success: true,
      message: 'لا توجد صور للتحسين',
      data: {
        totalImages: 0
      }
    });
  }

  // إنشاء معرف المهمة
  const jobId = `optimize-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;

  // بدء عملية التحسين في الخلفية
  process.nextTick(async () => {
    try {
      let successCount = 0;
      let failureCount = 0;

      // تحسين كل صورة
      for (const image of images) {
        try {
          // إنشاء النسخ المحسنة
          const variants = generateImageVariants(image.publicId, { optimizationLevel });

          // تحديث الصورة في قاعدة البيانات
          await imageModel.findByIdAndUpdate(image._id, {
            optimizationLevel,
            optimizedUrl: variants.original,
            variants: {
              thumbnail: variants.thumbnail,
              small: variants.small,
              medium: variants.medium,
              large: variants.large
            }
          });

          successCount++;
        } catch (error) {
          console.error(`Error optimizing image ${image._id}:`, error);
          failureCount++;
        }
      }

      console.log(
        `Optimization job ${jobId} completed: ${successCount} succeeded, ${failureCount} failed`
      );

      // إرسال إشعار للمستخدم بإكمال المهمة
      if (req.user.fcmToken) {
        try {
          await sendPushNotificationToUser(
            userId,
            {
              title: {
                ar: 'اكتمال تحسين الصور',
                en: 'Image optimization completed'
              },
              body: {
                ar: `تم تحسين ${successCount} من الصور بنجاح${failureCount > 0 ? ` وفشل ${failureCount}` : ''}`,
                en: `Successfully optimized ${successCount} images${failureCount > 0 ? ` and ${failureCount} failed` : ''}`
              }
            },
            {
              type: 'system',
              screen: 'myImages'
            }
          );
        } catch (notificationError) {
          console.error('Error sending optimization completion notification:', notificationError);
        }
      }
    } catch (error) {
      console.error(`Error in optimization job ${jobId}:`, error);
    }
  });

  return res.status(200).json({
    success: true,
    message: 'تم بدء عملية تحسين الصور',
    data: {
      totalImages: images.length,
      jobId
    }
  });
});

/**
 * Get all images with pagination and filtering
 */
export const getAllImages = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, category, user, search, sortBy = 'createdAt', order = 'desc' } = req.query;
    
    // Build query
    let query = { isPrivate: false }; // Only show public images
    
    if (category) {
      query.category = category;
    }
    
    if (user) {
      query.user = user;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Build sort object
    const sort = {};
    sort[sortBy] = order === 'desc' ? -1 : 1;
    
    // Execute query
    const [images, totalCount] = await Promise.all([
      imageModel.find(query)
        .populate('user', 'displayName profileImage')
        .populate('category', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      imageModel.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.success({
      images,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }, 'تم جلب الصور بنجاح');
    
  } catch (error) {
    next(new Error('فشل في جلب الصور', { cause: 500 }));
  }
});

/**
 * Search images
 */
export const searchImages = asyncHandler(async (req, res, next) => {
  try {
    const { q, category, page = 1, limit = 10 } = req.query;
    
    if (!q || q.trim().length < 2) {
      return next(new Error('يجب أن يكون النص المراد البحث عنه أطول من حرفين', { cause: 400 }));
    }
    
    // Build search query
    let query = {
      isPrivate: false,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ]
    };
    
    if (category) {
      query.category = category;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute search
    const [images, totalCount] = await Promise.all([
      imageModel.find(query)
        .populate('user', 'displayName profileImage')
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      imageModel.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.success({
      images,
      searchQuery: q,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }, `تم العثور على ${totalCount} نتيجة للبحث`);
    
  } catch (error) {
    next(new Error('فشل في البحث عن الصور', { cause: 500 }));
  }
});

/**
 * Update image metadata
 */
export const updateImage = asyncHandler(async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const { title, description, tags, isPrivate, allowDownload } = req.body;
    const userId = req.user._id;
    
    // Find the image
    const image = await imageModel.findById(imageId);
    
    if (!image) {
      return next(new Error('الصورة غير موجودة', { cause: 404 }));
    }
    
    // Check ownership
    if (image.user.toString() !== userId.toString()) {
      return next(new Error('غير مصرح لك بتعديل هذه الصورة', { cause: 403 }));
    }
    
    // Build update object
    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (tags !== undefined) updateData.tags = tags;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;
    if (allowDownload !== undefined) updateData.allowDownload = allowDownload;
    
    // Update the image
    const updatedImage = await imageModel.findByIdAndUpdate(
      imageId,
      updateData,
      { new: true, runValidators: true }
    ).populate('user', 'displayName profileImage').populate('category', 'name');
    
    res.success(updatedImage, 'تم تحديث الصورة بنجاح');
    
  } catch (error) {
    next(new Error('فشل في تحديث الصورة', { cause: 500 }));
  }
});

/**
 * Get user's own images
 */
export const getMyImages = asyncHandler(async (req, res, next) => {
  try {
    const { page = 1, limit = 10, isPrivate } = req.query;
    const userId = req.user._id;
    
    // Build query
    let query = { user: userId };
    
    if (isPrivate !== undefined) {
      query.isPrivate = isPrivate === 'true';
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const [images, totalCount] = await Promise.all([
      imageModel.find(query)
        .populate('category', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      imageModel.countDocuments(query)
    ]);
    
    const totalPages = Math.ceil(totalCount / parseInt(limit));
    
    res.success({
      images,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalItems: totalCount,
        itemsPerPage: parseInt(limit),
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1
      }
    }, 'تم جلب صورك بنجاح');
    
  } catch (error) {
    next(new Error('فشل في جلب صورك', { cause: 500 }));
  }
});

/**
 * Download image
 */
export const downloadImage = asyncHandler(async (req, res, next) => {
  try {
    const { imageId } = req.params;
    const { quality = 'original' } = req.query;
    
    // Find the image
    const image = await imageModel.findById(imageId);
    
    if (!image) {
      return next(new Error('الصورة غير موجودة', { cause: 404 }));
    }
    
    // Check if download is allowed
    if (!image.allowDownload) {
      return next(new Error('تحميل هذه الصورة غير مسموح', { cause: 403 }));
    }
    
    // Check privacy
    if (image.isPrivate && (!req.user || image.user.toString() !== req.user._id.toString())) {
      return next(new Error('غير مصرح لك بتحميل هذه الصورة', { cause: 403 }));
    }
    
    // Increment download count
    await imageModel.findByIdAndUpdate(imageId, { $inc: { downloads: 1 } });
    
    // Get the appropriate URL based on quality
    let downloadUrl = image.url;
    
    if (quality !== 'original' && image.variants) {
      switch (quality) {
        case 'low':
          downloadUrl = image.variants.small || image.url;
          break;
        case 'medium':
          downloadUrl = image.variants.medium || image.url;
          break;
        case 'high':
          downloadUrl = image.variants.large || image.url;
          break;
        default:
          downloadUrl = image.url;
      }
    }
    
    // Redirect to the image URL for download
    res.redirect(downloadUrl);
    
  } catch (error) {
    next(new Error('فشل في تحميل الصورة', { cause: 500 }));
  }
});
