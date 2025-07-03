# Flutter Integration Guide for ArtHub Backend

This guide explains how to integrate your Flutter app with the ArtHub backend API, focusing on Firebase authentication and API communication.

## Table of Contents

1. [Authentication Flow](#authentication-flow)
2. [API Response Format](#api-response-format)
3. [Flutter HTTP Client Setup](#flutter-http-client-setup)
4. [Authentication Examples](#authentication-examples)
5. [Error Handling](#error-handling)
6. [Best Practices](#best-practices)

## Authentication Flow

The backend supports both Firebase authentication and JWT tokens:

### 1. Firebase Authentication (Recommended)
- User authenticates with Firebase on the frontend
- Firebase returns an ID token
- Send this token to backend `/api/auth/firebase` endpoint
- Backend validates token with Firebase Admin SDK
- Backend returns JWT tokens for subsequent API calls

### 2. Email/Password Authentication
- User registers/logs in with email and password
- Backend returns JWT tokens directly

## API Response Format

All API responses follow this consistent format:

```json
{
  "success": true,
  "message": "تم تنفيذ العملية بنجاح",
  "data": {
    // Response data varies by endpoint
  }
}
```

Error responses include additional fields:

```json
{
  "success": false,
  "status": 400,
  "message": "حدث خطأ في معالجة الطلب",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2023-01-15T10:30:00Z",
  "requestId": "req_1642248600000_abc123",
  "details": {
    // Additional error details (optional)
  }
}
```

## Flutter HTTP Client Setup

### 1. Dependencies

Add these to your `pubspec.yaml`:

```yaml
dependencies:
  http: ^1.1.0
  firebase_auth: ^4.15.3
  shared_preferences: ^2.2.2
  dio: ^5.3.2  # Alternative to http package
```

### 2. API Client Class

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:3002'; // Replace with your server URL
  
  // Singleton pattern
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;
  ApiClient._internal();

  String? _accessToken;
  String? _refreshToken;

  // Initialize tokens from storage
  Future<void> initializeTokens() async {
    final prefs = await SharedPreferences.getInstance();
    _accessToken = prefs.getString('access_token');
    _refreshToken = prefs.getString('refresh_token');
  }

  // Save tokens to storage
  Future<void> _saveTokens(String accessToken, String refreshToken) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', accessToken);
    await prefs.setString('refresh_token', refreshToken);
    _accessToken = accessToken;
    _refreshToken = refreshToken;
  }

  // Clear tokens
  Future<void> clearTokens() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('refresh_token');
    _accessToken = null;
    _refreshToken = null;
  }

  // Get headers with authentication
  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    if (_accessToken != null) {
      headers['Authorization'] = 'Bearer $_accessToken';
    }
    
    return headers;
  }

  // Generic API request method
  Future<ApiResponse> _makeRequest(
    String method,
    String endpoint, {
    Map<String, dynamic>? body,
    Map<String, String>? customHeaders,
  }) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = {..._headers, ...?customHeaders};

    http.Response response;
    
    try {
      switch (method.toLowerCase()) {
        case 'get':
          response = await http.get(url, headers: headers);
          break;
        case 'post':
          response = await http.post(
            url,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'put':
          response = await http.put(
            url,
            headers: headers,
            body: body != null ? json.encode(body) : null,
          );
          break;
        case 'delete':
          response = await http.delete(url, headers: headers);
          break;
        default:
          throw Exception('Unsupported HTTP method: $method');
      }

      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'خطأ في الاتصال بالخادم',
        errorCode: 'NETWORK_ERROR',
      );
    }
  }

  // Handle API response
  ApiResponse _handleResponse(http.Response response) {
    final Map<String, dynamic> data = json.decode(response.body);
    
    return ApiResponse(
      success: data['success'] ?? false,
      message: data['message'] ?? '',
      data: data['data'],
      status: data['status'] ?? response.statusCode,
      errorCode: data['errorCode'],
      requestId: data['requestId'],
      details: data['details'],
    );
  }

  // Refresh access token
  Future<bool> refreshAccessToken() async {
    if (_refreshToken == null) return false;

    try {
      final response = await _makeRequest('POST', '/api/auth/refresh-token', body: {
        'refreshToken': _refreshToken,
      });

      if (response.success && response.data != null) {
        await _saveTokens(
          response.data['accessToken'],
          response.data['refreshToken'],
        );
        return true;
      }
    } catch (e) {
      print('Token refresh failed: $e');
    }

    return false;
  }

  // API methods
  Future<ApiResponse> get(String endpoint) => _makeRequest('GET', endpoint);
  Future<ApiResponse> post(String endpoint, {Map<String, dynamic>? body}) => 
    _makeRequest('POST', endpoint, body: body);
  Future<ApiResponse> put(String endpoint, {Map<String, dynamic>? body}) => 
    _makeRequest('PUT', endpoint, body: body);
  Future<ApiResponse> delete(String endpoint) => _makeRequest('DELETE', endpoint);
}

// API Response model
class ApiResponse {
  final bool success;
  final String message;
  final dynamic data;
  final int? status;
  final String? errorCode;
  final String? requestId;
  final Map<String, dynamic>? details;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.status,
    this.errorCode,
    this.requestId,
    this.details,
  });

  @override
  String toString() {
    return 'ApiResponse(success: $success, message: $message, status: $status, errorCode: $errorCode)';
  }
}
```

## Authentication Examples

### 1. Firebase Authentication

```dart
class AuthService {
  final ApiClient _apiClient = ApiClient();
  final FirebaseAuth _firebaseAuth = FirebaseAuth.instance;

