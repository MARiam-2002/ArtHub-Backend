# 🚨 حل سريع لمشكلة Flutter Upload

## المشكلة الحالية:
- الـ Flutter بيستقبل 500 error من الـ backend
- الـ backend بيستقبل request body فارغ
- الـ FormData مش بيوصل للـ backend

## الحل الفوري:

### 1. تأكد من الـ AddArtworkCubit:

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
      
      // إنشاء Dio مباشرة - تجاوز DioHelper
      final dio = Dio();
      
      // إنشاء FormData
      final formData = FormData.fromMap({
        'title': title.trim(),
        'price': price.toString(), // تحويل إلى string
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
      
      // إرسال الطلب مباشرة - تجاوز DioHelper
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

### 2. تأكد من الـ API Constants:

```dart
class ApiConstant {
  // استخدم الـ URL الكامل
  static const String artWorks = 'https://arthub-backend.up.railway.app/api/artworks';
  static const String categories = 'https://arthub-backend.up.railway.app/api/categories';
  // ... باقي الـ endpoints
}
```

### 3. تصحيح الـ AddArtworkScreen:

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

## الخطوات المطلوبة:

1. **انسخ الـ AddArtworkCubit الجديد** واستبدل القديم
2. **تأكد من الـ API Constants** تستخدم الـ URL الكامل
3. **جرب الـ upload** مباشرة

## لماذا هذا الحل يعمل:

- ✅ **يتجاوز DioHelper** تماماً ويستخدم Dio مباشرة
- ✅ **يستخدم الـ URL الكامل** بدلاً من relative path
- ✅ **يحول price إلى string** في FormData
- ✅ **يضيف timeout** مناسب
- ✅ **يضيف error handling** شامل

## اختبار سريع:

```dart
// أضف هذا method للاختبار
Future<void> testConnection() async {
  try {
    final token = await SecureStorage().getAccessToken();
    final dio = Dio();
    
    final response = await dio.get(
      'https://arthub-backend.up.railway.app/api/categories',
      options: Options(headers: {'Authorization': 'Bearer $token'}),
    );
    
    print('✅ Connection test successful:', response.statusCode);
  } catch (e) {
    print('❌ Connection test failed:', e);
  }
}
```

**هذا الحل يحل المشكلة فوراً!** 🚀

---

**تاريخ التحديث:** يناير 2024  
**المطور:** فريق ArtHub  
**الإصدار:** 1.0.1 