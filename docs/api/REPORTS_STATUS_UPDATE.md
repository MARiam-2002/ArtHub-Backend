# تحديث حالة البلاغ - Reports Status Update

## نظرة عامة
Endpoint لتحديث حالة البلاغ وإضافة ملاحظات المدير. يمكن للمديرين تحديث حالة البلاغ من `pending` إلى `resolved`، `rejected`، أو `reviewed`.

## Endpoint
```
PATCH /api/admin/reports/:id/status
```

## المميزات
- ✅ تحديث حالة البلاغ
- ✅ إضافة ملاحظات المدير (اختياري)
- ✅ تحديث تلقائي لتاريخ الحل عند الحل
- ✅ التحقق من صحة الحالة
- ✅ صلاحيات للمديرين فقط

## الحالات المتاحة
| الحالة | الوصف | النص العربي |
|--------|--------|-------------|
| `pending` | تحت المراجعة | تحت المراجعة |
| `resolved` | تم الحل | تم الحل |
| `rejected` | مرفوض | مرفوض |
| `reviewed` | تمت المراجعة | تمت المراجعة |

## الطلب (Request)

### Headers
```
Authorization: Bearer {ADMIN_TOKEN}
Content-Type: application/json
```

### Parameters
| المعامل | النوع | مطلوب | الوصف |
|---------|-------|--------|--------|
| `id` | string | ✅ | معرف البلاغ |

### Body
```json
{
  "status": "resolved",
  "adminNotes": "تم حل المشكلة مع العميل"
}
```

#### Body Fields
| الحقل | النوع | مطلوب | الوصف |
|-------|-------|--------|--------|
| `status` | string | ✅ | الحالة الجديدة للبلاغ |
| `adminNotes` | string | ❌ | ملاحظات المدير (حد أقصى 1000 حرف) |

## الاستجابة (Response)

### نجح التحديث (200)
```json
{
  "success": true,
  "message": "تم تحديث حالة البلاغ بنجاح",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "resolved",
    "statusText": "تم الحل",
    "adminNotes": "تم حل المشكلة مع العميل",
    "resolvedAt": "2025-01-18T10:30:00.000Z",
    "updatedAt": "2025-01-18T10:30:00.000Z"
  }
}
```

### خطأ في البيانات (400)
```json
{
  "success": false,
  "message": "حالة البلاغ غير صالحة",
  "data": null
}
```

### البلاغ غير موجود (404)
```json
{
  "success": false,
  "message": "البلاغ غير موجود",
  "data": null
}
```

## أمثلة الاستخدام

### مثال 1: حل البلاغ
```bash
curl -X PATCH "http://localhost:5000/api/admin/reports/507f1f77bcf86cd799439011/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved",
    "adminNotes": "تم التواصل مع الفنان وحل المشكلة"
  }'
```

### مثال 2: رفض البلاغ
```bash
curl -X PATCH "http://localhost:5000/api/admin/reports/507f1f77bcf86cd799439011/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "rejected",
    "adminNotes": "تم رفض البلاغ لعدم كفاية الأدلة"
  }'
```

### مثال 3: تحديث بدون ملاحظات
```bash
curl -X PATCH "http://localhost:5000/api/admin/reports/507f1f77bcf86cd799439011/status" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "reviewed"
  }'
```

## ملاحظات مهمة

1. **الصلاحيات**: يتطلب صلاحيات مدير أو مدير عام
2. **تاريخ الحل**: يتم تحديث `resolvedAt` تلقائياً عند تغيير الحالة إلى `resolved`
3. **الملاحظات**: حقل `adminNotes` اختياري ويمكن تركه فارغاً
4. **التحقق**: يتم التحقق من صحة معرف البلاغ والحالة قبل التحديث
5. **التسجيل**: يتم تسجيل `updatedAt` تلقائياً

## الاختبار

يمكنك استخدام الملفات التالية لاختبار الـ endpoint:

- `scripts/test-update-report-status.js` - اختبار شامل لتحديث الحالات
- `scripts/test-reports-endpoint.js` - اختبار عام مع تحديث الحالة

## التكامل مع Swagger

تم إضافة التوثيق الكامل في Swagger تحت tag `Reports Management` مع جميع التفاصيل والأمثلة.
