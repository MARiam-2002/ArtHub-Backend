# 🎯 Flutter Chat - الحل النهائي (Fixed Double-Sending Issue)

## 🚀 الحل النهائي للفلاتر

### 1. تحديث ChatCubit (Fixed)

```dart
import 'dart:async';
import 'package:art_hub/features/chats/data/models/chats/chat.dart';
import 'package:art_hub/features/chats/data/models/chats/chats.dart';
import 'package:art_hub/features/user_chat/data/models/chat_messages_model/chat_messages_model.dart';
import 'package:art_hub/features/user_chat/data/models/chat_messages_model/message.dart';
import 'package:art_hub/services/network/remote/api_constants.dart';
import 'package:art_hub/services/network/remote/dio_helper.dart';
import 'package:art_hub/services/secure_storage.dart';
import 'package:bloc/bloc.dart';
import 'package:dio/dio.dart';
import 'package:equatable/equatable.dart';

part 'chat_state.dart';

class ChatCubit extends Cubit<ChatState> {
  ChatCubit() : super(ChatInitial());

  final DioHelper dio = DioHelper();
  final List<Message> _messages = [];
  final StreamController<Message> _incomingMessageController =
      StreamController.broadcast();

  List<Message> get messages => _messages;
  Stream<Message> get incomingMessages => _incomingMessageController.stream;

  /// Load all user chats
  Future<void> getUserChats() async {
    emit(ChatLoading());
    try {
      final token = await SecureStorage().getAccessToken();
      final response = await dio.fetchData(url: ApiConstant.chat, token: token);

      if (response.statusCode == 200) {
        final chatWrapper = Chats.fromJson(response.data);
        final List<Chat> chatList = chatWrapper.data?.chats ?? [];
        emit(AllChatsLoaded(chatList));
      } else {
        emit(ChatError(response.data['message'] ?? "Failed to load chats"));
      }
    } catch (e) {
      emit(ChatError("An error occurred: ${e.toString()}"));
    }
  }

  /// Load all messages for a given chat
  Future<List<Message>> getChatMessages(String chatId) async {
    emit(ChatLoading());
    try {
      final token = await SecureStorage().getAccessToken();
      final response = await dio.fetchData(
        url: ApiConstant.chatMessages(chatId),
        token: token,
      );

      if (response.statusCode == 200) {
        final chatMessagesWrapper = ChatMessagesModel.fromJson(response.data);
        final List<Message> loadedMessages =
            chatMessagesWrapper.data?.messages ?? [];
        _messages
          ..clear()
          ..addAll(loadedMessages);
        emit(ChatLoaded(List.from(_messages)));
        return _messages;
      } else {
        emit(
          ChatError(response.data['message'] ?? "Failed to load chat messages"),
        );
        return [];
      }
    } catch (error) {
      final message =
          (error is DioException)
              ? error.response?.data['message'] ??
                  "An unknown network error occurred"
              : error.toString();
      emit(ChatError(message));
      return [];
    }
  }

  /// Send message via HTTP API (NOT Socket)
  Future<void> sendMessage(
    String chatId,
    String content,
    String receiverId,
  ) async {
    try {
      final token = await SecureStorage().getAccessToken();
      
      print('📤 Sending message via HTTP API...');
      
      // Use HTTP API to send message
      final response = await dio.postData(
        url: ApiConstant.sendMessages(chatId),
        data: {
          'content': content,
          'messageType': 'text',
          'receiverId': receiverId
        },
        token: token,
      );

      if (response.statusCode == 201) {
        // ✅ FIXED: Don't add message here - it will come back via Socket.IO
        // The server will emit the message via Socket.IO after saving
        print('✅ Message sent successfully via HTTP API - waiting for Socket.IO confirmation');
      } else {
        emit(ChatError(response.data['message'] ?? "Failed to send message"));
      }
    } catch (error) {
      final message =
          (error is DioException)
              ? error.response?.data['message'] ?? "Network error"
              : error.toString();
      emit(ChatError(message));
    }
  }

  /// Create a new chat
  Future<Chat?> createChat(String receiverId) async {
    emit(ChatLoading());
    try {
      final token = await SecureStorage().getAccessToken();
      final response = await dio.postData(
        url: ApiConstant.createChat,
        data: {'otherUserId': receiverId},
        token: token,
      );

      if (response.statusCode == 201) {
        final chatJson = response.data['data']['chat'];
        final chat = Chat.fromJson(chatJson);
        emit(ChatCreated(chat.id!));
        await getChatMessages(chat.id!);
        return chat;
      } else {
        emit(ChatError(response.data['message'] ?? "Failed to create chat"));
        return null;
      }
    } catch (error) {
      final message =
          (error is DioException)
              ? error.response?.data['message'] ?? "Network error"
              : error.toString();
      emit(ChatError(message));
      return null;
    }
  }

  /// ✅ FIXED: Single source of truth for adding messages
  /// Handle a message received from socket (real-time) - this is the ONLY place messages are added
  void handleIncomingMessage(dynamic data) {
    try {
      print('📨 Received real-time message: $data');
      final message = Message.fromJson(data);
      
      // Check if message already exists to prevent duplicates
      final existingMessage = _messages.any((m) => 
        m.id == message.id || 
        (m.content == message.content && 
         m.sender?.id == message.sender?.id &&
         m.sentAt?.difference(message.sentAt ?? DateTime.now()).abs().inSeconds < 5)
      );
      
      if (!existingMessage) {
        _messages.add(message);
        emit(ChatLoaded(List.from(_messages)));
        _incomingMessageController.add(message);
        print('✅ Message added to UI via Socket.IO');
      } else {
        print('⚠️ Message already exists, skipping duplicate');
      }
    } catch (error) {
      print('❌ Error handling incoming message: $error');
    }
  }

  @override
  Future<void> close() {
    _incomingMessageController.close();
    return super.close();
  }
}
```

