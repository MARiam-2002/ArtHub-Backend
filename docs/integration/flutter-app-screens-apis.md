# 📱 دليل صفحات التطبيق والـ APIs - ArtHub Flutter

## 🎯 نظرة عامة

هذا الدليل يوضح جميع صفحات التطبيق (عدا المصادقة) والـ APIs المطلوبة لكل صفحة.

---

## 🏠 الصفحة الرئيسية (Home Screen)

### APIs المطلوبة:

#### الحصول على بيانات الصفحة الرئيسية
```http
GET /api/home
Authorization: Bearer JWT_TOKEN (اختياري)
```

#### البحث العام
```http
GET /api/home/search?q=keyword&type=artworks&page=1&limit=20
```

#### الأعمال الشائعة
```http
GET /api/home/trending?page=1&limit=10
```

#### استكشاف المحتوى
```http
GET /api/home/explore
```

**مثال Flutter:**
```dart
class HomeService {
  Future<HomeData> getHomeData() async {
    final response = await ApiService.get('/home');
    return HomeData.fromJson(response.data);
  }
  
  Future<List<Artwork>> searchArtworks(String query, {int page = 1}) async {
    final response = await ApiService.get('/home/search', 
      queryParameters: {'q': query, 'type': 'artworks', 'page': page});
    return (response.data['artworks'] as List)
        .map((item) => Artwork.fromJson(item))
        .toList();
  }
}
```

---

## 🎨 صفحات الأعمال الفنية

### 1️⃣ قائمة الأعمال الفنية
```http
GET /api/artworks?page=1&limit=20&category=categoryId&sort=newest
```

### 2️⃣ تفاصيل العمل الفني
```http
GET /api/artworks/:artworkId
```

### 3️⃣ إضافة عمل فني جديد (للفنانين)
```http
POST /api/artworks
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

{
  "title": "عنوان العمل",
  "description": "وصف العمل",
  "price": 500,
  "category": "categoryId",
  "tags": ["فن", "رسم"],
  "images": [File1, File2, File3]
}
```

### 4️⃣ تحديث العمل الفني
```http
PUT /api/artworks/:artworkId
Authorization: Bearer JWT_TOKEN
```

### 5️⃣ حذف العمل الفني
```http
DELETE /api/artworks/:artworkId
Authorization: Bearer JWT_TOKEN
```

**مثال Flutter:**
```dart
class ArtworkService {
  Future<List<Artwork>> getArtworks({int page = 1, String? category}) async {
    final response = await ApiService.get('/artworks', 
      queryParameters: {'page': page, 'limit': 20, 'category': category});
    return (response.data['artworks'] as List)
        .map((item) => Artwork.fromJson(item))
        .toList();
  }
  
  Future<Artwork> getArtworkDetails(String artworkId) async {
    final response = await ApiService.get('/artworks/$artworkId');
    return Artwork.fromJson(response.data);
  }
  
  Future<bool> createArtwork(CreateArtworkRequest request) async {
    final formData = FormData.fromMap({
      'title': request.title,
      'description': request.description,
      'price': request.price,
      'category': request.category,
      'tags': request.tags.join(','),
      'images': request.images.map((file) => 
        MultipartFile.fromFileSync(file.path)).toList(),
    });
    
    final response = await ApiService.post('/artworks', formData);
    return response.success;
  }
}
```

---

## 👤 صفحات الملف الشخصي

### 1️⃣ عرض الملف الشخصي
```http
GET /api/user/profile
Authorization: Bearer JWT_TOKEN
```

### 2️⃣ عرض ملف شخصي لمستخدم آخر
```http
GET /api/user/artist/:artistId
```

### 3️⃣ تحديث الملف الشخصي
```http
PUT /api/user/profile
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "displayName": "الاسم الجديد",
  "job": "الوظيفة الجديدة",
  "bio": "نبذة عن المستخدم"
}
```

### 4️⃣ تحديث صورة الملف الشخصي
```http
PUT /api/user/profile
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

{
  "profileImage": File
}
```

### 5️⃣ الحصول على أعمال المستخدم
```http
GET /api/user/my-artworks?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

### 6️⃣ المفضلة
```http
GET /api/user/wishlist?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

