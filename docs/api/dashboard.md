# واجهات API لوحة التحكم الإدارية

## نظرة عامة

تحتوي لوحة التحكم الإدارية على مجموعة شاملة من واجهات API لإدارة المنصة ومراقبة الأنشطة. هذه الواجهات مخصصة للمديرين والمشرفين فقط.

## المصادقة والتخويل

جميع واجهات API تتطلب:
- مصادقة صحيحة (Bearer Token)
- صلاحيات إدارية (admin أو superadmin)

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## الواجهات المتاحة

### 1. الإحصائيات الرئيسية

#### `GET /api/dashboard/statistics`
جلب الإحصائيات الرئيسية للمنصة

**الاستجابة:**
```json
{
  "success": true,
  "message": "Dashboard statistics fetched successfully.",
  "data": {
    "users": {
      "total": 1250,
      "active": 1100,
      "artists": 300,
      "activeArtists": 280
    },
    "revenue": {
      "total": 45000.50,
      "currency": "SAR"
    },
    "artworks": {
      "total": 850,
      "available": 600,
      "sold": 250
    },
    "orders": {
      "total": 320,
      "pending": 25,
      "completed": 280
    },
    "reviews": {
      "total": 150,
      "pending": 8,
      "averageRating": 4.2
    },
    "reports": {
      "total": 12,
      "pending": 3
    },
    "specialRequests": {
      "total": 45,
      "pending": 8
    }
  }
}
```

### 2. بيانات الرسوم البيانية

#### `GET /api/dashboard/charts?period=monthly`
جلب بيانات الرسوم البيانية للطلبات والإيرادات

**المعاملات:**
- `period`: الفترة الزمنية (daily, weekly, monthly, yearly)

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "period": "monthly",
    "orders": [
      {
        "_id": {"year": 2024, "month": 1},
        "totalOrders": 45,
        "completedOrders": 40,
        "pendingOrders": 5,
        "cancelledOrders": 0
      }
    ],
    "revenue": [
      {
        "_id": {"year": 2024, "month": 1},
        "totalRevenue": 15000.50,
        "averageOrderValue": 375.25,
        "orderCount": 40
      }
    ],
    "newUsers": [
      {
        "_id": {"year": 2024, "month": 1},
        "newUsers": 120,
        "newArtists": 25
      }
    ]
  }
}
```

### 3. إدارة المستخدمين

#### `GET /api/dashboard/users`
جلب قائمة المستخدمين مع التصفية والبحث

**المعاملات:**
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد العناصر في الصفحة (افتراضي: 10)
- `role`: تصفية حسب الدور (user, artist, admin, superadmin)
- `status`: تصفية حسب الحالة (active, inactive, banned)
- `search`: البحث في الأسماء والإيميلات

#### `GET /api/dashboard/users/{id}`
جلب تفاصيل مستخدم محدد مع إحصائياته

#### `PATCH /api/dashboard/users/{id}/status`
تحديث حالة المستخدم

**البيانات المطلوبة:**
```json
{
  "status": "active" // أو "inactive" أو "banned"
}
```

### 4. إدارة الطلبات

#### `GET /api/dashboard/orders`
جلب قائمة الطلبات والمعاملات

**المعاملات:**
- `page`, `limit`: للتصفح
- `status`: تصفية حسب حالة الطلب
- `search`: البحث في رقم المعاملة

#### `GET /api/dashboard/orders/{id}`
جلب تفاصيل طلب محدد

### 5. إدارة التقييمات

#### `GET /api/dashboard/reviews`
جلب قائمة التقييمات للمراجعة

**المعاملات:**
- `page`, `limit`: للتصفح
- `status`: تصفية حسب حالة التقييم (pending, approved, rejected)
- `rating`: تصفية حسب التقييم (1-5)

#### `PATCH /api/dashboard/reviews/{id}/status`
الموافقة على التقييم أو رفضه

**البيانات المطلوبة:**
```json
{
  "status": "approved" // أو "rejected" أو "pending"
}
```

### 6. إدارة الإشعارات

#### `POST /api/dashboard/notifications`
إرسال إشعار لمستخدم محدد أو لجميع المستخدمين

**البيانات المطلوبة:**
```json
{
  "title": "عنوان الإشعار",
  "message": "محتوى الإشعار",
  "type": "system", // أو "request", "message", "review", "other"
  "userId": "USER_ID", // اختياري، لإرسال لمستخدم واحد
  "sendToAll": false // true لإرسال لجميع المستخدمين
}
```

### 7. أفضل الفنانين

#### `GET /api/dashboard/artists/top?limit=10`
جلب قائمة أفضل الفنانين أداءً

**المعاملات:**
- `limit`: عدد الفنانين المطلوب عرضهم (افتراضي: 10)

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "artists": [
      {
        "_id": "ARTIST_ID",
        "totalSales": 25,
        "totalRevenue": 12500.75,
        "averageRating": 4.8,
        "artist": {
          "displayName": "أحمد الفنان",
          "email": "artist@example.com",
          "profileImage": {...}
        }
      }
    ]
  }
}
```

### 8. الأنشطة الحديثة

#### `GET /api/dashboard/activities?limit=20`
جلب الأنشطة والأحداث الحديثة في المنصة

**المعاملات:**
- `limit`: عدد الأنشطة المطلوب عرضها (افتراضي: 20)

**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "orders": [
      {
        "transactionNumber": "TXN-001",
        "status": "completed",
        "pricing": {"totalAmount": 500},
        "buyer": {"displayName": "محمد أحمد"},
        "seller": {"displayName": "سارة الفنانة"},
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "users": [
      {
        "displayName": "علي محمد",
        "email": "ali@example.com",
        "role": "artist",
        "createdAt": "2024-01-15T09:15:00Z"
      }
    ],
    "reviews": [
      {
        "rating": 5,
        "comment": "عمل رائع ومميز",
        "status": "pending",
        "user": {"displayName": "فاطمة أحمد"},
        "artwork": {"title": "لوحة الطبيعة"},
        "createdAt": "2024-01-15T08:45:00Z"
      }
    ],
    "reports": [
      {
        "reason": "inappropriate",
        "status": "pending",
        "contentType": "artwork",
        "reporter": {"displayName": "خالد محمد"},
        "createdAt": "2024-01-15T07:30:00Z"
      }
    ]
  }
}
```

## رموز الحالة والأخطاء

- `200`: نجح الطلب
- `400`: بيانات غير صالحة
- `401`: غير مصرح (مطلوب تسجيل دخول)
- `403`: غير مصرح (صلاحيات إدارية مطلوبة)
- `404`: العنصر غير موجود
- `500`: خطأ في الخادم

## ملاحظات مهمة

1. **الأمان**: جميع واجهات API محمية بمستوى أمان عالي
2. **التصفح**: معظم الواجهات تدعم التصفح باستخدام `page` و `limit`
3. **التصفية**: إمكانيات تصفية متقدمة حسب الحالة والنوع
4. **البحث**: دعم البحث النصي في معظم الواجهات
5. **الوقت الفعلي**: البيانات محدثة في الوقت الفعلي

## أمثلة الاستخدام

### جلب إحصائيات اليوم
```bash
curl -X GET "https://api.arthub.com/api/dashboard/statistics" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### البحث عن مستخدم
```bash
curl -X GET "https://api.arthub.com/api/dashboard/users?search=أحمد&role=artist" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### إرسال إشعار لجميع المستخدمين
```bash
curl -X POST "https://api.arthub.com/api/dashboard/notifications" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "إشعار مهم",
    "message": "تحديث جديد في المنصة",
    "sendToAll": true
  }'
``` 