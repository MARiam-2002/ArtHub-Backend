# دورة حياة التوكن المفصلة في ArtHub 🔄

## 📋 نظرة عامة

هذا الدليل يوضح بالتفصيل كيف يعمل نظام Access Token و Refresh Token في ArtHub من البداية للنهاية.

## 🏗️ البنية الأساسية

### Backend (Node.js)
- **Access Token**: مدة صلاحية 1 دقيقة (60 ثانية)
- **Refresh Token**: مدة صلاحية 30 يوم
- **قاعدة البيانات**: MongoDB مع TTL index للتنظيف التلقائي

### Frontend (Flutter)
- **تخزين آمن**: FlutterSecureStorage
- **إدارة الطلبات**: Dio مع Interceptors
- **تجديد تلقائي**: عند انتهاء صلاحية Access Token

## 🚀 المرحلة 1: تسجيل الدخول (Login Flow)

### الخطوة 1: إرسال بيانات المستخدم

```dart
// Flutter
final response = await dio.post('/auth/login', data: {
  "email": "user@example.com",
  "password": "password123"
});
```

### الخطوة 2: معالجة في Backend

```javascript
// Backend - auth.controller.js
export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  
  // التحقق من المستخدم
  const user = await userModel.findOne({ email }).select('+password');
  const isPasswordValid = await user.comparePassword(password);
  
  // إنشاء التوكن
  const { accessToken, refreshToken } = generateTokens(user);
  
  // حفظ التوكن في قاعدة البيانات
  await saveTokenPair(user._id, accessToken, refreshToken, req.headers['user-agent']);
  
  // إرسال الاستجابة
  return res.status(200).json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: {
      accessToken,
      refreshToken,
      user: createUserResponse(user)
    }
  });
});
```

### الخطوة 3: إنشاء التوكن

```javascript
// Backend - auth.middleware.js
const generateTokens = (user) => {
  // Access Token - 1 دقيقة
  const accessToken = jwt.sign(
    { id: user._id, email: user.email, role: user.role }, 
    process.env.TOKEN_KEY, 
    { expiresIn: '1m' }
  );
  
  // Refresh Token - 30 يوم
  const refreshToken = jwt.sign(
    { id: user._id, tokenType: 'refresh' }, 
    process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, 
    { expiresIn: '30d' }
  );
  
  return { accessToken, refreshToken };
};
```

### الخطوة 4: حفظ التوكن في قاعدة البيانات

```javascript
// Backend - token.model.js
tokenSchema.statics.createTokenPair = async function (userId, accessToken, refreshToken, userAgent) {
  // حساب تاريخ انتهاء Access Token (1 دقيقة)
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setUTCMinutes(accessTokenExpiry.getUTCMinutes() + 1);
  
  // حساب تاريخ انتهاء Refresh Token (30 يوم)
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setUTCDate(refreshTokenExpiry.getUTCDate() + 30);
  
  return this.create({
    user: userId,
    token: accessToken,
    refreshToken,
    userAgent: userAgent || 'unknown',
    isValid: true,
    expiresAt: refreshTokenExpiry // استخدام انتهاء Refresh Token للوثيقة
  });
};
```

### الخطوة 5: حفظ التوكن في Flutter

```dart
// Flutter - login_cubit.dart
if (response.statusCode == 200 && response.data['success'] == true) {
  final userData = response.data['data'];
  
  // حفظ التوكن مع المدة الصحيحة
  await CacheServices.instance.saveToken(
    accessToken: userData['accessToken'],
    refreshToken: userData['refreshToken'],
    expiresIn: 60, // 60 ثانية = 1 دقيقة
  );
  
  // حفظ بيانات المستخدم
  await CacheServices.instance.saveUserData(
    id: user.id ?? '',
    name: user.displayName ?? '',
    email: user.email ?? '',
    image: user.profileImageUrl ?? '',
  );
  
  emit(LoginSuccess(user, response.data['message']));
}
```

