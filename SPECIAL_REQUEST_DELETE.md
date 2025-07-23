# Special Request Delete - حذف الطلبات الخاصة

## 🎯 **الوظيفة:**
حذف طلب خاص نهائياً من النظام مع التحقق من الصلاحيات والحالة.

## 📋 **الميزات:**

### ✅ **الصلاحيات:**
- **صاحب الطلب:** يمكنه حذف الطلبات المرفوضة أو الملغاة أو الحذف الإجباري
- **الفنان:** يمكنه حذف الطلبات المرفوضة أو الملغاة فقط

### ✅ **الحالات المسموحة للحذف:**
- `pending` - معلق
- `rejected` - مرفوض  
- `cancelled` - ملغي
- `forceDelete` - حذف إجباري (لصاحب الطلب فقط)

### ✅ **التحققات:**
- ✅ التحقق من صحة معرف الطلب
- ✅ التحقق من وجود الطلب
- ✅ التحقق من صلاحيات المستخدم
- ✅ التحقق من حالة الطلب
- ✅ إرسال إشعار للطرف الآخر

## 🔧 **API Endpoint:**

### **DELETE** `/api/special-requests/{requestId}`

#### **Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

#### **Parameters:**
- `requestId` (path): معرف الطلب (MongoDB ObjectId)

#### **Request Body (اختياري):**
```json
{
  "reason": "سبب الحذف (اختياري)",
  "forceDelete": false
}
```

#### **Response (200):**
```json
{
  "success": true,
  "message": "تم حذف الطلب بنجاح",
  "data": {
    "deletedRequestId": "64f1a2b3c4d5e6f7g8h9i0j1",
    "deletedRequestInfo": {
      "requestId": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "لوحة فنية زهرية زرقاء",
      "status": "rejected",
      "deletedBy": "64f1a2b3c4d5e6f7g8h9i0j2",
      "deletedAt": "2024-01-24T11:23:45.678Z",
      "reason": "تم إلغاء الطلب لعدم الحاجة"
    },
    "deletedBy": "owner"
  },
  "meta": {
    "timestamp": "2024-01-24T11:23:45.678Z",
    "userId": "64f1a2b3c4d5e6f7g8h9i0j2",
    "forceDelete": false
  }
}
```

#### **Error Responses:**

**400 - لا يمكن حذف الطلب:**
```json
{
  "success": false,
  "message": "لا يمكن حذف الطلب في حالته الحالية. يمكن حذف الطلبات المرفوضة أو الملغاة فقط.",
  "data": {
    "currentStatus": "accepted",
    "allowedStatuses": ["pending", "rejected", "cancelled"]
  }
}
```

**403 - غير مصرح:**
```json
{
  "success": false,
  "message": "غير مصرح لك بحذف هذا الطلب",
  "data": null
}
```

**404 - الطلب غير موجود:**
```json
{
  "success": false,
  "message": "الطلب غير موجود",
  "data": null
}
```

## 🛡️ **الأمان:**

### **التحققات:**
- ✅ التحقق من صحة معرف الطلب (MongoDB ObjectId)
- ✅ التحقق من وجود الطلب في قاعدة البيانات
- ✅ التحقق من أن المستخدم هو صاحب الطلب أو الفنان
- ✅ التحقق من حالة الطلب قبل الحذف
- ✅ منع الحذف الإجباري للفنان

### **الإشعارات:**
- ✅ إرسال إشعار للطرف الآخر عند الحذف
- ✅ تسجيل معلومات الحذف للأرشفة
- ✅ تسجيل سبب الحذف (إذا تم توفيره)

## 📱 **استخدام Flutter:**

### **حذف طلب عادي:**
```dart
Future<void> deleteRequest(String requestId) async {
  try {
    final response = await http.delete(
      Uri.parse('$baseUrl/api/special-requests/$requestId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );
    
    if (response.statusCode == 200) {
      // تم الحذف بنجاح
      showSuccessMessage('تم حذف الطلب بنجاح');
    }
  } catch (e) {
    // معالجة الخطأ
    showErrorMessage('حدث خطأ أثناء حذف الطلب');
  }
}
```

### **حذف مع سبب:**
```dart
Future<void> deleteRequestWithReason(String requestId, String reason) async {
  try {
    final response = await http.delete(
      Uri.parse('$baseUrl/api/special-requests/$requestId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'reason': reason,
      }),
    );
    
    if (response.statusCode == 200) {
      // تم الحذف بنجاح
      showSuccessMessage('تم حذف الطلب بنجاح');
    }
  } catch (e) {
    // معالجة الخطأ
    showErrorMessage('حدث خطأ أثناء حذف الطلب');
  }
}
```

### **حذف إجباري (لصاحب الطلب فقط):**
```dart
Future<void> forceDeleteRequest(String requestId) async {
  try {
    final response = await http.delete(
      Uri.parse('$baseUrl/api/special-requests/$requestId'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'forceDelete': true,
        'reason': 'حذف إجباري من قبل صاحب الطلب',
      }),
    );
    
    if (response.statusCode == 200) {
      // تم الحذف بنجاح
      showSuccessMessage('تم حذف الطلب بنجاح');
    }
  } catch (e) {
    // معالجة الخطأ
    showErrorMessage('حدث خطأ أثناء حذف الطلب');
  }
}
```

## 🎨 **واجهة المستخدم:**

### **قائمة الطلبات مع خيار الحذف:**
- عرض زر الحذف للطلبات المرفوضة أو الملغاة
- تأكيد الحذف قبل التنفيذ
- إمكانية إدخال سبب الحذف
- عرض رسالة نجاح أو خطأ

### **حالات الحذف:**
- **صاحب الطلب:** يمكنه حذف الطلبات المرفوضة/الملغاة + الحذف الإجباري
- **الفنان:** يمكنه حذف الطلبات المرفوضة/الملغاة فقط
- **إشعار للطرف الآخر:** عند الحذف

## 🚀 **الحالة:**
✅ **تم تطوير الوظيفة بنجاح**
✅ **validation شامل ومحسن**
✅ **Swagger documentation محدث**
✅ **دعم Flutter كامل**
✅ **أمان عالي**
✅ **إشعارات متكاملة** 