# إدارة الفنانين في الداشبورد الإداري

## نظرة عامة

تم إضافة مجموعة من الـ endpoints لإدارة الفنانين في الداشبورد الإداري، تتيح للأدمن والسوبر أدمن عرض تفاصيل شاملة للفنانين وإدارة حالاتهم.

## الـ Endpoints المتاحة

### 1. جلب قائمة الفنانين

**GET** `/api/admin/artists`

جلب قائمة جميع الفنانين مع إحصائياتهم الأساسية.

#### المعاملات (Query Parameters)

| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|--------|
| `page` | number | لا | رقم الصفحة (افتراضي: 1) |
| `limit` | number | لا | عدد العناصر في الصفحة (افتراضي: 10) |
| `search` | string | لا | البحث بالاسم أو البريد الإلكتروني أو الهاتف |
| `status` | string | لا | تصفية بالحالة: `active`, `inactive`, `banned` |
| `sortBy` | string | لا | ترتيب حسب: `createdAt`, `displayName`, `artworksCount`, `totalSales` |
| `sortOrder` | string | لا | اتجاه الترتيب: `asc`, `desc` |

#### مثال للاستخدام

```bash
GET /api/admin/artists?page=1&limit=10&status=active&sortBy=createdAt&sortOrder=desc
```

#### الاستجابة

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

### 2. جلب تفاصيل الفنان

**GET** `/api/admin/artists/{artistId}`

جلب تفاصيل شاملة لفنان محدد تشمل الإحصائيات والأعمال والبلاغات والتقييمات وسجل النشاط.

#### المعاملات (Path Parameters)

| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|--------|
| `artistId` | string | نعم | معرف الفنان |

#### المعاملات (Query Parameters)

| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|--------|
| `page` | number | لا | رقم الصفحة للأعمال الفنية (افتراضي: 1) |
| `limit` | number | لا | عدد الأعمال في الصفحة (افتراضي: 10) |

#### مثال للاستخدام

```bash
GET /api/admin/artists/507f1f77bcf86cd799439011?page=1&limit=10
```

#### الاستجابة

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
      "bio": "فنانة معاصرة متخصصة في الفن التجريدي والرسم بالألوان المائية...",
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
      "items": [
        {
          "_id": "507f1f77bcf86cd799439012",
          "title": "الفن التجريدي",
          "price": 1750,
          "status": "completed",
          "images": ["https://res.cloudinary.com/example/artwork1.jpg"],
          "category": {
            "_id": "507f1f77bcf86cd799439013",
            "name": "رسم"
          },
          "createdAt": "2025-01-18T10:30:00.000Z"
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 25
      }
    },
    "reports": [
      {
        "_id": "507f1f77bcf86cd799439014",
        "reporter": {
          "_id": "507f1f77bcf86cd799439015",
          "displayName": "منى سالم",
          "email": "mona@example.com"
        },
        "type": "تأخير في التسليم",
        "description": "لم يتم تسليم العمل في الموعد المحدد",
        "status": "under_review",
        "createdAt": "2025-01-02T00:00:00.000Z"
      }
    ],
    "reviews": [
      {
        "_id": "507f1f77bcf86cd799439016",
        "reviewer": {
          "_id": "507f1f77bcf86cd799439017",
          "displayName": "احمد محمد"
        },
        "artwork": {
          "_id": "507f1f77bcf86cd799439018",
          "title": "لوحة زيتية مخصصة"
        },
        "rating": 5,
        "comment": "عمل رائع جدًا ويستحق التقدير.",
        "createdAt": "2025-01-18T00:00:00.000Z"
      }
    ],
    "activities": [
      {
        "type": "order",
        "icon": "🛒",
        "title": "طلب جديد #1234",
        "description": "تم إنشاء طلب جديد بقيمة 250 ريال",
        "date": "2025-06-15T14:30:00.000Z",
        "status": "completed"
      },
      {
        "type": "review",
        "icon": "⭐",
        "title": "تقييم جديد",
        "description": "تم إرسال تقييم 5 نجوم للمنتج",
        "date": "2025-06-15T16:45:00.000Z",
        "status": "new"
      },
      {
        "type": "login",
        "icon": "🔐",
        "title": "تسجيل دخول",
        "description": "تم تسجيل الدخول من الرياض",
        "date": "2025-06-14T09:15:00.000Z",
        "status": "info"
      }
    ]
  }
}
```

### 3. تحديث حالة الفنان

**PATCH** `/api/admin/artists/{artistId}/status`

تحديث حالة الفنان (تفعيل/إلغاء تفعيل/حظر).

#### المعاملات (Path Parameters)

| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|--------|
| `artistId` | string | نعم | معرف الفنان |

#### المعاملات (Body)

| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|--------|
| `status` | string | نعم | الحالة الجديدة: `active`, `inactive`, `banned` |
| `reason` | string | لا | سبب الحظر (مطلوب إذا كانت الحالة `banned`) |

#### مثال للاستخدام

```bash
PATCH /api/admin/artists/507f1f77bcf86cd799439011/status
Content-Type: application/json

{
  "status": "banned",
  "reason": "انتهاك شروط الاستخدام"
}
```

#### الاستجابة

```json
{
  "success": true,
  "message": "تم تحديث حالة الفنان بنجاح إلى banned",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "displayName": "عمر خالد محمد",
    "isActive": false,
    "isBanned": true,
    "banReason": "انتهاك شروط الاستخدام",
    "updatedAt": "2025-01-18T10:30:00.000Z"
  }
}
```

## الأخطاء المحتملة

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

### 500 Internal Server Error
- خطأ في قاعدة البيانات
- خطأ في الخادم

## أمثلة الاستخدام

### جلب جميع الفنانين النشطين

```javascript
const response = await fetch('/api/admin/artists?status=active&sortBy=totalSales&sortOrder=desc', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### البحث عن فنان محدد

```javascript
const response = await fetch('/api/admin/artists?search=عمر خالد', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### جلب تفاصيل فنان مع أعماله

```javascript
const response = await fetch('/api/admin/artists/507f1f77bcf86cd799439011?page=1&limit=20', {
  headers: {
    'Authorization': `Bearer ${adminToken}`
  }
});
```

### حظر فنان

```javascript
const response = await fetch('/api/admin/artists/507f1f77bcf86cd799439011/status', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    status: 'banned',
    reason: 'انتهاك شروط الاستخدام'
  })
});
```

## ملاحظات مهمة

1. **الصلاحيات**: هذه الـ endpoints متاحة فقط للأدمن والسوبر أدمن
2. **المصادقة**: يجب إرسال token مصادقة صالح في header `Authorization`
3. **التحقق**: يتم التحقق من صحة معرف الفنان قبل معالجة الطلب
4. **التصفية**: يمكن تصفية النتائج حسب الحالة والبحث والترتيب
5. **الترقيم**: جميع النتائج تدعم الترقيم للتعامل مع البيانات الكبيرة
6. **الإحصائيات**: يتم حساب الإحصائيات في الوقت الفعلي
7. **سجل النشاط**: يتم تتبع جميع الأنشطة وتنسيقها بشكل مناسب

## اختبار الـ Endpoints

يمكن استخدام script الاختبار الموجود في `scripts/test-artist-endpoints.js` لاختبار جميع الـ endpoints:

```bash
node scripts/test-artist-endpoints.js
``` 