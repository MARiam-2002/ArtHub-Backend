# دليل سريع لـ APIs Flutter - ArtHub

## 🚀 البداية السريعة

### Base URL
```dart
const String baseUrl = 'https://your-api-domain.com';
```

### Authentication Header
```dart
final headers = {
  'Authorization': 'Bearer $authToken', // اختياري للـ APIs العامة
  'Content-Type': 'application/json',
};
```

## 📱 الـ APIs الأساسية

### 1. الصفحة الرئيسية - GET `/home`
```dart
Future<Map<String, dynamic>> getHomeData() async {
  final response = await http.get(
    Uri.parse('$baseUrl/home'),
    headers: headers,
  );
  return json.decode(response.body)['data'];
}
```

**الاستجابة:**
```json
{
  "categories": [{"_id": "...", "name": "...", "image": "...", "artworksCount": 0}],
  "featuredArtists": [{"_id": "...", "displayName": "...", "profileImage": "..."}],
  "featuredArtworks": [{"_id": "...", "title": "...", "mainImage": "...", "price": 0}],
  "trendingArtworks": [...],
  "personalizedArtworks": [...]
}
```

### 2. البحث - GET `/home/search`
```dart
Future<Map<String, dynamic>> search(String query, {String type = 'all'}) async {
  final uri = Uri.parse('$baseUrl/home/search').replace(queryParameters: {
    'q': query,
    'type': type, // 'all', 'artworks', 'artists'
    'sortBy': 'relevance', // 'relevance', 'price_low', 'price_high', 'rating', 'newest', 'popular'
    'page': '1',
    'limit': '20',
  });
  
  final response = await http.get(uri);
  return json.decode(response.body)['data'];
}
```

### 3. تفاصيل العمل الفني - GET `/home/artwork/:id`
```dart
Future<Map<String, dynamic>> getArtworkDetails(String artworkId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/home/artwork/$artworkId'),
    headers: headers,
  );
  return json.decode(response.body)['data'];
}
```

### 4. ملف الفنان - GET `/home/artist/:id`
```dart
Future<Map<String, dynamic>> getArtistProfile(String artistId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/home/artist/$artistId'),
    headers: headers,
  );
  return json.decode(response.body)['data'];
}
```

### 5. أعمال التصنيف - GET `/home/category/:id`
```dart
Future<Map<String, dynamic>> getCategoryArtworks(String categoryId) async {
  final response = await http.get(
    Uri.parse('$baseUrl/home/category/$categoryId'),
  );
  return json.decode(response.body)['data'];
}
```

### 6. الأعمال الرائجة - GET `/home/trending`
```dart
Future<Map<String, dynamic>> getTrendingArtworks() async {
  final response = await http.get(
    Uri.parse('$baseUrl/home/trending'),
  );
  return json.decode(response.body)['data'];
}
```

## 🖼️ دورة الصور المحسنة

### هيكل الصور في الاستجابة:
```json
{
  "artwork": {
    "mainImage": "https://cloudinary.com/main-image.jpg",
    "images": ["https://cloudinary.com/image1.jpg", "https://cloudinary.com/image2.jpg"],
    "allImages": ["https://cloudinary.com/main-image.jpg", "https://cloudinary.com/image1.jpg"]
  },
  "artist": {
    "profileImage": "https://cloudinary.com/profile.jpg",
    "coverImages": ["https://cloudinary.com/cover1.jpg"]
  },
  "category": {
    "image": "https://cloudinary.com/category.jpg"
  }
}
```

### Widget للصور مع Fallback:
```dart
class SafeNetworkImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;

  const SafeNetworkImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (imageUrl.isEmpty) {
      return _buildPlaceholder();
    }

    return Image.network(
      imageUrl,
      width: width,
      height: height,
      fit: fit,
      loadingBuilder: (context, child, progress) {
        if (progress == null) return child;
        return Container(
          width: width,
          height: height,
          color: Colors.grey[300],
          child: const Center(child: CircularProgressIndicator()),
        );
      },
      errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      width: width,
      height: height,
      color: Colors.grey[300],
      child: const Icon(Icons.image, size: 50, color: Colors.grey),
    );
  }
}
```

## 🏗️ نماذج البيانات الأساسية