## 📤 المرحلة 2: إرسال الطلبات (API Requests)

### الخطوة 1: فحص التوكن قبل الإرسال

```dart
// Flutter - dio_helper.dart (onRequest Interceptor)
onRequest: (options, handler) async {
  // تخطي endpoints المصادقة
  if (_isAuthEndpoint(options.path)) {
    return handler.next(options);
  }

  final accessToken = await CacheServices.instance.getAccessToken();
  
  if (accessToken != null) {
    // فحص انتهاء صلاحية التوكن
    final isExpired = await CacheServices.instance.isAccessTokenExpired();
    
    if (isExpired) {
      // انتظار اكتمال عملية التجديد
      await _waitForRefresh();
      
      // الحصول على التوكن الجديد
      final newAccessToken = await CacheServices.instance.getAccessToken();
      if (newAccessToken != null) {
        options.headers['Authorization'] = 'Bearer $newAccessToken';
      }
    } else {
      // استخدام التوكن الحالي
      options.headers['Authorization'] = 'Bearer $accessToken';
    }
  }
  
  return handler.next(options);
},
```

### الخطوة 2: فحص انتهاء الصلاحية

```dart
// Flutter - shared_pref_helper.dart
Future<bool> isAccessTokenExpired() async {
  try {
    final expiry = await storage.read(key: 'accessTokenExpiry');
    if (expiry == null) return true;

    final expiryDate = DateTime.parse(expiry);
    // إضافة 10 ثوان buffer للتوكن مدته دقيقة واحدة
    return DateTime.now().isAfter(expiryDate.subtract(Duration(seconds: 10)));
  } catch (e) {
    return true;
  }
}
```

### الخطوة 3: التحقق من التوكن في Backend

```javascript
// Backend - auth.middleware.js
const verifyJWTToken = async (token) => {
  // التحقق من صحة JWT
  const decoded = jwt.verify(token, process.env.TOKEN_KEY);
  
  // التحقق من وجود التوكن في قاعدة البيانات
  const tokenDoc = await tokenModel.findValidToken(token);
  if (!tokenDoc) throw new Error('Invalid or revoked token');
  
  // التحقق من المستخدم
  const user = await userModel.findById(decoded.id).select('-password');
  if (!user || !user.isActive || user.isDeleted) throw new Error('User not found or disabled');
  
  return user;
};
```

## 🔄 المرحلة 3: تجديد التوكن (Token Refresh)

### السيناريو 1: تجديد استباقي (قبل انتهاء الصلاحية)

```dart
// Flutter - dio_helper.dart
if (isExpired) {
  // بدء عملية التجديد
  await _waitForRefresh();
  
  // الحصول على التوكن الجديد
  final newAccessToken = await CacheServices.instance.getAccessToken();
  if (newAccessToken != null) {
    options.headers['Authorization'] = 'Bearer $newAccessToken';
  }
}
```

### السيناريو 2: تجديد بعد خطأ 401

```dart
// Flutter - dio_helper.dart (onError Interceptor)
onError: (DioException error, handler) async {
  // معالجة أخطاء 401
  if (error.response?.statusCode == 401 && 
      !_isAuthEndpoint(error.requestOptions.path)) {
    try {
      // تجديد التوكن وإعادة المحاولة
      final response = await _refreshTokenAndRetry(error.requestOptions);
      return handler.resolve(response);
    } catch (refreshError) {
      // فشل التجديد - تسجيل خروج
      await CacheServices.instance.deleteToken();
      await CacheServices.instance.setUserLogin(false);
      return handler.next(error);
    }
  }
  return handler.next(error);
},
```

### الخطوة 1: إرسال طلب التجديد

