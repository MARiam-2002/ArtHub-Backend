# إرسال رسائل الأدمن مع إنشاء Notifications

## 🎯 **الهدف:**
عندما يضغط الأدمن على "إرسال رسالة" في الواجهة، يتم إنشاء notification من نوع `system` مع logo التطبيق والتفاصيل المطلوبة.

## ✅ **التغييرات المطبقة:**

### 1️⃣ **تحديث دالة `sendMessageToUser`:**
```javascript
// في src/modules/admin/admin.controller.js
export const sendMessageToUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { message, subject, type = 'notification' } = req.body;

  // إنشاء notification من نوع system
  const notification = await notificationModel.create({
    user: user._id,
    sender: req.user._id, // الأدمن المرسل
    title: {
      ar: subject || 'رسالة من إدارة المنصة',
      en: subject || 'Message from Platform Administration'
    },
    message: {
      ar: message,
      en: message
    },
    type: 'system', // نوع system للإشعارات الإدارية
    data: {
      adminName: req.user.displayName,
      adminRole: req.user.role,
      messageType: 'admin_message',
      platformLogo: 'https://res.cloudinary.com/dz5dpvxg7/image/upload/v1691521498/arthub/logo/art-hub-logo.png',
      sentAt: new Date()
    }
  });

  // إرسال push notification
  if (user.notificationSettings?.enablePush && user.fcmTokens?.length > 0) {
    await sendPushNotification({
      tokens: user.fcmTokens,
      title: subject || 'رسالة من إدارة المنصة',
      body: message,
      data: {
        type: 'admin_message',
        notificationId: notification._id.toString(),
        adminId: req.user._id.toString()
      }
    });
  }

  // إرسال email
  if (user.notificationSettings?.enableEmail) {
    await sendEmail({
      to: user.email,
      subject: subject || 'رسالة من إدارة المنصة',
      message: message
    });
  }
});
```

### 2️⃣ **تحديث Notification Model:**
```javascript
// في DB/models/notification.model.js
type: {
  type: String,
  enum: ['request', 'message', 'review', 'system', 'admin', 'other'],
  default: 'other'
}
```

### 3️⃣ **تحديث Validation Schema:**
```javascript
// في src/modules/admin/admin.validation.js
export const sendMessageSchema = {
  body: joi.object({
    subject: joi.string().min(1).max(200).optional(),
    message: joi.string().min(1).max(2000).required(),
    type: joi.string().valid('notification', 'email', 'both').default('notification')
  })
};
```

## 🚀 **الميزات الجديدة:**

### ✅ **إنشاء Notification:**
- نوع: `system`
- يحتوي على logo التطبيق
- معلومات الأدمن المرسل
- تاريخ الإرسال

### ✅ **Push Notifications:**
- إرسال push notification للمستخدم
- إذا كان مفعل في إعدادات المستخدم
- مع بيانات إضافية للـ notification

### ✅ **Email Notifications:**
- إرسال email للمستخدم
- إذا كان مفعل في إعدادات المستخدم

### ✅ **الرد المحسن:**
```javascript
{
  success: true,
  message: 'تم إرسال الرسالة بنجاح',
  data: {
    userId: user._id,
    userName: user.displayName,
    notificationId: notification._id,
    messageType: 'system_notification',
    sentAt: new Date(),
    notification: {
      _id: notification._id,
      title: notification.title.ar,
      message: notification.message.ar,
      type: notification.type,
      data: notification.data
    }
  }
}
```

## 🧪 **اختبار الوظيفة:**

```bash
npm run test:admin-message
```

## 📱 **كيفية الاستخدام:**

### **Request:**
```javascript
POST /api/admin/users/:id/message
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "subject": "رسالة ترحيب من إدارة المنصة",
  "message": "مرحباً! نود أن نرحب بك في منصة ArtHub..."
}
```

### **Response:**
```javascript
{
  "success": true,
  "message": "تم إرسال الرسالة بنجاح",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "userName": "عمر خالد محمد",
    "notificationId": "507f1f77bcf86cd799439012",
    "messageType": "system_notification",
    "sentAt": "2025-01-18T10:30:00.000Z",
    "notification": {
      "_id": "507f1f77bcf86cd799439012",
      "title": "رسالة ترحيب من إدارة المنصة",
      "message": "مرحباً! نود أن نرحب بك...",
      "type": "system",
      "data": {
        "adminName": "أحمد محمد",
        "adminRole": "admin",
        "messageType": "admin_message",
        "platformLogo": "https://res.cloudinary.com/...",
        "sentAt": "2025-01-18T10:30:00.000Z"
      }
    }
  }
}
```

## 🎨 **في الواجهة:**

عندما يضغط الأدمن على "إرسال" في صفحة إرسال الرسالة:

1. **يتم إنشاء notification** مع logo التطبيق
2. **يظهر للمستخدم** في صفحة الإشعارات
3. **يحتوي على** تفاصيل الأدمن والرسالة
4. **يدعم** push notifications و emails

## ✅ **النتيجة:**

- ✅ إنشاء notification من نوع `system`
- ✅ يحتوي على logo التطبيق
- ✅ تفاصيل الأدمن المرسل
- ✅ دعم push notifications
- ✅ دعم email notifications
- ✅ رد محسن مع كل المعلومات 