### نموذج العمل الفني:
```dart
class Artwork {
  final String id;
  final String title;
  final String mainImage;
  final List<String> images;
  final double price;
  final String currency;
  final Artist artist;
  final Category category;

  Artwork({
    required this.id,
    required this.title,
    required this.mainImage,
    required this.images,
    required this.price,
    required this.currency,
    required this.artist,
    required this.category,
  });

  factory Artwork.fromJson(Map<String, dynamic> json) {
    return Artwork(
      id: json['_id'],
      title: json['title'] ?? '',
      mainImage: json['mainImage'] ?? '',
      images: List<String>.from(json['images'] ?? []),
      price: (json['price'] ?? 0).toDouble(),
      currency: json['currency'] ?? 'SAR',
      artist: Artist.fromJson(json['artist']),
      category: Category.fromJson(json['category']),
    );
  }
}
```

### نموذج الفنان:
```dart
class Artist {
  final String id;
  final String displayName;
  final String profileImage;
  final String job;
  final double rating;
  final bool isVerified;

  Artist({
    required this.id,
    required this.displayName,
    required this.profileImage,
    required this.job,
    required this.rating,
    required this.isVerified,
  });

  factory Artist.fromJson(Map<String, dynamic> json) {
    return Artist(
      id: json['_id'],
      displayName: json['displayName'] ?? '',
      profileImage: json['profileImage'] ?? '',
      job: json['job'] ?? '',
      rating: (json['rating'] ?? 0).toDouble(),
      isVerified: json['isVerified'] ?? false,
    );
  }
}
```

### نموذج التصنيف:
```dart
class Category {
  final String id;
  final String name;
  final String image;
  final int artworksCount;

  Category({
    required this.id,
    required this.name,
    required this.image,
    required this.artworksCount,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['_id'],
      name: json['name'] ?? '',
      image: json['image'] ?? '',
      artworksCount: json['artworksCount'] ?? 0,
    );
  }
}
```

## 🔧 خدمة الـ API

### خدمة شاملة:
```dart
class ApiService {
  static const String baseUrl = 'https://your-api-domain.com';
  static String? authToken;

  static Map<String, String> get headers => {
    'Content-Type': 'application/json',
    if (authToken != null) 'Authorization': 'Bearer $authToken',
  };

  // الصفحة الرئيسية
  static Future<Map<String, dynamic>> getHomeData() async {
    final response = await http.get(
      Uri.parse('$baseUrl/home'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Failed to load home data');
  }

  // البحث
  static Future<Map<String, dynamic>> search(String query) async {
    final uri = Uri.parse('$baseUrl/home/search').replace(
      queryParameters: {'q': query, 'type': 'all'},
    );
    
    final response = await http.get(uri, headers: headers);
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Search failed');
  }

  // تفاصيل العمل الفني
  static Future<Map<String, dynamic>> getArtworkDetails(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/home/artwork/$id'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Failed to load artwork details');
  }

  // ملف الفنان
  static Future<Map<String, dynamic>> getArtistProfile(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/home/artist/$id'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Failed to load artist profile');
  }

  // أعمال التصنيف
  static Future<Map<String, dynamic>> getCategoryArtworks(String id) async {
    final response = await http.get(
      Uri.parse('$baseUrl/home/category/$id'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Failed to load category artworks');
  }

  // الأعمال الرائجة
  static Future<Map<String, dynamic>> getTrendingArtworks() async {
    final response = await http.get(
      Uri.parse('$baseUrl/home/trending'),
      headers: headers,
    );
    
    if (response.statusCode == 200) {
      return json.decode(response.body)['data'];
    }
    throw Exception('Failed to load trending artworks');
  }
}
```

## 🎨 أمثلة للـ Widgets

### 1. شبكة الأعمال الفنية:
```dart
class ArtworksGrid extends StatelessWidget {
  final List<Artwork> artworks;
  final Function(Artwork) onArtworkTap;

  const ArtworksGrid({
    Key? key,
    required this.artworks,
    required this.onArtworkTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        childAspectRatio: 0.75,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: artworks.length,
      itemBuilder: (context, index) {
        final artwork = artworks[index];
        return GestureDetector(
          onTap: () => onArtworkTap(artwork),
          child: Card(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: SafeNetworkImage(
                    imageUrl: artwork.mainImage,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        artwork.title,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${artwork.price.toStringAsFixed(0)} ${artwork.currency}',
                        style: const TextStyle(color: Colors.green),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        artwork.artist.displayName,
                        style: const TextStyle(color: Colors.grey),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
```

