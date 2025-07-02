# ArtHub Error Codes and Handling

This document provides a comprehensive list of error codes returned by the ArtHub API and how to handle them in your Flutter application.

## Error Response Format

All API errors follow this standard format:

```json
{
  "success": false,
  "status": 400,
  "message": "حدث خطأ",
  "error": "تفاصيل الخطأ",
  "errorCode": "ERROR_CODE",
  "timestamp": "2023-05-15T10:30:45.123Z",
  "requestId": "abc123def456"
}
```

## Common Error Codes

### Authentication Errors

| Error Code | HTTP Status | Description | Flutter Handling |
|------------|-------------|-------------|-----------------|
| `AUTH_INVALID_CREDENTIALS` | 401 | Invalid email or password | Show login error message and allow retry |
| `AUTH_ACCOUNT_DISABLED` | 403 | User account is disabled | Redirect to contact support screen |
| `AUTH_TOKEN_EXPIRED` | 401 | JWT token has expired | Use refresh token to get new access token |
| `AUTH_TOKEN_INVALID` | 401 | JWT token is invalid | Force logout and redirect to login screen |
| `AUTH_REFRESH_TOKEN_EXPIRED` | 401 | Refresh token has expired | Force logout and redirect to login screen |
| `AUTH_UNAUTHORIZED` | 403 | User does not have permission | Show permission denied message |
| `AUTH_EMAIL_EXISTS` | 409 | Email already exists | Suggest login or password recovery |
| `AUTH_VERIFICATION_FAILED` | 400 | Email verification failed | Resend verification code option |
| `AUTH_RESET_CODE_INVALID` | 400 | Password reset code invalid | Allow code re-entry or request new code |
| `AUTH_FIREBASE_ERROR` | 401 | Firebase authentication error | Show specific error from Firebase |

### Resource Errors

| Error Code | HTTP Status | Description | Flutter Handling |
|------------|-------------|-------------|-----------------|
| `RESOURCE_NOT_FOUND` | 404 | Resource not found | Show not found message or refresh data |
| `RESOURCE_ALREADY_EXISTS` | 409 | Resource already exists | Show conflict message |
| `RESOURCE_INVALID` | 400 | Resource validation failed | Highlight invalid fields |
| `RESOURCE_FORBIDDEN` | 403 | Not authorized to access resource | Show permission denied message |

### Image Errors

| Error Code | HTTP Status | Description | Flutter Handling |
|------------|-------------|-------------|-----------------|
| `IMAGE_UPLOAD_FAILED` | 500 | Failed to upload image | Retry upload or reduce image size |
| `IMAGE_INVALID_FORMAT` | 400 | Invalid image format | Show supported formats message |
| `IMAGE_TOO_LARGE` | 400 | Image size exceeds limit | Compress image or reduce dimensions |
| `IMAGE_MODERATION_FAILED` | 403 | Image failed content moderation | Show content policy violation message |

### Network Errors

| Error Code | HTTP Status | Description | Flutter Handling |
|------------|-------------|-------------|-----------------|
| `NETWORK_CONNECTION_ERROR` | 503 | Server connection error | Show offline mode or retry option |
| `NETWORK_TIMEOUT` | 504 | Request timeout | Retry with exponential backoff |
| `NETWORK_RATE_LIMIT` | 429 | Too many requests | Show rate limit message with retry after time |

### Database Errors

| Error Code | HTTP Status | Description | Flutter Handling |
|------------|-------------|-------------|-----------------|
| `DB_CONNECTION_ERROR` | 503 | Database connection error | Show temporary error message and retry |
| `DB_VALIDATION_ERROR` | 400 | Database validation error | Show specific validation errors |
| `DB_DUPLICATE_KEY` | 409 | Duplicate key error | Show specific field conflict message |

## Error Handling in Flutter

### Example Error Handler

```dart
class ApiErrorHandler {
  static handleError(dynamic error) {
    if (error is DioError) {
      // Handle Dio specific errors
      if (error.type == DioErrorType.connectTimeout ||
          error.type == DioErrorType.receiveTimeout) {
        return 'Connection timeout. Please check your internet connection.';
      }
      
      // Handle API error responses
      if (error.response != null) {
        final errorData = error.response!.data;
        final errorCode = errorData['errorCode'];
        
        switch (errorCode) {
          case 'AUTH_TOKEN_EXPIRED':
            // Attempt to refresh token
            return AuthService.refreshToken();
          
          case 'AUTH_REFRESH_TOKEN_EXPIRED':
          case 'AUTH_TOKEN_INVALID':
            // Force logout
            AuthService.logout();
            return 'Session expired. Please login again.';
            
          case 'RESOURCE_NOT_FOUND':
            return 'The requested item was not found.';
            
          case 'NETWORK_RATE_LIMIT':
            final retryAfter = error.response!.headers['Retry-After'];
            return 'Too many requests. Please try again in ${retryAfter ?? 'a few moments'}.';
            
          default:
            // Return the error message from the API
            return errorData['message'] ?? 'An unknown error occurred';
        }
      }
    }
    
    // Fallback error message
    return 'An unexpected error occurred. Please try again.';
  }
}
```

### Integration with API Service

```dart
class ApiService {
  final Dio _dio = Dio();
  
  Future<dynamic> get(String endpoint) async {
    try {
      final response = await _dio.get('$baseUrl$endpoint', 
        options: Options(headers: await _getAuthHeaders()));
      return response.data;
    } catch (e) {
      throw ApiErrorHandler.handleError(e);
    }
  }
  
  Future<dynamic> post(String endpoint, dynamic data) async {
    try {
      final response = await _dio.post('$baseUrl$endpoint', 
        data: data,
        options: Options(headers: await _getAuthHeaders()));
      return response.data;
    } catch (e) {
      throw ApiErrorHandler.handleError(e);
    }
  }
  
  // Additional methods...
}
```

## Common Error Scenarios and Solutions

### Authentication Flow

1. **Token Expiration**
   - When `AUTH_TOKEN_EXPIRED` is received, automatically use the refresh token to get a new access token
   - If refresh fails, redirect to login

2. **Invalid Credentials**
   - Show specific error message for incorrect email/password
   - Provide password reset option

3. **Account Status Issues**
   - For disabled accounts, provide contact support information
   - For unverified accounts, offer email verification option

### Network Issues

1. **Offline Handling**
   - Implement offline mode for critical features
   - Queue operations for when connection is restored

2. **Slow Connection**
   - Show loading indicators
   - Implement timeout handling with retry options

3. **Rate Limiting**
   - Respect Retry-After headers
   - Implement exponential backoff for retries

### Resource Access

1. **Permission Denied**
   - Show clear explanation of required permissions
   - Provide upgrade options if feature requires higher tier

2. **Not Found Resources**
   - Refresh data from server
   - Provide search or browse alternatives

## Testing Error Scenarios

To test these error scenarios in your Flutter app, you can use the Postman collection provided with this documentation. The collection includes examples of each error type for testing your error handling implementation. 