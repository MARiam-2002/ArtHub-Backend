# 🔧 الحلول الشاملة لمشاكل الشات والـ Flutter - ArtHub

## 🔍 المشاكل المحددة والحلول

### 1. مشكلة الشات متعدد الأجهزة 🔄

**المشكلة**: الرسائل لا تظهر مباشرة عند فتح الشات من جهازين مختلفين

**السبب**:
- مشاكل في Socket.io event names
- عدم وجود proper message synchronization
- مشاكل في real-time updates

**الحل**:

#### أ. تحديث ChatService في Flutter:

```dart
// art_hub-main/lib/features/user_chat/controller/services/chat_service.dart

import 'dart:developer';
import 'dart:async';
import 'package:art_hub/features/user_chat/controller/cubit/chat_cubit.dart';
import 'package:art_hub/services/network/remote/api_constants.dart';
import 'package:art_hub/services/servie_locator.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;

class ChatService {
  static ChatService? _instance;
  static ChatService get instance => _instance ??= ChatService._internal();

  ChatService._internal();

  io.Socket? _socket;
  bool _isConnected = false;
  String? _currentUserId;
  String? _currentChatId;
  Timer? _reconnectTimer;
  Timer? _heartbeatTimer;
  
  // Message deduplication
  final Set<String> _processedMessageIds = <String>{};
  
  String? get currentUserId => _currentUserId;
  bool get isConnected => _isConnected;

  // Initialize Socket Connection with improved reliability
  void initSocket(String userId, String token) {
    _currentUserId = userId;

    // Clean up existing connections
    _cleanup();

    _socket = io.io(ApiConstant.socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'timeout': 20000,
      'forceNew': true,
      'reconnection': true,
      'reconnectionAttempts': 10,
      'reconnectionDelay': 1000,
      'reconnectionDelayMax': 5000,
      'maxReconnectionAttempts': 10,
      'extraHeaders': {'Authorization': 'Bearer $token'},
    });

    _setupSocketListeners();
    _socket!.connect();
    _startHeartbeat();
  }

  void _setupSocketListeners() {
    // Connection Events
    _socket!.on('connect', (_) {
      log('✅ Socket Connected Successfully');
      _isConnected = true;
      _authenticateUser();
      _clearReconnectTimer();
      
      // Rejoin current chat if exists
      if (_currentChatId != null) {
        joinChat(_currentChatId!);
      }
    });

    _socket!.on('disconnect', (reason) {
      log('❌ Socket Disconnected: $reason');
      _isConnected = false;
      _scheduleReconnect();
    });

    _socket!.on('connect_error', (error) {
      log('❌ Socket Connection Error: $error');
      _isConnected = false;
      _scheduleReconnect();
    });

    _socket!.on('authenticated', (data) {
      log('✅ User Authenticated: $data');
    });

    _socket!.on('error', (data) {
      log('❌ Socket Error: $data');
    });

    // Chat Events - تصحيح أسماء الـ events
    _socket!.on('new_message', (data) {
      log('📨 New message received via socket: $data');
      _handleNewMessage(data);
    });

    _socket!.on('message_sent', (data) {
      log('📤 Message sent confirmation: $data');
      _handleMessageSent(data);
    });

    _socket!.on('messages_read', (data) {
      log('👁️ Messages read: $data');
      _handleMessagesRead(data);
    });

    _socket!.on('user_typing', (data) {
      log('⌨️ User typing: $data');
      _handleUserTyping(data);
    });

    _socket!.on('user_stopped_typing', (data) {
      log('⌨️ User stopped typing: $data');
      _handleUserStoppedTyping(data);
    });

    // Handle reconnection
    _socket!.on('reconnect', (attemptNumber) {
      log('🔄 Socket reconnected after $attemptNumber attempts');
      _isConnected = true;
      _authenticateUser();
    });

    _socket!.on('reconnect_error', (error) {
      log('❌ Socket reconnection error: $error');
    });

    // Handle pong for heartbeat
    _socket!.on('pong', (_) {
      log('💓 Heartbeat response received');
    });
  }

  void _authenticateUser() {
    if (_currentUserId != null && _isConnected) {
      _socket!.emit('authenticate', {'userId': _currentUserId});
    }
  }

  // Join Chat Room with improved error handling
  void joinChat(String chatId) {
    if (_isConnected && _currentUserId != null) {
      _currentChatId = chatId;
      _socket!.emit('join_chat', {
        'chatId': chatId, 
        'userId': _currentUserId
      });
      log('📥 Joined chat: $chatId');
    } else {
      log('⚠️ Cannot join chat: Socket not connected');
      // Schedule join for when connection is restored
      Timer(Duration(seconds: 1), () {
        if (_isConnected) joinChat(chatId);
      });
    }
  }

  // Leave Chat Room
  void leaveChat(String chatId) {
    if (_isConnected) {
      _socket!.emit('leave_chat', {'chatId': chatId});
      if (_currentChatId == chatId) {
        _currentChatId = null;
      }
    }
  }

  // Send Message with improved reliability
  void sendMessage(String chatId, String content, String receiverId) {
    if (_isConnected && _currentUserId != null) {
      final messageData = {
        'chatId': chatId,
        'content': content,
        'senderId': _currentUserId,
        'receiverId': receiverId,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
        'messageId': '${_currentUserId}_${DateTime.now().millisecondsSinceEpoch}',
      };
      
      _socket!.emit('send_message', messageData);
      log('📤 Message sent via socket: $content');
    } else {
      log('⚠️ Cannot send message: Socket not connected');
    }
  }

  // Typing Indicators
  void startTyping(String chatId) {
    if (_isConnected && _currentUserId != null) {
      _socket!.emit('typing', {'chatId': chatId, 'userId': _currentUserId});
    }
  }

  void stopTyping(String chatId) {
    if (_isConnected && _currentUserId != null) {
      _socket!.emit('stop_typing', {
        'chatId': chatId,
        'userId': _currentUserId,
      });
    }
  }

  // Mark Messages as Read
  void markMessagesAsRead(String chatId) {
    if (_isConnected && _currentUserId != null) {
      _socket!.emit('mark_read', {'chatId': chatId, 'userId': _currentUserId});
    }
  }

  // Event Handlers with improved error handling and deduplication
  void _handleNewMessage(dynamic data) {
    try {
      log('📨 Processing new message: $data');
      
      if (data == null) {
        log('⚠️ Received null message data');
        return;
      }

      Map<String, dynamic> messageData;
      
      if (data is Map<String, dynamic>) {
        if (data.containsKey('message')) {
          messageData = data['message'];
        } else {
          messageData = data;
        }
      } else {
        log('⚠️ Unexpected message data type: ${data.runtimeType}');
        return;
      }

      // Message deduplication
      final messageId = messageData['_id'] ?? messageData['id'] ?? messageData['messageId'];
      if (messageId != null && _processedMessageIds.contains(messageId)) {
        log('📨 Duplicate message detected, skipping: $messageId');
        return;
      }

      if (messageId != null) {
        _processedMessageIds.add(messageId);
        // Keep only last 1000 message IDs to prevent memory issues
        if (_processedMessageIds.length > 1000) {
          final List<String> ids = _processedMessageIds.toList();
          _processedMessageIds.clear();
          _processedMessageIds.addAll(ids.skip(500));
        }
      }

      // Handle the message
      getIt<ChatCubit>().handleIncomingMessage(messageData);
      
    } catch (e, stackTrace) {
      log('❌ Error handling incoming message: $e');
      log('❌ Stack trace: $stackTrace');
      log('❌ Message data: $data');
    }
  }

  void _handleMessageSent(dynamic data) {
    try {
      log('📤 Message sent confirmation: $data');
      // Update UI to show message as sent
      getIt<ChatCubit>().handleMessageSentConfirmation(data);
    } catch (e) {
      log('❌ Error handling message sent confirmation: $e');
    }
  }

  void _handleMessagesRead(dynamic data) {
    try {
      log('👁️ Messages read: $data');
      getIt<ChatCubit>().handleMessagesRead(data);
    } catch (e) {
      log('❌ Error handling messages read: $e');
    }
  }

  void _handleUserTyping(dynamic data) {
    try {
      log('⌨️ User typing: $data');
      getIt<ChatCubit>().handleUserTyping(data);
    } catch (e) {
      log('❌ Error handling user typing: $e');
    }
  }

  void _handleUserStoppedTyping(dynamic data) {
    try {
      log('⌨️ User stopped typing: $data');
      getIt<ChatCubit>().handleUserStoppedTyping(data);
    } catch (e) {
      log('❌ Error handling user stopped typing: $e');
    }
  }

  // Heartbeat mechanism
  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(Duration(seconds: 30), (timer) {
      if (_isConnected && _socket != null) {
        _socket!.emit('ping');
      }
    });
  }

  // Reconnection management
  void _scheduleReconnect() {
    _clearReconnectTimer();
    _reconnectTimer = Timer(Duration(seconds: 5), () {
      if (!_isConnected && _currentUserId != null) {
        log('🔄 Attempting to reconnect...');
        _socket?.connect();
      }
    });
  }

  void _clearReconnectTimer() {
    _reconnectTimer?.cancel();
    _reconnectTimer = null;
  }

  // Cleanup
  void _cleanup() {
    _heartbeatTimer?.cancel();
    _clearReconnectTimer();
    _socket?.disconnect();
    _socket?.dispose();
    _isConnected = false;
    _processedMessageIds.clear();
  }

  // Reconnect manually
  void reconnect() {
    if (_currentUserId != null) {
      final token = _socket?.io.options?['extraHeaders']?['Authorization']?.toString().replaceFirst('Bearer ', '');
      if (token != null) {
        initSocket(_currentUserId!, token);
      }
    }
  }

  // Disconnect
  void disconnect() {
    _cleanup();
    _currentUserId = null;
    _currentChatId = null;
  }

  // Check if socket is connected
  bool get isSocketConnected => _socket?.connected ?? false;

  // Get connection status
  String get connectionStatus {
    if (_isConnected) return 'Connected';
    if (_socket?.disconnected == true) return 'Disconnected';
    return 'Connecting...';
  }
}
```

