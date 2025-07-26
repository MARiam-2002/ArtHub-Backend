# تحديث Swagger لإدارة الفنانين

## نظرة عامة

تم تحديث توثيق Swagger لإضافة الـ endpoints الجديدة لإدارة الفنانين في الداشبورد الإداري.

## التحديثات المضافة

### 1. إضافة Tag جديد
- **اسم**: `Artist Management`
- **الوصف**: واجهات API لإدارة الفنانين في الداشبورد الإداري
- **الاسم المعروض**: إدارة الفنانين

### 2. إضافة Tag Group
- تم إضافة `Artist Management` إلى مجموعة `الإدارة`
- تجميع منطقي للـ endpoints الإدارية

## الـ Endpoints المضافة في Swagger

### 1. جلب قائمة الفنانين
```json
{
  "path": "/api/admin/artists",
  "method": "GET",
  "tags": ["Artist Management"],
  "summary": "جلب قائمة الفنانين",
  "description": "جلب قائمة جميع الفنانين مع إحصائياتهم الأساسية للداشبورد الإداري"
}
```

**المعاملات**:
- `page` (query): رقم الصفحة
- `limit` (query): عدد العناصر في الصفحة
- `search` (query): البحث بالاسم أو البريد أو الهاتف
- `status` (query): تصفية بالحالة (active, inactive, banned)
- `sortBy` (query): ترتيب حسب (createdAt, displayName, artworksCount, totalSales)
- `sortOrder` (query): اتجاه الترتيب (asc, desc)

### 2. جلب تفاصيل الفنان
```json
{
  "path": "/api/admin/artists/{artistId}",
  "method": "GET",
  "tags": ["Artist Management"],
  "summary": "جلب تفاصيل الفنان",
  "description": "جلب تفاصيل شاملة لفنان محدد تشمل الإحصائيات والأعمال والبلاغات والتقييمات وسجل النشاط"
}
```

**المعاملات**:
- `artistId` (path): معرف الفنان
- `page` (query): رقم الصفحة للأعمال الفنية
- `limit` (query): عدد الأعمال في الصفحة

### 3. تحديث حالة الفنان
```json
{
  "path": "/api/admin/artists/{artistId}/status",
  "method": "PATCH",
  "tags": ["Artist Management"],
  "summary": "تحديث حالة الفنان",
  "description": "تحديث حالة الفنان (تفعيل/إلغاء تفعيل/حظر)"
}
```

**المعاملات**:
- `artistId` (path): معرف الفنان
- `status` (body): الحالة الجديدة (active, inactive, banned)
- `reason` (body): سبب الحظر (مطلوب للحظر)

## الملفات المحدثة

### 1. `src/swagger/arthub-swagger.json`
- إضافة الـ endpoints الجديدة مع التوثيق الكامل
- إضافة schemas للاستجابات
- إضافة error responses

### 2. `src/swagger/swagger-definition.js`
- إضافة tag جديد `Artist Management`
- إضافة tag group للإدارة
- تحديث التصنيفات

### 3. `scripts/update-swagger-artist-management.js`
- script لتحديث Swagger تلقائياً
- إنشاء backup قبل التحديث
- التحقق من صحة JSON

## الاستجابات المضافة

### استجابة جلب قائمة الفنانين
```json
{
  "success": true,
  "message": "تم جلب قائمة الفنانين بنجاح",
  "data": {
    "artists": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "displayName": "عمر خالد محمد",
        "email": "omar.2004@gmail.com",
        "phone": "+96650140067845",
        "profileImage": "https://res.cloudinary.com/example/profile.jpg",
        "location": "القاهرة, مصر",
        "isActive": true,
        "isVerified": true,
        "joinDate": "2023-01-15T00:00:00.000Z",
        "stats": {
          "artworksCount": 25,
          "totalSales": 2450,
          "avgRating": 4.8,
          "reviewsCount": 12,
          "reportsCount": 5
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "pages": 5
    }
  }
}
```

