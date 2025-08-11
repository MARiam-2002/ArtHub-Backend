# Flutter Chat Screen Implementation Guide

## 📱 ChatScreen Implementation

```dart
// lib/screens/chat_screen.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/chat_provider.dart';
import '../models/message.dart';
import 'package:intl/intl.dart';

class ChatScreen extends StatefulWidget {
  final String chatId;
  final String otherUserName;
  final String otherUserId; // إضافة معرف المستخدم الآخر

  const ChatScreen({
    Key? key,
    required this.chatId,
    required this.otherUserName,
    required this.otherUserId, // إضافة معرف المستخدم الآخر
  }) : super(key: key);

  @override
  _ChatScreenState createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  bool _isTyping = false;
  Timer? _typingTimer;

  @override
  void initState() {
    super.initState();
    
    // تحميل الرسائل عند فتح الشاشة
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ChatProvider>().loadMessages(widget.chatId);
    });
  }

  @override
  void dispose() {
    _messageController.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    
    // مغادرة المحادثة عند إغلاق الشاشة
    context.read<ChatProvider>().leaveChat(widget.chatId);
    
    super.dispose();
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    context.read<ChatProvider>().sendMessage(widget.chatId, content);
    _messageController.clear();
    
    // إيقاف مؤشر الكتابة
    _stopTyping();
    
    // التمرير للأسفل
    _scrollToBottom();
  }

  void _onTextChanged(String text) {
    if (!_isTyping) {
      _isTyping = true;
      context.read<ChatProvider>().sendTyping(widget.chatId);
    }

    // إعادة تعيين مؤقت الكتابة
    _typingTimer?.cancel();
    _typingTimer = Timer(Duration(milliseconds: 1000), () {
      _stopTyping();
    });
  }

  void _stopTyping() {
    if (_isTyping) {
      _isTyping = false;
      context.read<ChatProvider>().stopTyping(widget.chatId);
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  String _getLastSeenText(DateTime? lastSeen) {
    if (lastSeen == null) return 'غير متصل';
    
    final now = DateTime.now();
    final difference = now.difference(lastSeen);
    
    if (difference.inMinutes < 1) {
      return 'الآن';
    } else if (difference.inMinutes < 60) {
      return 'منذ ${difference.inMinutes} دقيقة';
    } else if (difference.inHours < 24) {
      return 'منذ ${difference.inHours} ساعة';
    } else {
      return 'منذ ${difference.inDays} يوم';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(widget.otherUserName),
            // عرض حالة الاتصال
            Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final isOnline = chatProvider.isUserOnline(widget.otherUserId);
                final lastSeen = chatProvider.getUserLastSeen(widget.otherUserId);
                
                return Text(
                  isOnline ? 'متصل الآن' : _getLastSeenText(lastSeen),
                  style: TextStyle(
                    fontSize: 12,
                    color: isOnline ? Colors.green : Colors.grey,
                  ),
                );
              },
            ),
          ],
        ),
        leading: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Icon(Icons.arrow_back),
              onPressed: () => Navigator.pop(context),
            ),
            // مؤشر الاتصال
            Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                final isOnline = chatProvider.isUserOnline(widget.otherUserId);
                
                return Container(
                  width: 8,
                  height: 8,
                  margin: EdgeInsets.only(left: 8),
                  decoration: BoxDecoration(
                    color: isOnline ? Colors.green : Colors.grey,
                    shape: BoxShape.circle,
                  ),
                );
              },
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.more_vert),
            onPressed: () {
              // قائمة الخيارات
              _showOptionsMenu();
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // قائمة الرسائل
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                if (chatProvider.isLoadingMessages) {
                  return Center(child: CircularProgressIndicator());
                }

                if (chatProvider.messages.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text(
                          'لا توجد رسائل بعد',
                          style: TextStyle(fontSize: 18, color: Colors.grey),
                        ),
                        SizedBox(height: 8),
                        Text(
                          'ابدأ المحادثة بإرسال رسالة',
                          style: TextStyle(fontSize: 14, color: Colors.grey),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  padding: EdgeInsets.all(16),
                  itemCount: chatProvider.messages.length,
                  itemBuilder: (context, index) {
                    final message = chatProvider.messages[index];
                    return MessageBubble(message: message);
                  },
                );
              },
            ),
          ),

          // مؤشر الكتابة
          Consumer<ChatProvider>(
            builder: (context, chatProvider, child) {
              final isTyping = chatProvider.isUserTyping(widget.otherUserId);
              
              if (isTyping) {
                return Container(
                  padding: EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Text(
                        '${widget.otherUserName} يكتب...',
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                      SizedBox(width: 8),
                      SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.grey),
                        ),
                      ),
                    ],
                  ),
                );
              }
              
              return SizedBox.shrink();
            },
          ),

          // حقل إدخال الرسالة
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black12,
                  blurRadius: 4,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    onChanged: _onTextChanged,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالة...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                        borderSide: BorderSide.none,
                      ),
                      filled: true,
                      fillColor: Colors.grey[100],
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 12,
                      ),
                    ),
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    shape: BoxShape.circle,
                  ),
                  child: IconButton(
                    icon: Icon(Icons.send, color: Colors.white),
                    onPressed: _sendMessage,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showOptionsMenu() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.block),
              title: Text('حظر المستخدم'),
              onTap: () {
                Navigator.pop(context);
                // تنفيذ حظر المستخدم
              },
            ),
            ListTile(
              leading: Icon(Icons.report),
              title: Text('الإبلاغ عن إساءة'),
              onTap: () {
                Navigator.pop(context);
                // تنفيذ الإبلاغ
              },
            ),
            ListTile(
              leading: Icon(Icons.delete),
              title: Text('حذف المحادثة'),
              onTap: () {
                Navigator.pop(context);
                // تنفيذ حذف المحادثة
              },
            ),
          ],
        ),
      ),
    );
  }
}

// Message Bubble Widget
class MessageBubble extends StatelessWidget {
  final Message message;

  const MessageBubble({
    Key? key,
    required this.message,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isFromMe = message.isFromMe;
    
    return Container(
      margin: EdgeInsets.only(
        bottom: 8,
        left: isFromMe ? 64 : 0,
        right: isFromMe ? 0 : 64,
      ),
      child: Column(
        crossAxisAlignment: isFromMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: isFromMe 
                  ? Theme.of(context).primaryColor 
                  : Colors.grey[200],
              borderRadius: BorderRadius.circular(18),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // محتوى الرسالة
                Text(
                  message.content,
                  style: TextStyle(
                    color: isFromMe ? Colors.white : Colors.black87,
                    fontSize: 16,
                  ),
                ),
                
                // المرفقات (الصور)
                if (message.images.isNotEmpty) ...[
                  SizedBox(height: 8),
                  ...message.images.map((imageUrl) => Container(
                    margin: EdgeInsets.only(bottom: 4),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        imageUrl,
                        width: 200,
                        height: 150,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            width: 200,
                            height: 150,
                            color: Colors.grey[300],
                            child: Icon(Icons.error, color: Colors.grey),
                          );
                        },
                      ),
                    ),
                  )).toList(),
                ],
                
                // المرفقات (الملفات)
                if (message.attachments.isNotEmpty) ...[
                  SizedBox(height: 8),
                  ...message.attachments.map((attachment) => Container(
                    margin: EdgeInsets.only(bottom: 4),
                    padding: EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.attach_file, color: Colors.white),
                        SizedBox(width: 8),
                        Text(
                          'ملف مرفق',
                          style: TextStyle(color: Colors.white),
                        ),
                      ],
                    ),
                  )).toList(),
                ],
              ],
            ),
          ),
          
          // معلومات الرسالة (الوقت وحالة القراءة)
          Container(
            margin: EdgeInsets.only(top: 4),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  DateFormat('HH:mm').format(message.sentAt),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                if (isFromMe) ...[
                  SizedBox(width: 4),
                  Icon(
                    message.isRead ? Icons.done_all : Icons.done,
                    size: 16,
                    color: message.isRead ? Colors.blue : Colors.grey[600],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

## 🔧 إعداد Provider في main.dart

```dart
// lib/main.dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/chat_provider.dart';
import 'services/socket_service.dart';

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ChatProvider()),
      ],
      child: MaterialApp(
        title: 'ArtHub Chat',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          visualDensity: VisualDensity.adaptivePlatformDensity,
        ),
        home: LoginScreen(), // أو الشاشة المناسبة
      ),
    );
  }
}

