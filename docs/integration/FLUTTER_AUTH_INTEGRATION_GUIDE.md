# Flutter Authentication Integration Guide
## دليل ربط Flutter مع Authentication APIs

هذا الدليل يوضح كيفية ربط كل screen في سلسلة الـ Authentication مع الـ Backend APIs المطلوبة.

---

## 🌐 Base URL
```
Production: https://art-hub-backend.vercel.app/api/auth
Development: http://localhost:3002/api/auth
```

---

## 📱 Authentication Screens & APIs

### 1. **Register Screen** - شاشة إنشاء حساب جديد

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "displayName": "أحمد محمد",
  "job": "فنان تشكيلي",
  "role": "artist",
  "fingerprint": "optional_device_fingerprint_string"
}
```

**Flutter Example:**
```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> registerUser() async {
  const String baseUrl = 'https://art-hub-backend.vercel.app/api/auth';
  final response = await http.post(
    Uri.parse('$baseUrl/register'),
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
    // Success: Store tokens and navigate
    final responseData = jsonDecode(response.body);
    print('Registration successful: $responseData');
  } else {
    // Error
    print('Failed to register: ${response.body}');
  }
}
```

---

### 2. **Login Screen** - شاشة تسجيل الدخول

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**Flutter Example:**
```dart
Future<void> loginUser() async {
  const String baseUrl = 'https://art-hub-backend.vercel.app/api/auth';
  final response = await http.post(
    Uri.parse('$baseUrl/login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'email': 'user@example.com',
      'password': 'Password123!'
    }),
  );

  if (response.statusCode == 200) {
    final responseData = jsonDecode(response.body);
    // TODO: Store accessToken and refreshToken securely
    print('Login successful: $responseData');
  } else {
    print('Failed to login: ${response.body}');
  }
}
```
---

### 3. **Fingerprint Login Screen** - شاشة تسجيل الدخول ببصمة الجهاز

**Endpoint:** `POST /login-with-fingerprint`

**Request Body:**
```json
{
  "fingerprint": "device_fingerprint_string"
}
```

**Flutter Example:**
```dart
Future<void> loginWithFingerprint(String fingerprint) async {
  const String baseUrl = 'https://art-hub-backend.vercel.app/api/auth';
  final response = await http.post(
    Uri.parse('$baseUrl/login-with-fingerprint'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'fingerprint': fingerprint}),
  );

  if (response.statusCode == 200) {
    final responseData = jsonDecode(response.body);
    // TODO: Store tokens
    print('Fingerprint login successful: $responseData');
  } else {
    print('Failed to login with fingerprint: ${response.body}');
  }
}
```

---

### 4. **Firebase Login Screen** - شاشة تسجيل الدخول بـ Firebase

**Endpoint:** `POST /firebase`

**Headers:**
- `Authorization: Bearer <FIREBASE_ID_TOKEN>`

**Flutter Example:**
```dart
// Assumes you have firebase_auth package and user is already signed in with Firebase
import 'package:firebase_auth/firebase_auth.dart';

