# 🔗 نقاط النهاية (API Endpoints)

دليل شامل لجميع نقاط النهاية المتاحة في ArtHub API.

## 📋 فهرس الوحدات

- [المصادقة (Authentication)](#authentication)
- [المستخدمين (Users)](#users)
- [الأعمال الفنية (Artworks)](#artworks)
- [الصور (Images)](#images)
- [المحادثات (Chat)](#chat)
- [الإشعارات (Notifications)](#notifications)
- [الطلبات الخاصة (Special Requests)](#special-requests)
- [المعاملات (Transactions)](#transactions)
- [التقارير (Reports)](#reports)
- [المراجعات (Reviews)](#reviews)
- [المتابعة (Follow)](#follow)
- [التصنيفات (Categories)](#categories)
- [الصفحة الرئيسية (Home)](#home)

---

## 🔐 المصادقة (Authentication) {#authentication}

### POST /api/auth/register
تسجيل مستخدم جديد
```json
{
  "displayName": "string",
  "email": "string",
  "password": "string",
  "role": "user|artist",
  "fingerprint": "string (optional)"
}
```

### POST /api/auth/login
تسجيل الدخول
```json
{
  "email": "string",
  "password": "string"
}
```

### POST /api/auth/login-with-fingerprint
تسجيل الدخول بصمة الجهاز
```json
{
  "fingerprint": "string"
}
```

### POST /api/auth/update-fingerprint
تحديث بصمة الجهاز (يتطلب مصادقة)
```json
{
  "fingerprint": "string"
}
```

### POST /api/auth/refresh-token
تجديد رمز الوصول
```json
{
  "refreshToken": "string"
}
```

### POST /api/auth/forget-password
نسيان كلمة المرور
```json
{
  "email": "string"
}
```

### POST /api/auth/reset-password
إعادة تعيين كلمة المرور
```json
{
  "email": "string",
  "forgetCode": "string",
  "newPassword": "string"
}
```

### POST /api/auth/logout
تسجيل الخروج (يتطلب مصادقة)

---

## 👤 المستخدمين (Users) {#users}

### GET /api/user/:id
الحصول على بيانات مستخدم

### GET /api/user/profile
الحصول على الملف الشخصي (يتطلب مصادقة)

### PUT /api/user
تحديث الملف الشخصي (يتطلب مصادقة)

### PUT /api/user/profile-image
تحديث صورة الملف الشخصي (يتطلب مصادقة)

### PUT /api/user/cover-images
تحديث صور الغلاف (يتطلب مصادقة)

### GET /api/user/search
البحث في المستخدمين
- Query: `q`, `role`, `page`, `limit`

### DELETE /api/user
حذف الحساب (يتطلب مصادقة)

---

## 🎨 الأعمال الفنية (Artworks) {#artworks}

### GET /api/artworks
الحصول على جميع الأعمال الفنية
- Query: `page`, `limit`, `category`, `artist`, `minPrice`, `maxPrice`, `search`

### GET /api/artworks/:id
الحصول على عمل فني محدد

### POST /api/artworks
إنشاء عمل فني جديد (يتطلب مصادقة)

**📝 ملاحظة مهمة:** تم تحديث API لاستخدام اسم الفئة بدلاً من معرف الفئة

**مثال على الطلب:**
```json
{
  "title": "لوحة المناظر الطبيعية",
  "description": "لوحة جميلة تصور المناظر الطبيعية الخلابة",
  "price": 500,
  "category": "الرسم الزيتي"
}
```

**الاستجابة:**
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

### PUT /api/artworks/:id
تحديث عمل فني (يتطلب مصادقة)

### DELETE /api/artworks/:id
حذف عمل فني (يتطلب مصادقة)

### POST /api/artworks/:id/like
إعجاب/إلغاء إعجاب بعمل فني (يتطلب مصادقة)

### POST /api/artworks/:id/save
حفظ/إلغاء حفظ عمل فني (يتطلب مصادقة)

### GET /api/artworks/user/:userId
الحصول على أعمال فنية لمستخدم محدد

### GET /api/artworks/saved
الحصول على الأعمال الفنية المحفوظة (يتطلب مصادقة)

### GET /api/artworks/search
البحث في الأعمال الفنية

**Query Parameters:**
- `q`: نص البحث (مطلوب)
- `category`: اسم الفئة (اختياري)
- `minPrice`: الحد الأدنى للسعر (اختياري)
- `maxPrice`: الحد الأقصى للسعر (اختياري)
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد العناصر في الصفحة (افتراضي: 10)

**مثال:**
```
GET /api/artworks/search?q=طبيعة&category=الرسم الزيتي&minPrice=100&maxPrice=1000
```

---

## 📸 الصور (Images) {#images}

### POST /api/images/upload
رفع صورة (يتطلب مصادقة)

### GET /api/images/:id
الحصول على تفاصيل صورة

### DELETE /api/images/:id
حذف صورة (يتطلب مصادقة)

### PUT /api/images/:id
تحديث بيانات صورة (يتطلب مصادقة)

### GET /api/images/user/:userId
الحصول على صور مستخدم محدد

---

## 💬 المحادثات (Chat) {#chat}

### GET /api/chat
الحصول على جميع المحادثات (يتطلب مصادقة)

### POST /api/chat
إنشاء محادثة جديدة (يتطلب مصادقة)

### GET /api/chat/:id
الحصول على تفاصيل محادثة

### GET /api/chat/:id/messages
الحصول على رسائل محادثة

### POST /api/chat/:id/messages
إرسال رسالة (يتطلب مصادقة)

### PUT /api/chat/:id/read
تمييز المحادثة كمقروءة (يتطلب مصادقة)

---

## 🔔 الإشعارات (Notifications) {#notifications}

### GET /api/notifications
الحصول على جميع الإشعارات (يتطلب مصادقة)

### PUT /api/notifications/:id/read
تمييز إشعار كمقروء (يتطلب مصادقة)

### PUT /api/notifications/read-all
تمييز جميع الإشعارات كمقروءة (يتطلب مصادقة)

### DELETE /api/notifications/:id
حذف إشعار (يتطلب مصادقة)

### GET /api/notifications/unread-count
الحصول على عدد الإشعارات غير المقروءة (يتطلب مصادقة)

---

## 🎯 الطلبات الخاصة (Special Requests) {#special-requests}

### GET /api/special-requests
الحصول على جميع الطلبات الخاصة (يتطلب مصادقة)

### POST /api/special-requests
إنشاء طلب خاص جديد (يتطلب مصادقة)

### GET /api/special-requests/:id
الحصول على تفاصيل طلب خاص

### PUT /api/special-requests/:id
تحديث طلب خاص (يتطلب مصادقة)

### DELETE /api/special-requests/:id
حذف طلب خاص (يتطلب مصادقة)

### PUT /api/special-requests/:id/status
تحديث حالة طلب خاص (يتطلب مصادقة)

---

## 💰 المعاملات (Transactions) {#transactions}

### GET /api/transactions
الحصول على جميع المعاملات (يتطلب مصادقة)

### POST /api/transactions
إنشاء معاملة جديدة (يتطلب مصادقة)

### GET /api/transactions/:id
الحصول على تفاصيل معاملة

### PUT /api/transactions/:id/status
تحديث حالة معاملة (يتطلب مصادقة)

### GET /api/transactions/user/:userId
الحصول على معاملات مستخدم محدد

---



---

## ⭐ المراجعات (Reviews) {#reviews}

### GET /api/reviews/artwork/:artworkId
الحصول على مراجعات عمل فني

### POST /api/reviews
إنشاء مراجعة جديدة (يتطلب مصادقة)

### PUT /api/reviews/:id
تحديث مراجعة (يتطلب مصادقة)

### DELETE /api/reviews/:id
حذف مراجعة (يتطلب مصادقة)

---

## 👥 المتابعة (Follow) {#follow}

### POST /api/follow/:userId
متابعة/إلغاء متابعة مستخدم (يتطلب مصادقة)

### GET /api/follow/followers/:userId
الحصول على متابعين مستخدم

### GET /api/follow/following/:userId
الحصول على من يتابعهم المستخدم

---

## 📂 التصنيفات (Categories) {#categories}

### GET /api/categories
الحصول على جميع التصنيفات

### POST /api/categories
إنشاء تصنيف جديد (admin only)

### PUT /api/categories/:id
تحديث تصنيف (admin only)

### DELETE /api/categories/:id
حذف تصنيف (admin only)

---

## 🏠 الصفحة الرئيسية (Home) {#home}

### GET /api/home/feed
الحصول على محتوى الصفحة الرئيسية

### GET /api/home/trending
الحصول على الأعمال الفنية الرائجة

### GET /api/home/featured
الحصول على الأعمال الفنية المميزة

### GET /api/home/recommendations
الحصول على التوصيات (يتطلب مصادقة)

---

## 🔧 ملاحظات عامة

### Headers مطلوبة:
```
Content-Type: application/json
Authorization: Bearer <token> (للنقاط المحمية)
```

### Response Format:
```json
{
  "success": boolean,
  "status": number,
  "message": "string",
  "data": object|array,
  "metadata": {
    "pagination": {
      "currentPage": number,
      "totalPages": number,
      "totalItems": number,
      "hasNextPage": boolean,
      "hasPreviousPage": boolean
    }
  },
  "timestamp": "ISO string",
  "requestId": "string"
}
```

### Error Response:
```json
{
  "success": false,
  "status": number,
  "message": "string",
  "error": "string",
  "errorCode": "string",
  "timestamp": "ISO string",
  "requestId": "string"
}
```

---

**آخر تحديث:** يناير 2025  
**الإصدار:** 2.0 