# ArtHub Backend Integration Guide for Flutter Developer
## دليل ربط الـ Backend مع Flutter

### 📁 الملفات المطلوبة للمطور:

1. **`FLUTTER_AUTH_COMPLETE_GUIDE.md`** - دليل شامل لجميع شاشات التوثيق
2. **`FLUTTER_MAIN_SCREENS_GUIDE.md`** - دليل شامل لجميع شاشات التطبيق الرئيسية
3. **`ArtHub_Postman_Collection.json`** - مجموعة Postman للاختبار

---

## 🚀 كيفية البدء:

### 1. إعداد البيئة:
```bash
# تأكد من تشغيل الخادم المحلي
cd AtrtHub-Backend
npm install
npm start
# الخادم يعمل على: http://localhost:3001
```

### 2. استيراد Postman Collection:
- افتح Postman
- اضغط على Import
- اختر ملف `ArtHub_Postman_Collection.json`
- اضبط متغير `baseUrl` على `http://localhost:3001/api`

### 3. اختبار الـ APIs:
```bash
# اختبر أولاً تسجيل الدخول
POST /api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# سيتم حفظ الـ token تلقائياً في Postman
# اختبر باقي الـ endpoints
```

---

## 📱 تطبيق الربط في Flutter:

### 1. إعداد HTTP Client:
```dart
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  static const String baseUrl = 'http://localhost:3001/api';
  // أو استخدم IP الجهاز للاختبار على الهاتف
  // static const String baseUrl = 'http://192.168.1.100:3001/api';
  
  static Future<Map<String, String>> getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
```

### 2. إدارة التوثيق:
```dart
class AuthService {
  static Future<bool> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('${ApiClient.baseUrl}/auth/login'),
      headers: await ApiClient.getHeaders(),
      body: json.encode({
        'email': email,
        'password': password,
      }),
    );
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final token = data['data']['token'];
      
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('auth_token', token);
      
      return true;
    }
    return false;
  }
}
```

---

## 🔧 إعداد Flutter للاختبار:

### 1. إضافة Dependencies:
```yaml
# pubspec.yaml
dependencies:
  http: ^1.1.0
  shared_preferences: ^2.2.2
  provider: ^6.1.1
  socket_io_client: ^2.0.3+1
  cached_network_image: ^3.3.0
  image_picker: ^1.0.4
```

### 2. إعداد Network Security (Android):
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">192.168.1.100</domain>
    </domain-config>
</network-security-config>
```

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

### 3. إعداد Permissions:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CAMERA" />
```

---

## 📋 خطوات الربط حسب الأولوية:

### المرحلة الأولى - التوثيق:
1. ✅ Login Screen
2. ✅ Register Screen  
3. ✅ Forgot Password Screen
4. ✅ Profile Setup Screen

### المرحلة الثانية - الشاشات الرئيسية:
1. ✅ Home Screen (Feed)
2. ✅ Profile Screen
3. ✅ Search Screen
4. ✅ Notifications Screen

### المرحلة الثالثة - الميزات المتقدمة:
1. ✅ Chat System
2. ✅ Upload Artwork
3. ✅ Follow System
4. ✅ Reviews & Ratings

---

## 🔍 اختبار الـ APIs:

### 1. اختبار سريع للتوثيق:
```bash
# تسجيل الدخول
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# النتيجة المتوقعة:
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": { ... }
  }
}
```

### 2. اختبار الصفحة الرئيسية:
```bash
# جلب المحتوى (استخدم الـ token من الخطوة السابقة)
curl -X GET http://localhost:3001/api/home/feed \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 🚨 مشاكل شائعة وحلولها:

### 1. مشكلة الاتصال:
```
Error: Connection refused
```
**الحل**: تأكد من تشغيل الخادم وأن الـ IP صحيح

### 2. مشكلة التوثيق:
```
Error: 401 Unauthorized
```
**الحل**: تأكد من إرسال الـ token في الـ headers

### 3. مشكلة CORS:
```
Error: CORS policy
```
**الحل**: الخادم مُعد مسبقاً للتعامل مع CORS

---

## 📞 الدعم الفني:

إذا واجهت أي مشاكل:
1. تأكد من تشغيل الخادم على `http://localhost:3001`
2. اختبر الـ APIs باستخدام Postman أولاً
3. تحقق من الـ console logs في Flutter
4. راجع الـ network logs في الخادم

---

## 📚 مراجع إضافية:

- **Swagger Documentation**: `http://localhost:3001/api-docs`
- **Database Models**: `DB/models/` folder
- **API Validation**: `src/modules/*/validation.js` files

---

**ملاحظة**: جميع الـ endpoints تدعم اللغة العربية في الرسائل والاستجابات. 