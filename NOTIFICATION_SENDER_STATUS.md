# حالة Sender في Notifications

## ✅ **نعم، حقل `sender` موجود ويعمل بشكل صحيح!**

### 📋 **الوضع الحالي:**

#### 1️⃣ **في Notification Model:**
```javascript
// DB/models/notification.model.js
const notificationSchema = new Schema(
  {
    user: { type: Types.ObjectId, ref: 'User', required: true },
    sender: { type: Types.ObjectId, ref: 'User' }, // ✅ موجود
    title: {
      ar: { type: String, required: true },
      en: { type: String }
    },
    message: {
      ar: { type: String, required: true },
      en: { type: String }
    },
    // ... باقي الحقول
  }
);
```

#### 2️⃣ **في Notification Controller:**
```javascript
// src/modules/notification/notification.controller.js
export const getNotifications = asyncHandler(async (req, res, next) => {
  // ...
  const notifications = await notificationModel
    .find(filter)
    .populate('sender', 'displayName profileImage') // ✅ يتم populate
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // تنسيق للفرونت إند
  const formattedNotifications = notifications.map(notification => ({
    _id: notification._id,
    title: notification.title?.ar || notification.title,
    message: notification.message?.ar || notification.message,
    type: notification.type,
    isRead: notification.isRead,
    sender: notification.sender ? { // ✅ يتم إرسال sender
      _id: notification.sender._id,
      displayName: notification.sender.displayName,
      profileImage: notification.sender.profileImage?.url
    } : null,
    data: notification.data || {},
    createdAt: notification.createdAt
  }));
  // ...
});
```

#### 3️⃣ **في createNotification Helper:**
```javascript
// src/modules/notification/notification.controller.js
export const createNotification = async (data) => {
  const { userId, type, title, message, sender, data: notificationData } = data;
  
  const notification = await notificationModel.create({
    user: userId,
    type,
    title,
    message,
    sender, // ✅ يتم حفظ sender
    data: notificationData
  });
  // ...
};
```

#### 4️⃣ **في Follow Controller (مثال للاستخدام):**
```javascript
// src/modules/follow/follow.controller.js
await createNotification({
  userId: artistId,
  title: 'متابع جديد',
  message: `${req.user.displayName} بدأ بمتابعتك`,
  type: 'follow',
  sender: follower, // ✅ يتم إرسال sender
  data: {
    followerId: follower.toString(),
    followerName: req.user.displayName
  }
});
```

### 🎯 **كيف يظهر في الفرونت إند:**

من الصورة التي أرسلتها، أرى أن الإشعارات تحتوي على:

1. **نص الإشعار** (مثل "لقد قامت مريم فوزي بمتابعة حسابك")
2. **الوقت** (مثل "منذ دقيقة")
3. **صورة دائرية** (صورة المرسل - مريم فوزي)

### 📱 **مثال للاستجابة من API:**

```json
{
  "success": true,
  "message": "تم جلب الإشعارات بنجاح",
  "data": {
    "notifications": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "title": "متابع جديد",
        "message": "مريم فوزي بدأ بمتابعتك",
        "type": "follow",
        "isRead": false,
        "sender": {
          "_id": "507f1f77bcf86cd799439012",
          "displayName": "مريم فوزي",
          "profileImage": "https://example.com/maryam.jpg"
        },
        "data": {
          "followerId": "507f1f77bcf86cd799439012",
          "followerName": "مريم فوزي"
        },
        "createdAt": "2025-01-18T10:30:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "hasNextPage": true
    },
    "summary": {
      "total": 100,
      "unread": 25
    }
  }
}
```

### 🧪 **اختبار Sender:**

```bash
npm run test:notification-sender
```

### ✅ **الخلاصة:**

- **✅ حقل `sender` موجود** في notification model
- **✅ يتم populate** sender مع displayName و profileImage
- **✅ يتم إرسال** sender في API response
- **✅ يتم استخدامه** في جميع أنواع الإشعارات
- **✅ يعمل بشكل صحيح** مع الفرونت إند

### 🚀 **الاستخدام:**

```javascript
// إنشاء إشعار مع sender
await createNotification({
  userId: targetUserId,
  title: 'عنوان الإشعار',
  message: 'محتوى الإشعار',
  type: 'follow',
  sender: senderUserId, // ID المستخدم المرسل
  data: { /* بيانات إضافية */ }
});
```

**حقل `sender` موجود ويعمل بشكل مثالي! 🎉** 