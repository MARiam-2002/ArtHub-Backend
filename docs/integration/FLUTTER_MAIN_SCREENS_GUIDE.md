# Flutter Main Screens Integration Guide
## دليل ربط الشاشات الرئيسية للتطبيق

### Base URL & Headers
```
Base URL: http://localhost:3001/api
Headers: {
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## 1. Home Screen / Feed Screen
**الغرض**: عرض الصفحة الرئيسية مع الأعمال الفنية والمحتوى

### Endpoints المطلوبة:

#### 1.1 جلب المحتوى الرئيسي
```http
GET /api/home/feed?page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "artworks": [
      {
        "_id": "artwork_id",
        "title": "عنوان العمل",
        "description": "وصف العمل",
        "images": [
          {
            "url": "https://example.com/image.jpg",
            "id": "image_id"
          }
        ],
        "artist": {
          "_id": "artist_id",
          "displayName": "اسم الفنان",
          "profileImage": {
            "url": "https://example.com/profile.jpg"
          }
        },
        "price": 1500,
        "category": "رسم",
        "likes": 25,
        "isLiked": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "totalPages": 5,
    "currentPage": 1,
    "hasNext": true
  }
}
```

#### 1.2 البحث في الأعمال
```http
GET /api/home/search?query=رسم&category=art&page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 1.3 جلب الفئات
```http
GET /api/category/
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "category_id",
      "name": "رسم",
      "description": "أعمال الرسم والتصوير",
      "image": {
        "url": "https://example.com/category.jpg"
      }
    }
  ]
}
```

### Flutter Implementation:
```dart
Future<List<Artwork>> fetchHomeFeed(int page) async {
  final response = await ApiClient.get('/home/feed?page=$page&limit=10');
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return (data['data']['artworks'] as List)
        .map((artwork) => Artwork.fromJson(artwork))
        .toList();
  }
  throw Exception('Failed to load home feed');
}
```

---

## 2. Profile Screen
**الغرض**: عرض وتحرير الملف الشخصي

### Endpoints المطلوبة:

#### 2.1 جلب الملف الشخصي
```http
GET /api/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "displayName": "اسم المستخدم",
      "email": "user@example.com",
      "job": "فنان",
      "profileImage": {
        "url": "https://example.com/profile.jpg",
        "id": "image_id"
      },
      "coverImages": [
        {
          "url": "https://example.com/cover.jpg",
          "id": "cover_id"
        }
      ],
      "followersCount": 150,
      "followingCount": 75,
      "artworksCount": 25,
      "isVerified": true,
      "preferredLanguage": "ar"
    }
  }
}
```

#### 2.2 تحديث الملف الشخصي
```http
PUT /api/user/profile
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
```
displayName: "اسم جديد"
job: "مصمم جرافيك"
profileImage: [file]
```

#### 2.3 جلب أعمال المستخدم
```http
GET /api/user/artworks?page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 3. Artwork Details Screen
**الغرض**: عرض تفاصيل العمل الفني

### Endpoints المطلوبة:

