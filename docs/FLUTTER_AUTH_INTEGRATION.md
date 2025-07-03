# دليل تكامل نظام المصادقة مع Flutter - ArtHub

## نظرة عامة

يوفر نظام المصادقة في ArtHub طرق متعددة للمصادقة مع دعم كامل لـ JWT و Firebase Authentication. هذا الدليل يوضح كيفية تكامل النظام مع تطبيق Flutter.

## الـ API Endpoints المتاحة

### Base URL
```
https://your-api-url.com/api/auth
```

### قائمة الـ Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | تسجيل مستخدم جديد | ❌ |
| POST | `/login` | تسجيل الدخول | ❌ |
| POST | `/firebase` | تسجيل الدخول بـ Firebase | ❌ |
| POST | `/forgot-password` | نسيان كلمة المرور | ❌ |
| POST | `/verify-forget-code` | التحقق من رمز الاستعادة | ❌ |
| POST | `/reset-password` | إعادة تعيين كلمة المرور | ❌ |
| POST | `/refresh-token` | تحديث الرمز المميز | ❌ |
| POST | `/logout` | تسجيل الخروج | ✅ |
| GET | `/me` | الحصول على بيانات المستخدم | ✅ |
| POST | `/fcm-token` | تحديث رمز الإشعارات | ✅ |

## نماذج الطلبات والاستجابات

### 1. تسجيل مستخدم جديد

**POST** `/auth/register`

```json
// Request Body
{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "displayName": "مريم فوزي",
  "role": "artist"
}

// Success Response (201)
{
  "success": true,
  "message": "تم إنشاء الحساب بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "profileImage": {
      "url": "https://res.cloudinary.com/demo/image/upload/default_profile.jpg"
    },
    "isVerified": false,
    "preferredLanguage": "ar",
    "notificationSettings": {
      "enablePush": true,
      "enableEmail": true,
      "muteChat": false
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Error Response (409)
{
  "success": false,
  "message": "البريد الإلكتروني مستخدم بالفعل",
  "errorCode": "DUPLICATE_ENTITY"
}
```

### 2. تسجيل الدخول

**POST** `/auth/login`

```json
// Request Body
{
  "email": "user@example.com",
  "password": "Password123!"
}

// Success Response (200)
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "profileImage": {
      "url": "https://res.cloudinary.com/demo/image/upload/profile.jpg"
    },
    "isVerified": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}

// Error Response (400)
{
  "success": false,
  "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "errorCode": "INVALID_CREDENTIALS"
}
```

### 3. تسجيل الدخول بـ Firebase

**POST** `/auth/firebase`

```json
// Headers
{
  "Authorization": "Bearer FIREBASE_ID_TOKEN"
}

// Success Response (200)
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "user",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. نسيان كلمة المرور

**POST** `/auth/forgot-password`

```json
// Request Body
{
  "email": "user@example.com"
}

// Success Response (200)
{
  "success": true,
  "message": "تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
}
```

### 5. التحقق من رمز الاستعادة

**POST** `/auth/verify-forget-code`

```json
// Request Body
{
  "email": "user@example.com",
  "forgetCode": "1234"
}

// Success Response (200)
{
  "success": true,
  "message": "تم التحقق من الرمز بنجاح، يمكنك الآن إعادة تعيين كلمة المرور"
}
```

### 6. إعادة تعيين كلمة المرور

**POST** `/auth/reset-password`

```json
// Request Body
{
  "email": "user@example.com",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}

// Success Response (200)
{
  "success": true,
  "message": "تم إعادة تعيين كلمة المرور بنجاح، يرجى تسجيل الدخول"
}
```

### 7. تحديث الرمز المميز

**POST** `/auth/refresh-token`

```json
// Request Body
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Success Response (200)
{
  "success": true,
  "message": "تم تحديث رمز الوصول بنجاح",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 8. تسجيل الخروج

**POST** `/auth/logout`

```json
// Headers
{
  "Authorization": "Bearer ACCESS_TOKEN"
}

// Request Body (Optional)
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Success Response (200)
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

### 9. الحصول على بيانات المستخدم

**GET** `/auth/me`

```json
// Headers
{
  "Authorization": "Bearer ACCESS_TOKEN"
}

// Success Response (200)
{
  "success": true,
  "message": "تم جلب بيانات المستخدم بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "profileImage": {
      "url": "https://res.cloudinary.com/demo/image/upload/profile.jpg"
    },
    "coverImages": [],
    "isVerified": true,
    "preferredLanguage": "ar",
    "notificationSettings": {
      "enablePush": true,
      "enableEmail": true,
      "muteChat": false
    },
    "lastActive": "2023-05-15T10:30:45.123Z"
  }
}
```

### 10. تحديث رمز الإشعارات

**POST** `/auth/fcm-token`

```json
// Headers
{
  "Authorization": "Bearer ACCESS_TOKEN"
}

// Request Body
{
  "fcmToken": "fMEGG8-TQVSEJHBFrk-BZ3:APA91bHZKmJLnmRJHBFrk..."
}

