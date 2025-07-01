# تحسين الصور والتخزين في نظام ArtHub

## نظرة عامة

يعتمد نظام ArtHub على خدمة Cloudinary لتخزين وتحسين الصور، مع إضافة طبقات إضافية من التحسين والتخزين المؤقت لتقديم تجربة مستخدم أفضل وأداء عالي.

## ميزات تحسين الصور

### مستويات التحسين

يوفر النظام ثلاثة مستويات من تحسين الصور:

1. **منخفض**: تحسين بسيط مع الحفاظ على جودة عالية (80%)
2. **متوسط** (الافتراضي): توازن بين الجودة وحجم الملف
3. **عالي**: ضغط وتحسين متقدم لتقليل حجم الملف بشكل كبير

```javascript
// الحصول على إعدادات التحسين (utils/cloudinary.js)
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
```

### النسخ المتعددة للصور

لكل صورة يتم رفعها، يقوم النظام بإنشاء نسخ متعددة بأحجام مختلفة:

1. **الصورة الأصلية**: الصورة كاملة الدقة
2. **صورة مصغرة**: نسخة 200×200 بكسل للعرض المصغر
3. **صورة صغيرة**: نسخة بعرض 400 بكسل
4. **صورة متوسطة**: نسخة بعرض 800 بكسل
5. **صورة كبيرة**: نسخة بعرض 1200 بكسل

```javascript
// إنشاء نسخ متعددة للصورة (utils/cloudinary.js)
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
```

### العلامات المائية

يمكن إضافة علامات مائية للصور لحماية حقوق الملكية:

```javascript
// إضافة علامة مائية (utils/cloudinary.js)
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
```

## تخزين الصور والتخزين المؤقت

### تحسين التخزين المؤقت مع CDN

تم تحسين روابط الصور بإضافة ترويسات كاش لتحسين الأداء:

```javascript
// إنشاء URL محسن للصورة (utils/cloudinary.js)
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
```

### التحميل المسبق للصور الشائعة

تم إضافة وظيفة لتحميل الصور الشائعة مسبقًا في كاش CDN:

```javascript
// كاش الصور الشائعة (utils/cloudinary.js)
export const cachePopularImages = async publicIds => {
  try {
    if (!Array.isArray(publicIds) || publicIds.length === 0) return;

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
```

## رفع الصور وتخزينها

### رفع الصور مع التحسين المتزامن

عند رفع صور جديدة، يتم تطبيق تحسينات متزامنة لإنشاء النسخ المختلفة:

```javascript
// رفع صورة محسنة (utils/cloudinary.js)
export const uploadOptimizedImage = async (imagePath, options = {}) => {
  const defaultOptions = {
    folder: 'arthub/images',
    format: 'auto',
    quality: 'auto',
    fetch_format: 'auto',
    resource_type: 'auto',
    flags: 'progressive',
    eager: [
      // إنشاء نسخ متجاوبة أثناء الرفع
      { width: 200, height: 200, crop: 'thumb', gravity: 'auto' },
      { width: 400, crop: 'scale' },
      { width: 800, crop: 'scale' },
      { width: 1200, crop: 'scale' }
    ],
    eager_async: true
  };

  const mergedOptions = { ...defaultOptions, ...options };

  return await cloudinary.uploader.upload(imagePath, mergedOptions);
};
```

### تخزين معلومات الصورة في قاعدة البيانات

تم تحديث نموذج الصورة لتخزين معلومات النسخ المختلفة:

```javascript
// نموذج الصورة (DB/models/image.model.js)
const imageSchema = new Schema({
  // حقول أخرى...
  optimizationLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  variants: {
    thumbnail: { type: String },
    small: { type: String },
    medium: { type: String },
    large: { type: String }
  }
});
```

## واجهات API للصور

### رفع صور جديدة

