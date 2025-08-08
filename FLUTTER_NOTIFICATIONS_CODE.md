# 📱 كود جاهز لـ Push Notifications في Flutter

## 🔧 **الكود الكامل:**

### **1. main.dart - التهيئة الأساسية:**

```dart
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
  
  runApp(MyApp());
}

// طلب إذن الإشعارات
Future<void> requestNotificationPermissions() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
    provisional: false,
  );
  
  print('User granted permission: ${settings.authorizationStatus}');
}

// الحصول على FCM token
Future<String?> getFCMToken() async {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  String? token = await messaging.getToken();
  
  if (token != null) {
    print('FCM Token: $token');
    await sendTokenToBackend(token);
  }
  
  return token;
}

// إرسال token للـ backend
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

// إعداد معالجة الإشعارات
void setupNotifications() {
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  // معالجة الإشعارات عندما يكون التطبيق مفتوح
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');
    
    if (message.notification != null) {
      print('Message also contained a notification: ${message.notification}');
      showLocalNotification(message);
    }
  });
  
  // معالجة الإشعارات عند النقر عليها
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('A new onMessageOpenedApp event was published!');
    print('Message data: ${message.data}');
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

### **2. notifications_service.dart - خدمة الإشعارات:**

```dart
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'dart:convert';

final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

// تهيئة الإشعارات المحلية
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

// عرض إشعار محلي
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

// معالجة النقر على الإشعار المحلي
void onNotificationTapped(NotificationResponse response) {
  if (response.payload != null) {
    Map<String, dynamic> data = jsonDecode(response.payload!);
    navigateToScreen(data);
  }
}

// التنقل بناءً على الإشعارات
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

### **3. pubspec.yaml - التبعيات:**

```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
  http: ^1.1.0
```

### **4. AndroidManifest.xml - إعدادات Android:**

```xml
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

### **5. Info.plist - إعدادات iOS:**

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

## 🚀 **خطوات التطبيق:**

1. **أضف التبعيات** في `pubspec.yaml`
2. **انسخ الكود** من `main.dart`
3. **أضف إعدادات Android** في `AndroidManifest.xml`
4. **أضف إعدادات iOS** في `Info.plist`
5. **أضف ملفات Firebase** (`google-services.json` و `GoogleService-Info.plist`)
6. **استبدل `userToken`** بـ token المستخدم الحقيقي

## 📱 **اختبار الإشعارات:**

```dart
// اختبار إشعار محلي
Future<void> testNotification() async {
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

## 🎯 **النتيجة المتوقعة:**

بعد تطبيق هذا الكود:
- ✅ الإشعارات ستصل من Backend
- ✅ الإشعارات ستظهر محلياً
- ✅ النقر على الإشعار سيفتح الشاشة المطلوبة
- ✅ الإشعارات ستعمل في الخلفية

---

**ملاحظة:** تأكد من استبدال `userToken` بـ token المستخدم الحقيقي من نظام المصادقة الخاص بك.
