# 📸 دليل التعامل مع الصور في Flutter - إنشاء الأعمال الفنية

## 📋 نظرة عامة

بناءً على واجهة المستخدم "اضافة عمل"، يتم التعامل مع الصور بطريقة واحدة فقط:

**رفع ملفات الصور مباشرة** (الطريقة الوحيدة المدعومة)

## ❓ إجابة على أسئلتك

### سؤال: "الصورة بتاخديها ك string ولا ايه؟"

**الإجابة:** الصور يتم التعامل معها بطريقتين في الـ Backend:

#### 1️⃣ **الطريقة المدعومة: رفع ملفات مباشرة (Multipart Form Data)**
```dart
// ✅ الطريقة الصحيحة
final formData = FormData.fromMap({
  'title': 'عنوان العمل',
  'price': 100,
  'category': 'رسم',
  // الصور كملفات
});

// إضافة الصور كملفات
formData.files.add(
  MapEntry('images', await MultipartFile.fromFile(imageFile.path))
);
```

#### 2️⃣ **الطريقة غير المدعومة: إرسال روابط كـ string**
```dart
// ❌ هذه الطريقة غير مدعومة حالياً
final data = {
  'title': 'عنوان العمل',
  'price': 100,
  'category': 'رسم',
  'images': [
    'https://example.com/image1.jpg', // ❌ لا يعمل
    'https://example.com/image2.jpg'
  ]
};
```

### سؤال: "لو استقبلتيها ك string هتبقا حوار عندك ولا بسيطه؟"

**الإجابة:** لو استقبلتها كـ string، ستحتاج إلى:

1. **تحويل الـ string إلى ملف** (معقد)
2. **رفعه على Cloudinary** (معقد)
3. **معالجة الأخطاء** (معقد)

**النتيجة:** معقدة جداً! 🚫

### سؤال: "عشان ابعتها من عندي كفايل لازم هتعامل مع الداتا بتاعتي ك formData"

**الإجابة:** ✅ **صحيح تماماً!**

```dart
// ✅ الطريقة الصحيحة
final formData = FormData.fromMap({
  'title': 'عنوان العمل',
  'price': 100,
  'category': 'رسم',
});

// إضافة الصور كملفات
for (File image in images) {
  formData.files.add(
    MapEntry('images', await MultipartFile.fromFile(image.path))
  );
}
```

### سؤال: "لو شلت ال line بتاع ال content-type ده هيضرب معاكي صح؟"

**الإجابة:** ✅ **صحيح تماماً!**

```dart
// ✅ لا تحتاج لتحديد Content-Type مع Dio
final response = await dio.post(
  '/api/artworks',
  data: formData, // Dio يحدد Content-Type تلقائياً
  options: Options(
    headers: {
      'Authorization': 'Bearer $token',
      // لا تحتاج: 'Content-Type': 'multipart/form-data'
    },
  ),
);
```

### سؤال: "لو بعتلك Content-Type: multipart/form-data مش هيعمل معاكي مشكله؟"

**الإجابة:** ✅ **لا، لن يسبب أي مشاكل!**

```dart
// ✅ هذا آمن تماماً
final response = await dio.post(
  '/api/artworks',
  data: formData,
  options: Options(
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'multipart/form-data', // ✅ آمن
    },
  ),
);
```

**السبب:** الـ Backend يتعامل مع `multipart/form-data` بشكل صحيح، سواء تم تحديده يدوياً أو تلقائياً.

## 🚨 حل مشاكل Flutter الشائعة

### المشكلة: "DioException: null" مع "Response: null"

**السبب:** مشكلة في إعداد FormData أو الـ headers

#### الحل 1: تصحيح إعداد FormData
```dart
// ❌ خطأ شائع
final formData = FormData.fromMap({
  'title': title,
  'price': price,
  'category': category,
  'image': imageFile, // ❌ خطأ
});

// ✅ الحل الصحيح
final formData = FormData.fromMap({
  'title': title,
  'price': price.toString(), // تحويل إلى string
  'category': category,
});

// إضافة الصور بشكل منفصل
formData.files.add(
  MapEntry('images', await MultipartFile.fromFile(imageFile.path))
);
```

