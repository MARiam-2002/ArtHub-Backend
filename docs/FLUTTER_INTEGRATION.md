# دليل تكامل Flutter مع نظام المحادثات (Socket.io)

## نظرة عامة

هذا الدليل يشرح كيفية دمج نظام الدردشة الجديد المطور بـ Socket.io في تطبيق Flutter. يوفر النظام الجديد ميزات متقدمة مثل الرسائل الفورية، إشعارات الكتابة، وتأكيدات القراءة في الوقت الحقيقي.

## متطلبات

إضافة الحزم التالية لتطبيق Flutter:

```yaml
# pubspec.yaml
dependencies:
  socket_io_client: ^2.0.0
  http: ^0.13.5
  shared_preferences: ^2.0.15 # لتخزين رمز الجلسة
```

ثم تحديث الحزم:

```bash
flutter pub get
```

## تنفيذ خدمة الدردشة

### 1. إنشاء نموذج الرسالة

```dart
// lib/models/message_model.dart
class Message {
  final String id;
  final String chatId;
  final String content;
  final String senderId;
  final bool isFromMe;
  final bool isRead;
  final DateTime createdAt;

  Message({
    required this.id,
    required this.chatId,
    required this.content,
    required this.senderId,
    required this.isFromMe,
    required this.isRead,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['_id'],
      chatId: json['chatId'] ?? '',
      content: json['content'] ?? json['text'] ?? '', // دعم الإصدارات القديمة
      senderId: json['sender']['_id'],
      isFromMe: json['isFromMe'] ?? false,
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
        ? DateTime.parse(json['createdAt'])
        : DateTime.now(),
    );
  }
}
```

### 2. إنشاء خدمة Chat Service

