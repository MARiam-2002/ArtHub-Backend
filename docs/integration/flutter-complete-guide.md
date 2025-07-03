# 📱 دليل Flutter الشامل - ArtHub Backend Integration

## 🎯 نظرة عامة

هذا الدليل يوضح لمطور Flutter كيفية ربط التطبيق بـ Backend ArtHub بشكل مفصل، مع شرح كل صفحة في دورة المصادقة والـ APIs المطلوبة.

## 🔧 معلومات أساسية

### Base URL
```
https://your-domain.com/api
```

### تنسيق الاستجابة
```json
{
  "success": true,
  "message": "رسالة النجاح",
  "data": {
    // البيانات المطلوبة
  }
}
```

### Headers مطلوبة
```
Content-Type: application/json
Authorization: Bearer YOUR_JWT_TOKEN  // للطلبات المحمية
```

---

## 🔐 دورة المصادقة الكاملة

### 1️⃣ شاشة البداية (Splash Screen)
**الوظيفة:** فحص حالة تسجيل الدخول
**APIs المطلوبة:** لا توجد

```dart
// فحص التوكن المحفوظ
Future<bool> checkAuthStatus() async {
  final token = await SecureStorage.read('access_token');
  if (token != null) {
    // التحقق من صحة التوكن
    final response = await ApiService.get('/auth/me');
    return response.success;
  }
  return false;
}
```

### 2️⃣ شاشة تسجيل الدخول
**APIs المطلوبة:**

#### أ) تسجيل الدخول بالإيميل وكلمة المرور
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "profileImage": {
      "url": "https://cloudinary.com/profile.jpg"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### ب) تسجيل الدخول بـ Firebase (Google/Facebook)
```http
POST /api/auth/firebase
Authorization: Bearer FIREBASE_ID_TOKEN
```

**Response:** نفس استجابة تسجيل الدخول العادي

#### ج) تسجيل الدخول بصمة الجهاز
```http
POST /api/auth/login-with-fingerprint
Authorization: Bearer JWT_TOKEN

{
  "fingerprint": "device_fingerprint_string"
}
```

**مثال Flutter:**
```dart
class LoginService {
  Future<AuthResult> loginWithEmail(String email, String password) async {
    final response = await ApiService.post('/auth/login', {
      'email': email,
      'password': password,
    });
    
    if (response.success) {
      await _saveTokens(response.data['accessToken'], response.data['refreshToken']);
      return AuthResult.success(response.data);
    }
    return AuthResult.error(response.message);
  }
  
  Future<AuthResult> loginWithFirebase(String firebaseToken) async {
    final response = await ApiService.post('/auth/firebase', {}, 
      headers: {'Authorization': 'Bearer $firebaseToken'});
    
    if (response.success) {
      await _saveTokens(response.data['accessToken'], response.data['refreshToken']);
      return AuthResult.success(response.data);
    }
    return AuthResult.error(response.message);
  }
}
```

### 3️⃣ شاشة إنشاء حساب جديد
**APIs المطلوبة:**

#### أ) إنشاء حساب جديد
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "displayName": "مريم فوزي",
  "role": "artist",
  "job": "فنانة تشكيلية",
  "fingerprint": "device_fingerprint_optional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إنشاء الحساب بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "isVerified": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**مثال Flutter:**
```dart
Future<AuthResult> register({
  required String email,
  required String password,
  required String confirmPassword,
  required String displayName,
  String role = 'user',
  String? job,
  String? fingerprint,
}) async {
  final response = await ApiService.post('/auth/register', {
    'email': email,
    'password': password,
    'confirmPassword': confirmPassword,
    'displayName': displayName,
    'role': role,
    'job': job,
    'fingerprint': fingerprint,
  });
  
  if (response.success) {
    await _saveTokens(response.data['accessToken'], response.data['refreshToken']);
    return AuthResult.success(response.data);
  }
  return AuthResult.error(response.message);
}
```

### 4️⃣ شاشة نسيت كلمة المرور
**APIs المطلوبة:**

#### أ) طلب رمز إعادة تعيين كلمة المرور
```http
POST /api/auth/forget-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### ب) التحقق من رمز إعادة التعيين
```http
POST /api/auth/verify-forget-code
Content-Type: application/json

{
  "email": "user@example.com",
  "forgetCode": "1234"
}
```

#### ج) إعادة تعيين كلمة المرور
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**مثال Flutter:**
```dart
class PasswordResetService {
  Future<bool> requestResetCode(String email) async {
    final response = await ApiService.post('/auth/forget-password', {
      'email': email,
    });
    return response.success;
  }
  
  Future<bool> verifyResetCode(String email, String code) async {
    final response = await ApiService.post('/auth/verify-forget-code', {
      'email': email,
      'forgetCode': code,
    });
    return response.success;
  }
  
  Future<bool> resetPassword(String email, String password, String confirmPassword) async {
    final response = await ApiService.post('/auth/reset-password', {
      'email': email,
      'password': password,
      'confirmPassword': confirmPassword,
    });
    return response.success;
  }
}
```

### 5️⃣ الحصول على بيانات المستخدم الحالي
```http
GET /api/auth/me
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "تم جلب بيانات المستخدم بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "profileImage": {
      "url": "https://cloudinary.com/profile.jpg"
    },
    "isVerified": true,
    "preferredLanguage": "ar",
    "notificationSettings": {
      "enablePush": true,
      "enableEmail": true,
      "muteChat": false
    }
  }
}
```

### 6️⃣ تجديد رمز الوصول
```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 7️⃣ تسجيل الخروج
```http
POST /api/auth/logout
Authorization: Bearer JWT_TOKEN
```

