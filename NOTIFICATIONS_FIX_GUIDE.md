# دليل إصلاح الإشعارات - Notifications Fix Guide

## المشكلة 🚨

الإشعارات لا تصل إلى تطبيق Flutter بسبب:
1. **عدم وجود FCM tokens صحيحة** في قاعدة البيانات
2. **عدم إرسال FCM token من Flutter** إلى الباك إند
3. **خطأ في تنسيق إشعارات Android** (تم إصلاحه)

## الحلول ✅

### 1. إصلاح تنسيق إشعارات Android

تم إصلاح الخطأ في `src/utils/pushNotifications.js`:
```javascript
// تم إزالة timeoutAfter الذي لا يدعمه Firebase
android: {
  priority: 'high',
  ttl: 60 * 60 * 1000,
  notification: {
    sound: 'default',
    default_sound: true,
    default_vibrate_timings: true,
    channel_id: 'arthub_channel',
    icon: 'ic_notification',
    priority: 'high',
    color: '#2196F3'
    // تم إزالة timeoutAfter: 30000
  }
}
```

### 2. تفعيل endpoint FCM Token

تم تفعيل endpoint في `src/modules/auth/auth.router.js`:
```javascript
// FCM Token endpoint for Flutter
router.post('/fcm-token', authenticate, isValidation(Validators.fcmTokenSchema), authController.updateFCMToken);
```

### 3. إعداد Flutter لإرسال FCM Token

يجب تحديث Flutter لإرسال FCM token عند تسجيل الدخول:

#### في `art_hub-dev/lib/services/firebase_messaging_service.dart`:
```dart
class FirebaseMessagingService {
  // ... existing code ...
  
  Future<void> sendFCMTokenToBackend() async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        final dio = GetIt.instance<DioHelper>();
        final response = await dio.post(
          '/api/auth/fcm-token',
          data: {'fcmToken': token},
        );
        print('✅ FCM token sent to backend successfully');
      }
    } catch (error) {
      print('❌ Failed to send FCM token to backend: $error');
    }
  }
  
  Future<void> initializeNotifications() async {
    // ... existing initialization code ...
    
    // Send FCM token to backend after initialization
    await sendFCMTokenToBackend();
  }
}
```

#### في `art_hub-dev/lib/core/helpers/pre_app_config.dart`:
```dart
Future<void> preAppConfig() async {
  // ... existing code ...
  
  // Initialize Firebase Messaging
  final fcmService = GetIt.instance<FirebaseMessagingService>();
  await fcmService.initializeNotifications();
}
```

### 4. اختبار الإشعارات

#### اختبار endpoint FCM token:
```bash
node scripts/test-fcm-token-endpoint.js
```

#### اختبار إشعارات مستخدم محدد:
```bash
node scripts/test-khald-notification.js
```

#### اختبار إشعارات الشات:
```bash
node scripts/test-chat-notifications.js
```

#### اختبار إشعارات الطلبات الخاصة:
```bash
node scripts/test-special-request-notifications.js
```

## الخطوات المطلوبة في Flutter 📱

### 1. تحديث Firebase Messaging Service

```dart
// في art_hub-dev/lib/services/firebase_messaging_service.dart

class FirebaseMessagingService {
  static final FirebaseMessagingService _instance = FirebaseMessagingService._internal();
  factory FirebaseMessagingService() => _instance;
  FirebaseMessagingService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  Future<void> initializeNotifications() async {
    // Request permissions
    await _requestPermissions();
    
    // Initialize local notifications
    await _initializeLocalNotifications();
    
    // Get FCM token and send to backend
    await _getAndSendFCMToken();
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // Handle notification taps
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }
  
  Future<void> _getAndSendFCMToken() async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        print('📱 FCM Token: ${token.substring(0, 50)}...');
        await _sendFCMTokenToBackend(token);
      }
    } catch (error) {
      print('❌ Error getting FCM token: $error');
    }
  }
  
  Future<void> _sendFCMTokenToBackend(String token) async {
    try {
      final dio = GetIt.instance<DioHelper>();
      final response = await dio.post(
        '/api/auth/fcm-token',
        data: {'fcmToken': token},
      );
      
      if (response.statusCode == 200) {
        print('✅ FCM token sent to backend successfully');
      } else {
        print('❌ Failed to send FCM token: ${response.statusCode}');
      }
    } catch (error) {
      print('❌ Error sending FCM token to backend: $error');
    }
  }
  
  // ... rest of the service implementation
}
```

