# ملخص شامل لـ APIs تطبيق ArtHub

## 📊 نظرة عامة على النظام

تطبيق ArtHub يحتوي على **7 أقسام رئيسية** تغطي دورة الصور الكاملة:

### 🔄 دورة الصور السبعة:
1. **الصفحة الرئيسية** - Home Screen
2. **ملف الفنان** - Artist Profile  
3. **تفاصيل العمل الفني** - Artwork Details
4. **المحادثات** - Chat System
5. **الطلبات الخاصة** - Special Requests
6. **الرسائل** - Messages
7. **البحث والاستكشاف** - Search & Discovery

---

## 🏠 قسم الصفحة الرئيسية (Home)

### Base URL: `/home`

#### 1. بيانات الصفحة الرئيسية
- **GET** `/home`
- **الوصف**: جلب جميع بيانات الصفحة الرئيسية
- **المصادقة**: اختيارية
- **الاستجابة**: 
  - `categories` - التصنيفات
  - `featuredArtists` - الفنانون المميزون
  - `featuredArtworks` - الأعمال المميزة
  - `trendingArtworks` - الأعمال الرائجة
  - `personalizedArtworks` - الأعمال المخصصة

#### 2. البحث المتقدم
- **GET** `/home/search`
- **المعاملات**: `q`, `type`, `sortBy`, `page`, `limit`
- **الوصف**: البحث في الأعمال والفنانين

#### 3. تفاصيل العمل الفني
- **GET** `/home/artwork/:id`
- **المصادقة**: اختيارية
- **الوصف**: تفاصيل عمل فني واحد مع الأعمال المشابهة

#### 4. ملف الفنان
- **GET** `/home/artist/:id`
- **المصادقة**: اختيارية
- **الوصف**: ملف الفنان مع أعماله

#### 5. أعمال التصنيف
- **GET** `/home/category/:id`
- **المعاملات**: `sortBy`, `page`, `limit`
- **الوصف**: الأعمال حسب التصنيف

#### 6. الأعمال الرائجة
- **GET** `/home/trending`
- **المعاملات**: `page`, `limit`
- **الوصف**: الأعمال الأكثر مشاهدة

---

## 👤 قسم المستخدمين (Users)

### Base URL: `/users`

#### 1. ملف المستخدم
- **GET** `/users/profile`
- **المصادقة**: مطلوبة
- **الوصف**: معلومات المستخدم الحالي

#### 2. تحديث الملف الشخصي
- **PUT** `/users/profile`
- **المصادقة**: مطلوبة
- **الوصف**: تحديث بيانات المستخدم

#### 3. رفع صورة الملف الشخصي
- **POST** `/users/upload-profile-image`
- **المصادقة**: مطلوبة
- **الوصف**: رفع صورة شخصية جديدة

#### 4. قائمة المفضلة
- **GET** `/users/wishlist`
- **المصادقة**: مطلوبة
- **الوصف**: قائمة الأعمال المفضلة

#### 5. إضافة/إزالة من المفضلة
- **POST** `/users/wishlist/:artworkId`
- **DELETE** `/users/wishlist/:artworkId`
- **المصادقة**: مطلوبة

---

## 🎨 قسم الأعمال الفنية (Artworks)

### Base URL: `/artworks`

#### 1. إنشاء عمل فني جديد
- **POST** `/artworks`
- **المصادقة**: مطلوبة (فنان)
- **الوصف**: إضافة عمل فني جديد

#### 2. تحديث العمل الفني
- **PUT** `/artworks/:id`
- **المصادقة**: مطلوبة (المالك)
- **الوصف**: تحديث بيانات العمل

#### 3. حذف العمل الفني
- **DELETE** `/artworks/:id`
- **المصادقة**: مطلوبة (المالك)
- **الوصف**: حذف العمل الفني

#### 4. رفع صور العمل الفني
- **POST** `/artworks/:id/images`
- **المصادقة**: مطلوبة (المالك)
- **الوصف**: رفع صور إضافية

#### 5. أعمال الفنان
- **GET** `/artworks/artist/:artistId`
- **المعاملات**: `page`, `limit`, `status`
- **الوصف**: جميع أعمال فنان معين

---

## 🔐 قسم المصادقة (Authentication)

