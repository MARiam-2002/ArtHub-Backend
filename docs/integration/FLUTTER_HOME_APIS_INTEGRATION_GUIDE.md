# دليل تكامل Flutter مع APIs الصفحة الرئيسية لتطبيق ArtHub

## 📋 نظرة عامة

هذا الدليل يوضح كيفية تكامل تطبيق Flutter مع الـ APIs المحسنة للصفحة الرئيسية في ArtHub Backend. تم تحسين دورة الصور لتكون متوافقة مع احتياجات Flutter مع معالجة شاملة للصور وإدارة الحالات.

## 🔄 دورة الصور المحسنة

### هيكل الصور في النظام:

```json
{
  "artwork": {
    "mainImage": "https://cloudinary.com/main-image.jpg",
    "images": ["https://cloudinary.com/image1.jpg", "https://cloudinary.com/image2.jpg"],
    "allImages": ["https://cloudinary.com/main-image.jpg", "https://cloudinary.com/image1.jpg"]
  },
  "artist": {
    "profileImage": "https://cloudinary.com/profile.jpg",
    "coverImages": ["https://cloudinary.com/cover1.jpg", "https://cloudinary.com/cover2.jpg"]
  },
  "category": {
    "image": "https://cloudinary.com/category.jpg"
  }
}
```

### مميزات دورة الصور:
- ✅ **معالجة موحدة للصور** مع fallback آمن
- ✅ **صور متعددة الأحجام** للعرض المرن
- ✅ **تحسين الأداء** مع lazy loading
- ✅ **إدارة الأخطاء** مع صور احتياطية
- ✅ **تحسين الشبكة** مع تقليل حجم البيانات

## 🔗 APIs المتاحة

### 1. بيانات الصفحة الرئيسية
**GET** `/home`

```dart
// مثال على الاستخدام في Flutter
Future<HomeData> getHomeData() async {
  final response = await http.get(
    Uri.parse('$baseUrl/home'),
    headers: {
      'Authorization': 'Bearer $authToken', // اختياري
      'Content-Type': 'application/json',
    },
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return HomeData.fromJson(data['data']);
  }
  throw Exception('Failed to load home data');
}
```

**Response Structure:**
```json
{
  "success": true,
  "message": "تم جلب بيانات الصفحة الرئيسية بنجاح",
  "data": {
    "categories": [
      {
        "_id": "category_id",
        "name": "فن تشكيلي",
        "image": "https://cloudinary.com/category.jpg",
        "artworksCount": 25
      }
    ],
    "featuredArtists": [
      {
        "_id": "artist_id",
        "displayName": "محمد فوزي",
        "profileImage": "https://cloudinary.com/profile.jpg",
        "coverImages": ["https://cloudinary.com/cover1.jpg"],
        "job": "رسام",
        "rating": 4.5,
        "reviewsCount": 120,
        "followersCount": 500,
        "artworksCount": 30,
        "isVerified": true
      }
    ],
    "featuredArtworks": [
      {
        "_id": "artwork_id",
        "title": "لوحة فنية جميلة",
        "description": "وصف اللوحة",
        "mainImage": "https://cloudinary.com/main.jpg",
        "images": ["https://cloudinary.com/img1.jpg"],
        "allImages": ["https://cloudinary.com/main.jpg", "https://cloudinary.com/img1.jpg"],
        "price": 500,
        "currency": "SAR",
        "dimensions": {"width": 60, "height": 80, "unit": "cm"},
        "medium": "زيت على قماش",
        "year": 2023,
        "tags": ["طبيعة", "مناظر"],
        "artist": {
          "_id": "artist_id",
          "displayName": "محمد فوزي",
          "profileImage": "https://cloudinary.com/profile.jpg",
          "job": "رسام",
          "isVerified": true
        },
        "category": {
          "_id": "category_id",
          "name": "فن تشكيلي",
          "image": "https://cloudinary.com/category.jpg"
        },
        "stats": {
          "likeCount": 150,
          "viewCount": 1200,
          "rating": 4.7,
          "reviewsCount": 25
        },
        "availability": {
          "isAvailable": true,
          "isFeatured": true
        },
        "dates": {
          "createdAt": "2023-12-01T10:00:00Z",
          "updatedAt": "2023-12-01T10:00:00Z"
        }
      }
    ],
    "trendingArtworks": [],
    "personalizedArtworks": []
  },
  "meta": {
    "timestamp": "2023-12-01T10:00:00Z",
    "userId": "user_id_or_null",
    "isAuthenticated": true
  }
}
```

