# دليل تكامل Flutter مع ArtHub

## رفع الصور

### رفع صورة البروفايل
- **Endpoint:** `PATCH /user/profile`
- **Content-Type:** `multipart/form-data`
- **Field:** `profileImage`

### رفع صور الأعمال الفنية
- **Endpoint:** `POST /artworks`
- **Content-Type:** `multipart/form-data`
- **Field:** `images[]` (1-10 صور)

> **ملاحظة:** لا يوجد مكتبة صور عامة أو endpoint منفصل لرفع الصور. كل صورة تُرفع فقط مع بيانات البروفايل أو العمل الفني.

## مثال Flutter (Dio)

### رفع صورة البروفايل
```dart
final dio = Dio();
final formData = FormData.fromMap({
  'profileImage': await MultipartFile.fromFile(profileImagePath),
  'displayName': 'اسم المستخدم',
  'bio': 'نبذة شخصية',
});
final response = await dio.patch(
  'https://your-api.com/user/profile',
  data: formData,
  options: Options(headers: {'Authorization': 'Bearer YOUR_TOKEN'}),
);
```

### إنشاء عمل فني مع رفع الصور
```dart
final dio = Dio();
final formData = FormData.fromMap({
  'title': 'عنوان العمل الفني',
  'description': 'وصف العمل الفني',
  'price': '500.00',
  'category': 'category_id',
  'images': [
    await MultipartFile.fromFile(image1Path),
    await MultipartFile.fromFile(image2Path),
  ],
});
final response = await dio.post(
  'https://your-api.com/artworks',
  data: formData,
  options: Options(headers: {'Authorization': 'Bearer YOUR_TOKEN'}),
);
```

## الرد من السيرفر
- سيحتوي الرد على رابط الصورة المرفوعة ضمن بيانات المستخدم أو العمل الفني.

## دليل مفصل لإنشاء الأعمال الفنية
راجع الملف: `FLUTTER_ARTWORK_CREATION_GUIDE.md` للحصول على دليل مفصل لإنشاء الأعمال الفنية مع رفع الصور.

---

> **تمت إزالة أي ذكر لمكتبة صور عامة أو endpoints قديمة للصور من هذا الدليل.**