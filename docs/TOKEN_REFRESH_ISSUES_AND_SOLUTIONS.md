# مشاكل تجديد التوكن في Flutter وحلولها 🔧

## 🚨 المشاكل الموجودة في الكود الحالي

### 1. **مشكلة في `_refreshTokenAndRetry` Function**

```dart
// ❌ المشكلة الحالية في dio_helper.dart
Future<Response> _refreshTokenAndRetry(RequestOptions requestOptions) async {
  if (_isRefreshing) {
    // هنا يتم الانتظار ثم إعادة المحاولة مباشرة
    await _waitForRefresh();
    
    // ❌ المشكلة: لا يتم تجديد التوكن هنا!
    final newAccessToken = await CacheServices.instance.getAccessToken();
    if (newAccessToken != null) {
      requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
    }
    
    // إعادة المحاولة بدون تجديد فعلي للتوكن
    final newDio = Dio();
    return await newDio.request(...);
  }
  
  // باقي الكود للتجديد الفعلي...
}
```

**المشكلة:** عندما يكون `_isRefreshing = true`، الكود ينتظر ثم يعيد المحاولة بدون تجديد فعلي للتوكن!

### 2. **مشكلة في حفظ مدة انتهاء التوكن**

```dart
// ❌ في shared_pref_helper.dart
Future<void> saveToken({
  required String accessToken,
  required String refreshToken,
  int expiresIn = 3600, // ❌ 3600 ثانية = ساعة، لكن Backend يرسل دقيقة واحدة!
}) async {
  await storage.write(key: 'accessToken', value: accessToken);
  await storage.write(key: 'refreshToken', value: refreshToken);
  await storage.write(
    key: 'accessTokenExpiry',
    value: DateTime.now().add(Duration(seconds: expiresIn)).toIso8601String(),
  );
}
```

**المشكلة:** Backend يرسل Access Token بمدة دقيقة واحدة، لكن Flutter يحفظه بساعة!

### 3. **مشكلة في فحص انتهاء الصلاحية**

```dart
// ❌ في shared_pref_helper.dart
Future<bool> isAccessTokenExpired() async {
  try {
    final expiry = await storage.read(key: 'accessTokenExpiry');
    if (expiry == null) return true;

    final expiryDate = DateTime.parse(expiry);
    // Add 60 second buffer to avoid race conditions
    return DateTime.now().isAfter(expiryDate.subtract(Duration(seconds: 60)));
  } catch (e) {
    return true;
  }
}
```

**المشكلة:** إذا كان التوكن مدته دقيقة واحدة، وتم طرح 60 ثانية، فسيكون منتهي الصلاحية فوراً!

## ✅ الحلول المطلوبة

### 1. **إصلاح `_refreshTokenAndRetry` Function**

```dart
// ✅ الحل الصحيح
Future<Response> _refreshTokenAndRetry(RequestOptions requestOptions) async {
  if (_isRefreshing) {
    // انتظار اكتمال عملية التجديد الجارية
    await _waitForRefresh();
    
    // الحصول على التوكن الجديد بعد التجديد
    final newAccessToken = await CacheServices.instance.getAccessToken();
    if (newAccessToken != null) {
      requestOptions.headers['Authorization'] = 'Bearer $newAccessToken';
    }
    
    // إعادة المحاولة بالتوكن الجديد
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

  // بدء عملية التجديد
  _isRefreshing = true;

  try {
    final refreshToken = await CacheServices.instance.getRefreshToken();
    
    if (refreshToken == null) {
      throw Exception('No refresh token available');
    }

    // إنشاء Dio منفصل لطلب التجديد
    final refreshDio = Dio();
    final response = await refreshDio.post(
      '${ApiConstant.baseUrl}${ApiConstant.refreshToken}',
      data: {"refreshToken": refreshToken},
    );

    if (response.statusCode == 200 && response.data['success'] == true) {
      final newAccessToken = response.data["data"]["accessToken"];
      final newRefreshToken = response.data["data"]["refreshToken"];

      // حفظ التوكن الجديد بالمدة الصحيحة (60 ثانية)
      await CacheServices.instance.saveToken(
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: 60, // ✅ دقيقة واحدة كما هو محدد في Backend
      );

      // تحديث الطلب الأصلي بالتوكن الجديد
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
  } catch (e) {
    // في حالة فشل التجديد، حذف التوكن وتسجيل الخروج
    await CacheServices.instance.deleteToken();
    await CacheServices.instance.setUserLogin(false);
    rethrow;
  } finally {
    _isRefreshing = false;
    
    // إكمال جميع الطلبات المنتظرة
    for (final completer in _refreshCompleters) {
      if (!completer.isCompleted) {
        completer.complete();
      }
    }
    _refreshCompleters.clear();
  }
}
```

