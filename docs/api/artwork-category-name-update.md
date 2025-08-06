# 🎨 تحديث API الأعمال الفنية - استخدام اسم الفئة

## 📋 ملخص التحديث

تم تحديث API الأعمال الفنية لاستخدام اسم الفئة بدلاً من معرف الفئة (ObjectId) في عمليات إنشاء الأعمال الفنية والبحث عنها.

## 🔄 التغييرات المطبقة

### 1. دالة `createArtwork`
- **قبل التحديث:** كان يتطلب معرف الفئة (ObjectId)
- **بعد التحديث:** يقبل اسم الفئة (string)

### 2. Validation Schema
- تم تحديث `categorySchema` لتقبل النص بدلاً من ObjectId
- إضافة validation للطول (2-50 حرف)
- تحديث رسائل الخطأ

### 3. البحث والتصفية
- تم تحديث فلتر الفئة في `searchArtworks`
- إضافة البحث عن الفئة بالاسم قبل تطبيق الفلتر

## 📝 كيفية الاستخدام

### إنشاء عمل فني جديد

**الطلب:**
```http
POST /api/artworks
Content-Type: application/json
Authorization: Bearer <token>

{
  "title": "لوحة المناظر الطبيعية",
  "description": "لوحة جميلة تصور المناظر الطبيعية الخلابة",
  "price": 500,
  "category": "الرسم الزيتي"
}
```

**الاستجابة الناجحة:**
```json
{
  "status": "success",
  "message": "تم إنشاء العمل الفني بنجاح",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "لوحة المناظر الطبيعية",
    "description": "لوحة جميلة تصور المناظر الطبيعية الخلابة",
    "price": 500,
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "الرسم الزيتي"
    },
    "artist": {
      "_id": "507f1f77bcf86cd799439013",
      "displayName": "أحمد محمد"
    },
    "images": ["https://example.com/image1.jpg"],
    "status": "available",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**الاستجابة في حالة خطأ:**
```json
{
  "status": "fail",
  "message": "الفئة المحددة غير موجودة",
  "data": null
}
```

### البحث عن الأعمال حسب الفئة

**الطلب:**
```http
GET /api/artworks?category=الرسم الزيتي&page=1&limit=10
```

**الاستجابة:**
```json
{
  "status": "success",
  "message": "تم جلب الأعمال الفنية بنجاح",
  "data": {
    "artworks": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "لوحة المناظر الطبيعية",
        "price": 500,
        "category": {
          "_id": "507f1f77bcf86cd799439012",
          "name": "الرسم الزيتي"
        },
        "artist": {
          "_id": "507f1f77bcf86cd799439013",
          "displayName": "أحمد محمد"
        },
        "images": ["https://example.com/image1.jpg"],
        "status": "available"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 50,
      "hasNextPage": true,
      "hasPrevPage": false,
      "limit": 10
    }
  }
}
```

### البحث المتقدم

**الطلب:**
```http
GET /api/artworks/search?q=طبيعة&category=الرسم الزيتي&minPrice=100&maxPrice=1000&page=1&limit=10
```

## 🔍 أمثلة على الفئات المتاحة

- الرسم الزيتي
- الرسم المائي
- النحت
- التصوير الفوتوغرافي
- الخزف
- الخط العربي
- الفن الرقمي
- النسيج
- الزجاج
- المعادن

## ⚠️ ملاحظات مهمة

1. **البحث case-insensitive:** يمكن استخدام الفئة بأي حالة أحرف
2. **التحقق من الوجود:** إذا لم يتم العثور على الفئة، سيتم إرجاع خطأ واضح
3. **التوافق:** جميع التحديثات متوافقة مع الكود الموجود
4. **الأداء:** تم تحسين البحث باستخدام regex للبحث السريع

## 🧪 الاختبار

يمكن اختبار الوظائف الجديدة باستخدام:

```bash
# اختبار إنشاء عمل فني
curl -X POST http://localhost:3000/api/artworks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "title": "لوحة اختبار",
    "description": "وصف العمل الفني",
    "price": 1000,
    "category": "الرسم الزيتي"
  }'

# اختبار البحث
curl "http://localhost:3000/api/artworks?category=الرسم الزيتي"
```

## 📚 المراجع

- [API Endpoints Documentation](./endpoints.md)
- [Artwork Image Upload Guide](./artwork-image-upload.md)
- [Swagger Documentation](../swagger/arthub-swagger.json) 