# أمثلة عملية للكود - Flutter مع ArtHub Backend

## 🚀 إعداد HTTP Client

### 1. إعداد Dio Client
```dart
// lib/services/api_client.dart
import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  static const String baseUrl = 'https://your-domain.com/api';
  static final Dio _dio = Dio();
  static const _storage = FlutterSecureStorage();

  static void initialize() {
    _dio.options.baseUrl = baseUrl;
    _dio.options.connectTimeout = Duration(seconds: 30);
    _dio.options.receiveTimeout = Duration(seconds: 30);
    
    // إضافة Interceptor للتوكن
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _storage.read(key: 'auth_token');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            // التوكن منتهي الصلاحية
            await _storage.delete(key: 'auth_token');
            // إعادة توجيه لصفحة تسجيل الدخول
          }
          handler.next(error);
        },
      ),
    );
  }

  static Future<Response> get(String path, {Map<String, dynamic>? queryParameters}) async {
    return await _dio.get(path, queryParameters: queryParameters);
  }

  static Future<Response> post(String path, {dynamic data}) async {
    return await _dio.post(path, data: data);
  }

  static Future<Response> put(String path, {dynamic data}) async {
    return await _dio.put(path, data: data);
  }

  static Future<Response> delete(String path) async {
    return await _dio.delete(path);
  }

  static Future<Response> patch(String path, {dynamic data}) async {
    return await _dio.patch(path, data: data);
  }
}
```

### 2. إعداد Response Model
```dart
// lib/models/api_response.dart
class ApiResponse<T> {
  final bool success;
  final String message;
  final T? data;
  final Pagination? pagination;

  ApiResponse({
    required this.success,
    required this.message,
    this.data,
    this.pagination,
  });

  factory ApiResponse.fromJson(Map<String, dynamic> json, T Function(dynamic)? fromJsonT) {
    return ApiResponse<T>(
      success: json['success'] ?? false,
      message: json['message'] ?? '',
      data: fromJsonT != null && json['data'] != null ? fromJsonT(json['data']) : null,
      pagination: json['pagination'] != null ? Pagination.fromJson(json['pagination']) : null,
    );
  }
}

class Pagination {
  final int page;
  final int limit;
  final int total;
  final int pages;

  Pagination({
    required this.page,
    required this.limit,
    required this.total,
    required this.pages,
  });

  factory Pagination.fromJson(Map<String, dynamic> json) {
    return Pagination(
      page: json['page'] ?? 1,
      limit: json['limit'] ?? 20,
      total: json['total'] ?? 0,
      pages: json['pages'] ?? 0,
    );
  }
}
```

---

## 🔐 خدمات المصادقة

### 1. Auth Service
```dart
// lib/services/auth_service.dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'api_client.dart';

class AuthService {
  static const _storage = FlutterSecureStorage();

  // تسجيل الدخول
  static Future<ApiResponse<LoginResponse>> login(String email, String password) async {
    try {
      final response = await ApiClient.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      final apiResponse = ApiResponse<LoginResponse>.fromJson(
        response.data,
        (data) => LoginResponse.fromJson(data),
      );

      if (apiResponse.success && apiResponse.data != null) {
        await _storage.write(key: 'auth_token', value: apiResponse.data!.token);
        await _storage.write(key: 'user_id', value: apiResponse.data!.user.id);
      }

      return apiResponse;
    } catch (e) {
      return ApiResponse<LoginResponse>(
        success: false,
        message: 'حدث خطأ في تسجيل الدخول',
      );
    }
  }

  // إنشاء حساب جديد
  static Future<ApiResponse<RegisterResponse>> register(String email, String password, String role) async {
    try {
      final response = await ApiClient.post('/auth/register', data: {
        'email': email,
        'password': password,
        'role': role,
      });

      return ApiResponse<RegisterResponse>.fromJson(
        response.data,
        (data) => RegisterResponse.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<RegisterResponse>(
        success: false,
        message: 'حدث خطأ في إنشاء الحساب',
      );
    }
  }

  // تسجيل الخروج
  static Future<void> logout() async {
    await _storage.delete(key: 'auth_token');
    await _storage.delete(key: 'user_id');
  }

  // فحص حالة تسجيل الدخول
  static Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'auth_token');
    return token != null;
  }

  // الحصول على التوكن
  static Future<String?> getToken() async {
    return await _storage.read(key: 'auth_token');
  }
}

// Models
class LoginResponse {
  final String token;
  final User user;

  LoginResponse({required this.token, required this.user});

  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      token: json['token'],
      user: User.fromJson(json['user']),
    );
  }
}

class RegisterResponse {
  final String message;
  final bool needsVerification;

  RegisterResponse({required this.message, required this.needsVerification});

  factory RegisterResponse.fromJson(Map<String, dynamic> json) {
    return RegisterResponse(
      message: json['message'],
      needsVerification: json['needsVerification'] ?? false,
    );
  }
}
```