#### ب. تحديث ChatCubit لدعم الميزات الجديدة:

```dart
// إضافة هذه المثودات للـ ChatCubit

class ChatCubit extends Cubit<ChatState> {
  // ... existing code ...

  // Handle message sent confirmation
  void handleMessageSentConfirmation(dynamic data) {
    try {
      log('📤 Message sent confirmation received: $data');
      // Update message status to sent
      final messageId = data['messageId'] ?? data['_id'];
      if (messageId != null) {
        // Find and update message status
        final messageIndex = _messages.indexWhere((msg) => msg.id == messageId);
        if (messageIndex != -1) {
          _messages[messageIndex] = _messages[messageIndex].copyWith(
            status: 'sent',
          );
          emit(ChatLoaded(List.from(_messages)));
        }
      }
    } catch (e) {
      log('❌ Error handling message sent confirmation: $e');
    }
  }

  // Handle messages read
  void handleMessagesRead(dynamic data) {
    try {
      log('👁️ Handling messages read: $data');
      final chatId = data['chatId'];
      final readBy = data['readBy'];
      
      if (chatId != null && readBy != null) {
        // Update messages as read
        bool hasChanges = false;
        for (int i = 0; i < _messages.length; i++) {
          if (_messages[i].sender?.id != readBy && !_messages[i].isRead) {
            _messages[i] = _messages[i].copyWith(isRead: true);
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          emit(ChatLoaded(List.from(_messages)));
        }
      }
    } catch (e) {
      log('❌ Error handling messages read: $e');
    }
  }

  // Handle user typing
  void handleUserTyping(dynamic data) {
    try {
      final userId = data['userId'];
      final chatId = data['chatId'];
      
      if (userId != null && userId != _currentUserId) {
        emit(ChatUserTyping(userId, chatId));
      }
    } catch (e) {
      log('❌ Error handling user typing: $e');
    }
  }

  // Handle user stopped typing
  void handleUserStoppedTyping(dynamic data) {
    try {
      final userId = data['userId'];
      final chatId = data['chatId'];
      
      if (userId != null && userId != _currentUserId) {
        emit(ChatUserStoppedTyping(userId, chatId));
      }
    } catch (e) {
      log('❌ Error handling user stopped typing: $e');
    }
  }

  // Enhanced message handling with better duplicate prevention
  @override
  void handleIncomingMessage(dynamic data) {
    try {
      log('📨 Handling incoming message: $data');
      final message = Message.fromJson(data);
      
      // Enhanced duplicate check
      final isDuplicate = _messages.any((msg) => 
        msg.id == message.id || 
        (msg.content == message.content && 
         msg.sender?.id == message.sender?.id && 
         msg.createdAt != null && message.createdAt != null &&
         (msg.createdAt!.difference(message.createdAt!).abs().inSeconds < 2))
      );
      
      if (!isDuplicate && !message.isFromMe!) {
        _messages.add(message);
        log('📨 New message added. Total: ${_messages.length}');
        emit(ChatLoaded(List.from(_messages)));
        
        // Play notification sound if app is in foreground
        _playMessageSound();
      } else {
        log('📨 Message skipped (duplicate or from self)');
      }
    } catch (e) {
      log('❌ Error handling incoming message: $e');
    }
  }

  void _playMessageSound() {
    // Add sound notification here if needed
    // You can use flutter_local_notifications or similar package
  }

  // Get current user ID
  String? get _currentUserId => ChatService.instance.currentUserId;
}
```

