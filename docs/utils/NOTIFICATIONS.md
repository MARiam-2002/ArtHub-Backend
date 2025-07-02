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

# Notifications Implementation Guide for ArtHub Flutter

This guide explains how to implement notifications in the ArtHub Flutter application, working with the backend notification system.

## Overview

ArtHub's notification system includes:

1. **In-app notifications** - Shown within the app
2. **Push notifications** - Delivered to the user's device when the app is closed
3. **Notification center** - A dedicated screen showing all notifications

## Backend Integration

### Notification Model

The backend stores notifications with this structure:

```json
{
  "_id": "60d0fe4f5311236168a109cb",
  "user": "60d0fe4f5311236168a109ca",
  "title": {
    "ar": "تم قبول طلبك الخاص",
    "en": "Your special request was accepted"
  },
  "message": {
    "ar": "قام الفنان محمد فوزي بقبول طلبك لرسم لوحة زهرية زرقاء",
    "en": "Artist Mohammed Fawzy accepted your request to paint a blue floral artwork"
  },
  "type": "request",
  "isRead": false,
  "ref": "60d0fe4f5311236168a109cc",
  "refModel": "SpecialRequest",
  "data": {
    "artistId": "60d0fe4f5311236168a109cd"
  },
  "createdAt": "2023-05-15T10:30:45.123Z"
}
```

### API Endpoints

#### Fetch Notifications

```dart
Future<List<Notification>> getNotifications({
  int page = 1, 
  int limit = 20,
  bool unreadOnly = false
}) async {
  try {
    final response = await dio.get(
      '/api/notifications',
      queryParameters: {
        'page': page,
        'limit': limit,
        'unreadOnly': unreadOnly ? 'true' : 'false',
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
```

#### Mark as Read

```dart
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
```

#### Mark All as Read

```dart
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
```

## Push Notifications Setup

### Register Device for Push Notifications

```dart
Future<void> registerDeviceForNotifications() async {
  // Initialize Firebase
  await Firebase.initializeApp();
  
  // Request permission
  final messaging = FirebaseMessaging.instance;
  final settings = await messaging.requestPermission(
    alert: true,
    badge: true,
    sound: true,
  );
  
  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
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
}

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

### Handle Incoming Notifications

```dart
void setupNotificationHandlers() {
  // Handle background messages
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  
  // Handle foreground messages
  FirebaseMessaging.onMessage.listen((RemoteMessage message) {
    // Show local notification
    showLocalNotification(
      message.notification?.title ?? 'إشعار جديد',
      message.notification?.body ?? '',
      message.data,
    );
  });
  
  // Handle notification tap when app is in background
  FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
    handleNotificationTap(message.data);
  });
}

// This function must be top-level (not inside a class)
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling a background message: ${message.messageId}');
}

void handleNotificationTap(Map<String, dynamic> data) {
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
}
```

## UI Implementation

### Notification List Screen

```dart
class NotificationsScreen extends StatefulWidget {
  @override
  _NotificationsScreenState createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final NotificationService _notificationService = NotificationService();
  List<Notification> _notifications = [];
  bool _isLoading = false;
  int _page = 1;
  final int _limit = 20;
  bool _hasMore = true;
  
  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }
  
  Future<void> _loadNotifications() async {
    if (_isLoading || !_hasMore) return;
    
    setState(() {
      _isLoading = true;
    });
    
    final notifications = await _notificationService.getNotifications(
      page: _page,
      limit: _limit,
    );
    
    setState(() {
      _notifications.addAll(notifications);
      _isLoading = false;
      _page++;
      _hasMore = notifications.length == _limit;
    });
  }
  
  Future<void> _refreshNotifications() async {
    setState(() {
      _notifications = [];
      _page = 1;
      _hasMore = true;
    });
    
    await _loadNotifications();
  }
  
  Future<void> _markAllAsRead() async {
    final success = await _notificationService.markAllAsRead();
    if (success) {
      setState(() {
        _notifications = _notifications.map((notification) {
          notification.isRead = true;
          return notification;
        }).toList();
      });
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم وضع علامة مقروء على جميع الإشعارات')),
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('الإشعارات'),
        actions: [
          IconButton(
            icon: Icon(Icons.done_all),
            onPressed: _markAllAsRead,
            tooltip: 'وضع علامة مقروء على الكل',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _refreshNotifications,
        child: _notifications.isEmpty && !_isLoading
          ? Center(child: Text('لا توجد إشعارات'))
          : ListView.builder(
              itemCount: _notifications.length + (_hasMore ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == _notifications.length) {
                  _loadNotifications();
                  return Center(
                    child: Padding(
                      padding: EdgeInsets.all(8.0),
                      child: CircularProgressIndicator(),
                    ),
                  );
                }
                
                final notification = _notifications[index];
                return NotificationItem(
                  notification: notification,
                  onTap: () => _handleNotificationTap(notification),
                );
              },
            ),
      ),
    );
  }
  
  void _handleNotificationTap(Notification notification) async {
    // Mark as read if not already read
    if (!notification.isRead) {
      final success = await _notificationService.markAsRead(notification.id);
      if (success) {
        setState(() {
          notification.isRead = true;
        });
      }
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'message':
        if (notification.ref != null) {
          Navigator.of(context).pushNamed(
            '/chat/${notification.ref}',
          );
        }
        break;
      case 'request':
        if (notification.ref != null) {
          Navigator.of(context).pushNamed(
            '/special-requests/${notification.ref}',
          );
        }
        break;
      case 'review':
        if (notification.ref != null) {
          Navigator.of(context).pushNamed(
            '/artworks/${notification.ref}',
          );
        }
        break;
      default:
        // Just stay on the notifications screen
    }
  }
}
```

### Notification Item Widget

```dart
class NotificationItem extends StatelessWidget {
  final Notification notification;
  final VoidCallback onTap;
  
