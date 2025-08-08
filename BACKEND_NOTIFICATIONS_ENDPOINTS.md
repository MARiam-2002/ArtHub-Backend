# 🔔 Backend Endpoints للإشعارات

## 📋 **Endpoints المتاحة:**

### **1. تسجيل FCM Token:**
```
POST /api/notifications/token
```

**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Body:**
```json
{
  "token": "fMEP0vJqSkqOnFNj5P-2d:APA91bHqX...",
  "deviceType": "android"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل رمز الإشعارات بنجاح",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "token": "fMEP0vJqSkqOnFNj5P-2d:APA91bHqX...",
    "deviceType": "android",
    "registeredAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### **2. إلغاء تسجيل FCM Token:**
```
DELETE /api/notifications/token
```

**Headers:**
```
Authorization: Bearer {user_token}
Content-Type: application/json
```

**Body:**
```json
{
  "token": "fMEP0vJqSkqOnFNj5P-2d:APA91bHqX...",
  "deviceType": "android"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إلغاء تسجيل رمز الإشعارات بنجاح"
}
```

### **3. جلب FCM Tokens للمستخدم:**
```
GET /api/notifications/token
```

**Headers:**
```
Authorization: Bearer {user_token}
```

**Response:**
```json
{
  "success": true,
  "message": "تم جلب رموز الإشعارات بنجاح",
  "data": {
    "tokens": [
      "fMEP0vJqSkqOnFNj5P-2d:APA91bHqX...",
      "another_token_here..."
    ],
    "count": 2
  }
}
```

### **4. اختبار الإشعارات (للـ Admin):**
```
POST /api/notifications/test
```

**Headers:**
```
Authorization: Bearer {admin_token}
Content-Type: application/json
```

**Body:**
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "title": "اختبار الإشعارات",
  "body": "هذا اختبار للإشعارات"
}
```

## 📱 **أنواع الإشعارات:**

### **1. إشعارات المحادثة:**
```json
{
  "title": "محمد أحمد",
  "body": "مرحباً، كيف حالك؟",
  "data": {
    "screen": "CHAT_DETAIL",
    "chatId": "chat-id",
    "senderId": "sender-id",
    "type": "chat_message",
    "timestamp": "1234567890"
  }
}
```

### **2. إشعارات التعليقات:**
```json
{
  "title": "تعليق جديد",
  "body": "قام أحمد بالتعليق على \"لوحة فنية\"",
  "data": {
    "screen": "ARTWORK_DETAIL",
    "artworkId": "artwork-id",
    "commenterId": "commenter-id",
    "type": "new_comment",
    "timestamp": "1234567890"
  }
}
```

### **3. إشعارات المتابعين:**
```json
{
  "title": "متابع جديد",
  "body": "بدأ محمد بمتابعتك",
  "data": {
    "screen": "PROFILE_FOLLOWERS",
    "followerId": "follower-id",
    "type": "new_follower",
    "timestamp": "1234567890"
  }
}
```

### **4. إشعارات المعاملات:**
```json
{
  "title": "عملية شراء ناجحة",
  "body": "تم شراء \"لوحة فنية\" بنجاح بمبلغ 100$",
  "data": {
    "screen": "TRANSACTION_DETAILS",
    "type": "transaction",
    "transactionType": "purchase",
    "timestamp": "1234567890"
  }
}
```

## 🔧 **كود Flutter للاستخدام:**

### **تسجيل FCM Token:**
```dart
Future<void> registerFCMToken(String fcmToken) async {
  try {
    final response = await http.post(
      Uri.parse('https://arthub-backend.up.railway.app/api/notifications/token'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': fcmToken,
        'deviceType': 'android'
      }),
    );
    
    if (response.statusCode == 200) {
      print('✅ FCM token registered successfully');
    } else {
      print('❌ Failed to register FCM token');
    }
  } catch (e) {
    print('❌ Error: $e');
  }
}
```

### **إلغاء تسجيل FCM Token:**
```dart
Future<void> unregisterFCMToken(String fcmToken) async {
  try {
    final response = await http.delete(
      Uri.parse('https://arthub-backend.up.railway.app/api/notifications/token'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': fcmToken,
        'deviceType': 'android'
      }),
    );
    
    if (response.statusCode == 200) {
      print('✅ FCM token unregistered successfully');
    } else {
      print('❌ Failed to unregister FCM token');
    }
  } catch (e) {
    print('❌ Error: $e');
  }
}
```

### **جلب FCM Tokens:**
```dart
Future<List<String>> getUserFCMTokens() async {
  try {
    final response = await http.get(
      Uri.parse('https://arthub-backend.up.railway.app/api/notifications/token'),
      headers: {
        'Authorization': 'Bearer $userToken',
      },
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return List<String>.from(data['data']['tokens']);
    } else {
      print('❌ Failed to get FCM tokens');
      return [];
    }
  } catch (e) {
    print('❌ Error: $e');
    return [];
  }
}
```

## 🚨 **أخطاء شائعة:**

### **1. خطأ 401 - Unauthorized:**
- تأكد من إرسال `Authorization` header صحيح
- تأكد من صلاحية token المستخدم

### **2. خطأ 400 - Bad Request:**
- تأكد من صحة format الـ JSON
- تأكد من إرسال جميع الحقول المطلوبة

### **3. خطأ 404 - Not Found:**
- تأكد من صحة URL
- تأكد من أن المستخدم موجود

### **4. خطأ 500 - Internal Server Error:**
- تحقق من logs الـ server
- تأكد من إعدادات Firebase

## 📊 **معلومات مهمة:**

### **Base URL:**
```
https://arthub-backend.up.railway.app
```

### **FCM Token Format:**
```
fMEP0vJqSkqOnFNj5P-2d:APA91bHqX...
```

### **Device Types:**
- `android` - للأجهزة Android
- `ios` - للأجهزة iOS

### **Notification Channels:**
- `arthub_channel` - القناة الرئيسية للإشعارات

---

**ملاحظة:** تأكد من استبدال `{user_token}` و `{admin_token}` بـ tokens حقيقية.
