# حل مشكلة رفع الملفات في Flutter Chat

## المشكلة

بناءً على رسائل الخطأ التي قدمتها، يبدو أن هناك مشكلة في إرسال الملفات باستخدام `FormData` في Flutter. الخطأ يظهر كـ `DioExceptionType.unknown` مع عدم وجود معلومات إضافية عن الخطأ.

## الحل المباشر لرفع الملفات

بعد تحليل الكود الخاص بالباك إند والمشكلة التي تواجهها، إليك الحل المباشر لإرسال الملفات:

### 1. استخدام FormData بشكل صحيح لرفع الملفات

```dart
Future<void> sendFileMessage({
  required String chatId,
  required File file,
  String? content,
  required String messageType, // 'image', 'file', 'voice', etc.
}) async {
  try {
    final token = await CacheServices.instance.getAccessToken();
    final dio = Dio();
    
    // إنشاء FormData بشكل صحيح
    final formData = FormData();
    
    // إضافة الملف تحت اسم الحقل 'files'
    final fileName = file.path.split('/').last;
    final fileExtension = fileName.split('.').last.toLowerCase();
    
    // إضافة الملف إلى FormData
    formData.files.add(
      MapEntry(
        'files', // اسم الحقل يجب أن يكون 'files' وليس 'files[0]' أو 'file'
        await MultipartFile.fromFile(
          file.path,
          filename: fileName,
        ),
      ),
    );
    
    // إضافة الحقول الأخرى
    if (content != null && content.isNotEmpty) {
      formData.fields.add(MapEntry('content', content));
    }
    
    formData.fields.add(MapEntry('messageType', messageType));
    
    // طباعة معلومات الطلب للتشخيص
    print("Sending to: ${ApiConstant.baseUrl}/chat/$chatId/send");
    print("FormData fields: ${formData.fields}");
    print("FormData files: ${formData.files}");
    
    // إرسال الطلب
    final response = await dio.post(
      "${ApiConstant.baseUrl}/chat/$chatId/send", // استخدام URL كامل
      data: formData,
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        // لا تحدد Content-Type يدويًا
      ),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final messageJson = response.data['data']['message'];
      final message = Message.fromJson(messageJson);
      _messages.add(message);
      emit(ChatLoaded(List.from(_messages)));
    }
  } catch (error) {
    // معالجة الخطأ
    print("Error sending file message: $error");
    if (error is DioException) {
      print("Dio Error Type: ${error.type}");
      print("Dio Error Message: ${error.message}");
      print("Response Status Code: ${error.response?.statusCode}");
      print("Response Data: ${error.response?.data}");
      print("Request Data: ${error.requestOptions.data}");
      print("Request Headers: ${error.requestOptions.headers}");
      print("Request Path: ${error.requestOptions.path}");
    }
    emit(ChatError(error.toString()));
  }
}
```

### 2. إرسال ملفات متعددة

إذا كنت بحاجة إلى إرسال ملفات متعددة في نفس الوقت:

```dart
Future<void> sendMultipleFilesMessage({
  required String chatId,
  required List<File> files,
  String? content,
  required String messageType, // 'image', 'file', 'voice', etc.
}) async {
  try {
    final token = await CacheServices.instance.getAccessToken();
    final dio = Dio();
    
    // إنشاء FormData بشكل صحيح
    final formData = FormData();
    
    // إضافة الملفات تحت اسم الحقل 'files'
    for (final file in files) {
      final fileName = file.path.split('/').last;
      
      // إضافة كل ملف إلى FormData تحت نفس اسم الحقل 'files'
      formData.files.add(
        MapEntry(
          'files', // اسم الحقل يجب أن يكون 'files' لجميع الملفات
          await MultipartFile.fromFile(
            file.path,
            filename: fileName,
          ),
        ),
      );
    }
    
    // إضافة الحقول الأخرى
    if (content != null && content.isNotEmpty) {
      formData.fields.add(MapEntry('content', content));
    }
    
    formData.fields.add(MapEntry('messageType', messageType));
    
    // طباعة معلومات الطلب للتشخيص
    print("Sending to: ${ApiConstant.baseUrl}/chat/$chatId/send");
    print("FormData fields: ${formData.fields}");
    print("FormData files count: ${formData.files.length}");
    
    // إرسال الطلب
    final response = await dio.post(
      "${ApiConstant.baseUrl}/chat/$chatId/send", // استخدام URL كامل
      data: formData,
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        // لا تحدد Content-Type يدويًا
      ),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final messageJson = response.data['data']['message'];
      final message = Message.fromJson(messageJson);
      _messages.add(message);
      emit(ChatLoaded(List.from(_messages)));
    }
  } catch (error) {
    // معالجة الخطأ
    print("Error sending multiple files message: $error");
    if (error is DioException) {
      print("Dio Error Type: ${error.type}");
      print("Dio Error Message: ${error.message}");
      print("Response Status Code: ${error.response?.statusCode}");
      print("Response Data: ${error.response?.data}");
      print("Request Data: ${error.requestOptions.data}");
      print("Request Headers: ${error.requestOptions.headers}");
      print("Request Path: ${error.requestOptions.path}");
    }
    emit(ChatError(error.toString()));
  }
}
```