### 2. تحديث pre_app_config.dart

```dart
// في art_hub-dev/lib/core/helpers/pre_app_config.dart

Future<void> preAppConfig() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  // Initialize services
  await setupServiceLocator();
  
  // Initialize Firebase Messaging
  final fcmService = GetIt.instance<FirebaseMessagingService>();
  await fcmService.initializeNotifications();
  
  // Request notification permissions
  await Permission.notification.request();
}
```

### 3. تحديث servie_locator.dart

```dart
// في art_hub-dev/lib/services/servie_locator.dart

Future<void> setupServiceLocator() async {
  // ... existing services ...
  
  // Register Firebase Messaging Service
  GetIt.instance.registerSingleton<FirebaseMessagingService>(
    FirebaseMessagingService(),
  );
}
```

## اختبار الإشعارات 🧪

### 1. اختبار FCM Token Endpoint
```bash
node scripts/test-fcm-token-endpoint.js
```

### 2. اختبار إشعارات مستخدم محدد
```bash
node scripts/test-khald-notification.js
```

### 3. اختبار إشعارات الشات
```bash
node scripts/test-chat-notifications.js
```

### 4. اختبار إشعارات الطلبات الخاصة
```bash
node scripts/test-special-request-notifications.js
```

## ملاحظات مهمة ⚠️

### 1. FCM Token يجب أن تكون حقيقية
- لا يمكن إنشاء FCM token يدوياً
- يجب أن تأتي من تطبيق Flutter الحقيقي
- يتم إنشاؤها تلقائياً من Firebase

### 2. إعدادات Firebase
- تأكد من أن `google-services.json` محدث
- تأكد من أن Firebase Cloud Messaging مفعل
- تأكد من أن Project ID صحيح

### 3. إعدادات Android
- `minSdkVersion` يجب أن يكون 23 أو أعلى
- `targetSdkVersion` يجب أن يكون 33 أو أعلى
- تأكد من وجود `FirebaseMessagingService` في `AndroidManifest.xml`

### 4. إعدادات Flutter
- تأكد من تثبيت `firebase_messaging` dependency
- تأكد من تثبيت `flutter_local_notifications` dependency
- تأكد من إعداد Firebase في `main.dart`

## الملفات المُحدثة 📁

### Backend
- `src/utils/pushNotifications.js` - إصلاح تنسيق إشعارات Android
- `src/modules/auth/auth.router.js` - تفعيل endpoint FCM token
- `scripts/test-fcm-token-endpoint.js` - اختبار endpoint FCM token
- `scripts/test-khald-notification.js` - اختبار إشعارات مستخدم محدد

### Flutter (يجب تحديثها)
- `art_hub-dev/lib/services/firebase_messaging_service.dart` - إرسال FCM token
- `art_hub-dev/lib/core/helpers/pre_app_config.dart` - تهيئة FCM
- `art_hub-dev/lib/services/servie_locator.dart` - تسجيل FCM service

## النتيجة المتوقعة 🎉

بعد تطبيق هذه التحديثات:
1. ✅ Flutter سيرسل FCM token إلى الباك إند
2. ✅ الباك إند سيحفظ FCM token في قاعدة البيانات
3. ✅ الإشعارات ستصل إلى Flutter بشكل صحيح
4. ✅ جميع أنواع الإشعارات ستعمل (شات، طلبات خاصة، إلخ)

## الخطوات التالية 📋

1. **تحديث Flutter** حسب الدليل أعلاه
2. **إعادة بناء التطبيق** Flutter
3. **تثبيت التطبيق** على الجهاز
4. **تسجيل الدخول** للتأكد من إرسال FCM token
5. **اختبار الإشعارات** باستخدام scripts الاختبار