### 8️⃣ تحديث رمز الإشعارات (FCM)
```http
POST /api/auth/fcm-token
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "fcmToken": "fMEGG8-TQVSEJHBFrk-BZ3:APA91bH..."
}
```

### 9️⃣ تحديث بصمة الجهاز
```http
POST /api/auth/update-fingerprint
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "fingerprint": "new_device_fingerprint"
}
```

---

## 📱 إعداد Flutter للمصادقة

### 1. Dependencies المطلوبة
```yaml
dependencies:
  http: ^1.1.0
  firebase_auth: ^4.15.3
  firebase_core: ^2.24.2
  flutter_secure_storage: ^9.0.0
  shared_preferences: ^2.2.2
  dio: ^5.3.2
```

### 2. نموذج ApiService
```dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'https://your-domain.com/api';
  late Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    _setupInterceptors();
  }

  void _setupInterceptors() {
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'access_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _refreshToken();
          if (refreshed) {
            final opts = error.requestOptions;
            final token = await _storage.read(key: 'access_token');
            opts.headers['Authorization'] = 'Bearer $token';
            final cloneReq = await _dio.fetch(opts);
            return handler.resolve(cloneReq);
          }
        }
        handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refresh_token');
      if (refreshToken == null) return false;

      final response = await _dio.post('/auth/refresh-token', data: {
        'refreshToken': refreshToken,
      });

      if (response.statusCode == 200) {
        final data = response.data['data'];
        await _storage.write(key: 'access_token', value: data['accessToken']);
        await _storage.write(key: 'refresh_token', value: data['refreshToken']);
        return true;
      }
    } catch (e) {
      print('Error refreshing token: $e');
    }
    return false;
  }

  Future<ApiResponse> get(String path, {Map<String, dynamic>? queryParameters}) async {
    try {
      final response = await _dio.get(path, queryParameters: queryParameters);
      return ApiResponse.fromResponse(response);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }

  Future<ApiResponse> post(String path, dynamic data, {Map<String, dynamic>? headers}) async {
    try {
      final response = await _dio.post(path, data: data, options: Options(headers: headers));
      return ApiResponse.fromResponse(response);
    } catch (e) {
      return ApiResponse.error(e.toString());
    }
  }
}

class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;
  final int? statusCode;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.statusCode,
  });

  factory ApiResponse.fromResponse(Response response) {
    final data = response.data;
    return ApiResponse(
      success: data['success'] ?? false,
      message: data['message'] ?? '',
      data: data['data'],
      statusCode: response.statusCode,
    );
  }

  factory ApiResponse.error(String message) {
    return ApiResponse(
      success: false,
      message: message,
    );
  }
}
```