## المشاكل المحتملة وحلولها

### 1. مشكلة URL غير كامل

من الـ logs التي قدمتها، يبدو أن الطلب يتم إرساله إلى مسار نسبي `chat/688d4382905eb9af43d9d882/send` بدلاً من URL كامل. تأكد من استخدام URL كامل:

```dart
// ❌ خطأ
final response = await dio.post(
  "chat/$chatId/send", // مسار نسبي
  data: formData,
  // ...
);

// ✅ صحيح
final response = await dio.post(
  "${ApiConstant.baseUrl}/chat/$chatId/send", // URL كامل
  data: formData,
  // ...
);
```

### 2. مشكلة اسم حقل الملفات

تأكد من استخدام اسم الحقل الصحيح للملفات. الباك إند يتوقع أن تكون الملفات تحت اسم الحقل `'files'`:

```dart
// ❌ خطأ
formData.files.add(
  MapEntry(
    'file', // اسم حقل خاطئ
    await MultipartFile.fromFile(file.path, filename: fileName),
  ),
);

// ❌ خطأ
formData.files.add(
  MapEntry(
    'files[0]', // اسم حقل خاطئ
    await MultipartFile.fromFile(file.path, filename: fileName),
  ),
);

// ✅ صحيح
formData.files.add(
  MapEntry(
    'files', // اسم الحقل الصحيح
    await MultipartFile.fromFile(file.path, filename: fileName),
  ),
);
```

### 3. مشكلة Content-Type

لا تحدد `Content-Type` يدويًا عند استخدام FormData. دع Dio يحدده تلقائيًا:

```dart
// ❌ خطأ
options: Options(
  headers: {
    'Authorization': 'Bearer $token',
    'Content-Type': 'multipart/form-data', // لا تحدد هذا يدويًا
  },
),

// ✅ صحيح
options: Options(
  headers: {
    'Authorization': 'Bearer $token',
  },
),
```

### 4. مشكلة حقول FormData

من الـ logs، يبدو أنك تضيف حقل `chatId` و `receiverId` إلى FormData، بينما `chatId` موجود بالفعل في URL. تأكد من إرسال الحقول الصحيحة فقط:

```dart
// ❌ خطأ
formData.fields.addAll([
  MapEntry('chatId', chatId), // غير ضروري لأنه موجود في URL
  MapEntry('receiverId', receiverId), // قد لا يكون مطلوبًا في الباك إند
  MapEntry('messageType', messageType),
]);

// ✅ صحيح
formData.fields.addAll([
  MapEntry('messageType', messageType),
]);
```

## نموذج كامل لخدمة الدردشة