### 2. User Model
```dart
// lib/models/user.dart
class User {
  final String id;
  final String email;
  final String? displayName;
  final String? job;
  final String role;
  final ProfileImage? profileImage;
  final bool isVerified;
  final NotificationSettings notificationSettings;

  User({
    required this.id,
    required this.email,
    this.displayName,
    this.job,
    required this.role,
    this.profileImage,
    required this.isVerified,
    required this.notificationSettings,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      email: json['email'],
      displayName: json['displayName'],
      job: json['job'],
      role: json['role'],
      profileImage: json['profileImage'] != null 
          ? ProfileImage.fromJson(json['profileImage']) 
          : null,
      isVerified: json['isVerified'] ?? false,
      notificationSettings: NotificationSettings.fromJson(
        json['notificationSettings'] ?? {},
      ),
    );
  }
}

class ProfileImage {
  final String url;
  final String id;

  ProfileImage({required this.url, required this.id});

  factory ProfileImage.fromJson(Map<String, dynamic> json) {
    return ProfileImage(
      url: json['url'],
      id: json['id'],
    );
  }
}

class NotificationSettings {
  final bool enablePush;
  final bool enableEmail;
  final bool muteChat;

  NotificationSettings({
    required this.enablePush,
    required this.enableEmail,
    required this.muteChat,
  });

  factory NotificationSettings.fromJson(Map<String, dynamic> json) {
    return NotificationSettings(
      enablePush: json['enablePush'] ?? true,
      enableEmail: json['enableEmail'] ?? true,
      muteChat: json['muteChat'] ?? false,
    );
  }
}
```

---

## 🎨 خدمات الأعمال الفنية

### 1. Artwork Service
```dart
// lib/services/artwork_service.dart
class ArtworkService {
  // جلب جميع الأعمال الفنية
  static Future<ApiResponse<ArtworkListResponse>> getArtworks({
    int page = 1,
    int limit = 20,
    String? category,
    String? artist,
    String? sort,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (category != null) queryParams['category'] = category;
      if (artist != null) queryParams['artist'] = artist;
      if (sort != null) queryParams['sort'] = sort;

      final response = await ApiClient.get('/artworks', queryParameters: queryParams);

      return ApiResponse<ArtworkListResponse>.fromJson(
        response.data,
        (data) => ArtworkListResponse.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<ArtworkListResponse>(
        success: false,
        message: 'حدث خطأ في جلب الأعمال الفنية',
      );
    }
  }

  // جلب تفاصيل عمل فني
  static Future<ApiResponse<Artwork>> getArtworkDetails(String artworkId) async {
    try {
      final response = await ApiClient.get('/artworks/$artworkId');

      return ApiResponse<Artwork>.fromJson(
        response.data,
        (data) => Artwork.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Artwork>(
        success: false,
        message: 'حدث خطأ في جلب تفاصيل العمل',
      );
    }
  }

  // إضافة عمل فني جديد
  static Future<ApiResponse<Artwork>> createArtwork(CreateArtworkRequest request) async {
    try {
      final response = await ApiClient.post('/artworks', data: request.toJson());

      return ApiResponse<Artwork>.fromJson(
        response.data,
        (data) => Artwork.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Artwork>(
        success: false,
        message: 'حدث خطأ في إضافة العمل الفني',
      );
    }
  }
}

// Models
class ArtworkListResponse {
  final List<Artwork> artworks;
  final int totalCount;

  ArtworkListResponse({required this.artworks, required this.totalCount});

  factory ArtworkListResponse.fromJson(Map<String, dynamic> json) {
    return ArtworkListResponse(
      artworks: (json['artworks'] as List)
          .map((artwork) => Artwork.fromJson(artwork))
          .toList(),
      totalCount: json['totalCount'] ?? 0,
    );
  }
}

class Artwork {
  final String id;
  final String title;
  final String description;
  final double price;
  final List<ArtworkImage> images;
  final Category category;
  final User artist;
  final bool isForSale;
  final List<String> tags;
  final DateTime createdAt;
  final double? rating;
  final int reviewCount;

  Artwork({
    required this.id,
    required this.title,
    required this.description,
    required this.price,
    required this.images,
    required this.category,
    required this.artist,
    required this.isForSale,
    required this.tags,
    required this.createdAt,
    this.rating,
    required this.reviewCount,
  });

  factory Artwork.fromJson(Map<String, dynamic> json) {
    return Artwork(
      id: json['_id'],
      title: json['title'],
      description: json['description'],
      price: json['price'].toDouble(),
      images: (json['images'] as List)
          .map((image) => ArtworkImage.fromJson(image))
          .toList(),
      category: Category.fromJson(json['category']),
      artist: User.fromJson(json['artist']),
      isForSale: json['isForSale'] ?? false,
      tags: List<String>.from(json['tags'] ?? []),
      createdAt: DateTime.parse(json['createdAt']),
      rating: json['rating']?.toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
    );
  }
}

class ArtworkImage {
  final String url;
  final String id;

  ArtworkImage({required this.url, required this.id});

  factory ArtworkImage.fromJson(Map<String, dynamic> json) {
    return ArtworkImage(
      url: json['url'],
      id: json['id'],
    );
  }
}

class CreateArtworkRequest {
  final String title;
  final String description;
  final double price;
  final String category;
  final List<String> images;
  final List<String> tags;
  final bool isForSale;

  CreateArtworkRequest({
    required this.title,
    required this.description,
    required this.price,
    required this.category,
    required this.images,
    required this.tags,
    required this.isForSale,
  });

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'price': price,
      'category': category,
      'images': images,
      'tags': tags,
      'isForSale': isForSale,
    };
  }
}
```