#### الحل 2: تصحيح الـ Headers
```dart
// ❌ خطأ شائع
final response = await dio.post(
  '/api/artworks',
  data: formData,
  options: Options(
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'multipart/form-data', // ❌ قد يسبب مشاكل
    },
  ),
);

// ✅ الحل الصحيح
final response = await dio.post(
  '/api/artworks',
  data: formData,
  options: Options(
    headers: {
      'Authorization': 'Bearer $token',
      // لا تحدد Content-Type يدوياً
    },
    sendTimeout: Duration(seconds: 60), // زيادة الـ timeout
    receiveTimeout: Duration(seconds: 60),
  ),
);
```

#### الحل 3: إضافة Error Handling
```dart
try {
  final response = await dio.post(
    '/api/artworks',
    data: formData,
    options: Options(
      headers: {'Authorization': 'Bearer $token'},
      sendTimeout: Duration(seconds: 60),
      receiveTimeout: Duration(seconds: 60),
    ),
  );
  
  print('✅ Success: ${response.data}');
  
} on DioException catch (e) {
  print('❌ Dio Error: ${e.message}');
  print('❌ Error Type: ${e.type}');
  print('❌ Error Response: ${e.response?.data}');
  print('❌ Error Status: ${e.response?.statusCode}');
  
  // معالجة أنواع الأخطاء المختلفة
  switch (e.type) {
    case DioExceptionType.connectionTimeout:
      print('خطأ في الاتصال - انتهت مهلة الاتصال');
      break;
    case DioExceptionType.sendTimeout:
      print('خطأ في الإرسال - انتهت مهلة الإرسال');
      break;
    case DioExceptionType.receiveTimeout:
      print('خطأ في الاستقبال - انتهت مهلة الاستقبال');
      break;
    case DioExceptionType.badResponse:
      print('خطأ في الاستجابة: ${e.response?.statusCode}');
      break;
    case DioExceptionType.cancel:
      print('تم إلغاء الطلب');
      break;
    default:
      print('خطأ غير معروف');
  }
} catch (e) {
  print('❌ General Error: $e');
}
```

#### الحل 4: تصحيح اسم الحقل
```dart
// ❌ خطأ شائع - اسم الحقل خاطئ
formData.files.add(
  MapEntry('image', await MultipartFile.fromFile(imageFile.path)) // ❌ خطأ
);

// ✅ الحل الصحيح - اسم الحقل الصحيح
formData.files.add(
  MapEntry('images', await MultipartFile.fromFile(imageFile.path)) // ✅ صحيح
);
```

#### الحل 5: مثال كامل مصحح
```dart
Future<void> createArtwork({
  required String title,
  required int price,
  required String category,
  required File imageFile,
  required String token,
}) async {
  try {
    print('🔄 بدء إنشاء العمل الفني...');
    
    // إنشاء FormData
    final formData = FormData.fromMap({
      'title': title,
      'price': price.toString(), // تحويل إلى string
      'category': category,
    });

    // إضافة الصورة
    formData.files.add(
      MapEntry(
        'images', // اسم الحقل الصحيح
        await MultipartFile.fromFile(
          imageFile.path,
          filename: 'artwork_${DateTime.now().millisecondsSinceEpoch}.jpg',
        ),
      ),
    );

    print('📤 إرسال البيانات...');
    print('FIELD: title = $title');
    print('FIELD: price = $price');
    print('FIELD: category = $category');
    print('FILE: image = ${imageFile.path.split('/').last}');

    final response = await dio.post(
      'https://arthub-backend.up.railway.app/api/artworks',
      data: formData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
        sendTimeout: Duration(seconds: 60),
        receiveTimeout: Duration(seconds: 60),
      ),
      onSendProgress: (sent, total) {
        final progress = sent / total;
        print('📤 Progress: ${(progress * 100).toStringAsFixed(1)}%');
      },
    );

    print('✅ تم إنشاء العمل الفني بنجاح');
    print('Response: ${response.data}');
    
  } on DioException catch (e) {
    print('❌ Dio Error: ${e.message}');
    print('❌ Error Type: ${e.type}');
    print('❌ Error Response: ${e.response?.data}');
    print('❌ Error Status: ${e.response?.statusCode}');
    rethrow;
  } catch (e) {
    print('❌ General Error: $e');
    rethrow;
  }
}
```