### استجابة جلب تفاصيل الفنان
```json
{
  "success": true,
  "message": "تم جلب تفاصيل الفنان بنجاح",
  "data": {
    "artist": {
      "_id": "507f1f77bcf86cd799439011",
      "displayName": "عمر خالد محمد",
      "email": "omar.2004@gmail.com",
      "phone": "+96650140067845",
      "bio": "فنانة معاصرة متخصصة في الفن التجريدي...",
      "profileImage": "https://res.cloudinary.com/example/profile.jpg",
      "location": "القاهرة, مصر",
      "joinDate": "2023-01-15T00:00:00.000Z",
      "isActive": true,
      "isVerified": true,
      "socialMedia": {
        "instagram": "@omar_artist",
        "facebook": "omar.artist"
      }
    },
    "stats": {
      "artworksCount": 25,
      "totalSales": 2450,
      "completedOrders": 12,
      "avgRating": 4.8,
      "reviewsCount": 12,
      "reportsCount": 5,
      "followersCount": 150
    },
    "artworks": {
      "items": [...],
      "pagination": {...}
    },
    "reports": [...],
    "reviews": [...],
    "activities": [...]
  }
}
```

### استجابة تحديث حالة الفنان
```json
{
  "success": true,
  "message": "تم تحديث حالة الفنان بنجاح إلى active",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "displayName": "عمر خالد محمد",
    "isActive": true,
    "isBanned": false,
    "banReason": null,
    "updatedAt": "2025-01-18T10:30:00.000Z"
  }
}
```

## الأخطاء المضافة

### 400 Bad Request
- معرف الفنان غير صالح
- حالة غير صالحة
- سبب الحظر مطلوب عند الحظر

### 401 Unauthorized
- عدم وجود token مصادقة
- token منتهي الصلاحية

### 403 Forbidden
- المستخدم ليس أدمن أو سوبر أدمن

### 404 Not Found
- الفنان غير موجود

## كيفية استخدام التحديثات

### 1. عرض التوثيق
```bash
# تشغيل الخادم
npm start

# الوصول إلى Swagger UI
http://localhost:3000/api-docs
```

### 2. اختبار الـ endpoints
```bash
# تشغيل script الاختبار
node scripts/test-artist-endpoints.js
```

### 3. تحديث Swagger
```bash
# تشغيل script التحديث
node scripts/update-swagger-artist-management.js
```

## ملاحظات مهمة

1. **التوافق**: جميع الـ endpoints متوافقة مع Swagger 3.0.0
2. **الأمان**: جميع الـ endpoints تتطلب مصادقة Bearer token
3. **التحقق**: يتم التحقق من صحة البيانات المدخلة
4. **التوثيق**: تم توثيق جميع المعاملات والاستجابات
5. **الأخطاء**: تم تعريف جميع حالات الخطأ المحتملة

## التحديثات المستقبلية

1. إضافة المزيد من الـ endpoints لإدارة الفنانين
2. إضافة schemas أكثر تفصيلاً
3. إضافة أمثلة أكثر للاستجابات
4. إضافة diagrams للـ API flows
5. إضافة integration tests

## التحقق من التحديثات

### 1. التحقق من JSON
```bash
node scripts/validate-json.js
```

### 2. التحقق من Swagger UI
- فتح http://localhost:3000/api-docs
- البحث عن "Artist Management"
- اختبار الـ endpoints

### 3. التحقق من التوثيق
- التأكد من وجود جميع الـ endpoints
- التأكد من صحة المعاملات
- التأكد من صحة الاستجابات

## الدعم

في حالة وجود أي مشاكل أو أسئلة حول التحديثات:

1. مراجعة ملف `SWAGGER_ARTIST_MANAGEMENT_UPDATE.md`
2. مراجعة ملف `docs/api/admin-artist-management.md`
3. تشغيل script الاختبار للتأكد من صحة الـ endpoints
4. مراجعة logs للخادم للتأكد من عدم وجود أخطاء 