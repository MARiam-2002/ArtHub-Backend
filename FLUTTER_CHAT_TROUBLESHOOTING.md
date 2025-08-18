# استكشاف أخطاء إرسال الملفات في Flutter Chat

## الأخطاء الشائعة وحلولها

### 1. خطأ في اسم الحقل (Field Name)

**المشكلة**: استخدام اسم حقل غير صحيح عند إرسال الملفات.

**الحل**: استخدم `'files'` كاسم للحقل لجميع الملفات، وليس `'files[0]'` أو `'files[$i]'`.

```dart
// ❌ خطأ
formData.files.add(MapEntry('files[0]', multipartFile));

// ✅ صحيح
formData.files.add(MapEntry('files', multipartFile));
```

### 2. تعيين Content-Type يدويًا

**المشكلة**: تعيين `contentType: 'multipart/form-data'` يدويًا في خيارات Dio.

**الحل**: دع Dio يحدد نوع المحتوى تلقائيًا عند استخدام FormData.

```dart
// ❌ خطأ
options: Options(
  headers: {'Authorization': 'Bearer $token'},
  contentType: 'multipart/form-data', // لا تحدد هذا يدويًا
),

// ✅ صحيح
options: Options(
  headers: {'Authorization': 'Bearer $token'},
  // لا تحتاج لتحديد contentType
),
```

### 3. عدم التحقق من نوع الملف

**المشكلة**: إرسال ملفات بأنواع غير مدعومة في الباك إند.

**الحل**: تحقق من أن الملفات تتوافق مع الأنواع المدعومة قبل إرسالها.

```dart
// التحقق من نوع الملف قبل إرساله
bool isValidFileType(File file) {
  final extension = file.path.split('.').last.toLowerCase();
  final validExtensions = [
    // صور
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
    // صوت
    'mp3', 'wav', 'ogg', 'aac', 'flac',
    // فيديو
    'mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm', '3gp', 'flv',
    // مستندات
    'pdf', 'doc', 'docx', 'txt'
  ];
  return validExtensions.contains(extension);
}
```

### 4. عدم تحديد messageType بشكل صحيح

**المشكلة**: عدم تحديث `messageType` بناءً على نوع الملف المرسل.

**الحل**: حدد `messageType` بناءً على نوع الملف.

```dart
String getMessageTypeFromFile(File file) {
  final extension = file.path.split('.').last.toLowerCase();
  
  // تحديد نوع الرسالة بناءً على امتداد الملف
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].contains(extension)) {
    return 'image';
  } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].contains(extension)) {
    return 'voice';
  } else if (['mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm', '3gp', 'flv'].contains(extension)) {
    return 'video';
  } else {
    return 'file';
  }
}
```

### 5. عدم معالجة الأخطاء بشكل صحيح

**المشكلة**: عدم طباعة معلومات كافية عن الخطأ لتشخيص المشكلة.

**الحل**: قم بطباعة معلومات مفصلة عن الخطأ.

```dart
try {
  // إرسال الطلب
} catch (error) {
  if (error is DioException) {
    print("Dio Error Type: ${error.type}");
    print("Dio Error Message: ${error.message}");
    print("Response Status Code: ${error.response?.statusCode}");
    print("Response Data: ${error.response?.data}");
    print("Request Data: ${error.requestOptions.data}");
    print("Request Headers: ${error.requestOptions.headers}");
    print("Request Path: ${error.requestOptions.path}");
  } else {
    print("Unknown Error: $error");
  }
  // معالجة الخطأ
}
```

## نموذج كامل لإرسال الملفات مع معالجة الأخطاء

