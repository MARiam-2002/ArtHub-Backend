# Admin Overview Endpoint Documentation

## نظرة عامة على لوحة تحكم الأدمن

### Endpoint
```
GET /api/admin/overview
```

### الوصف
هذا الـ endpoint يوفر نظرة عامة على لوحة تحكم الأدمن مع عرض آخر الطلبات والإحصائيات الأساسية.

### المصادقة
- مطلوبة (Admin/SuperAdmin)
- Bearer Token

### الاستجابة

#### النجاح (200)
```json
{
  "success": true,
  "message": "تم جلب نظرة عامة للوحة التحكم بنجاح",
  "data": {
    "overview": {
      "latestOrders": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "title": "لوحة زيتية مخصصة",
          "artist": {
            "name": "احمد محمد",
            "id": "507f1f77bcf86cd799439012"
          },
          "date": "١٨ - ١ - ٢٠٢٥",
          "price": "٨٥٠",
          "currency": "SAR",
          "status": {
            "en": "completed",
            "ar": "مكتمل",
            "color": "green"
          },
          "requestType": "custom_artwork",
          "description": "طلب لوحة زيتية مخصصة"
        },
        {
          "_id": "507f1f77bcf86cd799439013",
          "title": "لوحة مائية حديثة",
          "artist": {
            "name": "عمر خالد",
            "id": "507f1f77bcf86cd799439014"
          },
          "date": "١٠ - ١١ - ٢٠٢٤",
          "price": "١٬١٨٠",
          "currency": "SAR",
          "status": {
            "en": "rejected",
            "ar": "مرفوض",
            "color": "red"
          },
          "requestType": "custom_artwork",
          "description": "طلب لوحة مائية حديثة"
        },
        {
          "_id": "507f1f77bcf86cd799439015",
          "title": "رسم بالفحم لمنظر طبيعي",
          "artist": {
            "name": "ليلى علي",
            "id": "507f1f77bcf86cd799439016"
          },
          "date": "٥ - ٢ - ٢٠٢٥",
          "price": "٩٩٠",
          "currency": "SAR",
          "status": {
            "en": "in_progress",
            "ar": "قيد التنفيذ",
            "color": "yellow"
          },
          "requestType": "custom_artwork",
          "description": "طلب رسم بالفحم لمنظر طبيعي"
        },
        {
          "_id": "507f1f77bcf86cd799439017",
          "title": "بورتريه كلاسيكي",
          "artist": {
            "name": "سارة محمود",
            "id": "507f1f77bcf86cd799439018"
          },
          "date": "٢٢ - ٣ - ٢٠٢٥",
          "price": "١٬٢٥٠",
          "currency": "SAR",
          "status": {
            "en": "completed",
            "ar": "مكتمل",
            "color": "green"
          },
          "requestType": "custom_artwork",
          "description": "طلب بورتريه كلاسيكي"
        }
      ],
      "statistics": {
        "totalUsers": 12847,
        "totalArtists": 3429,
        "totalOrders": 1243,
        "totalRevenue": 1545118,
        "activeUsers": 10234,
        "completedOrders": 856
      }
    },
    "currency": "SAR",
    "lastUpdated": "2025-01-18T10:30:00.000Z"
  }
}
```

### تفاصيل البيانات

#### latestOrders
مصفوفة تحتوي على آخر 4 طلبات في النظام:

- **title**: عنوان الطلب
- **artist.name**: اسم الفنان
- **artist.id**: معرف الفنان
- **date**: تاريخ الطلب (مُنسق باللغة العربية)
- **price**: السعر (مُنسق باللغة العربية)
- **currency**: العملة
- **status.en**: حالة الطلب بالإنجليزية
- **status.ar**: حالة الطلب بالعربية
- **status.color**: لون الحالة (green, red, yellow, blue, gray)
- **requestType**: نوع الطلب
- **description**: وصف الطلب

#### statistics
إحصائيات عامة للنظام:

- **totalUsers**: إجمالي المستخدمين
- **totalArtists**: إجمالي الفنانين
- **totalOrders**: إجمالي الطلبات
- **totalRevenue**: إجمالي الإيرادات
- **activeUsers**: المستخدمين النشطين
- **completedOrders**: الطلبات المكتملة

### حالات الطلبات

| الحالة بالإنجليزية | الحالة بالعربية | اللون |
|-------------------|-----------------|-------|
| completed | مكتمل | green |
| rejected/cancelled | مرفوض | red |
| in_progress/pending | قيد التنفيذ | yellow |
| accepted | مقبول | blue |
| others | قيد المراجعة | gray |

### أمثلة الاستخدام

#### cURL
```bash
curl -X GET "http://localhost:3000/api/admin/overview" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json"
```

#### JavaScript
```javascript
const response = await fetch('/api/admin/overview', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data.data.overview.latestOrders);
```

#### Postman
1. Method: GET
2. URL: `{{base_url}}/api/admin/overview`
3. Headers:
   - Authorization: Bearer {{access_token}}
   - Content-Type: application/json

### الأخطاء المحتملة

#### 401 - Unauthorized
```json
{
  "success": false,
  "message": "غير مصرح",
  "data": null
}
```

#### 403 - Forbidden
```json
{
  "success": false,
  "message": "ممنوع - للمديرين فقط",
  "data": null
}
```

### ملاحظات
- يعرض آخر 4 طلبات فقط
- التواريخ مُنسقة باللغة العربية
- الأسعار مُنسقة باللغة العربية
- حالات الطلبات مترجمة للعربية
- الإحصائيات محدثة في الوقت الفعلي 