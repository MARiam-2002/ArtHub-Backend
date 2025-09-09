# دليل الكاش للصفحة الرئيسية (Home Page Caching Guide)

## ملخص التحسينات المضافة

تم إضافة نظام كاش ذكي للصفحة الرئيسية لتحسين الأداء وسرعة الاستجابة.

## استراتيجية الكاش

### مدة التخزين (TTL)
- **الضيوف (Guest Users)**: 30 دقيقة - لأن البيانات أقل تخصصاً
- **المستخدمين المسجلين**: 5 دقائق - لأن البيانات أكثر تخصصاً وتحتاج تحديث أسرع

### مفاتيح الكاش
- الضيوف: `home:data:guest`
- المستخدمين: `home:data:user:{userId}`

## كيفية استخدام Cache Invalidation

### 1. عند إضافة أو تحديث الأعمال الفنية
```javascript
import { clearHomeCache } from '../home/home.controller.js';

// بعد إضافة أو تحديث عمل فني
await artworkModel.create(newArtwork);
await clearHomeCache(); // إلغاء كاش الصفحة الرئيسية
```

### 2. عند إضافة أو تحديث الفنانين
```javascript
import { clearHomeCache } from '../home/home.controller.js';

// بعد تحديث بيانات فنان
await userModel.findByIdAndUpdate(artistId, updateData);
await clearHomeCache(); // إلغاء كاش الصفحة الرئيسية
```

### 3. عند تحديث بيانات المستخدم الشخصية
```javascript
import { clearUserHomeCache } from '../home/home.controller.js';

// بعد إضافة عمل للمفضلة
await userModel.findByIdAndUpdate(userId, { $push: { wishlist: artworkId } });
await clearUserHomeCache(userId); // إلغاء كاش المستخدم فقط
```

### 4. عند إضافة أو تحديث التصنيفات
```javascript
import { clearHomeCache } from '../home/home.controller.js';

// بعد إضافة تصنيف جديد
await categoryModel.create(newCategory);
await clearHomeCache(); // إلغاء كاش الصفحة الرئيسية
```

## الفوائد المحققة

✅ **سرعة أفضل**: تحميل الصفحة الرئيسية من الكاش بدلاً من قاعدة البيانات  
✅ **أداء محسن**: تقليل الحمل على قاعدة البيانات  
✅ **استجابة أسرع**: وقت استجابة أقل للمستخدمين  
✅ **كاش ذكي**: كاش منفصل للضيوف والمستخدمين المسجلين  
✅ **تحديث تلقائي**: إلغاء الكاش عند تغيير البيانات  

## ملاحظات مهمة

- شكل الـ response يبقى كما هو تماماً، متوافق مع Flutter
- الكاش يعمل تلقائياً، لا حاجة لتغيير كود Flutter
- يمكن مراقبة حالة الكاش من خلال `meta.cached: true` في الاستجابة
- في حالة فشل الكاش، يتم الرجوع لقاعدة البيانات تلقائياً

## مراقبة الأداء

يمكن مراقبة أداء الكاش من خلال:
```javascript
import { getCacheStats } from '../utils/cache.js';

const stats = await getCacheStats();
console.log('📊 Cache statistics:', stats);
```

## اختبار الكاش

يمكن اختبار الكاش باستخدام السكريبت المرفق:
```bash
node scripts/test-home-cache.js
```

هذا السكريبت سيقوم بـ:
- اختبار الطلب الأول (بدون كاش)
- اختبار الطلب الثاني (مع كاش)
- حساب تحسن السرعة
- فحص التوافق مع Flutter
- اختبار الاستقرار