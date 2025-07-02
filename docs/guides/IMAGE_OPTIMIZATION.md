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

# Image Optimization Guide for ArtHub

This guide explains how the ArtHub backend handles image optimization and provides best practices for Flutter integration.

## Overview

ArtHub uses Cloudinary for image storage and optimization, providing multiple variants of each image to optimize loading times and bandwidth usage on mobile devices.

## Image Processing Flow

1. **Upload**: Images are uploaded from the Flutter app to the backend
2. **Processing**: The backend processes and optimizes images using Cloudinary
3. **Storage**: Optimized images are stored with various sizes and formats
4. **Delivery**: Images are served to clients with appropriate transformations

## Backend Implementation

### Image Upload Endpoint

```javascript
// POST /api/image/upload
router.post(
  '/upload',
  isAuthenticated,
  fileUpload().single('image'),
  asyncHandler(async (req, res, next) => {
    // Process and optimize image
    const result = await uploadAndOptimizeImage(req.file, req.user._id);
    res.success(result, 'تم رفع الصورة بنجاح');
  })
);
```

### Image Optimization Function

```javascript
async function uploadAndOptimizeImage(file, userId) {
  // Upload to Cloudinary with optimization settings
  const result = await cloudinary.uploader.upload(file.path, {
    folder: `arthub/users/${userId}`,
    resource_type: 'image',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    eager: [
      // Create multiple variants
      { width: 200, height: 200, crop: 'fill', format: 'webp' }, // thumbnail
      { width: 600, crop: 'scale', format: 'webp' }, // medium
      { width: 1200, crop: 'scale', format: 'webp' } // large
    ],
    eager_async: true
  });

  // Save image metadata to database
  const image = await imageModel.create({
    user: userId,
    url: result.secure_url,
    publicId: result.public_id,
    size: result.bytes,
    format: result.format,
    width: result.width,
    height: result.height,
    variants: {
      thumbnail: result.eager[0].secure_url,
      medium: result.eager[1].secure_url,
      large: result.eager[2].secure_url
    }
  });

  return image;
}
```

## Image Response Format

When requesting images from the API, the response includes URLs for different variants:

```json
{
  "success": true,
  "message": "تم جلب الصورة بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109cb",
    "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/arthub/users/123/image.jpg",
    "publicId": "arthub/users/123/image",
    "width": 1800,
    "height": 1200,
    "variants": {
      "thumbnail": "https://res.cloudinary.com/demo/image/upload/c_fill,h_200,w_200,f_webp/v1612345678/arthub/users/123/image.jpg",
      "medium": "https://res.cloudinary.com/demo/image/upload/c_scale,w_600,f_webp/v1612345678/arthub/users/123/image.jpg",
      "large": "https://res.cloudinary.com/demo/image/upload/c_scale,w_1200,f_webp/v1612345678/arthub/users/123/image.jpg"
    }
  }
}
```

## Flutter Integration

### Best Practices for Image Loading

1. **Use appropriate image variants** based on the context:
   - Thumbnails for lists and grids
   - Medium for details pages
   - Large for full-screen views

2. **Implement progressive loading**:
   - Show thumbnails first
   - Load higher quality images when needed

3. **Cache images** to reduce bandwidth usage and improve loading times:
   - Use `cached_network_image` package
   - Implement proper cache management

### Example Flutter Code

#### Basic Image Loading

