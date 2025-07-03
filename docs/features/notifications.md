# Notifications Implementation Guide for ArtHub

This guide explains how to implement and use the notification system in ArtHub, covering both in-app notifications and push notifications.

## Overview

ArtHub's notification system consists of:

1. **In-App Notifications**: Displayed within the app when the user is active
2. **Push Notifications**: Delivered to the user's device even when the app is closed
3. **Notification Center**: A dedicated screen showing all notifications

## Notification Types

The system supports several notification types:

- **Chat Messages**: New messages from other users
- **Artwork Interactions**: Likes, comments, and purchases
- **Special Requests**: Updates on artwork requests
- **System Notifications**: App updates and announcements
- **Transaction Updates**: Purchase confirmations and shipping updates

## Backend Implementation

### Notification Model

```javascript
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
      enum: ['request', 'message', 'review', 'system', 'other'],
      default: 'other'
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
      enum: ['SpecialRequest', 'Artwork', 'Message', 'User'] 
    },
    data: { 
      type: Object, 
      default: {} 
    }
  },
  { timestamps: true }
);
```

### Creating Notifications

```javascript
// Helper function to create a notification
async function createNotification(userId, type, titleAr, messageAr, titleEn, messageEn, ref, refModel, data = {}) {
  try {
    const notification = await notificationModel.create({
      user: userId,
      title: {
        ar: titleAr,
        en: titleEn || titleAr
      },
      message: {
        ar: messageAr,
        en: messageEn || messageAr
      },
      type,
      ref,
      refModel,
      data
    });

    // Send push notification if user has FCM tokens
    const user = await userModel.findById(userId);
    if (user && user.fcmTokens && user.fcmTokens.length > 0) {
      await sendPushNotification(
        user.fcmTokens,
        titleAr,
        messageAr,
        {
          notificationId: notification._id.toString(),
          type,
          ref: ref ? ref.toString() : null,
          refModel,
          ...data
        }
      );
    }

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}
```

### Notification Endpoints

```javascript
// GET /api/notifications
router.get(
  '/',
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (page - 1) * limit;

    const query = { user: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await notificationModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalCount = await notificationModel.countDocuments(query);

    // Get user's preferred language
    const language = req.user.preferredLanguage || 'ar';

    // Localize notifications
    const localizedNotifications = notifications.map(notification => 
      notification.getLocalizedContent(language)
    );

    res.successPaginated(
      localizedNotifications,
      'تم جلب الإشعارات بنجاح',
      page,
      limit,
      totalCount
    );
  })
);

// PUT /api/notifications/:id/read
router.put(
  '/:id/read',
  isAuthenticated,
  asyncHandler(async (req, res, next) => {
    const notification = await notificationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return next(new Error('الإشعار غير موجود', { cause: 404 }));
    }

    res.success(notification, 'تم وضع علامة مقروء على الإشعار');
  })
);

// PUT /api/notifications/read-all
router.put(
  '/read-all',
  isAuthenticated,
  asyncHandler(async (req, res) => {
    const result = await notificationModel.updateMany(
      { user: req.user._id, isRead: false },
      { isRead: true }
    );

    res.success(
      { count: result.modifiedCount },
      'تم وضع علامة مقروء على جميع الإشعارات'
    );
  })
);
```

## Push Notifications with Firebase Cloud Messaging (FCM)

### Setting Up FCM

1. **Register FCM Token**:

```javascript
// POST /api/auth/fcm-token
router.post(
  '/fcm-token',
  isAuthenticated,
  isValidation(Validators.fcmTokenSchema),
  asyncHandler(async (req, res) => {
    const { token } = req.body;

    // Add FCM token to user document if not already present
    const user = await userModel.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { fcmTokens: token } },
      { new: true }
    );

    res.success(null, 'تم تحديث رمز الإشعارات بنجاح');
  })
);
```

### Sending Push Notifications

```javascript
// utils/pushNotifications.js
import admin from 'firebase-admin';

/**
 * Send push notification to multiple FCM tokens
 * @param {Array} tokens - FCM tokens to send to
 * @param {String} title - Notification title
 * @param {String} body - Notification body
 * @param {Object} data - Additional data to send
 * @returns {Promise} - FCM response
 */
export async function sendPushNotification(tokens, title, body, data = {}) {
  if (!tokens || tokens.length === 0) {
    return null;
  }

  try {
    const message = {
      notification: {
        title,
        body
      },
      data: {
        ...data,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      tokens: Array.isArray(tokens) ? tokens : [tokens]
    };

    const response = await admin.messaging().sendMulticast(message);
    
    // Handle failed tokens
    if (response.failureCount > 0) {
      const failedTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          failedTokens.push(tokens[idx]);
        }
      });
      
      // Remove failed tokens from users
      if (failedTokens.length > 0) {
        await userModel.updateMany(
          { fcmTokens: { $in: failedTokens } },
          { $pull: { fcmTokens: { $in: failedTokens } } }
        );
      }
    }

    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    return null;
  }
}
```

## Flutter Integration

### Setting Up FCM in Flutter

