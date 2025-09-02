# دليل تكامل نظام التوكن مع Flutter - ArtHub

## 🚀 نظرة سريعة

هذا الدليل يوضح كيفية تنفيذ نظام التوكن المزدوج (Access + Refresh Token) في تطبيق Flutter مع ArtHub Backend.

## 📱 ما تحتاجه في Flutter

### 1. إضافة المكتبات المطلوبة

```yaml
# pubspec.yaml
dependencies:
  dio: ^5.0.0
  flutter_secure_storage: ^8.0.0
  shared_preferences: ^2.2.0
```

### 2. إنشاء ملف إدارة التوكن

```dart
// lib/services/token_service.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenService {
  static const _storage = FlutterSecureStorage();
  
  // حفظ التوكن
  static Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);
    
    // حفظ تاريخ انتهاء Access Token (6 دقائق)
    final expiry = DateTime.now().add(Duration(minutes: 6));
    await _storage.write(
      key: 'accessTokenExpiry', 
      value: expiry.toIso8601String()
    );
  }
  
  // الحصول على Access Token
  static Future<String?> getAccessToken() async {
    return await _storage.read(key: 'accessToken');
  }
  
  // الحصول على Refresh Token
  static Future<String?> getRefreshToken() async {
    return await _storage.read(key: 'refreshToken');
  }
  
  // فحص انتهاء صلاحية Access Token
  static Future<bool> isAccessTokenExpired() async {
    final expiry = await _storage.read(key: 'accessTokenExpiry');
    if (expiry == null) return true;
    
    final expiryDate = DateTime.parse(expiry);
    // إضافة 60 ثانية buffer
    return DateTime.now().isAfter(expiryDate.subtract(Duration(seconds: 60)));
  }
  
  // حذف التوكن
  static Future<void> deleteTokens() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
    await _storage.delete(key: 'accessTokenExpiry');
  }
}
```

### 3. إعداد Dio مع Interceptors

```dart
// lib/services/api_service.dart
import 'package:dio/dio.dart';
import 'token_service.dart';

class ApiService {
  static Dio? _dio;
  static bool _isRefreshing = false;
  
  static Dio get dio {
    _dio ??= _createDio();
    return _dio!;
  }
  
  static Dio _createDio() {
    final dio = Dio(BaseOptions(
      baseUrl: 'https://arthub-backend.up.railway.app/api/',
      connectTimeout: Duration(seconds: 30),
      receiveTimeout: Duration(seconds: 30),
    ));
    
    // إضافة Interceptors
    dio.interceptors.add(_createAuthInterceptor());
    dio.interceptors.add(_createRefreshInterceptor());
    
    return dio;
  }
  
  // Interceptor لإضافة التوكن
  static Interceptor _createAuthInterceptor() {
    return InterceptorsWrapper(
      onRequest: (options, handler) async {
        // تخطي إضافة التوكن لنقاط النهاية الخاصة بالمصادقة
        if (_isAuthEndpoint(options.path)) {
          return handler.next(options);
        }
        
        final accessToken = await TokenService.getAccessToken();
        if (accessToken != null) {
          final isExpired = await TokenService.isAccessTokenExpired();
          
          if (isExpired) {
            // انتظار اكتمال عملية التجديد
            await _waitForRefresh();
            
            final newToken = await TokenService.getAccessToken();
            if (newToken != null) {
              options.headers['Authorization'] = 'Bearer $newToken';
            }
          } else {
            options.headers['Authorization'] = 'Bearer $accessToken';
          }
        }
        
        return handler.next(options);
      },
    );
  }
  
  // Interceptor لمعالجة أخطاء 401
  static Interceptor _createRefreshInterceptor() {
    return InterceptorsWrapper(
      onError: (error, handler) async {
        if (error.response?.statusCode == 401 && 
            !_isAuthEndpoint(error.requestOptions.path)) {
          try {
            final response = await _refreshTokenAndRetry(error.requestOptions);
            return handler.resolve(response);
          } catch (e) {
            // إذا فشل التجديد، تسجيل الخروج
            await TokenService.deleteTokens();
            // إعادة توجيه المستخدم لشاشة تسجيل الدخول
            return handler.next(error);
          }
        }
        return handler.next(error);
      },
    );
  }
  
  // فحص إذا كان endpoint خاص بالمصادقة
  static bool _isAuthEndpoint(String path) {
    return path.contains('auth') || path.contains('refresh');
  }
  
  // انتظار اكتمال عملية التجديد
  static Future<void> _waitForRefresh() async {
    while (_isRefreshing) {
      await Future.delayed(Duration(milliseconds: 100));
    }
  }
  
  // تجديد التوكن وإعادة المحاولة
  static Future<Response> _refreshTokenAndRetry(RequestOptions requestOptions) async {
    if (_isRefreshing) {
      await _waitForRefresh();
      
      final newToken = await TokenService.getAccessToken();
      if (newToken != null) {
        requestOptions.headers['Authorization'] = 'Bearer $newToken';
      }
      
      final newDio = Dio();
      return await newDio.request(
        requestOptions.uri.toString(),
        data: requestOptions.data,
        queryParameters: requestOptions.queryParameters,
        options: Options(
          method: requestOptions.method,
          headers: requestOptions.headers,
        ),
      );
    }
    
    _isRefreshing = true;
    
    try {
      final refreshToken = await TokenService.getRefreshToken();
      if (refreshToken == null) {
        throw Exception('No refresh token available');
      }
      
      // طلب تجديد التوكن
      final refreshDio = Dio();
      final response = await refreshDio.post(
        'https://arthub-backend.up.railway.app/api/auth/refresh-token',
        data: {"refreshToken": refreshToken},
      );
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final newAccessToken = response.data["data"]["accessToken"];
        final newRefreshToken = response.data["data"]["refreshToken"];
        
        // حفظ التوكن الجديد
        await TokenService.saveTokens(
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        );
        
        // تحديث الطلب الأصلي
        requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
        
        // إعادة المحاولة
        final newDio = Dio();
        final retryResponse = await newDio.request(
          requestOptions.uri.toString(),
          data: requestOptions.data,
          queryParameters: requestOptions.queryParameters,
          options: Options(
            method: requestOptions.method,
            headers: requestOptions.headers,
          ),
        );
        
        return retryResponse;
      } else {
        throw Exception('Token refresh failed');
      }
    } finally {
      _isRefreshing = false;
    }
  }
}
```

