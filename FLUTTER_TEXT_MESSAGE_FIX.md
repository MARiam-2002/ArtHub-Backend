# حل مشكلة إرسال الرسائل النصية في Flutter Chat

## المشكلة

بناءً على رسائل الخطأ التي قدمتها، يبدو أن هناك مشكلة في إرسال الرسائل النصية البسيطة باستخدام `FormData` في Flutter. الخطأ يظهر كـ `DioExceptionType.unknown` مع عدم وجود معلومات إضافية عن الخطأ.

## الحل المباشر

بعد تحليل الكود الخاص بالباك إند والمشكلة التي تواجهها، إليك الحل المباشر لإرسال الرسائل النصية:

### 1. استخدام JSON بدلاً من FormData للرسائل النصية

للرسائل النصية البسيطة، من الأفضل استخدام JSON بدلاً من FormData:

```dart
Future<void> sendTextMessage({
  required String chatId,
  required String content,
  required String receiverId,
}) async {
  try {
    final token = await CacheServices.instance.getAccessToken();
    final dio = Dio();
    
    // استخدام JSON بدلاً من FormData للرسائل النصية
    final response = await dio.post(
      "${ApiConstant.baseUrl}/chat/$chatId/send",
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
      final message = Message.fromJson(messageJson);
      _messages.add(message);
      emit(ChatLoaded(List.from(_messages)));
    }
  } catch (error) {
    // معالجة الخطأ
    print("Error sending text message: $error");
    if (error is DioException) {
      print("Dio Error Type: ${error.type}");
      print("Dio Error Message: ${error.message}");
      print("Response Status Code: ${error.response?.statusCode}");
      print("Response Data: ${error.response?.data}");
    }
    emit(ChatError(error.toString()));
  }
}
```

### 2. إذا كنت تفضل استخدام FormData للرسائل النصية

إذا كنت تفضل استخدام FormData حتى للرسائل النصية، فتأكد من استخدامه بشكل صحيح:

```dart
Future<void> sendTextMessage({
  required String chatId,
  required String content,
}) async {
  try {
    final token = await CacheServices.instance.getAccessToken();
    final dio = Dio();
    
    // إنشاء FormData بشكل صحيح
    final formData = FormData.fromMap({
      "content": content,
      "messageType": "text"
    });
    
    // طباعة معلومات الطلب للتشخيص
    print("Sending to: ${ApiConstant.baseUrl}/chat/$chatId/send");
    print("FormData fields: ${formData.fields}");
    
    // إرسال الطلب
    final response = await dio.post(
      "${ApiConstant.baseUrl}/chat/$chatId/send",
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
    print("Error sending text message: $error");
    if (error is DioException) {
      print("Dio Error Type: ${error.type}");
      print("Dio Error Message: ${error.message}");
      print("Response Status Code: ${error.response?.statusCode}");
      print("Response Data: ${error.response?.data}");
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

### 2. مشكلة تكوين Dio

تأكد من تكوين Dio بشكل صحيح:

```dart
Dio configureDio() {
  final dio = Dio();
  
  // تكوين الخيارات الأساسية
  dio.options.baseUrl = ApiConstant.baseUrl;
  dio.options.connectTimeout = const Duration(seconds: 30);
  dio.options.receiveTimeout = const Duration(seconds: 30);
  
  // إضافة interceptors للتشخيص
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    error: true,
  ));
  
  return dio;
}
```

### 3. مشكلة حقول FormData

من الـ logs، يبدو أنك تضيف حقل `chatId` و `receiverId` إلى FormData، بينما `chatId` موجود بالفعل في URL. تأكد من إرسال الحقول الصحيحة فقط:

```dart
// ❌ خطأ
formData.fields.addAll([
  MapEntry('chatId', chatId), // غير ضروري لأنه موجود في URL
  MapEntry('receiverId', receiverId), // قد لا يكون مطلوبًا في الباك إند
  MapEntry('messageType', 'text'),
  MapEntry('content', content),
]);

// ✅ صحيح
formData.fields.addAll([
  MapEntry('messageType', 'text'),
  MapEntry('content', content),
]);
```

### 4. مشكلة Content-Type

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

## نموذج كامل لإرسال الرسائل النصية

```dart
import 'package:dio/dio.dart';

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
      // معالجة الخطأ بشكل مفصل
      print("Error sending text message: $error");
      if (error is DioException) {
        print("Dio Error Type: ${error.type}");
        print("Dio Error Message: ${error.message}");
        print("Response Status Code: ${error.response?.statusCode}");
        print("Response Data: ${error.response?.data}");
      }
      rethrow;
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

6. **استخدام HTTP بدلاً من Dio للاختبار**: جرب استخدام package `http` بدلاً من Dio للتأكد من أن المشكلة ليست في Dio نفسه.

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> sendTextMessageWithHttp({
  required String chatId,
  required String content,
}) async {
  try {
    final token = await CacheServices.instance.getAccessToken();
    final url = Uri.parse("${ApiConstant.baseUrl}/chat/$chatId/send");
    
    final response = await http.post(
      url,
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json'
      },
      body: jsonEncode({
        "content": content,
        "messageType": "text"
      }),
    );

    print("Status Code: ${response.statusCode}");
    print("Response Body: ${response.body}");

    if (response.statusCode == 200 || response.statusCode == 201) {
      final messageJson = jsonDecode(response.body)['data']['message'];
      final message = Message.fromJson(messageJson);
      // معالجة الرسالة
    } else {
      // معالجة الخطأ
      print("Error: ${response.body}");
    }
  } catch (error) {
    print("Error sending text message with http: $error");
  }
}
```

## ملخص

المشكلة الرئيسية قد تكون في:

1. استخدام URL نسبي بدلاً من URL كامل.
2. إرسال حقول غير ضرورية في FormData.
3. تعيين Content-Type يدويًا بدلاً من ترك Dio يحدده تلقائيًا.
4. استخدام FormData للرسائل النصية بدلاً من JSON.

جرب الحلول المقترحة أعلاه وراقب الـ logs للتشخيص الإضافي.