```dart
Future<void> sendMessage({
  required String chatId,
  String? content,
  required String receiverId,
  List<File>? files,
  String? messageType,
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
    ]);
    
    // إضافة المحتوى النصي إذا كان موجودًا
    if (content != null && content.isNotEmpty) {
      formData.fields.add(MapEntry('content', content));
    }
    
    // تحديد نوع الرسالة بناءً على الملفات
    String finalMessageType = messageType ?? 'text';
    
    // إضافة ملفات متعددة إذا كانت موجودة
    if (files != null && files.isNotEmpty) {
      // التحقق من صحة الملفات
      for (var file in files) {
        if (!isValidFileType(file)) {
          throw Exception("نوع الملف غير مدعوم: ${file.path.split('/').last}");
        }
      }
      
      // تحديث نوع الرسالة بناءً على النوع الأول من الملفات
      if (messageType == null) {
        finalMessageType = getMessageTypeFromFile(files.first);
      }
      
      // إضافة الملفات
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
    
    // إضافة نوع الرسالة النهائي
    formData.fields.add(MapEntry('messageType', finalMessageType));
    
    // طباعة معلومات الطلب للتشخيص
    print("Request URL: ${ApiConstant.sendMessages(chatId)}");
    print("FormData Fields: ${formData.fields}");
    print("FormData Files Count: ${formData.files.length}");
    
    // إرسال الطلب
    final response = await dio.post(
      ApiConstant.sendMessages(chatId),
      data: formData,
      options: Options(
        headers: {'Authorization': 'Bearer $token'},
        sendTimeout: Duration(seconds: 30),
        receiveTimeout: Duration(seconds: 30),
      ),
    );

    // معالجة الاستجابة
    if (response.statusCode == 200 || response.statusCode == 201) {
      final messageJson = response.data['data']['message'];
      final message = Message.fromJson(messageJson);
      _messages.add(message);
      emit(ChatLoaded(List.from(_messages)));
    } else {
      emit(ChatError(response.data['message'] ?? "Failed to send message"));
    }
  } catch (error) {
    // معالجة الأخطاء بشكل مفصل
    if (error is DioException) {
      print("Dio Error Type: ${error.type}");
      print("Dio Error Message: ${error.message}");
      print("Response Status Code: ${error.response?.statusCode}");
      print("Response Data: ${error.response?.data}");
      
      if (error.requestOptions != null) {
        print("Request Path: ${error.requestOptions.path}");
        print("Request Headers: ${error.requestOptions.headers}");
        print("Request Method: ${error.requestOptions.method}");
      }
    } else {
      print("Unknown Error: $error");
    }
    
    final message =
        (error is DioException)
            ? error.response?.data['message'] ??
                "Network error (${error.type})"
            : error.toString();
    emit(ChatError(message));
  }
}

// وظائف مساعدة
bool isValidFileType(File file) {
  final extension = file.path.split('.').last.toLowerCase();
  final validExtensions = [
    // صور
    'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
    // صوت
    'mp3', 'wav', 'ogg', 'aac', 'flac',
    // فيديو
    'mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm', '3gp', 'flv',
    // مستندات
    'pdf', 'doc', 'docx', 'txt'
  ];
  return validExtensions.contains(extension);
}

String getMessageTypeFromFile(File file) {
  final extension = file.path.split('.').last.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'].contains(extension)) {
    return 'image';
  } else if (['mp3', 'wav', 'ogg', 'aac', 'flac'].contains(extension)) {
    return 'voice';
  } else if (['mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm', '3gp', 'flv'].contains(extension)) {
    return 'video';
  } else {
    return 'file';
  }
}
```

## خطوات تشخيص المشكلة

1. **تحقق من الاتصال بالخادم**: تأكد من أن الخادم يعمل ويمكن الوصول إليه.

2. **تحقق من التوكن**: تأكد من أن التوكن صالح وتم إرساله بشكل صحيح.

3. **تحقق من تنسيق البيانات**: تأكد من أن البيانات المرسلة تتوافق مع ما يتوقعه الخادم.

4. **تحقق من حجم الملف**: تأكد من أن حجم الملف لا يتجاوز الحد المسموح به (10 ميجابايت).

5. **تحقق من نوع الملف**: تأكد من أن نوع الملف مدعوم في الخادم.

6. **استخدم أداة تشخيص الشبكة**: استخدم أدوات مثل Charles Proxy أو Wireshark لمراقبة الطلبات والاستجابات.

7. **اختبر بملف بسيط**: جرب إرسال ملف صغير وبسيط للتأكد من أن المشكلة ليست في الملف نفسه.