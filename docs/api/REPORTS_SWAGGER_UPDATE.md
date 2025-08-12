# تحديث Swagger - إضافة endpoints البلاغات

## نظرة عامة
تم إضافة قسم كامل لإدارة البلاغات في ملف Swagger الرئيسي `arthub-swagger.json` مع جميع الـ endpoints المطلوبة.

## الـ Endpoints المضافة

### 1. جلب جميع البلاغات
```
GET /api/admin/reports
```
- **الوصف**: جلب قائمة جميع البلاغات مع التفاصيل الأساسية
- **المعاملات**: `page`, `limit`
- **الصلاحيات**: المديرين فقط
- **Tag**: Reports Management

### 2. جلب تفاصيل بلاغ محدد
```
GET /api/admin/reports/{id}
```
- **الوصف**: جلب تفاصيل كاملة لبلاغ محدد
- **المعاملات**: `id` (معرف البلاغ)
- **الصلاحيات**: المديرين فقط
- **Tag**: Reports Management

### 3. حذف بلاغ
```
DELETE /api/admin/reports/{id}
```
- **الوصف**: حذف بلاغ محدد من النظام
- **المعاملات**: `id` (معرف البلاغ)
- **الصلاحيات**: المديرين فقط
- **Tag**: Reports Management

### 4. تحديث حالة البلاغ ⭐
```
PATCH /api/admin/reports/{id}/status
```
- **الوصف**: تحديث حالة البلاغ فقط
- **المعاملات**: `id` (معرف البلاغ)
- **Body**: `status` (الحالة الجديدة)
- **الحالات المتاحة**: `pending`, `resolved`, `rejected`, `reviewed`
- **الصلاحيات**: المديرين فقط
- **Tag**: Reports Management

## المميزات

✅ **توثيق شامل**: جميع الـ endpoints موثقة بالكامل مع Swagger  
✅ **أمثلة واقعية**: بيانات مثال واقعية للاختبار  
✅ **استجابات مفصلة**: جميع حالات الاستجابة موثقة  
✅ **أمان**: متطلبات المصادقة والصلاحيات موضحة  
✅ **تنظيم**: جميع endpoints تحت tag واحد "Reports Management"  

## التكامل مع Swagger

تم إضافة جميع الـ endpoints في ملف `src/swagger/arthub-swagger.json` في قسم `paths` مع:

- **Tags**: Reports Management
- **Security**: BearerAuth
- **Parameters**: مفصلة ومحددة
- **Request Body**: للـ PATCH endpoint
- **Responses**: جميع حالات الاستجابة (200, 400, 401, 403, 404)
- **Schemas**: هياكل البيانات مفصلة

## الاختبار

يمكن اختبار جميع الـ endpoints من خلال:

1. **Swagger UI**: عرض التوثيق التفاعلي
2. **Postman**: استيراد من Swagger
3. **ملفات الاختبار**: `scripts/test-update-report-status.js`

## ملاحظات مهمة

- جميع الـ endpoints تتطلب مصادقة (Bearer Token)
- الصلاحيات مقتصرة على المديرين فقط
- endpoint تحديث الحالة يحتوي فقط على حقل `status` (بدون `adminNotes`)
- تم إضافة جميع الـ responses والـ error codes المطلوبة

## الملفات المحدثة

- `src/swagger/arthub-swagger.json` - إضافة endpoints البلاغات
- `src/modules/admin/reports-management.controller.js` - دالة تحديث الحالة
- `src/modules/admin/reports-management.router.js` - route تحديث الحالة
- `src/modules/admin/reports-management.validation.js` - validation schema

## التالي

الآن يمكن للمطورين:
1. رؤية جميع endpoints البلاغات في Swagger
2. اختبار الـ endpoints مباشرة من Swagger UI
3. استخدام التوثيق لبناء واجهات المستخدم
4. استيراد الـ endpoints في Postman أو أي أداة اختبار أخرى
