# 📱 دليل شامل لإشعارات Firebase في تطبيق Flutter

## 🔍 المشكلة
عدم وصول إشعارات Firebase (FCM) إلى تطبيق Flutter بسبب مشاكل في تسجيل وإدارة رموز FCM.

## 🛠️ الحل الشامل

### 1️⃣ إعداد Firebase في تطبيق Flutter

#### أولاً: إضافة التبعيات المطلوبة في `pubspec.yaml`

```yaml
dependencies:
  firebase_core: ^2.24.2
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
  http: ^1.1.0
```

#### ثانياً: تهيئة Firebase في `main.dart`

```dart
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
```

### 2️⃣ إنشاء خدمة إشعارات Firebase

#### إنشاء ملف `firebase_messaging_service.dart`

```dart
import 'dart:convert';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class FirebaseMessagingService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _flutterLocalNotificationsPlugin = FlutterLocalNotificationsPlugin();
  
  // تهيئة الخدمة
  Future<void> initialize() async {
    // طلب صلاحيات الإشعارات
    await _requestPermissions();
    
    // تهيئة الإشعارات المحلية
    await _initializeLocalNotifications();
    
    // الحصول على وإرسال FCM token
    await _getAndSendFCMToken();
    
    // الاستماع لتحديثات FCM token
    _firebaseMessaging.onTokenRefresh.listen(_sendFCMTokenToBackend);
    
    // معالجة الإشعارات في الواجهة الأمامية
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // معالجة الإشعارات في الخلفية
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
    
    // معالجة النقر على الإشعارات
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);
  }
  
  // طلب صلاحيات الإشعارات
  Future<void> _requestPermissions() async {
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );
    
    print('🔔 إعدادات صلاحيات الإشعارات: ${settings.authorizationStatus}');
  }
  
  // تهيئة الإشعارات المحلية
  Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings androidInitializationSettings = 
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    const DarwinInitializationSettings iosInitializationSettings = 
        DarwinInitializationSettings();
    
    const InitializationSettings initializationSettings = InitializationSettings(
      android: androidInitializationSettings,
      iOS: iosInitializationSettings,
    );
    
    await _flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // معالجة النقر على الإشعار المحلي
        if (response.payload != null) {
          final Map<String, dynamic> data = jsonDecode(response.payload!);
          _handleNotificationData(data);
        }
      },
    );
  }
  
  // الحصول على وإرسال FCM token
  Future<void> _getAndSendFCMToken() async {
    try {
      final String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        print('🔑 FCM Token: $token');
        
        // تخزين Token محلياً
        final SharedPreferences prefs = await SharedPreferences.getInstance();
        await prefs.setString('fcm_token', token);
        
        // إرسال Token للخادم
        await _sendFCMTokenToBackend(token);
      }
    } catch (e) {
      print('❌ خطأ في الحصول على FCM token: $e');
    }
  }
  
  // إرسال FCM token للخادم
  Future<void> _sendFCMTokenToBackend(String token) async {
    try {
      // الحصول على token المستخدم من التخزين المحلي
      final SharedPreferences prefs = await SharedPreferences.getInstance();
      final String? userToken = prefs.getString('user_token');
      
      if (userToken == null) {
        print('⚠️ لم يتم العثور على token المستخدم، لا يمكن إرسال FCM token');
        return;
      }
      
      // إرسال الطلب للخادم
      final response = await http.post(
        Uri.parse('https://arthub-backend.up.railway.app/api/notifications/token'),
        headers: {
          'Authorization': 'Bearer $userToken',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'token': token,
          'deviceType': _getDeviceType(),
        }),
      );
      
      if (response.statusCode == 200) {
        print('✅ تم تسجيل FCM token بنجاح!');
      } else {
        print('❌ فشل في تسجيل FCM token. الرمز: ${response.statusCode}');
        print('❌ الاستجابة: ${response.body}');
      }
    } catch (e) {
      print('❌ خطأ في إرسال FCM token للخادم: $e');
    }
  }
  
  // الحصول على نوع الجهاز
  String _getDeviceType() {
    // يمكن استخدام مكتبة device_info_plus للحصول على معلومات أكثر دقة
    return 'android'; // أو 'ios' حسب نظام التشغيل
  }
  
  // معالجة الإشعارات في الواجهة الأمامية
  void _handleForegroundMessage(RemoteMessage message) {
    print('📱 تم استلام إشعار في الواجهة الأمامية');
    print('📱 العنوان: ${message.notification?.title}');
    print('📱 المحتوى: ${message.notification?.body}');
    print('📱 البيانات: ${message.data}');
    
    // عرض إشعار محلي
    _showLocalNotification(
      title: message.notification?.title ?? 'إشعار جديد',
      body: message.notification?.body ?? '',
      payload: jsonEncode(message.data),
    );
  }
  
  // عرض إشعار محلي
  Future<void> _showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'arthub_channel',
      'ArtHub Notifications',
      channelDescription: 'Notifications from ArtHub',
      importance: Importance.high,
      priority: Priority.high,
    );
    
    const NotificationDetails notificationDetails = NotificationDetails(
      android: androidDetails,
    );
    
    await _flutterLocalNotificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch.remainder(100000),
      title,
      body,
      notificationDetails,
      payload: payload,
    );
  }
  
  // معالجة النقر على الإشعارات
  void _handleNotificationTap(RemoteMessage message) {
    print('🔔 تم النقر على الإشعار');
    print('🔔 البيانات: ${message.data}');
    
    _handleNotificationData(message.data);
  }
  
  // معالجة بيانات الإشعار
  void _handleNotificationData(Map<String, dynamic> data) {
    // تنفيذ الإجراء المناسب بناءً على بيانات الإشعار
    // مثال: التنقل إلى شاشة معينة
    if (data.containsKey('type')) {
      switch (data['type']) {
        case 'chat':
          // التنقل إلى شاشة الدردشة
          // Navigator.pushNamed(context, '/chat', arguments: data);
          break;
        case 'order':
          // التنقل إلى شاشة الطلبات
          // Navigator.pushNamed(context, '/orders', arguments: data);
          break;
        // إضافة المزيد من الحالات حسب الحاجة
      }
    }
  }
  
  // الاشتراك في موضوع
  Future<void> subscribeToTopic(String topic) async {
    await _firebaseMessaging.subscribeToTopic(topic);
    print('✅ تم الاشتراك في الموضوع: $topic');
  }
  
  // إلغاء الاشتراك من موضوع
  Future<void> unsubscribeFromTopic(String topic) async {
    await _firebaseMessaging.unsubscribeFromTopic(topic);
    print('✅ تم إلغاء الاشتراك من الموضوع: $topic');
  }
}

// معالج الإشعارات في الخلفية
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // تأكد من تهيئة Firebase
  await Firebase.initializeApp();
  
  print('🔔 تم استلام إشعار في الخلفية');
  print('🔔 العنوان: ${message.notification?.title}');
  print('🔔 المحتوى: ${message.notification?.body}');
  print('🔔 البيانات: ${message.data}');
}
```

