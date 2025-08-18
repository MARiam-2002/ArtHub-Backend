# تكوين Dio بشكل صحيح في Flutter

## المشكلة

بناءً على رسائل الخطأ التي قدمتها، يبدو أن هناك مشكلة في تكوين Dio في تطبيق Flutter الخاص بك. الخطأ يظهر كـ `DioExceptionType.unknown` مع عدم وجود معلومات إضافية عن الخطأ، مما يشير إلى مشكلة في الاتصال الأساسي.

## الحل: تكوين Dio بشكل صحيح

### 1. إنشاء مثيل Dio مع التكوين الصحيح

```dart
import 'package:dio/dio.dart';

class DioClient {
  static Dio? _instance;

  static Dio get instance {
    if (_instance == null) {
      _instance = _createDio();
    }
    return _instance!;
  }

  static Dio _createDio() {
    final dio = Dio();

    // تكوين الخيارات الأساسية
    dio.options = BaseOptions(
      baseUrl: ApiConstant.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      validateStatus: (status) {
        return status != null && status < 500; // قبول أي رمز حالة أقل من 500
      },
    );

    // إضافة interceptors للتشخيص
    dio.interceptors.add(LogInterceptor(
      requestHeader: true,
      requestBody: true,
      responseHeader: true,
      responseBody: true,
      error: true,
      logPrint: (obj) => print(obj.toString()),
    ));

    // إضافة interceptor للتوكن
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // إضافة التوكن إلى الطلب
        final token = await CacheServices.instance.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) {
        // معالجة الأخطاء
        print("Dio Error Type: ${error.type}");
        print("Dio Error Message: ${error.message}");
        print("Response Status Code: ${error.response?.statusCode}");
        print("Response Data: ${error.response?.data}");
        print("Request Data: ${error.requestOptions.data}");
        print("Request Headers: ${error.requestOptions.headers}");
        print("Request Path: ${error.requestOptions.path}");

        // إعادة توجيه الخطأ
        return handler.next(error);
      },
    ));

    return dio;
  }
}
```

### 2. استخدام DioClient في الخدمات

```dart
class ChatService {
  final Dio _dio;

  ChatService() : _dio = DioClient.instance;

  // إرسال رسالة نصية
  Future<Message> sendTextMessage({
    required String chatId,
    required String content,
  }) async {
    try {
      // استخدام JSON للرسائل النصية
      final response = await _dio.post(
        "/chat/$chatId/send",
        data: {
          "content": content,
          "messageType": "text"
        },
        options: Options(
          contentType: Headers.jsonContentType,
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

## المشاكل المحتملة وحلولها

### 1. مشكلة URL غير صحيح

تأكد من أن `ApiConstant.baseUrl` يحتوي على URL صحيح وكامل للخادم:

```dart
class ApiConstant {
  // ❌ خطأ
  static const String baseUrl = "api.example.com"; // ينقص البروتوكول

  // ✅ صحيح
  static const String baseUrl = "https://api.example.com"; // URL كامل مع البروتوكول
}
```

### 2. مشكلة المسارات النسبية

تأكد من استخدام المسارات النسبية بشكل صحيح عند تكوين `baseUrl`:

```dart
// ❌ خطأ
static const String baseUrl = "https://api.example.com/api";
final response = await _dio.post(
  "/chat/$chatId/send", // سيصبح https://api.example.com/api/chat/$chatId/send
  data: formData,
);

// ✅ صحيح (الخيار 1)
static const String baseUrl = "https://api.example.com";
final response = await _dio.post(
  "/api/chat/$chatId/send", // سيصبح https://api.example.com/api/chat/$chatId/send
  data: formData,
);

