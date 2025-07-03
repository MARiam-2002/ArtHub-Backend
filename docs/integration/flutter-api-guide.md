# دليل ربط Flutter بـ ArtHub Backend API

## معلومات عامة

### Base URL
```
https://your-domain.com/api
```

### Authentication
جميع الطلبات المحمية تحتاج إلى إرسال JWT Token في الـ header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Response Format
جميع الـ APIs ترجع البيانات بهذا الشكل:
```json
{
  "success": true,
  "message": "رسالة النجاح",
  "data": {
    // البيانات المطلوبة
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

---

## 🔐 صفحات المصادقة (Authentication)

### 1. صفحة تسجيل الدخول
**APIs المطلوبة:**

#### تسجيل الدخول بالإيميل
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### تسجيل الدخول بـ Google
```http
POST /api/auth/google
Content-Type: application/json

{
  "googleToken": "google_oauth_token"
}
```

#### تسجيل الدخول بـ Facebook
```http
POST /api/auth/facebook
Content-Type: application/json

{
  "facebookToken": "facebook_oauth_token"
}
```

#### تسجيل الدخول بـ Firebase
```http
POST /api/auth/firebase
Content-Type: application/json

{
  "firebaseToken": "firebase_id_token"
}
```

### 2. صفحة إنشاء حساب جديد
**APIs المطلوبة:**

#### إنشاء حساب جديد
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "role": "user" // أو "artist"
}
```

#### التحقق من الإيميل
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "user@example.com",
  "verificationCode": "123456"
}
```

### 3. صفحة نسيت كلمة المرور
**APIs المطلوبة:**

#### إرسال رمز التحقق
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### التحقق من الرمز
```http
POST /api/auth/verify-reset-code
Content-Type: application/json

{
  "email": "user@example.com",
  "resetCode": "123456"
}
```

#### تغيير كلمة المرور
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "newPassword": "newpassword123",
  "resetCode": "123456"
}
```

---

## 🏠 الصفحة الرئيسية (Home)

### APIs المطلوبة:

#### بيانات الصفحة الرئيسية
```http
GET /api/home
Authorization: Bearer YOUR_JWT_TOKEN (اختياري)
```

#### البحث العام
```http
GET /api/home/search?q=كلمة البحث&type=artworks&page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN (اختياري)
```

#### الأعمال الفنية الشائعة
```http
GET /api/home/trending?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN (اختياري)
```

---

## 🎨 صفحات الأعمال الفنية (Artworks)

### 1. صفحة عرض جميع الأعمال
**APIs المطلوبة:**

#### جلب جميع الأعمال الفنية
```http
GET /api/artworks?page=1&limit=20&category=categoryId&artist=artistId&sort=newest
Authorization: Bearer YOUR_JWT_TOKEN (اختياري)
```

#### جلب الفئات
```http
GET /api/categories
```

### 2. صفحة تفاصيل العمل الفني
**APIs المطلوبة:**

#### تفاصيل العمل الفني
```http
GET /api/artworks/:artworkId
Authorization: Bearer YOUR_JWT_TOKEN (اختياري)
```

#### إضافة/إزالة من المفضلة
```http
POST /api/user/wishlist
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "artworkId": "artwork_id"
}
```

#### جلب التقييمات
```http
GET /api/reviews/artwork/:artworkId?page=1&limit=10
```

#### إضافة تقييم
```http
POST /api/reviews/artwork
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "artworkId": "artwork_id",
  "rating": 5,
  "comment": "تقييم رائع"
}
```

### 3. صفحة إضافة عمل فني جديد (للفنانين)
**APIs المطلوبة:**

#### رفع الصور
```http
POST /api/image/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

{
  "images": [file1, file2, file3]
}
```

#### إضافة العمل الفني
```http
POST /api/artworks
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "عنوان العمل",
  "description": "وصف العمل",
  "price": 100,
  "category": "category_id",
  "images": ["image_id1", "image_id2"],
  "tags": ["tag1", "tag2"],
  "isForSale": true
}
```

---

## 👤 صفحات الملف الشخصي (Profile)

### 1. صفحة الملف الشخصي
**APIs المطلوبة:**

#### جلب بيانات المستخدم
```http
GET /api/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تحديث الملف الشخصي
```http
PUT /api/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "displayName": "الاسم المعروض",
  "job": "الوظيفة",
  "bio": "نبذة عن المستخدم"
}
```

#### رفع صورة الملف الشخصي
```http
POST /api/user/profile-image
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

