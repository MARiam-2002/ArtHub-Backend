# Flutter Authentication Integration Guide
## دليل ربط التوثيق الشامل لمطور Flutter

### Base URL
```
Production: https://your-domain.com/api
Development: http://localhost:3001/api
```

### Headers المطلوبة
```javascript
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN" // للـ endpoints المحمية
}
```

---

## 1. Welcome Screen / Splash Screen
**الغرض**: عرض الشاشة الترحيبية وتحديد حالة المستخدم

### Endpoints المطلوبة:
- لا يوجد endpoints مطلوبة
- فقط فحص وجود token محفوظ محلياً

### Flutter Implementation:
```dart
// فحص وجود token
String? token = await SharedPreferences.getInstance().then((prefs) => prefs.getString('auth_token'));

if (token != null) {
  // التوجه للـ Home Screen
  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => HomeScreen()));
} else {
  // التوجه للـ Login Screen
  Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => LoginScreen()));
}
```

---

## 2. Login Screen
**الغرض**: تسجيل دخول المستخدم

### Endpoints المطلوبة:

#### 2.1 تسجيل الدخول بالإيميل والباسورد
```http
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "role": "user",
      "displayName": "اسم المستخدم",
      "profileImage": {
        "url": "https://example.com/profile.jpg",
        "id": "image_id"
      },
      "isVerified": true,
      "preferredLanguage": "ar"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "errors": ["invalid_credentials"]
}
```

#### 2.2 تسجيل الدخول بـ Google
```http
POST /api/auth/google
```

**Request Body:**
```json
{
  "googleToken": "google_oauth_token_here"
}
```

#### 2.3 تسجيل الدخول بـ Facebook
```http
POST /api/auth/facebook
```

**Request Body:**
```json
{
  "facebookToken": "facebook_oauth_token_here"
}
```

### Flutter Test Example:
```dart
Future<void> testLogin() async {
  final response = await http.post(
    Uri.parse('$baseUrl/auth/login'),
    headers: {'Content-Type': 'application/json'},
    body: json.encode({
      'email': 'test@example.com',
      'password': 'password123'
    }),
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    String token = data['data']['token'];
    // حفظ الـ token
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString('auth_token', token);
    // التوجه للـ Home Screen
  }
}
```

---

## 3. Register Screen
**الغرض**: إنشاء حساب جديد

### Endpoints المطلوبة:

#### 3.1 التسجيل بالإيميل والباسورد
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "password123",
  "displayName": "اسم المستخدم",
  "role": "user"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "تم إنشاء الحساب بنجاح. يرجى تأكيد البريد الإلكتروني",
  "data": {
    "user": {
      "_id": "new_user_id",
      "email": "newuser@example.com",
      "displayName": "اسم المستخدم",
      "isVerified": false
    },
    "token": "jwt_token_here"
  }
}
```

#### 3.2 فحص توفر الإيميل
```http
GET /api/auth/check-email?email=test@example.com
```

**Response:**
```json
{
  "success": true,
  "available": false,
  "message": "هذا البريد الإلكتروني مستخدم بالفعل"
}
```

### Flutter Test Example:
```dart
Future<bool> checkEmailAvailability(String email) async {
  final response = await http.get(
    Uri.parse('$baseUrl/auth/check-email?email=$email'),
    headers: {'Content-Type': 'application/json'},
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return data['available'];
  }
  return false;
}
```

---

## 4. Email Verification Screen
**الغرض**: تأكيد البريد الإلكتروني

### Endpoints المطلوبة:

#### 4.1 تأكيد البريد الإلكتروني
```http
POST /api/auth/verify-email
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "verificationCode": "123456"
}
```

#### 4.2 إعادة إرسال كود التأكيد
```http
POST /api/auth/resend-verification
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال كود التأكيد مرة أخرى"
}
```

---

## 5. Forgot Password Screen
**الغرض**: استعادة كلمة المرور

### Endpoints المطلوبة:

#### 5.1 طلب استعادة كلمة المرور
```http
POST /api/auth/forgot-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم إرسال كود استعادة كلمة المرور إلى بريدك الإلكتروني"
}
```

#### 5.2 تأكيد كود الاستعادة
```http
POST /api/auth/verify-reset-code
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "resetCode": "123456"
}
```

---

## 6. Reset Password Screen
**الغرض**: إعادة تعيين كلمة المرور

### Endpoints المطلوبة:

#### 6.1 إعادة تعيين كلمة المرور
```http
POST /api/auth/reset-password
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "resetCode": "123456",
  "newPassword": "newPassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "تم تغيير كلمة المرور بنجاح"
}
```

---

## 7. Profile Setup Screen (للمستخدمين الجدد)
**الغرض**: إعداد الملف الشخصي بعد التسجيل

### Endpoints المطلوبة:

#### 7.1 تحديث الملف الشخصي
```http
PUT /api/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body (Form Data):**
```json
{
  "displayName": "اسم المستخدم",
  "job": "فنان",
  "profileImage": "file_upload"
}
```