### Base URL: `/auth`

#### 1. تسجيل الدخول
- **POST** `/auth/login`
- **البيانات**: `email`, `password`
- **الوصف**: تسجيل دخول بالبريد الإلكتروني

#### 2. تسجيل الدخول بـ Firebase
- **POST** `/auth/firebase-login`
- **البيانات**: `firebaseToken`
- **الوصف**: تسجيل دخول بـ Firebase

#### 3. التسجيل
- **POST** `/auth/register`
- **البيانات**: `email`, `password`, `displayName`
- **الوصف**: إنشاء حساب جديد

#### 4. نسيان كلمة المرور
- **POST** `/auth/forgot-password`
- **البيانات**: `email`
- **الوصف**: إرسال رمز إعادة تعيين

#### 5. إعادة تعيين كلمة المرور
- **POST** `/auth/reset-password`
- **البيانات**: `email`, `code`, `newPassword`
- **الوصف**: تغيير كلمة المرور

#### 6. تسجيل الخروج
- **POST** `/auth/logout`
- **المصادقة**: مطلوبة
- **الوصف**: إنهاء الجلسة

#### 7. تحديث الرمز المميز
- **POST** `/auth/refresh-token`
- **البيانات**: `refreshToken`
- **الوصف**: تحديث رمز الوصول

---

## 💬 قسم المحادثات (Chat)

### Base URL: `/chat`

#### 1. قائمة المحادثات
- **GET** `/chat/conversations`
- **المصادقة**: مطلوبة
- **الوصف**: جميع محادثات المستخدم

#### 2. إنشاء محادثة جديدة
- **POST** `/chat/conversations`
- **البيانات**: `participantId`, `message`
- **المصادقة**: مطلوبة

#### 3. رسائل المحادثة
- **GET** `/chat/conversations/:id/messages`
- **المصادقة**: مطلوبة
- **الوصف**: رسائل محادثة معينة

#### 4. إرسال رسالة
- **POST** `/chat/conversations/:id/messages`
- **البيانات**: `message`, `type`
- **المصادقة**: مطلوبة

#### 5. رفع صورة في المحادثة
- **POST** `/chat/conversations/:id/upload-image`
- **المصادقة**: مطلوبة
- **الوصف**: إرسال صورة

#### 6. تحديد الرسائل كمقروءة
- **PUT** `/chat/conversations/:id/mark-read`
- **المصادقة**: مطلوبة

---

## 🎯 قسم الطلبات الخاصة (Special Requests)

### Base URL: `/special-requests`

#### 1. إنشاء طلب خاص
- **POST** `/special-requests`
- **البيانات**: `type`, `description`, `budget`, `deadline`
- **المصادقة**: مطلوبة

#### 2. قائمة الطلبات
- **GET** `/special-requests`
- **المصادقة**: مطلوبة
- **الوصف**: طلبات المستخدم

#### 3. تفاصيل الطلب
- **GET** `/special-requests/:id`
- **المصادقة**: مطلوبة
- **الوصف**: تفاصيل طلب معين

#### 4. تحديث الطلب
- **PUT** `/special-requests/:id`
- **المصادقة**: مطلوبة (المالك)
- **الوصف**: تحديث بيانات الطلب

#### 5. حذف الطلب
- **DELETE** `/special-requests/:id`
- **المصادقة**: مطلوبة (المالك)

#### 6. عروض الطلب
- **GET** `/special-requests/:id/offers`
- **المصادقة**: مطلوبة
- **الوصف**: العروض المقدمة للطلب

#### 7. تقديم عرض
- **POST** `/special-requests/:id/offers`
- **البيانات**: `price`, `description`, `deliveryTime`
- **المصادقة**: مطلوبة (فنان)

---

## 🏷️ قسم التصنيفات (Categories)

### Base URL: `/categories`

#### 1. جميع التصنيفات
- **GET** `/categories`
- **الوصف**: قائمة بجميع التصنيفات

#### 2. تفاصيل التصنيف
- **GET** `/categories/:id`
- **الوصف**: تفاصيل تصنيف معين

#### 3. إنشاء تصنيف (Admin)
- **POST** `/categories`
- **المصادقة**: مطلوبة (admin)
- **البيانات**: `name`, `description`, `image`