### 2. البحث المتقدم
**GET** `/home/search`

```dart
Future<SearchResults> searchContent({
  required String query,
  String type = 'all', // all, artworks, artists
  String sortBy = 'relevance', // relevance, price_low, price_high, rating, newest, popular
  int page = 1,
  int limit = 20,
}) async {
  final uri = Uri.parse('$baseUrl/home/search').replace(
    queryParameters: {
      'q': query,
      'type': type,
      'sortBy': sortBy,
      'page': page.toString(),
      'limit': limit.toString(),
    },
  );
  
  final response = await http.get(uri);
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return SearchResults.fromJson(data['data']);
  }
  throw Exception('Search failed');
}
```

### 3. تفاصيل العمل الفني
**GET** `/home/artwork/:id`

```dart
Future<ArtworkDetails> getArtworkDetails(String artworkId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/home/artwork/$artworkId'),
    headers: {
      'Authorization': 'Bearer $authToken', // اختياري
    },
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return ArtworkDetails.fromJson(data['data']);
  }
  throw Exception('Failed to load artwork details');
}
```

### 4. ملف الفنان
**GET** `/home/artist/:id`

```dart
Future<ArtistProfile> getArtistProfile(String artistId, {int page = 1}) async {
  final uri = Uri.parse('$baseUrl/home/artist/$artistId').replace(
    queryParameters: {
      'page': page.toString(),
      'limit': '20',
    },
  );
  
  final response = await http.get(
    uri,
    headers: {
      'Authorization': 'Bearer $authToken', // اختياري
    },
  );
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return ArtistProfile.fromJson(data['data']);
  }
  throw Exception('Failed to load artist profile');
}
```

### 5. أعمال التصنيف
**GET** `/home/category/:id`

```dart
Future<CategoryArtworks> getCategoryArtworks(
  String categoryId, {
  String sortBy = 'newest',
  int page = 1,
}) async {
  final uri = Uri.parse('$baseUrl/home/category/$categoryId').replace(
    queryParameters: {
      'sortBy': sortBy,
      'page': page.toString(),
      'limit': '20',
    },
  );
  
  final response = await http.get(uri);
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return CategoryArtworks.fromJson(data['data']);
  }
  throw Exception('Failed to load category artworks');
}
```

### 6. الأعمال الرائجة
**GET** `/home/trending`

```dart
Future<TrendingArtworks> getTrendingArtworks({int page = 1}) async {
  final uri = Uri.parse('$baseUrl/home/trending').replace(
    queryParameters: {
      'page': page.toString(),
      'limit': '20',
    },
  );
  
  final response = await http.get(uri);
  
  if (response.statusCode == 200) {
    final data = json.decode(response.body);
    return TrendingArtworks.fromJson(data['data']);
  }
  throw Exception('Failed to load trending artworks');
}
```

## 🏗️ نماذج البيانات في Flutter