// ✅ صحيح (الخيار 2)
static const String baseUrl = "https://api.example.com/api";
final response = await _dio.post(
  "chat/$chatId/send", // سيصبح https://api.example.com/api/chat/$chatId/send (بدون / في البداية)
  data: formData,
);
```

### 3. مشكلة CORS

إذا كنت تستخدم Flutter Web، تأكد من أن الخادم يسمح بطلبات CORS من مصدر تطبيقك:

```dart
// إضافة interceptor لطلبات CORS في Flutter Web
dio.interceptors.add(InterceptorsWrapper(
  onRequest: (options, handler) {
    options.headers['Access-Control-Allow-Origin'] = '*';
    return handler.next(options);
  },
));
```

### 4. مشكلة الشهادات في HTTPS

إذا كنت تستخدم HTTPS مع شهادة ذاتية التوقيع، قد تحتاج إلى تكوين Dio لقبول هذه الشهادات:

```dart
// قبول الشهادات ذاتية التوقيع (استخدم هذا في بيئة التطوير فقط)
dio.httpClientAdapter = IOHttpClientAdapter(
  createHttpClient: () {
    final client = HttpClient();
    client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
    return client;
  },
);
```

### 5. مشكلة Proxy

إذا كنت تستخدم proxy للتشخيص، تأكد من تكوينه بشكل صحيح:

```dart
// تكوين proxy للتشخيص
dio.httpClientAdapter = IOHttpClientAdapter(
  createHttpClient: () {
    final client = HttpClient();
    client.findProxy = (uri) {
      return "PROXY 192.168.1.100:8888"; // عنوان proxy الخاص بك
    };
    return client;
  },
);
```

## نموذج كامل لتكوين Dio

```dart
import 'package:dio/dio.dart';
import 'package:dio/io.dart';
import 'dart:io';

class DioClient {
  static Dio? _instance;

  static Dio get instance {
    if (_instance == null) {
      _instance = _createDio();
    }
    return _instance!;
  }

  static Dio _createDio() {
    final dio = Dio();

    // تكوين الخيارات الأساسية
    dio.options = BaseOptions(
      baseUrl: ApiConstant.baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 30),
      validateStatus: (status) {
        return status != null && status < 500; // قبول أي رمز حالة أقل من 500
      },
      headers: {
        'Accept': 'application/json',
      },
    );

    // إضافة interceptors للتشخيص
    if (kDebugMode) {
      dio.interceptors.add(LogInterceptor(
        requestHeader: true,
        requestBody: true,
        responseHeader: true,
        responseBody: true,
        error: true,
        logPrint: (obj) => print(obj.toString()),
      ));
    }

    // إضافة interceptor للتوكن
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // إضافة التوكن إلى الطلب
        final token = await CacheServices.instance.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (DioException error, handler) {
        // معالجة الأخطاء
        if (kDebugMode) {
          print("Dio Error Type: ${error.type}");
          print("Dio Error Message: ${error.message}");
          print("Response Status Code: ${error.response?.statusCode}");
          print("Response Data: ${error.response?.data}");
          print("Request Data: ${error.requestOptions.data}");
          print("Request Headers: ${error.requestOptions.headers}");
          print("Request Path: ${error.requestOptions.path}");
        }

        // معالجة أخطاء التوكن
        if (error.response?.statusCode == 401) {
          // تنفيذ تحديث التوكن أو تسجيل الخروج
        }

        // إعادة توجيه الخطأ
        return handler.next(error);
      },
    ));

    // تكوين HTTP Client للتعامل مع الشهادات (في بيئة التطوير فقط)
    if (kDebugMode) {
      dio.httpClientAdapter = IOHttpClientAdapter(
        createHttpClient: () {
          final client = HttpClient();
          client.badCertificateCallback = (X509Certificate cert, String host, int port) => true;
          return client;
        },
      );
    }

    return dio;
  }

  // طريقة مساعدة لإعادة تعيين مثيل Dio (مفيدة عند تسجيل الخروج)
  static void resetInstance() {
    _instance = null;
  }
}
```

## خطوات التشخيص الإضافية

1. **تحقق من الاتصال بالإنترنت**: تأكد من أن الجهاز متصل بالإنترنت.

2. **اختبار الخادم**: تأكد من أن الخادم يعمل ويمكن الوصول إليه باستخدام أدوات مثل Postman أو cURL.

3. **تحقق من URL الصحيح**: تأكد من استخدام URL صحيح وكامل للخادم.

4. **تحقق من التوكن**: تأكد من أن التوكن صالح وغير منتهي الصلاحية.

5. **تحقق من تكوين الشبكة**: تأكد من أن تكوين الشبكة صحيح، خاصة إذا كنت تستخدم VPN أو proxy.

6. **تحقق من إصدار Dio**: تأكد من استخدام أحدث إصدار من Dio.

7. **استخدام HTTP بدلاً من Dio للاختبار**: جرب استخدام package `http` بدلاً من Dio للتأكد من أن المشكلة ليست في Dio نفسه.

## ملخص

المشكلة الرئيسية قد تكون في:

1. تكوين URL غير صحيح أو غير كامل.
2. استخدام المسارات النسبية بشكل غير صحيح.
3. مشكلة في تكوين Dio الأساسي.
4. مشكلة في الشبكة أو الاتصال بالإنترنت.

جرب الحلول المقترحة أعلاه وراقب الـ logs للتشخيص الإضافي.