#### 4. تحديث التصنيف (Admin)
- **PUT** `/categories/:id`
- **المصادقة**: مطلوبة (admin)

#### 5. حذف التصنيف (Admin)
- **DELETE** `/categories/:id`
- **المصادقة**: مطلوبة (admin)

---

## 👥 قسم المتابعة (Follow)

### Base URL: `/follow`

#### 1. متابعة فنان
- **POST** `/follow/:artistId`
- **المصادقة**: مطلوبة
- **الوصف**: متابعة فنان معين

#### 2. إلغاء المتابعة
- **DELETE** `/follow/:artistId`
- **المصادقة**: مطلوبة

#### 3. قائمة المتابعين
- **GET** `/follow/followers`
- **المصادقة**: مطلوبة
- **الوصف**: من يتابعك

#### 4. قائمة المتابعة
- **GET** `/follow/following`
- **المصادقة**: مطلوبة
- **الوصف**: من تتابعه

#### 5. حالة المتابعة
- **GET** `/follow/status/:artistId`
- **المصادقة**: مطلوبة
- **الوصف**: هل تتابع هذا الفنان؟

---

## 🔔 قسم الإشعارات (Notifications)

### Base URL: `/notifications`

#### 1. قائمة الإشعارات
- **GET** `/notifications`
- **المصادقة**: مطلوبة
- **الوصف**: إشعارات المستخدم

#### 2. تحديد كمقروءة
- **PUT** `/notifications/:id/read`
- **المصادقة**: مطلوبة

#### 3. تحديد الجميع كمقروءة
- **PUT** `/notifications/mark-all-read`
- **المصادقة**: مطلوبة

#### 4. حذف الإشعار
- **DELETE** `/notifications/:id`
- **المصادقة**: مطلوبة

#### 5. عداد الإشعارات غير المقروءة
- **GET** `/notifications/unread-count`
- **المصادقة**: مطلوبة

---

## ⭐ قسم التقييمات (Reviews)

### Base URL: `/reviews`

#### 1. تقييمات العمل الفني
- **GET** `/reviews/artwork/:artworkId`
- **الوصف**: تقييمات عمل فني معين

#### 2. تقييمات الفنان
- **GET** `/reviews/artist/:artistId`
- **الوصف**: تقييمات فنان معين

#### 3. إضافة تقييم
- **POST** `/reviews`
- **البيانات**: `target`, `targetId`, `rating`, `comment`
- **المصادقة**: مطلوبة

#### 4. تحديث التقييم
- **PUT** `/reviews/:id`
- **المصادقة**: مطلوبة (المالك)

#### 5. حذف التقييم
- **DELETE** `/reviews/:id`
- **المصادقة**: مطلوبة (المالك)

---

## 💰 قسم المعاملات (Transactions)

### Base URL: `/transactions`

#### 1. قائمة المعاملات
- **GET** `/transactions`
- **المصادقة**: مطلوبة
- **الوصف**: معاملات المستخدم

#### 2. إنشاء معاملة
- **POST** `/transactions`
- **البيانات**: `artworkId`, `amount`, `paymentMethod`
- **المصادقة**: مطلوبة

#### 3. تفاصيل المعاملة
- **GET** `/transactions/:id`
- **المصادقة**: مطلوبة

#### 4. تحديث حالة المعاملة
- **PUT** `/transactions/:id/status`
- **المصادقة**: مطلوبة (البائع أو Admin)

---

## 🖼️ قسم الصور (Images)

### Base URL: `/images`

#### 1. رفع صورة
- **POST** `/images/upload`
- **البيانات**: `image` (multipart/form-data)
- **المصادقة**: مطلوبة

#### 2. رفع صور متعددة
- **POST** `/images/upload-multiple`
- **البيانات**: `images[]` (multipart/form-data)
- **المصادقة**: مطلوبة

#### 3. حذف صورة
- **DELETE** `/images/:publicId`
- **المصادقة**: مطلوبة

#### 4. تحسين الصورة
- **POST** `/images/optimize`
- **البيانات**: `imageUrl`, `width`, `height`, `quality`
- **المصادقة**: مطلوبة

---

## 📊 قسم الإحصائيات (Dashboard)

### Base URL: `/dashboard`