### 2. **إصلاح دالة حفظ التوكن**

```dart
// ✅ في shared_pref_helper.dart
Future<void> saveToken({
  required String accessToken,
  required String refreshToken,
  int expiresIn = 60, // ✅ تغيير القيمة الافتراضية إلى 60 ثانية
}) async {
  await storage.write(key: 'accessToken', value: accessToken);
  await storage.write(key: 'refreshToken', value: refreshToken);
  await storage.write(
    key: 'accessTokenExpiry',
    value: DateTime.now().add(Duration(seconds: expiresIn)).toIso8601String(),
  );
}
```

### 3. **إصلاح دالة فحص انتهاء الصلاحية**

```dart
// ✅ في shared_pref_helper.dart
Future<bool> isAccessTokenExpired() async {
  try {
    final expiry = await storage.read(key: 'accessTokenExpiry');
    if (expiry == null) return true;

    final expiryDate = DateTime.parse(expiry);
    // تقليل buffer إلى 10 ثوان لتوكن مدته دقيقة واحدة
    return DateTime.now().isAfter(expiryDate.subtract(Duration(seconds: 10)));
  } catch (e) {
    log(e.toString(), name: 'CacheService::isAccessTokenExpired');
    return true;
  }
}
```

### 4. **تحديث دالة تسجيل الدخول**

```dart
// ✅ في login_cubit.dart
await CacheServices.instance.saveToken(
  accessToken: accessToken,
  refreshToken: refreshToken,
  expiresIn: 60, // ✅ تحديد المدة الصحيحة
);
```

## 🔄 دورة حياة التوكن المصححة

### المرحلة 1: تسجيل الدخول
```
1. المستخدم يدخل البيانات
2. إرسال طلب تسجيل الدخول
3. Backend يرد بـ Access Token (60 ثانية) + Refresh Token (30 يوم)
4. Flutter يحفظ التوكن بالمدة الصحيحة (60 ثانية)
```

### المرحلة 2: إرسال الطلبات
```
1. قبل كل طلب: فحص انتهاء صلاحية Access Token
2. إذا منتهي الصلاحية: تجديد تلقائي
3. إذا صالح: إرسال الطلب مع التوكن
```

### المرحلة 3: معالجة خطأ 401
```
1. استلام خطأ 401
2. التحقق من أنه ليس endpoint مصادقة
3. بدء عملية التجديد:
   - إرسال Refresh Token للخادم
   - استلام Access Token جديد
   - حفظ التوكن الجديد
   - إعادة المحاولة بالتوكن الجديد
```

### المرحلة 4: فشل التجديد
```
1. إذا فشل تجديد التوكن
2. حذف جميع التوكن من التخزين
3. تسجيل خروج المستخدم
4. إعادة توجيه لشاشة تسجيل الدخول
```

## 🧪 اختبار الحل

### 1. **اختبار تجديد التوكن**
```dart
// اختبار بسيط
void testTokenRefresh() async {
  // تسجيل الدخول
  await login();
  
  // انتظار انتهاء صلاحية التوكن (أكثر من دقيقة)
  await Future.delayed(Duration(seconds: 70));
  
  // إرسال طلب (يجب أن يتم تجديد التوكن تلقائياً)
  final response = await ApiService.dio.get('/user/profile');
  
  print('Response: ${response.statusCode}'); // يجب أن يكون 200
}
```

### 2. **مراقبة Logs**
```dart
// في dio_helper.dart
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

## 📝 ملاحظات مهمة

### 1. **مدة التوكن في Backend**
- Access Token: 1 دقيقة (60 ثانية)
- Refresh Token: 30 يوم

### 2. **التوقيت المحلي مقابل UTC**
- Backend يستخدم UTC لحساب انتهاء الصلاحية
- Flutter يجب أن يتعامل مع التوقيت المحلي بشكل صحيح

### 3. **معالجة الأخطاء**
- دائماً احذف التوكن في حالة فشل التجديد
- أعد توجيه المستخدم لشاشة تسجيل الدخول
- سجل الأخطاء للتشخيص

## 🎯 الخلاصة

المشاكل الرئيسية كانت:
1. **عدم تجديد التوكن فعلياً** في بعض الحالات
2. **مدة انتهاء الصلاحية خاطئة** (ساعة بدلاً من دقيقة)
3. **Buffer كبير جداً** في فحص انتهاء الصلاحية

بعد تطبيق هذه الحلول، نظام تجديد التوكن سيعمل بشكل صحيح! ✅

---

**تم إنشاء هذا التحليل بواسطة فريق ArtHub Backend** 🚀