```dart
// Flutter - dio_helper.dart
Future<Response> _refreshTokenAndRetry(RequestOptions requestOptions) async {
  if (_isRefreshing) {
    // انتظار اكتمال عملية التجديد الجارية
    await _waitForRefresh();
    // إعادة المحاولة بالتوكن الجديد
    // ... كود إعادة المحاولة
  }

  _isRefreshing = true;

  try {
    final refreshToken = await CacheServices.instance.getRefreshToken();
    
    if (refreshToken == null) {
      throw Exception('No refresh token available');
    }

    // إرسال طلب التجديد
    final refreshDio = Dio();
    final response = await refreshDio.post(
      '${ApiConstant.baseUrl}${ApiConstant.refreshToken}',
      data: {"refreshToken": refreshToken},
    );

    if (response.statusCode == 200 && response.data['success'] == true) {
      // معالجة الاستجابة الناجحة
      // ... كود حفظ التوكن الجديد
    }
  } finally {
    _isRefreshing = false;
    // إكمال جميع الطلبات المنتظرة
    // ... كود إكمال الطلبات
  }
}
```

### الخطوة 2: معالجة طلب التجديد في Backend

```javascript
// Backend - auth.controller.js
export const refreshToken = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return next(new Error('رمز التحديث مطلوب', { cause: 400 }));
    }

    // التحقق من صحة Refresh Token
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'رمز التحديث غير صالح',
        errorCode: 'INVALID_TOKEN'
      });
    }

    // التحقق من وجود التوكن في قاعدة البيانات
    const tokenDoc = await tokenModel.findValidRefreshToken(refreshToken);
    
    // الحصول على المستخدم
    const user = await userModel.findById(decoded.id);
    if (!user || !user.isActive || user.isDeleted) {
      return res.status(401).json({
        success: false,
        message: 'المستخدم غير موجود أو معطل',
        errorCode: 'USER_DISABLED'
      });
    }
    
    // إنشاء توكن جديد
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // تحديث التوكن في قاعدة البيانات
    if (tokenDoc) {
      await tokenModel.updateTokenPair(tokenDoc._id, accessToken, newRefreshToken);
    } else {
      await tokenModel.createTokenPair(user._id, accessToken, newRefreshToken, req.headers['user-agent']);
    }
    
    return res.status(200).json({
      success: true,
      message: 'تم تحديث رمز الوصول بنجاح',
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'حدث خطأ أثناء تحديث الرمز',
      errorCode: 'SERVER_ERROR'
    });
  }
});
```

### الخطوة 3: حفظ التوكن الجديد

```dart
// Flutter - dio_helper.dart
if (response.statusCode == 200 && response.data['success'] == true) {
  final newAccessToken = response.data["data"]["accessToken"];
  final newRefreshToken = response.data["data"]["refreshToken"];

  // حفظ التوكن الجديد
  await CacheServices.instance.saveToken(
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    expiresIn: 60, // 1 دقيقة
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
}
```

## 🚪 المرحلة 4: تسجيل الخروج (Logout)

### الخطوة 1: إرسال طلب تسجيل الخروج

```dart
// Flutter
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
    Navigator.pushReplacementNamed(context, '/login');
  }
}
```

### الخطوة 2: معالجة تسجيل الخروج في Backend

```javascript
// Backend - auth.controller.js
export const logout = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user._id;

    // إلغاء توكن محدد أو جميع التوكن
    if (refreshToken) {
      await tokenModel.invalidateToken(refreshToken);
    } else {
      await tokenModel.invalidateAllUserTokens(userId);
    }

    return res.status(200).json({
      success: true,
      message: 'تم تسجيل الخروج بنجاح'
    });
  } catch (error) {
    return handleDatabaseError(error, next);
  }
});
```

## ⚠️ معالجة الأخطاء والحالات الاستثنائية

### 1. فشل تجديد التوكن

```dart
// Flutter - dio_helper.dart
} catch (e) {
  // تسجيل الخطأ
  print('Token refresh failed: $e');
  
  // حذف التوكن المحلي
  await CacheServices.instance.deleteToken();
  await CacheServices.instance.setUserLogin(false);
  
  // إعادة توجيه لشاشة تسجيل الدخول
  // يمكن استخدام Navigation Service أو GetX
  
  rethrow;
}
```