### المشكلة: "FIELD: image" بدلاً من "images"

**السبب:** اسم الحقل خاطئ في الـ FormData

#### الحل:
```dart
// ❌ خطأ
formData.files.add(
  MapEntry('image', await MultipartFile.fromFile(imageFile.path)) // ❌ خطأ
);

// ✅ صحيح
formData.files.add(
  MapEntry('images', await MultipartFile.fromFile(imageFile.path)) // ✅ صحيح
);
```

### المشكلة: "Current Request Body" فارغ

**السبب:** مشكلة في إعداد الـ FormData

#### الحل:
```dart
// تأكد من أن البيانات النصية صحيحة
final formData = FormData.fromMap({
  'title': title.trim(), // تأكد من عدم وجود مسافات زائدة
  'price': price.toString(), // تحويل الرقم إلى string
  'category': category.trim(),
});

// تأكد من أن الملف موجود
if (await imageFile.exists()) {
  formData.files.add(
    MapEntry('images', await MultipartFile.fromFile(imageFile.path))
  );
} else {
  throw Exception('الملف غير موجود: ${imageFile.path}');
}
```

## 🔧 تصحيح الكود الخاص بك

بناءً على الكود الذي أرسلته، المشكلة في:

### 1. تصحيح الـ Cubit
```dart
class AddArtworkCubit extends Cubit<AddArtworkState> {
  AddArtworkCubit() : super(AddArtworkInitial());
  DioHelper dio = DioHelper();
  
  Future<void> addArtwork({
    required String title,
    required int price,
    required String category,
    required File imageFile,
  }) async {
    emit(AddArtworkLoading());
    try {
      final token = await SecureStorage().getAccessToken();
      
      // ✅ تصحيح إعداد FormData
      final formData = FormData.fromMap({
        'title': title.trim(),
        'price': price.toString(), // تحويل إلى string
        'category': category.trim(),
      });

      // ✅ إضافة الصورة بشكل منفصل
      formData.files.add(
        MapEntry(
          'images', // اسم الحقل الصحيح
          await MultipartFile.fromFile(
            imageFile.path,
            filename: 'artwork_${DateTime.now().millisecondsSinceEpoch}.jpg',
          ),
        ),
      );

      // ✅ طباعة البيانات للتأكد
      formData.fields.forEach((f) => print('FIELD: ${f.key} = ${f.value}'));
      formData.files.forEach(
        (f) => print('FILE: ${f.key} = ${f.value.filename}'),
      );

      // ✅ إضافة timeout و error handling
      final response = await dio.postData(
        url: ApiConstant.artWorks,
        token: token,
        data: formData,
        options: Options(
          sendTimeout: Duration(seconds: 60),
          receiveTimeout: Duration(seconds: 60),
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = AddArtworkModel.fromJson(response.data);
        if (data.success == true && data.data != null) {
          emit(AddArtworkSuccess(data.data!));
        } else {
          emit(AddArtworkFailure(
            data.message ?? 'حدث خطأ أثناء إضافة العمل الفني',
          ));
        }
      } else {
        emit(AddArtworkFailure(
          'حدث خطأ أثناء إضافة العمل الفني: ${response.data['message'] ?? 'غير معروف'}',
        ));
      }
    } catch (e, stackTrace) {
      ErrorHandler.logError('AddArtworkCubit.addArtwork', e, stackTrace);

      final errorMessage = e is DioException
          ? e.message ?? 'Network error occurred'
          : 'Unexpected error occurred';

      emit(AddArtworkFailure(errorMessage));
    }
  }
}
```

### 2. تصحيح الـ API Constants
تأكد من أن `ApiConstant.artWorks` يحتوي على:
```dart
class ApiConstant {
  static const String artWorks = '/api/artworks'; // ✅ صحيح
  // أو
  static const String artWorks = 'https://arthub-backend.up.railway.app/api/artworks'; // ✅ صحيح
}
```

### 3. تصحيح الـ DioHelper
تأكد من أن `DioHelper.postData` يدعم `FormData`:
```dart
class DioHelper {
  Future<Response> postData({
    required String url,
    required String token,
    required FormData data,
    Options? options,
  }) async {
    return await dio.post(
      url,
      data: data,
      options: options?.copyWith(
        headers: {
          'Authorization': 'Bearer $token',
          ...?options?.headers,
        },
      ) ?? Options(
        headers: {'Authorization': 'Bearer $token'},
      ),
    );
  }
}
```