```dart
// lib/services/chat_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../models/message_model.dart';

class ChatService {
  // المتغيرات
  static final ChatService _instance = ChatService._internal();
  late IO.Socket socket;
  String? userId;
  bool isConnected = false;
  final String baseUrl = 'https://your-api-url';

  // التخزين المحلي للحالة
  String? currentChatId;
  final Map<String, bool> typingUsers = {};

  // مستمعي الأحداث
  final StreamController<Message> _messageController = StreamController<Message>.broadcast();
  final StreamController<Map<String, dynamic>> _typingController = StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<Map<String, dynamic>> _readController = StreamController<Map<String, dynamic>>.broadcast();
  final StreamController<String> _connectionController = StreamController<String>.broadcast();

  // الوصول إلى الـ Streams
  Stream<Message> get messageStream => _messageController.stream;
  Stream<Map<String, dynamic>> get typingStream => _typingController.stream;
  Stream<Map<String, dynamic>> get readStream => _readController.stream;
  Stream<String> get connectionStream => _connectionController.stream;

  // Factory constructor
  factory ChatService() {
    return _instance;
  }

  // Private constructor
  ChatService._internal();

  // الحصول على رمز Socket
  Future<String> getSocketToken(String authToken) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/chat/socket-token'),
      headers: {'Authorization': 'Bearer $authToken'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data']['token'];
    } else {
      throw Exception('فشل في الحصول على رمز الاتصال');
    }
  }

  // إنشاء اتصال بالسوكت
  Future<void> connect(String authToken, String uid) async {
    if (isConnected) return;

    try {
      userId = uid;
      final socketToken = await getSocketToken(authToken);

      socket = IO.io(baseUrl, {
        'transports': ['websocket'],
        'query': {'token': socketToken}
      });

      socket.on('connect', (_) {
        print('تم الاتصال بنجاح');
        isConnected = true;
        _connectionController.add('connected');

        // المصادقة بعد الاتصال
        socket.emit('authenticate', {'userId': userId});
      });

      socket.on('authenticated', (_) {
        print('تم التوثيق بنجاح');

        // إعادة الانضمام للمحادثة الحالية إذا كانت موجودة
        if (currentChatId != null) {
          joinChat(currentChatId!);
        }
      });

      socket.on('error', (error) {
        print('خطأ في السوكت: $error');
        _connectionController.add('error');
      });

      socket.on('disconnect', (_) {
        print('تم قطع الاتصال');
        isConnected = false;
        _connectionController.add('disconnected');
      });

      // إعداد جميع المستمعين
      _setupSocketListeners();
    } catch (e) {
      print('فشل في الاتصال بالسوكت: $e');
      _connectionController.add('error');
      throw Exception('فشل في الاتصال بالسوكت');
    }
  }

  // إعداد مستمعي أحداث السوكت
  void _setupSocketListeners() {
    // استقبال رسالة جديدة
    socket.on('new_message', (data) {
      final message = Message.fromJson(data);
      _messageController.add(message);
    });

    // تحديث حالة القراءة
    socket.on('messages_read', (data) {
      _readController.add(data);
    });

    // مؤشرات الكتابة
    socket.on('user_typing', (data) {
      if (data['chatId'] == currentChatId && data['userId'] != userId) {
        typingUsers[data['userId']] = true;
        _typingController.add({
          'chatId': data['chatId'],
          'userId': data['userId'],
          'isTyping': true
        });
      }
    });

    socket.on('user_stopped_typing', (data) {
      if (data['chatId'] == currentChatId && data['userId'] != userId) {
        typingUsers[data['userId']] = false;
        _typingController.add({
          'chatId': data['chatId'],
          'userId': data['userId'],
          'isTyping': false
        });
      }
    });

    // تحديثات قائمة المحادثات
    socket.on('update_chat_list', (data) {
      // يمكن معالجتها في المستقبل
    });

    socket.on('new_chat', (data) {
      // يمكن معالجتها في المستقبل
    });
  }

  // الانضمام إلى محادثة
  void joinChat(String chatId) {
    if (!isConnected) return;

    currentChatId = chatId;
    socket.emit('join_chat', {
      'chatId': chatId,
      'userId': userId
    });
  }

  // إرسال رسالة
  void sendMessage(String chatId, String content, String receiverId) {
    if (!isConnected) return;

    socket.emit('send_message', {
      'chatId': chatId,
      'content': content,
      'senderId': userId,
      'receiverId': receiverId
    });
  }

  // وضع علامة مقروء
  void markAsRead(String chatId) {
    if (!isConnected) return;

    socket.emit('mark_read', {
      'chatId': chatId,
      'userId': userId
    });
  }

  // إرسال مؤشر الكتابة
  void sendTypingStatus(String chatId, bool isTyping) {
    if (!isConnected) return;

    final event = isTyping ? 'typing' : 'stop_typing';
    socket.emit(event, {
      'chatId': chatId,
      'userId': userId
    });
  }

  // استخدام API لجلب المحادثات
  Future<List<dynamic>> getChats(String authToken) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/chat'),
      headers: {'Authorization': 'Bearer $authToken'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('فشل في جلب المحادثات');
    }
  }

  // استخدام API لجلب رسائل محادثة
  Future<Map<String, dynamic>> getChatMessages(String chatId, String authToken) async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/chat/$chatId/messages'),
      headers: {'Authorization': 'Bearer $authToken'},
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('فشل في جلب الرسائل');
    }
  }

  // إنشاء محادثة جديدة
  Future<Map<String, dynamic>> createChat(String otherUserId, String authToken) async {
    final response = await http.post(
      Uri.parse('$baseUrl/api/chat/create'),
      headers: {
        'Authorization': 'Bearer $authToken',
        'Content-Type': 'application/json'
      },
      body: jsonEncode({'userId': otherUserId}),
    );

    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return data['data'];
    } else {
      throw Exception('فشل في إنشاء المحادثة');
    }
  }

  // قطع الاتصال وتنظيف الموارد
  void disconnect() {
    if (isConnected) {
      socket.disconnect();
      isConnected = false;
    }
  }

  // تنظيف الموارد عند الإغلاق
  void dispose() {
    disconnect();
    _messageController.close();
    _typingController.close();
    _readController.close();
    _connectionController.close();
  }
}
```

### 3. استخدام الخدمة في واجهة المحادثة

