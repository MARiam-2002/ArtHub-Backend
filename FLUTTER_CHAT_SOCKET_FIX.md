# 🔧 إصلاح مشكلة استقبال الرسائل في Flutter

## 🚨 المشكلة
الرسائل لا تصل عبر Socket.IO في Flutter بعد إصلاح مشكلة التكرار.

## ✅ الحل السريع

### 1. تحديث ChatService في Flutter

```dart
import 'package:art_hub/features/user_chat/controller/cubit/chat_cubit.dart';
import 'package:art_hub/services/network/remote/api_constants.dart';
import 'package:art_hub/services/servie_locator.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  static ChatService? _instance;
  static ChatService get instance => _instance ??= ChatService._internal();

  ChatService._internal();

  IO.Socket? _socket;
  String? _currentUserId;
  String? _currentChatId;

  String? get currentUserId => _currentUserId;

  Future<void> initializeSocket() async {
    try {
      final token = await SecureStorage().getAccessToken();
      final userId = await SecureStorage().getUserId();
      
      if (token == null || userId == null) {
        print('❌ Missing token or userId for socket connection');
        return;
      }

      _currentUserId = userId;

      print('🔌 Initializing Socket.IO connection...');
      print('👤 User ID: $userId');
      print('🌐 Socket URL: ${ApiConstant.baseUrl}');

      _socket = IO.io(
        ApiConstant.baseUrl,
        IO.OptionBuilder()
            .setTransports(['websocket'])
            .setAuth({'token': token})
            .setExtraHeaders({'Authorization': 'Bearer $token'})
            .disableReconnection()
            .build(),
      );

      _setupSocketListeners();
      _socket!.connect();
      
      print('🔌 Socket.IO connected successfully');
    } catch (e) {
      print('❌ Error initializing socket: $e');
    }
  }

  void _setupSocketListeners() {
    _socket!.onConnect((_) {
      print('✅ Socket connected');
      
      // Authenticate immediately after connection
      if (_currentUserId != null) {
        _socket!.emit('authenticate', {'userId': _currentUserId});
      }
    });

    _socket!.onDisconnect((_) {
      print('❌ Socket disconnected');
    });

    _socket!.onError((error) {
      print('❌ Socket error: $error');
    });

    _socket!.on('authenticated', (data) {
      print('✅ User authenticated: $data');
    });

    // Listen for new messages
    _socket!.on('new_message', (data) {
      print('📨 Received new_message event: $data');
      ServiceLocator.get<ChatCubit>().handleIncomingMessage(data);
    });

    _socket!.on('typing', (data) {
      print('⌨️ User typing: $data');
    });

    _socket!.on('stop_typing', (data) => {
      print('⏹️ User stopped typing: $data');
    });

    _socket!.on('messages_read', (data) {
      print('👁️ Messages read: $data');
    });
  }

  void joinChat(String chatId) {
    if (_socket != null && _socket!.connected) {
      _currentChatId = chatId;
      _socket!.emit('join_chat', {'chatId': chatId});
      print('👥 Joined chat room: $chatId');
    } else {
      print('⚠️ Socket not connected, cannot join chat');
    }
  }

  void leaveChat() {
    if (_socket != null && _socket!.connected && _currentChatId != null) {
      _socket!.emit('leave_chat', {'chatId': _currentChatId});
      _currentChatId = null;
      print('👋 Left chat room');
    }
  }

  void markMessagesAsRead(String chatId) {
    if (_socket != null && _socket!.connected) {
      _socket!.emit('mark_read', {'chatId': chatId});
      print('✅ Marked messages as read for chat: $chatId');
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    print('🔌 Socket disconnected');
  }
}
```

### 2. تحديث ApiConstant

```dart
class ApiConstant {
  // Base URLs
  static const String baseUrl = 'https://arthub-backend.up.railway.app';
  static const String apiBaseUrl = '$baseUrl/api';
  
  // Chat endpoints
  static const String chat = '$apiBaseUrl/chat';
  static const String createChat = '$apiBaseUrl/chat/create';
  static String chatMessages(String chatId) => '$apiBaseUrl/chat/$chatId/messages';
  static String sendMessages(String chatId) => '$apiBaseUrl/chat/$chatId/send';
  static String markAsRead(String chatId) => '$apiBaseUrl/chat/$chatId/read';
  static String deleteMessage(String chatId, String messageId) => '$apiBaseUrl/chat/$chatId/messages/$messageId';
  
  // Auth endpoints
  static const String login = '$apiBaseUrl/auth/login';
  static const String register = '$apiBaseUrl/auth/register';
  
  // User endpoints
  static const String profile = '$apiBaseUrl/user/profile';
  static const String updateProfile = '$apiBaseUrl/user/profile/update';
}
```

