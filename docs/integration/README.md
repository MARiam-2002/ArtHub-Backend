# 📱 دليل التكامل الشامل - ArtHub Flutter Integration

## 🎯 مرحباً بك في دليل التكامل مع ArtHub Backend

هذا المجلد يحتوي على جميع الملفات والأدلة التي يحتاجها مطور Flutter للتكامل مع ArtHub Backend بشكل كامل وسهل.

---

## 📚 الملفات المتاحة

### 1️⃣ **دليل المصادقة الشامل**
📄 [`flutter-complete-guide.md`](./flutter-complete-guide.md)

**يحتوي على:**
- شرح مفصل لكل صفحة في دورة المصادقة
- جميع APIs المصادقة مع أمثلة Flutter كاملة
- إعداد ApiService وAuthService
- معالجة الأخطاء والتوكن
- أمثلة عملية لكل endpoint

**متى تستخدمه:** عند بناء نظام المصادقة في التطبيق

### 2️⃣ **دليل صفحات التطبيق**
📄 [`flutter-app-screens-apis.md`](./flutter-app-screens-apis.md)

**يحتوي على:**
- جميع صفحات التطبيق (عدا المصادقة)
- APIs المطلوبة لكل صفحة
- أمثلة Flutter مع Socket.IO
- نماذج تطبيق كاملة
- نصائح الأداء والتطوير

**متى تستخدمه:** عند بناء الصفحات الرئيسية للتطبيق

### 3️⃣ **المرجع السريع**
📄 [`flutter-api-quick-reference.md`](./flutter-api-quick-reference.md)

**يحتوي على:**
- جدول شامل لجميع APIs
- تصنيف حسب الوحدات
- أمثلة سريعة للاستخدام
- أكواد الأخطاء الشائعة

**متى تستخدمه:** كمرجع سريع أثناء التطوير

### 4️⃣ **خريطة الشاشات (موجود مسبقاً)**
📄 [`flutter-screens-api-mapping.md`](./flutter-screens-api-mapping.md)

**يحتوي على:**
- ربط كل صفحة بـ APIs المطلوبة
- تدفق التطبيق
- نصائح UX/UI

---

## 🚀 كيفية البدء

### الخطوة 1: قراءة دليل المصادقة
ابدأ بقراءة [`flutter-complete-guide.md`](./flutter-complete-guide.md) لفهم:
- كيفية إعداد نظام المصادقة
- إنشاء ApiService
- معالجة التوكن والأخطاء

### الخطوة 2: إعداد البيئة
```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  dio: ^5.3.2
  firebase_auth: ^4.15.3
  firebase_core: ^2.24.2
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.2
  socket_io_client: ^2.0.3+1
  provider: ^6.1.1
```

### الخطوة 3: تطبيق نماذج الكود
انسخ نماذج الكود من الأدلة:
- `ApiService` من دليل المصادقة
- `AuthService` من دليل المصادقة
- نماذج الشاشات من دليل صفحات التطبيق

### الخطوة 4: استخدام المرجع السريع
احتفظ بـ [`flutter-api-quick-reference.md`](./flutter-api-quick-reference.md) مفتوحاً أثناء التطوير للمراجعة السريعة.

---

## 🏗️ هيكل التطبيق المقترح

```
lib/
├── main.dart
├── models/
│   ├── user.dart
│   ├── artwork.dart
│   ├── chat.dart
│   └── ...
├── services/
│   ├── api_service.dart
│   ├── auth_service.dart
│   ├── chat_service.dart
│   └── ...
├── providers/
│   ├── auth_provider.dart
│   ├── home_provider.dart
│   └── ...
├── screens/
│   ├── auth/
│   │   ├── login_screen.dart
│   │   ├── register_screen.dart
│   │   └── forgot_password_screen.dart
│   ├── home/
│   │   └── home_screen.dart
│   ├── profile/
│   │   └── profile_screen.dart
│   ├── chat/
│   │   ├── chat_list_screen.dart
│   │   └── chat_screen.dart
│   └── ...
├── widgets/
│   ├── common/
│   └── custom/
└── utils/
    ├── constants.dart
    ├── error_handler.dart
    └── validators.dart
```

---

## 🔧 نصائح مهمة للتطوير

### 1. إدارة الحالة
```dart
// استخدم Provider أو Riverpod
MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => AuthProvider()),
    ChangeNotifierProvider(create: (_) => HomeProvider()),
    ChangeNotifierProvider(create: (_) => ChatProvider()),
  ],
  child: MyApp(),
)
```