  // Firebase login
  Future<ApiResponse> loginWithFirebase() async {
    try {
      // Get Firebase ID token
      final User? user = _firebaseAuth.currentUser;
      if (user == null) {
        return ApiResponse(
          success: false,
          message: 'المستخدم غير مسجل الدخول في Firebase',
        );
      }

      final String idToken = await user.getIdToken();

      // Send to backend
      final response = await _apiClient._makeRequest(
        'POST',
        '/api/auth/firebase',
        customHeaders: {
          'Authorization': 'Bearer $idToken',
        },
      );

      if (response.success && response.data != null) {
        // Save JWT tokens
        await _apiClient._saveTokens(
          response.data['accessToken'],
          response.data['refreshToken'],
        );
      }

      return response;
    } catch (e) {
      return ApiResponse(
        success: false,
        message: 'خطأ في مصادقة Firebase: $e',
      );
    }
  }

  // Email/Password registration
  Future<ApiResponse> register({
    required String email,
    required String password,
    required String confirmPassword,
    required String displayName,
    String role = 'user',
  }) async {
    final response = await _apiClient.post('/api/auth/register', body: {
      'email': email,
      'password': password,
      'confirmPassword': confirmPassword,
      'displayName': displayName,
      'role': role,
    });

    if (response.success && response.data != null) {
      await _apiClient._saveTokens(
        response.data['accessToken'],
        response.data['refreshToken'],
      );
    }

    return response;
  }

  // Email/Password login
  Future<ApiResponse> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post('/api/auth/login', body: {
      'email': email,
      'password': password,
    });

    if (response.success && response.data != null) {
      await _apiClient._saveTokens(
        response.data['accessToken'],
        response.data['refreshToken'],
      );
    }

    return response;
  }

  // Get current user
  Future<ApiResponse> getCurrentUser() async {
    return await _apiClient.get('/api/auth/me');
  }

  // Update FCM token for notifications
  Future<ApiResponse> updateFCMToken(String fcmToken) async {
    return await _apiClient.post('/api/auth/fcm-token', body: {
      'fcmToken': fcmToken,
    });
  }

  // Logout
  Future<ApiResponse> logout() async {
    final response = await _apiClient.post('/api/auth/logout');
    await _apiClient.clearTokens();
    return response;
  }

  // Forgot password
  Future<ApiResponse> forgotPassword(String email) async {
    return await _apiClient.post('/api/auth/forgot-password', body: {
      'email': email,
    });
  }

  // Verify forget code
  Future<ApiResponse> verifyForgetCode(String email, String code) async {
    return await _apiClient.post('/api/auth/verify-forget-code', body: {
      'email': email,
      'forgetCode': code,
    });
  }

  // Reset password
  Future<ApiResponse> resetPassword({
    required String email,
    required String password,
    required String confirmPassword,
  }) async {
    return await _apiClient.post('/api/auth/reset-password', body: {
      'email': email,
      'password': password,
      'confirmPassword': confirmPassword,
    });
  }
}
```

### 2. Usage in Flutter Widgets

```dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final AuthService _authService = AuthService();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    if (_emailController.text.isEmpty || _passwordController.text.isEmpty) {
      _showError('يرجى ملء جميع الحقول');
      return;
    }

    setState(() => _isLoading = true);

    try {
      final response = await _authService.login(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (response.success) {
        // Navigate to home screen
        Navigator.pushReplacementNamed(context, '/home');
      } else {
        _showError(response.message);
      }
    } catch (e) {
      _showError('حدث خطأ غير متوقع');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _loginWithFirebase() async {
    setState(() => _isLoading = true);

    try {
      // First authenticate with Firebase
      final UserCredential userCredential = await FirebaseAuth.instance.signInWithEmailAndPassword(
        email: _emailController.text,
        password: _passwordController.text,
      );

      if (userCredential.user != null) {
        // Then authenticate with backend
        final response = await _authService.loginWithFirebase();
        
        if (response.success) {
          Navigator.pushReplacementNamed(context, '/home');
        } else {
          _showError(response.message);
        }
      }
    } on FirebaseAuthException catch (e) {
      _showError(_getFirebaseErrorMessage(e.code));
    } catch (e) {
      _showError('حدث خطأ غير متوقع');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }

  String _getFirebaseErrorMessage(String code) {
    switch (code) {
      case 'user-not-found':
        return 'لا يوجد مستخدم بهذا البريد الإلكتروني';
      case 'wrong-password':
        return 'كلمة المرور غير صحيحة';
      case 'invalid-email':
        return 'البريد الإلكتروني غير صالح';
      case 'user-disabled':
        return 'تم تعطيل هذا الحساب';
      default:
        return 'حدث خطأ في المصادقة';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('تسجيل الدخول')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _emailController,
              decoration: InputDecoration(labelText: 'البريد الإلكتروني'),
              keyboardType: TextInputType.emailAddress,
            ),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'كلمة المرور'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            _isLoading
                ? CircularProgressIndicator()
                : Column(
                    children: [
                      ElevatedButton(
                        onPressed: _login,
                        child: Text('تسجيل الدخول'),
                      ),
                      SizedBox(height: 10),
                      ElevatedButton(
                        onPressed: _loginWithFirebase,
                        child: Text('تسجيل الدخول مع Firebase'),
                      ),
                    ],
                  ),
          ],
        ),
      ),
    );
  }
}
```

## Error Handling

### 1. Error Response Model

```dart
class ApiError {
  final String message;
  final String? errorCode;
  final int? status;
  final Map<String, dynamic>? details;

