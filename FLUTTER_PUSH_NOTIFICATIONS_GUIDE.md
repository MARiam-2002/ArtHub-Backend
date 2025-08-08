# 📱 دليل Push Notifications للمطور Flutter

## 📋 **المتطلبات الأساسية:**

### **1. إعداد Firebase في Flutter:**

```yaml
# pubspec.yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
```

### **2. تهيئة Firebase:**

```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  runApp(MyApp());
}
```

## 🔧 **خطوات التطبيق:**

### **الخطوة 1: طلب إذن الإشعارات**

```dart
// في main.dart أو عند بدء التطبيق
Future<void> requestNotificationPermissions() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  // طلب إذن الإشعارات
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
    provisional: false,
  );
  
  print('User granted permission: ${settings.authorizationStatus}');
}
```

### **الخطوة 2: الحصول على FCM Token**

```dart
Future<String?> getFCMToken() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  // الحصول على FCM token
  String? token = await messaging.getToken();
  
  if (token != null) {
    print('FCM Token: $token');
    // إرسال token للـ backend
    await sendTokenToBackend(token);
  }
  
  return token;
}
```

### **الخطوة 3: إرسال Token للـ Backend**

```dart
Future<void> sendTokenToBackend(String fcmToken) async {
  try {
    final response = await http.post(
      Uri.parse('${baseUrl}/api/notifications/token'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': fcmToken,
        'deviceType': 'android' // أو 'ios'
      }),
    );
    
    if (response.statusCode == 200) {
      print('✅ FCM token registered successfully');
    } else {
      print('❌ Failed to register FCM token: ${response.statusCode}');
    }
  } catch (e) {
    print('❌ Error registering FCM token: $e');
  }
}
```

### **الخطوة 4: إعداد معالجة الإشعارات**

```dart
// في main.dart
void setupNotifications() {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  // معالجة الإشعارات عندما يكون التطبيق مفتوح
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');
    
    if (message.notification != null) {
      print('Message also contained a notification: ${message.notification}');
      // عرض الإشعار محلياً
      showLocalNotification(message);
    }
  });
  
  // معالجة الإشعارات عند النقر عليها
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('A new onMessageOpenedApp event was published!');
    print('Message data: ${message.data}');
    
    // التنقل إلى الشاشة المطلوبة
    navigateToScreen(message.data);
  });
  
  // معالجة الإشعارات عند فتح التطبيق من الإشعار
  messaging.getInitialMessage().then((RemoteMessage? message) {
    if (message != null) {
      print('App opened from notification');
      print('Message data: ${message.data}');
      navigateToScreen(message.data);
    }
  });
}
```

### **الخطوة 5: عرض الإشعارات المحلية**

```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

Future<void> initializeLocalNotifications() async {
  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');
      
  const DarwinInitializationSettings initializationSettingsIOS =
      DarwinInitializationSettings();
      
  const InitializationSettings initializationSettings =
      InitializationSettings(
    android: initializationSettingsAndroid,
    iOS: initializationSettingsIOS,
  );
  
  await flutterLocalNotificationsPlugin.initialize(
    initializationSettings,
    onDidReceiveNotificationResponse: onNotificationTapped,
  );
}

Future<void> showLocalNotification(RemoteMessage message) async {
  const AndroidNotificationDetails androidPlatformChannelSpecifics =
      AndroidNotificationDetails(
    'arthub_channel',
    'ArtHub Notifications',
    channelDescription: 'Notifications from ArtHub app',
    importance: Importance.max,
    priority: Priority.high,
    showWhen: true,
  );
  
  const NotificationDetails platformChannelSpecifics =
      NotificationDetails(android: androidPlatformChannelSpecifics);
      
  await flutterLocalNotificationsPlugin.show(
    message.hashCode,
    message.notification?.title,
    message.notification?.body,
    platformChannelSpecifics,
    payload: jsonEncode(message.data),
  );
}
```

### **الخطوة 6: التنقل بناءً على الإشعارات**