### 2. تحديث ChatService

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
    });

    _socket!.onDisconnect((_) {
      print('❌ Socket disconnected');
    });

    _socket!.onError((error) {
      print('❌ Socket error: $error');
    });

    // Listen for new messages
    _socket!.on('new_message', (data) {
      print('📨 Received new_message event: $data');
      ServiceLocator.get<ChatCubit>().handleIncomingMessage(data);
    });

    _socket!.on('typing', (data) {
      print('⌨️ User typing: $data');
    });

    _socket!.on('stop_typing', (data) {
      print('⏹️ User stopped typing: $data');
    });
  }

  void joinChat(String chatId) {
    if (_socket != null && _socket!.connected) {
      _currentChatId = chatId;
      _socket!.emit('join_chat', {'chatId': chatId});
      print('👥 Joined chat room: $chatId');
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

### 3. تحديث UserChatScreen (Fixed)

```dart
import 'package:art_hub/features/user_chat/controller/cubit/chat_cubit.dart';
import 'package:art_hub/features/user_chat/data/models/chat_messages_model/message.dart';
import 'package:art_hub/features/user_chat/presentation/widgets/message_bubble.dart';
import 'package:art_hub/services/chat_service.dart';
import 'package:art_hub/services/secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'dart:async';

class UserChatScreen extends StatefulWidget {
  final String chatId;
  final String receiverId;
  final String receiverName;

  const UserChatScreen({
    Key? key,
    required this.chatId,
    required this.receiverId,
    required this.receiverName,
  }) : super(key: key);

  @override
  State<UserChatScreen> createState() => _UserChatScreenState();
}

class _UserChatScreenState extends State<UserChatScreen>
    with WidgetsBindingObserver {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool isLoading = true;
  StreamSubscription<Message>? _messageSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeChat();
  }

  void _initializeChat() async {
    print('🚀 Initializing chat...');
    
    // Join chat room for real-time updates
    ChatService.instance.joinChat(widget.chatId);

    // Load messages via HTTP API
    await _loadMessages();

    // Mark messages as read
    ChatService.instance.markMessagesAsRead(widget.chatId);
  }

  Future<void> _loadMessages() async {
    try {
      print('📥 Loading messages...');
      final token = await SecureStorage().getAccessToken();
      if (token != null) {
        await context.read<ChatCubit>().getChatMessages(widget.chatId);
        setState(() {
          isLoading = false;
        });
        _scrollToBottom();
        print('✅ Messages loaded successfully');
      }
    } catch (e) {
      print('❌ Error loading messages: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

    print('📤 Sending message: $content');

    // ✅ FIXED: Remove optimistic update - let Socket.IO handle all UI updates
    // The message will appear in UI when confirmed via Socket.IO
    
    // Send via HTTP API (not socket)
    context.read<ChatCubit>().sendMessage(
      widget.chatId,
      content,
      widget.receiverId,
    );

    _messageController.clear();
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.minScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: EdgeInsets.symmetric(
          horizontal: 20.w(context),
          vertical: 10.h(context),
        ),
        child: Column(
          children: [
            // Header
            Row(
              children: [
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.arrow_back),
                ),
                CircleAvatar(
                  radius: 20,
                  child: Text(
                    widget.receiverName[0].toUpperCase(),
                    style: const TextStyle(fontSize: 18),
                  ),
                ),
                SizedBox(width: 10.w(context)),
                Text(
                  widget.receiverName,
                  style: TextStyle(
                    fontSize: 18.sp(context),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 10.h(context)),
            
            // Messages List
            Expanded(
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : BlocBuilder<ChatCubit, ChatState>(
                      builder: (context, state) {
                        if (state is ChatLoaded) {
                          return ListView.builder(
                            controller: _scrollController,
                            reverse: true,
                            itemCount: state.messages.length,
                            itemBuilder: (context, index) {
                              final message = state.messages[index];
                              return MessageBubble(
                                message: message,
                                isFromMe: message.isFromMe ?? false,
                              );
                            },
                          );
                        } else if (state is ChatError) {
                          return Center(
                            child: Text(
                              state.message,
                              style: TextStyle(color: Colors.red),
                            ),
                          );
                        }
                        return const Center(
                          child: Text('No messages yet'),
                        );
                      },
                    ),
            ),
            
            // Message Input
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(25),
                      ),
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 15.w(context),
                        vertical: 10.h(context),
                      ),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                SizedBox(width: 10.w(context)),
                IconButton(
                  onPressed: _sendMessage,
                  icon: const Icon(Icons.send),
                  style: IconButton.styleFrom(
                    backgroundColor: Colors.blue,
                    foregroundColor: Colors.white,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
```

## 🔧 التغييرات الرئيسية (Main Changes)

### ✅ المشكلة (Problem):
- الرسائل كانت تظهر مرتين في الـ UI
- السبب: إضافة الرسالة في 3 أماكن مختلفة

### ✅ الحل (Solution):
1. **إزالة الإضافة المتفائلة (Remove Optimistic Update)**: 
   - حذف `_addMessageToCubit(content)` من `UserChatScreen._sendMessage()`

2. **إزالة الإضافة من HTTP Response**: 
   - حذف `_messages.add(message)` من `ChatCubit.sendMessage()`

3. **Socket.IO كـ Single Source of Truth**: 
   - `ChatCubit.handleIncomingMessage()` هو المكان الوحيد لإضافة الرسائل
   - إضافة فحص لمنع التكرار

### ✅ النتيجة (Result):
- الرسائل تظهر مرة واحدة فقط
- Socket.IO يتحكم في جميع تحديثات الـ UI
- HTTP API مسؤول فقط عن حفظ الرسالة وإرسالها عبر Socket.IO

## 🚀 كيفية الاستخدام (How to Use)

1. **تحديث الكود في Flutter**:
   ```bash
   # انسخ الكود المحدث إلى ملفاتك
   ```

2. **اختبار الوظائف**:
   - إرسال رسالة جديدة
   - استقبال رسالة من مستخدم آخر
   - التأكد من عدم تكرار الرسائل

3. **مراقبة الـ Logs**:
   ```bash
   # ستظهر رسائل مثل:
   📤 Sending message via HTTP API...
   ✅ Message sent successfully via HTTP API - waiting for Socket.IO confirmation
   📨 Received real-time message: {...}
   ✅ Message added to UI via Socket.IO
   ```

## 🎯 المميزات (Features)

- ✅ **رسائل تظهر مرة واحدة فقط**
- ✅ **تحديث فوري عبر Socket.IO**
- ✅ **حفظ موثوق عبر HTTP API**
- ✅ **منع تكرار الرسائل**
- ✅ **واجهة مستخدم سلسة**

## 🔍 Debugging

إذا واجهت مشاكل:

1. **تأكد من Socket.IO Connection**:
   ```dart
   print('🔌 Socket.IO connected successfully');
   ```

2. **تحقق من HTTP API**:
   ```dart
   print('✅ Message sent successfully via HTTP API');
   ```

3. **مراقبة Socket Events**:
   ```dart
   print('📨 Received new_message event: $data');
   ```

## 📝 ملاحظات مهمة (Important Notes)

- **HTTP API**: مسؤول عن حفظ الرسالة والتحقق من الصحة
- **Socket.IO**: مسؤول عن التحديث الفوري للـ UI
- **Single Source of Truth**: `handleIncomingMessage()` فقط
- **No Optimistic Updates**: انتظار تأكيد Socket.IO 