#### 3.1 جلب تفاصيل العمل
```http
GET /api/artwork/:artworkId
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "artwork": {
      "_id": "artwork_id",
      "title": "عنوان العمل",
      "description": "وصف مفصل للعمل",
      "images": [
        {
          "url": "https://example.com/image1.jpg",
          "id": "image1_id"
        }
      ],
      "artist": {
        "_id": "artist_id",
        "displayName": "اسم الفنان",
        "profileImage": {
          "url": "https://example.com/profile.jpg"
        },
        "isFollowed": false
      },
      "price": 1500,
      "category": "رسم",
      "likes": 25,
      "isLiked": false,
      "isInWishlist": false,
      "tags": ["رسم", "فن", "تصوير"],
      "reviews": [
        {
          "_id": "review_id",
          "user": {
            "displayName": "اسم المراجع",
            "profileImage": {
              "url": "https://example.com/reviewer.jpg"
            }
          },
          "rating": 5,
          "comment": "عمل رائع",
          "createdAt": "2024-01-01T00:00:00.000Z"
        }
      ],
      "averageRating": 4.8,
      "reviewsCount": 12,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

#### 3.2 إضافة/إزالة الإعجاب
```http
POST /api/artwork/:artworkId/like
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 3.3 إضافة/إزالة من المفضلة
```http
POST /api/artwork/:artworkId/wishlist
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 3.4 إضافة مراجعة
```http
POST /api/review/
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "artworkId": "artwork_id",
  "rating": 5,
  "comment": "عمل رائع ومميز"
}
```

---

## 4. Chat Screen
**الغرض**: المحادثات والرسائل

### Endpoints المطلوبة:

#### 4.1 جلب قائمة المحادثات
```http
GET /api/chat/conversations?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [
      {
        "_id": "conversation_id",
        "participants": [
          {
            "_id": "user_id",
            "displayName": "اسم المستخدم",
            "profileImage": {
              "url": "https://example.com/profile.jpg"
            },
            "isOnline": true,
            "lastSeen": "2024-01-01T00:00:00.000Z"
          }
        ],
        "lastMessage": {
          "_id": "message_id",
          "content": "آخر رسالة",
          "sender": "user_id",
          "createdAt": "2024-01-01T00:00:00.000Z",
          "isRead": false
        },
        "unreadCount": 3,
        "updatedAt": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

#### 4.2 جلب رسائل المحادثة
```http
GET /api/chat/messages/:conversationId?page=1&limit=50
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 4.3 إرسال رسالة
```http
POST /api/chat/send
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "conversationId": "conversation_id",
  "content": "محتوى الرسالة",
  "type": "text"
}
```

#### 4.4 إرسال صورة
```http
POST /api/chat/send-image
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
```
conversationId: "conversation_id"
image: [file]
```

#### 4.5 بدء محادثة جديدة
```http
POST /api/chat/start
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "participantId": "user_id"
}
```

---

## 5. Notifications Screen
**الغرض**: عرض الإشعارات

### Endpoints المطلوبة:

#### 5.1 جلب الإشعارات
```http
GET /api/notification/?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "_id": "notification_id",
        "type": "like",
        "title": "إعجاب جديد",
        "message": "أعجب أحمد بعملك الفني",
        "data": {
          "artworkId": "artwork_id",
          "userId": "user_id"
        },
        "isRead": false,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "unreadCount": 5
  }
}
```

#### 5.2 تحديد الإشعار كمقروء
```http
PUT /api/notification/:notificationId/read
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 5.3 تحديد جميع الإشعارات كمقروءة
```http
PUT /api/notification/mark-all-read
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 6. Follow System
**الغرض**: نظام المتابعة

### Endpoints المطلوبة:

#### 6.1 متابعة مستخدم
```http
POST /api/follow/
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "followingId": "user_id_to_follow"
}
```

#### 6.2 إلغاء المتابعة
```http
DELETE /api/follow/:followingId
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 6.3 جلب قائمة المتابعين
```http
GET /api/follow/followers?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 6.4 جلب قائمة المتابعين
```http
GET /api/follow/following?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 7. Search Screen
**الغرض**: البحث في المحتوى

### Endpoints المطلوبة:

#### 7.1 البحث العام
```http
GET /api/home/search?query=رسم&type=all&page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 7.2 البحث في الأعمال فقط
```http
GET /api/home/search?query=رسم&type=artworks&page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 7.3 البحث في المستخدمين فقط
```http
GET /api/home/search?query=أحمد&type=users&page=1&limit=10
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 8. Upload Artwork Screen
**الغرض**: رفع عمل فني جديد

### Endpoints المطلوبة:

#### 8.1 رفع العمل الفني
```http
POST /api/artwork/
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
```
title: "عنوان العمل"
description: "وصف العمل"
price: 1500
categoryId: "category_id"
tags: "رسم,فن,تصوير"
images: [file1, file2, file3]
```

#### 8.2 رفع صورة مؤقتة
```http
POST /api/image/upload
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: multipart/form-data
```

**Form Data:**
```
image: [file]
```

---

## 9. Settings Screen
**الغرض**: إعدادات التطبيق

### Endpoints المطلوبة:

#### 9.1 تحديث إعدادات الإشعارات
```http
PUT /api/user/notification-settings
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "enablePush": true,
  "enableEmail": false,
  "muteChat": false
}
```

#### 9.2 تغيير اللغة
```http
PUT /api/user/language
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "preferredLanguage": "en"
}
```

#### 9.3 حذف الحساب
```http
DELETE /api/user/account
Authorization: Bearer YOUR_JWT_TOKEN
```

---

## 10. Transactions Screen
**الغرض**: المعاملات والمشتريات

### Endpoints المطلوبة:

#### 10.1 جلب المعاملات
```http
GET /api/transaction/user-transactions?page=1&limit=20
Authorization: Bearer YOUR_JWT_TOKEN
```

#### 10.2 إنشاء معاملة شراء
```http
POST /api/transaction/create
Authorization: Bearer YOUR_JWT_TOKEN
```

**Request Body:**
```json
{
  "artworkId": "artwork_id",
  "paymentMethod": "card",
  "amount": 1500
}
```

---

## WebSocket Integration (للمحادثات الفورية)

### إعداد WebSocket:
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  IO.Socket? socket;
  
  void connect(String token) {
    socket = IO.io('http://localhost:3001', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'extraHeaders': {
        'Authorization': 'Bearer $token'
      }
    });
    
    socket!.connect();
    
    // الاستماع للرسائل الجديدة
    socket!.on('newMessage', (data) {
      // تحديث UI مع الرسالة الجديدة
      handleNewMessage(data);
    });
    
    // الاستماع للإشعارات
    socket!.on('notification', (data) {
      // عرض الإشعار
      showNotification(data);
    });
  }
  
  void sendMessage(String conversationId, String message) {
    socket!.emit('sendMessage', {
      'conversationId': conversationId,
      'content': message,
      'type': 'text'
    });
  }
  
  void disconnect() {
    socket?.disconnect();
  }
}
```