### 3. نموذج AuthService
```dart
class AuthService {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'access_token');
    return token != null;
  }

  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }

  Future<AuthResult> login(String email, String password) async {
    final response = await _apiService.post('/auth/login', {
      'email': email,
      'password': password,
    });

    if (response.success) {
      await saveTokens(
        response.data['accessToken'],
        response.data['refreshToken'],
      );
      return AuthResult.success(response.data);
    }
    return AuthResult.error(response.message);
  }

  Future<void> logout() async {
    await _apiService.post('/auth/logout', {});
    await clearTokens();
  }
}

class AuthResult {
  final bool success;
  final String? message;
  final dynamic data;

  AuthResult({required this.success, this.message, this.data});

  factory AuthResult.success(dynamic data) {
    return AuthResult(success: true, data: data);
  }

  factory AuthResult.error(String message) {
    return AuthResult(success: false, message: message);
  }
}
```

---

## 🔄 تدفق المصادقة في Flutter

### 1. فحص حالة المصادقة عند بدء التطبيق
```dart
class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  User? _currentUser;

  bool get isAuthenticated => _isAuthenticated;
  User? get currentUser => _currentUser;

  Future<void> checkAuthStatus() async {
    final authService = AuthService();
    final isLoggedIn = await authService.isLoggedIn();
    
    if (isLoggedIn) {
      final response = await ApiService().get('/auth/me');
      if (response.success) {
        _currentUser = User.fromJson(response.data);
        _isAuthenticated = true;
      } else {
        await authService.clearTokens();
      }
    }
    
    notifyListeners();
  }
}
```

### 2. تطبيق التدفق في main.dart
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  runApp(
    ChangeNotifierProvider(
      create: (context) => AuthProvider(),
      child: MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Consumer<AuthProvider>(
        builder: (context, authProvider, child) {
          return FutureBuilder(
            future: authProvider.checkAuthStatus(),
            builder: (context, snapshot) {
              if (snapshot.connectionState == ConnectionState.waiting) {
                return SplashScreen();
              }
              
              return authProvider.isAuthenticated
                  ? HomeScreen()
                  : LoginScreen();
            },
          );
        },
      ),
    );
  }
}
```

---

## 🚨 معالجة الأخطاء

### أكواد الأخطاء الشائعة:
- `401`: غير مصرح - يجب تسجيل الدخول
- `403`: ممنوع - ليس لديك صلاحية
- `409`: تضارب - البريد الإلكتروني مستخدم بالفعل
- `422`: بيانات غير صحيحة
- `500`: خطأ في الخادم

### مثال معالجة الأخطاء:
```dart
Future<void> handleApiError(ApiResponse response) async {
  switch (response.statusCode) {
    case 401:
      // إعادة توجيه لشاشة تسجيل الدخول
      await AuthService().clearTokens();
      Navigator.pushReplacementNamed(context, '/login');
      break;
    case 409:
      showErrorDialog('البريد الإلكتروني مستخدم بالفعل');
      break;
    default:
      showErrorDialog(response.message);
  }
}
```

---

## 📝 ملاحظات مهمة

1. **أمان التوكن**: استخدم `flutter_secure_storage` لحفظ التوكن
2. **تجديد التوكن**: اعمل auto-refresh للتوكن عند انتهاء صلاحيته
3. **معالجة الأخطاء**: اعرض رسائل خطأ واضحة للمستخدم
4. **Loading States**: اعرض loading indicators أثناء الطلبات
5. **Offline Support**: اعمل caching للبيانات المهمة

هذا الدليل يوفر كل ما يحتاجه مطور Flutter للتكامل مع نظام المصادقة في ArtHub Backend بشكل كامل وآمن. 