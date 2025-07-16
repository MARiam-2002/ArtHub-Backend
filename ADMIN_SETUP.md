# نظام إدارة الأدمن - دليل الإعداد والاستخدام

## نظرة عامة

تم إنشاء نظام إدارة الأدمن الكامل للداشبورد. النظام يدعم نوعين من الأدوار:

- **SuperAdmin**: المدير العام الذي يمكنه إدارة جميع المديرين
- **Admin**: مدير عادي يمكنه الوصول للداشبورد وإدارة المستخدمين

## الإعداد الأولي

### 1. إنشاء SuperAdmin افتراضي

قم بتشغيل السكريبت التالي لإنشاء مدير عام افتراضي:

```bash
node scripts/create-superadmin.js
```

سيتم إنشاء حساب SuperAdmin بالبيانات التالية:
- **البريد الإلكتروني**: `superadmin@arthub.com`
- **كلمة المرور**: `SuperAdmin123!`
- **الدور**: `superadmin`

### 2. تسجيل الدخول للداشبورد

```bash
curl -X POST http://localhost:3000/api/v1/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@arthub.com",
    "password": "SuperAdmin123!"
  }'
```

## النقاط المتاحة

### للمدير العام (SuperAdmin)

#### 1. إدارة المديرين
- `GET /api/v1/admin/admins` - جلب قائمة المديرين
- `POST /api/v1/admin/admins` - إنشاء مدير جديد
- `PUT /api/v1/admin/admins/:id` - تحديث بيانات المدير
- `DELETE /api/v1/admin/admins/:id` - حذف المدير
- `PUT /api/v1/admin/admins/:id/change-password` - تغيير كلمة مرور المدير

#### 2. إدارة المستخدمين
- `GET /api/v1/admin/users` - جلب قائمة المستخدمين

### للمديرين (Admin & SuperAdmin)

#### 1. الملف الشخصي
- `GET /api/v1/admin/profile` - جلب الملف الشخصي
- `PUT /api/v1/admin/profile` - تحديث الملف الشخصي
- `PUT /api/v1/admin/change-password` - تغيير كلمة المرور الشخصية

#### 2. إدارة المستخدمين
- `GET /api/v1/admin/users` - جلب قائمة المستخدمين

## أمثلة الاستخدام

### إنشاء مدير جديد

```bash
# أولاً، احصل على token من تسجيل الدخول
TOKEN="your_jwt_token_here"

# ثم أنشئ مدير جديد
curl -X POST http://localhost:3000/api/v1/admin/admins \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!",
    "displayName": "مدير جديد",
    "role": "admin"
  }'
```

### جلب قائمة المديرين

```bash
curl -X GET "http://localhost:3000/api/v1/admin/admins?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

### تحديث بيانات المدير

```bash
curl -X PUT http://localhost:3000/api/v1/admin/admins/ADMIN_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "displayName": "اسم جديد",
    "status": "active"
  }'
```

### تغيير كلمة المرور الشخصية

```bash
curl -X PUT http://localhost:3000/api/v1/admin/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "currentPassword": "CurrentPassword123!",
    "newPassword": "NewPassword123!"
  }'
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

## التحقق من الصحة

### كلمة المرور
```javascript
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d|.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/;
```

### البريد الإلكتروني
```javascript
const emailSchema = joi.string()
  .email({ tlds: { allow: false } })
  .required();
```

## رموز الحالة

- `200`: نجح الطلب
- `201`: تم إنشاء العنصر بنجاح
- `400`: خطأ في البيانات المرسلة
- `401`: غير مصرح (خطأ في تسجيل الدخول)
- `403`: ممنوع (لا توجد صلاحيات كافية)
- `404`: العنصر غير موجود

## الملفات المحدثة

1. `src/modules/admin/admin.controller.js` - منطق التحكم
2. `src/modules/admin/admin.router.js` - نقاط النهاية
3. `src/modules/admin/admin.validation.js` - التحقق من الصحة
4. `scripts/create-superadmin.js` - سكريبت إنشاء SuperAdmin
5. `docs/api/admin-dashboard.md` - التوثيق الشامل

## ملاحظات مهمة

1. جميع النقاط تتطلب مصادقة باستثناء تسجيل الدخول
2. بعض العمليات تتطلب صلاحيات SuperAdmin فقط
3. يتم تشفير كلمات المرور تلقائياً
4. يتم تسجيل آخر نشاط للمدير عند تسجيل الدخول
5. الحذف يتم بشكل ناعم (soft delete) للحفاظ على البيانات
6. يمكن للمديرين تغيير كلمات مرورهم الشخصية فقط
7. المدير العام يمكنه تغيير كلمات مرور جميع المديرين

## الخطوات التالية

1. تشغيل سكريبت إنشاء SuperAdmin
2. تسجيل الدخول بالبيانات الافتراضية
3. إنشاء مديرين جدد حسب الحاجة
4. إدارة المستخدمين من خلال الداشبورد 