### 7️⃣ إضافة/إزالة من المفضلة
```http
POST /api/user/wishlist/toggle
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "artworkId": "artworkId"
}
```

**مثال Flutter:**
```dart
class UserService {
  Future<UserProfile> getProfile() async {
    final response = await ApiService.get('/user/profile');
    return UserProfile.fromJson(response.data);
  }
  
  Future<bool> updateProfile(UpdateProfileRequest request) async {
    final response = await ApiService.put('/user/profile', request.toJson());
    return response.success;
  }
  
  Future<bool> toggleWishlist(String artworkId) async {
    final response = await ApiService.post('/user/wishlist/toggle', 
      {'artworkId': artworkId});
    return response.success;
  }
}
```

---

## 💬 صفحات المحادثة

### 1️⃣ قائمة المحادثات
```http
GET /api/chat
Authorization: Bearer JWT_TOKEN
```

### 2️⃣ إنشاء محادثة جديدة
```http
POST /api/chat/create
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "participantId": "userId"
}
```

### 3️⃣ الحصول على رسائل المحادثة
```http
GET /api/chat/:chatId/messages?page=1&limit=50
Authorization: Bearer JWT_TOKEN
```

### 4️⃣ إرسال رسالة
```http
POST /api/chat/:chatId/send
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "message": "نص الرسالة",
  "type": "text"
}
```

### 5️⃣ إرسال صورة
```http
POST /api/chat/:chatId/send
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

{
  "image": File,
  "type": "image"
}
```

### 6️⃣ تعليم الرسائل كمقروءة
```http
PATCH /api/chat/:chatId/read
Authorization: Bearer JWT_TOKEN
```

### 7️⃣ حذف المحادثة
```http
DELETE /api/chat/:chatId
Authorization: Bearer JWT_TOKEN
```

### 8️⃣ الحصول على رمز Socket
```http
GET /api/chat/socket-token
Authorization: Bearer JWT_TOKEN
```

**مثال Flutter مع Socket.IO:**
```dart
class ChatService {
  IO.Socket? _socket;
  
  Future<void> connectSocket() async {
    final response = await ApiService.get('/chat/socket-token');
    final token = response.data['socketToken'];
    
    _socket = IO.io('https://your-domain.com', 
      IO.OptionBuilder()
        .setTransports(['websocket'])
        .setAuth({'token': token})
        .build());
    
    _socket?.connect();
    
    _socket?.on('newMessage', (data) {
      // معالجة الرسالة الجديدة
      final message = ChatMessage.fromJson(data);
      _onNewMessage(message);
    });
  }
  
  Future<List<Chat>> getChats() async {
    final response = await ApiService.get('/chat');
    return (response.data['chats'] as List)
        .map((item) => Chat.fromJson(item))
        .toList();
  }
  
  Future<bool> sendMessage(String chatId, String message) async {
    final response = await ApiService.post('/chat/$chatId/send', {
      'message': message,
      'type': 'text'
    });
    return response.success;
  }
}
```

---

## 🔔 صفحة الإشعارات

### 1️⃣ قائمة الإشعارات
```http
GET /api/notifications?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

### 2️⃣ عدد الإشعارات غير المقروءة
```http
GET /api/notifications/unread-count
Authorization: Bearer JWT_TOKEN
```

### 3️⃣ تعليم إشعار كمقروء
```http
PATCH /api/notifications/:notificationId/read
Authorization: Bearer JWT_TOKEN
```

### 4️⃣ تعليم جميع الإشعارات كمقروءة
```http
PATCH /api/notifications/read-all
Authorization: Bearer JWT_TOKEN
```

### 5️⃣ حذف إشعار
```http
DELETE /api/notifications/:notificationId
Authorization: Bearer JWT_TOKEN
```

### 6️⃣ حذف جميع الإشعارات
```http
DELETE /api/notifications
Authorization: Bearer JWT_TOKEN
```

### 7️⃣ إعدادات الإشعارات
```http
GET /api/notifications/settings
Authorization: Bearer JWT_TOKEN
```

### 8️⃣ تحديث إعدادات الإشعارات
```http
PUT /api/notifications/settings
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "enablePush": true,
  "enableEmail": false,
  "muteChat": false
}
```

---

## 👥 صفحات المتابعة

### 1️⃣ متابعة/إلغاء متابعة مستخدم
```http
POST /api/follow/toggle
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "userId": "targetUserId"
}
```

### 2️⃣ قائمة المتابعين
```http
GET /api/follow/followers/:userId?page=1&limit=20
```

### 3️⃣ قائمة المتابعين (الذين أتابعهم)
```http
GET /api/user/following?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