---

## 🖼️ خدمة رفع الصور

### Image Upload Service
```dart
// lib/services/image_service.dart
import 'dart:io';
import 'package:dio/dio.dart';

class ImageService {
  static Future<ApiResponse<ImageUploadResponse>> uploadImages(List<File> images) async {
    try {
      final formData = FormData();
      
      for (int i = 0; i < images.length; i++) {
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(
              images[i].path,
              filename: 'image_$i.jpg',
            ),
          ),
        );
      }

      final response = await ApiClient.post('/image/upload', data: formData);

      return ApiResponse<ImageUploadResponse>.fromJson(
        response.data,
        (data) => ImageUploadResponse.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<ImageUploadResponse>(
        success: false,
        message: 'حدث خطأ في رفع الصور',
      );
    }
  }
}

class ImageUploadResponse {
  final List<UploadedImage> images;

  ImageUploadResponse({required this.images});

  factory ImageUploadResponse.fromJson(Map<String, dynamic> json) {
    return ImageUploadResponse(
      images: (json['images'] as List)
          .map((image) => UploadedImage.fromJson(image))
          .toList(),
    );
  }
}

class UploadedImage {
  final String id;
  final String url;

  UploadedImage({required this.id, required this.url});

  factory UploadedImage.fromJson(Map<String, dynamic> json) {
    return UploadedImage(
      id: json['id'],
      url: json['url'],
    );
  }
}
```

---

## 💬 خدمة المحادثة