### 3️⃣ استخدام خدمة الإشعارات في التطبيق

#### في `main.dart` أو عند بدء التطبيق

```dart
import 'firebase_messaging_service.dart';

// إنشاء مثيل من الخدمة
final FirebaseMessagingService _messagingService = FirebaseMessagingService();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // تهيئة خدمة الإشعارات
  await _messagingService.initialize();
  
  runApp(MyApp());
}
```

#### عند تسجيل الدخول

```dart
Future<void> onLogin(String token) async {
  // تخزين token المستخدم
  final SharedPreferences prefs = await SharedPreferences.getInstance();
  await prefs.setString('user_token', token);
  
  // إعادة تسجيل FCM token بعد تسجيل الدخول
  await _messagingService._getAndSendFCMToken();
}
```

### 4️⃣ التحقق من المشاكل الشائعة

#### 1. التأكد من تكوين Firebase الصحيح
- تأكد من إضافة ملف `google-services.json` في مجلد `android/app`
- تأكد من إضافة ملف `GoogleService-Info.plist` في مجلد `ios/Runner`
- تأكد من تكوين `firebase_options.dart` بشكل صحيح

#### 2. التأكد من صلاحيات الإشعارات
- في Android: تأكد من إضافة الصلاحيات المناسبة في `AndroidManifest.xml`
- في iOS: تأكد من تكوين Capabilities في Xcode