### 1. نموذج العمل الفني
```dart
class Artwork {
  final String id;
  final String title;
  final String description;
  final String mainImage;
  final List<String> images;
  final List<String> allImages;
  final double price;
  final String currency;
  final Map<String, dynamic>? dimensions;
  final String? medium;
  final int? year;
  final List<String> tags;
  final Artist artist;
  final Category category;
  final ArtworkStats stats;
  final ArtworkAvailability availability;
  final ArtworkDates dates;
  final bool? isLiked; // متوفر في تفاصيل العمل الفني فقط

  Artwork({
    required this.id,
    required this.title,
    required this.description,
    required this.mainImage,
    required this.images,
    required this.allImages,
    required this.price,
    required this.currency,
    this.dimensions,
    this.medium,
    this.year,
    required this.tags,
    required this.artist,
    required this.category,
    required this.stats,
    required this.availability,
    required this.dates,
    this.isLiked,
  });

  factory Artwork.fromJson(Map<String, dynamic> json) {
    return Artwork(
      id: json['_id'],
      title: json['title'],
      description: json['description'] ?? '',
      mainImage: json['mainImage'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      allImages: List<String>.from(json['allImages'] ?? []),
      price: (json['price'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'SAR',
      dimensions: json['dimensions'],
      medium: json['medium'],
      year: json['year'],
      tags: List<String>.from(json['tags'] ?? []),
      artist: Artist.fromJson(json['artist']),
      category: Category.fromJson(json['category']),
      stats: ArtworkStats.fromJson(json['stats']),
      availability: ArtworkAvailability.fromJson(json['availability']),
      dates: ArtworkDates.fromJson(json['dates']),
      isLiked: json['isLiked'],
    );
  }
}

class ArtworkStats {
  final int likeCount;
  final int viewCount;
  final double rating;
  final int reviewsCount;

  ArtworkStats({
    required this.likeCount,
    required this.viewCount,
    required this.rating,
    required this.reviewsCount,
  });

  factory ArtworkStats.fromJson(Map<String, dynamic> json) {
    return ArtworkStats(
      likeCount: json['likeCount'] ?? 0,
      viewCount: json['viewCount'] ?? 0,
      rating: (json['rating'] ?? 0).toDouble(),
      reviewsCount: json['reviewsCount'] ?? 0,
    );
  }
}

class ArtworkAvailability {
  final bool isAvailable;
  final bool isFeatured;

  ArtworkAvailability({
    required this.isAvailable,
    required this.isFeatured,
  });

  factory ArtworkAvailability.fromJson(Map<String, dynamic> json) {
    return ArtworkAvailability(
      isAvailable: json['isAvailable'] ?? true,
      isFeatured: json['isFeatured'] ?? false,
    );
  }
}

class ArtworkDates {
  final DateTime createdAt;
  final DateTime updatedAt;

  ArtworkDates({
    required this.createdAt,
    required this.updatedAt,
  });

  factory ArtworkDates.fromJson(Map<String, dynamic> json) {
    return ArtworkDates(
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}
```

### 2. نموذج الفنان
```dart
class Artist {
  final String id;
  final String displayName;
  final String job;
  final String profileImage;
  final List<String> coverImages;
  final double rating;
  final int reviewsCount;
  final int followersCount;
  final int artworksCount;
  final bool isVerified;
  final bool? isFollowing; // متوفر في ملف الفنان فقط

  Artist({
    required this.id,
    required this.displayName,
    required this.job,
    required this.profileImage,
    required this.coverImages,
    required this.rating,
    required this.reviewsCount,
    required this.followersCount,
    required this.artworksCount,
    required this.isVerified,
    this.isFollowing,
  });

  factory Artist.fromJson(Map<String, dynamic> json) {
    return Artist(
      id: json['_id'],
      displayName: json['displayName'] ?? 'فنان غير معروف',
      job: json['job'] ?? 'فنان',
      profileImage: json['profileImage'] ?? '',
      coverImages: List<String>.from(json['coverImages'] ?? []),
      rating: (json['rating'] ?? 0).toDouble(),
      reviewsCount: json['reviewsCount'] ?? 0,
      followersCount: json['followersCount'] ?? 0,
      artworksCount: json['artworksCount'] ?? 0,
      isVerified: json['isVerified'] ?? false,
      isFollowing: json['isFollowing'],
    );
  }
}
```

### 3. نموذج التصنيف
```dart
class Category {
  final String id;
  final String name;
  final String description;
  final String image;
  final int artworksCount;

  Category({
    required this.id,
    required this.name,
    required this.description,
    required this.image,
    required this.artworksCount,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['_id'],
      name: json['name'] ?? 'تصنيف',
      description: json['description'] ?? '',
      image: json['image'] ?? '',
      artworksCount: json['artworksCount'] ?? 0,
    );
  }
}
```

## 🖼️ إدارة الصور في Flutter