#### 7.2 رفع صورة الملف الشخصي
```http
POST /api/user/upload-profile-image
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
```
profileImage: [file]
```

---

## 8. Change Password Screen (داخل التطبيق)
**الغرض**: تغيير كلمة المرور من داخل التطبيق

### Endpoints المطلوبة:

#### 8.1 تغيير كلمة المرور
```http
POST /api/auth/change-password
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

---

## 9. Logout Functionality
**الغرض**: تسجيل الخروج

### Endpoints المطلوبة:

#### 9.1 تسجيل الخروج
```http
POST /api/auth/logout
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

### Flutter Implementation:
```dart
Future<void> logout() async {
  // حذف الـ token من التخزين المحلي
  SharedPreferences prefs = await SharedPreferences.getInstance();
  await prefs.remove('auth_token');
  await prefs.remove('refresh_token');
  
  // استدعاء الـ logout endpoint
  await http.post(
    Uri.parse('$baseUrl/auth/logout'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json'
    },
  );
  
  // التوجه لشاشة تسجيل الدخول
  Navigator.pushAndRemoveUntil(
    context,
    MaterialPageRoute(builder: (_) => LoginScreen()),
    (route) => false
  );
}
```

---

## Error Handling
### أكواد الأخطاء الشائعة:

```dart
void handleApiError(int statusCode, String responseBody) {
  final data = json.decode(responseBody);
  
  switch (statusCode) {
    case 400:
      // خطأ في البيانات المرسلة
      showError(data['message'] ?? 'خطأ في البيانات');
      break;
    case 401:
      // غير مصرح - يجب تسجيل الدخول مرة أخرى
      logout();
      break;
    case 403:
      // ممنوع الوصول
      showError('غير مصرح لك بالوصول');
      break;
    case 404:
      // غير موجود
      showError('المورد غير موجود');
      break;
    case 500:
      // خطأ في الخادم
      showError('خطأ في الخادم، يرجى المحاولة لاحقاً');
      break;
    default:
      showError('حدث خطأ غير متوقع');
  }
}
```

---

## Token Management
### إدارة الـ Tokens:

```dart
class AuthService {
  static const String _tokenKey = 'auth_token';
  static const String _refreshTokenKey = 'refresh_token';
  
  // حفظ الـ token
  static Future<void> saveToken(String token, String refreshToken) async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_refreshTokenKey, refreshToken);
  }
  
  // الحصول على الـ token
  static Future<String?> getToken() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }
  
  // تحديث الـ token
  static Future<bool> refreshToken() async {
    SharedPreferences prefs = await SharedPreferences.getInstance();
    String? refreshToken = prefs.getString(_refreshTokenKey);
    
    if (refreshToken == null) return false;
    
    final response = await http.post(
      Uri.parse('$baseUrl/auth/refresh-token'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'refreshToken': refreshToken}),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      await saveToken(data['token'], data['refreshToken']);
      return true;
    }
    
    return false;
  }
}
```

---

## Testing الـ APIs

### Postman Collection للاختبار:
```json
{
  "info": {
    "name": "ArtHub Auth APIs",
    "description": "Collection for testing authentication endpoints"
  },
  "item": [
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/auth/login",
          "host": ["{{baseUrl}}"],
          "path": ["auth", "login"]
        }
      }
    }
  ]
}
```

---

## Flutter HTTP Client Setup
### إعداد HTTP Client مع Token Management:

```dart
class ApiClient {
  static const String baseUrl = 'http://localhost:3001/api';
  
  static Future<Map<String, String>> getHeaders() async {
    String? token = await AuthService.getToken();
    
    Map<String, String> headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }
  
  static Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final headers = await getHeaders();
    
    final response = await http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: json.encode(body),
    );
    
    // إذا كان الـ token منتهي الصلاحية، جرب تحديثه
    if (response.statusCode == 401) {
      bool refreshed = await AuthService.refreshToken();
      if (refreshed) {
        // أعد المحاولة مع الـ token الجديد
        final newHeaders = await getHeaders();
        return await http.post(
          Uri.parse('$baseUrl$endpoint'),
          headers: newHeaders,
          body: json.encode(body),
        );
      }
    }
    
    return response;
  }
}
```

---

## ملاحظات مهمة للمطور:

1. **حفظ الـ Tokens**: استخدم `SharedPreferences` أو `flutter_secure_storage` لحفظ الـ tokens
2. **إدارة الحالة**: استخدم `Provider` أو `Bloc` لإدارة حالة التوثيق
3. **التحقق من الشبكة**: تأكد من وجود اتصال بالإنترنت قبل إجراء الطلبات
4. **UI/UX**: أضف loading indicators و error messages مناسبة
5. **الأمان**: لا تحفظ كلمات المرور في التخزين المحلي
6. **التحديث التلقائي**: استخدم refresh tokens لتحديث الـ access tokens تلقائياً

---

## Contact للدعم:
إذا واجهت أي مشاكل في الربط، تواصل مع فريق Backend Development. 