## 🔐 كيفية الاستخدام

### 1. تسجيل الدخول

```dart
// lib/features/auth/login/login_cubit.dart
class LoginCubit extends Cubit<LoginState> {
  Future<void> login({required String email, required String password}) async {
    emit(LoginLoading());
    
    try {
      final response = await ApiService.dio.post('/auth/login', data: {
        "email": email,
        "password": password
      });
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final userData = response.data['data'];
        
        // حفظ التوكن
        await TokenService.saveTokens(
          accessToken: userData['accessToken'],
          refreshToken: userData['refreshToken'],
        );
        
        // حفظ بيانات المستخدم
        final user = UserModel.fromJson(userData);
        
        emit(LoginSuccess(user, response.data['message']));
      } else {
        emit(LoginFailure(response.data['message'] ?? 'فشل تسجيل الدخول'));
      }
    } catch (error) {
      emit(LoginFailure('حدث خطأ ما'));
    }
  }
}
```

### 2. إرسال طلبات API

```dart
// مثال: جلب قائمة الأعمال الفنية
Future<List<Artwork>> getArtworks() async {
  try {
    // التوكن يتم إضافته تلقائياً
    final response = await ApiService.dio.get('/artworks');
    
    if (response.statusCode == 200) {
      final List<dynamic> artworksData = response.data['data'];
      return artworksData.map((json) => Artwork.fromJson(json)).toList();
    }
    
    throw Exception('Failed to load artworks');
  } catch (error) {
    throw Exception('Network error: $error');
  }
}

// مثال: رفع صورة
Future<void> uploadArtwork(File image, String title) async {
  try {
    final formData = FormData.fromMap({
      'image': await MultipartFile.fromFile(image.path),
      'title': title,
    });
    
    // التوكن يتم إضافته تلقائياً
    final response = await ApiService.dio.post('/artworks', data: formData);
    
    if (response.statusCode != 200) {
      throw Exception('Upload failed');
    }
  } catch (error) {
    throw Exception('Upload error: $error');
  }
}
```

### 3. تسجيل الخروج

```dart
Future<void> logout() async {
  try {
    // إرسال طلب تسجيل الخروج للخادم
    await ApiService.dio.post('/auth/logout');
  } catch (error) {
    // تجاهل الأخطاء في حالة فشل الاتصال
  } finally {
    // حذف التوكن من التخزين المحلي
    await TokenService.deleteTokens();
    
    // إعادة توجيه المستخدم لشاشة تسجيل الدخول
    // يمكنك استخدام GetX أو Navigator
  }
}
```

