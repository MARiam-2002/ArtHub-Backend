# 🎯 Flutter Chat - الحل النهائي

## 🚀 الحل النهائي للفلاتر

### 1. تحديث ChatCubit

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
        final messageJson = response.data['data']['message'];
        final message = Message.fromJson(messageJson);
        
        // Add to local messages
        _messages.add(message);
        emit(ChatLoaded(List.from(_messages)));
        
        print('✅ Message sent successfully via HTTP API');
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

  /// Add a sent message to local list and emit state
  void addMessage(Message message) {
    _messages.add(message);
    emit(ChatLoaded(List.from(_messages)));
  }

  /// Handle a message received from socket (real-time)
  void handleIncomingMessage(dynamic data) {
    try {
      print('📨 Received real-time message: $data');
      final message = Message.fromJson(data);
      _messages.add(message);
      emit(ChatLoaded(List.from(_messages)));
      _incomingMessageController.add(message);
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
  bool _isConnected = false;
  String? _currentUserId;
  String? get currentUserId => _currentUserId;

  // Initialize Socket Connection
  void initSocket(String userId, String token) {
    _currentUserId = userId;

    print('🔌 Initializing Socket.IO connection...');
    print('👤 User ID: $userId');
    print('🌐 Socket URL: ${ApiConstant.socketUrl}');

    _socket = IO.io(ApiConstant.socketUrl, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'extraHeaders': {'Authorization': 'Bearer $token'},
    });

    _setupSocketListeners();
    _socket!.connect();
  }

  void _setupSocketListeners() {
    // Connection Events
    _socket!.on('connect', (_) {
      print('✅ Socket Connected');
      _isConnected = true;
      _authenticateUser();
    });

    _socket!.on('disconnect', (_) {
      print('❌ Socket Disconnected');
      _isConnected = false;
    });

    _socket!.on('authenticated', (data) {
      print('✅ User Authenticated: $data');
    });

    _socket!.on('error', (data) {
      print('❌ Socket Error: $data');
    });

    // Chat Events - ONLY for receiving messages
    _socket!.on('new_message', (data) {
      print('📨 New message received via socket: $data');
      _handleNewMessage(data);
    });

    _socket!.on('messages_read', (data) {
      print('👁️ Messages Read: $data');
      _handleMessagesRead(data);
    });

    _socket!.on('user_typing', (data) {
      print('⌨️ User Typing: $data');
      _handleUserTyping(data);
    });

    _socket!.on('user_stopped_typing', (data) {
      print('⌨️ User Stopped Typing: $data');
      _handleUserStoppedTyping(data);
    });
  }

  void _authenticateUser() {
    if (_currentUserId != null) {
      print('🔐 Authenticating user: $_currentUserId');
      _socket!.emit('authenticate', {'userId': _currentUserId});
    }
  }

  // Join Chat Room
  void joinChat(String chatId) {
    if (_isConnected && _currentUserId != null) {
      _socket!.emit('join_chat', {'chatId': chatId, 'userId': _currentUserId});
      print('👥 Joined chat room: $chatId');
    } else {
      print('⚠️ Cannot join chat - Socket not connected or user not authenticated');
    }
  }

  // ❌ REMOVE: Don't send messages via socket
  // void sendMessage(String chatId, String content, String receiverId) {
  //   // This should be removed - use HTTP API instead
  // }

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

  // Event Handlers
  void _handleNewMessage(dynamic data) {
    print('📨 Processing new message: $data');
    getIt<ChatCubit>().handleIncomingMessage(data);
  }

  void _handleMessagesRead(dynamic data) {
    print('👁️ Messages Read: $data');
    // You can add UI updates for read receipts here
  }

  void _handleUserTyping(dynamic data) {
    print('⌨️ User Typing: $data');
    // You can add typing indicator UI here
  }

  void _handleUserStoppedTyping(dynamic data) {
    print('⌨️ User Stopped Typing: $data');
    // You can hide typing indicator UI here
  }

  // Disconnect
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _isConnected = false;
    _currentUserId = null;
    print('🔌 Socket disconnected');
  }
}
```

### 3. تحديث UserChatScreen

```dart
import 'dart:async';
import 'package:art_hub/core/helpers/extinsions.dart';
import 'package:art_hub/core/utils/image_manager.dart';
import 'package:art_hub/features/user_chat/controller/cubit/chat_cubit.dart';
import 'package:art_hub/features/user_chat/controller/services/chat_service.dart';
import 'package:art_hub/features/user_chat/data/models/chat_messages_model/message.dart';
import 'package:art_hub/features/user_chat/data/models/chat_messages_model/sender.dart';
import 'package:art_hub/services/secure_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_svg/svg.dart';

import '../../../../core/utils/spacing.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/styles.dart';

