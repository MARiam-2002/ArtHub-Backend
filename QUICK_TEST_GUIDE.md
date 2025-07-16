# دليل الاختبار السريع - روابط الأدمن والداشبورد

## ✅ تم إصلاح المشاكل

### المشاكل التي تم حلها:
1. **خطأ 404**: تم إصلاح عدم تطابق المسارات بين Swagger والكود
2. **خطأ 500**: تم إصلاح أسماء الدوال غير المتطابقة
3. **مسارات Swagger**: تم تحديث جميع المسارات من `/api/v1/` إلى `/api/`

## 🧪 اختبار سريع

### 1. اختبار تسجيل دخول الأدمن
```bash
curl -X POST https://your-api-url.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123!"
  }'
```

### 2. اختبار إحصائيات الداشبورد
```bash
curl -X GET https://your-api-url.vercel.app/api/dashboard/statistics \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. اختبار جلب الأدمن
```bash
curl -X GET https://your-api-url.vercel.app/api/admin/admins \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📋 قائمة الروابط المحدثة

### روابط الأدمن
- `POST /api/admin/login` - تسجيل دخول
- `GET /api/admin/profile` - جلب الملف
- `PUT /api/admin/profile` - تحديث الملف
- `PUT /api/admin/change-password` - تغيير كلمة المرور
- `GET /api/admin/admins` - جلب جميع الأدمن
- `POST /api/admin/admins` - إنشاء أدمن جديد
- `PUT /api/admin/admins/:id` - تحديث الأدمن
- `DELETE /api/admin/admins/:id` - حذف الأدمن
- `PUT /api/admin/admins/:id/change-password` - تغيير كلمة مرور الأدمن
- `GET /api/admin/users` - جلب جميع المستخدمين

### روابط الداشبورد
- `GET /api/dashboard/overview` - نظرة عامة
- `GET /api/dashboard/statistics` - إحصائيات
- `GET /api/dashboard/revenue` - إحصائيات الإيرادات
- `GET /api/dashboard/orders/statistics` - إحصائيات الطلبات
- `GET /api/dashboard/charts` - الرسوم البيانية
- `GET /api/dashboard/artists/performance` - أداء الفنانين
- `GET /api/dashboard/users` - إدارة المستخدمين
- `GET /api/dashboard/orders` - إدارة الطلبات
- `GET /api/dashboard/reviews` - إدارة التقييمات
- `POST /api/dashboard/notifications` - إرسال إشعارات
- `GET /api/dashboard/artists/top` - أفضل الفنانين
- `GET /api/dashboard/activities` - سجل الأنشطة

## 🔧 الملفات المحدثة

### Router Files
- `src/modules/admin/admin.router.js`
- `src/modules/dashboard/dashboard.router.js`

### Validation Files
- `src/modules/admin/admin.validation.js`
- `src/modules/dashboard/dashboard.validation.js`

### Controller Files
- `src/modules/admin/admin.controller.js`
- `src/modules/dashboard/dashboard.controller.js`

### Swagger Files
- `src/swagger/admin-swagger.js`
- `src/swagger/dashboard-swagger.js`

## 📁 ملفات الاختبار

1. `test-admin-dashboard.js` - ملف اختبار Node.js
2. `Admin_Dashboard_Fixed_Collection.json` - Postman Collection
3. `ADMIN_DASHBOARD_FIX_SUMMARY.md` - ملخص شامل للإصلاحات

## 🚀 كيفية الاستخدام

### 1. اختبار Postman
1. استورد ملف `Admin_Dashboard_Fixed_Collection.json`
2. عدل متغير `baseUrl` ليطابق رابط API الخاص بك
3. ابدأ باختبار "Admin Login"
4. انسخ التوكن من الاستجابة
5. عدل متغير `adminToken` بالتوكن
6. اختبر باقي الروابط

### 2. اختبار cURL
```bash
# تسجيل دخول
TOKEN=$(curl -s -X POST https://your-api-url.vercel.app/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Admin123!"}' | \
  jq -r '.data.tokens.token')

# اختبار إحصائيات الداشبورد
curl -X GET https://your-api-url.vercel.app/api/dashboard/statistics \
  -H "Authorization: Bearer $TOKEN"
```

## ⚠️ ملاحظات مهمة

1. **التوثيق**: جميع الروابط تتطلب توثيق باستثناء تسجيل الدخول
2. **الصلاحيات**: 
   - الأدمن العادي: يمكنه الوصول لجميع روابط الداشبورد
   - السوبر أدمن: يمكنه إدارة الأدمن الآخرين أيضاً
3. **التحقق من البيانات**: جميع المدخلات يتم التحقق منها
4. **التعامل مع الأخطاء**: جميع الأخطاء يتم التعامل معها بشكل مناسب

## 🔍 استكشاف الأخطاء

إذا واجهت مشاكل:

1. **خطأ 401**: تحقق من صحة التوكن
2. **خطأ 403**: تحقق من الصلاحيات
3. **خطأ 400**: تحقق من صحة البيانات المرسلة
4. **خطأ 500**: راجع سجلات الخادم

## 📞 الدعم

للمساعدة:
- راجع ملف `ADMIN_DASHBOARD_FIX_SUMMARY.md` للحصول على تفاصيل كاملة
- استخدم ملف `test-admin-dashboard.js` للاختبار التلقائي
- تحقق من سجلات الخادم للحصول على تفاصيل الأخطاء 