# 🚨 إصلاح سريع لمشكلة FCM Token في Flutter

## 📋 **المشكلة:**
FCM token تم حذفه من قاعدة البيانات بسبب فشل في الإرسال.

## 🔧 **الحل السريع:**

### **1. في Flutter - إعادة تسجيل FCM Token:**

```dart
// في main.dart أو عند تسجيل الدخول
Future<void> registerFCMToken() async {
  try {
    // الحصول على FCM token
    final token = await FirebaseMessaging.instance.getToken();
    
    if (token != null) {
      print('🔑 FCM Token: $token');
      
      // إرسال Token للـ Backend
      final response = await http.post(
        Uri.parse('https://arthub-backend.up.railway.app/api/notifications/token'),
        headers: {
          'Authorization': 'Bearer $userToken', // استبدل بـ token المستخدم
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': token,
          'deviceType': 'android'
        }),
      );
      
      print('📤 Token sent to backend: ${response.statusCode}');
      print('📤 Response: ${response.body}');
      
      if (response.statusCode == 200) {
        print('✅ FCM Token registered successfully!');
      } else {
        print('❌ Failed to register FCM Token');
      }
    }
  } catch (e) {
    print('❌ Error registering FCM token: $e');
  }
}
```

### **2. استدعاء الدالة:**

```dart
// في main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // إعداد الإشعارات
  await initializeLocalNotifications();
  await requestNotificationPermissions();
  
  // تسجيل FCM token
  await registerFCMToken();
  
  runApp(MyApp());
}

// أو عند تسجيل الدخول
Future<void> onLogin() async {
  // ... login logic
  
  // تسجيل FCM token بعد تسجيل الدخول
  await registerFCMToken();
}
```

### **3. إعداد Local Notifications:**

```dart
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
```

### **4. معالجة الإشعارات:**

```dart
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
    DateTime.now().millisecondsSinceEpoch.remainder(100000),
    title,
    body,
    notificationDetails,
    payload: payload,
  );
}
```

## 🧪 **اختبار سريع:**

### **1. بعد تطبيق الكود أعلاه:**
```bash
# تشغيل script فحص FCM tokens
node scripts/check-fcm-tokens.js
```

### **2. إذا ظهر FCM token:**
```bash
# تشغيل script اختبار الإشعارات
node scripts/test-notifications-final.js
```

## 📱 **pubspec.yaml:**
```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
  http: ^1.1.0
```

## 🎯 **الخطوات المطلوبة:**

1. **تطبيق الكود أعلاه** في Flutter
2. **إضافة التبعيات** في pubspec.yaml
3. **استبدال userToken** بـ token المستخدم الحقيقي
4. **إعادة تشغيل التطبيق**
5. **اختبار الإشعارات**

## ✅ **النتيجة المتوقعة:**
بعد تطبيق الحلول، يجب أن:
- ✅ FCM token يتم تسجيله في قاعدة البيانات
- ✅ الإشعارات تصل في Flutter
- ✅ Local notifications تعمل

## 🔍 **نقاط مهمة:**

1. **تأكد من أن userToken صحيح** - استبدل بـ token المستخدم الحقيقي
2. **تأكد من إعدادات Firebase** في Flutter
3. **تأكد من صلاحيات الإشعارات**
4. **تأكد من أن التطبيق ليس في battery optimization**

---

**تاريخ التحديث:** يناير 2024  
**المطور:** فريق ArtHub  
**الإصدار:** 1.0.7