### 1. عرض الصور مع Fallback
```dart
class NetworkImageWithFallback extends StatelessWidget {
  final String imageUrl;
  final String? fallbackUrl;
  final double? width;
  final double? height;
  final BoxFit fit;

  const NetworkImageWithFallback({
    Key? key,
    required this.imageUrl,
    this.fallbackUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Image.network(
      imageUrl,
      width: width,
      height: height,
      fit: fit,
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return Container(
          width: width,
          height: height,
          color: Colors.grey[300],
          child: const Center(
            child: CircularProgressIndicator(),
          ),
        );
      },
      errorBuilder: (context, error, stackTrace) {
        if (fallbackUrl != null && fallbackUrl!.isNotEmpty) {
          return Image.network(
            fallbackUrl!,
            width: width,
            height: height,
            fit: fit,
            errorBuilder: (context, error, stackTrace) {
              return _buildPlaceholder();
            },
          );
        }
        return _buildPlaceholder();
      },
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[300],
      child: const Icon(
        Icons.image_not_supported,
        size: 50,
        color: Colors.grey,
      ),
    );
  }
}
```

### 2. معرض الصور
```dart
class ImageGallery extends StatelessWidget {
  final List<String> images;
  final int initialIndex;

  const ImageGallery({
    Key? key,
    required this.images,
    this.initialIndex = 0,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return PageView.builder(
      controller: PageController(initialPage: initialIndex),
      itemCount: images.length,
      itemBuilder: (context, index) {
        return InteractiveViewer(
          child: NetworkImageWithFallback(
            imageUrl: images[index],
            fit: BoxFit.contain,
          ),
        );
      },
    );
  }
}
```

### 3. تحسين الأداء مع Cached Network Image
```dart
// أضف إلى pubspec.yaml
// cached_network_image: ^3.3.0

class OptimizedNetworkImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;

  const OptimizedNetworkImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => Container(
        width: width,
        height: height,
        color: Colors.grey[300],
        child: const Center(
          child: CircularProgressIndicator(),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        width: width,
        height: height,
        color: Colors.grey[300],
        child: const Icon(
          Icons.error,
          size: 50,
          color: Colors.red,
        ),
      ),
    );
  }
}
```

## 🔄 إدارة الحالة مع Provider

### 1. نموذج بيانات الصفحة الرئيسية
```dart
class HomeProvider extends ChangeNotifier {
  HomeData? _homeData;
  bool _isLoading = false;
  String? _error;

  HomeData? get homeData => _homeData;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadHomeData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.getHomeData();
      _homeData = data;
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshHomeData() async {
    await loadHomeData();
  }
}
```

### 2. استخدام Provider في الواجهة
```dart
class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<HomeProvider>(context, listen: false).loadHomeData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('ArtHub')),
      body: Consumer<HomeProvider>(
        builder: (context, homeProvider, child) {
          if (homeProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (homeProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('خطأ: ${homeProvider.error}'),
                  ElevatedButton(
                    onPressed: () => homeProvider.loadHomeData(),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            );
          }

          if (homeProvider.homeData == null) {
            return const Center(child: Text('لا توجد بيانات'));
          }

          return RefreshIndicator(
            onRefresh: () => homeProvider.refreshHomeData(),
            child: _buildHomeContent(homeProvider.homeData!),
          );
        },
      ),
    );
  }

  Widget _buildHomeContent(HomeData homeData) {
    return ListView(
      children: [
        _buildCategoriesSection(homeData.categories),
        _buildFeaturedArtistsSection(homeData.featuredArtists),
        _buildFeaturedArtworksSection(homeData.featuredArtworks),
        _buildTrendingArtworksSection(homeData.trendingArtworks),
        if (homeData.personalizedArtworks.isNotEmpty)
          _buildPersonalizedArtworksSection(homeData.personalizedArtworks),
      ],
    );
  }

  Widget _buildCategoriesSection(List<Category> categories) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'التصنيفات',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ),
        SizedBox(
          height: 120,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: categories.length,
            itemBuilder: (context, index) {
              final category = categories[index];
              return GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => CategoryScreen(category: category),
                  ),
                ),
                child: Container(
                  width: 100,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  child: Column(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: OptimizedNetworkImage(
                          imageUrl: category.image,
                          width: 80,
                          height: 80,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        category.name,
                        style: const TextStyle(fontSize: 12),
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildFeaturedArtworksSection(List<Artwork> artworks) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.all(16.0),
          child: Text(
            'أعمال مميزة',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
        ),
        SizedBox(
          height: 220,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: artworks.length,
            itemBuilder: (context, index) {
              final artwork = artworks[index];
              return GestureDetector(
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ArtworkDetailScreen(artworkId: artwork.id),
                  ),
                ),
                child: Container(
                  width: 160,
                  margin: const EdgeInsets.symmetric(horizontal: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: OptimizedNetworkImage(
                          imageUrl: artwork.mainImage,
                          width: 160,
                          height: 120,
                          fit: BoxFit.cover,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        artwork.title,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          CircleAvatar(
                            radius: 12,
                            backgroundImage: NetworkImage(artwork.artist.profileImage),
                          ),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              artwork.artist.displayName,
                              style: const TextStyle(fontSize: 12, color: Colors.grey),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${artwork.price.toStringAsFixed(0)} ${artwork.currency}',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.green,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
}
```

