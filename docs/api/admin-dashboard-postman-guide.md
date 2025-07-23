# دليل استخدام Postman Collection للـ Admin و Dashboard

## نظرة عامة

هذا الدليل يوضح كيفية استخدام Postman Collection الشامل لاختبار جميع نقاط النهاية الخاصة بإدارة الأدمن والداشبورد في منصة ArtHub.

## 📁 الملفات المطلوبة

### 1. Postman Collection
- **الملف:** `docs/api/Admin_Dashboard_Complete_Postman_Collection.json`
- **الوصف:** مجموعة شاملة تحتوي على جميع نقاط النهاية

## 🚀 خطوات الإعداد

### الخطوة 1: استيراد Collection
1. افتح Postman
2. اضغط على "Import" في الأعلى
3. اختر ملف `Admin_Dashboard_Complete_Postman_Collection.json`
4. اضغط "Import"

### الخطوة 2: إعداد المتغيرات
1. افتح Collection
2. اضغط على "Variables" في الأعلى
3. عدل المتغيرات التالية:

```json
{
  "baseUrl": "https://your-api-url.vercel.app/api",
  "adminToken": "",
  "superAdminToken": ""
}
```

### الخطوة 3: تسجيل دخول الأدمن
1. اذهب إلى "🔐 Admin Authentication"
2. اختبر "1. تسجيل دخول الأدمن"
3. سيتم حفظ التوكن تلقائياً

## 📋 قائمة النقاط النهائية

### 🔐 Admin Authentication (4 نقاط)
| الرقم | النقطة | الوصف |
|-------|--------|-------|
| 1 | `POST /admin/login` | تسجيل دخول الأدمن |
| 2 | `GET /admin/profile` | جلب ملف الأدمن الشخصي |
| 3 | `PUT /admin/profile` | تحديث ملف الأدمن الشخصي |
| 4 | `PUT /admin/change-password` | تغيير كلمة المرور الشخصية |

### 👥 إدارة الأدمن (SuperAdmin فقط) (5 نقاط)
| الرقم | النقطة | الوصف |
|-------|--------|-------|
| 1 | `GET /admin/admins` | جلب قائمة جميع الأدمن |
| 2 | `POST /admin/admins` | إنشاء أدمن جديد |
| 3 | `PUT /admin/admins/:id` | تحديث بيانات الأدمن |
| 4 | `DELETE /admin/admins/:id` | حذف الأدمن |
| 5 | `PUT /admin/admins/:id/change-password` | تغيير كلمة مرور الأدمن |

### 👤 إدارة المستخدمين (4 نقاط)
| الرقم | النقطة | الوصف |
|-------|--------|-------|
| 1 | `GET /admin/users` | جلب جميع المستخدمين |
| 2 | `GET /admin/users/:id` | جلب تفاصيل مستخدم محدد |
| 3 | `PATCH /admin/users/:id/block` | حظر/إلغاء حظر مستخدم |
| 4 | `POST /admin/users/:id/send-message` | إرسال رسالة للمستخدم |

### 📊 Dashboard Statistics (3 نقاط)
| الرقم | النقطة | الوصف |
|-------|--------|-------|
| 1 | `GET /dashboard/statistics` | الإحصائيات الرئيسية |
| 2 | `GET /dashboard/charts` | بيانات الرسوم البيانية |
| 3 | `GET /dashboard/artists/performance` | أداء الفنانين |

### 📋 إدارة الطلبات (3 نقاط)
| الرقم | النقطة | الوصف |
|-------|--------|-------|
| 1 | `GET /admin/orders` | جلب جميع الطلبات |
| 2 | `GET /admin/orders/:id` | جلب تفاصيل طلب محدد |
| 3 | `PATCH /admin/orders/:id/status` | تحديث حالة الطلب |

### ⭐ إدارة التقييمات (3 نقاط)
| الرقم | النقطة | الوصف |
|-------|--------|-------|
| 1 | `GET /admin/reviews` | جلب جميع التقييمات |
| 2 | `GET /admin/reviews/:id` | جلب تفاصيل تقييم محدد |
| 3 | `PATCH /admin/reviews/:id/status` | تحديث حالة التقييم |

### 🚨 إدارة البلاغات (3 نقاط)
| الرقم | النقطة | الوصف |
|-------|--------|-------|
| 1 | `GET /admin/reports` | جلب جميع البلاغات |
| 2 | `GET /admin/reports/:id` | جلب تفاصيل بلاغ محدد |
| 3 | `PATCH /admin/reports/:id/status` | تحديث حالة البلاغ |

## 🧪 كيفية الاختبار

### 1. اختبار تسجيل دخول الأدمن
```bash
# البيانات المطلوبة
{
  "email": "admin@example.com",
  "password": "Admin123!"
}

# الاستجابة المتوقعة
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "admin": {
      "_id": "admin_id",
      "email": "admin@example.com",
      "displayName": "مدير",
      "role": "admin"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### 2. اختبار جلب الإحصائيات
```bash
# الطلب
GET /dashboard/statistics
Authorization: Bearer {{adminToken}}

