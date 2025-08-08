# حل مشكلة تأخر الإشعارات في Flutter

## المشكلة
الإشعارات تصل متأخرة أو لا تصل على الإطلاق في تطبيق Flutter.

## الأسباب المحتملة

### 1. مشاكل في إعدادات Firebase
- عدم تكوين Firebase بشكل صحيح
- مشاكل في `google-services.json`
- عدم إضافة SHA-1 fingerprint

### 2. مشاكل في إعدادات Android
- عدم إضافة الأذونات المطلوبة
- مشاكل في `AndroidManifest.xml`
- عدم تكوين notification channel

### 3. مشاكل في Flutter Code
- عدم تسجيل FCM token بشكل صحيح
- عدم معالجة الإشعارات في الخلفية
- مشاكل في `FirebaseMessaging`

## الحلول

### 1. تحسين إعدادات Firebase

#### أ. إضافة SHA-1 Fingerprint
```bash
# في terminal Flutter project
cd android
./gradlew signingReport
```

أضف SHA-1 إلى Firebase Console:
1. اذهب إلى Firebase Console
2. اختر مشروعك
3. Settings > Project Settings
4. أضف SHA-1 fingerprint

#### ب. تحسين `google-services.json`
تأكد من أن الملف يحتوي على:
```json
{
  "project_info": {
    "project_number": "YOUR_PROJECT_NUMBER",
    "project_id": "YOUR_PROJECT_ID"
  },
  "client": [
    {
      "client_info": {
        "mobilesdk_app_id": "YOUR_APP_ID",
        "android_client_info": {
          "package_name": "com.your.package.name"
        }
      },
      "oauth_client": [],
      "api_key": [
        {
          "current_key": "YOUR_API_KEY"
        }
      ],
      "services": {
        "appinvite_service": {
          "other_platform_oauth_client": []
        }
      }
    }
  ]
}
```

### 2. تحسين AndroidManifest.xml

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

### 3. تحسين Flutter Code

#### أ. تحسين `pre_app_config.dart`
```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

Future<void> preAppConfig() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تهيئة Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  
  // طلب الأذونات
  await _requestPermissions();
  
  // إعداد الإشعارات المحلية
  await _setupLocalNotifications();
  
  // إعداد Firebase Messaging
  await _setupFirebaseMessaging();
  
  // ... باقي الإعدادات ...
}

Future<void> _requestPermissions() async {
  // طلب إذن الإشعارات
  if (await Permission.notification.isDenied) {
    await Permission.notification.request();
  }
  
  // طلب أذونات إضافية للأداء الأفضل
  await Permission.wakeLock.request();
  await Permission.vibrate.request();
}

Future<void> _setupLocalNotifications() async {
  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  const AndroidInitializationSettings initializationSettingsAndroid =
      AndroidInitializationSettings('@mipmap/ic_launcher');

  const InitializationSettings initializationSettings =
      InitializationSettings(android: initializationSettingsAndroid);

  await flutterLocalNotificationsPlugin.initialize(
    initializationSettings,
    onDidReceiveNotificationResponse: (NotificationResponse response) {
      // معالجة النقر على الإشعار
      print('Notification clicked: ${response.payload}');
    },
  );

  // إنشاء notification channel
  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'arthub_channel',
    'ArtHub Notifications',
    description: 'This channel is used for ArtHub notifications.',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
    enableLights: true,
  );

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);
}

Future<void> _setupFirebaseMessaging() async {
  final FirebaseMessaging messaging = FirebaseMessaging.instance;

  // إعدادات الإشعارات
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

  // الحصول على FCM token
  String? token = await messaging.getToken();
  print('FCM Token: $token');

  // إعداد معالجات الإشعارات
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    print('Got a message whilst in the foreground!');
    print('Message data: ${message.data}');

    if (message.notification != null) {
      print('Message also contained a notification: ${message.notification}');
      _showLocalNotification(message);
    }
  });

  // معالجة الإشعارات عند فتح التطبيق
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    print('A new onMessageOpenedApp event was published!');
    print('Message data: ${message.data}');
    // التنقل إلى الشاشة المناسبة
  });

  // معالجة الإشعارات عند إغلاق التطبيق
  RemoteMessage? initialMessage = await messaging.getInitialMessage();
  if (initialMessage != null) {
    print('App opened from notification: ${initialMessage.data}');
  }
}

void _showLocalNotification(RemoteMessage message) {
  const AndroidNotificationDetails androidPlatformChannelSpecifics =
      AndroidNotificationDetails(
    'arthub_channel',
    'ArtHub Notifications',
    channelDescription: 'This channel is used for ArtHub notifications.',
    importance: Importance.high,
    priority: Priority.high,
    showWhen: true,
    enableVibration: true,
    playSound: true,
  );

  const NotificationDetails platformChannelSpecifics =
      NotificationDetails(android: androidPlatformChannelSpecifics);

  FlutterLocalNotificationsPlugin().show(
    message.hashCode,
    message.notification?.title,
    message.notification?.body,
    platformChannelSpecifics,
    payload: message.data.toString(),
  );
}
```

