# إعداد الإشعارات في تطبيق Flutter

## إعداد ملف AndroidManifest.xml

يجب التأكد من وجود الإعدادات التالية في ملف `AndroidManifest.xml` لضمان عمل الإشعارات بشكل صحيح:

1. إضافة الأذونات المطلوبة:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.VIBRATE"/>
<uses-permission android:name="android.permission.WAKE_LOCK"/>
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

2. إضافة خدمة Firebase Messaging:

```xml
<service android:name="io.flutter.plugins.firebase.messaging.FlutterFirebaseMessagingService" android:exported="false">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT"/>
    </intent-filter>
</service>
```

3. إضافة مستقبل Firebase Messaging:

```xml
<receiver android:name="io.flutter.plugins.firebase.messaging.FlutterFirebaseMessagingReceiver" android:exported="true">
    <intent-filter>
        <action android:name="com.google.firebase.MESSAGING_EVENT"/>
    </intent-filter>
</receiver>
```

4. إضافة البيانات الوصفية للإشعارات:

```xml
<meta-data
    android:name="com.google.firebase.messaging.default_notification_channel_id"
    android:value="arthub_high_importance_channel" />

<meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@drawable/notification_icon" />

<meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/notification_color" />
```

## إصلاح مشكلة عدم وصول رمز FCM إلى الخادم

إذا كنت تواجه مشكلة في عدم وصول رمز FCM إلى الخادم، تأكد من اتباع الخطوات التالية:

1. تأكد من تهيئة Firebase بشكل صحيح في ملف `main.dart`:

```dart
await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
```

2. تأكد من طلب إذن الإشعارات:

```dart
if (await Permission.notification.isDenied) {
  await Permission.notification.request();
}
```

3. تأكد من استدعاء وظيفة `initialize()` في خدمة Firebase Messaging:

```dart
await FirebaseMessagingService().initialize();
```

4. استدعاء وظيفة `sendTokenToServerAfterLogin()` بعد تسجيل الدخول بنجاح:

```dart
// بعد تسجيل الدخول بنجاح
await FirebaseMessagingService().sendTokenToServerAfterLogin();
```

## إعداد الإشعارات في iOS

لإعداد الإشعارات في iOS، يجب اتباع الخطوات التالية:

1. تأكد من إضافة إمكانية الإشعارات في ملف `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>fetch</string>
    <string>remote-notification</string>
</array>
```

