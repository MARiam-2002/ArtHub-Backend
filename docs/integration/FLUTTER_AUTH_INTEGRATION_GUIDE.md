# دليل تكامل مصادقة Flutter مع ArtHub

## رفع الصور (البروفايل والأعمال الفنية)

- **رفع صورة البروفايل:** يتم فقط عبر endpoint:
  - `PATCH /user/profile` (مع إرسال الصورة في الحقل `profileImage` ضمن `multipart/form-data`)
- **رفع صور الأعمال الفنية:** يتم فقط عبر endpoint:
  - `POST /artworks` أو `PATCH /artworks/:id` (مع إرسال الصور في الحقل `images[]` ضمن `multipart/form-data`)

> **ملاحظة:** لا يوجد مكتبة صور عامة أو endpoint منفصل لرفع الصور. كل صورة تُرفع فقط مع بيانات البروفايل أو العمل الفني.

## مثال Flutter (Dio)

```dart
final dio = Dio();
final formData = FormData.fromMap({
  'profileImage': await MultipartFile.fromFile(profileImagePath),
  // أو للأعمال الفنية:
  // 'images': [await MultipartFile.fromFile(img1), await MultipartFile.fromFile(img2)],
  ...otherFields,
});
final response = await dio.patch(
  'https://your-api.com/user/profile',
  data: formData,
  options: Options(headers: {'Authorization': 'Bearer YOUR_TOKEN'}),
);
```

## الرد من السيرفر
- سيحتوي الرد على رابط الصورة المرفوعة ضمن بيانات المستخدم أو العمل الفني.

---

> **تمت إزالة أي ذكر لمكتبة صور عامة أو endpoints قديمة للصور من هذا الدليل.**