#### ج. إضافة Chat States جديدة:

```dart
// إضافة للـ chat_state.dart

abstract class ChatState extends Equatable {
  const ChatState();

  @override
  List<Object> get props => [];
}

// ... existing states ...

class ChatUserTyping extends ChatState {
  final String userId;
  final String chatId;
  
  const ChatUserTyping(this.userId, this.chatId);
  
  @override
  List<Object> get props => [userId, chatId];
}

class ChatUserStoppedTyping extends ChatState {
  final String userId;
  final String chatId;
  
  const ChatUserStoppedTyping(this.userId, this.chatId);
  
  @override
  List<Object> get props => [userId, chatId];
}

class ChatConnectionStatusChanged extends ChatState {
  final bool isConnected;
  final String status;
  
  const ChatConnectionStatusChanged(this.isConnected, this.status);
  
  @override
  List<Object> get props => [isConnected, status];
}
```

### 2. حل مشكلة تكرار Push Notifications 📱

**المشكلة**: إرسال إشعارات متعددة لنفس الرسالة

**الحل**:

#### أ. تحديث FCM Service في Flutter:

```dart
// art_hub-main/lib/services/firebase_messaging_service.dart

class FCMService {
  // ... existing code ...

  // Message deduplication for notifications
  final Set<String> _processedNotificationIds = <String>{};
  Timer? _cleanupTimer;

  @override
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Request permissions
      await _requestPermissions();

      // Create notification channels
      await _createNotificationChannels();

      // Configure foreground message handling with deduplication
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Configure background message handling
      FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

      // Configure notification tap handling
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // Handle initial message if app was opened from notification
      final initialMessage = await FirebaseMessaging.instance.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      // Start cleanup timer for processed notifications
      _startCleanupTimer();

      _isInitialized = true;
      debugPrint('✅ FCM Service initialized successfully');
    } catch (e) {
      debugPrint('❌ Error initializing FCM Service: $e');
    }
  }

  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📱 Foreground message received: ${message.messageId}');
    
    // Check for duplicates
    final messageId = message.messageId ?? message.data['messageId'] ?? 
                     '${message.data['chatId']}_${message.data['timestamp']}';
    
    if (_processedNotificationIds.contains(messageId)) {
      debugPrint('📱 Duplicate notification detected, skipping: $messageId');
      return;
    }

    _processedNotificationIds.add(messageId);
    
    // Show notification only if not in chat screen
    if (!_isInChatScreen(message.data['chatId'])) {
      _showNotificationSafely(message);
    }
    
    // Handle real-time updates
    _handleRealTimeUpdate(message);
  }

  bool _isInChatScreen(String? chatId) {
    // Check if user is currently in the specific chat screen
    // This should be implemented based on your navigation logic
    // For now, return false to always show notifications
    return false;
  }

  void _handleRealTimeUpdate(RemoteMessage message) {
    // Update chat in real-time without showing notification
    final messageType = message.data['type'] ?? 'chat';
    
    switch (messageType) {
      case 'chat':
        _updateChatRealTime(message);
        break;
      case 'order':
        _updateOrderRealTime(message);
        break;
      // Add more cases as needed
    }
  }

  void _updateChatRealTime(RemoteMessage message) {
    // Trigger chat update through EventBus or similar
    // This ensures the chat UI updates even without notification
    try {
      final chatData = {
        'chatId': message.data['chatId'],
        'messageContent': message.data['content'],
        'senderId': message.data['senderId'],
        'timestamp': message.data['timestamp'],
      };
      
      // Use your preferred state management to update chat
      // For example, if using EventBus:
      // EventBus.instance.fire(ChatUpdateEvent(chatData));
      
      debugPrint('📱 Chat updated in real-time');
    } catch (e) {
      debugPrint('❌ Error updating chat in real-time: $e');
    }
  }

  void _startCleanupTimer() {
    _cleanupTimer?.cancel();
    _cleanupTimer = Timer.periodic(Duration(minutes: 30), (timer) {
      // Keep only last 500 notification IDs
      if (_processedNotificationIds.length > 500) {
        final ids = _processedNotificationIds.toList();
        _processedNotificationIds.clear();
        _processedNotificationIds.addAll(ids.skip(250));
      }
      debugPrint('📱 Notification IDs cleaned up');
    });
  }

  @override
  Future<void> dispose() async {
    _cleanupTimer?.cancel();
    _processedNotificationIds.clear();
  }

  // Enhanced notification display with better error handling
  @override
  Future<void> _showNotificationSafely(RemoteMessage message) async {
    try {
      debugPrint('📱 Showing notification: ${message.messageId}');

      // Determine notification priority
      final priority = message.data['priority']?.toString() ?? 'normal';
      final isHighPriority = priority == 'high' || priority == 'max';

      // Create notification with unique ID to prevent duplicates
      final notificationId = _generateUniqueNotificationId(message);
      
      final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
        isHighPriority ? _highImportanceChannel.id : _regularChannel.id,
        isHighPriority ? _highImportanceChannel.name : _regularChannel.name,
        importance: isHighPriority ? Importance.max : Importance.high,
        priority: isHighPriority ? Priority.max : Priority.high,
        showWhen: true,
        when: DateTime.now().millisecondsSinceEpoch,
        enableVibration: true,
        playSound: true,
        enableLights: true,
        icon: "@mipmap/ic_launcher",
        groupKey: 'arthub_notifications',
        autoCancel: true,
        tag: 'arthub_${message.data['type'] ?? 'default'}', // Unique tag per type
        onlyAlertOnce: true, // Prevent duplicate alerts
      );

      const DarwinNotificationDetails iOSDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
        interruptionLevel: InterruptionLevel.active,
      );

      final NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
        iOS: iOSDetails,
      );

      final payload = _createNotificationPayloadSafely(message);

      await _localNotifications.show(
        notificationId,
        message.notification?.title ?? 'ArtHub',
        message.notification?.body ?? 'لديك إشعار جديد',
        platformDetails,
        payload: payload,
      );

      debugPrint('✅ Notification shown successfully: $notificationId');
    } catch (e) {
      debugPrint('❌ Error showing notification: $e');
    }
  }

  int _generateUniqueNotificationId(RemoteMessage message) {
    // Generate unique ID based on message content and timestamp
    final messageId = message.messageId ?? 
                     message.data['messageId'] ?? 
                     '${message.data['chatId']}_${DateTime.now().millisecondsSinceEpoch}';
    return messageId.hashCode.abs() % 2147483647; // Ensure positive 32-bit int
  }
}

// Background message handler with deduplication
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📱 Background message: ${message.messageId}');
  
  // Initialize Firebase if not already done
  await Firebase.initializeApp();
  
  // Handle background message (you can add specific logic here)
  // Note: Background messages automatically show notifications on Android
  // so we don't need to manually show them
}
```

