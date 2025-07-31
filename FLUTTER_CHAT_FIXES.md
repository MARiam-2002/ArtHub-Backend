# 🔧 إصلاحات مطلوبة للشات في Flutter

## 1️⃣ **تحديث ChatService**

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
  bool get isConnected => _isConnected;

  // Initialize Socket Connection
  void initSocket(String userId, String token) {
    _currentUserId = userId;

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

    // ✅ تصحيح أسماء الـ events
    _socket!.on('newMessage', (data) {
      print('📨 New Message Received: $data');
      _handleNewMessage(data);
    });

    _socket!.on('messagesRead', (data) {
      _handleMessagesRead(data);
    });

    _socket!.on('user_typing', (data) {
      _handleUserTyping(data);
    });

    _socket!.on('user_stopped_typing', (data) {
      _handleUserStoppedTyping(data);
    });
  }

  void _authenticateUser() {
    if (_currentUserId != null) {
      _socket!.emit('authenticate', {'userId': _currentUserId});
    }
  }

  // Join Chat Room
  void joinChat(String chatId) {
    if (_isConnected && _currentUserId != null) {
      print('🏠 Joining chat: $chatId');
      _socket!.emit('join_chat', {'chatId': chatId, 'userId': _currentUserId});
    }
  }

  // ✅ تصحيح Send Message
  void sendMessage(String chatId, String content, String receiverId) {
    if (_isConnected && _currentUserId != null) {
      print('📤 Sending message to chat: $chatId');
      _socket!.emit('sendMessage', {
        'chatId': chatId,
        'content': content,
        'senderId': _currentUserId,
        'receiverId': receiverId,
      });
    } else {
      print('❌ Cannot send message: Socket not connected or user not authenticated');
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

  // Event Handlers
  void _handleNewMessage(dynamic data) {
    print('📨 Processing new message: $data');
    try {
      getIt<ChatCubit>().handleIncomingMessage(data);
    } catch (e) {
      print('❌ Error handling new message: $e');
    }
  }

  void _handleMessagesRead(dynamic data) {
    print('👁️ Messages Read: $data');
  }

  void _handleUserTyping(dynamic data) {
    print('⌨️ User Typing: $data');
  }

  void _handleUserStoppedTyping(dynamic data) {
    print('⌨️ User Stopped Typing: $data');
  }

  // Disconnect
  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _isConnected = false;
    _currentUserId = null;
  }
}
```

## 2️⃣ **تحديث UserChatScreen**

```dart
class _UserChatScreenState extends State<UserChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  void _initializeChat() async {
    // ✅ تأكد من تهيئة الـ socket أولاً
    final token = await SecureStorage().getAccessToken();
    final userId = await SecureStorage().getUserId(); // تأكد من وجود هذه الدالة
    
