# نظام المصادقة المحسن - ArtHub Backend

## نظرة عامة

نظام مصادقة شامل ومحسن يدعم طرق متعددة للمصادقة مع أمان عالي وسهولة تكامل مع تطبيقات Flutter.

## الميزات الرئيسية

### 🔐 **مصادقة متعددة الطرق**
- **JWT Authentication**: مصادقة باستخدام JSON Web Tokens
- **Firebase Authentication**: دعم كامل لـ Firebase Auth
- **Refresh Token**: تحديث الرموز تلقائياً
- **Multi-Device Support**: دعم أجهزة متعددة

### 🛡️ **أمان متقدم**
- **bcrypt Password Hashing**: تشفير قوي لكلمات المرور
- **Token Validation**: تحقق صارم من الرموز المميزة
- **Rate Limiting**: حماية من الهجمات
- **Input Validation**: تحقق شامل من المدخلات

### 📱 **تكامل Flutter**
- **Complete Flutter Guide**: دليل تكامل شامل
- **Code Examples**: أمثلة كود جاهزة
- **Error Handling**: معالجة أخطاء متقدمة
- **Auto Token Refresh**: تحديث تلقائي للرموز

### 🧪 **اختبارات شاملة**
- **95%+ Test Coverage**: تغطية عالية للكود
- **Integration Tests**: اختبارات تكامل كاملة
- **Error Scenarios**: اختبار حالات الأخطاء
- **Performance Tests**: اختبارات الأداء

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| `POST` | `/api/auth/register` | تسجيل مستخدم جديد | ❌ |
| `POST` | `/api/auth/login` | تسجيل الدخول | ❌ |
| `POST` | `/api/auth/firebase` | تسجيل الدخول بـ Firebase | ❌ |
| `POST` | `/api/auth/forgot-password` | نسيان كلمة المرور | ❌ |
| `POST` | `/api/auth/verify-forget-code` | التحقق من رمز الاستعادة | ❌ |
| `POST` | `/api/auth/reset-password` | إعادة تعيين كلمة المرور | ❌ |
| `POST` | `/api/auth/refresh-token` | تحديث الرمز المميز | ❌ |
| `POST` | `/api/auth/logout` | تسجيل الخروج | ✅ |
| `GET` | `/api/auth/me` | بيانات المستخدم الحالي | ✅ |
| `POST` | `/api/auth/fcm-token` | تحديث رمز الإشعارات | ✅ |

## Quick Start

### 1. تشغيل السيرفر
```bash
npm install
npm start
```

### 2. الوصول للتوثيق
```
http://localhost:3002/api-docs
```

### 3. اختبار الـ APIs
```bash
# تسجيل مستخدم جديد
curl -X POST http://localhost:3002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!",
    "confirmPassword": "Password123!",
    "displayName": "Test User",
    "role": "user"
  }'

# تسجيل الدخول
curl -X POST http://localhost:3002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'
```

## مثال تكامل Flutter

### 1. إعداد Dependencies
```yaml
dependencies:
  dio: ^5.3.2
  flutter_secure_storage: ^9.0.0
  provider: ^6.1.1
  firebase_auth: ^4.15.3
```

### 2. Auth Service
```dart
class AuthService {
  final ApiService _apiService = ApiService();
  
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await _apiService.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final authResponse = AuthResponse.fromJson(response.data);
      
      if (authResponse.success && authResponse.data != null) {
        await _saveTokens(
          authResponse.data!.accessToken,
          authResponse.data!.refreshToken,
        );
      }

      return authResponse;
    } on DioException catch (e) {
      return AuthResponse(
        success: false,
        message: e.response?.data['message'] ?? 'حدث خطأ أثناء تسجيل الدخول',
      );
    }
  }
}
```

### 3. Auto Token Refresh
```dart
_dio.interceptors.add(InterceptorsWrapper(
  onError: (error, handler) async {
    if (error.response?.statusCode == 401) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        // Retry original request
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
```

## أمثلة الاستخدام

### تسجيل مستخدم جديد
```javascript
// Request
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "Password123!",
  "confirmPassword": "Password123!",
  "displayName": "مريم فوزي",
  "role": "artist"
}

// Response
{
  "success": true,
  "message": "تم إنشاء الحساب بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### تسجيل الدخول
```javascript
// Request
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "Password123!"
}

