# 🚨 حل سريع لمشكلة الإشعارات في Flutter

## 📋 **المشكلة:**
الإشعارات لا تصل في Flutter رغم تسجيل FCM token بنجاح.

## 🔧 **الحلول السريعة:**

### **1. تشغيل Debug Script:**
```bash
node scripts/debug-flutter-notifications.js
```

### **2. فحص FCM Tokens:**
```bash
node scripts/check-fcm-tokens.js
```

### **3. اختبار الإشعارات:**
```bash
node scripts/test-push-notifications.js
```

## 🎯 **الأسباب المحتملة والحلول:**

### **المشكلة 1: FCM Token غير مسجل**
**الحل:**
```dart
// في Flutter - تأكد من إرسال FCM token للـ backend
Future<void> sendFCMTokenToBackend() async {
  final token = await FirebaseMessaging.instance.getToken();
  if (token != null) {
    final response = await http.post(
      Uri.parse('https://arthub-backend.up.railway.app/api/notifications/token'),
      headers: {
        'Authorization': 'Bearer $userToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': token,
        'deviceType': 'android'
      }),
    );
    print('FCM Token sent: ${response.statusCode}');
  }
}
```

### **المشكلة 2: عدم إعداد Local Notifications**
**الحل:**
```dart
// في main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // إعداد Local Notifications
  await initializeLocalNotifications();
  await requestNotificationPermissions();
  
  runApp(MyApp());
}

Future<void> initializeLocalNotifications() async {
  final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  
  const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const iosSettings = DarwinInitializationSettings();
  
  const initSettings = InitializationSettings(
    android: androidSettings,
    iOS: iosSettings,
  );
  
  await flutterLocalNotificationsPlugin.initialize(initSettings);
}
```

### **المشكلة 3: عدم معالجة الإشعارات في Foreground**
**الحل:**
```dart
// في main.dart
void setupNotifications() {
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('📱 Foreground message received');
    
    // عرض Local Notification
    showLocalNotification(
      title: message.notification?.title ?? 'رسالة جديدة',
      body: message.notification?.body ?? '',
      payload: jsonEncode(message.data),
    );
  });
}

void showLocalNotification({
  required String title,
  required String body,
  String? payload,
}) {
  const androidDetails = AndroidNotificationDetails(
    'arthub_channel',
    'ArtHub Notifications',
    channelDescription: 'Notifications from ArtHub',
    importance: Importance.high,
    priority: Priority.high,
  );
  
  const notificationDetails = NotificationDetails(
    android: androidDetails,
  );
  
  FlutterLocalNotificationsPlugin().show(
    DateTime.now().millisecond,
    title,
    body,
    notificationDetails,
    payload: payload,
  );
}
```

### **المشكلة 4: عدم معالجة النقر على الإشعار**
**الحل:**
```dart
// في main.dart
void setupNotificationTapHandler() {
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('📱 App opened from notification');
    handleNotificationTap(message.data);
  });
  
  // للـ App المغلقة
  FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
    if (message != null) {
      handleNotificationTap(message.data);
    }
  });
}

void handleNotificationTap(Map<String, dynamic> data) {
  final screen = data['screen'];
  final id = data['id'];
  
  switch (screen) {
    case 'CHAT_DETAIL':
      // انتقل إلى شاشة المحادثة
      Navigator.pushNamed(context, '/chat', arguments: {'chatId': id});
      break;
    case 'ARTWORK_DETAIL':
      // انتقل إلى تفاصيل العمل الفني
      Navigator.pushNamed(context, '/artwork', arguments: {'artworkId': id});
      break;
    default:
      // انتقل إلى الشاشة الافتراضية
      break;
  }
}
```

## 🧪 **اختبار سريع:**

### **1. اختبار FCM Token:**
```bash
# تشغيل script فحص FCM tokens
node scripts/check-fcm-tokens.js
```

