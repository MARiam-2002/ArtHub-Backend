# Notification System Documentation

## Overview

The ArtHub backend uses Firebase Cloud Messaging (FCM) to send push notifications to mobile devices. The notification system has been unified into a single comprehensive module located at `src/utils/pushNotifications.js`.

## Deprecation Notice

There were previously three separate notification files that have been unified:

1. `src/utils/pushNotifications.js` - The main (current) notification module
2. `src/utils/pushNotification.js` - **DEPRECATED**
3. `src/utils/fcmNotifications.js` - **DEPRECATED**

The deprecated files have been marked with warnings and will be removed in a future update.

## Main Notification Functions

The unified module provides the following core functions:

| Function                              | Description                                            |
| ------------------------------------- | ------------------------------------------------------ |
| `sendPushNotificationToUser`          | Send a notification to a single user                   |
| `sendPushNotificationToMultipleUsers` | Send a notification to multiple users                  |
| `sendPushNotificationToTopic`         | Send a notification to all users subscribed to a topic |
| `subscribeToTopic`                    | Subscribe user FCM tokens to a topic                   |
| `unsubscribeFromTopic`                | Unsubscribe user FCM tokens from a topic               |
| `updateUserFCMToken`                  | Update a user's FCM token in the database              |

## Predefined Notification Types

For common notification scenarios, we provide specialized helper functions:

| Function                      | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `sendChatMessageNotification` | Notify a user about a new chat message                |
| `sendCommentNotification`     | Notify an artist about a new comment on their artwork |
| `sendFollowNotification`      | Notify an artist about a new follower                 |
| `sendTransactionNotification` | Notify a user about a transaction (purchase/sale)     |

## Notification Data Structure

Each notification consists of:

1. **Notification Object**: Contains visible information like title and body
2. **Data Object**: Contains additional data for the app to handle, including:
   - `screen`: The screen to navigate to when tapped
   - `type`: The notification type (e.g., chat_message, new_comment)
   - `timestamp`: When the notification was sent
   - Additional relevant data for the specific notification type

## Example Usage

```javascript
import { sendPushNotificationToUser } from '../utils/pushNotifications.js';

// Basic notification
await sendPushNotificationToUser(
  userId,
  {
    title: 'Notification Title',
    body: 'Notification message content'
  },
  {
    screen: 'SCREEN_NAME',
    type: 'notification_type',
    additionalData: 'value'
  }
);

// Using predefined notification
import { sendChatMessageNotification } from '../utils/pushNotifications.js';

await sendChatMessageNotification(receiverId, senderId, 'Sender Name', 'Message content', chatId);
```

## Mobile App Integration

The notification system is optimized for Flutter mobile applications. When implementing the mobile notification handling:

1. Use the `data.screen` value to determine which screen to navigate to
2. Pass the relevant IDs from the data payload to the screen
3. For Android, ensure you have a notification channel with ID `arthub_channel`
4. For iOS, handle the badge and sound preferences correctly

## Environment Setup

Ensure the following environment variables are set for Firebase to work properly:

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY=your-private-key
```

The Firebase admin SDK is initialized in `src/utils/firebaseAdmin.js`.