Future<void> loginWithFirebase() async {
  final idToken = await FirebaseAuth.instance.currentUser?.getIdToken();
  if (idToken == null) {
    print('Failed to get Firebase ID token.');
    return;
  }
  
  const String baseUrl = 'https://art-hub-backend.vercel.app/api/auth';
  final response = await http.post(
    Uri.parse('$baseUrl/firebase'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $idToken',
    }
  );

  if (response.statusCode == 200) {
    final responseData = jsonDecode(response.body);
    // TODO: Store your app's accessToken and refreshToken
    print('Firebase login successful: $responseData');
  } else {
    print('Failed to login with Firebase: ${response.body}');
  }
}
```

---

### 5. **Forgot Password Screen** - شاشة نسيان كلمة المرور

**Endpoint:** `POST /forgot-password`

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

---

### 6. **Verify Reset Code Screen** - شاشة التحقق من رمز إعادة التعيين

**Endpoint:** `POST /verify-forget-code`

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

---

### 7. **Reset Password Screen** - شاشة إعادة تعيين كلمة المرور

**Endpoint:** `POST /reset-password`

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

---

## 🛠️ Other Authentication APIs

### 8. **Get Current User** - جلب بيانات المستخدم الحالي

**Endpoint:** `GET /me`

**Headers:**
- `Authorization: Bearer <YOUR_ACCESS_TOKEN>`


**Flutter Example:**
```dart
Future<void> getCurrentUser(String accessToken) async {
  const String baseUrl = 'https://art-hub-backend.vercel.app/api/auth';
  final response = await http.get(
    Uri.parse('$baseUrl/me'),
    headers: {'Authorization': 'Bearer $accessToken'},
  );

  if (response.statusCode == 200) {
    final responseData = jsonDecode(response.body);
    print('Get user successful: $responseData');
  } else {
    print('Failed to get user: ${response.body}');
  }
}
```

---

### 9. **Refresh Token** - تحديث رمز الوصول

**Endpoint:** `POST /refresh-token`

**Request Body:**
```json
{
  "refreshToken": "your_refresh_token"
}
```

**Flutter Example:**
```dart
Future<void> refreshToken(String refreshToken) async {
  const String baseUrl = 'https://art-hub-backend.vercel.app/api/auth';
  final response = await http.post(
    Uri.parse('$baseUrl/refresh-token'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({'refreshToken': refreshToken}),
  );

  if (response.statusCode == 200) {
    final responseData = jsonDecode(response.body);
    // TODO: Store the new accessToken and refreshToken
    print('Token refresh successful: $responseData');
  } else {
    print('Failed to refresh token: ${response.body}');
  }
}
```

---

### 10. **Update FCM Token** - تحديث رمز الإشعارات

**Endpoint:** `POST /fcm-token`

**Headers:**
- `Authorization: Bearer <YOUR_ACCESS_TOKEN>`

**Request Body:**
```json
{
  "fcmToken": "your_new_fcm_token"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تحديث رمز الإشعارات بنجاح"
}
```

---

### 11. **Update Fingerprint** - تحديث بصمة الجهاز

**Endpoint:** `POST /update-fingerprint`

**Headers:**
- `Authorization: Bearer <YOUR_ACCESS_TOKEN>`

**Request Body:**
```json
{
  "fingerprint": "new_or_updated_fingerprint_string"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تحديث بصمة الجهاز بنجاح"
}
```

---

### 12. **Logout** - تسجيل الخروج

**Endpoint:** `POST /logout`

**Headers:**
- `Authorization: Bearer <YOUR_ACCESS_TOKEN>`

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "تم تسجيل الخروج بنجاح"
}
```

---

## 💡 Flutter Integration Notes

- **Token Storage:** Use `flutter_secure_storage` to securely store `accessToken` and `refreshToken`.
- **HTTP Client:** Use a package like `dio` to easily manage headers, interceptors (for adding the auth token), and token refresh logic.
- **Error Handling:** Always check for `statusCode` and the `success` field in the response. Display user-friendly error messages based on the `message` from the API.
- **State Management:** Use a state management solution (like Provider, BLoC, or Riverpod) to manage the user's authentication state throughout the app.

---
## 🚀 Example `AuthService` for Flutter

Here is a basic service class to get you started.

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  final String _baseUrl = "https://art-hub-backend.vercel.app/api/auth";
  final _storage = const FlutterSecureStorage();

  Future<String?> get accessToken async => await _storage.read(key: 'accessToken');
  Future<String?> get refreshToken async => await _storage.read(key: 'refreshToken');

  Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$_baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body)['data'];
      await _storage.write(key: 'accessToken', value: data['accessToken']);
      await _storage.write(key: 'refreshToken', value: data['refreshToken']);
      return true;
    }
    return false;
  }

  Future<void> logout() async {
    final token = await accessToken;
    await http.post(
      Uri.parse('$_baseUrl/logout'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );
    await _storage.deleteAll();
  }

  // Add other methods for register, forgotPassword, etc. here
}
```