### Chat Service
```dart
// lib/services/chat_service.dart
class ChatService {
  // جلب قائمة المحادثات
  static Future<ApiResponse<List<Chat>>> getChats() async {
    try {
      final response = await ApiClient.get('/chat');

      return ApiResponse<List<Chat>>.fromJson(
        response.data,
        (data) => (data as List).map((chat) => Chat.fromJson(chat)).toList(),
      );
    } catch (e) {
      return ApiResponse<List<Chat>>(
        success: false,
        message: 'حدث خطأ في جلب المحادثات',
      );
    }
  }

  // جلب رسائل المحادثة
  static Future<ApiResponse<MessageListResponse>> getMessages(String chatId, {int page = 1}) async {
    try {
      final response = await ApiClient.get('/chat/$chatId/messages', queryParameters: {
        'page': page,
        'limit': 50,
      });

      return ApiResponse<MessageListResponse>.fromJson(
        response.data,
        (data) => MessageListResponse.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<MessageListResponse>(
        success: false,
        message: 'حدث خطأ في جلب الرسائل',
      );
    }
  }

  // إرسال رسالة
  static Future<ApiResponse<Message>> sendMessage(String chatId, String content, {String type = 'text'}) async {
    try {
      final response = await ApiClient.post('/chat/$chatId/send', data: {
        'content': content,
        'type': type,
      });

      return ApiResponse<Message>.fromJson(
        response.data,
        (data) => Message.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<Message>(
        success: false,
        message: 'حدث خطأ في إرسال الرسالة',
      );
    }
  }

  // تعليم الرسائل كمقروءة
  static Future<ApiResponse<void>> markAsRead(String chatId) async {
    try {
      final response = await ApiClient.patch('/chat/$chatId/read');

      return ApiResponse<void>.fromJson(response.data, null);
    } catch (e) {
      return ApiResponse<void>(
        success: false,
        message: 'حدث خطأ في تعليم الرسائل كمقروءة',
      );
    }
  }
}

// Models
class Chat {
  final String id;
  final List<User> participants;
  final Message? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  Chat({
    required this.id,
    required this.participants,
    this.lastMessage,
    required this.unreadCount,
    required this.updatedAt,
  });

  factory Chat.fromJson(Map<String, dynamic> json) {
    return Chat(
      id: json['_id'],
      participants: (json['participants'] as List)
          .map((participant) => User.fromJson(participant))
          .toList(),
      lastMessage: json['lastMessage'] != null 
          ? Message.fromJson(json['lastMessage']) 
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class Message {
  final String id;
  final String content;
  final String type;
  final User sender;
  final DateTime createdAt;
  final bool isRead;

  Message({
    required this.id,
    required this.content,
    required this.type,
    required this.sender,
    required this.createdAt,
    required this.isRead,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'],
      content: json['content'],
      type: json['type'],
      sender: User.fromJson(json['sender']),
      createdAt: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
    );
  }
}

class MessageListResponse {
  final List<Message> messages;
  final int totalCount;

  MessageListResponse({required this.messages, required this.totalCount});

  factory MessageListResponse.fromJson(Map<String, dynamic> json) {
    return MessageListResponse(
      messages: (json['messages'] as List)
          .map((message) => Message.fromJson(message))
          .toList(),
      totalCount: json['totalCount'] ?? 0,
    );
  }
}
```

---

## 🔔 خدمة الإشعارات

### Notification Service
```dart
// lib/services/notification_service.dart
class NotificationService {
  // جلب الإشعارات
  static Future<ApiResponse<NotificationListResponse>> getNotifications({int page = 1}) async {
    try {
      final response = await ApiClient.get('/notifications', queryParameters: {
        'page': page,
        'limit': 20,
      });

      return ApiResponse<NotificationListResponse>.fromJson(
        response.data,
        (data) => NotificationListResponse.fromJson(data),
      );
    } catch (e) {
      return ApiResponse<NotificationListResponse>(
        success: false,
        message: 'حدث خطأ في جلب الإشعارات',
      );
    }
  }

  // تعليم إشعار كمقروء
  static Future<ApiResponse<void>> markAsRead(String notificationId) async {
    try {
      final response = await ApiClient.patch('/notifications/$notificationId/read');

      return ApiResponse<void>.fromJson(response.data, null);
    } catch (e) {
      return ApiResponse<void>(
        success: false,
        message: 'حدث خطأ في تعليم الإشعار كمقروء',
      );
    }
  }

  // حذف إشعار
  static Future<ApiResponse<void>> deleteNotification(String notificationId) async {
    try {
      final response = await ApiClient.delete('/notifications/$notificationId');

      return ApiResponse<void>.fromJson(response.data, null);
    } catch (e) {
      return ApiResponse<void>(
        success: false,
        message: 'حدث خطأ في حذف الإشعار',
      );
    }
  }
}

// Models
class NotificationListResponse {
  final List<AppNotification> notifications;
  final int unreadCount;

  NotificationListResponse({required this.notifications, required this.unreadCount});

  factory NotificationListResponse.fromJson(Map<String, dynamic> json) {
    return NotificationListResponse(
      notifications: (json['notifications'] as List)
          .map((notification) => AppNotification.fromJson(notification))
          .toList(),
      unreadCount: json['unreadCount'] ?? 0,
    );
  }
}

class AppNotification {
  final String id;
  final String type;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;
  final Map<String, dynamic>? data;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['_id'],
      type: json['type'],
      title: json['title'],
      message: json['message'],
      isRead: json['isRead'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
      data: json['data'],
    );
  }
}
```

---

## 📱 أمثلة Widget

