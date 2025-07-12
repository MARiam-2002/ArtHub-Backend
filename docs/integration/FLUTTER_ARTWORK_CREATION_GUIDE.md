# دليل إنشاء الأعمال الفنية مع رفع الصور في Flutter

## نظرة عامة

يتم إنشاء الأعمال الفنية عبر endpoint واحد مع دعم رفع الصور:
- **Endpoint:** `POST /artworks`
- **Content-Type:** `multipart/form-data`
- **Authentication:** مطلوب (Bearer Token)

## المعاملات المطلوبة

### الحقول المطلوبة:
- `title` (string): عنوان العمل الفني
- `price` (number): سعر العمل الفني
- `category` (string): معرف الفئة
- `images` (files): صور العمل الفني (1-10 صور)

### الحقول الاختيارية:
- `description` (string): وصف العمل الفني
- `tags` (array): وسوم العمل الفني
- `status` (string): حالة العمل الفني (available, sold, reserved)
- `isFramed` (boolean): هل العمل مؤطر
- `dimensions` (object): أبعاد العمل الفني
- `materials` (array): المواد المستخدمة

## مثال Flutter (Dio)

```dart
import 'dart:io';
import 'package:dio/dio.dart';

class ArtworkService {
  final Dio _dio = Dio();
  
  Future<Map<String, dynamic>> createArtwork({
    required String title,
    required double price,
    required String categoryId,
    required List<File> images,
    String? description,
    List<String>? tags,
    String status = 'available',
    bool isFramed = false,
    Map<String, dynamic>? dimensions,
    List<String>? materials,
    required String token,
  }) async {
    try {
      // إعداد FormData
      final formData = FormData();
      
      // إضافة الحقول النصية
      formData.fields.addAll([
        MapEntry('title', title),
        MapEntry('price', price.toString()),
        MapEntry('category', categoryId),
        MapEntry('status', status),
        MapEntry('isFramed', isFramed.toString()),
      ]);
      
      // إضافة الوصف إذا وجد
      if (description != null) {
        formData.fields.add(MapEntry('description', description));
      }
      
      // إضافة الوسوم إذا وجدت
      if (tags != null && tags.isNotEmpty) {
        for (String tag in tags) {
          formData.fields.add(MapEntry('tags[]', tag));
        }
      }
      
      // إضافة الأبعاد إذا وجدت
      if (dimensions != null) {
        formData.fields.add(MapEntry('dimensions[width]', dimensions['width'].toString()));
        formData.fields.add(MapEntry('dimensions[height]', dimensions['height'].toString()));
        if (dimensions['depth'] != null) {
          formData.fields.add(MapEntry('dimensions[depth]', dimensions['depth'].toString()));
        }
      }
      
      // إضافة المواد إذا وجدت
      if (materials != null && materials.isNotEmpty) {
        for (String material in materials) {
          formData.fields.add(MapEntry('materials[]', material));
        }
      }
      
      // إضافة الصور
      for (int i = 0; i < images.length; i++) {
        formData.files.add(MapEntry(
          'images',
          await MultipartFile.fromFile(
            images[i].path,
            filename: 'artwork_image_$i.jpg',
          ),
        ));
      }
      
      // إرسال الطلب
      final response = await _dio.post(
        'https://your-api.com/artworks',
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
      
      return response.data;
    } catch (e) {
      if (e is DioException) {
        throw Exception('خطأ في إنشاء العمل الفني: ${e.response?.data?['message'] ?? e.message}');
      }
      throw Exception('خطأ غير متوقع: $e');
    }
  }
}
```

## مثال استخدام في UI

