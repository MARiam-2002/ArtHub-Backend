import cloudinary, {
  uploadOptimizedImage,
  getOptimizedImageUrl,
  optimizeExistingImage,
  generateImageVariants,
  getOptimizationSettings
} from '../../../utils/cloudinary.js';
import { asyncHandler } from '../../../utils/asyncHandler.js';
import {
  sendPushNotificationToUser,
  createMultilingualNotification
} from '../../../utils/pushNotifications.js';
import fs from 'fs';
import imageModel from '../../../../DB/models/image.model.js';
import mongoose from 'mongoose';

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
export const uploadImage = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const {
      title,
      description,
      tags,
      category,
      applyWatermark,
      optimizationLevel = 'medium'
    } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم توفير أي صور للرفع',
        error: 'No images provided'
      });
    }

    const uploadedImages = [];

    // تحديد إعدادات التحسين بناء على المستوى المطلوب
    const getOptimizationSettings = level => {
      switch (level) {
        case 'low':
          return { quality: 80, fetch_format: 'auto' };
        case 'high':
          return {
            quality: 'auto:best',
            fetch_format: 'auto',
            flags: 'progressive',
            eager_async: true
          };
        case 'medium':
        default:
          return { quality: 'auto:good', fetch_format: 'auto', flags: 'progressive' };
      }
    };

    const optimizationSettings = getOptimizationSettings(optimizationLevel);

    // معالجة كل صورة
    for (const file of req.files) {
      const uploadOptions = {
        folder: 'arthub/images',
        ...optimizationSettings
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

      // استخدام وظيفة الرفع المحسنة
      const uploadResult = await uploadOptimizedImage(file.path, uploadOptions);

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
        hasWatermark: applyWatermark === 'true' || applyWatermark === true,
        // إضافة معلومات إضافية عن تحسين الصورة
        optimizationLevel,
        optimizedUrl: getOptimizedImageUrl(uploadResult.public_id, {
          width: 800, // عرض افتراضي للعرض المحسن
          ...optimizationSettings
        })
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
export const uploadMultipleImages = asyncHandler(async (req, res) => {
  try {
    const userId = req.user._id;
    const { applyWatermark, albumTitle, optimizationLevel = 'medium' } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم توفير أي صور للرفع',
        error: 'No images provided'
      });
    }

    // تحديد إعدادات التحسين بناء على المستوى المطلوب
    const getOptimizationSettings = level => {
      switch (level) {
        case 'low':
          return { quality: 80, fetch_format: 'auto' };
        case 'high':
          return {
            quality: 'auto:best',
            fetch_format: 'auto',
            flags: 'progressive',
            eager_async: true
          };
        case 'medium':
        default:
          return { quality: 'auto:good', fetch_format: 'auto', flags: 'progressive' };
      }
    };

    const optimizationSettings = getOptimizationSettings(optimizationLevel);

    const uploadPromises = req.files.map(async (file, index) => {
      const uploadOptions = {
        folder: 'arthub/images',
        ...optimizationSettings
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

      // استخدام وظيفة الرفع المحسنة
      const uploadResult = await uploadOptimizedImage(file.path, uploadOptions);

      // حذف الملف المؤقت بعد الرفع
      fs.unlinkSync(file.path);

      return {
        user: userId,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        title: `${albumTitle || 'ألبوم'} - صورة ${index + 1}`,
        size: uploadResult.bytes,
        format: uploadResult.format,
        width: uploadResult.width,
        height: uploadResult.height,
        hasWatermark: applyWatermark === 'true' || applyWatermark === true,
        album: albumTitle,
        optimizationLevel,
        optimizedUrl: getOptimizedImageUrl(uploadResult.public_id, {
          width: 800, // عرض افتراضي للعرض المحسن
          ...optimizationSettings
        })
      };
    });

    const uploadResults = await Promise.all(uploadPromises);
    const savedImages = await imageModel.insertMany(uploadResults);

    res.status(201).json({
      success: true,
      message: `تم رفع ${savedImages.length} صور بنجاح`,
      data: savedImages
    });
  } catch (error) {
    console.error('Error uploading multiple images:', error);
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
      message: 'فشل في رفع الصور المتعددة',
      error: error.message
    });
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