```dart
import 'package:dio/dio.dart';
import 'dart:io';

class ChatService {
  final Dio _dio;
  
  ChatService() : _dio = Dio() {
    _dio.options.baseUrl = ApiConstant.baseUrl;
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 30);
    
    // إضافة interceptor للتشخيص
    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
      error: true,
    ));
  }
  
  // إرسال رسالة نصية
  Future<Message> sendTextMessage({
    required String chatId,
    required String content,
  }) async {
    try {
      final token = await CacheServices.instance.getAccessToken();
      
      // استخدام JSON للرسائل النصية
      final response = await _dio.post(
        "/chat/$chatId/send",
        data: {
          "content": content,
          "messageType": "text"
        },
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
            'Content-Type': 'application/json'
          },
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final messageJson = response.data['data']['message'];
        return Message.fromJson(messageJson);
      } else {
        throw Exception(response.data['message'] ?? "Failed to send message");
      }
    } catch (error) {
      _logError("text message", error);
      rethrow;
    }
  }
  
  // إرسال ملف واحد
  Future<Message> sendFileMessage({
    required String chatId,
    required File file,
    String? content,
    required String messageType, // 'image', 'file', 'voice', etc.
  }) async {
    try {
      final token = await CacheServices.instance.getAccessToken();
      
      // إنشاء FormData
      final formData = FormData();
      
      // إضافة الملف
      final fileName = file.path.split('/').last;
      formData.files.add(
        MapEntry(
          'files', // اسم الحقل الصحيح
          await MultipartFile.fromFile(
            file.path,
            filename: fileName,
          ),
        ),
      );
      
      // إضافة الحقول الأخرى
      if (content != null && content.isNotEmpty) {
        formData.fields.add(MapEntry('content', content));
      }
      
      formData.fields.add(MapEntry('messageType', messageType));
      
      // إرسال الطلب
      final response = await _dio.post(
        "/chat/$chatId/send",
        data: formData,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final messageJson = response.data['data']['message'];
        return Message.fromJson(messageJson);
      } else {
        throw Exception(response.data['message'] ?? "Failed to send file");
      }
    } catch (error) {
      _logError("file message", error);
      rethrow;
    }
  }
  
  // إرسال ملفات متعددة
  Future<Message> sendMultipleFilesMessage({
    required String chatId,
    required List<File> files,
    String? content,
    required String messageType, // 'image', 'file', 'voice', etc.
  }) async {
    try {
      final token = await CacheServices.instance.getAccessToken();
      
      // إنشاء FormData
      final formData = FormData();
      
      // إضافة الملفات
      for (final file in files) {
        final fileName = file.path.split('/').last;
        formData.files.add(
          MapEntry(
            'files', // اسم الحقل الصحيح لجميع الملفات
            await MultipartFile.fromFile(
              file.path,
              filename: fileName,
            ),
          ),
        );
      }
      
      // إضافة الحقول الأخرى
      if (content != null && content.isNotEmpty) {
        formData.fields.add(MapEntry('content', content));
      }
      
      formData.fields.add(MapEntry('messageType', messageType));
      
      // إرسال الطلب
      final response = await _dio.post(
        "/chat/$chatId/send",
        data: formData,
        options: Options(
          headers: {'Authorization': 'Bearer $token'},
        ),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final messageJson = response.data['data']['message'];
        return Message.fromJson(messageJson);
      } else {
        throw Exception(response.data['message'] ?? "Failed to send files");
      }
    } catch (error) {
      _logError("multiple files message", error);
      rethrow;
    }
  }
  
  // طباعة معلومات الخطأ للتشخيص
  void _logError(String messageType, dynamic error) {
    print("Error sending $messageType: $error");
    if (error is DioException) {
      print("Dio Error Type: ${error.type}");
      print("Dio Error Message: ${error.message}");
      print("Response Status Code: ${error.response?.statusCode}");
      print("Response Data: ${error.response?.data}");
      print("Request Data: ${error.requestOptions.data}");
      print("Request Headers: ${error.requestOptions.headers}");
      print("Request Path: ${error.requestOptions.path}");
    }
  }
}
```

## خطوات التشخيص الإضافية

1. **تحقق من الاتصال بالإنترنت**: تأكد من أن الجهاز متصل بالإنترنت.

2. **تحقق من صحة التوكن**: تأكد من أن التوكن صالح وغير منتهي الصلاحية.

3. **تحقق من URL الصحيح**: تأكد من استخدام URL الصحيح للخادم.

4. **اختبار الـ API باستخدام Postman**: جرب إرسال طلب باستخدام Postman للتأكد من أن الـ API يعمل بشكل صحيح.

5. **تحديث إصدار Dio**: تأكد من استخدام أحدث إصدار من Dio.

6. **تحقق من حجم الملف**: تأكد من أن حجم الملف لا يتجاوز الحد المسموح به (10MB في الباك إند).

7. **تحقق من نوع الملف**: تأكد من أن نوع الملف مدعوم في الباك إند (صور، مستندات، صوت، فيديو).

## ملخص

المشكلة الرئيسية قد تكون في:

1. استخدام URL نسبي بدلاً من URL كامل.
2. استخدام اسم حقل خاطئ للملفات (يجب استخدام 'files').
3. تعيين Content-Type يدويًا بدلاً من ترك Dio يحدده تلقائيًا.
4. إرسال حقول غير ضرورية في FormData.

جرب الحلول المقترحة أعلاه وراقب الـ logs للتشخيص الإضافي.