#### ب. تحسين `notification_cubit.dart`
```dart
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class NotificationCubit extends Cubit<NotificationState> {
  NotificationCubit() : super(NotificationInitial());
  
  final FlutterLocalNotificationsPlugin _localNotifications = 
      FlutterLocalNotificationsPlugin();

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
          'appVersion': '1.0.0', // إضافة إصدار التطبيق
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

  Future<void> _setupNotificationHandlers() async {
    // معالجة الإشعارات في المقدمة
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Received foreground message: ${message.notification?.title}');
      _showLocalNotification(message);
    });

    // معالجة الإشعارات عند فتح التطبيق
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      print('App opened from notification: ${message.data}');
      _handleNotificationTap(message);
    });

    // معالجة الإشعارات عند إغلاق التطبيق
    RemoteMessage? initialMessage = await FirebaseMessaging.instance.getInitialMessage();
    if (initialMessage != null) {
      print('App opened from background notification: ${initialMessage.data}');
      _handleNotificationTap(initialMessage);
    }
  }

  void _showLocalNotification(RemoteMessage message) {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'arthub_channel',
      'ArtHub Notifications',
      channelDescription: 'This channel is used for ArtHub notifications.',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      enableVibration: true,
      playSound: true,
      icon: '@mipmap/ic_launcher',
      color: Color(0xFF2196F3), // لون الإشعار
    );

    const NotificationDetails platformDetails = 
        NotificationDetails(android: androidDetails);

    _localNotifications.show(
      message.hashCode,
      message.notification?.title ?? 'ArtHub',
      message.notification?.body ?? '',
      platformDetails,
      payload: message.data.toString(),
    );
  }

  void _handleNotificationTap(RemoteMessage message) {
    // التنقل إلى الشاشة المناسبة حسب نوع الإشعار
    final notificationType = message.data['type'];
    final notificationId = message.data['id'];
    
    switch (notificationType) {
      case 'chat':
        // التنقل إلى الشات
        break;
      case 'order':
        // التنقل إلى الطلبات
        break;
      case 'review':
        // التنقل إلى التقييمات
        break;
      default:
        // التنقل إلى الإشعارات
        break;
    }
  }
}
```

### 4. تحسين Backend

