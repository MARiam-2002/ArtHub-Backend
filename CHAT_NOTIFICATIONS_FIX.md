# إصلاح إشعارات الشات - Chat Notifications Fix

## المشكلة 🚨

كانت إشعارات الشات لا تعمل بينما إشعارات الأدمن تعمل بشكل طبيعي.

## السبب 🔍

**الفرق في تنسيق البيانات:**

### إشعارات الأدمن (تعمل) ✅
```javascript
{
  title: {
    ar: 'رسالة من إدارة المنصة',
    en: 'Message from Platform Administration'
  },
  body: {
    ar: 'محتوى الرسالة',
    en: 'Message content'
  }
}
```

### إشعارات الشات (لا تعمل) ❌
```javascript
{
  title: 'رسالة جديدة',  // نص عادي
  body: 'محتوى الرسالة'  // نص عادي
}
```

## الحل ✅

تم تحديث جميع دوال الإشعارات في `src/utils/pushNotifications.js` لدعم **اللغات المتعددة**:

### 1. إشعارات الشات
```javascript
export const sendChatMessageNotification = async (
  receiverId,
  senderId,
  senderName,
  messageText,
  chatId
) => {
  return sendPushNotificationToUser(
    receiverId,
    {
      title: {
        ar: senderName || 'رسالة جديدة',
        en: senderName || 'New Message'
      },
      body: {
        ar: messageText ? messageText.substring(0, 100) : 'صورة جديدة',
        en: messageText ? messageText.substring(0, 100) : 'New Image'
      }
    },
    {
      screen: 'CHAT_DETAIL',
      chatId: chatId.toString(),
      senderId: senderId.toString(),
      type: 'chat_message',
      unreadCount: unreadCount.toString(),
      timestamp: Date.now().toString()
    }
  );
};
```

### 2. إشعارات التعليقات
```javascript
export const sendCommentNotification = async (
  artistId,
  commenterId,
  commenterName,
  artworkId,
  artworkTitle
) =>
  sendPushNotificationToUser(
    artistId,
    {
      title: {
        ar: 'تعليق جديد',
        en: 'New Comment'
      },
      body: {
        ar: `قام ${commenterName} بالتعليق على "${artworkTitle}"`,
        en: `${commenterName} commented on "${artworkTitle}"`
      }
    },
    // ... باقي البيانات
  );
```

### 3. إشعارات المتابعين
```javascript
export const sendFollowNotification = async (artistId, followerId, followerName) =>
  sendPushNotificationToUser(
    artistId,
    {
      title: {
        ar: 'متابع جديد',
        en: 'New Follower'
      },
      body: {
        ar: `بدأ ${followerName} بمتابعتك`,
        en: `${followerName} started following you`
      }
    },
    // ... باقي البيانات
  );
```

### 4. إشعارات الطلبات الخاصة والعادية
```javascript
export const sendSpecialRequestNotification = async (
  userId,
  notificationType,
  senderName,
  requestTitle,
  requestType = 'custom_artwork', // custom_artwork (خاص) أو ready_artwork (عادي)
  additionalInfo = ''
) => {
  // تحديد نوع الطلب (خاص أم عادي)
  const isCustomRequest = requestType === 'custom_artwork';
  const requestTypeLabel = isCustomRequest ? 'خاص' : 'عادي';
  const requestTypeLabelEn = isCustomRequest ? 'Custom' : 'Ready';
  
  const notifications = {
    new_request: {
      title: {
        ar: `طلب ${requestTypeLabel} جديد`,
        en: `New ${requestTypeLabelEn} Request`
      },
      body: {
        ar: `لديك طلب ${requestTypeLabel} جديد من ${senderName}: ${requestTitle}`,
        en: `You have a new ${requestTypeLabelEn.toLowerCase()} request from ${senderName}: ${requestTitle}`
      }
    },
    accepted: {
      title: {
        ar: `تم قبول طلبك ${requestTypeLabel}`,
        en: `Your ${requestTypeLabelEn} Request Accepted`
      },
      body: {
        ar: `تم قبول طلبك ${requestTypeLabel} من قبل ${senderName}`,
        en: `Your ${requestTypeLabelEn.toLowerCase()} request has been accepted by ${senderName}`
      }
    },
    // ... المزيد من الأنواع
  };

  const notification = notifications[notificationType] || notifications.new_request;
  return sendPushNotificationToUser(userId, notification, data);
};
```

**أنواع الطلبات:**
- `custom_artwork` = طلب **خاص** (مثل لوحة مخصصة)
- `ready_artwork` = طلب **عادي** (من الأعمال الجاهزة)

**مثال على الفرق:**
```javascript
// طلب خاص - لوحة مخصصة
await sendSpecialRequestNotification(
  artistId,
  'new_request',
  'أحمد محمد',
  'لوحة زيتية مخصصة',
  'custom_artwork' // سيظهر: "طلب خاص جديد"
);

// طلب عادي - من الأعمال الجاهزة
await sendSpecialRequestNotification(
  artistId,
  'new_request',
  'أحمد محمد',
  'لوحة جاهزة',
  'ready_artwork' // سيظهر: "طلب عادي جديد"
);
```

## كيفية الاختبار 🧪

### 1. اختبار إشعارات الشات
```bash
node scripts/test-chat-notifications.js
```

### 2. اختبار إشعارات الأدمن
```bash
node scripts/test-admin-notification-fixed.js
```

### 3. اختبار إشعارات الطلبات الخاصة
```bash
node scripts/test-special-request-notifications.js
```

## النتيجة 🎉

الآن جميع الإشعارات تدعم **اللغات المتعددة** (العربية والإنجليزية) وستعمل بشكل صحيح في Flutter.

## ملاحظات مهمة 📝

1. **تأكد من وجود FCM tokens** للمستخدمين
2. **تأكد من تفعيل الإشعارات** في إعدادات المستخدم
3. **تأكد من صحة معرفات المستخدمين** في الاختبارات
4. **استخدم معرفات حقيقية** من قاعدة البيانات للاختبار

## الملفات المُحدثة 📁

- `src/utils/pushNotifications.js` - جميع دوال الإشعارات
- `src/modules/specialRequest/specialRequest.controller.js` - تحديث استخدام الإشعارات
- `scripts/test-chat-notifications.js` - ملف اختبار إشعارات الشات
- `scripts/test-special-request-notifications.js` - ملف اختبار إشعارات الطلبات الخاصة
- `CHAT_NOTIFICATIONS_FIX.md` - هذا الملف
