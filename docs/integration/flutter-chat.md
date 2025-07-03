# Socket.IO Chat Integration Guide for Flutter

This guide explains how to integrate the ArtHub Socket.IO chat system with your Flutter application for real-time messaging.

## Overview

ArtHub uses Socket.IO for real-time chat functionality, providing:

1. Real-time message delivery
2. Typing indicators
3. Read receipts
4. Online status updates
5. Push notifications for offline users

## Setup

### 1. Add Dependencies

Add the following dependencies to your `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.0
  provider: ^6.0.5  # For state management
  shared_preferences: ^2.0.15  # For token storage
```

Run `flutter pub get` to install the dependencies.

### 2. Create a Chat Service

Create a service class to manage Socket.IO connections and events:

```dart
import 'dart:async';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  // Singleton instance
  static final ChatService _instance = ChatService._internal();
  factory ChatService() => _instance;
  ChatService._internal();

  // Socket instance
  IO.Socket? _socket;
  String? _userId;
  String? _currentChatId;
  bool _isConnected = false;

  // Stream controllers for events
  final _messageController = StreamController<Map<String, dynamic>>.broadcast();
  final _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final _readReceiptController = StreamController<Map<String, dynamic>>.broadcast();
  final _connectionStatusController = StreamController<bool>.broadcast();

  // Getters for streams
  Stream<Map<String, dynamic>> get onMessage => _messageController.stream;
  Stream<Map<String, dynamic>> get onTyping => _typingController.stream;
  Stream<Map<String, dynamic>> get onReadReceipt => _readReceiptController.stream;
  Stream<bool> get onConnectionStatus => _connectionStatusController.stream;

  bool get isConnected => _isConnected;

  // Initialize and connect to Socket.IO server
  Future<void> connect(String token, String userId) async {
    if (_socket != null) {
      _socket!.disconnect();
    }

    _userId = userId;

    try {
      _socket = IO.io('https://your-api-url', <String, dynamic>{
        'transports': ['websocket'],
        'autoConnect': true,
        'query': {'token': token}
      });

      _setupSocketListeners();
      
      // Wait for connection and authentication
      await _waitForConnection();
      
      _isConnected = true;
      _connectionStatusController.add(true);
      
      return;
    } catch (e) {
      _isConnected = false;
      _connectionStatusController.add(false);
      rethrow;
    }
  }

  Future<void> _waitForConnection() {
    Completer<void> completer = Completer<void>();
    
    // Set timeout
    Timer(Duration(seconds: 10), () {
      if (!completer.isCompleted) {
        completer.completeError('Connection timeout');
      }
    });

    // Listen for authentication success
    _socket!.once('authenticated', (_) {
      if (!completer.isCompleted) {
        completer.complete();
      }
    });

    // Listen for errors
    _socket!.once('error', (error) {
      if (!completer.isCompleted) {
        completer.completeError(error);
      }
    });

    return completer.future;
  }

  void _setupSocketListeners() {
    _socket!.on('connect', (_) {
      print('Connected to Socket.IO server');
      _socket!.emit('authenticate', {'userId': _userId});
    });

    _socket!.on('authenticated', (_) {
      print('Authenticated with Socket.IO server');
      
      // Rejoin current chat if any
      if (_currentChatId != null) {
        joinChat(_currentChatId!);
      }
    });

    _socket!.on('new_message', (data) {
      _messageController.add(data);
    });

    _socket!.on('user_typing', (data) {
      _typingController.add(data);
    });

    _socket!.on('user_stopped_typing', (data) {
      _typingController.add({...data, 'isTyping': false});
    });

    _socket!.on('messages_read', (data) {
      _readReceiptController.add(data);
    });

    _socket!.on('disconnect', (_) {
      print('Disconnected from Socket.IO server');
      _isConnected = false;
      _connectionStatusController.add(false);
    });

    _socket!.on('error', (error) {
      print('Socket.IO error: $error');
    });
  }

  // Join a chat room
  void joinChat(String chatId) {
    if (!_isConnected || _socket == null) return;
    
    _currentChatId = chatId;
    _socket!.emit('join_chat', {
      'chatId': chatId,
      'userId': _userId
    });
  }

  // Send a message
  void sendMessage(String chatId, String content, String receiverId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('send_message', {
      'chatId': chatId,
      'content': content,
      'senderId': _userId,
      'receiverId': receiverId
    });
  }

  // Mark messages as read
  void markAsRead(String chatId) {
    if (!_isConnected || _socket == null) return;
    
    _socket!.emit('mark_read', {
      'chatId': chatId,
      'userId': _userId
    });
  }

  // Send typing indicator
  void sendTypingStatus(String chatId, bool isTyping) {
    if (!_isConnected || _socket == null) return;
    
    final event = isTyping ? 'typing' : 'stop_typing';
    _socket!.emit(event, {
      'chatId': chatId,
      'userId': _userId
    });
  }

  // Disconnect from Socket.IO server
  void disconnect() {
    _socket?.disconnect();
    _socket = null;
    _currentChatId = null;
    _isConnected = false;
    _connectionStatusController.add(false);
  }

  // Clean up resources
  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _readReceiptController.close();
    _connectionStatusController.close();
  }
}
```