#### أ. تحسين `pushNotifications.js`
```javascript
// في src/utils/pushNotifications.js

export const sendPushNotificationToUser = async (userId, notification, data = {}) => {
  try {
    const user = await userModel.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${userId}`);
      return {
        success: false,
        message: 'No FCM tokens found for user',
        successCount: 0,
        failureCount: 0
      };
    }

    console.log(`Sending notification to user ${userId} with ${user.fcmTokens.length} tokens`);

    const results = [];
    let successCount = 0;
    let failureCount = 0;

    // إرسال الإشعارات بشكل متوازي لتحسين السرعة
    const sendPromises = user.fcmTokens.map(async (token, index) => {
      try {
        const singleMessage = {
          token: token,
          notification: {
            title: notification.title,
            body: notification.body,
            // إضافة إعدادات إضافية لتحسين الأداء
            android: {
              priority: 'high',
              notification: {
                channelId: 'arthub_channel',
                priority: 'high',
                defaultSound: true,
                defaultVibrateTimings: true,
                defaultLightSettings: true,
                icon: '@mipmap/ic_launcher',
                color: '#2196F3',
                // تحسين التوقيت
                timeoutAfter: 30000, // 30 ثانية
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                  badge: 1,
                  'content-available': 1,
                },
              },
              headers: {
                'apns-priority': '10',
                'apns-expiration': Math.floor(Date.now() / 1000) + 3600, // ساعة واحدة
              },
            },
          },
          data: {
            ...data,
            timestamp: Date.now().toString(),
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
          // إعدادات إضافية لتحسين الأداء
          android: {
            priority: 'high',
            ttl: 60 * 60 * 1000, // ساعة واحدة
          },
          apns: {
            headers: {
              'apns-priority': '10',
            },
          },
        };

        const response = await admin.messaging().send(singleMessage);
        results.push({ success: true, messageId: response, tokenIndex: index });
        successCount++;
        console.log(`Successfully sent to token ${index + 1}/${user.fcmTokens.length}`);
      } catch (error) {
        console.log(`Failed to send to token ${index + 1}: ${error.message}`);
        results.push({ success: false, error: error.message, tokenIndex: index });
        failureCount++;
      }
    });

    // انتظار إكمال جميع الإشعارات
    await Promise.all(sendPromises);

    // إزالة الرموز الفاشلة
    if (failureCount > 0) {
      const failedTokens = results
        .filter(result => !result.success)
        .map(result => user.fcmTokens[result.tokenIndex]);

      if (failedTokens.length > 0) {
        await userModel.findByIdAndUpdate(userId, {
          $pull: { fcmTokens: { $in: failedTokens } }
        });
        console.log(`Removed ${failedTokens.length} failed FCM tokens for user ${userId}`);
      }
    }

    console.log(`Notification sent to user ${userId}: ${successCount} success, ${failureCount} failed`);

    return {
      success: successCount > 0,
      successCount,
      failureCount,
      messageIds: results.filter(r => r.success).map(r => r.messageId)
    };
  } catch (error) {
    console.error('Error sending push notification:', error);
    return {
      success: false,
      message: error.message,
      successCount: 0,
      failureCount: 0
    };
  }
};
```

### 5. تحسينات إضافية

#### أ. إضافة Background Message Handler
```dart
// في main.dart أو ملف منفصل
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  print('Handling a background message: ${message.messageId}');
  
  // إظهار إشعار محلي
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

#### ب. تحسين إعدادات Firebase
```dart
// في pre_app_config.dart
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

## اختبار الحل

### 1. اختبار Backend
```bash
node scripts/test-push-notifications.js
```

### 2. اختبار Flutter
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

## نصائح إضافية

1. **تحسين Battery Optimization**: تأكد من أن التطبيق مستثنى من تحسين البطارية
2. **تحسين Network**: استخدم اتصال إنترنت مستقر
3. **تحسين Device Settings**: تأكد من تفعيل الإشعارات في إعدادات الجهاز
4. **Monitoring**: راقب logs للتأكد من عدم وجود أخطاء

## استكشاف الأخطاء

### إذا لم تصل الإشعارات:
1. تحقق من FCM token في Firebase Console
2. تحقق من logs في Flutter
3. تحقق من إعدادات الجهاز
4. اختبر على جهاز آخر

### إذا وصلت متأخرة:
1. تحقق من إعدادات Battery Optimization
2. تحقق من Network connectivity
3. تحقق من Firebase Console quotas
4. استخدم High Priority notifications

هذا الدليل يجب أن يحل مشكلة تأخر الإشعارات ويحسن الأداء بشكل كبير.