```dart
void navigateToScreen(Map<String, dynamic> data) {
  final String screen = data['screen'] ?? 'home';
  final String type = data['type'] ?? '';
  
  switch (screen) {
    case 'CHAT_DETAIL':
      final String chatId = data['chatId'] ?? '';
      final String senderId = data['senderId'] ?? '';
      // التنقل إلى شاشة المحادثة
      Navigator.pushNamed(context, '/chat', arguments: {
        'chatId': chatId,
        'senderId': senderId,
      });
      break;
      
    case 'ARTWORK_DETAIL':
      final String artworkId = data['artworkId'] ?? '';
      // التنقل إلى شاشة العمل الفني
      Navigator.pushNamed(context, '/artwork', arguments: {
        'artworkId': artworkId,
      });
      break;
      
    case 'PROFILE_FOLLOWERS':
      final String followerId = data['followerId'] ?? '';
      // التنقل إلى شاشة المتابعين
      Navigator.pushNamed(context, '/followers', arguments: {
        'followerId': followerId,
      });
      break;
      
    default:
      // التنقل إلى الشاشة الرئيسية
      Navigator.pushNamed(context, '/home');
  }
}
```

## 📱 **إعدادات Android:**

### **1. إضافة الأذونات في AndroidManifest.xml:**

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    
    <application>
        <!-- إعدادات Firebase -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="arthub_channel" />
            
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_notification" />
    </application>
</manifest>
```

### **2. إضافة google-services.json:**

```bash
# نسخ ملف google-services.json إلى
# android/app/google-services.json
```

## 🍎 **إعدادات iOS:**

### **1. إضافة الأذونات في Info.plist:**

```xml
<!-- ios/Runner/Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

### **2. إضافة GoogleService-Info.plist:**

```bash
# نسخ ملف GoogleService-Info.plist إلى
# ios/Runner/GoogleService-Info.plist
```

## 🔧 **اختبار الإشعارات:**

### **1. اختبار محلي:**

```dart
// اختبار إرسال إشعار محلي
Future<void> testLocalNotification() async {
  await showLocalNotification(RemoteMessage(
    notification: RemoteNotification(
      title: 'اختبار الإشعارات',
      body: 'هذا اختبار للإشعارات المحلية',
    ),
    data: {
      'screen': 'CHAT_DETAIL',
      'chatId': 'test-chat-id',
      'type': 'test',
    },
  ));
}
```

### **2. اختبار من Backend:**

```bash
# تشغيل script اختبار الإشعارات
node scripts/test-push-notifications.js
```

## 📊 **معلومات مهمة:**

### **FCM Token Format:**
```
fMEP0vJqSkqOnFNj5P-2d:APA91bHqX...
```

### **Notification Data Structure:**
```json
{
  "title": "رسالة جديدة",
  "body": "محتوى الرسالة",
  "data": {
    "screen": "CHAT_DETAIL",
    "chatId": "chat-id",
    "senderId": "sender-id",
    "type": "chat_message",
    "timestamp": "1234567890"
  }
}
```

### **Backend Endpoints:**
- `POST /api/notifications/token` - تسجيل FCM token
- `DELETE /api/notifications/token` - إلغاء تسجيل FCM token
- `GET /api/notifications/token` - جلب FCM tokens للمستخدم

## 🚨 **مشاكل شائعة وحلولها:**

### **1. الإشعارات لا تصل:**
- ✅ تأكد من تسجيل FCM token
- ✅ تأكد من إرسال token للـ backend
- ✅ تأكد من منح إذن الإشعارات
- ✅ تأكد من إعدادات Firebase

### **2. الإشعارات تصل ولكن لا تفتح الشاشة:**
- ✅ تأكد من معالجة `onMessageOpenedApp`
- ✅ تأكد من معالجة `getInitialMessage`
- ✅ تأكد من صحة بيانات التنقل

### **3. الإشعارات لا تظهر محلياً:**
- ✅ تأكد من إعداد `flutter_local_notifications`
- ✅ تأكد من إعدادات Android channel
- ✅ تأكد من معالجة `onMessage`

## 🎯 **الخلاصة:**

لضمان عمل Push Notifications:

1. **إعداد Firebase** بشكل صحيح
2. **طلب إذن الإشعارات** من المستخدم
3. **الحصول على FCM token** وإرساله للـ backend
4. **معالجة الإشعارات** في التطبيق
5. **إعداد التنقل** بناءً على الإشعارات

---

**تاريخ التحديث:** يناير 2024  
**المطور:** فريق ArtHub  
**الإصدار:** 1.0.9