### 1. Login Screen
```dart
// lib/screens/auth/login_screen.dart
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    final result = await AuthService.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    setState(() => _isLoading = false);

    if (result.success) {
      Navigator.pushReplacementNamed(context, '/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result.message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('تسجيل الدخول')),
      body: Form(
        key: _formKey,
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Column(
            children: [
              TextFormField(
                controller: _emailController,
                decoration: InputDecoration(labelText: 'البريد الإلكتروني'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'يرجى إدخال البريد الإلكتروني';
                  }
                  return null;
                },
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: _passwordController,
                decoration: InputDecoration(labelText: 'كلمة المرور'),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'يرجى إدخال كلمة المرور';
                  }
                  return null;
                },
              ),
              SizedBox(height: 24),
              ElevatedButton(
                onPressed: _isLoading ? null : _login,
                child: _isLoading 
                    ? CircularProgressIndicator()
                    : Text('تسجيل الدخول'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
```

### 2. Artwork List Screen
```dart
// lib/screens/artwork/artwork_list_screen.dart
class ArtworkListScreen extends StatefulWidget {
  @override
  _ArtworkListScreenState createState() => _ArtworkListScreenState();
}

class _ArtworkListScreenState extends State<ArtworkListScreen> {
  List<Artwork> artworks = [];
  bool isLoading = false;
  bool hasMore = true;
  int currentPage = 1;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadArtworks();
    _scrollController.addListener(_onScroll);
  }

  Future<void> _loadArtworks({bool refresh = false}) async {
    if (isLoading) return;

    setState(() => isLoading = true);

    if (refresh) {
      currentPage = 1;
      artworks.clear();
    }

    final result = await ArtworkService.getArtworks(page: currentPage);

    setState(() => isLoading = false);

    if (result.success && result.data != null) {
      setState(() {
        artworks.addAll(result.data!.artworks);
        hasMore = result.data!.artworks.length == 20;
        currentPage++;
      });
    }
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      if (hasMore && !isLoading) {
        _loadArtworks();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('الأعمال الفنية')),
      body: RefreshIndicator(
        onRefresh: () => _loadArtworks(refresh: true),
        child: GridView.builder(
          controller: _scrollController,
          padding: EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 0.8,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
          ),
          itemCount: artworks.length + (hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index >= artworks.length) {
              return Center(child: CircularProgressIndicator());
            }

            final artwork = artworks[index];
            return ArtworkCard(artwork: artwork);
          },
        ),
      ),
    );
  }
}

class ArtworkCard extends StatelessWidget {
  final Artwork artwork;

  const ArtworkCard({Key? key, required this.artwork}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: () {
          Navigator.pushNamed(
            context, 
            '/artwork-details',
            arguments: artwork.id,
          );
        },
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: Image.network(
                artwork.images.first.url,
                fit: BoxFit.cover,
                width: double.infinity,
              ),
            ),
            Padding(
              padding: EdgeInsets.all(8),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    artwork.title,
                    style: TextStyle(fontWeight: FontWeight.bold),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  SizedBox(height: 4),
                  Text(
                    '${artwork.price} ريال',
                    style: TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

---

## 🚀 WebSocket للمحادثة المباشرة

### Socket Service
```dart
// lib/services/socket_service.dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService {
  static IO.Socket? _socket;
  static String? _currentChatId;

  static Future<void> connect(String token) async {
    _socket = IO.io('https://your-domain.com', 
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .build()
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      print('Connected to socket');
    });

    _socket!.onDisconnect((_) {
      print('Disconnected from socket');
    });
  }

  static void joinChat(String chatId) {
    _currentChatId = chatId;
    _socket?.emit('join-chat', {'chatId': chatId});
  }

  static void sendMessage(String chatId, String content, String type) {
    _socket?.emit('send-message', {
      'chatId': chatId,
      'content': content,
      'type': type,
    });
  }

  static void onNewMessage(Function(Message) callback) {
    _socket?.on('new-message', (data) {
      final message = Message.fromJson(data);
      callback(message);
    });
  }

  static void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
```

---

## 📦 إعداد pubspec.yaml

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # HTTP Client
  dio: ^5.3.2
  
  # Secure Storage
  flutter_secure_storage: ^9.0.0
  
  # Socket.IO
  socket_io_client: ^2.0.3+1
  
  # Image Picker
  image_picker: ^1.0.4
  
  # State Management
  provider: ^6.0.5
  
  # UI Components
  cached_network_image: ^3.3.0
  
  # Utilities
  intl: ^0.18.1
```

هذا الملف يوفر أمثلة عملية شاملة لمطور Flutter للربط مع جميع APIs في النظام. يمكن استخدام هذه الأمثلة كنقطة انطلاق لبناء التطبيق. 