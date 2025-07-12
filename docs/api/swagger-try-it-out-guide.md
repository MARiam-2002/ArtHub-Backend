# 🚀 دليل استخدام "Try it out" في Swagger UI

## 📋 نظرة عامة

هذا الدليل يوضح كيفية استخدام زر "Try it out" في Swagger UI لاختبار API endpoints، خاصة عند إنشاء الأعمال الفنية مع رفع الصور.

## 🔧 كيفية الوصول إلى Swagger UI

1. **في التطوير المحلي**:
   ```
   http://localhost:3002/api-docs
   ```

2. **في الإنتاج**:
   ```
   https://arthub-api.vercel.app/api-docs
   ```

## 📸 اختبار إنشاء عمل فني مع الصور

### الخطوة 1: الوصول إلى Endpoint
1. افتح Swagger UI
2. ابحث عن قسم "Artworks"
3. ابحث عن `POST /artworks`
4. انقر على "Try it out"

### الخطوة 2: ملء البيانات

#### أ. استخدام multipart/form-data (مُوصى به)
```json
{
  "title": "لوحة المناظر الطبيعية",
  "description": "لوحة جميلة تصور المناظر الطبيعية الخلابة",
  "price": 500,
  "category": "60d0fe4f5311236168a109ca",
  "tags": ["طبيعة", "رسم", "زيتي"],
  "status": "available",
  "isFramed": true,
  "dimensions": {
    "width": 60,
    "height": 40,
    "depth": 2
  },
  "materials": ["زيت على قماش", "أكريليك"]
}
```

#### ب. رفع الصور
- انقر على "Choose Files" في حقل `images`
- اختر من 1 إلى 10 صور
- الصيغ المدعومة: JPG, PNG, GIF, WEBP
- الحد الأقصى: 5MB لكل صورة

### الخطوة 3: إعداد Authorization
1. انقر على زر "Authorize" في أعلى الصفحة
2. أدخل token الخاص بك: `Bearer YOUR_TOKEN_HERE`
3. انقر على "Authorize"
4. أغلق النافذة

### الخطوة 4: تنفيذ الطلب
1. انقر على "Execute"
2. انتظر الاستجابة
3. راجع النتيجة

## 🔑 الحصول على Token للاختبار

### 1. تسجيل مستخدم جديد
```bash
curl -X POST "http://localhost:3002/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "displayName": "Test Artist",
    "role": "artist"
  }'
```

### 2. تسجيل الدخول
```bash
curl -X POST "http://localhost:3002/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Password123!"
  }'
```

### 3. استخدام Token
انسخ `accessToken` من الاستجابة واستخدمه في Swagger UI.

## 📝 أمثلة عملية

### مثال 1: إنشاء عمل فني بسيط
```json
{
  "title": "لوحة تجريدية",
  "description": "لوحة تجريدية بألوان زاهية",
  "price": 300,
  "category": "60d0fe4f5311236168a109ca",
  "tags": ["تجريد", "ألوان", "حديث"]
}
```

### مثال 2: إنشاء عمل فني مع تفاصيل كاملة
```json
{
  "title": "بورتريه ذاتي",
  "description": "بورتريه ذاتي بتقنية الزيت على قماش",
  "price": 800,
  "category": "60d0fe4f5311236168a109ca",
  "tags": ["بورتريه", "ذاتي", "زيتي"],
  "status": "available",
  "isFramed": true,
  "dimensions": {
    "width": 50,
    "height": 70,
    "depth": 3
  },
  "materials": ["زيت على قماش", "ألوان زيتية"]
}
```

## ⚠️ استكشاف الأخطاء

### مشكلة: لا يظهر زر "Try it out"
**الحل**:
1. تأكد من أن Swagger UI محدث
2. امسح cache المتصفح
3. تأكد من أن endpoint يحتوي على schema صحيح

### مشكلة: خطأ في Authorization
**الحل**:
1. تأكد من صحة token
2. تأكد من أن المستخدم لديه دور "artist"
3. تحقق من صلاحية token

### مشكلة: خطأ في رفع الصور
**الحل**:
1. تأكد من صيغة الملف (JPG, PNG, GIF, WEBP)
2. تأكد من حجم الملف (أقل من 5MB)
3. تأكد من عدد الصور (1-10)

### مشكلة: خطأ 400 Bad Request
**الحل**:
1. تحقق من الحقول المطلوبة
2. تأكد من صحة معرف الفئة
3. تحقق من تنسيق البيانات

## 🎯 نصائح مفيدة

1. **استخدم Postman للتطوير**: أسهل لرفع الملفات
2. **اختبر بدون صور أولاً**: للتأكد من صحة البيانات
3. **احفظ أمثلة جيدة**: لاستخدامها لاحقاً
4. **تحقق من الاستجابات**: لفهم الأخطاء

## 📊 الاستجابات المتوقعة

### نجاح (201)
```json
{
  "success": true,
  "message": "تم إنشاء العمل الفني بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "title": "لوحة المناظر الطبيعية",
    "images": [
      "https://res.cloudinary.com/arthub/image/upload/v1234567890/artwork1.jpg"
    ],
    "price": 500,
    "category": { "_id": "...", "name": "الرسم" },
    "artist": { "_id": "...", "displayName": "Test Artist" }
  }
}
```

### أخطاء شائعة
- **400**: بيانات غير صحيحة
- **401**: غير مصرح
- **403**: محظور (للفنانين فقط)
- **413**: حجم الملفات كبير جداً

## 🔗 روابط مفيدة

- [دليل رفع الصور](./artwork-image-upload.md)
- [مجموعة Postman](../integration/ArtHub_Postman_Collection.json)
- [أمثلة الاستجابات](./responses.md)
- [رموز الأخطاء](./errors.md)

---

**آخر تحديث**: يناير 2025  
**المسؤول**: فريق ArtHub Backend 