## 🎯 الطريقة المدعومة: رفع ملفات الصور مباشرة

### الطلب (Multipart Form Data)

```dart
import 'dart:io';
import 'package:http/http.dart' as http;

Future<void> createArtworkWithImages() async {
  // إعداد البيانات حسب واجهة المستخدم
  final title = "لوحة فنية زهرية زرقاء مرسومة يدويا";
  final description = "وصف العمل الفني";
  final price = 100;
  final category = "رسم"; // اسم الفئة كما يظهر في الواجهة
  
  // قائمة ملفات الصور (من 1 إلى 5 صور)
  final List<File> imageFiles = [
    File('/path/to/image1.jpg'),
    File('/path/to/image2.jpg'),
    File('/path/to/image3.jpg'),
  ];

  // إنشاء multipart request
  final request = http.MultipartRequest(
    'POST',
    Uri.parse('https://arthub-backend.up.railway.app/api/artworks'),
  );

  // إضافة headers
  request.headers['Authorization'] = 'Bearer $token';
  request.headers['Content-Type'] = 'multipart/form-data';

  // إضافة البيانات النصية حسب واجهة المستخدم
  request.fields['title'] = title;
  request.fields['description'] = description;
  request.fields['price'] = price.toString();
  request.fields['category'] = category; // اسم الفئة كـ string

  // إضافة ملفات الصور
  for (int i = 0; i < imageFiles.length; i++) {
    final file = imageFiles[i];
    final stream = http.ByteStream(file.openRead());
    final length = await file.length();
    
    final multipartFile = http.MultipartFile(
      'images', // اسم الحقل في الـ backend
      stream,
      length,
      filename: 'artwork_${DateTime.now().millisecondsSinceEpoch}_$i.jpg',
    );
    
    request.files.add(multipartFile);
  }

  // إرسال الطلب
  try {
    final response = await request.send();
    final responseData = await response.stream.bytesToString();
    
    if (response.statusCode == 201) {
      print('✅ تم إنشاء العمل الفني بنجاح');
      print(responseData);
    } else {
      print('❌ فشل في إنشاء العمل الفني');
      print(responseData);
    }
  } catch (e) {
    print('❌ خطأ في الاتصال: $e');
  }
}
```

### مثال باستخدام Dio (الأفضل)

```dart
import 'package:dio/dio.dart';

Future<void> createArtworkWithDio() async {
  final dio = Dio();
  
  // إعداد البيانات حسب واجهة المستخدم
  final formData = FormData.fromMap({
    'title': 'لوحة فنية زهرية زرقاء مرسومة يدويا',
    'description': 'وصف العمل الفني',
    'price': 100,
    'category': 'رسم', // اسم الفئة
  });

  // إضافة الصور (من 1 إلى 5 صور)
  final List<File> images = [
    File('/path/to/image1.jpg'),
    File('/path/to/image2.jpg'),
  ];

  for (int i = 0; i < images.length; i++) {
    formData.files.add(
      MapEntry(
        'images',
        await MultipartFile.fromFile(
          images[i].path,
          filename: 'artwork_${DateTime.now().millisecondsSinceEpoch}_$i.jpg',
        ),
      ),
    );
  }

  try {
    final response = await dio.post(
      'https://arthub-backend.up.railway.app/api/artworks',
      data: formData,
      options: Options(
        headers: {
          'Authorization': 'Bearer $token',
        },
        sendTimeout: Duration(seconds: 30),
        receiveTimeout: Duration(seconds: 30),
      ),
      onSendProgress: (sent, total) {
        final progress = sent / total;
        print('Upload progress: ${(progress * 100).toStringAsFixed(1)}%');
      },
    );

    if (response.statusCode == 201) {
      print('✅ تم إنشاء العمل الفني بنجاح');
      print(response.data);
    }
  } catch (e) {
    print('❌ خطأ: $e');
  }
}
```

## 📝 تفاصيل API

### Endpoint
```
POST /api/artworks
```

### Headers المطلوبة
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

### البيانات المطلوبة