    if (token != null && userId != null) {
      // Initialize socket if not already connected
      if (!ChatService.instance.isConnected) {
        ChatService.instance.initSocket(userId, token);
        
        // Wait a bit for connection
        await Future.delayed(Duration(seconds: 2));
      }
      
      // Join chat room
      ChatService.instance.joinChat(widget.chatId);
      
      // Load messages
      context.read<ChatCubit>().getChatMessages(widget.chatId);
      
      // Mark messages as read
      ChatService.instance.markMessagesAsRead(widget.chatId);
    }
  }

  void _sendMessage() {
    if (_messageController.text.trim().isEmpty) return;

    final content = _messageController.text.trim();
    
    // ✅ إرسال عبر Socket
    ChatService.instance.sendMessage(widget.chatId, content, widget.receiverId);
    
    _messageController.clear();
    
    // ✅ Scroll to bottom after sending
    Future.delayed(Duration(milliseconds: 100), () {
      _scrollToBottom();
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
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
            // Header (keep existing)
            _buildHeader(),
            
            Expanded(
              child: Column(
                children: [
                  Text(
                    "Today 04:00 PM",
                    style: TextStyles.font14SpanishGrayw300Almarai(context)
                        .copyWith(fontWeight: FontWeight.w600),
                  ),
                  verticalSpacing(18.h(context)),
                  
                  // Request info container (keep existing)
                  _buildRequestInfo(),
                  
                  verticalSpacing(15.h(context)),
                  
                  // ✅ Messages list
                  Expanded(
                    child: BlocBuilder<ChatCubit, ChatState>(
                      builder: (context, state) {
                        if (state is ChatLoaded) {
                          final messages = state.messages;
                          return ListView.builder(
                            controller: _scrollController,
                            padding: EdgeInsets.only(top: 20.h(context)),
                            itemCount: messages.length,
                            itemBuilder: (context, index) {
                              final msg = messages[index];
                              final isSender = msg.sender?.id == ChatService.instance.currentUserId;
                              
                              return isSender
                                  ? SenderItem(messageText: msg.content ?? '')
                                  : RecieverItem(messageText: msg.content ?? '');
                            },
                          );
                        } else if (state is ChatLoading) {
                          return const Center(child: CircularProgressIndicator());
                        } else {
                          return const Center(child: Text("لا توجد رسائل"));
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
            
            // ✅ Message input
            _buildMessageInput(),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageInput() {
    return TextFormField(
      controller: _messageController,
      onFieldSubmitted: (_) => _sendMessage(), // ✅ إرسال بالضغط على Enter
      decoration: InputDecoration(
        filled: true,
        fillColor: const Color(0x19A8C5DA),
        hintText: "اكتب رسالتك هنا...",
        hintStyle: TextStyles.font12SpanishGrayw400Almarai(context)
            .copyWith(fontSize: 16),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(42),
          borderSide: BorderSide(color: ColorsManagers.ceil, width: 1.0),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(42),
          borderSide: BorderSide(color: ColorsManagers.ceil, width: 1.0),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(42),
          borderSide: BorderSide(color: ColorsManagers.ceil, width: 1.0),
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
              onTap: _sendMessage, // ✅ استخدام الدالة المحدثة
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
    );
  }
}
```

## 3️⃣ **تحديث ChatCubit**

```dart
class ChatCubit extends Cubit<ChatState> {
  ChatCubit() : super(ChatInitial());
  List<Message> _messages = [];

  List<Message> get messages => _messages;
  final StreamController<Message> _incomingMessageController =
      StreamController.broadcast();
  Stream<Message> get incomingMessages => _incomingMessageController.stream;

  DioHelper dio = DioHelper();

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
    } catch (error) {
      String message = "An error occurred";
      if (error is DioException) {
        message = error.response?.data['message'] ?? message;
      }
      emit(ChatError(message));
    }
  }

  Future<List<Message>> getChatMessages(String chatId) async {
    emit(ChatLoading());
    try {
      final token = await SecureStorage().getAccessToken();
      // ✅ تأكد من URL صحيح
      final response = await dio.fetchData(
        url: '${ApiConstant.chat}/$chatId/messages', // ✅ إضافة /messages
        token: token,
      );
      
      if (response.statusCode == 200) {
        final chatMessagesWrapper = ChatMessagesModel.fromJson(response.data);
        final List<Message> messages = chatMessagesWrapper.data?.messages ?? [];
        
        _messages = messages;
        emit(ChatLoaded(_messages));
        return _messages;
      } else {
        emit(ChatError(response.data['message'] ?? "Failed to load chat messages"));
        return [];
      }
    } catch (error) {
      String message = "An error occurred loading messages";
      if (error is DioException) {
        message = error.response?.data['message'] ?? message;
      }
      print('❌ Error loading messages: $error');
      emit(ChatError(message));
      return <Message>[];
    }
  }

  // ✅ تحسين handleIncomingMessage
  void handleIncomingMessage(dynamic data) {
    try {
      print('📨 Handling incoming message: $data');
      final message = Message.fromJson(data);
      
      // تأكد من أن الرسالة ليست مكررة
      if (!_messages.any((m) => m.id == message.id)) {
        _messages.add(message);
        emit(ChatLoaded(List.from(_messages)));
        _incomingMessageController.add(message);
      }
    } catch (e) {
      print('❌ Error parsing incoming message: $e');
    }
  }

  @override
  Future<void> close() {
    _incomingMessageController.close();
    return super.close();
  }
}
```

## 4️⃣ **إضافة getUserId للـ SecureStorage**

```dart
// في SecureStorage class
Future<String?> getUserId() async {
  try {
    return await _storage.read(key: 'user_id');
  } catch (e) {
    print('Error reading user ID: $e');
    return null;
  }
}

Future<void> saveUserId(String userId) async {
  try {
    await _storage.write(key: 'user_id', value: userId);
  } catch (e) {
    print('Error saving user ID: $e');
  }
}
```

## 5️⃣ **تحديث ApiConstant**

```dart
class ApiConstant {
  static const String baseUrl = 'https://arthub-backend.up.railway.app';
  static const String socketUrl = 'https://arthub-backend.up.railway.app';
  
  // ✅ تأكد من الـ endpoints
  static const String chat = '/api/chat';
  static const String createChat = '/api/chat';
}
```

## 6️⃣ **تهيئة Socket في MainScreen**

```dart
// في MainScreen أو App initialization
class _MainScreenState extends State<MainScreen> {
  @override
  void initState() {
    super.initState();
    _initializeSocket();
  }

  void _initializeSocket() async {
    final token = await SecureStorage().getAccessToken();
    final userId = await SecureStorage().getUserId();
    
    if (token != null && userId != null) {
      ChatService.instance.initSocket(userId, token);
    }
  }
}
```

## 🚀 **خطوات التشغيل:**

1. **تطبيق التحديثات أعلاه**
2. **تأكد من حفظ userId عند تسجيل الدخول**
3. **اختبار الاتصال بالـ Socket**
4. **اختبار إرسال واستقبال الرسائل**

## 🔍 **Debug Tips:**

```dart
// إضافة هذا للتأكد من الاتصال
void debugSocketConnection() {
  print('Socket Connected: ${ChatService.instance.isConnected}');
  print('Current User ID: ${ChatService.instance.currentUserId}');
}
```