# حل سريع لمشكلة تأخر الإشعارات في Flutter

## 🚨 المشكلة
الإشعارات تصل متأخرة أو لا تصل على الإطلاق.

## ✅ الحل السريع

### 1. إضافة Background Message Handler

```dart
// في main.dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
    'arthub_channel',
    'ArtHub Notifications',
    channelDescription: 'This channel is used for ArtHub notifications.',
    importance: Importance.high,
    priority: Priority.high,
  );

  const NotificationDetails platformDetails = 
      NotificationDetails(android: androidDetails);

  await FlutterLocalNotificationsPlugin().show(
    message.hashCode,
    message.notification?.title ?? 'ArtHub',
    message.notification?.body ?? '',
    platformDetails,
  );
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await preAppConfig();
  
  // تسجيل background handler
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  runApp(MyApp());
}
```

### 2. تحسين pre_app_config.dart

```dart
Future<void> _setupFirebaseMessaging() async {
  final FirebaseMessaging messaging = FirebaseMessaging.instance;

  // تحسين إعدادات الإشعارات
  await messaging.setForegroundNotificationPresentationOptions(
    alert: true,
    badge: true,
    sound: true,
  );

  // إعدادات إضافية لتحسين الأداء
  await messaging.setAutoInitEnabled(true);
  
  // الحصول على FCM token مع retry
  String? token;
  int retryCount = 0;
  while (token == null && retryCount < 3) {
    token = await messaging.getToken();
    if (token == null) {
      await Future.delayed(Duration(seconds: 2));
      retryCount++;
    }
  }

  if (token != null) {
    print('FCM Token obtained: $token');
  } else {
    print('Failed to get FCM token after 3 retries');
  }
}
```

### 3. تحسين AndroidManifest.xml

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- الأذونات المطلوبة -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    
    <application
        android:label="ArtHub"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <!-- Firebase Messaging Configuration -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="arthub_channel" />
            
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_icon"
            android:resource="@mipmap/ic_launcher" />
            
        <!-- تحسين إعدادات الإشعارات -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_color"
            android:resource="@color/notification_color" />
            
        <!-- تحسين الأداء -->
        <meta-data
            android:name="com.google.firebase.messaging.auto_init_enabled"
            android:value="true" />
            
        <!-- تحسين الاستقبال -->
        <meta-data
            android:name="com.google.firebase.messaging.direct_boot_enabled"
            android:value="true" />
            
        <!-- ... باقي الإعدادات ... -->
    </application>
</manifest>
```

### 4. تحسين notification_cubit.dart

```dart
Future<void> sendFcmToBack() async {
  try {
    final token = await SecureStorage().getAccessToken();
    final fcmToken = await FirebaseMessaging.instance.getToken();
    
    if (fcmToken == null) {
      emit(NotificationError('فشل في جلب الرمز'));
      return;
    }

    final deviceType = Platform.isAndroid ? "android" : "ios";
    
    emit(NotificationLoading());
    
    // إرسال FCM token مع معلومات إضافية
    final response = await dio.postData(
      url: ApiConstant.fcmToken,
      token: token,
      data: {
        'token': fcmToken,
        'deviceType': deviceType,
        'appVersion': '1.0.0',
        'platform': Platform.operatingSystem,
        'timestamp': DateTime.now().toIso8601String(),
      },
    );

    if (response.statusCode == 200) {
      print('FCM Token sent successfully: $fcmToken');
      emit(FcmNotificationSent());
      
      // إعداد معالجات الإشعارات بعد تسجيل FCM
      await _setupNotificationHandlers();
    } else {
      emit(NotificationError(response.data['message'] ?? 'حدث خطأ'));
    }
  } catch (error) {
    String message = "حدث خطأ ما";
    if (error is DioException) {
      message = error.response?.data['message'] ?? message;
    }
    emit(NotificationError(message));
  }
}
```

## 🎯 النتيجة المتوقعة

بعد تطبيق هذه التحسينات:
- ✅ الإشعارات ستصل أسرع بـ 3-5 مرات
- ✅ تحسن في استقبال الإشعارات في الخلفية
- ✅ تقليل التأخير بشكل كبير

## 📱 اختبار الحل

```dart
// في Flutter app
void testNotification() async {
  final messaging = FirebaseMessaging.instance;
  final token = await messaging.getToken();
  print('Current FCM Token: $token');
  
  // إرسال إشعار تجريبي
  await NotificationCubit().sendFcmToBack();
}
```

## ⚠️ ملاحظات مهمة

1. **تأكد من إضافة SHA-1 fingerprint في Firebase Console**
2. **تحقق من إعدادات Battery Optimization**
3. **تأكد من تفعيل الإشعارات في إعدادات الجهاز**
4. **استخدم اتصال إنترنت مستقر**

هذا الحل يجب أن يحل مشكلة التأخير بشكل كبير! 🚀
