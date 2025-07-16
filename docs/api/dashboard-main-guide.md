# دليل لوحة التحكم الرئيسية - Dashboard Main Guide

## نظرة عامة

لوحة التحكم الرئيسية في نظام ArtHub توفر نظرة شاملة على جميع جوانب النظام مع إحصائيات مفصلة ومؤشرات الأداء الرئيسية.

## النقاط النهائية المتاحة

### 1. نظرة عامة على النظام - System Overview
```
GET /api/v1/dashboard/overview
```

**الوصف:** الحصول على نظرة عامة شاملة على النظام مع جميع المؤشرات الرئيسية

**الاستجابة:**
```json
{
  "success": true,
  "message": "System overview fetched successfully.",
  "data": {
    "overview": {
      "users": {
        "totalUsers": 12847,
        "activeUsers": 10234,
        "totalArtists": 3429,
        "activeArtists": 2891
      },
      "revenue": {
        "totalRevenue": 1545118,
        "totalOrders": 1243,
        "averageOrderValue": 1243.5
      },
      "artworks": {
        "totalArtworks": 5678,
        "availableArtworks": 4321,
        "soldArtworks": 1357
      },
      "reviews": {
        "totalReviews": 3456,
        "averageRating": 4.5,
        "pendingReviews": 23
      },
      "reports": {
        "totalReports": 89,
        "pendingReports": 12
      },
      "specialRequests": {
        "totalRequests": 234,
        "pendingRequests": 45
      }
    },
    "currency": "SAR",
    "lastUpdated": "2025-01-15T10:30:00.000Z"
  }
}
```

### 2. الإحصائيات الرئيسية - Main Statistics
```
GET /api/v1/dashboard/statistics
```

**الوصف:** الحصول على الإحصائيات الرئيسية للوحة التحكم

### 3. إحصائيات الإيرادات - Revenue Statistics
```
GET /api/v1/dashboard/revenue?period=monthly
```

**المعاملات:**
- `period`: الفترة الزمنية للمقارنة (daily, weekly, monthly, yearly)

**الاستجابة:**
```json
{
  "success": true,
  "message": "Revenue statistics fetched successfully.",
  "data": {
    "currentRevenue": 1545118,
    "previousRevenue": 1287456,
    "percentageChange": 20.0,
    "breakdown": {
      "total": 1545118,
      "monthly": 124500,
      "weekly": 28900,
      "averageOrderValue": 1243.5,
      "totalOrders": 1243
    },
    "currency": "SAR"
  }
}
```

### 4. إحصائيات الطلبات - Order Statistics
```
GET /api/v1/dashboard/orders/statistics
```

**الوصف:** الحصول على إحصائيات مفصلة للطلبات مع تقسيم الحالات

### 5. بيانات الرسوم البيانية - Charts Data
```
GET /api/v1/dashboard/charts?period=monthly
```

**المعاملات:**
- `period`: الفترة الزمنية للرسوم البيانية (daily, weekly, monthly, yearly)

### 6. أداء الفنانين - Artists Performance
```
GET /api/v1/dashboard/artists/performance?limit=10&period=monthly
```

**المعاملات:**
- `limit`: عدد الفنانين المطلوب (افتراضي: 10)
- `period`: الفترة الزمنية لحساب الأداء (weekly, monthly, yearly)

**الاستجابة:**
```json
{
  "success": true,
  "message": "Artists performance data fetched successfully.",
  "data": {
    "artists": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "displayName": "مريم خالد",
        "email": "mariam@example.com",
        "profileImage": "https://example.com/profile1.jpg",
        "job": "فن رقمي",
        "isVerified": true,
        "metrics": {
          "totalSales": 28,
          "totalRevenue": 1175.0,
          "averageOrderValue": 41.96,
          "artworksCount": 28,
          "averageRating": 4.7,
          "reviewsCount": 15
        }
      }
    ],
    "period": "monthly",
    "totalArtists": 3
  }
}
```

## إدارة المستخدمين



## إدارة الطلبات

### قائمة الطلبات
```
GET /api/v1/dashboard/orders?page=1&limit=10&status=completed
```

**المعاملات:**
- `page`: رقم الصفحة
- `limit`: عدد العناصر في الصفحة
- `status`: حالة الطلب (pending, processing, completed, cancelled, refunded)
- `search`: البحث في رقم الطلب

