# دعم اللغات المتعددة في نظام ArtHub

## نظرة عامة

يوفر نظام ArtHub دعمًا كاملاً للغة العربية والإنجليزية في جميع أجزاء التطبيق. هذا المستند يشرح كيفية تنفيذ وإدارة المحتوى متعدد اللغات في النظام.

## تفضيلات اللغة

### تخزين تفضيلات اللغة

يتم تخزين تفضيلات اللغة في نموذج المستخدم:

```javascript
// نموذج المستخدم (DB/models/user.model.js)
const userSchema = new Schema({
  // حقول أخرى...
  preferredLanguage: {
    type: String,
    enum: ['ar', 'en'],
    default: 'ar'
  }
});
```

### تحديث تفضيلات اللغة

يمكن للمستخدمين تحديث تفضيلات اللغة من خلال واجهة API:

```javascript
// PATCH /api/user/settings/language
router.patch('/settings/language', isAuthenticated, async (req, res) => {
  const { language } = req.body;

  if (!['ar', 'en'].includes(language)) {
    return res.fail(null, 'اللغة غير مدعومة', 400);
  }

  await userModel.updateOne({ _id: req.user._id }, { preferredLanguage: language });

  res.success(null, 'تم تحديث اللغة المفضلة بنجاح');
});
```

### اكتشاف اللغة المفضلة

يتم اكتشاف اللغة المفضلة للمستخدم بالترتيب التالي:

1. معلمة الاستعلام (`?language=ar` أو `?language=en`)
2. ترويسة `Accept-Language`
3. تفضيل اللغة المخزن للمستخدم
4. الافتراضي هو العربية إذا لم يتم تحديد تفضيل

```javascript
// وسيط اكتشاف اللغة (middleware/language.middleware.js)
export const detectLanguage = (req, res, next) => {
  // 1. التحقق من معلمة الاستعلام
  if (req.query.language && ['ar', 'en'].includes(req.query.language)) {
    req.language = req.query.language;
    return next();
  }

  // 2. التحقق من ترويسة Accept-Language
  const acceptLanguage = req.header('Accept-Language');
  if (acceptLanguage && acceptLanguage.startsWith('en')) {
    req.language = 'en';
    return next();
  }

  // 3. استخدام تفضيل المستخدم المخزن
  if (req.user && req.user.preferredLanguage) {
    req.language = req.user.preferredLanguage;
    return next();
  }

  // 4. الافتراضي هو العربية
  req.language = 'ar';
  next();
};
```

## نماذج البيانات متعددة اللغات

### نموذج الإشعارات

تم تحديث نموذج الإشعارات لدعم اللغات المتعددة:

```javascript
// نموذج الإشعارات (DB/models/notification.model.js)
const notificationSchema = new Schema({
  user: { type: Types.ObjectId, ref: 'User', required: true },
  title: {
    ar: { type: String, required: true },
    en: { type: String }
  },
  message: {
    ar: { type: String, required: true },
    en: { type: String }
  }
  // حقول أخرى...
});

// طريقة للحصول على المحتوى باللغة المفضلة
notificationSchema.methods.getLocalizedContent = function (language = 'ar') {
  return {
    _id: this._id,
    user: this.user,
    title: this.title[language] || this.title.ar,
    message: this.message[language] || this.message.ar
    // حقول أخرى...
  };
};
```

### نموذج الصور

تم تحديث نموذج الصور لدعم العناوين والأوصاف متعددة اللغات:

```javascript
// نموذج الصور (DB/models/image.model.js)
const imageSchema = new Schema({
  // حقول أخرى...
  title: {
    ar: { type: String, default: 'صورة بدون عنوان' },
    en: { type: String, default: 'Untitled Image' }
  },
  description: {
    ar: { type: String, default: '' },
    en: { type: String, default: '' }
  }
});

// طريقة للحصول على المحتوى باللغة المفضلة
imageSchema.methods.getLocalizedContent = function (language = 'ar') {
  const result = this.toObject();
  result.title = this.title[language] || this.title.ar;
  result.description = this.description[language] || this.description.ar;
  return result;
};
```

## إرسال استجابات متعددة اللغات

### وسيط الاستجابة

تم تحسين وسيط الاستجابة لدعم الرسائل متعددة اللغات:

```javascript
// وسيط الاستجابة (middleware/response.middleware.js)
export const responseMiddleware = (req, res, next) => {
  // الطريقة الأصلية لإرسال استجابة ناجحة
  res.success = (data, message, statusCode = 200) => {
    const language = req.language || 'ar';

    // اختيار الرسالة المناسبة باللغة المفضلة
    let localizedMessage = message;
    if (typeof message === 'object' && message !== null) {
      localizedMessage = message[language] || message.ar;
    }

    return res.status(statusCode).json({
      success: true,
      message: localizedMessage,
      data,
      language,
      timestamp: new Date().toISOString()
    });
  };

  // طريقة لإرسال استجابة خطأ
  res.fail = (errors, message, statusCode = 400) => {
    const language = req.language || 'ar';

    // اختيار رسالة الخطأ المناسبة باللغة المفضلة
    let localizedMessage = message;
    if (typeof message === 'object' && message !== null) {
      localizedMessage = message[language] || message.ar;
    }

    return res.status(statusCode).json({
      success: false,
      message: localizedMessage,
      errors,
      language,
      timestamp: new Date().toISOString()
    });
  };

  next();
};
```

## الإشعارات متعددة اللغات

### إرسال إشعارات متعددة اللغات

تم تحسين نظام الإشعارات لدعم إرسال الإشعارات باللغة المفضلة للمستخدم:

```javascript
// إرسال إشعار متعدد اللغات (utils/pushNotifications.js)
export const sendPushNotificationToUser = async (userId, notification, data = {}, options = {}) => {
  try {
    // الحصول على رمز FCM وتفضيل اللغة للمستخدم
    const user = await userModel.findById(userId).select('fcmToken preferredLanguage');

    if (!user || !user.fcmToken) {
      console.log(`المستخدم ${userId} ليس لديه رمز FCM`);
      return { success: false, message: 'لم يتم العثور على رمز FCM للمستخدم' };
    }

    const preferredLanguage = user.preferredLanguage || 'ar';

    // تحديد عنوان ونص الإشعار بناءً على تفضيل اللغة
    const notificationTitle =
      typeof notification.title === 'object'
        ? notification.title[preferredLanguage] || notification.title.ar
        : notification.title;

    const notificationBody =
      typeof notification.body === 'object'
        ? notification.body[preferredLanguage] || notification.body.ar
        : notification.body;

    // إرسال الإشعار للجهاز
    const message = {
      token: user.fcmToken,
      notification: {
        title: notificationTitle,
        body: notificationBody
      },
      data: {
        ...data,
        language: preferredLanguage
      }
      // إعدادات أخرى...
    };

    // إرسال الإشعار
    const response = await admin.messaging().send(message);
    return { success: true, messageId: response };
  } catch (error) {
    console.error('خطأ في إرسال الإشعار:', error);
    return { success: false, error: error.message };
  }
};
```

### مساعد لإنشاء إشعارات متعددة اللغات

تم إضافة وظيفة مساعدة لإنشاء كائنات الإشعارات متعددة اللغات:

```javascript
// إنشاء إشعار متعدد اللغات (utils/pushNotifications.js)
export const createMultilingualNotification = (titleAr, titleEn, bodyAr, bodyEn) => {
  return {
    title: {
      ar: titleAr,
      en: titleEn || titleAr
    },
    body: {
      ar: bodyAr,
      en: bodyEn || bodyAr
    }
  };
};

// مثال للاستخدام
await sendPushNotificationToUser(
  userId,
  createMultilingualNotification(
    'لديك رسالة جديدة',
    'You have a new message',
    `أرسل لك ${senderName} رسالة جديدة`,
    `${senderName} sent you a new message`
  ),
  { screen: 'ChatScreen', chatId }
);
```

## اختبار دعم اللغات المتعددة

### اختبار الاستجابات متعددة اللغات

```javascript
// اختبار جلب الإشعارات باللغة الإنجليزية
const response = await fetch('/api/notifications?language=en', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});

// اختبار جلب الإشعارات باللغة العربية
const response = await fetch('/api/notifications?language=ar', {
  headers: {
    Authorization: `Bearer ${token}`
  }
});
```

### اختبار تحديث تفضيل اللغة

```javascript
// تحديث تفضيل اللغة إلى الإنجليزية
const response = await fetch('/api/user/settings/language', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ language: 'en' })
});
```

## خاتمة

من خلال تنفيذ دعم اللغات المتعددة في جميع مستويات النظام، يمكن لتطبيق ArtHub توفير تجربة مستخدم سلسة لكل من المستخدمين العرب والإنجليز. يمكن توسيع نفس النهج لدعم لغات إضافية في المستقبل.