{
  "profileImage": file
}
```

### 2. صفحة المفضلة
**APIs المطلوبة:**

#### جلب المفضلة
```http
GET /api/user/wishlist?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. صفحة الإعدادات
**APIs المطلوبة:**

#### تغيير كلمة المرور
```http
PUT /api/user/change-password
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "currentPassword": "كلمة المرور الحالية",
  "newPassword": "كلمة المرور الجديدة"
}
```

#### تحديث إعدادات الإشعارات
```http
PUT /api/user/notification-settings
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "enablePush": true,
  "enableEmail": false,
  "muteChat": false
}
```

#### حذف الحساب
```http
DELETE /api/user/account
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "password": "كلمة المرور للتأكيد"
}
```

---

## 💬 صفحات المحادثة (Chat)

### 1. صفحة قائمة المحادثات
**APIs المطلوبة:**

#### جلب جميع المحادثات
```http
GET /api/chat
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. صفحة المحادثة
**APIs المطلوبة:**

#### إنشاء أو جلب محادثة
```http
POST /api/chat/create
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "participantId": "user_id"
}
```

#### جلب الرسائل
```http
GET /api/chat/:chatId/messages?page=1&limit=50
Authorization: Bearer YOUR_JWT_TOKEN
```

#### إرسال رسالة
```http
POST /api/chat/:chatId/send
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "content": "نص الرسالة",
  "type": "text" // أو "image"
}
```

#### تعليم الرسائل كمقروءة
```http
PATCH /api/chat/:chatId/read
Authorization: Bearer YOUR_JWT_TOKEN
```

#### جلب Socket Token للمحادثة المباشرة
```http
GET /api/chat/socket-token
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🔔 صفحة الإشعارات (Notifications)

### APIs المطلوبة:

#### جلب الإشعارات
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تعليم إشعار كمقروء
```http
PATCH /api/notifications/:notificationId/read
Authorization: Bearer YOUR_JWT_TOKEN
```

#### حذف إشعار
```http
DELETE /api/notifications/:notificationId
Authorization: Bearer YOUR_JWT_TOKEN
```

#### حذف جميع الإشعارات
```http
DELETE /api/notifications
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 👥 صفحات المتابعة (Follow)

### 1. صفحة الفنانين المتابعين
**APIs المطلوبة:**

#### جلب الفنانين المتابعين
```http
GET /api/follow/following?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

### 2. صفحة المتابعين
**APIs المطلوبة:**

#### جلب المتابعين
```http
GET /api/follow/followers?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. متابعة/إلغاء متابعة فنان
**APIs المطلوبة:**

#### متابعة أو إلغاء متابعة
```http
POST /api/follow/toggle
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "artistId": "artist_id"
}
```

#### التحقق من حالة المتابعة
```http
GET /api/follow/status/:artistId
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 🛒 صفحات المعاملات (Transactions)

### 1. صفحة إنشاء طلب شراء
**APIs المطلوبة:**

#### إنشاء معاملة جديدة
```http
POST /api/transactions
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "artworkId": "artwork_id",
  "paymentMethod": "credit_card",
  "shippingAddress": {
    "street": "الشارع",
    "city": "المدينة",
    "country": "البلد",
    "postalCode": "الرمز البريدي"
  }
}
```

### 2. صفحة قائمة المعاملات
**APIs المطلوبة:**

#### جلب معاملات المستخدم
```http
GET /api/transactions?page=1&limit=20&status=pending
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. صفحة تفاصيل المعاملة
**APIs المطلوبة:**

#### تفاصيل المعاملة
```http
GET /api/transactions/:transactionId
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تحديث حالة المعاملة
```http
PATCH /api/transactions/:transactionId/status
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "status": "shipped" // أو "delivered", "cancelled"
}
```

---

## 🎯 صفحات الطلبات المخصصة (Special Requests)

### 1. صفحة إنشاء طلب مخصص
**APIs المطلوبة:**

#### إنشاء طلب مخصص
```http
POST /api/special-requests
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "عنوان الطلب",
  "description": "وصف مفصل للطلب",
  "budget": 500,
  "deadline": "2024-12-31",
  "category": "category_id",
  "referenceImages": ["image_id1", "image_id2"]
}
```

### 2. صفحة قائمة الطلبات المخصصة
**APIs المطلوبة:**

#### جلب الطلبات المخصصة
```http
GET /api/special-requests?page=1&limit=20&status=open
Authorization: Bearer YOUR_JWT_TOKEN
```

### 3. صفحة تفاصيل الطلب المخصص
**APIs المطلوبة:**