### 2. قائمة الفنانين:
```dart
class ArtistsList extends StatelessWidget {
  final List<Artist> artists;
  final Function(Artist) onArtistTap;

  const ArtistsList({
    Key? key,
    required this.artists,
    required this.onArtistTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: artists.length,
      itemBuilder: (context, index) {
        final artist = artists[index];
        return ListTile(
          leading: CircleAvatar(
            backgroundImage: NetworkImage(artist.profileImage),
          ),
          title: Row(
            children: [
              Text(artist.displayName),
              if (artist.isVerified) ...[
                const SizedBox(width: 4),
                const Icon(Icons.verified, size: 16, color: Colors.blue),
              ],
            ],
          ),
          subtitle: Text(artist.job),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.star, size: 16, color: Colors.amber),
              const SizedBox(width: 4),
              Text(artist.rating.toStringAsFixed(1)),
            ],
          ),
          onTap: () => onArtistTap(artist),
        );
      },
    );
  }
}
```

### 3. قائمة التصنيفات:
```dart
class CategoriesGrid extends StatelessWidget {
  final List<Category> categories;
  final Function(Category) onCategoryTap;

  const CategoriesGrid({
    Key? key,
    required this.categories,
    required this.onCategoryTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
      ),
      itemCount: categories.length,
      itemBuilder: (context, index) {
        final category = categories[index];
        return GestureDetector(
          onTap: () => onCategoryTap(category),
          child: Card(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  child: SafeNetworkImage(
                    imageUrl: category.image,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    children: [
                      Text(
                        category.name,
                        style: const TextStyle(fontWeight: FontWeight.bold),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '${category.artworksCount} عمل',
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
```

## 🔍 معالجة الأخطاء

### معالجة الأخطاء الشاملة:
```dart
class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);
}

Future<T> handleApiCall<T>(Future<T> Function() apiCall) async {
  try {
    return await apiCall();
  } on http.ClientException {
    throw ApiException('مشكلة في الاتصال بالإنترنت', 0);
  } on FormatException {
    throw ApiException('خطأ في تنسيق البيانات', 0);
  } catch (e) {
    throw ApiException('خطأ غير متوقع: $e', 0);
  }
}

// الاستخدام
try {
  final homeData = await handleApiCall(() => ApiService.getHomeData());
  // استخدام البيانات
} on ApiException catch (e) {
  // عرض الخطأ للمستخدم
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(e.message)),
  );
}
```

## 📦 المكتبات المطلوبة

### pubspec.yaml:
```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  cached_network_image: ^3.3.0
  provider: ^6.1.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  mockito: ^5.4.2
```

## 🚀 نصائح للأداء

### 1. التخزين المؤقت:
```dart
class CacheManager {
  static final Map<String, dynamic> _cache = {};
  static final Map<String, DateTime> _timestamps = {};

  static void set(String key, dynamic value) {
    _cache[key] = value;
    _timestamps[key] = DateTime.now();
  }

  static T? get<T>(String key, {Duration maxAge = const Duration(minutes: 5)}) {
    if (!_cache.containsKey(key)) return null;
    
    final timestamp = _timestamps[key]!;
    if (DateTime.now().difference(timestamp) > maxAge) {
      _cache.remove(key);
      _timestamps.remove(key);
      return null;
    }
    
    return _cache[key] as T;
  }
}
```

### 2. تحسين الصور:
```dart
String optimizeImageUrl(String url, {int? width, int? height}) {
  if (url.contains('cloudinary.com')) {
    final uri = Uri.parse(url);
    final segments = uri.pathSegments.toList();
    
    if (segments.length >= 3) {
      final transforms = <String>[];
      if (width != null) transforms.add('w_$width');
      if (height != null) transforms.add('h_$height');
      transforms.addAll(['c_fill', 'f_auto', 'q_auto']);
      
      segments.insert(2, transforms.join(','));
      return uri.replace(pathSegments: segments).toString();
    }
  }
  return url;
}
```

---

هذا دليل سريع يحتوي على كل ما تحتاجه للبدء في تطوير تطبيق Flutter مع APIs ArtHub المحسنة! 🎨📱 