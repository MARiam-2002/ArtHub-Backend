# 🚨 إصلاح سريع لمشكلة رسائل الأدمن

## 📋 **المشكلة:**
رسائل الأدمن لا تصل كـ push notifications في Flutter.

## 🔧 **الأسباب والحلول:**

### **المشكلة 1: دالة sendPushNotification غير موجودة**
**الحل:** ✅ **تم إصلاحه**
- تم تغيير `sendPushNotification` إلى `sendPushNotificationToUser`
- تم إضافة `admin_message` إلى notification types

### **المشكلة 2: FCM Token محذوف**
**الحل:** إعادة إضافة FCM token
```bash
# 1. أضف FCM token يدوياً
node scripts/add-fcm-token-manually.js

# 2. أو أعد تسجيله من Flutter
# طبق الكود في FLUTTER_FCM_TOKEN_FIX.md
```

### **المشكلة 3: إعدادات الإشعارات**
**الحل:** تأكد من إعدادات المستخدم
```javascript
// في قاعدة البيانات، تأكد من:
user.notificationSettings = {
  enablePush: true,
  enableEmail: true
}
```

## 🧪 **اختبار سريع:**

### **1. اختبار إرسال رسالة من الأدمن:**
```bash
# تأكد من وجود ADMIN_TOKEN في .env
node scripts/test-admin-message.js
```

### **2. فحص FCM Tokens:**
```bash
node scripts/check-fcm-tokens.js
```

### **3. اختبار الإشعارات:**
```bash
node scripts/test-notifications-final.js
```

## 📱 **كود Flutter المطلوب:**

### **1. إعداد الإشعارات:**
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // إعداد الإشعارات
  await initializeLocalNotifications();
  await requestNotificationPermissions();
  await getFCMToken();
  setupNotifications();
  
  runApp(MyApp());
}
```

### **2. معالجة الإشعارات الإدارية:**
```dart
void setupNotifications() {
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('📱 Foreground message received');
    
    // التحقق من نوع الإشعار
    final data = message.data;
    final type = data['type'];
    
    if (type == 'admin_message') {
      // إشعار إداري
      showLocalNotification(
        title: message.notification?.title ?? 'رسالة إدارية',
        body: message.notification?.body ?? '',
        payload: jsonEncode(data),
      );
    } else {
      // إشعارات أخرى
      showLocalNotification(
        title: message.notification?.title ?? 'رسالة جديدة',
        body: message.notification?.body ?? '',
        payload: jsonEncode(data),
      );
    }
  });
}
```

### **3. معالجة النقر على الإشعار:**
```dart
void handleNotificationTap(Map<String, dynamic> data) {
  final type = data['type'];
  final screen = data['screen'];
  
  switch (type) {
    case 'admin_message':
      // انتقل إلى صفحة الإشعارات أو الرسائل الإدارية
      Navigator.pushNamed(context, '/notifications');
      break;
    case 'chat_message':
      // انتقل إلى المحادثة
      final chatId = data['chatId'];
      Navigator.pushNamed(context, '/chat', arguments: {'chatId': chatId});
      break;
    default:
      // انتقل إلى الشاشة الافتراضية
      break;
  }
}
```

## 🎯 **الخطوات المطلوبة:**

1. **تأكد من وجود FCM token** للمستخدم
2. **تطبيق الإصلاحات** في Backend
3. **تطبيق الكود** في Flutter
4. **اختبار إرسال رسالة** من الأدمن
5. **فحص وصول الإشعار** في Flutter

## ✅ **النتيجة المتوقعة:**
بعد تطبيق الحلول، يجب أن:
- ✅ رسائل الأدمن تصل كـ push notifications
- ✅ الإشعارات تظهر في Flutter
- ✅ النقر على الإشعار ينقل للصفحة الصحيحة

## 🔍 **نقاط مهمة:**

1. **تأكد من صلاحيات الإشعارات** في Flutter
2. **تأكد من إعدادات المستخدم** في قاعدة البيانات
3. **تأكد من وجود FCM token** صحيح
4. **تأكد من أن التطبيق ليس في battery optimization**

---

**تاريخ التحديث:** يناير 2024  
**المطور:** فريق ArtHub  
**الإصدار:** 1.0.8