#### تفاصيل الطلب
```http
GET /api/special-requests/:requestId
Authorization: Bearer YOUR_JWT_TOKEN
```

#### تقديم عرض على الطلب
```http
POST /api/special-requests/:requestId/proposals
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "description": "وصف العرض",
  "price": 400,
  "estimatedDuration": 7,
  "portfolioImages": ["image_id1", "image_id2"]
}
```

---

## ⭐ صفحات التقييمات (Reviews)

### 1. صفحة تقييمات العمل الفني
**APIs المطلوبة:**

#### جلب تقييمات العمل
```http
GET /api/reviews/artwork/:artworkId?page=1&limit=10
```

### 2. صفحة تقييمات الفنان
**APIs المطلوبة:**

#### جلب تقييمات الفنان
```http
GET /api/reviews/artist/:artistId?page=1&limit=10
```

#### إضافة تقييم للفنان
```http
POST /api/reviews/artist
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "artistId": "artist_id",
  "rating": 5,
  "comment": "فنان رائع"
}
```

---

## 📊 صفحات التقارير (Reports)

### إبلاغ عن محتوى
**APIs المطلوبة:**

#### إبلاغ عن عمل فني
```http
POST /api/reports
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "artwork",
  "targetId": "artwork_id",
  "reason": "inappropriate_content",
  "description": "وصف الإبلاغ"
}
```

#### إبلاغ عن مستخدم
```http
POST /api/reports
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "type": "user",
  "targetId": "user_id",
  "reason": "harassment",
  "description": "وصف الإبلاغ"
}
```

---

## 🔧 APIs مساعدة

### رفع الصور
```http
POST /api/image/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data

{
  "images": [file1, file2, file3]
}
```

### جلب الفئات
```http
GET /api/categories
```

### صحة الخادم
```http
GET /api/health
```

---

## 🚀 WebSocket للمحادثة المباشرة

### الاتصال بـ Socket.IO
```javascript
const socket = io('https://your-domain.com', {
  auth: {
    token: 'YOUR_JWT_TOKEN'
  }
});

// الانضمام لغرفة المحادثة
socket.emit('join-chat', { chatId: 'chat_id' });

// استقبال الرسائل
socket.on('new-message', (message) => {
  console.log('رسالة جديدة:', message);
});

// إرسال رسالة
socket.emit('send-message', {
  chatId: 'chat_id',
  content: 'نص الرسالة',
  type: 'text'
});
```

---

## 📱 أمثلة Dart/Flutter

### HTTP Client Setup
```dart
import 'package:dio/dio.dart';

class ApiClient {
  static final Dio _dio = Dio();
  static const String baseUrl = 'https://your-domain.com/api';
  
  static void setToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }
  
  static Future<Response> get(String path) async {
    return await _dio.get('$baseUrl$path');
  }
  
  static Future<Response> post(String path, dynamic data) async {
    return await _dio.post('$baseUrl$path', data: data);
  }
}
```

### مثال تسجيل الدخول
```dart
Future<void> login(String email, String password) async {
  try {
    final response = await ApiClient.post('/auth/login', {
      'email': email,
      'password': password,
    });
    
    if (response.data['success']) {
      final token = response.data['data']['token'];
      ApiClient.setToken(token);
      // حفظ التوكن محلياً
    }
  } catch (e) {
    print('خطأ في تسجيل الدخول: $e');
  }
}
```

### مثال جلب الأعمال الفنية
```dart
Future<List<Artwork>> getArtworks({int page = 1}) async {
  try {
    final response = await ApiClient.get('/artworks?page=$page&limit=20');
    
    if (response.data['success']) {
      final List<dynamic> artworksData = response.data['data']['artworks'];
      return artworksData.map((json) => Artwork.fromJson(json)).toList();
    }
    return [];
  } catch (e) {
    print('خطأ في جلب الأعمال: $e');
    return [];
  }
}
```

---

## 🔍 نصائح مهمة

1. **استخدم التوكن**: جميع الطلبات المحمية تحتاج JWT Token
2. **معالجة الأخطاء**: تأكد من معالجة جميع حالات الخطأ
3. **Pagination**: استخدم الـ pagination للقوائم الطويلة
4. **Socket.IO**: للمحادثة المباشرة والإشعارات
5. **رفع الصور**: استخدم multipart/form-data للصور
6. **التخزين المؤقت**: احفظ البيانات محلياً لتحسين الأداء

---

## 📞 الدعم الفني

إذا كان لديك أي استفسارات أو مشاكل في الربط، يرجى التواصل مع فريق التطوير. 