### **2. اختبار إرسال إشعار:**
```bash
# تشغيل script اختبار الإشعارات
node scripts/test-push-notifications.js
```

### **3. اختبار شامل:**
```bash
# تشغيل script التصحيح الشامل
node scripts/debug-flutter-notifications.js
```

## 📱 **كود Flutter كامل جاهز:**

```dart
// main.dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // إعداد الإشعارات
  await initializeLocalNotifications();
  await requestNotificationPermissions();
  await getFCMToken();
  setupNotifications();
  setupNotificationTapHandler();
  
  runApp(MyApp());
}

Future<void> initializeLocalNotifications() async {
  final flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  
  const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
  const iosSettings = DarwinInitializationSettings();
  
  const initSettings = InitializationSettings(
    android: androidSettings,
    iOS: iosSettings,
  );
  
  await flutterLocalNotificationsPlugin.initialize(initSettings);
}

Future<void> requestNotificationPermissions() async {
  final messaging = FirebaseMessaging.instance;
  
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  );
  
  print('User granted permission: ${settings.authorizationStatus}');
}

Future<void> getFCMToken() async {
  final token = await FirebaseMessaging.instance.getToken();
  if (token != null) {
    print('FCM Token: $token');
    await sendTokenToBackend(token);
  }
}

Future<void> sendTokenToBackend(String fcmToken) async {
  try {
    final response = await http.post(
      Uri.parse('https://arthub-backend.up.railway.app/api/notifications/token'),
      headers: {
        'Authorization': 'Bearer $userToken', // استبدل بـ token المستخدم
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'token': fcmToken,
        'deviceType': 'android'
      }),
    );
    
    print('Token sent to backend: ${response.statusCode}');
  } catch (e) {
    print('Error sending token: $e');
  }
}

void setupNotifications() {
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('📱 Foreground message received');
    
    showLocalNotification(
      title: message.notification?.title ?? 'رسالة جديدة',
      body: message.notification?.body ?? '',
      payload: jsonEncode(message.data),
    );
  });
}

void showLocalNotification({
  required String title,
  required String body,
  String? payload,
}) {
  const androidDetails = AndroidNotificationDetails(
    'arthub_channel',
    'ArtHub Notifications',
    channelDescription: 'Notifications from ArtHub',
    importance: Importance.high,
    priority: Priority.high,
  );
  
  const notificationDetails = NotificationDetails(
    android: androidDetails,
  );
  
  FlutterLocalNotificationsPlugin().show(
    DateTime.now().millisecond,
    title,
    body,
    notificationDetails,
    payload: payload,
  );
}

void setupNotificationTapHandler() {
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('📱 App opened from notification');
    handleNotificationTap(message.data);
  });
  
  FirebaseMessaging.instance.getInitialMessage().then((RemoteMessage? message) {
    if (message != null) {
      handleNotificationTap(message.data);
    }
  });
}

void handleNotificationTap(Map<String, dynamic> data) {
  final screen = data['screen'];
  final id = data['id'];
  
  switch (screen) {
    case 'CHAT_DETAIL':
      // انتقل إلى شاشة المحادثة
      break;
    case 'ARTWORK_DETAIL':
      // انتقل إلى تفاصيل العمل الفني
      break;
    default:
      break;
  }
}
```

## 📋 **pubspec.yaml:**
```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
  http: ^1.1.0
```

## 🎯 **الخطوات المطلوبة:**

1. **تشغيل debug script** لفحص المشكلة
2. **تطبيق الكود أعلاه** في Flutter
3. **إضافة التبعيات** في pubspec.yaml
4. **استبدال userToken** بـ token المستخدم الحقيقي
5. **اختبار الإشعارات**

## ✅ **النتيجة المتوقعة:**
بعد تطبيق الحلول، يجب أن تصل الإشعارات في Flutter بشكل صحيح.

---

**تاريخ التحديث:** يناير 2024  
**المطور:** فريق ArtHub  
**الإصدار:** 1.0.6