2. إضافة شهادة APN (Apple Push Notification) إلى مشروع Firebase الخاص بك:
   - قم بتسجيل الدخول إلى [حساب مطور Apple](https://developer.apple.com/)
   - قم بإنشاء شهادة APN
   - قم بتحميل الشهادة إلى مشروع Firebase الخاص بك

3. تأكد من طلب إذن الإشعارات في iOS:

```dart
if (Platform.isIOS) {
  await FirebaseMessaging.instance.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
}
```

## استكشاف الأخطاء وإصلاحها

### مشكلات شائعة في Android

1. **عدم ظهور الإشعارات أثناء تشغيل التطبيق**:
   - تأكد من تهيئة قناة الإشعارات بشكل صحيح
   - تأكد من استخدام `flutter_local_notifications` للإشعارات المحلية

2. **عدم ظهور أيقونة الإشعار بشكل صحيح**:
   - تأكد من وجود أيقونة الإشعار في مجلد `android/app/src/main/res/drawable`
   - تأكد من أن الأيقونة بيضاء على خلفية شفافة

3. **عدم تشغيل التطبيق عند النقر على الإشعار**:
   - تأكد من إعداد معالج النقر على الإشعار بشكل صحيح

### مشكلات شائعة في iOS

1. **عدم استلام الإشعارات**:
   - تأكد من تهيئة شهادة APN بشكل صحيح
   - تأكد من طلب إذن الإشعارات

2. **عدم ظهور الإشعارات في وضع الخلفية**:
   - تأكد من إضافة `remote-notification` في `UIBackgroundModes`

## ملاحظات هامة

- تأكد من أن المستخدم مسجل الدخول قبل محاولة إرسال رمز FCM إلى الخادم.
- تأكد من وجود اتصال بالإنترنت عند محاولة إرسال رمز FCM.
- تحقق من سجلات التطبيق للتأكد من نجاح إرسال رمز FCM إلى الخادم.
- إذا استمرت المشكلة، تحقق من سجلات الخادم للتأكد من استلام طلب تسجيل رمز FCM.
- قم بتنفيذ آلية إعادة المحاولة لإرسال رمز FCM في حالة فشل الإرسال.

## أفضل الممارسات

1. **تخزين رمز FCM محلياً**:
   - قم بتخزين رمز FCM في التخزين المحلي باستخدام `shared_preferences` أو `CacheServices`
   - أرسل الرمز إلى الخادم عند تسجيل الدخول أو عند تحديث الرمز

2. **التعامل مع تغيير الرمز**:
   - استمع إلى حدث `onTokenRefresh` وأرسل الرمز الجديد إلى الخادم

3. **اختبار الإشعارات**:
   - استخدم وحدة تحكم Firebase لإرسال إشعارات اختبار
   - قم بإنشاء نقطة نهاية اختبار في الخادم لإرسال إشعارات

## معالجة البيانات المخصصة في الإشعارات

يمكن إرسال بيانات مخصصة مع الإشعارات لتنفيذ إجراءات محددة عند النقر على الإشعار:

1. **إرسال البيانات المخصصة من الخادم**:

```javascript
// مثال لإرسال إشعار مع بيانات مخصصة من الخادم
const message = {
  notification: {
    title: 'عنوان الإشعار',
    body: 'محتوى الإشعار',
  },
  data: {
    type: 'chat_message',
    senderId: '123456',
    chatId: '789012',
    // يمكن إضافة المزيد من البيانات المخصصة هنا
  },
  token: userFCMToken,
};

firebaseAdmin.messaging().send(message);
```

2. **معالجة البيانات المخصصة في التطبيق**:

```dart
// معالجة الإشعارات في الخلفية
FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // تأكد من تهيئة Firebase
  await Firebase.initializeApp();
  
  // معالجة البيانات المخصصة
  final data = message.data;
  final notificationType = data['type'];
  
  // يمكن تخزين البيانات محلياً لاستخدامها عند فتح التطبيق
  await CacheServices.instance.setLastNotificationData(jsonEncode(data));
}

// معالجة النقر على الإشعار
FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
  final data = message.data;
  final notificationType = data['type'];
  
  // توجيه المستخدم إلى الشاشة المناسبة بناءً على نوع الإشعار
  switch (notificationType) {
    case 'chat_message':
      final chatId = data['chatId'];
      navigateToChatScreen(chatId);
      break;
    case 'new_artwork':
      final artworkId = data['artworkId'];
      navigateToArtworkDetails(artworkId);
      break;
    // يمكن إضافة المزيد من الحالات هنا
  }
});
```

## تخصيص مظهر الإشعارات

### تخصيص مظهر الإشعارات في Android

1. **إنشاء قنوات إشعارات متعددة**:

```dart
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();

future<void> setupNotificationChannels() async {
  // قناة للإشعارات العالية الأهمية (مثل الرسائل)
  const AndroidNotificationChannel highImportanceChannel = AndroidNotificationChannel(
    'arthub_high_importance_channel',
    'إشعارات مهمة',
    description: 'هذه القناة للإشعارات المهمة مثل الرسائل الجديدة',
    importance: Importance.high,
    enableVibration: true,
    playSound: true,
  );
  
  // قناة للإشعارات العادية
  const AndroidNotificationChannel normalChannel = AndroidNotificationChannel(
    'arthub_normal_channel',
    'إشعارات عادية',
    description: 'هذه القناة للإشعارات العادية مثل التحديثات',
    importance: Importance.defaultImportance,
  );
  
  // إنشاء القنوات
  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannels([highImportanceChannel, normalChannel]);
}
```

2. **تخصيص أنماط الاهتزاز والأصوات**:

```dart
// تخصيص نمط الاهتزاز والصوت للإشعارات
final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
  'arthub_high_importance_channel',
  'إشعارات مهمة',
  channelDescription: 'هذه القناة للإشعارات المهمة مثل الرسائل الجديدة',
  importance: Importance.high,
  priority: Priority.high,
  vibrationPattern: Int64List.fromList([0, 500, 200, 500]), // نمط الاهتزاز
  sound: const RawResourceAndroidNotificationSound('notification_sound'), // اسم ملف الصوت في مجلد الموارد
  color: const Color(0xFF4CAF50), // لون الإشعار
  ledColor: const Color(0xFF4CAF50), // لون LED
  ledOnMs: 1000,
  ledOffMs: 500,
);
```

### تخصيص مظهر الإشعارات في iOS

```dart
final DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
  presentAlert: true,
  presentBadge: true,
  presentSound: true,
  sound: 'notification_sound.aiff', // اسم ملف الصوت في مجلد الموارد
  badgeNumber: 1,
  categoryIdentifier: 'textCategory',
);
```

## اختبار الإشعارات

### اختبار الإشعارات باستخدام وحدة تحكم Firebase

1. انتقل إلى [وحدة تحكم Firebase](https://console.firebase.google.com/)
2. اختر مشروعك
3. انتقل إلى قسم "Messaging" في القائمة الجانبية
4. انقر على "Send your first message"
5. قم بإدخال عنوان ومحتوى الإشعار
6. اختر "Send test message" لإرسال إشعار اختبار إلى جهاز محدد
7. أدخل رمز FCM للجهاز الذي تريد اختباره

### اختبار الإشعارات من الخادم

يمكنك إنشاء نقطة نهاية اختبار في الخادم لإرسال إشعارات اختبار:

```javascript
// مثال لنقطة نهاية اختبار في الخادم
router.post('/test-notification', authMiddleware, async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;
    
    // الحصول على رمز FCM للمستخدم
    const user = await userModel.findById(userId);
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      return res.status(404).json({ message: 'لم يتم العثور على رمز FCM للمستخدم' });
    }
    
    // إرسال إشعار اختبار
    const message = {
      notification: {
        title: title || 'إشعار اختبار',
        body: body || 'هذا إشعار اختبار من الخادم',
      },
      data: data || { type: 'test' },
      token: user.fcmTokens[0], // استخدام أول رمز FCM متاح
    };
    
    const result = await firebaseAdmin.messaging().send(message);
    res.status(200).json({ message: 'تم إرسال الإشعار بنجاح', result });
  } catch (error) {
    console.error('خطأ في إرسال إشعار الاختبار:', error);
    res.status(500).json({ message: 'فشل في إرسال الإشعار', error: error.message });
  }
});
```

## تصحيح الأخطاء الشائعة

### سجل الأخطاء

إضافة سجلات مفصلة لتتبع مشكلات الإشعارات:

```dart
// إضافة سجلات لتتبع مشكلات الإشعارات
void logNotificationIssue(String step, dynamic error) {
  print('=== NOTIFICATION ERROR ===');
  print('Step: $step');
  print('Error: $error');
  print('========================');
  
  // يمكن إرسال السجلات إلى خدمة تتبع الأخطاء مثل Firebase Crashlytics
  FirebaseCrashlytics.instance.recordError(error, StackTrace.current, reason: 'Notification error at $step');
}
```

### قائمة تحقق لحل مشكلات الإشعارات

1. **تأكد من تهيئة Firebase بشكل صحيح**
   - هل تم إضافة ملف `google-services.json` في مجلد `android/app`؟
   - هل تم إضافة ملف `GoogleService-Info.plist` في مجلد `ios/Runner`؟

2. **تحقق من الأذونات**
   - هل تم طلب إذن الإشعارات من المستخدم؟
   - هل تم تمكين الإشعارات في إعدادات التطبيق على الجهاز؟

3. **تحقق من رمز FCM**
   - هل تم الحصول على رمز FCM بنجاح؟
   - هل تم إرسال رمز FCM إلى الخادم بنجاح؟
   - هل يتم تحديث رمز FCM عند تغييره؟

4. **تحقق من إعدادات الخادم**
   - هل تم تكوين Firebase Admin SDK بشكل صحيح؟
   - هل يتم تخزين رموز FCM بشكل صحيح في قاعدة البيانات؟

5. **اختبار الإشعارات**
   - هل يمكن إرسال إشعارات اختبار من وحدة تحكم Firebase؟
   - هل يمكن إرسال إشعارات اختبار من الخادم؟

## الخلاصة

إعداد نظام الإشعارات في تطبيق Flutter يتطلب اهتماماً بالتفاصيل في كل من جانب العميل (Flutter) وجانب الخادم. باتباع الخطوات والإرشادات المذكورة في هذا الدليل، يمكنك إنشاء نظام إشعارات قوي وموثوق يعمل بشكل جيد على كل من أنظمة Android و iOS.
```