#### ب. تحديث Backend لتقليل الإشعارات المكررة:

```javascript
// src/utils/pushNotifications.js - تحديث دالة إرسال الإشعارات

export const sendChatMessageNotification = async (
  receiverId,
  senderId,
  senderName,
  messageText,
  chatId,
  messageType = 'text',
  messageId = null
) => {
  try {
    // Check if user is online and in the same chat
    const receiverUser = await userModel.findById(receiverId).select('isOnline lastSeen fcmTokens');
    
    if (!receiverUser || !receiverUser.fcmTokens || receiverUser.fcmTokens.length === 0) {
      console.log(`No FCM tokens found for user ${receiverId}`);
      return { success: false, error: 'No FCM tokens' };
    }

    // Don't send notification if user was online recently (within last 30 seconds)
    // This helps prevent notifications when user is actively chatting
    const lastSeenThreshold = new Date(Date.now() - 30000); // 30 seconds ago
    if (receiverUser.isOnline && receiverUser.lastSeen > lastSeenThreshold) {
      console.log(`User ${receiverId} is online and active, skipping notification`);
      return { success: true, skipped: true, reason: 'User is online and active' };
    }

    // Create unique notification ID to prevent duplicates
    const notificationId = messageId || `chat_${chatId}_${senderId}_${Date.now()}`;
    
    // Check if we recently sent a notification for this chat (within last 10 seconds)
    const recentNotificationKey = `chat_notification_${chatId}_${receiverId}`;
    const lastNotificationTime = await redis.get(recentNotificationKey);
    
    if (lastNotificationTime) {
      const timeDiff = Date.now() - parseInt(lastNotificationTime);
      if (timeDiff < 10000) { // 10 seconds
        console.log(`Recent notification sent for chat ${chatId}, skipping`);
        return { success: true, skipped: true, reason: 'Recent notification exists' };
      }
    }

    // Set notification timestamp in Redis
    await redis.setex(recentNotificationKey, 30, Date.now().toString()); // Expire in 30 seconds

    // Get unread count for this specific chat
    const messageModel = (await import('../../DB/models/message.model.js')).default;
    const unreadCount = await messageModel.countDocuments({
      chat: chatId,
      sender: { $ne: receiverId },
      isRead: false,
      isDeleted: { $ne: true }
    });

    // Determine notification content based on message type
    let notificationBody = {
      ar: '',
      en: ''
    };

    switch (messageType) {
      case 'voice':
        notificationBody = { ar: 'رسالة صوتية جديدة', en: 'New Voice Message' };
        break;
      case 'image':
        notificationBody = { ar: 'صورة جديدة', en: 'New Image' };
        break;
      case 'file':
        notificationBody = { ar: 'ملف جديد', en: 'New File' };
        break;
      default: // text
        const truncatedText = messageText ? messageText.substring(0, 100) : '';
        notificationBody = {
          ar: truncatedText || 'رسالة جديدة',
          en: truncatedText || 'New Message'
        };
    }

    const notification = {
      title: { ar: senderName, en: senderName },
      body: notificationBody
    };

    const data = {
      type: 'chat',
      chatId: chatId,
      senderId: senderId,
      messageId: notificationId,
      content: messageText,
      messageType: messageType,
      screen: 'chat',
      timestamp: Date.now().toString(),
      unreadCount: unreadCount.toString(),
      // Add unique identifier to prevent duplicates on client side
      notificationId: notificationId
    };

    return await sendPushNotificationToUser(receiverId, notification, data, {
      saveToDatabase: true,
      priority: 'high'
    });

  } catch (error) {
    console.error('Error sending chat message notification:', error);
    return { success: false, error: error.message };
  }
};

// Add Redis import at the top of the file
import Redis from 'ioredis';
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
```

