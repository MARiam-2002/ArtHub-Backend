# Flutter Authentication Integration Guide
## دليل ربط Flutter مع Authentication APIs

هذا الدليل يوضح كيفية ربط كل screen في سلسلة الـ Authentication مع الـ Backend APIs المطلوبة.

---

## 🌐 Base URL
```
Production: https://your-api-domain.com/api/auth
Development: http://localhost:3002/api/auth
```

---

## 📱 Authentication Screens & APIs

### 1. **Login Screen** - شاشة تسجيل الدخول

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Response (Success - 200):**
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
      "url": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
    },
    "isVerified": true,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "errorCode": "INVALID_PASSWORD"
}
```

**Flutter Test Example:**
```dart
Future<void> testLogin() async {
  final response = await http.post(
    Uri.parse('${baseUrl}/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': 'test@example.com',
      'password': 'Password123!'
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Store tokens
    await storage.write(key: 'accessToken', value: data['data']['accessToken']);
    await storage.write(key: 'refreshToken', value: data['data']['refreshToken']);
    // Navigate to home
  } else {
    // Handle error
    final error = jsonDecode(response.body);
    showError(error['message']);
  }
}
```

---

### 2. **Register Screen** - شاشة إنشاء حساب جديد

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "displayName": "أحمد محمد",
  "job": "فنان تشكيلي",
  "role": "artist"
}
```

**Response (Success - 201):**
```json
{
  "success": true,
  "message": "تم إنشاء الحساب بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "newuser@example.com",
    "displayName": "أحمد محمد",
    "role": "artist",
    "isVerified": false,
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response (Error - 409):**
```json
{
  "success": false,
  "message": "البريد الإلكتروني مستخدم بالفعل",
  "errorCode": "DUPLICATE_ENTITY"
}
```

**Flutter Test Example:**
```dart
Future<void> testRegister() async {
  final response = await http.post(
    Uri.parse('${baseUrl}/register'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': 'newuser@example.com',
      'password': 'Password123!',
      'confirmPassword': 'Password123!',
      'displayName': 'أحمد محمد',
      'job': 'فنان تشكيلي',
      'role': 'artist'
    }),
  );
  
  if (response.statusCode == 201) {
    final data = jsonDecode(response.body);
    // Store tokens and navigate
    await storage.write(key: 'accessToken', value: data['data']['accessToken']);
    // Navigate to verification or home
  }
}
```

---

### 3. **Forgot Password Screen** - شاشة نسيان كلمة المرور

**Endpoint:** `POST /api/auth/forgot-password`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
}
```

**Response (Error - 404):**
```json
{
  "success": false,
  "message": "لا يوجد حساب مرتبط بهذا البريد الإلكتروني",
  "errorCode": "NOT_FOUND"
}
```

**Flutter Test Example:**
```dart
Future<void> testForgotPassword() async {
  final response = await http.post(
    Uri.parse('${baseUrl}/forgot-password'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': 'user@example.com'
    }),
  );
  
  if (response.statusCode == 200) {
    // Navigate to verification code screen
    Navigator.push(context, MaterialPageRoute(
      builder: (context) => VerifyCodeScreen(email: 'user@example.com')
    ));
  }
}
```

---

### 4. **Verify Reset Code Screen** - شاشة التحقق من رمز إعادة التعيين

**Endpoint:** `POST /api/auth/verify-forget-code`

**Request Body:**
```json
{
  "email": "user@example.com",
  "forgetCode": "1234"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم التحقق من الرمز بنجاح"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "الرمز غير صحيح أو منتهي الصلاحية",
  "errorCode": "INVALID_TOKEN"
}
```

**Flutter Test Example:**
```dart
Future<void> testVerifyCode() async {
  final response = await http.post(
    Uri.parse('${baseUrl}/verify-forget-code'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': widget.email,
      'forgetCode': codeController.text
    }),
  );
  
  if (response.statusCode == 200) {
    // Navigate to reset password screen
    Navigator.push(context, MaterialPageRoute(
      builder: (context) => ResetPasswordScreen(email: widget.email)
    ));
  }
}
```

---

### 5. **Reset Password Screen** - شاشة إعادة تعيين كلمة المرور

**Endpoint:** `POST /api/auth/reset-password`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم إعادة تعيين كلمة المرور بنجاح"
}
```

**Response (Error - 400):**
```json
{
  "success": false,
  "message": "لم يتم التحقق من رمز إعادة التعيين",
  "errorCode": "VALIDATION_ERROR"
}
```

**Flutter Test Example:**
```dart
Future<void> testResetPassword() async {
  final response = await http.post(
    Uri.parse('${baseUrl}/reset-password'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': widget.email,
      'password': newPasswordController.text,
      'confirmPassword': confirmPasswordController.text
    }),
  );
  
  if (response.statusCode == 200) {
    // Navigate to login screen
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => LoginScreen()),
      (route) => false
    );
  }
}
```

---

### 6. **Firebase Login Screen** - شاشة تسجيل الدخول بـ Firebase

**Endpoint:** `POST /api/auth/firebase`

**Headers:**
```
Authorization: Bearer [FIREBASE_ID_TOKEN]
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "John Doe",
    "firebaseUid": "firebase_uid_123",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Flutter Test Example:**