```dart
// lib/screens/chat_screen.dart
import 'package:flutter/material.dart';
import '../models/message_model.dart';
import '../services/chat_service.dart';

class ChatScreen extends StatefulWidget {
  final String chatId;
  final String receiverId;
  final String authToken;

  const ChatScreen({
    Key? key,
    required this.chatId,
    required this.receiverId,
    required this.authToken,
  }) : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final ChatService _chatService = ChatService();
  final TextEditingController _messageController = TextEditingController();
  final List<Message> _messages = [];
  bool _isLoading = true;
  bool _isReceiverTyping = false;
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    _initChatService();
  }

  Future<void> _initChatService() async {
    // افتراض أن userId مخزن في مكان ما
    final userId = getUserId(); // استبدل بدالة حقيقية

    // اتصال بخدمة السوكت
    await _chatService.connect(widget.authToken, userId);

    // الاستماع للرسائل الجديدة
    _chatService.messageStream.listen((message) {
      if (message.chatId == widget.chatId) {
        setState(() {
          _messages.add(message);
        });

        // تحديث حالة القراءة إذا كانت الرسالة من المستخدم الآخر
        if (!message.isFromMe) {
          _chatService.markAsRead(widget.chatId);
        }
      }
    });

    // الاستماع لحالة الكتابة
    _chatService.typingStream.listen((data) {
      if (data['chatId'] == widget.chatId && data['userId'] == widget.receiverId) {
        setState(() {
          _isReceiverTyping = data['isTyping'];
        });
      }
    });

    // الانضمام للمحادثة
    _chatService.joinChat(widget.chatId);

    // جلب الرسائل السابقة
    await _loadPreviousMessages();

    // تحديث حالة القراءة
    _chatService.markAsRead(widget.chatId);
  }

  Future<void> _loadPreviousMessages() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final chatData = await _chatService.getChatMessages(
        widget.chatId,
        widget.authToken
      );

      setState(() {
        _messages.clear();
        for (var msg in chatData['messages']) {
          _messages.add(Message.fromJson(msg));
        }
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      // عرض رسالة خطأ
    }
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    // إرسال الرسالة
    _chatService.sendMessage(
      widget.chatId,
      content,
      widget.receiverId
    );

    // مسح حقل الإدخال
    _messageController.clear();

    // إيقاف مؤشر الكتابة
    _chatService.sendTypingStatus(widget.chatId, false);
  }

  void _handleTyping(String text) {
    // إدارة مؤشر الكتابة
    if (text.isNotEmpty) {
      _chatService.sendTypingStatus(widget.chatId, true);

      // إعادة ضبط المؤقت
      _typingTimer?.cancel();
      _typingTimer = Timer(const Duration(seconds: 3), () {
        _chatService.sendTypingStatus(widget.chatId, false);
      });
    } else {
      _chatService.sendTypingStatus(widget.chatId, false);
    }
  }

  @override
  void dispose() {
    _messageController.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('اسم المستخدم'), // استبدل بالاسم الحقيقي
            if (_isReceiverTyping)
              Text(
                'يكتب الآن...',
                style: TextStyle(fontSize: 12),
              ),
          ],
        ),
      ),
      body: Column(
        children: [
          // عرض الرسائل
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator())
                : ListView.builder(
                    reverse: true,
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final message = _messages[_messages.length - 1 - index];
                      return _buildMessageItem(message);
                    },
                  ),
          ),

          // حقل إدخال الرسائل
          Container(
            padding: EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: _handleTyping,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالة...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(24),
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

  Widget _buildMessageItem(Message message) {
    return Align(
      alignment: message.isFromMe
          ? Alignment.centerRight
          : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: message.isFromMe ? Colors.blue[100] : Colors.grey[200],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message.content),
            SizedBox(height: 4),
            Text(
              '${message.createdAt.hour}:${message.createdAt.minute}',
              style: TextStyle(fontSize: 10, color: Colors.grey),
            ),
          ],
        ),
      ),
    );
  }
}
```

### 4. صفحة قائمة المحادثات

```dart
// lib/screens/chats_list_screen.dart
import 'package:flutter/material.dart';
import '../services/chat_service.dart';

class ChatsListScreen extends StatefulWidget {
  final String authToken;

  const ChatsListScreen({
    Key? key,
    required this.authToken,
  }) : super(key: key);

  @override
  _ChatsListScreenState createState() => _ChatsListScreenState();
}

class _ChatsListScreenState extends State<ChatsListScreen> {
  final ChatService _chatService = ChatService();
  List<dynamic> _chats = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadChats();
  }

  Future<void> _loadChats() async {
    try {
      setState(() {
        _isLoading = true;
      });

      final chats = await _chatService.getChats(widget.authToken);

      setState(() {
        _chats = chats;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      // عرض رسالة خطأ
    }
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
                    return _buildChatItem(chat);
                  },
                ),
      floatingActionButton: FloatingActionButton(
        child: Icon(Icons.chat),
        onPressed: () {
          // فتح شاشة بدء محادثة جديدة
        },
      ),
    );
  }

  Widget _buildChatItem(dynamic chat) {
    return ListTile(
      leading: CircleAvatar(
        backgroundImage: chat['otherUser']['profileImage'] != null
            ? NetworkImage(chat['otherUser']['profileImage'])
            : null,
        child: chat['otherUser']['profileImage'] == null
            ? Icon(Icons.person)
            : null,
      ),
      title: Text(chat['otherUser']['displayName'] ?? 'مستخدم'),
      subtitle: Text(
        chat['lastMessage'] != null
            ? chat['lastMessage']['content'] ?? ''
            : 'بدء محادثة جديدة',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: chat['unreadCount'] > 0
          ? Container(
              padding: EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: Colors.blue,
                shape: BoxShape.circle,
              ),
              child: Text(
                '${chat['unreadCount']}',
                style: TextStyle(color: Colors.white),
              ),
            )
          : null,
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ChatScreen(
              chatId: chat['_id'],
              receiverId: chat['otherUser']['_id'],
              authToken: widget.authToken,
            ),
          ),
        ).then((_) => _loadChats());
      },
    );
  }
}
```