### 3. حل مشاكل الأداء والـ UI 🚀

#### أ. تحسين أداء الشات:

```dart
// إضافة Caching للرسائل
class ChatCacheManager {
  static final ChatCacheManager _instance = ChatCacheManager._internal();
  factory ChatCacheManager() => _instance;
  ChatCacheManager._internal();

  final Map<String, List<Message>> _messageCache = {};
  final Map<String, DateTime> _cacheTimestamps = {};
  
  static const Duration CACHE_DURATION = Duration(minutes: 10);

  List<Message>? getCachedMessages(String chatId) {
    final timestamp = _cacheTimestamps[chatId];
    if (timestamp != null && 
        DateTime.now().difference(timestamp) < CACHE_DURATION) {
      return _messageCache[chatId];
    }
    return null;
  }

  void cacheMessages(String chatId, List<Message> messages) {
    _messageCache[chatId] = List.from(messages);
    _cacheTimestamps[chatId] = DateTime.now();
  }

  void clearCache(String chatId) {
    _messageCache.remove(chatId);
    _cacheTimestamps.remove(chatId);
  }

  void clearAllCache() {
    _messageCache.clear();
    _cacheTimestamps.clear();
  }
}
```

#### ب. تحسين ChatCubit مع Caching:

```dart
// تحديث ChatCubit
class ChatCubit extends Cubit<ChatState> {
  // ... existing code ...
  
  final ChatCacheManager _cacheManager = ChatCacheManager();

  @override
  Future<List<Message>> getChatMessages(String chatId) async {
    // Try cache first
    final cachedMessages = _cacheManager.getCachedMessages(chatId);
    if (cachedMessages != null) {
      _messages.clear();
      _messages.addAll(cachedMessages);
      emit(ChatLoaded(List.from(_messages)));
      return _messages;
    }

    emit(ChatLoading());
    try {
      final token = await CacheServices.instance.getAccessToken();
      final response = await dio.fetchData(
        url: ApiConstant.chatMessages(chatId),
        token: token,
      );

      if (response.statusCode == 200) {
        final chatMessagesWrapper = ChatMessagesModel.fromJson(response.data);
        final List<Message> loadedMessages = chatMessagesWrapper.data?.messages ?? [];
        
        _messages.clear();
        _messages.addAll(loadedMessages);
        
        // Cache the messages
        _cacheManager.cacheMessages(chatId, loadedMessages);
        
        emit(ChatLoaded(List.from(_messages)));
        return _messages;
      } else {
        emit(ChatError(response.data['message'] ?? "Failed to load chat messages"));
        return [];
      }
    } catch (error) {
      final message = (error is DioException)
          ? error.response?.data['message'] ?? "Network error"
          : error.toString();
      emit(ChatError(message));
      return [];
    }
  }

  @override
  void addMessage(Message message) {
    _messages.add(message);
    // Update cache
    if (_messages.isNotEmpty) {
      final chatId = message.chat?.toString() ?? '';
      if (chatId.isNotEmpty) {
        _cacheManager.cacheMessages(chatId, _messages);
      }
    }
    emit(ChatLoaded(List.from(_messages)));
  }
}
```

