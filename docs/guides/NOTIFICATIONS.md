# Notification System Guide

## Overview

ArtHub features a comprehensive notification system that supports push notifications, in-app notifications, and multilingual content. This guide explains the notification system implementation.

## Key Features

- Multilingual notifications (Arabic and English)
- Push notifications via Firebase Cloud Messaging (FCM)
- Persistent notification storage in MongoDB
- Notification grouping and batching
- User language preference awareness
- Automatic device token management

## Notification Data Model

The notification model stores all notification data:

```javascript
// From notification.model.js
const notificationSchema = new Schema(
  {
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true
    },
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
      enum: ['system', 'chat', 'order', 'follow', 'like', 'comment', 'mention', 'offer'],
      default: 'system'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    ref: {
      type: Types.ObjectId,
      refPath: 'refModel'
    },
    refModel: {
      type: String,
      enum: ['User', 'Product', 'Order', 'Chat', 'Image', 'Comment']
    },
    data: {
      type: Object,
      default: {}
    }
  },
  { timestamps: true }
);
```

## Sending Notifications

### Creating Multilingual Notifications

Use the helper function to create notifications with content in both languages:

```javascript
// From pushNotifications.js
import { createMultilingualNotification } from '../../utils/pushNotifications.js';

const notification = createMultilingualNotification(
  'إشعار جديد', // Arabic title
  'New notification', // English title
  'هذا إشعار جديد', // Arabic body
  'This is a new notification' // English body
);
```

### Sending to a Single User

```javascript
// From pushNotifications.js
import { sendPushNotificationToUser } from '../../utils/pushNotifications.js';

const result = await sendPushNotificationToUser(
  userId,
  notification,
  {
    // Additional data to send with the notification
    screen: 'home', // Screen to navigate to when clicked
    id: '12345', // Optional reference ID
    type: 'system' // Notification type
  },
  {
    // Options
    saveToDatabase: true // Whether to save the notification to database
  }
);
```

### Sending to Multiple Users

```javascript
// From pushNotifications.js
import { sendPushNotificationToMultipleUsers } from '../../utils/pushNotifications.js';

const results = await sendPushNotificationToMultipleUsers(
  [userId1, userId2, userId3],
  notification,
  {
    screen: 'product',
    id: productId,
    type: 'like'
  },
  {
    saveToDatabase: true
  }
);
```

## Language Handling

The notification system automatically detects and respects user language preferences:

```javascript
// From pushNotifications.js
const preferredLanguage = user.preferredLanguage || 'ar';

const notificationTitle =
  typeof notification.title === 'object'
    ? notification.title[preferredLanguage] || notification.title.ar
    : notification.title;

const notificationBody =
  typeof notification.body === 'object'
    ? notification.body[preferredLanguage] || notification.body.ar
    : notification.body;
```

## Common Notification Types

### System Notifications

```javascript
await sendPushNotificationToUser(
  userId,
  createMultilingualNotification(
    'تحديث النظام',
    'System Update',
    'تم تحديث النظام بنجاح',
    'System updated successfully'
  ),
  {
    type: 'system',
    screen: 'home'
  }
);
```

### Chat Notifications

```javascript
await sendPushNotificationToUser(
  userId,
  createMultilingualNotification(
    `رسالة جديدة من ${senderName}`,
    `New message from ${senderName}`,
    messagePreview,
    messagePreview
  ),
  {
    type: 'chat',
    screen: 'chat',
    id: chatId
  }
);
```

### Order Notifications

```javascript
await sendPushNotificationToUser(
  userId,
  createMultilingualNotification(
    'تحديث الطلب',
    'Order Update',
    'تم تحديث حالة طلبك',
    'Your order status has been updated'
  ),
  {
    type: 'order',
    screen: 'orderDetails',
    id: orderId
  }
);
```

## Getting User Notifications

Fetch notifications with pagination and language preference:

```javascript
// From notification.controller.js
export const getUserNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20, language } = req.query;
  const preferredLanguage = language || req.user.preferredLanguage || 'ar';

  // Get total count for pagination
  const totalNotifications = await notificationModel.countDocuments({ user: userId });

  // Calculate total pages
  const totalPages = Math.ceil(totalNotifications / limit);

  // Fetch notifications with pagination
  const notifications = await notificationModel
    .find({ user: userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  // Map to localized content
  const localizedNotifications = notifications.map(notification =>
    notification.getLocalizedContent(preferredLanguage)
  );

  return res.status(200).json({
    success: true,
    data: {
      notifications: localizedNotifications,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalNotifications,
        limit
      }
    }
  });
});
```

## Marking Notifications as Read

```javascript
// From notification.controller.js
export const markNotificationAsRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  const notification = await notificationModel.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return res.status(404).json({
      success: false,
      message: 'الإشعار غير موجود',
      error: 'لم يتم العثور على إشعار بهذا المعرف'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'تم تحديث حالة الإشعار',
    data: notification.getLocalizedContent(req.preferredLanguage)
  });
});
```

## User Notification Settings

Users can configure their notification preferences:

```javascript
// From user.model.js
notificationSettings: {
  enablePush: {
    type: Boolean,
    default: true,
  },
  enableEmail: {
    type: Boolean,
    default: true,
  },
  muteChat: {
    type: Boolean,
    default: false,
  },
}
```

## Background Notification Jobs

For operations that might take time, notifications are sent after completion:

```javascript
// Example from image optimization
process.nextTick(async () => {
  try {
    // Perform long operation...

    // Send notification when complete
    await sendPushNotificationToUser(
      userId,
      {
        title: {
          ar: 'اكتمال العملية',
          en: 'Operation completed'
        },
        body: {
          ar: 'تم اكتمال العملية بنجاح',
          en: 'Operation completed successfully'
        }
      },
      {
        type: 'system',
        screen: 'home'
      }
    );
  } catch (error) {
    console.error('Error:', error);
  }
});
```

## Best Practices

1. Always provide notification content in both Arabic and English
2. Include appropriate navigation information (`screen`, `id`)
3. Set the correct notification type for proper categorization
4. Use concise and clear notification messages
5. Respect user notification settings
6. Include enough context in the notification for the user to understand without opening the app
7. Use appropriate notification priority for urgent vs. informational notifications