// Success Response (200)
{
  "success": true,
  "message": "تم تحديث رمز الإشعارات بنجاح"
}
```

## رموز الأخطاء الشائعة

| Error Code | Status | Description |
|------------|--------|-------------|
| `INVALID_CREDENTIALS` | 400 | بيانات الدخول غير صحيحة |
| `DUPLICATE_ENTITY` | 409 | البريد الإلكتروني مستخدم بالفعل |
| `UNAUTHORIZED` | 401 | غير مصرح بالوصول |
| `FORBIDDEN` | 403 | الحساب معطل أو محذوف |
| `NOT_FOUND` | 404 | المستخدم غير موجود |
| `VALIDATION_ERROR` | 400 | خطأ في البيانات المدخلة |
| `TOKEN_EXPIRED` | 401 | انتهت صلاحية الرمز المميز |
| `INVALID_TOKEN` | 401 | رمز غير صالح |

## قواعد التحقق من البيانات

### البريد الإلكتروني
- مطلوب
- يجب أن يكون بصيغة صحيحة

### كلمة المرور
- مطلوبة
- 8 أحرف على الأقل
- يجب أن تحتوي على:
  - حرف كبير واحد على الأقل
  - حرف صغير واحد على الأقل
  - رقم أو رمز خاص واحد على الأقل

### اسم المستخدم
- مطلوب
- من 2 إلى 50 حرف

### رمز التحقق
- 4 أرقام بالضبط

## مثال كامل للتكامل مع Flutter

### 1. إعداد Dependencies

```yaml
dependencies:
  flutter:
    sdk: flutter
  dio: ^5.3.2
  flutter_secure_storage: ^9.0.0
  provider: ^6.1.1
  firebase_auth: ^4.15.3
  firebase_core: ^2.24.2
```

### 2. إعداد API Service

```dart
// services/api_service.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'https://your-api-url.com/api';
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
      print('Refresh token error: $e');
    }
    return false;
  }

  Dio get dio => _dio;
}
```

### 3. إعداد Auth Service

```dart
// services/auth_service.dart
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  Future<Map<String, dynamic>> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiService.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success']) {
        final data = response.data['data'];
        await _saveTokens(data['accessToken'], data['refreshToken']);
        return {'success': true, 'data': data};
      }
      
      return {'success': false, 'message': response.data['message']};
    } on DioException catch (e) {
      return {
        'success': false,
        'message': e.response?.data['message'] ?? 'حدث خطأ أثناء تسجيل الدخول'
      };
    }
  }

  Future<void> _saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'access_token', value: accessToken);
    await _storage.write(key: 'refresh_token', value: refreshToken);
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'access_token');
    return token != null;
  }

  Future<void> logout() async {
    await _storage.delete(key: 'access_token');
    await _storage.delete(key: 'refresh_token');
  }
}
```

### 4. مثال على شاشة تسجيل الدخول

```dart
// screens/login_screen.dart
import 'package:flutter/material.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('تسجيل الدخول'),
        centerTitle: true,
      ),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'البريد الإلكتروني',
                  prefixIcon: Icon(Icons.email),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'يرجى إدخال البريد الإلكتروني';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'كلمة المرور',
                  prefixIcon: Icon(Icons.lock),
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'يرجى إدخال كلمة المرور';
                  }
                  return null;
                },
              ),
              SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _handleLogin,
                  child: _isLoading
                      ? CircularProgressIndicator(color: Colors.white)
                      : Text('تسجيل الدخول'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isLoading = true;
    });

    try {
      final authService = AuthService();
      final result = await authService.login(
        email: _emailController.text.trim(),
        password: _passwordController.text,
      );

      if (result['success']) {
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(result['message']),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }
}
```

## نصائح للتطوير

### 1. إدارة الأخطاء
```dart
try {
  final result = await authService.login(email: email, password: password);
  if (result['success']) {
    // نجح تسجيل الدخول
  } else {
    // عرض رسالة الخطأ
    showSnackBar(result['message']);
  }
} catch (e) {
  showSnackBar('حدث خطأ غير متوقع');
}
```

### 2. التحقق من حالة الاتصال
```dart
bool hasConnection = await Connectivity().checkConnectivity() != ConnectivityResult.none;
if (!hasConnection) {
  showSnackBar('تحقق من اتصال الإنترنت');
  return;
}
```

### 3. حفظ حالة المستخدم
```dart
class AuthProvider with ChangeNotifier {
  User? _user;
  bool get isLoggedIn => _user != null;
  
  Future<void> loadUser() async {
    if (await authService.isLoggedIn()) {
      // تحميل بيانات المستخدم
      final userData = await authService.getCurrentUser();
      _user = User.fromJson(userData);
      notifyListeners();
    }
  }
}
```

## الخلاصة

هذا الدليل يوفر كل ما تحتاجه للتكامل مع نظام المصادقة في ArtHub. تأكد من:

1. **اختبار جميع السيناريوهات** قبل النشر
2. **معالجة الأخطاء** بشكل مناسب
3. **حفظ الرموز بأمان** باستخدام Secure Storage
4. **تحديث الرموز تلقائياً** عند انتهاء الصلاحية
5. **استخدام HTTPS** في الإنتاج

للمساعدة أو الاستفسارات، يرجى التواصل مع فريق التطوير. 