```dart
// البيانات النصية
title: String (مطلوب) - عنوان العمل الفني
description: String (اختياري) - وصف العمل الفني
price: int (مطلوب) - السعر بالدولار
category: String (مطلوب) - اسم الفئة (مثل: "رسم")

// ملفات الصور
images: List<File> (مطلوب) - من 1 إلى 5 صور
```

## ✅ الاستجابة الناجحة

```json
{
  "success": true,
  "message": "تم إنشاء العمل الفني بنجاح",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "title": "لوحة فنية زهرية زرقاء مرسومة يدويا",
    "description": "وصف العمل الفني",
    "price": 100,
    "category": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "رسم"
    },
    "artist": {
      "_id": "507f1f77bcf86cd799439013",
      "displayName": "أحمد محمد"
    },
    "image": "https://res.cloudinary.com/demo/image/upload/v1234567890/artwork_main.jpg",
    "images": [
      "https://res.cloudinary.com/demo/image/upload/v1234567890/artwork1.jpg",
      "https://res.cloudinary.com/demo/image/upload/v1234567890/artwork2.jpg"
    ],
    "status": "available",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

## ❌ الأخطاء المحتملة

### 1. خطأ في الصور
```json
{
  "success": false,
  "message": "يجب إضافة صورة واحدة على الأقل للعمل الفني",
  "data": null
}
```

### 2. خطأ في عدد الصور
```json
{
  "success": false,
  "message": "يمكن إضافة 5 صور على الأكثر",
  "data": null
}
```

### 3. خطأ في نوع الملف
```json
{
  "success": false,
  "message": "نوع الملف غير مدعوم",
  "data": null
}
```

### 4. خطأ في الفئة
```json
{
  "success": false,
  "message": "الفئة المحددة غير موجودة",
  "data": null
}
```

## 🔧 أنواع الملفات المدعومة

- **PNG** (.png)
- **JPEG** (.jpg, .jpeg)
- **GIF** (.gif)
- **WebP** (.webp)
- **SVG** (.svg)
- **BMP** (.bmp)
- **TIFF** (.tiff)

## 📏 قيود الصور

- **الحد الأقصى:** 5 صور لكل عمل فني (كما يظهر في الواجهة)
- **الحد الأدنى:** صورة واحدة على الأقل
- **الحجم:** يفضل أقل من 10MB لكل صورة
- **الأبعاد:** سيتم تحسين الصور تلقائياً إلى 1920x1080

## 💡 نصائح للـ Flutter

### 1. اختيار الصور
```dart
import 'package:image_picker/image_picker.dart';

Future<List<File>> pickImages() async {
  final ImagePicker picker = ImagePicker();
  final List<XFile> images = await picker.pickMultiImage(
    maxWidth: 1920,
    maxHeight: 1080,
    imageQuality: 85,
  );
  
  return images.map((xFile) => File(xFile.path)).toList();
}
```

### 2. عرض تقدم الرفع
```dart
void showUploadProgress(double progress) {
  // عرض progress bar كما يظهر في الواجهة
  print('تحميل ... ${(progress * 100).toStringAsFixed(1)}%');
}
```

### 3. معالجة الأخطاء
```dart
void handleUploadError(String error) {
  // عرض رسالة خطأ للمستخدم
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(error)),
  );
}
```

### 4. مثال كامل مع State Management
```dart
class ArtworkService {
  final Dio _dio = Dio();
  