```dart
import 'dart:io';
import 'package:image_picker/image_picker.dart';

class CreateArtworkScreen extends StatefulWidget {
  @override
  _CreateArtworkScreenState createState() => _CreateArtworkScreenState();
}

class _CreateArtworkScreenState extends State<CreateArtworkScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  
  List<File> _selectedImages = [];
  String? _selectedCategoryId;
  bool _isLoading = false;
  
  final ArtworkService _artworkService = ArtworkService();
  
  Future<void> _pickImages() async {
    final ImagePicker picker = ImagePicker();
    final List<XFile> images = await picker.pickMultiImage(
      maxWidth: 1920,
      maxHeight: 1080,
      imageQuality: 85,
    );
    
    if (images.isNotEmpty) {
      setState(() {
        _selectedImages = images.map((xFile) => File(xFile.path)).toList();
      });
    }
  }
  
  Future<void> _createArtwork() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('يرجى اختيار صورة واحدة على الأقل')),
      );
      return;
    }
    if (_selectedCategoryId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('يرجى اختيار فئة للعمل الفني')),
      );
      return;
    }
    
    setState(() => _isLoading = true);
    
    try {
      final result = await _artworkService.createArtwork(
        title: _titleController.text,
        price: double.parse(_priceController.text),
        categoryId: _selectedCategoryId!,
        images: _selectedImages,
        description: _descriptionController.text,
        token: 'YOUR_AUTH_TOKEN',
      );
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم إنشاء العمل الفني بنجاح')),
      );
      
      Navigator.pop(context, result);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('إنشاء عمل فني جديد')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: EdgeInsets.all(16),
          children: [
            // حقل العنوان
            TextFormField(
              controller: _titleController,
              decoration: InputDecoration(
                labelText: 'عنوان العمل الفني *',
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'يرجى إدخال عنوان العمل الفني';
                }
                return null;
              },
            ),
            SizedBox(height: 16),
            
            // حقل الوصف
            TextFormField(
              controller: _descriptionController,
              decoration: InputDecoration(
                labelText: 'وصف العمل الفني',
                border: OutlineInputBorder(),
              ),
              maxLines: 3,
            ),
            SizedBox(height: 16),
            
            // حقل السعر
            TextFormField(
              controller: _priceController,
              decoration: InputDecoration(
                labelText: 'السعر *',
                border: OutlineInputBorder(),
                suffixText: 'ريال',
              ),
              keyboardType: TextInputType.number,
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return 'يرجى إدخال السعر';
                }
                if (double.tryParse(value) == null) {
                  return 'يرجى إدخال سعر صحيح';
                }
                return null;
              },
            ),
            SizedBox(height: 16),
            
            // اختيار الفئة
            DropdownButtonFormField<String>(
              value: _selectedCategoryId,
              decoration: InputDecoration(
                labelText: 'الفئة *',
                border: OutlineInputBorder(),
              ),
              items: [
                // قائمة الفئات من API
                DropdownMenuItem(value: '1', child: Text('لوحات فنية')),
                DropdownMenuItem(value: '2', child: Text('منحوتات')),
                // ... المزيد من الفئات
              ],
              onChanged: (value) {
                setState(() => _selectedCategoryId = value);
              },
              validator: (value) {
                if (value == null) {
                  return 'يرجى اختيار فئة';
                }
                return null;
              },
            ),
            SizedBox(height: 16),
            
            // اختيار الصور
            ElevatedButton.icon(
              onPressed: _pickImages,
              icon: Icon(Icons.photo_library),
              label: Text('اختيار الصور (${_selectedImages.length}/10)'),
            ),
            SizedBox(height: 8),
            
            // عرض الصور المختارة
            if (_selectedImages.isNotEmpty)
              Container(
                height: 120,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _selectedImages.length,
                  itemBuilder: (context, index) {
                    return Padding(
                      padding: EdgeInsets.only(right: 8),
                      child: Stack(
                        children: [
                          Image.file(
                            _selectedImages[index],
                            width: 100,
                            height: 120,
                            fit: BoxFit.cover,
                          ),
                          Positioned(
                            top: 4,
                            right: 4,
                            child: GestureDetector(
                              onTap: () {
                                setState(() {
                                  _selectedImages.removeAt(index);
                                });
                              },
                              child: Container(
                                padding: EdgeInsets.all(4),
                                decoration: BoxDecoration(
                                  color: Colors.red,
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(Icons.close, color: Colors.white, size: 16),
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
            SizedBox(height: 24),
            
            // زر الإنشاء
            ElevatedButton(
              onPressed: _isLoading ? null : _createArtwork,
              child: _isLoading
                  ? CircularProgressIndicator(color: Colors.white)
                  : Text('إنشاء العمل الفني'),
              style: ElevatedButton.styleFrom(
                minimumSize: Size(double.infinity, 50),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

## الرد من السيرفر

```json
{
  "success": true,
  "message": "تم إضافة العمل الفني بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "title": "لوحة فنية جميلة",
    "description": "وصف اللوحة الفنية",
    "images": [
      "https://res.cloudinary.com/demo/image/upload/v1612345678/artwork1.jpg",
      "https://res.cloudinary.com/demo/image/upload/v1612345678/artwork2.jpg"
    ],
    "price": 500.00,
    "category": {
      "_id": "60d0fe4f5311236168a109cb",
      "name": "لوحات فنية"
    },
    "artist": {
      "_id": "60d0fe4f5311236168a109cc",
      "displayName": "اسم الفنان",
      "profileImage": "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
    },
    "status": "available",
    "createdAt": "2023-05-15T10:30:45.123Z"
  }
}
```

## ملاحظات مهمة

1. **عدد الصور:** يمكن رفع 1-10 صور لكل عمل فني
2. **حجم الصور:** يفضل أن تكون الصور بجودة عالية ولكن بحجم معقول
3. **صيغ الصور:** يدعم JPG و PNG
4. **المصادقة:** يجب إرسال token المصادقة في header
5. **التحقق:** يتم التحقق من صحة البيانات على السيرفر

## معالجة الأخطاء

```dart
try {
  final result = await _artworkService.createArtwork(...);
} catch (e) {
  if (e.toString().contains('الفئة المحددة غير موجودة')) {
    // معالجة خطأ الفئة
  } else if (e.toString().contains('لديك عمل فني بنفس العنوان')) {
    // معالجة خطأ العنوان المكرر
  } else if (e.toString().contains('يجب إضافة صورة واحدة على الأقل')) {
    // معالجة خطأ الصور
  } else {
    // معالجة الأخطاء العامة
  }
}
``` 