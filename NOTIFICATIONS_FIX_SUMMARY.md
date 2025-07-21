# إصلاح مشكلة Notifications Populate Sender

## 🐛 **المشكلة:**
```
StrictPopulateError: Cannot populate path `sender` because it is not in your schema. 
Set the `strictPopulate` option to false to override.
```

## 🔍 **السبب:**
الكود يحاول populate حقل `sender` في notifications لكن هذا الحقل غير موجود في schema.

## ✅ **الحل:**

### 1️⃣ **إضافة حقل `sender` إلى Notification Schema:**

```javascript
// DB/models/notification.model.js
const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    sender: { type: Types.ObjectId, ref: 'User' }, // ✅ إضافة حقل المرسل
    title: {
      ar: { type: String, required: true },
      en: { type: String }
    },
    message: {
      ar: { type: String, required: true },
      en: { type: String }
    },
    type: {
      type: String,
      enum: ['request', 'message', 'review', 'system', 'other'],
      default: 'other'
    },
    isRead: { type: Boolean, default: false },
    ref: { type: Types.ObjectId, refPath: 'refModel' },
    refModel: { type: String, enum: ['SpecialRequest', 'Artwork', 'Message', 'User'] },
    data: { type: Object, default: {} }
  },
  { timestamps: true }
);
```

### 2️⃣ **تحديث `getLocalizedContent` method:**

```javascript
notificationSchema.methods.getLocalizedContent = function (language = 'ar') {
  return {
    _id: this._id,
    user: this.user,
    sender: this.sender, // ✅ إضافة sender
    title: this.title[language] || this.title.ar,
    message: this.message[language] || this.message.ar,
    type: this.type,
    isRead: this.isRead,
    ref: this.ref,
    refModel: this.refModel,
    data: this.data,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};
```

### 3️⃣ **التحقق من `createNotification` function:**

```javascript
// src/modules/notification/notification.controller.js
export const createNotification = async (data) => {
  const { userId, type, title, message, sender, data: notificationData } = data;

  const notification = await notificationModel.create({
    user: userId,
    type,
    title,
    message,
    sender, // ✅ إرسال sender
    data: notificationData
  });

  return notification;
};
```

## 🧪 **اختبار الإصلاح:**

```bash
npm run test:notifications-fix
```

## 📋 **الملفات المحدثة:**

1. **`DB/models/notification.model.js`** - إضافة حقل `sender`
2. **`src/modules/notification/notification.controller.js`** - تحديث populate
3. **`scripts/test-notifications-fix.js`** - script اختبار جديد

## ✅ **النتيجة:**

- ✅ تم إصلاح مشكلة `StrictPopulateError`
- ✅ يمكن الآن populate `sender` بنجاح
- ✅ الإشعارات تعمل بشكل صحيح مع بيانات المرسل
- ✅ تم اختبار الإصلاح

## 🚀 **الاستخدام:**

```javascript
// الآن يمكن populate sender بنجاح
const notifications = await notificationModel
  .find({ user: userId })
  .populate('sender', 'displayName profileImage')
  .sort({ createdAt: -1 })
  .lean();
```

**تم إصلاح المشكلة بنجاح! 🎉** 