## 🛠️ نصائح التحسين والأداء

### 1. تحسين الشبكة
```dart
class ApiService {
  static const String baseUrl = 'https://your-api-url.com';
  static final http.Client _client = http.Client();

  // إعداد التخزين المؤقت
  static final Map<String, dynamic> _cache = {};
  static final Map<String, DateTime> _cacheTimestamps = {};
  
  static Future<T> _cachedRequest<T>(
    String key,
    Future<T> Function() request,
    {Duration cacheDuration = const Duration(minutes: 5)}
  ) async {
    final now = DateTime.now();
    
    if (_cache.containsKey(key) && _cacheTimestamps.containsKey(key)) {
      final cacheTime = _cacheTimestamps[key]!;
      if (now.difference(cacheTime) < cacheDuration) {
        return _cache[key] as T;
      }
    }
    
    final result = await request();
    _cache[key] = result;
    _cacheTimestamps[key] = now;
    
    return result;
  }

  static Future<HomeData> getHomeData() async {
    return await _cachedRequest(
      'home_data',
      () async {
        final response = await _client.get(
          Uri.parse('$baseUrl/home'),
          headers: {'Authorization': 'Bearer ${await getAuthToken()}'},
        );
        
        if (response.statusCode == 200) {
          final data = json.decode(response.body);
          return HomeData.fromJson(data['data']);
        }
        throw Exception('Failed to load home data');
      },
    );
  }
}
```

### 2. معالجة الأخطاء
```dart
class ApiException implements Exception {
  final String message;
  final int? statusCode;

  ApiException(this.message, {this.statusCode});

  @override
  String toString() => 'ApiException: $message';
}

class NetworkService {
  static Future<Map<String, dynamic>> handleResponse(http.Response response) async {
    switch (response.statusCode) {
      case 200:
        return json.decode(response.body);
      case 400:
        throw ApiException('طلب غير صالح', statusCode: 400);
      case 401:
        throw ApiException('غير مصرح', statusCode: 401);
      case 404:
        throw ApiException('غير موجود', statusCode: 404);
      case 500:
        throw ApiException('خطأ في الخادم', statusCode: 500);
      default:
        throw ApiException('خطأ غير متوقع', statusCode: response.statusCode);
    }
  }
}
```

### 3. تحسين الصور
```dart
class ImageOptimizer {
  static String optimizeImageUrl(String originalUrl, {int? width, int? height}) {
    if (originalUrl.isEmpty) return '';
    
    // إذا كانت الصورة من Cloudinary
    if (originalUrl.contains('cloudinary.com')) {
      final uri = Uri.parse(originalUrl);
      final pathSegments = uri.pathSegments.toList();
      
      if (pathSegments.length >= 3) {
        // إضافة معاملات التحسين
        final transformations = <String>[];
        
        if (width != null) transformations.add('w_$width');
        if (height != null) transformations.add('h_$height');
        transformations.add('c_fill'); // crop and fill
        transformations.add('f_auto'); // auto format
        transformations.add('q_auto'); // auto quality
        
        pathSegments.insert(2, transformations.join(','));
        
        return uri.replace(pathSegments: pathSegments).toString();
      }
    }
    
    return originalUrl;
  }
}

// الاستخدام
OptimizedNetworkImage(
  imageUrl: ImageOptimizer.optimizeImageUrl(
    artwork.mainImage,
    width: 300,
    height: 200,
  ),
  width: 160,
  height: 120,
)
```