## Usage

### 1. Initialize the Chat Service

Initialize the chat service when the user logs in:

```dart
final chatService = ChatService();

Future<void> initializeChatService() async {
  final token = await getAuthToken(); // Get your auth token
  final userId = await getUserId(); // Get logged-in user ID
  
  try {
    await chatService.connect(token, userId);
    print('Chat service connected successfully');
  } catch (e) {
    print('Failed to connect chat service: $e');
  }
}
```

### 2. Create a Chat Screen

```dart
class ChatScreen extends StatefulWidget {
  final String chatId;
  final String receiverId;
  final String receiverName;

  const ChatScreen({
    Key? key,
    required this.chatId,
    required this.receiverId,
    required this.receiverName,
  }) : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatService _chatService = ChatService();
  final TextEditingController _messageController = TextEditingController();
  final List<Message> _messages = [];
  bool _isTyping = false;
  Timer? _typingTimer;
  StreamSubscription? _messageSubscription;
  StreamSubscription? _typingSubscription;
  StreamSubscription? _readReceiptSubscription;

  @override
  void initState() {
    super.initState();
    _setupChatRoom();
    _listenForMessages();
    _listenForTypingIndicators();
    _listenForReadReceipts();
    _markMessagesAsRead();
  }

  void _setupChatRoom() {
    _chatService.joinChat(widget.chatId);
  }

  void _listenForMessages() {
    _messageSubscription = _chatService.onMessage.listen((data) {
      setState(() {
        _messages.add(Message.fromJson(data));
      });
      
      // Mark messages as read when received
      _markMessagesAsRead();
    });
  }

  void _listenForTypingIndicators() {
    _typingSubscription = _chatService.onTyping.listen((data) {
      if (data['userId'] == widget.receiverId) {
        setState(() {
          _isTyping = data['isTyping'] ?? true;
        });
      }
    });
  }

  void _listenForReadReceipts() {
    _readReceiptSubscription = _chatService.onReadReceipt.listen((data) {
      if (data['chatId'] == widget.chatId && data['readBy'] == widget.receiverId) {
        setState(() {
          // Update read status of messages
          for (var message in _messages) {
            if (message.senderId == _chatService._userId) {
              message.isRead = true;
            }
          }
        });
      }
    });
  }

  void _markMessagesAsRead() {
    _chatService.markAsRead(widget.chatId);
  }

  void _handleTyping(String text) {
    // Cancel previous timer
    _typingTimer?.cancel();
    
    // Send typing indicator
    _chatService.sendTypingStatus(widget.chatId, text.isNotEmpty);
    
    // Set timer to stop typing indicator after 2 seconds of inactivity
    _typingTimer = Timer(Duration(seconds: 2), () {
      _chatService.sendTypingStatus(widget.chatId, false);
    });
  }

  void _sendMessage() {
    final text = _messageController.text.trim();
    if (text.isEmpty) return;
    
    _chatService.sendMessage(
      widget.chatId,
      text,
      widget.receiverId,
    );
    
    // Clear text field
    _messageController.clear();
    
    // Stop typing indicator
    _chatService.sendTypingStatus(widget.chatId, false);
  }

  @override
  void dispose() {
    _messageController.dispose();
    _typingTimer?.cancel();
    _messageSubscription?.cancel();
    _typingSubscription?.cancel();
    _readReceiptSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.receiverName),
            if (_isTyping)
              Text(
                'يكتب الآن...',
                style: TextStyle(fontSize: 12),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              reverse: true,
              itemCount: _messages.length,
              itemBuilder: (context, index) {
                final message = _messages[_messages.length - 1 - index];
                return MessageBubble(
                  message: message,
                  isMe: message.senderId == _chatService._userId,
                );
              },
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 8.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: _handleTyping,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالة...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24.0),
                      ),
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send),
                  onPressed: _sendMessage,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MessageBubble extends StatelessWidget {
  final Message message;
  final bool isMe;

  const MessageBubble({
    Key? key,
    required this.message,
    required this.isMe,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 4.0, horizontal: 8.0),
        padding: EdgeInsets.symmetric(vertical: 10.0, horizontal: 16.0),
        decoration: BoxDecoration(
          color: isMe ? Colors.blue : Colors.grey[300],
          borderRadius: BorderRadius.circular(16.0),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: TextStyle(
                color: isMe ? Colors.white : Colors.black,
              ),
            ),
            SizedBox(height: 4.0),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatTime(message.createdAt),
                  style: TextStyle(
                    color: isMe ? Colors.white70 : Colors.black54,
                    fontSize: 10.0,
                  ),
                ),
                if (isMe) SizedBox(width: 4.0),
                if (isMe)
                  Icon(
                    message.isRead ? Icons.done_all : Icons.done,
                    size: 12.0,
                    color: message.isRead ? Colors.blue[100] : Colors.white70,
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    return '${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
  }
}

class Message {
  final String id;
  final String content;
  final String senderId;
  final String chatId;
  final DateTime createdAt;
  bool isRead;

  Message({
    required this.id,
    required this.content,
    required this.senderId,
    required this.chatId,
    required this.createdAt,
    this.isRead = false,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'],
      content: json['content'],
      senderId: json['sender']['_id'],
      chatId: json['chat'],
      createdAt: DateTime.parse(json['createdAt']),
      isRead: json['isRead'] ?? false,
    );
  }
}
```

