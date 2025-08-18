# حل مشكلة إرسال الرسائل والملفات في Flutter

## المشكلة

 وجدت أن المشكلة تكمن في كيفية إرسال البيانات باستخدام `FormData` في Flutter. المشكلة الرئيسية هي في اسم الحقل المستخدم لإرسال الملفات.

## الحل

وفقًا لكود الباك إند، يجب إرسال الملفات باستخدام اسم الحقل `files` (وليس `files[0]` أو `files[$i]`). الباك إند يتوقع أن تكون الملفات في مصفوفة تحت اسم `files`.

### الكود الصحيح لإرسال الرسائل مع الملفات

```dart
Future<void> sendMessage({
  required String chatId,
  String? content,
  required String receiverId,
  File? file,
  List<File>? files,
  String messageType = "text",
}) async {
  try {
    final token = await CacheServices.instance.getAccessToken();
    final dio = Dio();
    
    // إنشاء كائن FormData
    final formData = FormData();
    
    // إضافة البيانات الأساسية
    formData.fields.addAll([
      MapEntry('chatId', chatId),
      MapEntry('receiverId', receiverId),
      MapEntry('messageType', messageType),
    ]);
    
    // إضافة المحتوى النصي إذا كان موجودًا
    if (content != null && content.isNotEmpty) {
      formData.fields.add(MapEntry('content', content));
    }
    
    // إضافة ملف واحد إذا كان موجودًا
    if (file != null) {
      formData.files.add(
        MapEntry(
          'files', // استخدام 'files' وليس 'files[0]'
          await MultipartFile.fromFile(
            file.path,
            filename: file.path.split('/').last,
          ),
        ),
      );
    }
    
    // إضافة ملفات متعددة إذا كانت موجودة
    if (files != null && files.isNotEmpty) {
      for (var file in files) {
        formData.files.add(
          MapEntry(
            'files', // استخدام 'files' لجميع الملفات
            await MultipartFile.fromFile(
              file.path,
              filename: file.path.split('/').last,
            ),
          ),
        );
      }
    }
    
    // إرسال الطلب
    final response = await dio.post(
      ApiConstant.sendMessages(chatId),
      data: formData,
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        // لا تحتاج لتحديد contentType يدويًا، سيتم تعيينه تلقائيًا
        sendTimeout: Duration(seconds: 30),
        receiveTimeout: Duration(seconds: 30),
      ),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final messageJson = response.data['data']['message'];
      final message = Message.fromJson(messageJson);
      _messages.add(message);
      emit(ChatLoaded(List.from(_messages)));
    } else {
      emit(ChatError(response.data['message'] ?? "Failed to send message"));
    }
  } catch (error) {
    if (error is DioException) {
      print("Dio Error: ${error.type}");
      print("Response Data: ${error.response?.data}");
      print("Status Code: ${error.response?.statusCode}");
    }
    final message =
        (error is DioException)
            ? error.response?.data['message'] ??
                "Network error (${error.type})"
            : error.toString();
    emit(ChatError(message));
  }
}
```

## النقاط الرئيسية

1. **اسم الحقل الصحيح**: استخدم `'files'` كاسم للحقل لجميع الملفات، وليس `'files[0]'` أو `'files[$i]'`.

2. **عدم تحديد Content-Type يدويًا**: دع Dio يحدد نوع المحتوى تلقائيًا عند استخدام FormData.

3. **التعامل مع ملف واحد أو ملفات متعددة**: الكود يدعم إرسال ملف واحد أو قائمة من الملفات.

## ملاحظات إضافية

- تأكد من أن الملفات التي ترسلها تتوافق مع أنواع الملفات المدعومة في الباك إند (الصور، الصوت، الفيديو، المستندات).

- يمكنك إرسال رسائل نصية فقط بدون ملفات عن طريق تمرير `content` فقط.

- يمكنك إرسال ملفات فقط بدون محتوى نصي عن طريق تمرير `file` أو `files` فقط.

- تأكد من تحديث `messageType` بناءً على نوع الملف المرسل (text, image, file, voice, video).