## 🧪 اختبار الـ APIs

### 1. اختبار الوحدة للخدمات
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;

class MockClient extends Mock implements http.Client {}

void main() {
  group('ApiService Tests', () {
    late MockClient mockClient;
    
    setUp(() {
      mockClient = MockClient();
    });

    test('getHomeData returns HomeData on success', () async {
      // Arrange
      const responseBody = '''
      {
        "success": true,
        "data": {
          "categories": [],
          "featuredArtists": [],
          "featuredArtworks": []
        }
      }
      ''';
      
      when(mockClient.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => http.Response(responseBody, 200));

      // Act
      final result = await ApiService.getHomeData();

      // Assert
      expect(result, isA<HomeData>());
      expect(result.categories, isEmpty);
    });

    test('getHomeData throws exception on error', () async {
      // Arrange
      when(mockClient.get(any, headers: anyNamed('headers')))
          .thenAnswer((_) async => http.Response('Error', 500));

      // Act & Assert
      expect(() async => await ApiService.getHomeData(), throwsException);
    });
  });
}
```

## 📱 أمثلة كاملة للشاشات

### 1. شاشة تفاصيل العمل الفني
```dart
class ArtworkDetailScreen extends StatefulWidget {
  final String artworkId;

  const ArtworkDetailScreen({Key? key, required this.artworkId}) : super(key: key);

  @override
  _ArtworkDetailScreenState createState() => _ArtworkDetailScreenState();
}

class _ArtworkDetailScreenState extends State<ArtworkDetailScreen> {
  ArtworkDetails? artworkDetails;
  bool isLoading = true;
  String? error;

  @override
  void initState() {
    super.initState();
    _loadArtworkDetails();
  }