## التعامل مع حالات الاتصال

من المهم التعامل مع حالات انقطاع الاتصال والتعافي التلقائي. يمكن تنفيذ ذلك بإضافة استراتيجيات التخزين المؤقت وإعادة المحاولة.

```dart
// إضافة تخزين مؤقت للرسائل غير المرسلة
List<Map<String, dynamic>> _pendingMessages = [];

// تخزين الرسائل مؤقتًا عند فقدان الاتصال
void sendMessageWithRetry(String chatId, String content, String receiverId) {
  final pendingMessage = {
    'chatId': chatId,
    'content': content,
    'senderId': userId,
    'receiverId': receiverId,
    'timestamp': DateTime.now().toIso8601String()
  };

  if (isConnected) {
    socket.emit('send_message', pendingMessage);
  } else {
    // تخزين الرسالة للإرسال لاحقًا
    _pendingMessages.add(pendingMessage);

    // محاولة إعادة الاتصال
    reconnect();
  }
}

// إعادة إرسال الرسائل المعلقة
void _resendPendingMessages() {
  if (_pendingMessages.isEmpty || !isConnected) return;

  final messagesToSend = List<Map<String, dynamic>>.from(_pendingMessages);
  _pendingMessages.clear();

  for (final message in messagesToSend) {
    socket.emit('send_message', message);
  }
}

// الاستماع لأحداث إعادة الاتصال
socket.io.on('reconnect', (_) {
  print('تم إعادة الاتصال');
  isConnected = true;
  _connectionController.add('connected');

  // إعادة المصادقة
  socket.emit('authenticate', {'userId': userId});

  // إعادة الانضمام للمحادثة الحالية
  if (currentChatId != null) {
    joinChat(currentChatId!);
  }

  // إعادة إرسال الرسائل المعلقة
  _resendPendingMessages();
});
```

## إدارة الوقت الزمني والاستخدام الفعال للذاكرة

يمكن تحسين أداء التطبيق من خلال تحميل الرسائل على دفعات وإدارة مستمعي الأحداث بشكل فعال:

```dart
// تحميل الرسائل على دفعات مع التمرير اللانهائي
Future<void> loadMoreMessages(String chatId, String authToken, {int page = 1, int limit = 20}) async {
  final response = await http.get(
    Uri.parse('$baseUrl/api/chat/$chatId/messages?page=$page&limit=$limit'),
    headers: {'Authorization': 'Bearer $authToken'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['data'];
  } else {
    throw Exception('فشل في تحميل المزيد من الرسائل');
  }
}
```

## ملاحظات أمنية

1. **تأمين اتصال Socket.io**: استخدم HTTPS للاتصال بخادم Socket.io.
2. **التحقق من صحة الرمز**: تأكد من أن رمز التوثيق صالح قبل محاولة الاتصال.
3. **تخزين الرمز آمنًا**: استخدم Flutter Secure Storage لتخزين رموز الجلسة بأمان.

## الاختبار والتصحيح

للمساعدة في تصحيح الأخطاء، يمكن إضافة منطق تسجيل محسن:

```dart
// إضافة تسجيل مفصل لأحداث السوكت
void enableSocketLogging() {
  socket.onConnect((_) => print('🟢 Socket connected'));
  socket.onDisconnect((_) => print('🔴 Socket disconnected'));
  socket.onConnectError((err) => print('🟠 Connect error: $err'));
  socket.onError((err) => print('🔴 Socket error: $err'));

  socket.on('new_message', (data) => print('📩 New message: ${jsonEncode(data)}'));
  socket.on('messages_read', (data) => print('👁️ Messages read: ${jsonEncode(data)}'));
  socket.on('user_typing', (data) => print('⌨️ User typing: ${jsonEncode(data)}'));
  socket.on('user_stopped_typing', (data) => print('⌨️ User stopped typing: ${jsonEncode(data)}'));
}
```

## اعتبارات الأداء

- استخدم **التحميل الكسول** للرسائل القديمة
- أنشئ **ذاكرة تخزين مؤقت محلية** للمحادثات والرسائل
- قلل من عمليات إعادة البناء غير الضرورية في واجهة المستخدم

## خاتمة

يوفر هذا الدليل الأساس لدمج نظام الدردشة الجديد القائم على Socket.io في تطبيقات Flutter. من خلال اتباع هذه الإرشادات، يمكنك إنشاء تجربة دردشة سلسة وآنية مع ميزات متقدمة مثل إشعارات الكتابة وتأكيدات القراءة.
