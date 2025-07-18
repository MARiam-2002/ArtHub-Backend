import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();

/**
 * @module cloudinary
 * @description وحدة مركزية لإدارة خدمة Cloudinary لرفع وتحميل الصور والملفات
 * تدعم التخزين المؤقت وتحسين الأداء وضغط الصور
 */

// تكوين Cloudinary باستخدام متغيرات البيئة
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
  secure: true
});

// التحقق من إعدادات Cloudinary
console.log('🔧 Cloudinary config check:', {
  cloud_name: process.env.CLOUD_NAME ? 'Set' : 'Missing',
  api_key: process.env.API_KEY ? 'Set' : 'Missing',
  api_secret: process.env.API_SECRET ? 'Set' : 'Missing'
});

// التحقق من القيم الفعلية (بدون كشف السر)
console.log('🔧 Cloudinary config values:', {
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY ? `${process.env.API_KEY.substring(0, 4)}...` : 'Missing',
  api_secret: process.env.API_SECRET ? `${process.env.API_SECRET.substring(0, 4)}...` : 'Missing'
});

/**
 * إنشاء URL للصورة مع إعدادات CDN للتخزين المؤقت وتحسينات الأداء
 * @param {string} publicId - معرف الصورة في Cloudinary
 * @param {Object} options - خيارات التحويل
 * @returns {string} URL مُحسّن للصورة
 */
export const getOptimizedImageUrl = (publicId, options = {}) => {
  const defaultOptions = {
    format: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
    dpr: 'auto',
    responsive: true,
    width: 'auto',
    crop: 'scale',
    flags: 'progressive',
    loading: 'lazy'
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // إضافة هيدرز كاش-كنترول
  const cacheControl = options.cacheControl || 'max-age=31536000'; // سنة واحدة افتراضياً

  return cloudinary.url(publicId, {
    ...mergedOptions,
    sign_url: true,
    secure: true,
    type: 'fetch',
    delivery_type: 'fetch',
    headers: [
      `Cache-Control: ${cacheControl}`,
      'Accept-Encoding: gzip, deflate, br',
      'CDN-Cache: true'
    ]
  });
};

/**
 * رفع صورة مع تطبيق إعدادات التحسين الافتراضية
 * @param {string|Buffer} imageData - مسار الصورة المحلي أو buffer
 * @param {Object} options - خيارات الرفع والتحسين
 * @returns {Promise<Object>} نتيجة رفع الصورة
 */
export const uploadOptimizedImage = async (imageData, options = {}) => {
  const defaultOptions = {
    folder: 'arthub/images',
    format: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
    resource_type: 'auto',
    flags: 'progressive',
    eager: [
      // Generate responsive variants during upload
      { width: 200, height: 200, crop: 'thumb', gravity: 'auto' },
      { width: 400, crop: 'scale' },
      { width: 800, crop: 'scale' },
      { width: 1200, crop: 'scale' }
    ],
    eager_async: true,
    eager_notification_url: process.env.CLOUDINARY_NOTIFICATION_URL
  };

  const mergedOptions = { ...defaultOptions, ...options };

  // إذا كان imageData buffer، استخدم stream
  if (Buffer.isBuffer(imageData)) {
    console.log('🔄 Using buffer upload with size:', imageData.length);
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(mergedOptions, (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload success:', result);
          resolve(result);
        }
      });
      
      // إرسال البيانات
      uploadStream.end(imageData);
    }).catch(async (error) => {
      console.log('🔄 Stream upload failed, trying direct upload...');
      try {
        // Fallback: تحويل buffer إلى base64
        const base64Data = imageData.toString('base64');
        const dataURI = `data:image/jpeg;base64,${base64Data}`;
        return await cloudinary.uploader.upload(dataURI, mergedOptions);
      } catch (fallbackError) {
        console.error('❌ Direct upload also failed:', fallbackError);
        throw fallbackError;
      }
    });
  }

  // إذا كان string، استخدم upload العادي
  return await cloudinary.uploader.upload(imageData, mergedOptions);
};

/**
 * الحصول على إعدادات التحسين المناسبة بناءً على المستوى المطلوب
 * @param {string} level - مستوى التحسين (low, medium, high)
 * @returns {Object} إعدادات التحسين
 */