```dart
Future<void> testFirebaseLogin() async {
  // Get Firebase ID Token
  final User? user = FirebaseAuth.instance.currentUser;
  if (user != null) {
    final idToken = await user.getIdToken();
    
    final response = await http.post(
      Uri.parse('${baseUrl}/firebase'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $idToken'
      },
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      // Store tokens
      await storage.write(key: 'accessToken', value: data['data']['accessToken']);
    }
  }
}
```

---

### 7. **Fingerprint Login Screen** - شاشة تسجيل الدخول ببصمة الجهاز

**Endpoint:** `POST /api/auth/login-with-fingerprint`

**Request Body:**
```json
{
  "fingerprint": "fp_1234567890abcdef_browser_chrome_os_windows"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Flutter Test Example:**
```dart
Future<void> testFingerprintLogin() async {
  final deviceInfo = await DeviceInfoPlugin().androidInfo;
  final fingerprint = 'fp_${deviceInfo.id}_${deviceInfo.model}_${deviceInfo.brand}';
  
  final response = await http.post(
    Uri.parse('${baseUrl}/login-with-fingerprint'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'fingerprint': fingerprint
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Store tokens
  }
}
```

---

## 🔐 Authentication Management APIs

### 8. **Get Current User** - جلب بيانات المستخدم الحالي

**Endpoint:** `GET /api/auth/me`

**Headers:**
```
Authorization: Bearer [ACCESS_TOKEN]
```

**Response (Success - 200):**
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
      "url": "https://res.cloudinary.com/demo/image/upload/profile.jpg"
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

**Flutter Test Example:**
```dart
Future<void> testGetCurrentUser() async {
  final token = await storage.read(key: 'accessToken');
  
  final response = await http.get(
    Uri.parse('${baseUrl}/me'),
    headers: {
      'Authorization': 'Bearer $token'
    },
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Update user state
    setState(() {
      currentUser = User.fromJson(data['data']);
    });
  }
}
```

---

### 9. **Refresh Token** - تحديث رمز الوصول

**Endpoint:** `POST /api/auth/refresh-token`

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تحديث رمز الوصول بنجاح",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Flutter Test Example:**
```dart
Future<void> testRefreshToken() async {
  final refreshToken = await storage.read(key: 'refreshToken');
  
  final response = await http.post(
    Uri.parse('${baseUrl}/refresh-token'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'refreshToken': refreshToken
    }),
  );
  
  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    // Update tokens
    await storage.write(key: 'accessToken', value: data['data']['accessToken']);
    await storage.write(key: 'refreshToken', value: data['data']['refreshToken']);
  }
}
```

---

### 10. **Update FCM Token** - تحديث رمز الإشعارات

**Endpoint:** `POST /api/auth/fcm-token`

**Headers:**
```
Authorization: Bearer [ACCESS_TOKEN]
```

**Request Body:**
```json
{
  "fcmToken": "fMEGG8-TQVSEJHBFrk-BZ3:APA91bHZKmJLnmRJHBFrk..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تحديث رمز الإشعارات بنجاح"
}
```

**Flutter Test Example:**
```dart
Future<void> testUpdateFCMToken() async {
  final fcmToken = await FirebaseMessaging.instance.getToken();
  final accessToken = await storage.read(key: 'accessToken');
  
  final response = await http.post(
    Uri.parse('${baseUrl}/fcm-token'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken'
    },
    body: jsonEncode({
      'fcmToken': fcmToken
    }),
  );
  
  if (response.statusCode == 200) {
    print('FCM Token updated successfully');
  }
}
```

---

### 11. **Update Fingerprint** - تحديث بصمة الجهاز

**Endpoint:** `POST /api/auth/update-fingerprint`

**Headers:**
```
Authorization: Bearer [ACCESS_TOKEN]
```

**Request Body:**
```json
{
  "fingerprint": "fp_1234567890abcdef_browser_chrome_os_windows"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تحديث بصمة الجهاز بنجاح",
  "data": {
    "fingerprint": "fp_1234567890abcdef_browser_chrome_os_windows"
  }
}
```

**Flutter Test Example:**
```dart
Future<void> testUpdateFingerprint() async {
  final deviceInfo = await DeviceInfoPlugin().androidInfo;
  final fingerprint = 'fp_${deviceInfo.id}_${deviceInfo.model}_${deviceInfo.brand}';
  final accessToken = await storage.read(key: 'accessToken');
  
  final response = await http.post(
    Uri.parse('${baseUrl}/update-fingerprint'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken'
    },
    body: jsonEncode({
      'fingerprint': fingerprint
    }),
  );
  
  if (response.statusCode == 200) {
    // Enable fingerprint login option
    await storage.write(key: 'fingerprintEnabled', value: 'true');
  }
}
```

---

### 12. **Logout** - تسجيل الخروج

**Endpoint:** `POST /api/auth/logout`

**Headers:**
```
Authorization: Bearer [ACCESS_TOKEN]
```

**Request Body (Optional):**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

**Flutter Test Example:**
```dart
Future<void> testLogout() async {
  final accessToken = await storage.read(key: 'accessToken');
  final refreshToken = await storage.read(key: 'refreshToken');
  
  final response = await http.post(
    Uri.parse('${baseUrl}/logout'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $accessToken'
    },
    body: jsonEncode({
      'refreshToken': refreshToken
    }),
  );
  
  if (response.statusCode == 200) {
    // Clear local storage
    await storage.deleteAll();
    // Navigate to login
    Navigator.pushAndRemoveUntil(
      context,
      MaterialPageRoute(builder: (context) => LoginScreen()),
      (route) => false
    );
  }
}
```

---

## 🔧 Flutter Implementation Helper

### Authentication Service Class

```dart
class AuthService {
  static const String baseUrl = 'http://localhost:3002/api/auth';
  final FlutterSecureStorage storage = FlutterSecureStorage();
  