#### 1. إحصائيات الفنان
- **GET** `/dashboard/artist-stats`
- **المصادقة**: مطلوبة (فنان)
- **الوصف**: إحصائيات الفنان

#### 2. إحصائيات الأعمال
- **GET** `/dashboard/artwork-stats`
- **المصادقة**: مطلوبة (فنان)

#### 3. إحصائيات المبيعات
- **GET** `/dashboard/sales-stats`
- **المصادقة**: مطلوبة (فنان)

#### 4. إحصائيات عامة (Admin)
- **GET** `/dashboard/general-stats`
- **المصادقة**: مطلوبة (admin)

---

## 🔍 بحث متقدم وفلترة

### معاملات البحث المتاحة:

#### للأعمال الفنية:
- `q` - النص المراد البحث عنه
- `category` - التصنيف
- `priceMin` - الحد الأدنى للسعر
- `priceMax` - الحد الأقصى للسعر
- `medium` - الوسيط الفني
- `year` - سنة الإنتاج
- `artist` - معرف الفنان
- `tags` - الوسوم
- `sortBy` - ترتيب النتائج
- `page` - رقم الصفحة
- `limit` - عدد النتائج

#### للفنانين:
- `q` - النص المراد البحث عنه
- `job` - التخصص
- `rating` - التقييم الأدنى
- `verified` - فنانون معتمدون فقط
- `location` - المكان
- `sortBy` - ترتيب النتائج

---

## 🔄 دورة الصور الكاملة

### 1. رفع الصور:
```
المستخدم → رفع الصورة → معالجة → Cloudinary → حفظ الرابط
```

### 2. عرض الصور:
```
طلب الصور → تحسين الحجم → عرض مع Fallback → تخزين مؤقت
```

### 3. أنواع الصور:
- **صور الأعمال الفنية**: `mainImage`, `images[]`
- **صور الملفات الشخصية**: `profileImage`, `coverImages[]`
- **صور التصنيفات**: `image`
- **صور المحادثات**: `attachments[]`

### 4. تحسين الصور:
- **تحسين الحجم**: تلقائي حسب الاستخدام
- **تحسين الجودة**: تلقائي حسب الشبكة
- **تحسين التنسيق**: WebP للمتصفحات المدعومة

---

## 📱 نصائح للتطوير في Flutter

### 1. استخدام Repository Pattern:
```dart
abstract class HomeRepository {
  Future<HomeData> getHomeData();
  Future<List<Artwork>> searchArtworks(String query);
  Future<ArtworkDetails> getArtworkDetails(String id);
}
```

### 2. إدارة الحالة:
```dart
class HomeBloc extends Bloc<HomeEvent, HomeState> {
  final HomeRepository repository;
  
  HomeBloc(this.repository) : super(HomeInitial()) {
    on<LoadHomeData>(_onLoadHomeData);
    on<SearchArtworks>(_onSearchArtworks);
  }
}
```

### 3. معالجة الأخطاء:
```dart
enum ApiErrorType {
  network,
  authentication,
  validation,
  server,
  unknown
}

class ApiError {
  final ApiErrorType type;
  final String message;
  final int statusCode;
  
  ApiError(this.type, this.message, this.statusCode);
}
```

### 4. تخزين مؤقت ذكي:
```dart
class SmartCacheManager {
  static const Duration _defaultCacheDuration = Duration(minutes: 5);
  
  static Future<T> getCachedData<T>(
    String key,
    Future<T> Function() fetcher,
  ) async {
    // تنفيذ التخزين المؤقت الذكي
  }
}
```

---

## 🎯 الخلاصة

تطبيق ArtHub يوفر **46 API endpoint** موزعة على **12 قسم رئيسي** تغطي:

✅ **دورة الصور الكاملة** (7 أقسام رئيسية)
✅ **إدارة المستخدمين** والمصادقة
✅ **نظام المحادثات** والتواصل
✅ **الطلبات الخاصة** والعروض
✅ **التقييمات** والمراجعات
✅ **المعاملات** والمدفوعات
✅ **الإحصائيات** والتقارير

هذا النظام المتكامل يسمح ببناء تطبيق Flutter قوي ومتطور يلبي جميع احتياجات منصة الفن الرقمي! 🎨📱 