1. **Add dependencies**:

```yaml
dependencies:
  firebase_core: ^2.4.0
  firebase_messaging: ^14.2.0
  flutter_local_notifications: ^13.0.0
```

2. **Initialize Firebase**:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Initialize Firebase
Future<void> initializeFirebase() async {
  await Firebase.initializeApp();
  
  // Request permission for notifications
  final messaging = FirebaseMessaging.instance;
  await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
  
  // Get FCM token
  final token = await messaging.getToken();
  if (token != null) {
    // Send token to backend
    await sendFCMTokenToBackend(token);
  }
  
  // Listen for token refresh
  messaging.onTokenRefresh.listen((newToken) {
    sendFCMTokenToBackend(newToken);
  });
}

// Send FCM token to backend
Future<void> sendFCMTokenToBackend(String token) async {
  try {
    await dio.post(
      '/api/auth/fcm-token',
      data: {'token': token},
      options: Options(
        headers: {'Authorization': 'Bearer $accessToken'},
      ),
    );
    print('FCM token sent to backend');
  } catch (e) {
    print('Error sending FCM token to backend: $e');
  }
}
```

3. **Set up notification handlers**:

```dart
// Initialize notification channels
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

Future<void> setupNotifications() async {
  // Initialize local notifications
  const AndroidInitializationSettings androidSettings =
      AndroidInitializationSettings('@mipmap/ic_launcher');
  const DarwinInitializationSettings iosSettings =
      DarwinInitializationSettings();
  const InitializationSettings initSettings = InitializationSettings(
    android: androidSettings,
    iOS: iosSettings,
  );
  
  await flutterLocalNotificationsPlugin.initialize(
    initSettings,
    onDidReceiveNotificationResponse: (details) {
      // Handle notification tap
      handleNotificationTap(details.payload);
    },
  );

  // Create notification channels for Android
  if (Platform.isAndroid) {
    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(
          const AndroidNotificationChannel(
            'high_importance_channel',
            'High Importance Notifications',
            description: 'This channel is used for important notifications.',
            importance: Importance.high,
          ),
        );
  }

  // Handle background messages
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Handle foreground messages
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    _handleForegroundMessage(message);
  });
  
  // Handle notification tap when app is in background
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    handleNotificationTap(jsonEncode(message.data));
  });
  
  // Check if app was opened from a notification
  final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
  if (initialMessage != null) {
    handleNotificationTap(jsonEncode(initialMessage.data));
  }
}

// Background message handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling a background message: ${message.messageId}');
}