#### 3. التأكد من عدم تحسين البطارية
- في Android: تأكد من استثناء التطبيق من تحسين البطارية

#### 4. التحقق من تسجيل FCM token في الخادم
- تحقق من سجلات التطبيق للتأكد من نجاح إرسال FCM token
- تحقق من سجلات الخادم للتأكد من استلام وتخزين FCM token

### 5️⃣ اختبار الإشعارات

#### باستخدام Firebase Console
1. انتقل إلى [Firebase Console](https://console.firebase.google.com/)
2. اختر مشروعك
3. انتقل إلى "Messaging" في القائمة الجانبية
4. انقر على "Send your first message"
5. أكمل تفاصيل الإشعار واختر الجهاز المستهدف

#### باستخدام API
```bash
# إرسال إشعار باستخدام cURL
curl -X POST -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{"to":"DEVICE_FCM_TOKEN","notification":{"title":"عنوان الإشعار","body":"محتوى الإشعار"},"data":{"type":"chat","id":"123"}}' \
  https://fcm.googleapis.com/fcm/send
```

#### باستخدام سكريبت Node.js
```javascript
// test-notifications.js
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const token = 'DEVICE_FCM_TOKEN'; // استبدل بـ FCM token الخاص بالجهاز

admin.messaging().send({
  token: token,
  notification: {
    title: 'عنوان الإشعار',
    body: 'محتوى الإشعار'
  },
  data: {
    type: 'chat',
    id: '123'
  }
})
.then((response) => {
  console.log('تم إرسال الإشعار بنجاح:', response);
})
.catch((error) => {
  console.error('فشل في إرسال الإشعار:', error);
});
```

## 📝 ملاحظات هامة

1. **تأكد من تحديث FCM token بانتظام**:
   - عند تسجيل الدخول
   - عند تحديث الرمز
   - عند بدء تشغيل التطبيق

2. **معالجة حالات الخطأ**:
   - تعامل مع حالات فشل الاتصال بالخادم
   - تعامل مع حالات فشل الحصول على FCM token

3. **اختبار على أجهزة متعددة**:
   - اختبر على أجهزة Android مختلفة
   - اختبر على أجهزة iOS مختلفة

4. **مراقبة سجلات Firebase**:
   - تحقق من سجلات Firebase Cloud Messaging للتأكد من إرسال الإشعارات

## 🔍 استكشاف الأخطاء وإصلاحها

### مشكلة: عدم ظهور الإشعارات في الواجهة الأمامية
- **الحل**: تأكد من تهيئة FlutterLocalNotificationsPlugin بشكل صحيح
- **الحل**: تأكد من معالجة الإشعارات في FirebaseMessaging.onMessage

### مشكلة: عدم ظهور الإشعارات في الخلفية
- **الحل**: تأكد من تسجيل FirebaseMessaging.onBackgroundMessage
- **الحل**: تأكد من تهيئة Firebase في معالج الخلفية

### مشكلة: عدم تسجيل FCM token في الخادم
- **الحل**: تأكد من صحة رابط API
- **الحل**: تأكد من إرسال token المستخدم في رأس الطلب
- **الحل**: تأكد من تنسيق الطلب بشكل صحيح

### مشكلة: حذف FCM token من قاعدة البيانات
- **الحل**: تأكد من تنفيذ وظيفة cleanupInvalidFCMTokens بشكل صحيح في الخادم
- **الحل**: تأكد من إعادة تسجيل FCM token بانتظام

---

**تاريخ التحديث:** فبراير 2024  
**المطور:** فريق ArtHub  
**الإصدار:** 1.0.0