---

## Error Handling للشاشات

### Flutter Error Handler:
```dart
class ApiErrorHandler {
  static void handleError(BuildContext context, dynamic error) {
    String message = 'حدث خطأ غير متوقع';
    
    if (error is DioError) {
      switch (error.response?.statusCode) {
        case 400:
          message = 'خطأ في البيانات المرسلة';
          break;
        case 401:
          message = 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى';
          // توجيه للـ Login Screen
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => LoginScreen()),
            (route) => false
          );
          return;
        case 403:
          message = 'غير مصرح لك بالوصول';
          break;
        case 404:
          message = 'المورد غير موجود';
          break;
        case 500:
          message = 'خطأ في الخادم';
          break;
      }
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      )
    );
  }
}
```

---

## Pagination Helper

### Flutter Pagination:
```dart
class PaginationHelper<T> {
  List<T> items = [];
  int currentPage = 1;
  bool hasMore = true;
  bool isLoading = false;
  
  Future<void> loadMore(Future<ApiResponse<T>> Function(int page) apiCall) async {
    if (isLoading || !hasMore) return;
    
    isLoading = true;
    
    try {
      final response = await apiCall(currentPage);
      
      if (response.success) {
        items.addAll(response.data);
        currentPage++;
        hasMore = response.hasNext;
      }
    } catch (e) {
      // Handle error
    } finally {
      isLoading = false;
    }
  }
  
  void refresh() {
    items.clear();
    currentPage = 1;
    hasMore = true;
  }
}
```

---

## ملاحظات مهمة:

1. **الصور**: استخدم `cached_network_image` لتحسين أداء تحميل الصور
2. **الحالة**: استخدم `Provider` أو `Riverpod` لإدارة الحالة
3. **التخزين المؤقت**: احفظ البيانات محلياً باستخدام `Hive` أو `SQLite`
4. **الأمان**: لا تحفظ معلومات حساسة في التخزين المحلي
5. **الأداء**: استخدم `ListView.builder` مع pagination للقوائم الطويلة
6. **UI/UX**: أضف skeleton loading و pull-to-refresh

هذا الملف يحتوي على جميع الـ endpoints المطلوبة لكل شاشة في التطبيق مع أمثلة عملية للربط. 