  Future<void> _loadArtworkDetails() async {
    try {
      setState(() {
        isLoading = true;
        error = null;
      });

      final details = await ApiService.getArtworkDetails(widget.artworkId);
      
      setState(() {
        artworkDetails = details;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        error = e.toString();
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل العمل الفني'),
        actions: [
          if (artworkDetails != null)
            IconButton(
              icon: Icon(
                artworkDetails!.artwork.isLiked == true
                    ? Icons.favorite
                    : Icons.favorite_border,
                color: artworkDetails!.artwork.isLiked == true 
                    ? Colors.red 
                    : null,
              ),
              onPressed: _toggleLike,
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('خطأ: $error'),
            ElevatedButton(
              onPressed: _loadArtworkDetails,
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      );
    }

    if (artworkDetails == null) {
      return const Center(child: Text('لا توجد بيانات'));
    }

    final artwork = artworkDetails!.artwork;
    
    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // معرض الصور
          SizedBox(
            height: 300,
            child: PageView.builder(
              itemCount: artwork.allImages.length,
              itemBuilder: (context, index) {
                return OptimizedNetworkImage(
                  imageUrl: artwork.allImages[index],
                  fit: BoxFit.cover,
                );
              },
            ),
          ),
          
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // العنوان والسعر
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        artwork.title,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    Text(
                      '${artwork.price.toStringAsFixed(0)} ${artwork.currency}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // معلومات الفنان
                Row(
                  children: [
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: NetworkImage(artwork.artist.profileImage),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                artwork.artist.displayName,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (artwork.artist.isVerified)
                                const Padding(
                                  padding: EdgeInsets.only(right: 4),
                                  child: Icon(
                                    Icons.verified,
                                    size: 16,
                                    color: Colors.blue,
                                  ),
                                ),
                            ],
                          ),
                          Text(
                            artwork.artist.job,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ),
                    TextButton(
                      onPressed: () => Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => ArtistProfileScreen(
                            artistId: artwork.artist.id,
                          ),
                        ),
                      ),
                      child: const Text('عرض الملف'),
                    ),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // الوصف
                Text(
                  artwork.description,
                  style: const TextStyle(fontSize: 16),
                ),
                
                const SizedBox(height: 16),
                
                // معلومات إضافية
                if (artwork.dimensions != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.straighten, size: 16),
                      const SizedBox(width: 8),
                      Text(
                        'الأبعاد: ${artwork.dimensions!['width']}×${artwork.dimensions!['height']} ${artwork.dimensions!['unit']}',
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                
                if (artwork.medium != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.palette, size: 16),
                      const SizedBox(width: 8),
                      Text('الوسيط: ${artwork.medium}'),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                
                if (artwork.year != null) ...[
                  Row(
                    children: [
                      const Icon(Icons.calendar_today, size: 16),
                      const SizedBox(width: 8),
                      Text('السنة: ${artwork.year}'),
                    ],
                  ),
                  const SizedBox(height: 8),
                ],
                
                // الإحصائيات
                Row(
                  children: [
                    _buildStatItem(Icons.favorite, '${artwork.stats.likeCount}'),
                    const SizedBox(width: 16),
                    _buildStatItem(Icons.visibility, '${artwork.stats.viewCount}'),
                    const SizedBox(width: 16),
                    _buildStatItem(Icons.star, '${artwork.stats.rating.toStringAsFixed(1)}'),
                  ],
                ),
                
                const SizedBox(height: 16),
                
                // الوسوم
                if (artwork.tags.isNotEmpty) ...[
                  const Text(
                    'الوسوم:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: artwork.tags.map((tag) {
                      return Chip(
                        label: Text(tag),
                        backgroundColor: Colors.grey[200],
                      );
                    }).toList(),
                  ),
                ],
                
                const SizedBox(height: 24),
                
                // الأعمال المشابهة
                if (artworkDetails!.relatedArtworks.isNotEmpty) ...[
                  const Text(
                    'أعمال مشابهة',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 200,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: artworkDetails!.relatedArtworks.length,
                      itemBuilder: (context, index) {
                        final relatedArtwork = artworkDetails!.relatedArtworks[index];
                        return GestureDetector(
                          onTap: () => Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ArtworkDetailScreen(
                                artworkId: relatedArtwork.id,
                              ),
                            ),
                          ),
                          child: Container(
                            width: 120,
                            margin: const EdgeInsets.only(left: 8),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: OptimizedNetworkImage(
                                    imageUrl: relatedArtwork.mainImage,
                                    width: 120,
                                    height: 100,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  relatedArtwork.title,
                                  style: const TextStyle(fontSize: 12),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  '${relatedArtwork.price.toStringAsFixed(0)} ${relatedArtwork.currency}',
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.green,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(IconData icon, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey),
        const SizedBox(width: 4),
        Text(value, style: const TextStyle(color: Colors.grey)),
      ],
    );
  }

  void _toggleLike() async {
    // تنفيذ عملية الإعجاب
    // يمكن إضافة API call هنا
  }
}
```

## 📊 ملخص الفوائد

### للمطور:
- ✅ **APIs محسنة ومتسقة** للتكامل السهل
- ✅ **معالجة شاملة للصور** مع fallbacks آمنة
- ✅ **نماذج بيانات واضحة** مع أمثلة كاملة
- ✅ **إدارة حالة محسنة** مع Provider
- ✅ **تحسين الأداء** مع التخزين المؤقت

### للمستخدم:
- ✅ **تحميل أسرع** للصور والبيانات
- ✅ **تجربة مستخدم سلسة** مع معالجة الأخطاء
- ✅ **واجهة متجاوبة** مع تحديثات فورية
- ✅ **استهلاك بيانات أقل** مع التحسينات

### للنظام:
- ✅ **أداء محسن** مع استعلامات قاعدة بيانات محسنة
- ✅ **قابلية توسعة** مع هيكل منظم
- ✅ **صيانة أسهل** مع كود منظم
- ✅ **أمان محسن** مع validation شامل

---

## 🎯 الخطوات التالية

1. **تنفيذ الـ APIs** في تطبيق Flutter
2. **اختبار الأداء** مع بيانات حقيقية
3. **إضافة المزيد من التحسينات** حسب الحاجة
4. **مراقبة الأداء** والتحسين المستمر

هذا الدليل يوفر أساساً قوياً لتطوير تطبيق Flutter متقدم مع APIs ArtHub المحسنة. 