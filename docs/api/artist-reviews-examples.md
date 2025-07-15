# أمثلة تقييم الفنان

## نظرة عامة

هذا الدليل يحتوي على أمثلة بسيطة ومفصلة لتقييم الفنانين في منصة ArtHub.

## الحقول المطلوبة

- `artist`: معرف الفنان (MongoDB ObjectId)
- `rating`: التقييم من 1 إلى 5 نجوم

## أمثلة بسيطة

### 1. الحد الأدنى (أبسط مثال)

```json
{
  "artist": "60d0fe4f5311236168a109ca",
  "rating": 5
}
```

**ملاحظة:** هذا أبسط مثال يعمل - فقط معرف الفنان والتقييم.

### 2. تقييم بسيط مع تعليق

```json
{
  "artist": "60d0fe4f5311236168a109ca",
  "rating": 4,
  "comment": "فنان ممتاز، أنصح بالتعامل معه"
}
```

### 3. تقييم أساسي

```json
{
  "artist": "60d0fe4f5311236168a109ca",
  "rating": 5,
  "title": "فنان محترف",
  "comment": "تعامل ممتاز وجودة عالية في العمل",
  "isRecommended": true
}
```

## أمثلة مفصلة

### 4. تقييم بسيط

```json
{
  "artist": "60d0fe4f5311236168a109ca",
  "rating": 5,
  "comment": "فنان ممتاز"
}
```

## الحقول الاختيارية

### الحقول الأساسية
- `title`: عنوان التقييم (5-100 حرف)
- `comment`: التعليق التفصيلي (10-2000 حرف)
- `pros`: النقاط الإيجابية (مصفوفة)
- `cons`: النقاط السلبية (مصفوفة)
- `isRecommended`: التوصية (true/false)

### التقييمات الفرعية
- `subRatings.professionalism`: تقييم الاحترافية
- `subRatings.communication`: تقييم التواصل
- `subRatings.delivery`: تقييم التسليم
- `subRatings.creativity`: تقييم الإبداع
- `subRatings.valueForMoney`: تقييم القيمة مقابل المال
- `subRatings.responsiveness`: تقييم سرعة الاستجابة

### تجربة العمل
- `workingExperience.projectType`: نوع المشروع
  - `commission`: طلب خاص
  - `collaboration`: تعاون
  - `purchase`: شراء
  - `consultation`: استشارة
  - `other`: أخرى
- `workingExperience.duration`: مدة المشروع
  - `less_than_week`: أقل من أسبوع
  - `one_to_two_weeks`: أسبوع إلى أسبوعين
  - `two_to_four_weeks`: أسبوعين إلى شهر
  - `one_to_three_months`: شهر إلى 3 أشهر
  - `more_than_three_months`: أكثر من 3 أشهر
- `workingExperience.budget`: نطاق الميزانية
  - `under_100`: أقل من 100 ريال
  - `100_500`: 100-500 ريال
  - `500_1000`: 500-1000 ريال
  - `1000_5000`: 1000-5000 ريال
  - `over_5000`: أكثر من 5000 ريال

### خيارات إضافية
- `anonymous`: النشر المجهول (true/false)

## استخدام في Flutter

```dart
// مثال بسيط
final response = await dio.post('/api/reviews/artist', data: {
  "artist": "60d0fe4f5311236168a109ca",
  "rating": 5
});

// مثال مفصل
final response = await dio.post('/api/reviews/artist', data: {
  "artist": "60d0fe4f5311236168a109ca",
  "rating": 5,
  "title": "فنان محترف",
  "comment": "تعامل ممتاز وجودة عالية في العمل",
  "isRecommended": true
});
```

## الاستجابة المتوقعة

```json
{
  "success": true,
  "message": "تم إضافة تقييم الفنان بنجاح",
  "data": {
    "_id": "60d0fe4f5311236168a109ca",
    "artist": "60d0fe4f5311236168a109ca",
    "rating": 5,
    "title": "فنان محترف",
    "comment": "تعامل ممتاز وجودة عالية في العمل",
    "createdAt": "2023-06-15T10:30:45.123Z"
  }
}
```

## ملاحظات مهمة

1. **الحد الأدنى:** يمكنك إرسال فقط `artist` و `rating`
2. **التقييم:** يجب أن يكون بين 1 و 5 نجوم
3. **معرف الفنان:** يجب أن يكون MongoDB ObjectId صحيح
4. **التعليق:** يجب أن يكون 10 أحرف على الأقل
5. **العنوان:** يجب أن يكون 5 أحرف على الأقل
6. **النقاط:** يمكن إضافة 10 نقاط إيجابية و 10 سلبية كحد أقصى 