export const getOptimizationSettings = (level = 'medium') => {
  switch (level) {
    case 'low':
      return {
        quality: 80,
        fetch_format: 'auto',
        flags: 'lossy',
        loading: 'lazy'
      };
    case 'high':
      return {
        quality: 'auto:best',
        fetch_format: 'auto',
        flags: 'progressive',
        dpr: 'auto',
        responsive: true,
        loading: 'eager',
        effect: 'improve'
      };
    case 'medium':
    default:
      return {
        quality: 'auto:good',
        fetch_format: 'auto',
        flags: 'progressive',
        loading: 'lazy'
      };
  }
};

/**
 * إنشاء نسخ متعددة من الصورة بأحجام مختلفة
 * @param {string} publicId - معرف الصورة في Cloudinary
 * @param {Object} options - خيارات إضافية
 * @returns {Object} URLs للنسخ المختلفة من الصورة
 */
export const generateImageVariants = (publicId, options = {}) => {
  const optimizationLevel = options.optimizationLevel || 'medium';
  const optimizationSettings = getOptimizationSettings(optimizationLevel);

  return {
    original: cloudinary.url(publicId, {
      secure: true,
      ...optimizationSettings
    }),
    thumbnail: cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width: 200, height: 200, crop: 'thumb', gravity: 'auto' }],
      ...optimizationSettings
    }),
    small: cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width: 400, crop: 'scale' }],
      ...optimizationSettings
    }),
    medium: cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width: 800, crop: 'scale' }],
      ...optimizationSettings
    }),
    large: cloudinary.url(publicId, {
      secure: true,
      transformation: [{ width: 1200, crop: 'scale' }],
      ...optimizationSettings
    })
  };
};

/**
 * إضافة علامة مائية للصورة
 * @param {string} publicId - معرف الصورة في Cloudinary
 * @param {Object} options - خيارات العلامة المائية
 * @returns {string} URL للصورة مع العلامة المائية
 */
export const addWatermark = (publicId, options = {}) => {
  const watermarkText = options.text || 'ArtHub';
  const opacity = options.opacity || 50;
  const fontSize = options.fontSize || 20;
  const position = options.position || 'southeast';

  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        overlay: {
          font_family: 'Arial',
          font_size: fontSize,
          text: watermarkText
        },
        color: '#FFFFFF',
        opacity: opacity,
        gravity: position,
        x: 10,
        y: 10
      }
    ]
  });
};

/**
 * تحسين الصورة بعد الرفع
 * @param {string} publicId - معرف الصورة في Cloudinary
 * @param {Object} options - خيارات التحسين
 * @returns {Promise<Object>} نتيجة التحسين
 */
export const optimizeExistingImage = async (publicId, options = {}) => {
  const optimizationLevel = options.optimizationLevel || 'medium';
  const optimizationSettings = getOptimizationSettings(optimizationLevel);

  try {
    // جلب المعلومات الحالية للصورة
    const imageInfo = await cloudinary.api.resource(publicId);

    // إنشاء نسخة محسنة
    const result = await cloudinary.uploader.explicit(publicId, {
      type: 'upload',
      eager: [
        {
          ...optimizationSettings,
          format: options.format || imageInfo.format
        }
      ],
      eager_async: true,
      eager_notification_url: options.notificationUrl || null
    });

    return {
      success: true,
      original: imageInfo,
      optimized: result,
      variants: generateImageVariants(publicId, { optimizationLevel })
    };
  } catch (error) {
    console.error('Error optimizing image:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * كاش الصور الأكثر استخداماً لتحسين الأداء
 * @param {Array<string>} publicIds - قائمة معرفات الصور
 * @returns {Promise<void>}
 */
export const cachePopularImages = async publicIds => {
  try {
    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return;
    }

    // تحميل النسخ المختلفة مسبقاً في كاش CDN
    const transformations = [
      { width: 200, height: 200, crop: 'thumb', gravity: 'auto' },
      { width: 400, crop: 'scale' },
      { width: 800, crop: 'scale' },
      { width: 1200, crop: 'scale' }
    ];

    const cachePromises = [];

    for (const publicId of publicIds) {
      for (const transformation of transformations) {
        const url = cloudinary.url(publicId, {
          secure: true,
          transformation: [transformation],
          ...getOptimizationSettings('medium')
        });

        // إرسال طلب لتحميل الصورة في كاش CDN
        cachePromises.push(
          fetch(url, { method: 'GET', cache: 'force-cache' }).catch(err =>
            console.error(`Failed to cache image ${publicId}:`, err)
          )
        );
      }
    }

    await Promise.allSettled(cachePromises);
    console.log(`Successfully cached ${publicIds.length} images with variants`);
  } catch (error) {
    console.error('Error caching popular images:', error);
  }
};

export default cloudinary;