  Future<ArtworkResponse> createArtwork({
    required String title,
    required String description,
    required int price,
    required String category,
    required List<File> images,
    required String token,
    Function(double)? onProgress,
  }) async {
    try {
      final formData = FormData.fromMap({
        'title': title,
        'description': description,
        'price': price,
        'category': category, // اسم الفئة كـ string
      });

      for (int i = 0; i < images.length; i++) {
        formData.files.add(
          MapEntry(
            'images',
            await MultipartFile.fromFile(
              images[i].path,
              filename: 'artwork_${DateTime.now().millisecondsSinceEpoch}_$i.jpg',
            ),
          ),
        );
      }

      final response = await _dio.post(
        'https://arthub-backend.up.railway.app/api/artworks',
        data: formData,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
          sendTimeout: Duration(seconds: 30),
          receiveTimeout: Duration(seconds: 30),
        ),
        onSendProgress: (sent, total) {
          if (onProgress != null) {
            onProgress(sent / total);
          }
        },
      );

      return ArtworkResponse.fromJson(response.data);
    } catch (e) {
      throw ArtworkException('فشل في إنشاء العمل الفني: $e');
    }
  }
}
```

## 🎯 التوصية

**استخدم Dio** لأنه:
- ✅ يدعم progress tracking (كما يظهر في الواجهة)
- ✅ يدعم timeout configuration
- ✅ يدعم retry logic
- ✅ أكثر استقراراً
- ✅ يتطابق مع منطق الواجهة

## 📦 الـ Dependencies المطلوبة

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # للـ HTTP requests
  dio: ^5.4.0
  
  # لاختيار الصور
  image_picker: ^1.0.4
  
  # للـ state management
  provider: ^6.1.1
  
  # للـ JSON parsing
  json_annotation: ^4.8.1

dev_dependencies:
  build_runner: ^2.4.7
  json_serializable: ^6.7.1
```

---

## 🚨 **الحل النهائي لمشكلة Flutter Upload**

### **المشكلة الأساسية:**
- الـ Flutter بيقف عند `dio.postData` ولا يكمل
- الـ backend بيستقبل FormData فارغ
- الـ DioHelper.postData مش شغال بشكل صحيح

### **الحل النهائي:**

#### **1. تصحيح الـ AddArtworkCubit:**

```dart
import 'dart:io';
import 'package:dio/dio.dart';
import 'package:art_hub/core/utils/error_handler.dart';
import 'package:art_hub/features/add_artwork/data/add_artwork_model/add_artwork_model.dart';
import 'package:art_hub/services/secure_storage.dart';
import 'package:bloc/bloc.dart';
import 'package:equatable/equatable.dart';

part 'add_artwork_state.dart';

class AddArtworkCubit extends Cubit<AddArtworkState> {
  AddArtworkCubit() : super(AddArtworkInitial());
  
  Future<void> addArtwork({
    required String title,
    required int price,
    required String category,
    required File imageFile,
  }) async {
    emit(AddArtworkLoading());
    try {
      final token = await SecureStorage().getAccessToken();
      
      // التحقق من الـ token
      if (token == null || token.isEmpty) {
        emit(AddArtworkFailure('Token غير صحيح'));
        return;
      }
      
      print('🔑 Token exists:', token.isNotEmpty);
      
      // إنشاء Dio مباشرة
      final dio = Dio();
      
      // إنشاء FormData
      final formData = FormData.fromMap({
        'title': title.trim(),
        'price': price.toString(),
        'category': category.trim(),
      });

      // إضافة الصورة
      formData.files.add(
        MapEntry(
          'images',
          await MultipartFile.fromFile(
            imageFile.path,
            filename: 'artwork_${DateTime.now().millisecondsSinceEpoch}.jpg',
          ),
        ),
      );

      // طباعة البيانات للتأكد
      formData.fields.forEach((f) => print('FIELD: ${f.key} = ${f.value}'));
      formData.files.forEach((f) => print('FILE: ${f.key} = ${f.value.filename}'));

      print('📤 Sending request to: https://arthub-backend.up.railway.app/api/artworks');
      
      // إرسال الطلب مباشرة
      final response = await dio.post(
        'https://arthub-backend.up.railway.app/api/artworks',
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
          sendTimeout: Duration(seconds: 30),
          receiveTimeout: Duration(seconds: 30),
        ),
      );

      print('📥 Response received:', response.statusCode);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = AddArtworkModel.fromJson(response.data);
        if (data.success == true && data.data != null) {
          emit(AddArtworkSuccess(data.data!));
        } else {
          emit(AddArtworkFailure(
            data.message ?? 'حدث خطأ أثناء إضافة العمل الفني',
          ));
        }
      } else {
        emit(AddArtworkFailure(
          'حدث خطأ أثناء إضافة العمل الفني: ${response.data['message'] ?? 'غير معروف'}',
        ));
      }
    } catch (e, stackTrace) {
      print('❌ Error in addArtwork:', e);
      print('❌ Error type:', e.runtimeType);
      
      ErrorHandler.logError('AddArtworkCubit.addArtwork', e, stackTrace);
      
      final errorMessage = e is DioException
          ? e.message ?? 'Network error occurred'
          : 'Unexpected error occurred';

      emit(AddArtworkFailure(errorMessage));
    }
  }
}
```