// في شاشة تسجيل الدخول
class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  @override
  void initState() {
    super.initState();
    // تهيئة Socket.IO عند تسجيل الدخول
    _initializeSocket();
  }

  Future<void> _initializeSocket() async {
    await SocketService.instance.initializeSocket();
  }

  // ... باقي كود تسجيل الدخول
}
```

## 🎯 المميزات المضافة

### 1. عرض حالة الاتصال
- **مؤشر أخضر** للمستخدمين المتصلين
- **مؤشر رمادي** للمستخدمين غير المتصلين
- **نص "متصل الآن"** للمستخدمين المتصلين
- **آخر ظهور** للمستخدمين غير المتصلين

### 2. مؤشر الكتابة
- **"يكتب..."** مع أيقونة تحميل
- **تحديث فوري** عند بدء/إيقاف الكتابة
- **debouncing** لتجنب الإرسال المتكرر

### 3. واجهة محسنة
- **AppBar** مع معلومات المستخدم وحالة الاتصال
- **قائمة خيارات** (حظر، إبلاغ، حذف)
- **رسائل فقاعية** مع دعم الصور والملفات
- **مؤشرات القراءة** للرسائل المرسلة

### 4. تجربة مستخدم محسنة
- **تمرير تلقائي** للأسفل عند إرسال رسالة
- **تحميل الرسائل** عند فتح المحادثة
- **مغادرة المحادثة** عند إغلاق الشاشة
- **معالجة الأخطاء** للصور والملفات

## 📋 Checklist للتطبيق

- [ ] إضافة `otherUserId` في `ChatScreen`
- [ ] تحديث `AppBar` لعرض حالة الاتصال
- [ ] إضافة مؤشر الاتصال في `leading`
- [ ] إضافة مؤشر الكتابة
- [ ] تحديث `MessageBubble` لدعم المرفقات
- [ ] إضافة قائمة الخيارات
- [ ] إعداد Provider في `main.dart`
- [ ] تهيئة Socket.IO عند تسجيل الدخول
- [ ] اختبار عرض حالة الاتصال
- [ ] اختبار مؤشر الكتابة
