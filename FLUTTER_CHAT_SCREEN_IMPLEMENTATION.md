# 📱 Chat Screen Implementation

```dart
// lib/screens/chat_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/chat_provider.dart';
import '../models/message.dart';

class ChatScreen extends StatefulWidget {
  final String chatId;
  final String otherUserName;
  
  const ChatScreen({
    Key? key,
    required this.chatId,
    required this.otherUserName,
  }) : super(key: key);
  
  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;
  Timer? _typingTimer;
  
  @override
  void initState() {
    super.initState();
    // الانضمام للمحادثة
    context.read<ChatProvider>().joinChat(widget.chatId);
    
    // تمييز الرسائل كمقروءة
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().markAsRead(widget.chatId);
    });
  }
  
  @override
  void dispose() {
    // مغادرة المحادثة
    context.read<ChatProvider>().leaveChat(widget.chatId);
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }
  
  // إرسال رسالة
  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;
    
    context.read<ChatProvider>().sendMessage(widget.chatId, content);
    _messageController.clear();
    
    // إيقاف حالة الكتابة
    context.read<ChatProvider>().sendStopTyping(widget.chatId);
    _isTyping = false;
  }
  
  // معالجة الكتابة
  void _onTextChanged(String text) {
    if (!_isTyping) {
      _isTyping = true;
      context.read<ChatProvider>().sendTyping(widget.chatId);
    }
    
    _typingTimer?.cancel();
    _typingTimer = Timer(const Duration(seconds: 2), () {
      if (_isTyping) {
        _isTyping = false;
        context.read<ChatProvider>().sendStopTyping(widget.chatId);
      }
    });
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.otherUserName),
            Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final isTyping = chatProvider.isUserTyping(widget.chatId, 'otherUserId');
                return Text(
                  isTyping ? 'يكتب...' : 'متصل',
                  style: TextStyle(fontSize: 12, color: Colors.grey),
                );
              },
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          // قائمة الرسائل
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final messages = chatProvider.getMessages(widget.chatId);
                
                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final message = messages[index];
                    return MessageBubble(message: message);
                  },
                );
              },
            ),
          ),
          
          // حقل إدخال الرسالة
          Container(
            padding: const EdgeInsets.all(8),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: _onTextChanged,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالتك هنا...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send),
                  color: Theme.of(context).primaryColor,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// Message Bubble Widget
class MessageBubble extends StatelessWidget {
  final Message message;
  
  const MessageBubble({Key? key, required this.message}) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    final isFromMe = message.isFromMe;
    
    return Align(
      alignment: isFromMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: isFromMe ? Theme.of(context).primaryColor : Colors.grey[300],
          borderRadius: BorderRadius.circular(15),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              message.content,
              style: TextStyle(
                color: isFromMe ? Colors.white : Colors.black,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  _formatTime(message.sentAt),
                  style: TextStyle(
                    fontSize: 10,
                    color: isFromMe ? Colors.white70 : Colors.grey[600],
                  ),
                ),
                if (isFromMe) ...[
                  const SizedBox(width: 4),
                  Icon(
                    message.isRead ? Icons.done_all : Icons.done,
                    size: 12,
                    color: message.isRead ? Colors.blue : Colors.white70,
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  String _formatTime(DateTime time) {
    return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
  }
}
```

## 🔧 Models المطلوبة

```dart
// lib/models/user.dart
class User {
  final String id;
  final String displayName;
  final String? profileImage;
  final bool isOnline;
  final DateTime? lastSeen;
  final bool isVerified;
  final String role;
  
  User({
    required this.id,
    required this.displayName,
    this.profileImage,
    required this.isOnline,
    this.lastSeen,
    required this.isVerified,
    required this.role,
  });
  
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['_id'] ?? '',
      displayName: json['displayName'] ?? 'مستخدم',
      profileImage: json['profileImage'],
      isOnline: json['isOnline'] ?? false,
      lastSeen: json['lastSeen'] != null ? DateTime.parse(json['lastSeen']) : null,
      isVerified: json['isVerified'] ?? false,
      role: json['role'] ?? 'user',
    );
  }
}

// lib/models/attachment.dart
class Attachment {
  final String url;
  final String type;
  final String name;
  final int size;
  final String mimeType;
  final Duration? duration;
  final Map<String, int>? dimensions;
  
  Attachment({
    required this.url,
    required this.type,
    required this.name,
    required this.size,
    required this.mimeType,
    this.duration,
    this.dimensions,
  });
  
  factory Attachment.fromJson(Map<String, dynamic> json) {
    return Attachment(
      url: json['url'] ?? '',
      type: json['type'] ?? 'file',
      name: json['name'] ?? '',
      size: json['size'] ?? 0,
      mimeType: json['mimeType'] ?? '',
      duration: json['duration'] != null ? Duration(seconds: json['duration']) : null,
      dimensions: json['dimensions'] != null 
          ? Map<String, int>.from(json['dimensions'])
          : null,
    );
  }
}
```

## 🚀 Main App Setup

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/chat_provider.dart';
import 'services/socket_service.dart';
import 'screens/chat_list_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // تهيئة Socket Service
  await SocketService.instance.initializeSocket();
  
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ChatProvider()..initialize()),
      ],
      child: MaterialApp(
        title: 'ArtHub Chat',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          fontFamily: 'Cairo', // للدعم العربي
        ),
        home: ChatListScreen(),
      ),
    );
  }
}
```

## 📋 كيفية الاستخدام

1. **إنشاء محادثة جديدة:**
```dart
final chat = await context.read<ChatProvider>().createChat(otherUserId);
if (chat != null) {
  Navigator.push(
    context,
    MaterialPageRoute(
      builder: (context) => ChatScreen(
        chatId: chat.id,
        otherUserName: chat.otherUser.displayName,
      ),
    ),
  );
}
```

2. **فتح محادثة موجودة:**
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => ChatScreen(
      chatId: chatId,
      otherUserName: otherUserName,
    ),
  ),
);
```

## 🎯 الميزات المضمنة

- ✅ **رسائل فورية** - تظهر فوراً للمستقبل
- ✅ **حالة الكتابة** - عرض "يكتب..." عند الكتابة
- ✅ **حالة القراءة** - علامات القراءة للرسائل
- ✅ **تحديث فوري** - تحديث القائمة عند إنشاء محادثة جديدة
- ✅ **بحث في المحادثات** - البحث بالاسم
- ✅ **سحب للتحديث** - تحديث القائمة بالسحب للأسفل
- ✅ **دعم المرفقات** - إرسال واستقبال الملفات
- ✅ **واجهة عربية** - دعم كامل للغة العربية

## 🔍 ملاحظات مهمة

1. **تأكد من استبدال `YOUR_BACKEND_URL`** بـ URL الباك إند الحقيقي
2. **تأكد من إضافة Dependencies** المطلوبة في `pubspec.yaml`
3. **تأكد من إعدادات CORS** في الباك إند
4. **اختبر الاتصال** قبل استخدام الميزات
5. **راجع الأذونات** المطلوبة للأندرويد والـ iOS

**الآن يجب أن تعمل المحادثات الجديدة فوراً دون الحاجة للخروج من التطبيق! 🚀**