## 📋 نقاط النهاية المهمة

### المصادقة
```
POST /api/auth/login          - تسجيل الدخول
POST /api/auth/register       - إنشاء حساب جديد
POST /api/auth/refresh-token  - تجديد التوكن
POST /api/auth/logout         - تسجيل الخروج
POST /api/auth/firebase       - تسجيل الدخول بـ Firebase
```

### الأعمال الفنية
```
GET  /api/artworks           - جلب قائمة الأعمال
POST /api/artworks           - إنشاء عمل فني جديد
GET  /api/artworks/:id       - جلب عمل فني محدد
PUT  /api/artworks/:id       - تحديث عمل فني
DELETE /api/artworks/:id     - حذف عمل فني
```

### المستخدمين
```
GET  /api/user/profile       - جلب ملف المستخدم
PUT  /api/user/profile       - تحديث ملف المستخدم
GET  /api/user/wishlist      - قائمة المفضلة
```

## ⚠️ ملاحظات مهمة

### 1. أمان التوكن
- استخدم `FlutterSecureStorage` لتخزين التوكن
- لا تحفظ التوكن في `SharedPreferences` العادية
- احذف التوكن عند تسجيل الخروج

### 2. معالجة الأخطاء
- تعامل مع أخطاء 401 بتجديد التوكن
- إذا فشل التجديد، سجل المستخدم للخروج
- أضف retry mechanism للطلبات الفاشلة

### 3. الأداء
- استخدم `_isRefreshing` flag لمنع عمليات تجديد متعددة
- أضف timeout مناسب للطلبات
- استخدم caching للبيانات الثابتة

## 🔧 استكشاف الأخطاء

### مشكلة: التوكن لا يتم إرساله
**الحل:** تأكد من أن `TokenService.saveTokens()` تم استدعاؤها بعد تسجيل الدخول

### مشكلة: خطأ 401 مستمر
**الحل:** تحقق من صحة Refresh Token وتأكد من عدم انتهاء صلاحيته

### مشكلة: عمليات تجديد متعددة
**الحل:** تأكد من استخدام `_isRefreshing` flag بشكل صحيح

### مشكلة: التوكن لا يتم حفظه
**الحل:** تحقق من إعدادات `FlutterSecureStorage` وإذنات التطبيق

## 📱 مثال كامل لشاشة تسجيل الدخول

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('تسجيل الدخول')),
      body: BlocConsumer<LoginCubit, LoginState>(
        listener: (context, state) {
          if (state is LoginSuccess) {
            // الانتقال للشاشة الرئيسية
            Navigator.pushReplacementNamed(context, '/home');
          } else if (state is LoginFailure) {
            // عرض رسالة الخطأ
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(content: Text(state.message)),
            );
          }
        },
        builder: (context, state) {
          return Padding(
            padding: EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  TextFormField(
                    controller: _emailController,
                    decoration: InputDecoration(labelText: 'البريد الإلكتروني'),
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'البريد الإلكتروني مطلوب';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: _passwordController,
                    decoration: InputDecoration(labelText: 'كلمة المرور'),
                    obscureText: true,
                    validator: (value) {
                      if (value?.isEmpty ?? true) {
                        return 'كلمة المرور مطلوبة';
                      }
                      return null;
                    },
                  ),
                  SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: state is LoginLoading ? null : _login,
                    child: state is LoginLoading 
                      ? CircularProgressIndicator()
                      : Text('تسجيل الدخول'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
  
  void _login() {
    if (_formKey.currentState?.validate() ?? false) {
      context.read<LoginCubit>().login(
        email: _emailController.text,
        password: _passwordController.text,
      );
    }
  }
}
```

## 🎯 الخلاصة

هذا النظام يوفر:
- ✅ أمان عالي مع Access Token قصير المدة
- ✅ تجربة مستخدم سلسة مع Refresh Token
- ✅ تجديد تلقائي للتوكن
- ✅ معالجة ذكية للأخطاء
- ✅ سهولة الاستخدام في Flutter

## 📞 الدعم

إذا واجهت أي مشاكل:
1. تحقق من console logs
2. تأكد من صحة API endpoints
3. تحقق من إعدادات التوكن
4. راجع هذا الدليل مرة أخرى

---

**تم إنشاء هذا الدليل بواسطة فريق ArtHub Backend** 🚀
