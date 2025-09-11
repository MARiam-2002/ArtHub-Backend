# API تحديث حالة الطلب الخاص

## نظرة عامة

هذا API يسمح للفنان بتحديث حالة الطلب الخاص إلى أي حالة متاحة.

## الـ Endpoint

```
PATCH /api/special-requests/{requestId}/status
```

## المصادقة

- **مطلوب:** Bearer Token
- **الصلاحية:** فنان فقط (`role: 'artist'`)
- **التحقق:** يجب أن يكون الطلب مخصص لهذا الفنان

## المعاملات

### Path Parameters

| المعامل | النوع | مطلوب | الوصف | مثال |
|---------|-------|--------|--------|------|
| `requestId` | string | ✅ | معرف الطلب الخاص | `60d0fe4f5311236168a109ca` |

### Request Body

| الحقل | النوع | مطلوب | الوصف | مثال |
|-------|-------|--------|--------|------|
| `status` | string | ✅ | الحالة الجديدة | `"accepted"` |

### الحالات المتاحة

| الحالة | الوصف |
|--------|--------|
| `pending` | في الانتظار |
| `accepted` | مقبول |
| `rejected` | مرفوض |
| `in_progress` | قيد التنفيذ |
| `review` | قيد المراجعة |
| `completed` | مكتمل |
| `cancelled` | ملغي |

## أمثلة الاستخدام

### 1. قبول الطلب

```bash
curl -X PATCH "http://localhost:3000/api/special-requests/60d0fe4f5311236168a109ca/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "accepted"
  }'
```

### 2. بدء العمل

```bash
curl -X PATCH "http://localhost:3000/api/special-requests/60d0fe4f5311236168a109ca/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in_progress"
  }'
```

### 3. إكمال الطلب

```bash
curl -X PATCH "http://localhost:3000/api/special-requests/60d0fe4f5311236168a109ca/status" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

## الاستجابة

### نجح التحديث (200)

```json
{
  "success": true,
  "message": "تم تحديث حالة الطلب إلى \"مقبول\" بنجاح",
  "data": {
    "specialRequest": {
      "_id": "60d0fe4f5311236168a109ca",
      "status": "accepted",
      "updatedAt": "2024-01-08T10:00:00.000Z"
    }
  },
  "meta": {
    "timestamp": "2024-01-08T10:00:00.000Z",
    "userId": "60d0fe4f5311236168a109ca"
  }
}
```

### خطأ في البيانات (400)

```json
{
  "success": false,
  "message": "حالة الطلب غير صالحة"
}
```

### غير مصرح (401)

```json
{
  "success": false,
  "message": "غير مصرح - يرجى تسجيل الدخول"
}
```

### غير مصرح - ليس فنان (403)

```json
{
  "success": false,
  "message": "غير مصرح لك بتحديث حالة الطلب"
}
```

### الطلب غير موجود (404)

```json
{
  "success": false,
  "message": "الطلب غير موجود"
}
```

### خطأ في الخادم (500)

```json
{
  "success": false,
  "message": "حدث خطأ أثناء تحديث حالة الطلب"
}
```

## للفلتر (Flutter)

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class SpecialRequestService {
  static const String baseURL = 'http://localhost:3000';
  
  Future<Map<String, dynamic>> updateOrderStatus(
    String requestId,
    String status,
  ) async {
    final url = Uri.parse('$baseURL/api/special-requests/$requestId/status');
    
    final body = <String, dynamic>{
      'status': status,
    };
    
    final response = await http.patch(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode(body),
    );
    
    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to update order status: ${response.body}');
    }
  }
}

// مثال على الاستخدام
final service = SpecialRequestService();

// قبول الطلب
await service.updateOrderStatus(
  '60d0fe4f5311236168a109ca',
  'accepted',
);

// بدء العمل
await service.updateOrderStatus(
  '60d0fe4f5311236168a109ca',
  'in_progress',
);

// إكمال الطلب
await service.updateOrderStatus(
  '60d0fe4f5311236168a109ca',
  'completed',
);
```

## الميزات الإضافية

- ✅ **إشعارات تلقائية** للعميل عند تغيير الحالة
- ✅ **تسجيل التواريخ** (acceptedAt, startedAt, completedAt)
- ✅ **التحقق من الصلاحيات** (فنان فقط)
- ✅ **التحقق من صحة البيانات** (validation)
- ✅ **تتبع التقدم** (currentProgress)

## توثيق Swagger

يمكنك رؤية التوثيق الكامل في Swagger UI:
- **URL:** `http://localhost:3000/api-docs`
- **Tag:** SpecialRequest
- **Endpoint:** `PATCH /api/special-requests/{requestId}/status`

## الاختبار

يمكنك استخدام سكريبت الاختبار:
```bash
node scripts/test-swagger-status-update.js
```

أو سكريبت الاختبار العام:
```bash
node scripts/test-order-status-update.js
```
