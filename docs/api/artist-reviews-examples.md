# أمثلة تقييم الفنان - POST /reviews/artist

## المثال الافتراضي (سيظهر عند الضغط على Execute)

```json
{
  "artist": "60d0fe4f5311236168a109ca",
  "rating": 5
}
```

## الحقول المطلوبة

- **artist** (مطلوب): معرف الفنان المراد تقييمه
- **rating** (مطلوب): التقييم من 1 إلى 5 نجوم

## الحقول الاختيارية

- **title**: عنوان التقييم (5-100 حرف)
- **comment**: التعليق التفصيلي (10-2000 حرف)
- **pros**: النقاط الإيجابية (مصفوفة من النصوص)
- **cons**: النقاط السلبية (مصفوفة من النصوص)
- **isRecommended**: هل توصي بهذا الفنان (true/false)
- **subRatings**: التقييمات الفرعية
  - **professionalism**: تقييم الاحترافية (1-5)
  - **communication**: تقييم التواصل (1-5)
  - **delivery**: تقييم التسليم (1-5)
  - **creativity**: تقييم الإبداع (1-5)
  - **valueForMoney**: تقييم القيمة مقابل المال (1-5)
  - **responsiveness**: تقييم سرعة الاستجابة (1-5)
- **workingExperience**: تجربة العمل مع الفنان
  - **projectType**: نوع المشروع (commission, collaboration, purchase, consultation, other)
  - **duration**: مدة المشروع (less_than_week, one_to_two_weeks, two_to_four_weeks, one_to_three_months, more_than_three_months)
  - **budget**: نطاق الميزانية (under_100, 100_500, 500_1000, 1000_5000, over_5000)
- **anonymous**: نشر التقييم بشكل مجهول (true/false)

## ملاحظات

- المثال البسيط (فقط artist و rating) هو الافتراضي في Swagger UI
- جميع الحقول الأخرى اختيارية
- لا يمكن للمستخدم تقييم نفسه
- لا يمكن تقييم نفس الفنان أكثر من مرة 