# الاستجابة المتوقعة
{
  "success": true,
  "message": "تم جلب الإحصائيات بنجاح",
  "data": {
    "totalUsers": {
      "value": 12847,
      "percentageChange": 12,
      "isPositive": true
    },
    "activeArtists": {
      "value": 3429,
      "percentageChange": 8,
      "isPositive": true
    },
    "totalRevenue": {
      "value": 1545118,
      "percentageChange": -2.5,
      "isPositive": false,
      "currency": "SAR"
    }
  }
}
```

### 3. اختبار إرسال رسالة للمستخدم
```bash
# الطلب
POST /admin/users/{{user_id}}/send-message
Content-Type: multipart/form-data

# البيانات
subject: "رسالة من إدارة المنصة"
message: "مرحباً، هذه رسالة من إدارة منصة ArtHub"
attachments: [file1.jpg, file2.pdf] (اختياري)

# الاستجابة المتوقعة
{
  "success": true,
  "message": "تم إرسال الرسالة بنجاح",
  "data": {
    "userId": "user_id",
    "userName": "عمر خالد محمد",
    "notificationId": "notification_id",
    "messageType": "system_notification",
    "sentAt": "2025-01-18T10:30:00.000Z",
    "attachmentsCount": 2,
    "attachments": [...],
    "notification": {...}
  }
}
```

## 🔧 المتغيرات المطلوبة

### متغيرات Collection
```json
{
  "baseUrl": "https://your-api-url.vercel.app/api",
  "adminToken": "jwt_token_here",
  "superAdminToken": "superadmin_jwt_token_here"
}
```

### متغيرات Environment (اختيارية)
```json
{
  "user_id": "507f1f77bcf86cd799439011",
  "admin_id": "507f1f77bcf86cd799439012",
  "order_id": "507f1f77bcf86cd799439013",
  "review_id": "507f1f77bcf86cd799439014",
  "report_id": "507f1f77bcf86cd799439015"
}
```

## 🚨 الأخطاء الشائعة وحلولها

### 1. خطأ 401 - غير مصرح
**السبب:** توكن غير صحيح أو منتهي الصلاحية
**الحل:** 
- تأكد من تسجيل دخول صحيح
- تحقق من صحة التوكن
- جدد التوكن إذا لزم الأمر

### 2. خطأ 403 - ممنوع
**السبب:** لا تملك صلاحيات كافية
**الحل:**
- تأكد من أن المستخدم لديه دور `admin` أو `superadmin`
- تحقق من الصلاحيات المطلوبة للنقطة

### 3. خطأ 404 - غير موجود
**السبب:** معرف غير صحيح
**الحل:**
- تحقق من صحة معرف العنصر
- تأكد من وجود العنصر في قاعدة البيانات

### 4. خطأ 400 - بيانات غير صحيحة
**السبب:** بيانات الطلب غير صحيحة
**الحل:**
- تحقق من صحة البيانات المرسلة
- تأكد من تطابق البيانات مع المخطط المطلوب

## 📊 اختبار شامل

### 1. اختبار تسلسلي
```bash
# 1. تسجيل دخول
POST /admin/login

# 2. جلب الإحصائيات
GET /dashboard/statistics

# 3. جلب المستخدمين
GET /admin/users

# 4. إرسال رسالة
POST /admin/users/{{user_id}}/send-message

# 5. جلب الطلبات
GET /admin/orders

# 6. جلب التقييمات
GET /admin/reviews
```

### 2. اختبار الصلاحيات
```bash
# اختبار SuperAdmin فقط
GET /admin/admins
POST /admin/admins
PUT /admin/admins/:id
DELETE /admin/admins/:id

# اختبار Admin و SuperAdmin
GET /admin/users
GET /dashboard/statistics
POST /admin/users/:id/send-message
```

## 🎯 نصائح للاختبار

### 1. ترتيب الاختبار
1. ابدأ دائماً بتسجيل دخول الأدمن
2. اختبر النقاط الأساسية أولاً
3. انتقل للنقاط المتقدمة
4. اختبر الصلاحيات المختلفة

### 2. حفظ البيانات
- احفظ معرفات العناصر المهمة
- استخدم متغيرات Environment
- سجل الاستجابات للتحليل

### 3. اختبار الأخطاء
- اختبر البيانات غير الصحيحة
- اختبر الصلاحيات غير المطلوبة
- اختبر المعرفات غير الموجودة

## 📈 مراقبة الأداء

### 1. وقت الاستجابة
- يجب أن يكون أقل من 2 ثانية
- راقب النقاط البطيئة
- اختبر تحت حمل عالي

### 2. حجم البيانات
- راقب حجم الاستجابات
- اختبر مع بيانات كبيرة
- تحقق من التصفح

### 3. الأمان
- تحقق من صحة التوكن
- اختبر انتهاء صلاحية التوكن
- تحقق من الصلاحيات

## 🔄 التحديثات

### إصدار 1.0.0
- ✅ جميع نقاط النهاية الأساسية
- ✅ اختبارات شاملة
- ✅ توثيق مفصل
- ✅ أمثلة عملية

### التحديثات القادمة
- 🔄 إضافة اختبارات أداء
- 🔄 إضافة اختبارات أمان
- 🔄 إضافة اختبارات تحميل
- 🔄 إضافة اختبارات تكامل

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من التوثيق
2. اختبر النقاط الأساسية
3. تحقق من المتغيرات
4. راجع الأخطاء الشائعة

---

**ملاحظة:** هذا الدليل قابل للتحديث مع إضافة نقاط نهاية جديدة أو تحسينات على النظام. 