### 2. معالجة الأخطاء
```dart
// أنشئ ErrorHandler مركزي
class ErrorHandler {
  static void handleApiError(BuildContext context, dynamic error) {
    // معالجة الأخطاء حسب نوعها
  }
}
```

### 3. أمان التوكن
```dart
// استخدم FlutterSecureStorage للتوكن
final storage = FlutterSecureStorage();
await storage.write(key: 'access_token', value: token);
```

### 4. Socket.IO للمحادثات
```dart
// اتبع الأمثلة في دليل صفحات التطبيق
import 'package:socket_io_client/socket_io_client.dart' as IO;
```

---

## 📋 قائمة مراجعة التطوير

### المصادقة ✅
- [ ] إعداد ApiService
- [ ] إعداد AuthService  
- [ ] شاشة تسجيل الدخول
- [ ] شاشة إنشاء الحساب
- [ ] شاشة نسيت كلمة المرور
- [ ] تجديد التوكن التلقائي
- [ ] Firebase Authentication

### الصفحات الرئيسية ✅
- [ ] الصفحة الرئيسية
- [ ] قائمة الأعمال الفنية
- [ ] تفاصيل العمل الفني
- [ ] الملف الشخصي
- [ ] إعدادات المستخدم

### المحادثات ✅
- [ ] قائمة المحادثات
- [ ] شاشة المحادثة
- [ ] Socket.IO integration
- [ ] إرسال الصور
- [ ] الإشعارات المباشرة

### الوظائف الإضافية ✅
- [ ] المفضلة
- [ ] المتابعة
- [ ] التقييمات
- [ ] التقارير
- [ ] الطلبات المخصصة
- [ ] المعاملات

---

## 🆘 الحصول على المساعدة

### 1. مراجعة الوثائق
- ابدأ بالمرجع السريع للعثور على API المطلوب
- راجع الدليل المفصل للحصول على أمثلة كاملة

### 2. أخطاء شائعة وحلولها

#### خطأ 401 (Unauthorized)
```dart
// تأكد من إرسال التوكن
headers: {'Authorization': 'Bearer $token'}
```

#### خطأ في رفع الصور
```dart
// استخدم FormData للصور
FormData.fromMap({
  'images': [MultipartFile.fromFileSync(imagePath)]
})
```

#### مشاكل Socket.IO
```dart
// تأكد من الحصول على socket token أولاً
final tokenResponse = await ApiService.get('/chat/socket-token');
```

### 3. نصائح الأداء

#### Pagination
```dart
// استخدم pagination للقوائم الطويلة
final response = await ApiService.get('/artworks', 
  queryParameters: {'page': page, 'limit': 20});
```

#### Caching
```dart
// اعمل cache للبيانات المهمة
SharedPreferences prefs = await SharedPreferences.getInstance();
prefs.setString('cached_data', jsonEncode(data));
```

#### Loading States
```dart
// اعرض loading indicators
bool _isLoading = false;
if (_isLoading) return CircularProgressIndicator();
```

---

## 🌟 مثال تطبيق كامل

```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => HomeProvider()),
      ],
      child: ArtHubApp(),
    ),
  );
}

class ArtHubApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ArtHub',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        fontFamily: 'Cairo', // للعربية
      ),
      home: Consumer<AuthProvider>(
        builder: (context, auth, child) {
          return auth.isAuthenticated 
              ? MainScreen() 
              : LoginScreen();
        },
      ),
    );
  }
}
```

---

## 🎉 ختاماً

هذه الأدلة توفر كل ما تحتاجه لبناء تطبيق ArtHub بـ Flutter بشكل احترافي وكامل. اتبع الخطوات بالترتيب واستخدم المرجع السريع للوصول السريع للمعلومات.

**نصيحة أخيرة:** ابدأ بالمصادقة أولاً، ثم انتقل للصفحات الرئيسية، وأخيراً أضف الوظائف المتقدمة مثل المحادثات والإشعارات.

---

## 📞 معلومات مهمة

- **Base URL**: `https://your-domain.com/api`
- **Socket.IO URL**: `https://your-domain.com`
- **Authentication**: JWT Token في Header
- **File Upload**: multipart/form-data
- **Real-time**: Socket.IO للمحادثات والإشعارات

**حظاً موفقاً في التطوير! 🚀** 