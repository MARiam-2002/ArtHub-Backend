# Special Request Toggle Feature

## نظرة عامة
تم إضافة ميزة toggle للطلبات العادية (ready_artwork) في نظام الطلبات الخاصة. هذه الميزة تسمح للمستخدمين بإنشاء وإلغاء الطلبات خلال فترة زمنية محددة.

## كيفية العمل

### 1. إنشاء طلب جديد
عند الضغط على زر "اطلب الآن" لأول مرة:
- يتم إنشاء طلب جديد في قاعدة البيانات
- يتم تسجيل `isOrdered: true`
- يتم تسجيل وقت الإنشاء `createdAt`

### 2. إلغاء الطلب (خلال 3 ساعات)
عند الضغط على نفس الزر مرة أخرى خلال 3 ساعات:
- يتم البحث عن طلب موجود بنفس `userId + artistId + artworkId`
- إذا وُجد طلب مع `isOrdered: true`، يتم تغييره إلى `isOrdered: false`
- يتم إرسال إشعار للفنان بإلغاء الطلب

### 3. رفض الإلغاء (بعد 3 ساعات)
إذا مر أكثر من 3 ساعات من وقت الإنشاء:
- يتم رفض أي محاولة إلغاء
- يتم إرجاع رسالة خطأ: "لا يمكن إلغاء الطلب بعد مرور 3 ساعات من إنشائه"

## التغييرات المطبقة

### 1. SpecialRequest Model
```javascript
// حقل جديد
isOrdered: {
  type: Boolean,
  default: true,
  index: true
}

// indexes جديدة
specialRequestSchema.index({ sender: 1, artist: 1, artwork: 1, isOrdered: 1 });
specialRequestSchema.index({ sender: 1, requestType: 1, isOrdered: 1 });
```

### 2. Controller Logic
```javascript
// البحث عن طلب موجود
const existingRequest = await specialRequestModel.findOne({
  sender: senderId,
  artist: artist,
  artwork: artwork,
  requestType: 'ready_artwork',
  isOrdered: true // البحث عن الطلبات المُفعلة فقط
});

// إلغاء الطلب
await specialRequestModel.findByIdAndUpdate(existingRequest._id, {
  isOrdered: false, // تغيير إلى false بدلاً من تغيير status
  cancelledAt: new Date(),
  cancelledBy: senderId,
  cancellationReason: 'إلغاء بواسطة المستخدم خلال فترة الـ 3 ساعات المسموحة'
});
```

### 3. Response Format
```javascript
{
  "success": true,
  "message": "تم إنشاء الطلب العادي بنجاح" | "تم إلغاء الطلب بنجاح",
  "data": {
    "action": "created" | "cancelled",
    "specialRequest": {
      "_id": "...",
      "isOrdered": true | false,
      "status": "pending",
      // ... باقي البيانات
    },
    "timeElapsed": "1.5 hours" // في حالة الإلغاء
  }
}
```

## API Endpoint

### POST /special-requests
```javascript
// Request Body
{
  "artist": "6872c6fb501ee86cc3c5b781",
  "requestType": "ready_artwork",
  "artwork": "68abe1b52a4ca6af89d1d44b",
  "description": "وصف الطلب",
  "budget": 500,
  "duration": 3,
  "currency": "SAR"
}
```

### Response Examples

#### إنشاء طلب جديد
```javascript
{
  "success": true,
  "message": "تم إنشاء الطلب العادي بنجاح",
  "data": {
    "action": "created",
    "specialRequest": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
      "isOrdered": true,
      "status": "pending",
      "requestType": "ready_artwork",
      // ... باقي البيانات
    }
  }
}
```

#### إلغاء طلب موجود
```javascript
{
  "success": true,
  "message": "تم إلغاء الطلب بنجاح",
  "data": {
    "action": "cancelled",
    "specialRequest": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
      "isOrdered": false,
      "status": "pending",
      "requestType": "ready_artwork",
      // ... باقي البيانات
    },
    "timeElapsed": "1.5 hours"
  }
}
```

#### رفض الإلغاء (بعد 3 ساعات)
```javascript
{
  "success": false,
  "message": "لا يمكن إلغاء الطلب بعد مرور 3 ساعات من إنشائه",
  "data": {
    "existingRequest": {
      "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
      "status": "pending",
      "createdAt": "2024-01-15T10:00:00.000Z",
      "hoursElapsed": 4.5
    }
  },
  "meta": {
    "action": "cancel_rejected",
    "reason": "time_limit_exceeded",
    "timeLimit": "3 hours",
    "timeElapsed": "4.5 hours"
  }
}
```

## الاختبار

### تشغيل الاختبار
```bash
# تعيين متغيرات البيئة
export TEST_USER_TOKEN="your_token_here"
export TEST_ARTIST_ID="6872c6fb501ee86cc3c5b781"
export TEST_ARTWORK_ID="68abe1b52a4ca6af89d1d44b"
export BASE_URL="http://localhost:3000"

# تشغيل الاختبار
node scripts/test-special-request-toggle.js
```

### سيناريوهات الاختبار
1. **إنشاء طلب جديد** - يجب أن يعود `isOrdered: true`
2. **إلغاء طلب خلال 3 ساعات** - يجب أن يعود `isOrdered: false`
3. **إنشاء طلب جديد مرة أخرى** - يجب أن يعود `isOrdered: true`
4. **اختبار الطلبات الخاصة** - يجب أن تعمل بشكل طبيعي

## ملاحظات مهمة

1. **الطلبات الخاصة (custom_artwork)** لا تتأثر بهذه الميزة وتعمل بشكل طبيعي
2. **الطلبات العادية (ready_artwork)** فقط هي التي تدعم toggle functionality
3. **حقل isOrdered** يظهر في جميع الـ responses للطلبات
4. **الـ status** يبقى كما هو (pending) ولا يتغير عند الإلغاء
5. **الإشعارات** تُرسل للفنان في حالة الإلغاء

## التوافق مع Flutter

هذه الميزة متوافقة تماماً مع Flutter ولا تحتاج أي تغييرات في الـ frontend. الـ response format لم يتغير، فقط تم إضافة حقل `isOrdered` جديد.

```dart
// في Flutter يمكنك استخدام isOrdered كالتالي:
bool isOrdered = specialRequest['isOrdered'] ?? true;
String action = responseData['action']; // 'created' أو 'cancelled'
```