// Foreground message handler
void _handleForegroundMessage(RemoteMessage message) {
  print('Got a message whilst in the foreground!');
  print('Message data: ${message.data}');

  if (message.notification != null) {
    flutterLocalNotificationsPlugin.show(
      message.hashCode,
      message.notification!.title,
      message.notification!.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          'high_importance_channel',
          'High Importance Notifications',
          channelDescription: 'This channel is used for important notifications.',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: const DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }
}

// Handle notification tap
void handleNotificationTap(String? payload) {
  if (payload == null) return;
  
  try {
    final data = jsonDecode(payload);
    final String type = data['type'] ?? '';
    final String refId = data['ref'] ?? '';
    
    switch (type) {
      case 'message':
        navigateToChatScreen(refId);
        break;
      case 'request':
        navigateToRequestDetailsScreen(refId);
        break;
      case 'review':
        navigateToArtworkScreen(refId);
        break;
      default:
        navigateToNotificationsScreen();
    }
  } catch (e) {
    print('Error handling notification tap: $e');
    navigateToNotificationsScreen();
  }
}
```

### Fetching Notifications

```dart
class NotificationService {
  Future<List<Notification>> getNotifications({
    int page = 1,
    int limit = 20,
    bool unreadOnly = false,
  }) async {
    try {
      final response = await dio.get(
        '/api/notifications',
        queryParameters: {
          'page': page,
          'limit': limit,
          'unreadOnly': unreadOnly,
        },
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      if (response.data['success']) {
        final List<dynamic> notificationsData = response.data['data'];
        return notificationsData
            .map((data) => Notification.fromJson(data))
            .toList();
      }
      return [];
    } catch (e) {
      print('Error fetching notifications: $e');
      return [];
    }
  }

  Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await dio.put(
        '/api/notifications/$notificationId/read',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );
      return response.data['success'] ?? false;
    } catch (e) {
      print('Error marking notification as read: $e');
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    try {
      final response = await dio.put(
        '/api/notifications/read-all',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );
      return response.data['success'] ?? false;
    } catch (e) {
      print('Error marking all notifications as read: $e');
      return false;
    }
  }
}
```

### Notification UI Components

#### Notification Badge

```dart
class NotificationBadge extends StatelessWidget {
  final int count;
  final double size;

  const NotificationBadge({
    Key? key,
    required this.count,
    this.size = 20,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (count == 0) return const SizedBox();
    
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.red,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          count > 9 ? '9+' : count.toString(),
          style: TextStyle(
            color: Colors.white,
            fontSize: size * 0.6,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
```

#### Notification List

```dart
class NotificationsList extends StatelessWidget {
  final List<Notification> notifications;
  final Function(Notification) onTap;
  final Function(Notification) onMarkAsRead;

  const NotificationsList({
    Key? key,
    required this.notifications,
    required this.onTap,
    required this.onMarkAsRead,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    if (notifications.isEmpty) {
      return Center(
        child: Text(
          'لا توجد إشعارات',
          style: TextStyle(fontSize: 16),
        ),
      );
    }

    return ListView.builder(
      itemCount: notifications.length,
      itemBuilder: (context, index) {
        final notification = notifications[index];
        return NotificationTile(
          notification: notification,
          onTap: () {
            onTap(notification);
            if (!notification.isRead) {
              onMarkAsRead(notification);
            }
          },
        );
      },
    );
  }
}

class NotificationTile extends StatelessWidget {
  final Notification notification;
  final VoidCallback onTap;

  const NotificationTile({
    Key? key,
    required this.notification,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: _buildIcon(),
      title: Text(
        notification.title,
        style: TextStyle(
          fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
        ),
      ),
      subtitle: Text(notification.message),
      trailing: Text(
        _formatDate(notification.createdAt),
        style: TextStyle(
          color: Colors.grey,
          fontSize: 12,
        ),
      ),
      tileColor: notification.isRead ? null : Colors.blue.withOpacity(0.05),
      onTap: onTap,
    );
  }

  Widget _buildIcon() {
    IconData iconData;
    Color iconColor;

    switch (notification.type) {
      case 'message':
        iconData = Icons.chat;
        iconColor = Colors.blue;
        break;
      case 'request':
        iconData = Icons.brush;
        iconColor = Colors.orange;
        break;
      case 'review':
        iconData = Icons.star;
        iconColor = Colors.amber;
        break;
      case 'system':
        iconData = Icons.info;
        iconColor = Colors.green;
        break;
      default:
        iconData = Icons.notifications;
        iconColor = Colors.grey;
    }

    return CircleAvatar(
      backgroundColor: iconColor.withOpacity(0.2),
      child: Icon(
        iconData,
        color: iconColor,
      ),
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 7) {
      return '${date.year}/${date.month}/${date.day}';
    } else if (difference.inDays > 0) {
      return 'منذ ${difference.inDays} يوم';
    } else if (difference.inHours > 0) {
      return 'منذ ${difference.inHours} ساعة';
    } else if (difference.inMinutes > 0) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else {
      return 'الآن';
    }
  }
}
```

## Real-Time Notifications with Socket.IO

For real-time notifications, ArtHub uses Socket.IO:

```dart
class SocketService {
  late IO.Socket socket;
  final String baseUrl;
  final String accessToken;

  SocketService({
    required this.baseUrl,
    required this.accessToken,
  });

  void connect() {
    socket = IO.io(
      baseUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setExtraHeaders({'Authorization': 'Bearer $accessToken'})
          .build(),
    );

    socket.onConnect((_) {
      print('Socket connected');
    });

    socket.onDisconnect((_) {
      print('Socket disconnected');
    });

    socket.on('notification', (data) {
      // Handle real-time notification
      final notification = Notification.fromJson(data);
      _handleRealTimeNotification(notification);
    });
  }

  void disconnect() {
    socket.disconnect();
  }

  void _handleRealTimeNotification(Notification notification) {
    // Show in-app notification
    showInAppNotification(notification);
    
    // Update notification count
    NotificationCountProvider.instance.incrementCount();
    
    // Broadcast notification to interested widgets
    NotificationEventBus.instance.fire(NotificationEvent(notification));
  }
}
```

## Best Practices

1. **Handle Background/Foreground Differently**:
   - Show local notifications when app is in foreground
   - Let system handle notifications when app is in background

2. **Notification Grouping**:
   - Group related notifications (e.g., multiple messages from same chat)
   - Provide summary notifications for multiple events

3. **Deep Linking**:
   - Implement proper deep linking to navigate to the right screen
   - Pass necessary data in notification payload

4. **Notification Preferences**:
   - Allow users to customize notification preferences
   - Support muting specific notification types

5. **Offline Support**:
   - Store notifications locally for offline access
   - Sync read status when connection is restored

6. **Localization**:
   - Support notifications in user's preferred language
   - Use appropriate date/time formatting

7. **Performance**:
   - Implement pagination for notification list
   - Use efficient list rendering for large notification counts

## Troubleshooting

### Common Issues

1. **Notifications not showing**:
   - Check FCM token registration
   - Verify notification permissions
   - Check notification channel setup on Android

2. **Duplicate notifications**:
   - Ensure you're not showing both FCM and local notifications
   - Implement notification deduplication

3. **Deep linking not working**:
   - Verify payload format
   - Check navigation logic

### Debugging

1. **FCM Token**:
   - Print FCM token during app startup
   - Verify token is sent to backend

2. **Notification Payload**:
   - Log notification data when received
   - Check payload structure

3. **Firebase Console**:
   - Test sending notifications from Firebase Console
   - Check delivery status