  ApiError({
    required this.message,
    this.errorCode,
    this.status,
    this.details,
  });

  bool get isNetworkError => errorCode == 'NETWORK_ERROR';
  bool get isAuthError => status == 401;
  bool get isValidationError => errorCode == 'VALIDATION_ERROR';
  bool get isServerError => (status ?? 0) >= 500;
}
```

### 2. Error Handling Helper

```dart
class ErrorHandler {
  static String getErrorMessage(ApiResponse response) {
    if (response.success) return '';

    // Handle specific error codes
    switch (response.errorCode) {
      case 'NETWORK_ERROR':
        return 'خطأ في الاتصال بالإنترنت';
      case 'UNAUTHORIZED':
        return 'يجب تسجيل الدخول أولاً';
      case 'FORBIDDEN':
        return 'غير مصرح لك بالوصول';
      case 'NOT_FOUND':
        return 'المورد المطلوب غير موجود';
      case 'VALIDATION_ERROR':
        return _getValidationErrorMessage(response.details);
      case 'DUPLICATE_ENTITY':
        return 'البيانات موجودة بالفعل';
      case 'FIREBASE_ERROR':
        return 'خطأ في مصادقة Firebase';
      default:
        return response.message.isNotEmpty 
            ? response.message 
            : 'حدث خطأ غير متوقع';
    }
  }

  static String _getValidationErrorMessage(Map<String, dynamic>? details) {
    if (details == null || details.isEmpty) {
      return 'البيانات المدخلة غير صالحة';
    }

    // Return first validation error
    final firstError = details.values.first;
    return firstError.toString();
  }

  static bool shouldRetry(ApiResponse response) {
    return response.errorCode == 'NETWORK_ERROR' || 
           (response.status != null && response.status! >= 500);
  }

  static bool shouldRefreshToken(ApiResponse response) {
    return response.status == 401 && 
           response.errorCode != 'INVALID_TOKEN';
  }
}
```

## Best Practices

### 1. Token Management
- Always store tokens securely using `SharedPreferences` or `flutter_secure_storage`
- Implement automatic token refresh
- Clear tokens on logout

### 2. Network Handling
- Implement retry logic for network failures
- Show appropriate loading states
- Handle offline scenarios

### 3. Error Display
- Show user-friendly error messages in Arabic
- Log detailed errors for debugging
- Implement proper error recovery flows

### 4. Security
- Use HTTPS in production
- Validate all user inputs
- Implement proper session management

### 5. Performance
- Cache API responses when appropriate
- Implement pagination for large data sets
- Use efficient data models

### 6. Testing
- Write unit tests for API client
- Mock API responses for UI tests
- Test error scenarios

## Example Usage in Main App

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Initialize API client
  final apiClient = ApiClient();
  await apiClient.initializeTokens();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ArtHub',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: AuthWrapper(),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  final AuthService _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ApiResponse>(
      future: _authService.getCurrentUser(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.hasData && snapshot.data!.success) {
          return HomeScreen();
        } else {
          return LoginScreen();
        }
      },
    );
  }
}
```

This guide provides a complete foundation for integrating your Flutter app with the ArtHub backend API. The examples show both Firebase and traditional authentication flows, proper error handling, and best practices for mobile app development.