### 3. Create a Chat List Screen

```dart
class ChatListScreen extends StatefulWidget {
  @override
  _ChatListScreenState createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  final List<ChatPreview> _chats = [];
  bool _isLoading = true;
  StreamSubscription? _updateSubscription;

  @override
  void initState() {
    super.initState();
    _loadChats();
    _listenForUpdates();
  }

  Future<void> _loadChats() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final response = await dio.get(
        '/api/chat',
        options: Options(
          headers: {'Authorization': 'Bearer $accessToken'},
        ),
      );

      if (response.data['success']) {
        setState(() {
          _chats.clear();
          _chats.addAll((response.data['data'] as List)
              .map((chat) => ChatPreview.fromJson(chat)));
          _isLoading = false;
        });
      }
    } catch (e) {
      print('Error loading chats: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _listenForUpdates() {
    _updateSubscription = ChatService().onMessage.listen((_) {
      // Reload chat list when a new message is received
      _loadChats();
    });
  }

  @override
  void dispose() {
    _updateSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('المحادثات'),
      ),
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : _chats.isEmpty
              ? Center(child: Text('لا توجد محادثات'))
              : ListView.builder(
                  itemCount: _chats.length,
                  itemBuilder: (context, index) {
                    final chat = _chats[index];
                    return ChatListItem(
                      chat: chat,
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => ChatScreen(
                              chatId: chat.id,
                              receiverId: chat.otherUser.id,
                              receiverName: chat.otherUser.displayName,
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
    );
  }
}

class ChatListItem extends StatelessWidget {
  final ChatPreview chat;
  final VoidCallback onTap;

  const ChatListItem({
    Key? key,
    required this.chat,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: CircleAvatar(
        backgroundImage: chat.otherUser.profileImage != null
            ? NetworkImage(chat.otherUser.profileImage!)
            : null,
        child: chat.otherUser.profileImage == null
            ? Text(chat.otherUser.displayName[0])
            : null,
      ),
      title: Text(chat.otherUser.displayName),
      subtitle: Text(
        chat.lastMessage?.content ?? 'لا توجد رسائل',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Text(
            _formatDate(chat.updatedAt),
            style: TextStyle(fontSize: 12.0),
          ),
          if (chat.unreadCount > 0)
            Container(
              margin: EdgeInsets.only(top: 4.0),
              padding: EdgeInsets.symmetric(horizontal: 6.0, vertical: 2.0),
              decoration: BoxDecoration(
                color: Colors.blue,
                borderRadius: BorderRadius.circular(10.0),
              ),
              child: Text(
                '${chat.unreadCount}',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 10.0,
                ),
              ),
            ),
        ],
      ),
      onTap: onTap,
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    if (now.difference(date).inDays == 0) {
      return '${date.hour}:${date.minute.toString().padLeft(2, '0')}';
    } else if (now.difference(date).inDays < 7) {
      final weekdays = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];
      return weekdays[date.weekday - 1];
    } else {
      return '${date.year}/${date.month}/${date.day}';
    }
  }
}

class ChatPreview {
  final String id;
  final User otherUser;
  final LastMessage? lastMessage;
  final int unreadCount;
  final DateTime updatedAt;

  ChatPreview({
    required this.id,
    required this.otherUser,
    this.lastMessage,
    required this.unreadCount,
    required this.updatedAt,
  });

  factory ChatPreview.fromJson(Map<String, dynamic> json) {
    return ChatPreview(
      id: json['_id'],
      otherUser: User.fromJson(json['otherUser']),
      lastMessage: json['lastMessage'] != null
          ? LastMessage.fromJson(json['lastMessage'])
          : null,
      unreadCount: json['unreadCount'] ?? 0,
      updatedAt: DateTime.parse(json['updatedAt']),
    );
  }
}

class User {
  final String id;
  final String displayName;
  final String? profileImage;

  User({
    required this.id,
    required this.displayName,
    this.profileImage,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'],
      displayName: json['displayName'],
      profileImage: json['profileImage'],
    );
  }
}

class LastMessage {
  final String content;
  final bool isFromMe;
  final DateTime createdAt;

  LastMessage({
    required this.content,
    required this.isFromMe,
    required this.createdAt,
  });

  factory LastMessage.fromJson(Map<String, dynamic> json) {
    return LastMessage(
      content: json['content'],
      isFromMe: json['isFromMe'] ?? false,
      createdAt: DateTime.parse(json['createdAt']),
    );
  }
}
```