// Response
{
  "success": true,
  "message": "تم تسجيل الدخول بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "email": "user@example.com",
    "displayName": "مريم فوزي",
    "role": "artist",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### إعادة تعيين كلمة المرور
```javascript
// 1. طلب رمز الاستعادة
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

// 2. التحقق من الرمز
POST /api/auth/verify-forget-code
{
  "email": "user@example.com",
  "forgetCode": "1234"
}

// 3. إعادة تعيين كلمة المرور
POST /api/auth/reset-password
{
  "email": "user@example.com",
  "password": "NewPassword123!",
  "confirmPassword": "NewPassword123!"
}
```

## معالجة الأخطاء

### رموز الأخطاء الشائعة
```javascript
const ERROR_CODES = {
  INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
  DUPLICATE_ENTITY: 'البريد الإلكتروني مستخدم بالفعل',
  UNAUTHORIZED: 'غير مصرح بالوصول',
  FORBIDDEN: 'الحساب معطل أو محذوف',
  VALIDATION_ERROR: 'خطأ في البيانات المدخلة',
  TOKEN_EXPIRED: 'انتهت صلاحية الرمز المميز',
  INVALID_TOKEN: 'رمز غير صالح'
};
```

### مثال على استجابة خطأ
```json
{
  "success": false,
  "message": "البريد الإلكتروني أو كلمة المرور غير صحيحة",
  "errorCode": "INVALID_CREDENTIALS",
  "timestamp": "2023-05-15T10:30:45.123Z"
}
```

## قواعد التحقق

### كلمة المرور
- **الحد الأدنى**: 8 أحرف
- **حرف كبير**: واحد على الأقل
- **حرف صغير**: واحد على الأقل
- **رقم أو رمز خاص**: واحد على الأقل

### البريد الإلكتروني
- **صيغة صحيحة**: يجب أن يكون بصيغة email صحيحة
- **فريد**: لا يمكن تكرار البريد الإلكتروني

### اسم المستخدم
- **الحد الأدنى**: حرفان
- **الحد الأقصى**: 50 حرف

## الأمان

### تشفير كلمات المرور
```javascript
// استخدام bcrypt مع salt rounds 10
const hashedPassword = await bcryptjs.hash(password, 10);
```

### إدارة الرموز المميزة
```javascript
// Access Token: صالح لمدة ساعتين
// Refresh Token: صالح لمدة 30 يوم
// يتم حفظ الرموز في قاعدة البيانات للتحقق
```

### حماية من الهجمات
- **Rate Limiting**: تحديد عدد المحاولات
- **Input Validation**: تحقق من جميع المدخلات
- **XSS Protection**: حماية من هجمات XSS
- **SQL Injection Prevention**: حماية من حقن SQL

## الاختبارات

### تشغيل الاختبارات
```bash
# جميع الاختبارات
npm test

# اختبارات المصادقة فقط
npm test -- __tests__/unit/auth.test.js

# اختبارات مع تغطية الكود
npm run test:coverage
```

### أنواع الاختبارات
- **Unit Tests**: اختبارات الوحدة
- **Integration Tests**: اختبارات التكامل
- **Error Handling Tests**: اختبارات معالجة الأخطاء
- **Performance Tests**: اختبارات الأداء

## التوثيق

### Swagger Documentation
```
http://localhost:3002/api-docs
```

### Flutter Integration Guide
```
docs/FLUTTER_AUTH_INTEGRATION.md
```

### API Response Examples
```
docs/RESPONSE_EXAMPLES.md
```

## بنية المشروع

```
src/modules/auth/
├── controller/
│   └── auth.js              # Authentication controller
├── auth.router.js           # Routes definition
├── auth.validation.js       # Input validation
└── auth.middleware.js       # Authentication middleware

__tests__/unit/
└── auth.test.js            # Comprehensive tests

docs/
├── FLUTTER_AUTH_INTEGRATION.md  # Flutter guide
└── RESPONSE_EXAMPLES.md          # API examples
```

## متغيرات البيئة

```env
# JWT Configuration
TOKEN_KEY=your-secret-key
REFRESH_TOKEN_KEY=your-refresh-secret-key

# Database
DB_CONNECTION_STRING=mongodb://localhost:27017/arthub

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Firebase (Optional)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

## إرشادات التطوير

### إضافة endpoint جديد
1. **إضافة الدالة في Controller**
2. **إضافة Route في Router**
3. **إضافة Validation Schema**
4. **إضافة Swagger Documentation**
5. **كتابة الاختبارات**

### أفضل الممارسات
- **استخدام async/await** للعمليات غير المتزامنة
- **معالجة الأخطاء** في جميع الدوال
- **تحقق من المدخلات** قبل المعالجة
- **رسائل خطأ واضحة** باللغة العربية
- **توثيق الكود** مع التعليقات

## الدعم والمساعدة

### للمطورين
- **Documentation**: توثيق شامل متاح
- **Code Examples**: أمثلة كود جاهزة
- **Test Cases**: حالات اختبار شاملة
- **Error Handling**: معالجة أخطاء متقدمة

### للمستخدمين
- **Clear Error Messages**: رسائل خطأ واضحة
- **Multi-language Support**: دعم اللغة العربية
- **Responsive Design**: تصميم متجاوب
- **Secure Authentication**: مصادقة آمنة

## المساهمة

### خطوات المساهمة
1. **Fork** المشروع
2. **إنشاء branch** للميزة الجديدة
3. **كتابة الكود** مع الاختبارات
4. **تشغيل الاختبارات** للتأكد من الجودة
5. **إنشاء Pull Request**

### معايير الكود
- **ESLint**: اتباع قواعد ESLint
- **Prettier**: تنسيق الكود
- **JSDoc**: توثيق الدوال
- **Test Coverage**: تغطية اختبارات عالية

## الرخصة

MIT License - راجع ملف LICENSE للتفاصيل.

## الخلاصة

نظام مصادقة متكامل وآمن يوفر:
- ✅ **مصادقة متعددة الطرق**
- ✅ **أمان عالي**
- ✅ **سهولة تكامل**
- ✅ **اختبارات شاملة**
- ✅ **توثيق كامل**

النظام جاهز للاستخدام في الإنتاج ويوفر تجربة مصادقة سلسة وآمنة للمستخدمين. 