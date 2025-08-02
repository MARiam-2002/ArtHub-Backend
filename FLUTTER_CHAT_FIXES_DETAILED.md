# Flutter Chat Real-Time Messaging Fix

## المشكلة
الرسائل المرسلة تظهر في الواجهة، لكن الرسائل الواردة لا تظهر رغم أن الـ Socket يعمل بشكل صحيح.

## السبب
الفلاتر يحاول إرسال الرسائل عبر Socket، لكن الباك إند يتوقع أن تُرسل الرسائل عبر HTTP API.

## الحل

### 1. تحديث ChatCubit في الفلاتر

```dart
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

### 2. تحديث ChatService في الفلاتر

```dart
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
      _socket!.emit('join_chat', {'chatId': chatId, 'userId': _currentUserId});
      print('👥 Joined chat room: $chatId');
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

### 3. تحديث UserChatScreen

```dart
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
    // Join chat room for real-time updates
    ChatService.instance.joinChat(widget.chatId);

    // Load messages via HTTP API
    await _loadMessages();

    // Mark messages as read
    ChatService.instance.markMessagesAsRead(widget.chatId);
  }

  Future<void> _loadMessages() async {
    try {
      final token = await SecureStorage().getAccessToken();
      if (token != null) {
        await context.read<ChatCubit>().getChatMessages(widget.chatId);
        setState(() {
          isLoading = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      print('Error loading messages: $e');
      setState(() {
        isLoading = false;
      });
    }
  }

  void _sendMessage() {
    final content = _messageController.text.trim();
    if (content.isEmpty) return;

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

  // ... rest of the widget code remains the same
}
```

### 4. تحديث API Constants

تأكد من أن `ApiConstant.sendMessages` يستخدم HTTP API:

```dart
class ApiConstant {
  static const String baseUrl = 'https://your-api-url.com/api';
  
  // Chat endpoints
  static const String chat = '$baseUrl/chat';
  static const String createChat = '$baseUrl/chat/create';
  static String chatMessages(String chatId) => '$baseUrl/chat/$chatId/messages';
  static String sendMessages(String chatId) => '$baseUrl/chat/$chatId/send';
  
  // Socket URL
  static const String socketUrl = 'https://your-api-url.com';
}
```

## النقاط المهمة

1. **إرسال الرسائل**: استخدم HTTP API فقط لإرسال الرسائل
2. **استقبال الرسائل**: استخدم Socket.IO لاستقبال الرسائل في الوقت الفعلي
3. **التوافق**: تأكد من أن تنسيق الرسائل متوافق بين الباك إند والفلاتر
4. **التصحيح**: أضف console.log للتأكد من أن الرسائل تُرسل وتُستقبل بشكل صحيح

## اختبار الحل

1. أرسل رسالة من تطبيق الفلاتر
2. تحقق من أن الرسالة تظهر في الواجهة فوراً
3. أرسل رسالة من تطبيق آخر أو من الباك إند
4. تحقق من أن الرسالة تظهر في الفلاتر عبر Socket

هذا الحل سيضمن أن الرسائل تُرسل عبر HTTP API وتُستقبل عبر Socket.IO في الوقت الفعلي. 