## Handling Connection Issues

### 1. Implement Reconnection Logic

```dart
void _setupReconnection() {
  _chatService.onConnectionStatus.listen((isConnected) {
    if (!isConnected) {
      // Show a banner or snackbar
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('فقدت الاتصال بالخادم، جاري إعادة الاتصال...'),
          duration: Duration(seconds: 5),
        ),
      );
      
      // Try to reconnect after a delay
      Future.delayed(Duration(seconds: 5), () async {
        try {
          final token = await getAuthToken();
          final userId = await getUserId();
          await _chatService.connect(token, userId);
        } catch (e) {
          print('Reconnection failed: $e');
        }
      });
    } else {
      // Connection restored
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('تم استعادة الاتصال'),
          duration: Duration(seconds: 2),
          backgroundColor: Colors.green,
        ),
      );
    }
  });
}
```

### 2. Implement Offline Message Queue

```dart
class OfflineMessageQueue {
  final List<Map<String, dynamic>> _queue = [];
  final ChatService _chatService = ChatService();
  
  void addMessage(String chatId, String content, String receiverId) {
    _queue.add({
      'chatId': chatId,
      'content': content,
      'receiverId': receiverId,
      'timestamp': DateTime.now().toIso8601String(),
    });
    
    // Save queue to local storage
    _saveQueue();
  }
  
  Future<void> processQueue() async {
    if (_queue.isEmpty) return;
    
    if (_chatService.isConnected) {
      // Process all messages in queue
      for (var message in List.from(_queue)) {
        _chatService.sendMessage(
          message['chatId'],
          message['content'],
          message['receiverId'],
        );
        
        _queue.remove(message);
      }
      
      // Save updated queue
      _saveQueue();
    }
  }
  
  Future<void> _saveQueue() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('offline_message_queue', jsonEncode(_queue));
  }
  
  Future<void> loadQueue() async {
    final prefs = await SharedPreferences.getInstance();
    final queueString = prefs.getString('offline_message_queue');
    
    if (queueString != null) {
      final List<dynamic> decoded = jsonDecode(queueString);
      _queue.clear();
      _queue.addAll(decoded.cast<Map<String, dynamic>>());
    }
  }
}
```

## Best Practices

1. **Connection Management**:
   - Always check connection status before sending messages
   - Implement automatic reconnection
   - Handle offline message queuing

2. **State Management**:
   - Use Provider or another state management solution to share chat state
   - Keep the Socket.IO connection as a singleton

3. **Error Handling**:
   - Add proper error handling for all Socket.IO operations
   - Show user-friendly error messages
   - Implement retry mechanisms

4. **Performance**:
   - Implement pagination for message history
   - Use efficient list rendering with ListView.builder
   - Optimize image loading with caching

5. **User Experience**:
   - Show typing indicators
   - Display read receipts
   - Add pull-to-refresh for message lists
   - Implement proper scroll behavior

## Troubleshooting

### Common Issues

1. **Connection Failures**:
   - Check network connectivity
   - Verify authentication token is valid
   - Ensure backend URL is correct

2. **Message Not Sending**:
   - Verify connection status
   - Check if user is authenticated
   - Ensure chatId and receiverId are correct

3. **Events Not Received**:
   - Verify socket connection is established
   - Check if user has joined the correct chat room
   - Ensure event names match between client and server

### Debugging

Add logging for Socket.IO events:

```dart
void _setupSocketLogging() {
  _socket!.onConnect((_) => print('Socket connected'));
  _socket!.onDisconnect((_) => print('Socket disconnected'));
  _socket!.onConnectError((error) => print('Connect error: $error'));
  _socket!.onError((error) => print('Socket error: $error'));
  
  // Log all emitted events
  _socket!.onAny((event, data) {
    print('Received event: $event with data: $data');
  });
}
```

## Conclusion

This integration guide provides a comprehensive approach to implementing real-time chat functionality in your Flutter application using the ArtHub Socket.IO backend. By following these patterns and best practices, you can create a robust, responsive chat experience for your users with features like real-time messaging, typing indicators, and read receipts. 