#### **2. تصحيح الـ API Constants:**

```dart
class ApiConstant {
  // استخدم الـ URL الكامل
  static const String artWorks = 'https://arthub-backend.up.railway.app/api/artworks';
  static const String categories = 'https://arthub-backend.up.railway.app/api/categories';
  // ... باقي الـ endpoints
}
```

#### **3. تصحيح الـ AddArtworkScreen:**

```dart
// في الـ _buildPublishButton method
Widget _buildPublishButton() {
  return SizedBox(
    width: double.infinity,
    child: ElevatedButton(
      onPressed: () async {
        if (_selectedImage == null ||
            artworkController.text.isEmpty ||
            priceController.text.isEmpty ||
            _selectedCategory == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Please fill all fields')),
          );
          return;
        }

        // تحويل السعر إلى int
        final price = int.tryParse(priceController.text);
        if (price == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('السعر غير صحيح')),
          );
          return;
        }

        context.read<AddArtworkCubit>().addArtwork(
          title: artworkController.text,
          price: price,
          category: _selectedCategory!,
          imageFile: _selectedImage!,
        );
      },
      style: ElevatedButton.styleFrom(
        backgroundColor: ColorsManagers.ceil,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
      child: Text(
        'نشر العمل',
        style: TextStyles.font16WhiteW500Tajawal(context),
      ),
    ),
  );
}
```

#### **4. إضافة Error Handling شامل:**

```dart
// في الـ BlocConsumer
BlocConsumer<AddArtworkCubit, AddArtworkState>(
  listener: (context, state) {
    if (state is AddArtworkSuccess) {
      showDialog(
        context: context,
        builder: (_) => SuccessDialog(message: 'تم نشر عملك بنجاح!'),
      );
      // تنظيف الحقول
      artworkController.clear();
      priceController.clear();
      setState(() {
        _selectedImage = null;
        _selectedCategory = null;
      });
    } else if (state is AddArtworkFailure) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.error),
          backgroundColor: Colors.red,
          duration: Duration(seconds: 5),
        ),
      );
    }
  },
  builder: (context, state) {
    return Scaffold(
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ... باقي الـ UI
                
                // Publish Button مع loading state
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: state is AddArtworkLoading 
                        ? null 
                        : () async {
                            // ... نفس الكود السابق
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: ColorsManagers.ceil,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: state is AddArtworkLoading
                        ? CircularProgressIndicator(color: Colors.white)
                        : Text(
                            'نشر العمل',
                            style: TextStyles.font16WhiteW500Tajawal(context),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  },
)
```

#### **5. التأكد من الـ Dependencies:**

```yaml
# في pubspec.yaml
dependencies:
  flutter:
    sdk: flutter
  
  # للـ HTTP requests
  dio: ^5.4.0
  
  # لاختيار الصور
  image_picker: ^1.0.4
  
  # للـ state management
  flutter_bloc: ^8.1.3
  equatable: ^2.0.5
  
  # للـ secure storage
  flutter_secure_storage: ^9.0.0
```

#### **6. اختبار الـ endpoint:**

```dart
// أضف هذا method للاختبار
Future<void> testEndpoint() async {
  try {
    final token = await SecureStorage().getAccessToken();
    final dio = Dio();
    
    // اختبار بسيط
    final response = await dio.get(
      'https://arthub-backend.up.railway.app/api/categories',
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
      ),
    );
    
    print('✅ Test successful:', response.statusCode);
  } catch (e) {
    print('❌ Test failed:', e);
  }
}
```

## 🎯 **الخطوات المطلوبة:**

1. **استبدل الـ AddArtworkCubit** بالكود الجديد
2. **تأكد من الـ API Constants** تستخدم الـ URL الكامل
3. **أضف الـ error handling** الشامل
4. **اختبر الـ endpoint** أولاً
5. **جرب الـ upload** مع الصور

**هذا الحل يتجاوز الـ DioHelper تماماً ويستخدم Dio مباشرة، مما يحل مشكلة الـ network request!** 🚀

---

**تاريخ التحديث:** يناير 2024  
**المطور:** فريق ArtHub  
**الإصدار:** 1.0.1 