### 4. حل المشاكل المحددة من قائمة العميل 📋

#### أ. مشكلة النقطة الحمراء على الرسائل والإشعارات:

```dart
// إنشاء NotificationBadgeManager
class NotificationBadgeManager {
  static final NotificationBadgeManager _instance = NotificationBadgeManager._internal();
  factory NotificationBadgeManager() => _instance;
  NotificationBadgeManager._internal();

  int _unreadMessagesCount = 0;
  int _unreadNotificationsCount = 0;
  
  final StreamController<int> _messagesCountController = StreamController<int>.broadcast();
  final StreamController<int> _notificationsCountController = StreamController<int>.broadcast();

  Stream<int> get messagesCountStream => _messagesCountController.stream;
  Stream<int> get notificationsCountStream => _notificationsCountController.stream;

  int get unreadMessagesCount => _unreadMessagesCount;
  int get unreadNotificationsCount => _unreadNotificationsCount;

  void updateMessagesCount(int count) {
    _unreadMessagesCount = count;
    _messagesCountController.add(count);
  }

  void updateNotificationsCount(int count) {
    _unreadNotificationsCount = count;
    _notificationsCountController.add(count);
  }

  void incrementMessagesCount() {
    _unreadMessagesCount++;
    _messagesCountController.add(_unreadMessagesCount);
  }

  void incrementNotificationsCount() {
    _unreadNotificationsCount++;
    _notificationsCountController.add(_unreadNotificationsCount);
  }

  void clearMessagesCount() {
    _unreadMessagesCount = 0;
    _messagesCountController.add(0);
  }

  void clearNotificationsCount() {
    _unreadNotificationsCount = 0;
    _notificationsCountController.add(0);
  }

  void dispose() {
    _messagesCountController.close();
    _notificationsCountController.close();
  }
}

// استخدام في Bottom Navigation
class BottomNavigationWidget extends StatefulWidget {
  @override
  _BottomNavigationWidgetState createState() => _BottomNavigationWidgetState();
}

class _BottomNavigationWidgetState extends State<BottomNavigationWidget> {
  final NotificationBadgeManager _badgeManager = NotificationBadgeManager();

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      items: [
        BottomNavigationBarItem(
          icon: Icon(Icons.home),
          label: 'الرئيسية',
        ),
        BottomNavigationBarItem(
          icon: StreamBuilder<int>(
            stream: _badgeManager.messagesCountStream,
            builder: (context, snapshot) {
              final count = snapshot.data ?? 0;
              return Stack(
                children: [
                  Icon(Icons.message),
                  if (count > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        padding: EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        constraints: BoxConstraints(
                          minWidth: 12,
                          minHeight: 12,
                        ),
                        child: Text(
                          count > 99 ? '99+' : count.toString(),
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          label: 'الرسائل',
        ),
        BottomNavigationBarItem(
          icon: StreamBuilder<int>(
            stream: _badgeManager.notificationsCountStream,
            builder: (context, snapshot) {
              final count = snapshot.data ?? 0;
              return Stack(
                children: [
                  Icon(Icons.notifications),
                  if (count > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        padding: EdgeInsets.all(2),
                        decoration: BoxDecoration(
                          color: Colors.red,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        constraints: BoxConstraints(
                          minWidth: 12,
                          minHeight: 12,
                        ),
                        child: Text(
                          count > 99 ? '99+' : count.toString(),
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              );
            },
          ),
          label: 'الإشعارات',
        ),
      ],
    );
  }
}
```

#### ب. حل مشكلة بطء التطبيق:

```dart
// إنشاء Performance Manager
class PerformanceManager {
  static final PerformanceManager _instance = PerformanceManager._internal();
  factory PerformanceManager() => _instance;
  PerformanceManager._internal();

  // Image caching
  final Map<String, Uint8List> _imageCache = {};
  final Map<String, DateTime> _imageCacheTimestamps = {};
  
  // API response caching
  final Map<String, dynamic> _apiCache = {};
  final Map<String, DateTime> _apiCacheTimestamps = {};
  
  static const Duration IMAGE_CACHE_DURATION = Duration(hours: 24);
  static const Duration API_CACHE_DURATION = Duration(minutes: 5);

  // Cache image
  void cacheImage(String url, Uint8List data) {
    _imageCache[url] = data;
    _imageCacheTimestamps[url] = DateTime.now();
    
    // Clean old cache
    _cleanImageCache();
  }

  Uint8List? getCachedImage(String url) {
    final timestamp = _imageCacheTimestamps[url];
    if (timestamp != null && 
        DateTime.now().difference(timestamp) < IMAGE_CACHE_DURATION) {
      return _imageCache[url];
    }
    return null;
  }

  // Cache API response
  void cacheApiResponse(String key, dynamic data) {
    _apiCache[key] = data;
    _apiCacheTimestamps[key] = DateTime.now();
    
    // Clean old cache
    _cleanApiCache();
  }

  dynamic getCachedApiResponse(String key) {
    final timestamp = _apiCacheTimestamps[key];
    if (timestamp != null && 
        DateTime.now().difference(timestamp) < API_CACHE_DURATION) {
      return _apiCache[key];
    }
    return null;
  }

  void _cleanImageCache() {
    final now = DateTime.now();
    _imageCache.removeWhere((key, value) {
      final timestamp = _imageCacheTimestamps[key];
      if (timestamp == null || now.difference(timestamp) > IMAGE_CACHE_DURATION) {
        _imageCacheTimestamps.remove(key);
        return true;
      }
      return false;
    });
  }

  void _cleanApiCache() {
    final now = DateTime.now();
    _apiCache.removeWhere((key, value) {
      final timestamp = _apiCacheTimestamps[key];
      if (timestamp == null || now.difference(timestamp) > API_CACHE_DURATION) {
        _apiCacheTimestamps.remove(key);
        return true;
      }
      return false;
    });
  }
}

// Optimized Image Widget
class OptimizedNetworkImage extends StatelessWidget {
  final String imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;

  const OptimizedNetworkImage({
    Key? key,
    required this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return CachedNetworkImage(
      imageUrl: imageUrl,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => Container(
        width: width,
        height: height,
        color: Colors.grey[300],
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
          ),
        ),
      ),
      errorWidget: (context, url, error) => Container(
        width: width,
        height: height,
        color: Colors.grey[300],
        child: Icon(Icons.error),
      ),
      memCacheWidth: width?.toInt(),
      memCacheHeight: height?.toInt(),
      maxWidthDiskCache: 1000,
      maxHeightDiskCache: 1000,
    );
  }
}
```

### 5. إرشادات التطبيق والاستخدام 📖

#### أ. إعداد الشات في التطبيق:

```dart
// في main.dart أو app initialization
class AppInitializer {
  static Future<void> initializeApp() async {
    // Initialize Firebase
    await Firebase.initializeApp();
    
    // Initialize FCM
    await FCMService().initialize();
    
    // Initialize other services
    await _initializeServices();
  }

  static Future<void> _initializeServices() async {
    // Get user data
    final userData = await CacheServices.instance.getUserData();
    if (userData != null) {
      final userId = userData['_id'];
      final token = await CacheServices.instance.getAccessToken();
      
      if (userId != null && token != null) {
        // Initialize chat service
        ChatService.instance.initSocket(userId, token);
        
        // Initialize badge manager
        await _initializeBadgeManager(userId);
      }
    }
  }

  static Future<void> _initializeBadgeManager(String userId) async {
    // Get initial unread counts from API
    try {
      final response = await DioHelper().fetchData(
        url: '/api/user/unread-counts',
        token: await CacheServices.instance.getAccessToken(),
      );
      
      if (response.statusCode == 200) {
        final data = response.data['data'];
        NotificationBadgeManager().updateMessagesCount(data['messages'] ?? 0);
        NotificationBadgeManager().updateNotificationsCount(data['notifications'] ?? 0);
      }
    } catch (e) {
      debugPrint('Error getting initial unread counts: $e');
    }
  }
}
```

#### ب. استخدام في Chat Screen:

```dart
class ChatScreen extends StatefulWidget {
  final String chatId;
  final String receiverId;

  const ChatScreen({
    Key? key,
    required this.chatId,
    required this.receiverId,
  }) : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> 
    with WidgetsBindingObserver {
  late ChatCubit _chatCubit;
  final TextEditingController _messageController = TextEditingController();
  Timer? _typingTimer;
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _chatCubit = context.read<ChatCubit>();
    
    // Join chat room
    ChatService.instance.joinChat(widget.chatId);
    
    // Load messages
    _chatCubit.getChatMessages(widget.chatId);
    
    // Mark messages as read
    ChatService.instance.markMessagesAsRead(widget.chatId);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    
    // Leave chat room
    ChatService.instance.leaveChat(widget.chatId);
    
    // Stop typing
    if (_isTyping) {
      ChatService.instance.stopTyping(widget.chatId);
    }
    
    _typingTimer?.cancel();
    _messageController.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    switch (state) {
      case AppLifecycleState.resumed:
        // Reconnect if needed
        if (!ChatService.instance.isConnected) {
          ChatService.instance.reconnect();
        }
        // Rejoin chat
        ChatService.instance.joinChat(widget.chatId);
        break;
      case AppLifecycleState.paused:
      case AppLifecycleState.inactive:
        // Stop typing when app goes to background
        if (_isTyping) {
          ChatService.instance.stopTyping(widget.chatId);
          _isTyping = false;
        }
        break;
      case AppLifecycleState.detached:
        break;
    }
  }

  void _onMessageChanged(String text) {
    if (text.isNotEmpty && !_isTyping) {
      _isTyping = true;
      ChatService.instance.startTyping(widget.chatId);
    } else if (text.isEmpty && _isTyping) {
      _isTyping = false;
      ChatService.instance.stopTyping(widget.chatId);
    }

    // Reset typing timer
    _typingTimer?.cancel();
    _typingTimer = Timer(Duration(seconds: 2), () {
      if (_isTyping) {
        _isTyping = false;
        ChatService.instance.stopTyping(widget.chatId);
      }
    });
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isNotEmpty) {
      // Send via API
      _chatCubit.sendMessage(
        chatId: widget.chatId,
        content: content,
        receiverId: widget.receiverId,
      );

      // Send via Socket for real-time update
      ChatService.instance.sendMessage(
        widget.chatId,
        content,
        widget.receiverId,
      );

      _messageController.clear();
      
      // Stop typing
      if (_isTyping) {
        _isTyping = false;
        ChatService.instance.stopTyping(widget.chatId);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('المحادثة'),
        actions: [
          // Connection status indicator
          StreamBuilder<bool>(
            stream: Stream.periodic(Duration(seconds: 1))
                .map((_) => ChatService.instance.isConnected),
            builder: (context, snapshot) {
              final isConnected = snapshot.data ?? false;
              return Container(
                margin: EdgeInsets.only(right: 16),
                child: Icon(
                  isConnected ? Icons.circle : Icons.circle_outlined,
                  color: isConnected ? Colors.green : Colors.red,
                  size: 12,
                ),
              );
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Messages list
          Expanded(
            child: BlocBuilder<ChatCubit, ChatState>(
              builder: (context, state) {
                if (state is ChatLoading) {
                  return Center(child: CircularProgressIndicator());
                } else if (state is ChatError) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text('خطأ: ${state.message}'),
                        ElevatedButton(
                          onPressed: () => _chatCubit.getChatMessages(widget.chatId),
                          child: Text('إعادة المحاولة'),
                        ),
                      ],
                    ),
                  );
                } else if (state is ChatLoaded) {
                  return ListView.builder(
                    reverse: true,
                    itemCount: state.messages.length,
                    itemBuilder: (context, index) {
                      final message = state.messages.reversed.toList()[index];
                      return MessageBubble(message: message);
                    },
                  );
                }
                return SizedBox.shrink();
              },
            ),
          ),
          
          // Typing indicator
          BlocBuilder<ChatCubit, ChatState>(
            builder: (context, state) {
              if (state is ChatUserTyping) {
                return Container(
                  padding: EdgeInsets.all(8),
                  child: Text(
                    'يكتب الآن...',
                    style: TextStyle(
                      fontStyle: FontStyle.italic,
                      color: Colors.grey[600],
                    ),
                  ),
                );
              }
              return SizedBox.shrink();
            },
          ),
          
          // Message input
          Container(
            padding: EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: _onMessageChanged,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالة...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                    maxLines: null,
                  ),
                ),
                SizedBox(width: 8),
                FloatingActionButton.small(
                  onPressed: _sendMessage,
                  child: Icon(Icons.send),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

## 🎯 خطة التطبيق

### المرحلة 1: إعداد الأساسيات
1. تحديث `ChatService` بالكود الجديد
2. تحديث `ChatCubit` مع الميزات الجديدة
3. تحديث `FCMService` لحل مشكلة التكرار

### المرحلة 2: تحسين الأداء
1. إضافة `ChatCacheManager`
2. إضافة `PerformanceManager`
3. تحديث widgets لاستخدام الـ caching

### المرحلة 3: إصلاح مشاكل UI
1. إضافة `NotificationBadgeManager`
2. تحديث Bottom Navigation
3. إضافة connection status indicators

### المرحلة 4: اختبار شامل
1. اختبار الشات متعدد الأجهزة
2. اختبار الإشعارات
3. اختبار الأداء

## 🔧 نصائح إضافية

### لتحسين الأداء:
- استخدم `const` constructors حيثما أمكن
- استخدم `ListView.builder` بدلاً من `ListView`
- قم بـ dispose الـ streams والـ controllers
- استخدم image caching

### لتحسين UX:
- أضف loading indicators
- أضف error handling
- أضف offline support
- أضف typing indicators

### للأمان:
- تحقق من صحة البيانات
- استخدم HTTPS فقط
- قم بتشفير البيانات الحساسة
- تحقق من permissions

هذا الدليل يغطي جميع المشاكل المحددة ويوفر حلول شاملة لتحسين أداء التطبيق وحل مشاكل الشات والإشعارات.