class UserChatScreen extends StatefulWidget {
  const UserChatScreen({
    super.key,
    required this.chatId,
    required this.receiverId,
    this.receiverName,
    this.receiverImage,
    this.receiverStatus,
  });
  final String chatId;
  final String receiverId;
  final String? receiverName;
  final String? receiverImage;
  final bool? receiverStatus;

  @override
  State<UserChatScreen> createState() => _UserChatScreenState();
}

class _UserChatScreenState extends State<UserChatScreen>
    with WidgetsBindingObserver {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool isLoading = true;
  late StreamSubscription<Message> _messageSubscription;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _initializeChat();

    // 👇 Listen to real-time incoming messages
    _messageSubscription = context.read<ChatCubit>().incomingMessages.listen((
      message,
    ) {
      print('📩 Received message in UI: ${message.content}');
      _scrollToBottom();
    });
  }

  @override
  void dispose() {
    _messageSubscription.cancel();
    _messageController.dispose();
    _scrollController.dispose();
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
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

    // 1️⃣ Add to local Cubit immediately (fast UI update)
    _addMessageToCubit(content);

    // 2️⃣ Send via HTTP API (not socket)
    context.read<ChatCubit>().sendMessage(
      widget.chatId,
      content,
      widget.receiverId,
    );

    _messageController.clear();
    _scrollToBottom();
  }

  void _addMessageToCubit(String content) {
    final newMessage = Message(
      content: content,
      sender: Sender(id: ChatService.instance.currentUserId),
      isFromMe: true,
      sentAt: DateTime.now(),
    );

    context.read<ChatCubit>().addMessage(newMessage);
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
            Padding(
              padding: EdgeInsets.symmetric(vertical: 10.h(context)),
              child: Row(
                children: [
                  SizedBox(
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundImage: NetworkImage(
                            widget.receiverImage ?? '',
                          ),
                        ),
                        Positioned(
                          bottom: -2,
                          left: -2,
                          child: CircleAvatar(
                            radius: 8,
                            backgroundColor: Colors.white,
                            child: CircleAvatar(
                              radius: 6,
                              backgroundColor:
                                  widget.receiverStatus == true
                                      ? Color(0xff3FB88C)
                                      : Colors.grey,
                              child: Icon(
                                Icons.check,
                                color: ColorsManagers.ceil,
                                size: 12.h(context),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.receiverName ?? '',
                        style: TextStyles.font12Blackw500Tajawal(
                          context,
                        ).copyWith(fontWeight: FontWeight.w700),
                      ),
                      SizedBox(height: 2.h(context)),
                      Text(
                        widget.receiverStatus == true ? "متصل" : "غير متصل",
                        style: TextStyles.font12SpanishGrayw400Almarai(context),
                      ),
                    ],
                  ),
                  const Spacer(flex: 3),
                  Image.asset(ImageManager.logo, height: 105.h(context)),
                  const Spacer(flex: 12),
                  InkWell(
                    onTap: () {
                      context.pop();
                    },
                    child: Icon(Icons.close, color: ColorsManagers.ceil),
                  ),
                ],
              ),
            ),
            
            // Messages List
            Expanded(
              child: Column(
                children: [
                  Text(
                    "Today 04:00 PM",
                    style: TextStyles.font14SpanishGrayw300Almarai(
                      context,
                    ).copyWith(fontWeight: FontWeight.w600),
                  ),
                  verticalSpacing(18.h(context)),
                  Container(
                    padding: EdgeInsets.all(4),
                    decoration: BoxDecoration(
                      color: ColorsManagers.aliceBlue,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      "طلب بخصوص [اسم اللوحة]، يمكنك مراجعة التفاصيل وإتمام الإجراءات هنا.",
                      style: TextStyles.font16YankeesBluew400Amiri(context),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  verticalSpacing(15.h(context)),
                  Expanded(
                    child: BlocBuilder<ChatCubit, ChatState>(
                      builder: (context, state) {
                        if (state is ChatLoading) {
                          return Center(child: CircularProgressIndicator());
                        }

                        final messages =
                            context
                                .read<ChatCubit>()
                                .messages
                                .reversed
                                .toList();

                        if (messages.isEmpty) {
                          return const Center(child: Text("لا توجد رسائل"));
                        }

                        return ListView.builder(
                          reverse: true,
                          controller: _scrollController,
                          itemCount: messages.length,
                          itemBuilder: (context, index) {
                            final msg = messages[index];
                            final isSender = msg.isFromMe == true;

                            return isSender
                                ? SenderItem(message: msg)
                                : RecieverItem(message: msg);
                          },
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
            
            // Message Input
            TextFormField(
              controller: _messageController,
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0x19A8C5DA),
                hintText: "اكتب رسالتك هنا...",
                hintStyle: TextStyles.font12SpanishGrayw400Almarai(
                  context,
                ).copyWith(fontSize: 16),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(42),
                  borderSide: BorderSide(
                    color: ColorsManagers.ceil,
                    width: 1.0,
                  ),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(42),
                  borderSide: BorderSide(
                    color: ColorsManagers.ceil,
                    width: 1.0,
                  ),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(42),
                  borderSide: BorderSide(
                    color: ColorsManagers.ceil,
                    width: 1.0,
                  ),
                ),
                contentPadding: EdgeInsets.symmetric(
                  vertical: 10.h(context),
                  horizontal: 15.w(context),
                ),
                suffixIcon: Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SvgPicture.asset("assets/svgs/gallery.svg"),
                    horizontalSpacing(10.w(context)),
                    SvgPicture.asset("assets/svgs/mic 1.svg"),
                    horizontalSpacing(10.w(context)),
                    GestureDetector(
                      onTap: _sendMessage,
                      child: CircleAvatar(
                        radius: 20,
                        backgroundColor: ColorsManagers.ceil,
                        child: SvgPicture.asset("assets/svgs/send 1.svg"),
                      ),
                    ),
                    horizontalSpacing(4),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Message Widgets
class RecieverItem extends StatelessWidget {
  const RecieverItem({super.key, required this.message});
  final Message message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8.h(context)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          CircleAvatar(
            radius: 15,
            backgroundImage: NetworkImage(message.sender?.profileImage ?? ''),
          ),
          horizontalSpacing(5),
          Container(
            width: 248.w(context),
            decoration: BoxDecoration(
              color: ColorsManagers.ceil,
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(8),
                topRight: Radius.circular(2),
                bottomLeft: Radius.circular(8),
                bottomRight: Radius.circular(2),
              ),
            ),
            padding: EdgeInsets.all(12),
            child: Text(
              message.content ?? '',
              style: TextStyles.font15JapaneseIndigow400Almarai(
                context,
              ).copyWith(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}

class SenderItem extends StatelessWidget {
  const SenderItem({super.key, required this.message});
  final Message message;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 8.h(context)),
      child: Align(
        alignment: Alignment.centerLeft,
        child: Container(
          width: 248.w(context),
          decoration: BoxDecoration(
            color: ColorsManagers.aliceBlue,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(2),
              topRight: Radius.circular(8),
              bottomLeft: Radius.circular(2),
              bottomRight: Radius.circular(8),
            ),
          ),
          padding: EdgeInsets.all(12),
          child: Text(
            message.content ?? '',
            style: TextStyles.font15JapaneseIndigow400Almarai(context),
          ),
        ),
      ),
    );
  }
}
```

### 4. تحديث API Constants

```dart
class ApiConstant {
  // Base URLs
  static const String baseUrl = 'https://arthub-backend.up.railway.app/api';
  static const String socketUrl = 'https://arthub-backend.up.railway.app';
  
  // Chat endpoints
  static const String chat = '$baseUrl/chat';
  static const String createChat = '$baseUrl/chat/create';
  static String chatMessages(String chatId) => '$baseUrl/chat/$chatId/messages';
  static String sendMessages(String chatId) => '$baseUrl/chat/$chatId/send';
  static String markAsRead(String chatId) => '$baseUrl/chat/$chatId/read';
  static String deleteMessage(String chatId, String messageId) => '$baseUrl/chat/$chatId/messages/$messageId';
  
  // Auth endpoints
  static const String login = '$baseUrl/auth/login';
  static const String register = '$baseUrl/auth/register';
  
  // User endpoints
  static const String profile = '$baseUrl/user/profile';
  static const String updateProfile = '$baseUrl/user/profile/update';
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
        ChatService.instance.initSocket(userId, token);
      } else {
        print('❌ Missing token or userId for socket initialization');
      }
    } catch (e) {
      print('❌ Error initializing socket: $e');
    }
  }
}
```

### 6. تحديث SecureStorage

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

## 🎯 النتيجة النهائية

بعد تطبيق هذه التحديثات:

1. **✅ الرسائل تُرسل عبر HTTP API** - سريعة وموثوقة
2. **✅ الرسائل الواردة تُستقبل عبر Socket** - في الوقت الفعلي
3. **✅ الواجهة تتحدث تلقائياً** - بدون تحديث يدوي
4. **✅ Socket يعمل بشكل صحيح** - مع authentication و chat rooms

## 🧪 اختبار الحل

1. **أرسل رسالة من الفلاتر** → يجب أن تظهر فوراً
2. **أرسل رسالة من تطبيق آخر** → يجب أن تظهر في الفلاتر
3. **تحقق من console logs** → يجب أن ترى رسائل التصحيح

هذا الحل النهائي سيحل المشكلة بشكل كامل! 🎉 