  // Login
  Future<AuthResult> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password
      }),
    );
    
    return AuthResult.fromResponse(response);
  }
  
  // Register
  Future<AuthResult> register({
    required String email,
    required String password,
    required String confirmPassword,
    required String displayName,
    String? job,
    String role = 'user'
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'confirmPassword': confirmPassword,
        'displayName': displayName,
        'job': job,
        'role': role
      }),
    );
    
    return AuthResult.fromResponse(response);
  }
  
  // Get current user
  Future<User?> getCurrentUser() async {
    final token = await storage.read(key: 'accessToken');
    if (token == null) return null;
    
    final response = await http.get(
      Uri.parse('$baseUrl/me'),
      headers: {'Authorization': 'Bearer $token'},
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return User.fromJson(data['data']);
    }
    return null;
  }
  
  // Store tokens
  Future<void> storeTokens(String accessToken, String refreshToken) async {
    await storage.write(key: 'accessToken', value: accessToken);
    await storage.write(key: 'refreshToken', value: refreshToken);
  }
  
  // Clear tokens
  Future<void> clearTokens() async {
    await storage.delete(key: 'accessToken');
    await storage.delete(key: 'refreshToken');
  }
}
```

### Error Handling

```dart
class AuthResult {
  final bool success;
  final String message;
  final Map<String, dynamic>? data;
  final String? errorCode;
  
  AuthResult({
    required this.success,
    required this.message,
    this.data,
    this.errorCode
  });
  
  factory AuthResult.fromResponse(http.Response response) {
    final body = jsonDecode(response.body);
    
    return AuthResult(
      success: response.statusCode >= 200 && response.statusCode < 300,
      message: body['message'] ?? 'حدث خطأ غير متوقع',
      data: body['data'],
      errorCode: body['errorCode']
    );
  }
}
```

---

## 📝 Notes for Flutter Developer

### 1. **Token Management**
- احفظ الـ `accessToken` و `refreshToken` في `FlutterSecureStorage`
- استخدم الـ `accessToken` في كل request محمي
- قم بتحديث الـ token عند انتهاء صلاحيته

### 2. **Error Handling**
- تحقق من `statusCode` و `errorCode` في كل response
- اعرض رسائل الخطأ باللغة العربية للمستخدم
- تعامل مع حالات عدم الاتصال بالإنترنت

### 3. **Security Best Practices**
- لا تحفظ كلمات المرور في local storage
- استخدم HTTPS في production
- تحقق من صحة البيانات قبل إرسالها

### 4. **User Experience**
- اعرض loading indicators أثناء API calls
- قم بتنفيذ auto-refresh للـ tokens
- اعرض رسائل نجاح واضحة للمستخدم

### 5. **Testing**
- اختبر كل endpoint مع بيانات صحيحة وخاطئة
- تأكد من التعامل مع كل حالات الخطأ
- اختبر الـ token refresh mechanism

---

## 🚀 Quick Start Testing

يمكنك اختبار الـ APIs باستخدام Postman أو أي HTTP client:

1. **Start Server:** `npm run dev`
2. **API Documentation:** `http://localhost:3002/api-docs`
3. **Test Endpoints:** استخدم الأمثلة المذكورة أعلاه

---

**Happy Coding! 🎉**