```javascript
// POST /api/image/upload
router.post('/upload', upload.array('images', 10), async (req, res) => {
  try {
    const { title, description, optimizationLevel = 'medium' } = req.body;
    const uploadedImages = [];

    for (const file of req.files) {
      // رفع الصورة مع التحسين
      const result = await uploadOptimizedImage(file.path, {
        optimizationLevel
      });

      // إنشاء نسخ متعددة
      const variants = generateImageVariants(result.public_id, {
        optimizationLevel
      });

      // حفظ معلومات الصورة في قاعدة البيانات
      const image = await imageModel.create({
        user: req.user._id,
        url: result.secure_url,
        publicId: result.public_id,
        title: {
          ar: title?.ar || 'صورة بدون عنوان',
          en: title?.en || 'Untitled Image'
        },
        description: {
          ar: description?.ar || '',
          en: description?.en || ''
        },
        size: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
        optimizationLevel,
        variants
      });

      uploadedImages.push(image);
    }

    res.success(uploadedImages, 'تم رفع الصور بنجاح', 201);
  } catch (error) {
    console.error('Error uploading images:', error);
    res.fail(null, 'حدث خطأ أثناء رفع الصور', 500);
  }
});
```

### تحسين صورة موجودة

```javascript
// POST /api/image/optimize/{imageId}
router.post('/optimize/:imageId', isAuthenticated, async (req, res) => {
  try {
    const { imageId } = req.params;
    const { optimizationLevel = 'medium' } = req.body;

    // التحقق من وجود الصورة وملكيتها
    const image = await imageModel.findOne({
      _id: imageId,
      user: req.user._id
    });

    if (!image) {
      return res.fail(null, 'الصورة غير موجودة أو ليست من ملكيتك', 404);
    }

    // تحسين الصورة الموجودة
    const optimizedResult = await optimizeExistingImage(image.publicId, {
      optimizationLevel
    });

    // إنشاء نسخ متعددة
    const variants = generateImageVariants(image.publicId, {
      optimizationLevel
    });

    // تحديث معلومات الصورة
    image.optimizationLevel = optimizationLevel;
    image.variants = variants;
    image.optimizedUrl = optimizedResult.secure_url;
    await image.save();

    res.success(image, 'تم تحسين الصورة بنجاح');
  } catch (error) {
    console.error('Error optimizing image:', error);
    res.fail(null, 'حدث خطأ أثناء تحسين الصورة', 500);
  }
});
```

## أفضل الممارسات لاستخدام الصور

### استخدام النسخة المناسبة للصورة

```javascript
// استخدام النسخة المناسبة للصورة حسب سياق العرض
function getImageUrlForContext(image, context) {
  switch (context) {
    case 'thumbnail':
      return image.variants.thumbnail || image.url;
    case 'preview':
      return image.variants.small || image.url;
    case 'detail':
      return image.variants.medium || image.url;
    case 'fullscreen':
      return image.variants.large || image.url;
    default:
      return image.url;
  }
}
```

### تحميل الصور المتجاوبة في التطبيق

```javascript
// تحميل الصورة المناسبة بناءً على حجم الشاشة
function getResponsiveImageUrl(image, screenWidth) {
  if (screenWidth <= 480) {
    return image.variants.small || image.url;
  } else if (screenWidth <= 768) {
    return image.variants.medium || image.url;
  } else {
    return image.variants.large || image.url;
  }
}
```

### الإعلام عن تحميل الصور

```javascript
// إعلام المستخدم عن اكتمال رفع الصور
async function notifyUserAboutUploadedImages(userId, imageIds) {
  try {
    const images = await imageModel.find({ _id: { $in: imageIds } });

    await sendPushNotificationToUser(
      userId,
      {
        title: {
          ar: 'اكتمل رفع الصور',
          en: 'Image upload completed'
        },
        body: {
          ar: `تم رفع ${images.length} صور بنجاح`,
          en: `Successfully uploaded ${images.length} images`
        }
      },
      {
        screen: 'ImageGallery',
        type: 'upload_complete',
        imageIds: imageIds
      }
    );
  } catch (error) {
    console.error('Error notifying about uploaded images:', error);
  }
}
```

## الخاتمة

من خلال تنفيذ هذه التحسينات لإدارة الصور، يقدم نظام ArtHub تجربة مستخدم متميزة مع تحسين الأداء والسرعة. استخدام النسخ المتعددة والتخزين المؤقت المحسن يقلل من استهلاك البيانات ويحسن سرعة التحميل على مختلف الأجهزة وأحجام الشاشات.
