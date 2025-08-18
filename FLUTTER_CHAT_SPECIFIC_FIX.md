# حل مشكلة إرسال الرسائل في Flutter Chat

## المشكلة المحددة

بناءً على رسائل الخطأ التي قدمتها، يبدو أن المشكلة تتعلق بكيفية إرسال البيانات من Flutter إلى الخادم. المشكلة تحدث حتى مع الرسائل النصية البسيطة، وليس فقط مع الملفات.

من خلال تحليل الـ logs التي قدمتها:

```
I/flutter (28573): Sending to: chat/688d4382905eb9af43d9d882/send
I/flutter (28573): FormData fields: [MapEntry(chatId: 688d4382905eb9af43d9d882), MapEntry(receiverId: 6872c6eb501ee86cc3c5b77c), MapEntry(messageType: text), MapEntry(content: .)]
I/flutter (28573): Dio Error Type: DioExceptionType.unknown
I/flutter (28573): Dio Error Message: null
I/flutter (28573): Response Status Code: null
I/flutter (28573): Response Data: null
I/flutter (28573): Request Data: Instance of 'FormData'
I/flutter (28573): Request Headers: {Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY4NzJjOWE1NTAxZWU4NmNjM2M1Yjc5ZSIsImVtYWlsIjoiYWhtZWR0aGVtb2hzZW5AZ21haWwuY29tIiwicm9sZSI6ImFydGlzdCIsImlhdCI6MTc1NTQ0MTkxOCwiZXhwIjoxNzU1NDQ5MTE4fQ.9Qqn0gjvIhYLSyDcy519Ch1IX-skVwEUinsMaJKL0-8, content-type: multipart/form-data; boundary=--dio-boundary-0958077480, content-length: 414}
I/flutter (28573): Request Path: chat/688d4382905eb9af43d9d882/send
```

## الحل المحدد

المشكلة الرئيسية تبدو في كيفية إرسال الطلب. هناك عدة نقاط يجب معالجتها:

### 1. استخدام URL كامل

يبدو أن الطلب يتم إرساله إلى مسار نسبي `chat/688d4382905eb9af43d9d882/send` بدلاً من URL كامل. تأكد من استخدام URL كامل مثل:

```dart
final response = await dio.post(
  "${ApiConstant.baseUrl}/chat/$chatId/send", // استخدم URL كامل
  data: formData,
  options: Options(
    headers: {'Authorization': 'Bearer $token'},
  ),
);
```

### 2. تبسيط FormData

بدلاً من استخدام FormData المعقد، جرب استخدام JSON للرسائل النصية البسيطة:

```dart
// للرسائل النصية فقط
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
        "messageType": "text",
        "receiverId": receiverId
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

### 3. استخدام FormData بشكل صحيح للملفات

عند الحاجة لإرسال ملفات، استخدم FormData بالطريقة الصحيحة:

```dart
Future<void> sendFileMessage({
  required String chatId,
  String? content,
  required String receiverId,
  required List<File> files,
  String messageType = "file",
}) async {
  try {
    final token = await CacheServices.instance.getAccessToken();
    final dio = Dio();
    
    // إنشاء FormData
    final formData = FormData();
    
    // إضافة المحتوى النصي إذا كان موجودًا
    if (content != null && content.isNotEmpty) {
      formData.fields.add(MapEntry('content', content));
    }
    
    // إضافة messageType
    formData.fields.add(MapEntry('messageType', messageType));
    
    // إضافة receiverId
    formData.fields.add(MapEntry('receiverId', receiverId));
    
    // إضافة الملفات
    for (var file in files) {
      final filename = file.path.split('/').last;
      formData.files.add(
        MapEntry(
          'files',
          await MultipartFile.fromFile(
            file.path,
            filename: filename,
          ),
        ),
      );
    }
    
    // طباعة معلومات الطلب للتشخيص
    print("Sending to: ${ApiConstant.baseUrl}/chat/$chatId/send");
    print("FormData fields: ${formData.fields}");
    print("FormData files: ${formData.files.length}");
    
    // إرسال الطلب
    final response = await dio.post(
      "${ApiConstant.baseUrl}/chat/$chatId/send",
      data: formData,
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        // لا تحدد Content-Type يدويًا
        sendTimeout: const Duration(seconds: 30),
        receiveTimeout: const Duration(seconds: 30),
      ),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final messageJson = response.data['data']['message'];
      final message = Message.fromJson(messageJson);
      _messages.add(message);
      emit(ChatLoaded(List.from(_messages)));
    }
  } catch (error) {
    // معالجة الخطأ بشكل مفصل
    print("Error sending file message: $error");
    if (error is DioException) {
      print("Dio Error Type: ${error.type}");
      print("Dio Error Message: ${error.message}");
      print("Response Status Code: ${error.response?.statusCode}");
      print("Response Data: ${error.response?.data}");
      print("Request Path: ${error.requestOptions.path}");
    }
    emit(ChatError(error.toString()));
  }
}
```

### 4. التحقق من تكوين Dio

تأكد من تكوين Dio بشكل صحيح:

```dart
// تكوين Dio
Dio configureDio() {
  final dio = Dio();
  
  // تكوين الخيارات الأساسية
  dio.options.baseUrl = ApiConstant.baseUrl;
  dio.options.connectTimeout = const Duration(seconds: 30);
  dio.options.receiveTimeout = const Duration(seconds: 30);
  dio.options.sendTimeout = const Duration(seconds: 30);
  
  // إضافة interceptors للتشخيص
  dio.interceptors.add(LogInterceptor(
    requestBody: true,
    responseBody: true,
    error: true,
  ));
  
  return dio;
}
```

### 5. التحقق من ApiConstant

تأكد من أن `ApiConstant.baseUrl` و `ApiConstant.sendMessages` تم تكوينهما بشكل صحيح:

```dart
class ApiConstant {
  static const String baseUrl = "https://your-api-domain.com/api";
  
  // طرق مساعدة للحصول على URLs
  static String sendMessages(String chatId) => "/chat/$chatId/send";
}
```

## خطوات إضافية للتشخيص

1. **التحقق من الاتصال بالإنترنت**: تأكد من أن الجهاز متصل بالإنترنت.

2. **التحقق من صحة التوكن**: تأكد من أن التوكن صالح وغير منتهي الصلاحية.

3. **اختبار الـ API باستخدام Postman**: جرب إرسال طلب باستخدام Postman للتأكد من أن الـ API يعمل بشكل صحيح.

4. **تحديث إصدار Dio**: تأكد من استخدام أحدث إصدار من Dio.

5. **التحقق من CORS**: تأكد من أن الخادم يسمح بطلبات CORS من تطبيق Flutter.

## ملخص

المشكلة الرئيسية قد تكون في:

1. استخدام URL نسبي بدلاً من URL كامل.
2. تكوين FormData بشكل غير صحيح.
3. تعيين Content-Type يدويًا بدلاً من ترك Dio يحدده تلقائيًا.
4. إرسال حقول غير ضرورية مثل `chatId` في body (بينما هو موجود بالفعل في URL).

جرب الحلول المقترحة أعلاه وراقب الـ logs للتشخيص الإضافي.