### تفاصيل الطلب
```
GET /api/v1/dashboard/orders/:id
```

## إدارة التقييمات

### قائمة التقييمات
```
GET /api/v1/dashboard/reviews?page=1&limit=10&status=pending&rating=5
```

**المعاملات:**
- `page`: رقم الصفحة
- `limit`: عدد العناصر في الصفحة
- `status`: حالة التقييم (pending, approved, rejected)
- `rating`: التقييم (1-5)

### تحديث حالة التقييم
```
PATCH /api/v1/dashboard/reviews/:id/status
```

**Body:**
```json
{
  "status": "approved"
}
```

## إدارة الإشعارات

### إرسال إشعار
```
POST /api/v1/dashboard/notifications
```

**Body:**
```json
{
  "title": "إشعار مهم",
  "message": "هذا إشعار تجريبي للاختبار",
  "type": "system",
  "sendToAll": true
}
```

**الحقول:**
- `title`: عنوان الإشعار
- `message`: محتوى الإشعار
- `type`: نوع الإشعار (request, message, review, system, other)
- `userId`: معرف المستخدم (مطلوب إذا لم يكن sendToAll = true)
- `sendToAll`: إرسال لجميع المستخدمين (افتراضي: false)

## الفنانين الأفضل

### قائمة الفنانين الأفضل
```
GET /api/v1/dashboard/artists/top?limit=10
```

**المعاملات:**
- `limit`: عدد الفنانين المطلوب (افتراضي: 10)

## النشاطات الأخيرة

### النشاطات الأخيرة
```
GET /api/v1/dashboard/activities?limit=20
```

**المعاملات:**
- `limit`: عدد النشاطات المطلوبة (افتراضي: 20)

## الأمان والصلاحيات

جميع نقاط النهاية تتطلب:
1. **المصادقة:** توكن Bearer صالح
2. **الصلاحيات:** دور admin أو superadmin

### مثال على الطلب:
```bash
curl -X GET "http://localhost:3000/api/v1/dashboard/overview" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

## رموز الحالة

- `200`: نجح الطلب
- `401`: غير مصرح (توكن غير صالح)
- `403`: ممنوع (لا توجد صلاحيات كافية)
- `404`: غير موجود
- `500`: خطأ في الخادم

## أمثلة الاستخدام

### 1. الحصول على نظرة عامة على النظام
```javascript
const response = await fetch('/api/v1/dashboard/overview', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('System Overview:', data.data.overview);
```

### 2. الحصول على إحصائيات الإيرادات
```javascript
const response = await fetch('/api/v1/dashboard/revenue?period=monthly', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Revenue:', data.data.currentRevenue);
console.log('Percentage Change:', data.data.percentageChange);
```

### 3. الحصول على أداء الفنانين
```javascript
const response = await fetch('/api/v1/dashboard/artists/performance?limit=5&period=monthly', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Top Artists:', data.data.artists);
```

## ملاحظات مهمة

1. **الأداء:** جميع النقاط محسنة للأداء مع استخدام MongoDB Aggregation
2. **التقسيم:** معظم النقاط تدعم التقسيم للتعامل مع البيانات الكبيرة
3. **الفلترة:** إمكانية الفلترة حسب الحالة والنوع والتاريخ
4. **البحث:** دعم البحث النصي في المستخدمين والطلبات
5. **الصلاحيات:** تحقق من الصلاحيات قبل كل عملية
6. **التوثيق:** جميع النقاط موثقة في Swagger

## استكشاف الأخطاء

### مشاكل شائعة:

1. **401 Unauthorized:**
   - تأكد من صحة التوكن
   - تأكد من عدم انتهاء صلاحية التوكن

2. **403 Forbidden:**
   - تأكد من أن المستخدم لديه دور admin أو superadmin

3. **404 Not Found:**
   - تأكد من صحة معرف العنصر
   - تأكد من وجود العنصر في قاعدة البيانات

4. **500 Server Error:**
   - تحقق من اتصال قاعدة البيانات
   - تحقق من صحة البيانات المرسلة

## الدعم

للمساعدة التقنية أو الإبلاغ عن مشاكل، يرجى التواصل مع فريق التطوير. 