  const NotificationItem({
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
      subtitle: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(notification.message),
          SizedBox(height: 4),
          Text(
            _formatDate(notification.createdAt),
            style: TextStyle(
              color: Colors.grey,
              fontSize: 12,
            ),
          ),
        ],
      ),
      isThreeLine: true,
      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
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

### Notification Badge

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
    if (count == 0) return SizedBox();
    
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

### Notification Model

```dart
class Notification {
  final String id;
  final String userId;
  final String title;
  final String message;
  final String type;
  bool isRead;
  final String? ref;
  final String? refModel;
  final Map<String, dynamic> data;
  final DateTime createdAt;
  
  Notification({
    required this.id,
    required this.userId,
    required this.title,
    required this.message,
    required this.type,
    required this.isRead,
    this.ref,
    this.refModel,
    required this.data,
    required this.createdAt,
  });
  
  factory Notification.fromJson(Map<String, dynamic> json) {
    // Get localized title and message based on device language
    final String locale = Get.locale?.languageCode ?? 'ar';
    final String title = json['title'][locale] ?? json['title']['ar'];
    final String message = json['message'][locale] ?? json['message']['ar'];
    
    return Notification(
      id: json['_id'],
      userId: json['user'],
      title: title,
      message: message,
      type: json['type'],
      isRead: json['isRead'] ?? false,
      ref: json['ref'],
      refModel: json['refModel'],
      data: json['data'] ?? {},
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

## Notification Count Provider

```dart
class NotificationCountProvider extends ChangeNotifier {
  int _unreadCount = 0;
  
  int get unreadCount => _unreadCount;
  
  void setCount(int count) {
    _unreadCount = count;
    notifyListeners();
  }
  
  void incrementCount() {
    _unreadCount++;
    notifyListeners();
  }
  
  void decrementCount() {
    if (_unreadCount > 0) {
      _unreadCount--;
      notifyListeners();
    }
  }
  
  void resetCount() {
    _unreadCount = 0;
    notifyListeners();
  }
  
  Future<void> loadUnreadCount() async {
    try {
      final response = await dio.get(
        '/api/notifications/unread-count',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );
      
      if (response.data['success']) {
        setCount(response.data['data']['count'] ?? 0);
      }
    } catch (e) {
      print('Error loading unread count: $e');
    }
  }
}
```

## Best Practices

1. **Use appropriate image sizes** for notification icons
2. **Handle deep linking** properly to navigate to the right screen
3. **Implement proper error handling** for API calls
4. **Use pagination** for loading notifications
5. **Optimize list rendering** for large notification lists
6. **Support offline mode** by caching notifications
7. **Implement proper localization** for notification content
8. **Use proper date formatting** for notification timestamps
9. **Handle notification taps** to navigate to the right screen
10. **Update notification count** when new notifications arrive