### 3. تحديث SecureStorage

```dart
class SecureStorage {
  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  // إضافة هذه الدوال
  static Future<String?> getUserId() async {
    try {
      return await _storage.read(key: 'user_id');
    } catch (e) {
      return null;
    }
  }

  static Future<void> saveUserId(String userId) async {
    await _storage.write(key: 'user_id', value: userId);
  }

  static Future<void> saveUserData(String token, String userId) async {
    await _storage.write(key: 'access_token', value: token);
    await _storage.write(key: 'user_id', value: userId);
  }

  static Future<String?> getAccessToken() async {
    return await _storage.read(key: 'access_token');
  }

  static Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
```

### 4. تحديث LoginCubit لحفظ userId

```dart
// في login_cubit.dart بعد نجاح تسجيل الدخول
if (response.statusCode == 200) {
  final token = response.data['data']['token'];
  final userId = response.data['data']['user']['_id'];
  
  await SecureStorage().saveUserData(token, userId);
  // ... باقي الكود
}
```

### 5. تحديث MainScreen لتهيئة Socket

```dart
// في main_screen.dart
class _MainScreenState extends State<MainScreen> {
  @override
  void initState() {
    super.initState();
    _initializeSocket();
  }

  Future<void> _initializeSocket() async {
    try {
      final token = await SecureStorage().getAccessToken();
      final userId = await SecureStorage().getUserId();
      
      if (token != null && userId != null) {
        print('🔌 Initializing Socket with userId: $userId');
        await ChatService.instance.initializeSocket();
      } else {
        print('❌ Missing token or userId for socket initialization');
      }
    } catch (e) {
      print('❌ Error initializing socket: $e');
    }
  }
}
```

## 🧪 اختبار الحل

### 1. تحقق من الـ Logs
```bash
# يجب أن ترى هذه الرسائل:
🔌 Initializing Socket.IO connection...
✅ Socket connected
✅ User authenticated: {userId: "..."}
👥 Joined chat room: "..."
📨 Received new_message event: {...}
```

### 2. اختبار إرسال رسالة
1. أرسل رسالة من Flutter
2. تحقق من الـ logs في Flutter
3. تحقق من الـ logs في Backend
4. تأكد من وصول الرسالة عبر Socket.IO

### 3. اختبار استقبال رسالة
1. أرسل رسالة من تطبيق آخر
2. تحقق من وصولها في Flutter
3. تأكد من عدم تكرار الرسالة

## 🔍 Debugging

### إذا لم تصل الرسائل:

1. **تحقق من Socket Connection**:
   ```dart
   print('🔌 Socket connected: ${_socket?.connected}');
   ```

2. **تحقق من Authentication**:
   ```dart
   print('👤 User ID: $_currentUserId');
   ```

3. **تحقق من Chat Room**:
   ```dart
   print('👥 Current chat: $_currentChatId');
   ```

4. **تحقق من Backend Logs**:
   ```bash
   # في Backend يجب أن ترى:
   📤 Sending new_message to chat ...
   ```

## 🎯 النتيجة المتوقعة

بعد تطبيق هذه التحديثات:

- ✅ **Socket.IO يتصل بنجاح**
- ✅ **User يتم authenticate**
- ✅ **Chat room يتم join**
- ✅ **الرسائل تصل عبر Socket.IO**
- ✅ **لا يوجد تكرار في الرسائل**
- ✅ **Real-time updates تعمل**

## 📝 ملاحظات مهمة

1. **تأكد من حفظ userId عند تسجيل الدخول**
2. **تأكد من تهيئة Socket في MainScreen**
3. **تحقق من الـ logs للتأكد من الاتصال**
4. **اختبر مع مستخدمين مختلفين**

هذا الحل يجب أن يصلح مشكلة استقبال الرسائل في Flutter! 🚀 