### 2. انتهاء صلاحية Refresh Token

```javascript
// Backend - auth.controller.js
const tokenDoc = await tokenModel.findValidRefreshToken(refreshToken);

if (!tokenDoc) {
  return res.status(401).json({
    success: false,
    message: 'انتهت صلاحية جلسة المستخدم، يرجى تسجيل الدخول مرة أخرى',
    errorCode: 'REFRESH_TOKEN_EXPIRED'
  });
}
```

### 3. عمليات تجديد متعددة متزامنة

```dart
// Flutter - dio_helper.dart
static bool _isRefreshing = false;
static final List<Completer<void>> _refreshCompleters = [];

Future<void> _waitForRefresh() async {
  if (!_isRefreshing) {
    return;
  }

  final completer = Completer<void>();
  _refreshCompleters.add(completer);
  return completer.future;
}
```

## 📊 مخطط زمني للتوكن

```
الوقت     العملية                    Access Token    Refresh Token
------     --------                    ------------    -------------
00:00      تسجيل الدخول                ✅ جديد (60s)    ✅ جديد (30d)
00:50      فحص انتهاء الصلاحية         ⚠️ سينتهي قريباً   ✅ صالح
00:50      تجديد استباقي               ✅ جديد (60s)    ✅ جديد (30d)
01:50      فحص انتهاء الصلاحية         ⚠️ سينتهي قريباً   ✅ صالح
01:50      تجديد استباقي               ✅ جديد (60s)    ✅ جديد (30d)
...        ...                        ...            ...
30 يوم     انتهاء Refresh Token       ❌ منتهي        ❌ منتهي
30 يوم     إعادة تسجيل الدخول           ✅ جديد (60s)    ✅ جديد (30d)
```

## 🔧 نصائح للتشخيص والاختبار

### 1. تفعيل Logging

```dart
// Flutter - dio_helper.dart
refreshDio.interceptors.add(
  LogInterceptor(
    request: true,
    requestHeader: true,
    requestBody: true,
    responseHeader: true,
    responseBody: true,
    error: true,
  ),
);
```

### 2. اختبار سيناريوهات مختلفة

```dart
// اختبار تجديد التوكن
void testTokenRefresh() async {
  // تسجيل الدخول
  await login();
  
  // انتظار انتهاء صلاحية التوكن
  await Future.delayed(Duration(seconds: 70));
  
  // إرسال طلب (يجب تجديد التوكن تلقائياً)
  final response = await ApiService.dio.get('/user/profile');
  
  assert(response.statusCode == 200, 'Token refresh failed');
}
```

### 3. مراقبة الأداء

```dart
// قياس وقت التجديد
final stopwatch = Stopwatch()..start();
await _refreshTokenAndRetry(requestOptions);
stopwatch.stop();
print('Token refresh took: ${stopwatch.elapsedMilliseconds}ms');
```

## 🎯 الخلاصة

نظام التوكن في ArtHub يتبع نمط معياري مع تحسينات للأمان والأداء:

### ✅ المميزات
- **أمان عالي**: Access Token قصير المدة (1 دقيقة)
- **تجربة مستخدم سلسة**: تجديد تلقائي بدون إزعاج
- **كفاءة في الأداء**: تجنب عمليات تجديد متعددة
- **معالجة شاملة للأخطاء**: تعامل مع جميع السيناريوهات

### 🔄 التدفق العام
1. **تسجيل الدخول** → إنشاء وحفظ التوكن
2. **إرسال الطلبات** → فحص وإضافة التوكن
3. **تجديد التوكن** → عند انتهاء الصلاحية أو خطأ 401
4. **تسجيل الخروج** → إلغاء وحذف التوكن

هذا النظام يضمن أمان عالي مع تجربة مستخدم متميزة! 🚀

---

**تم إنشاء هذا الدليل بواسطة فريق ArtHub Backend** 🔧
