# Admin Dashboard API Documentation

## نظرة عامة

نظام إدارة الأدمن يتيح للمدير العام (SuperAdmin) إدارة المديرين الآخرين في النظام. النظام يدعم نوعين من الأدوار:

- **SuperAdmin**: المدير العام الذي يمكنه إدارة جميع المديرين
- **Admin**: مدير عادي يمكنه الوصول للداشبورد وإدارة المستخدمين

## النقاط الأساسية

### 1. تسجيل دخول الأدمن
```
POST /api/v1/admin/login
```

**المعاملات المطلوبة:**
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "admin": {
      "_id": "admin_id",
      "email": "admin@example.com",
      "displayName": "مدير",
      "role": "admin",
      "status": "active",
      "isActive": true,
      "isVerified": true,
      "lastActive": "2024-01-01T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "jwt_token",
      "refreshToken": "refresh_token"
    }
  }
}
```

### 2. جلب قائمة المديرين (SuperAdmin فقط)
```
GET /api/v1/admin/admins
```

**المعاملات الاختيارية:**
- `page`: رقم الصفحة (افتراضي: 1)
- `limit`: عدد العناصر في الصفحة (افتراضي: 10)
- `search`: البحث في البريد الإلكتروني أو الاسم
- `role`: تصفية حسب الدور (admin/superadmin)
- `status`: تصفية حسب الحالة (active/inactive/banned)

### 3. إنشاء مدير جديد (SuperAdmin فقط)
```
POST /api/v1/admin/admins
```

**المعاملات المطلوبة:**
```json
{
  "email": "newadmin@example.com",
  "password": "NewAdmin123!",
  "displayName": "مدير جديد",
  "role": "admin"
}
```

### 4. تحديث بيانات المدير (SuperAdmin فقط)
```
PUT /api/v1/admin/admins/:id
```

**المعاملات الاختيارية:**
```json
{
  "displayName": "اسم جديد",
  "status": "active",
  "isActive": true,
  "role": "admin"
}
```

### 5. حذف المدير (SuperAdmin فقط)
```
DELETE /api/v1/admin/admins/:id
```

### 6. تغيير كلمة مرور المدير (SuperAdmin فقط)
```
PUT /api/v1/admin/admins/:id/change-password
```

**المعاملات المطلوبة:**
```json
{
  "newPassword": "NewPassword123!"
}
```

## نقاط الملف الشخصي

### 1. جلب الملف الشخصي
```
GET /api/v1/admin/profile
```

### 2. تحديث الملف الشخصي
```
PUT /api/v1/admin/profile
```

**المعاملات الاختيارية:**
```json
{
  "displayName": "اسم جديد"
}
```

### 3. تغيير كلمة المرور الشخصية
```
PUT /api/v1/admin/change-password
```

**المعاملات المطلوبة:**
```json
{
  "currentPassword": "CurrentPassword123!",
  "newPassword": "NewPassword123!"
}
```



## قواعد الأمان

### كلمة المرور
- يجب أن تكون 8 أحرف على الأقل
- تحتوي على حرف كبير وحرف صغير
- تحتوي على رقم أو رمز خاص

### الصلاحيات
- **SuperAdmin**: يمكنه إدارة جميع المديرين
- **Admin**: يمكنه الوصول للداشبورد وإدارة المستخدمين
- لا يمكن حذف أو تغيير دور SuperAdmin
- لا يمكن حذف المدير العام

## رموز الحالة

- `200`: نجح الطلب
- `201`: تم إنشاء العنصر بنجاح
- `400`: خطأ في البيانات المرسلة
- `401`: غير مصرح (خطأ في تسجيل الدخول)
- `403`: ممنوع (لا توجد صلاحيات كافية)
- `404`: العنصر غير موجود

## أمثلة الاستخدام

### إنشاء SuperAdmin افتراضي
```bash
node scripts/create-superadmin.js
```

### تسجيل دخول الأدمن
```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@arthub.com",
    "password": "SuperAdmin123!"
  }'
```

### إنشاء مدير جديد
```bash
curl -X POST http://localhost:3000/api/v1/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "displayName": "مدير جديد",
    "role": "admin"
  }'
```

## ملاحظات مهمة

1. جميع النقاط تتطلب مصادقة باستثناء تسجيل الدخول
2. بعض العمليات تتطلب صلاحيات SuperAdmin فقط
3. يتم تشفير كلمات المرور تلقائياً
4. يتم تسجيل آخر نشاط للمدير عند تسجيل الدخول
5. الحذف يتم بشكل ناعم (soft delete) للحفاظ على البيانات 