---

## 🛒 صفحات المعاملات

### 1️⃣ إنشاء معاملة شراء
```http
POST /api/transactions
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "artworkId": "artworkId",
  "shippingAddress": {
    "street": "الشارع",
    "city": "المدينة",
    "country": "البلد",
    "postalCode": "12345"
  },
  "paymentMethod": "card"
}
```

### 2️⃣ قائمة المعاملات
```http
GET /api/transactions?page=1&limit=20&status=pending
Authorization: Bearer JWT_TOKEN
```

### 3️⃣ تفاصيل المعاملة
```http
GET /api/transactions/:transactionId
Authorization: Bearer JWT_TOKEN
```

### 4️⃣ تحديث حالة المعاملة (للفنان)
```http
PATCH /api/transactions/:transactionId/status
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "status": "shipped",
  "trackingNumber": "TRK123456"
}
```

---

## 🎯 صفحات الطلبات المخصصة

### 1️⃣ إنشاء طلب مخصص
```http
POST /api/special-requests
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

{
  "title": "عنوان الطلب",
  "description": "وصف تفصيلي",
  "budget": 1000,
  "deadline": "2024-12-31",
  "category": "categoryId",
  "referenceImages": [File1, File2]
}
```

### 2️⃣ قائمة طلباتي
```http
GET /api/special-requests/my?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

### 3️⃣ قائمة الطلبات للفنانين
```http
GET /api/special-requests/artist?page=1&limit=20&status=open
Authorization: Bearer JWT_TOKEN
```

### 4️⃣ تفاصيل الطلب
```http
GET /api/special-requests/:requestId
Authorization: Bearer JWT_TOKEN
```

### 5️⃣ تقديم عرض على الطلب
```http
POST /api/special-requests/:requestId/response
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "message": "أستطيع تنفيذ هذا الطلب",
  "proposedPrice": 800,
  "estimatedDays": 14
}
```

### 6️⃣ قبول عرض
```http
PATCH /api/special-requests/:requestId/accept
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "responseId": "responseId"
}
```

---

## ⭐ صفحات التقييمات

### 1️⃣ تقييم عمل فني
```http
POST /api/reviews/artwork
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "artworkId": "artworkId",
  "rating": 5,
  "comment": "عمل رائع جداً"
}
```

### 2️⃣ تقييم فنان
```http
POST /api/reviews/artist
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "artistId": "artistId",
  "rating": 4,
  "comment": "فنان محترف"
}
```

### 3️⃣ الحصول على تقييمات العمل
```http
GET /api/reviews/artwork/:artworkId?page=1&limit=20
```

### 4️⃣ الحصول على تقييمات الفنان
```http
GET /api/reviews/artist/:artistId?page=1&limit=20
```

### 5️⃣ تقييماتي
```http
GET /api/reviews/my?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

---

## 📊 صفحات التقارير

### 1️⃣ إبلاغ عن محتوى
```http
POST /api/reports
Authorization: Bearer JWT_TOKEN
Content-Type: application/json

{
  "contentType": "artwork",
  "contentId": "artworkId",
  "reason": "inappropriate_content",
  "description": "وصف المشكلة"
}
```

### 2️⃣ تقاريري
```http
GET /api/reports/my?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

---

## 🏷️ صفحات الفئات

### 1️⃣ قائمة الفئات
```http
GET /api/categories
```

### 2️⃣ أعمال الفئة
```http
GET /api/artworks?category=categoryId&page=1&limit=20
```

---

## 🖼️ صفحات الصور

### 1️⃣ رفع صورة
```http
POST /api/image/upload
Authorization: Bearer JWT_TOKEN
Content-Type: multipart/form-data