```dart
import 'package:cached_network_image/cached_network_image.dart';

// In a list or grid view
Widget buildArtworkThumbnail(Artwork artwork) {
  return CachedNetworkImage(
    imageUrl: artwork.image.variants.thumbnail,
    placeholder: (context, url) => Center(child: CircularProgressIndicator()),
    errorWidget: (context, url, error) => Icon(Icons.error),
    fit: BoxFit.cover,
  );
}

// In a details page
Widget buildArtworkImage(Artwork artwork) {
  return CachedNetworkImage(
    imageUrl: artwork.image.variants.medium,
    placeholder: (context, url) => CachedNetworkImage(
      imageUrl: artwork.image.variants.thumbnail,
      fit: BoxFit.cover,
    ),
    errorWidget: (context, url, error) => Icon(Icons.error),
    fit: BoxFit.contain,
  );
}

// In a full-screen view
Widget buildFullScreenImage(Artwork artwork) {
  return CachedNetworkImage(
    imageUrl: artwork.image.variants.large,
    placeholder: (context, url) => CachedNetworkImage(
      imageUrl: artwork.image.variants.medium,
      fit: BoxFit.contain,
    ),
    errorWidget: (context, url, error) => Icon(Icons.error),
    fit: BoxFit.contain,
  );
}
```

#### Advanced Image Loading with Hero Animation

```dart
Widget buildArtworkCard(BuildContext context, Artwork artwork) {
  return GestureDetector(
    onTap: () => Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => ArtworkDetailScreen(artwork: artwork),
      ),
    ),
    child: Card(
      child: Hero(
        tag: 'artwork-${artwork.id}',
        child: CachedNetworkImage(
          imageUrl: artwork.image.variants.thumbnail,
          placeholder: (context, url) => Center(
            child: CircularProgressIndicator(),
          ),
          errorWidget: (context, url, error) => Icon(Icons.error),
          fit: BoxFit.cover,
        ),
      ),
    ),
  );
}
```

#### Image Upload to Backend

```dart
Future<void> uploadImage(File imageFile) async {
  try {
    // Create form data
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(
        imageFile.path,
        filename: 'image.jpg',
      ),
    });

    // Upload image
    final response = await dio.post(
      '/api/image/upload',
      data: formData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $accessToken',
        },
      ),
    );

    // Handle response
    if (response.data['success']) {
      final imageData = response.data['data'];
      // Use the uploaded image
      print('Image uploaded successfully: ${imageData['url']}');
    }
  } catch (e) {
    print('Error uploading image: $e');
  }
}
```

## Watermarking

For artist protection, the backend supports automatic watermarking of images:

```javascript
// Add watermark to image
const watermarkedResult = await cloudinary.uploader.upload(file.path, {
  folder: `arthub/users/${userId}/watermarked`,
  resource_type: 'image',
  transformation: [
    { overlay: "arthub_watermark" },
    { flags: "layer_apply", gravity: "center", opacity: 30 }
  ]
});
```

## Performance Considerations

1. **Lazy Loading**: Only load images when they are about to become visible
2. **Preloading**: Preload images that are likely to be viewed next
3. **Caching**: Implement proper caching strategies
4. **Compression**: Use WebP format when supported
5. **Responsive Images**: Use different image sizes based on screen size
6. **Placeholders**: Show placeholders while images are loading

## Image Security

1. **Signed URLs**: Use signed URLs for protected images
2. **Expiring URLs**: Generate URLs that expire after a certain time
3. **Watermarking**: Apply watermarks to protect artist work
4. **Access Control**: Restrict access to images based on user permissions

## Troubleshooting

### Common Issues

1. **Images not loading**:
   - Check network connectivity
   - Verify image URLs
   - Check Cloudinary account status

2. **Slow image loading**:
   - Use smaller image variants
   - Implement better caching
   - Check network speed

3. **Image quality issues**:
   - Use higher quality variants
   - Check transformation parameters
   - Verify original image quality

### Debugging Tools

1. **Network Inspector**: Use Flutter DevTools to inspect network requests
2. **Image Cache**: Monitor image cache size and usage
3. **Performance Overlay**: Use Flutter performance overlay to identify bottlenecks

## Best Practices Summary

1. **Use appropriate image sizes** for different contexts
2. **Implement progressive loading** for better user experience
3. **Cache images** to reduce bandwidth usage
4. **Optimize image quality** based on network conditions
5. **Use WebP format** when supported
6. **Implement lazy loading** for better performance
7. **Show placeholders** while images are loading
8. **Handle errors gracefully** with fallback images