{
  "images": [File1, File2, File3],
  "purpose": "artwork"
}
```

### 2️⃣ صوري
```http
GET /api/image/my-images?page=1&limit=20
Authorization: Bearer JWT_TOKEN
```

### 3️⃣ حذف صورة
```http
DELETE /api/image/:imageId
Authorization: Bearer JWT_TOKEN
```

---

## 📱 نموذج تطبيق Flutter كامل

```dart
class ArtHubApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => HomeProvider()),
        ChangeNotifierProvider(create: (_) => ChatProvider()),
        ChangeNotifierProvider(create: (_) => NotificationProvider()),
      ],
      child: MaterialApp(
        title: 'ArtHub',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          fontFamily: 'Cairo',
        ),
        home: Consumer<AuthProvider>(
          builder: (context, auth, child) {
            if (auth.isLoading) {
              return SplashScreen();
            }
            
            return auth.isAuthenticated 
                ? MainScreen() 
                : LoginScreen();
          },
        ),
        routes: {
          '/login': (context) => LoginScreen(),
          '/register': (context) => RegisterScreen(),
          '/home': (context) => HomeScreen(),
          '/profile': (context) => ProfileScreen(),
          '/chat': (context) => ChatListScreen(),
          '/notifications': (context) => NotificationsScreen(),
          '/artworks': (context) => ArtworkListScreen(),
          '/create-artwork': (context) => CreateArtworkScreen(),
        },
      ),
    );
  }
}

class MainScreen extends StatefulWidget {
  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  
  final List<Widget> _screens = [
    HomeScreen(),
    ArtworkListScreen(),
    ChatListScreen(),
    NotificationsScreen(),
    ProfileScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: [
          BottomNavigationBarItem(
            icon: Icon(Icons.home),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.palette),
            label: 'الأعمال',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat),
            label: 'المحادثات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.notifications),
            label: 'الإشعارات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person),
            label: 'الملف الشخصي',
          ),
        ],
      ),
    );
  }
}
```

---

## 🔧 نصائح التطوير

### 1. إدارة الحالة
```dart
// استخدم Provider للحالة العامة
class HomeProvider extends ChangeNotifier {
  List<Artwork> _artworks = [];
  bool _isLoading = false;
  
  List<Artwork> get artworks => _artworks;
  bool get isLoading => _isLoading;
  
  Future<void> loadArtworks() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      _artworks = await ArtworkService.getArtworks();
    } catch (e) {
      // معالجة الخطأ
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
```

### 2. معالجة الأخطاء
```dart
class ErrorHandler {
  static void handleError(BuildContext context, dynamic error) {
    String message = 'حدث خطأ غير متوقع';
    
    if (error is DioError) {
      switch (error.response?.statusCode) {
        case 401:
          message = 'يجب تسجيل الدخول أولاً';
          // إعادة توجيه لشاشة تسجيل الدخول
          break;
        case 403:
          message = 'ليس لديك صلاحية للوصول';
          break;
        case 404:
          message = 'المورد غير موجود';
          break;
        default:
          message = error.response?.data['message'] ?? message;
      }
    }
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message)),
    );
  }
}
```

### 3. تحسين الأداء
```dart
// استخدم pagination للقوائم الطويلة
class ArtworkListScreen extends StatefulWidget {
  @override
  _ArtworkListScreenState createState() => _ArtworkListScreenState();
}

class _ArtworkListScreenState extends State<ArtworkListScreen> {
  final ScrollController _scrollController = ScrollController();
  List<Artwork> _artworks = [];
  int _currentPage = 1;
  bool _isLoading = false;
  bool _hasMore = true;

  @override
  void initState() {
    super.initState();
    _loadArtworks();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= 
        _scrollController.position.maxScrollExtent - 200) {
      _loadMore();
    }
  }

  Future<void> _loadMore() async {
    if (_isLoading || !_hasMore) return;
    
    setState(() => _isLoading = true);
    
    try {
      final newArtworks = await ArtworkService.getArtworks(
        page: _currentPage + 1
      );
      
      if (newArtworks.isEmpty) {
        _hasMore = false;
      } else {
        _artworks.addAll(newArtworks);
        _currentPage++;
      }
    } catch (e) {
      ErrorHandler.handleError(context, e);
    } finally {
      setState(() => _isLoading = false);
    }
  }
}
```

هذا الدليل يوفر كل ما يحتاجه مطور Flutter للتكامل مع جميع وظائف ArtHub Backend بشكل شامل ومفصل. 