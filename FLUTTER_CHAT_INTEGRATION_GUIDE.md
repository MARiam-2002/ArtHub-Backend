# 💬 ArtHub Chat Integration Guide for Flutter

## 🚀 **Quick Setup**

### 1️⃣ **Add Dependencies**
```yaml
# pubspec.yaml
dependencies:
  socket_io_client: ^2.0.3+1
  http: ^1.1.0
  dio: ^5.3.2
  file_picker: ^6.1.1
  image_picker: ^1.0.4
  permission_handler: ^11.0.1
  path: ^1.8.3
  record: ^4.4.4  # للتسجيل الصوتي
  audioplayers: ^5.2.1  # لتشغيل الصوت
  shared_preferences: ^2.2.2  # لحفظ البيانات محلياً
  video_player: ^2.8.1  # لتشغيل الفيديو
  path_provider: ^2.1.1  # للوصول لمجلدات النظام
```

### 2️⃣ **Server Configuration**
```dart
// Base URL
const String BASE_URL = 'https://arthub-backend.up.railway.app';
const String SOCKET_URL = 'https://arthub-backend.up.railway.app';
```

---

## 🔌 **Socket.IO Connection**

### **ChatService Class:**
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  static ChatService? _instance;
  static ChatService get instance => _instance ??= ChatService._internal();
  ChatService._internal();

  IO.Socket? _socket;
  bool _isConnected = false;
  String? _currentUserId;

  // Initialize Socket Connection
  void initSocket(String userId, String token) {
    _currentUserId = userId;
    
    _socket = IO.io(SOCKET_URL, <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': false,
      'extraHeaders': {
        'Authorization': 'Bearer $token',
      },
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

    // Chat Events
    _socket!.on('new_message', (data) {
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
      _socket!.emit('authenticate', {
        'userId': _currentUserId,
      });
    }
  }

  // Join Chat Room
  void joinChat(String chatId) {
    if (_isConnected && _currentUserId != null) {
      _socket!.emit('join_chat', {
        'chatId': chatId,
        'userId': _currentUserId,
      });
    }
  }

  // Send Message
  void sendMessage(String chatId, String content, String receiverId) {
    if (_isConnected && _currentUserId != null) {
      _socket!.emit('send_message', {
        'chatId': chatId,
        'content': content,
        'senderId': _currentUserId,
        'receiverId': receiverId,
      });
    }
  }

  // Typing Indicators
  void startTyping(String chatId) {
    if (_isConnected && _currentUserId != null) {
      _socket!.emit('typing', {
        'chatId': chatId,
        'userId': _currentUserId,
      });
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
      _socket!.emit('mark_read', {
        'chatId': chatId,
        'userId': _currentUserId,
      });
    }
  }

  // Event Handlers
  void _handleNewMessage(dynamic data) {
    // Update UI with new message
    // You can use StreamController or Provider to notify UI
    print('📨 New Message: $data');
  }

  void _handleMessagesRead(dynamic data) {
    // Update read status in UI
    print('👁️ Messages Read: $data');
  }

  void _handleUserTyping(dynamic data) {
    // Show typing indicator
    print('⌨️ User Typing: $data');
  }

  void _handleUserStoppedTyping(dynamic data) {
    // Hide typing indicator
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

---

## 📡 **REST API Integration**

### **Chat API Service:**
```dart
import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:dio/dio.dart';
import 'package:path/path.dart' as path;

class ChatApiService {
  static const String baseUrl = 'https://arthub-backend.up.railway.app/api';

  // Get User Chats
  static Future<List<dynamic>> getUserChats(String token) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data']['chats'] ?? [];
      }
      throw Exception('Failed to load chats');
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  // Get Chat Messages
  static Future<List<dynamic>> getChatMessages(String chatId, String token, {int page = 1}) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/chat/$chatId/messages?page=$page&limit=50'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data']['messages'] ?? [];
      }
      throw Exception('Failed to load messages');
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  // Create New Chat
  static Future<Map<String, dynamic>> createChat(String receiverId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'receiver': receiverId,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final data = json.decode(response.body);
        return data['data'];
      }
      throw Exception('Failed to create chat');
    } catch (e) {
      throw Exception('Error: $e');
    }
  }

  // Send Message with Files
  static Future<Map<String, dynamic>> sendMessageWithFiles({
    required String chatId,
    required String token,
    String? content,
    List<File>? files,
    String messageType = 'text',
    String? replyTo,
  }) async {
    try {
      final dio = Dio();
      
      FormData formData = FormData();
      
      // Add text content if provided
      if (content != null && content.isNotEmpty) {
        formData.fields.add(MapEntry('content', content));
      }
      
      // Add message type
      formData.fields.add(MapEntry('messageType', messageType));
      
      // Add reply to if provided
      if (replyTo != null) {
        formData.fields.add(MapEntry('replyTo', replyTo));
      }
      
      // Add files if provided
      if (files != null && files.isNotEmpty) {
        for (int i = 0; i < files.length; i++) {
          final file = files[i];
          final fileName = path.basename(file.path);
          
          formData.files.add(MapEntry(
            'files',
            await MultipartFile.fromFile(
              file.path,
              filename: fileName,
            ),
          ));
        }
      }
      
      final response = await dio.post(
        '$baseUrl/chat/$chatId/send',
        data: formData,
        options: Options(
          headers: {
            'Authorization': 'Bearer $token',
          },
        ),
      );
      
      if (response.statusCode == 200) {
        return response.data;
      }
      throw Exception('Failed to send message');
    } catch (e) {
      throw Exception('Error sending message: $e');
    }
  }

  // Send Text Message (Simple version)
  static Future<Map<String, dynamic>> sendTextMessage({
    required String chatId,
    required String token,
    required String content,
    String? replyTo,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/chat/$chatId/send'),
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: json.encode({
          'content': content,
          'messageType': 'text',
          if (replyTo != null) 'replyTo': replyTo,
        }),
      );

      if (response.statusCode == 200) {
        return json.decode(response.body);
      }
      throw Exception('Failed to send message');
    } catch (e) {
      throw Exception('Error: $e');
    }
  }
}
```

---

## 🎨 **UI Implementation Example**

### **Chat Screen with File Upload & Voice Recording:**
```dart
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:record/record.dart';
import 'package:audioplayers/audioplayers.dart';

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
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final ImagePicker _imagePicker = ImagePicker();
  final Record _audioRecorder = Record();
  final AudioPlayer _audioPlayer = AudioPlayer();
  
  List<dynamic> messages = [];
  bool isLoading = true;
  bool isSending = false;
  List<File> selectedFiles = [];
  
  // Voice Recording State
  bool isRecording = false;
  bool isPlaying = false;
  String? recordingPath;
  Duration recordingDuration = Duration.zero;
  Timer? recordingTimer;

  @override
  void initState() {
    super.initState();
    _initializeChat();
  }

  void _initializeChat() async {
    // Join chat room
    ChatService.instance.joinChat(widget.chatId);
    
    // Load messages
    await _loadMessages();
    
    // Mark messages as read
    ChatService.instance.markMessagesAsRead(widget.chatId);
  }

  Future<void> _loadMessages() async {
    try {
      // Get token from storage
      String? token = await getTokenFromStorage();
      if (token != null) {
        final loadedMessages = await ChatApiService.getChatMessages(
          widget.chatId, 
          token
        );
        setState(() {
          messages = loadedMessages.reversed.toList();
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

  void _sendMessage() async {
    final content = _messageController.text.trim();
    
    // Check if we have content or files
    if (content.isEmpty && selectedFiles.isEmpty) return;
    
    setState(() {
      isSending = true;
    });

    try {
      String? token = await getTokenFromStorage();
      if (token != null) {
        if (selectedFiles.isNotEmpty) {
          // Send message with files
          await ChatApiService.sendMessageWithFiles(
            chatId: widget.chatId,
            token: token,
            content: content.isNotEmpty ? content : null,
            files: selectedFiles,
            messageType: _getMessageType(selectedFiles.first),
          );
        } else {
          // Send text message only
          await ChatApiService.sendTextMessage(
            chatId: widget.chatId,
            token: token,
            content: content,
          );
        }
        
        // Clear input and files
        _messageController.clear();
        setState(() {
          selectedFiles.clear();
        });
        
        // Reload messages to show the new one
        await _loadMessages();
      }
    } catch (e) {
      print('Error sending message: $e');
      // Show error to user
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('فشل في إرسال الرسالة: $e')),
      );
    } finally {
      setState(() {
        isSending = false;
      });
    }
  }

  String _getMessageType(File file) {
    final extension = path.extension(file.path).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].contains(extension)) {
      return 'image';
    } else if (['.mp3', '.wav', '.aac', '.m4a'].contains(extension)) {
      return 'voice';
    } else if (['.mp4', '.avi', '.mov', '.mkv'].contains(extension)) {
      return 'video';
    } else {
      return 'file';
    }
  }

  // File Selection Methods
  Future<void> _pickImage() async {
    try {
      final permission = await Permission.photos.request();
      if (permission.isGranted) {
        final XFile? image = await _imagePicker.pickImage(
          source: ImageSource.gallery,
          imageQuality: 80,
        );
        if (image != null) {
          setState(() {
            selectedFiles.add(File(image.path));
          });
        }
      }
    } catch (e) {
      print('Error picking image: $e');
    }
  }

  Future<void> _takePhoto() async {
    try {
      final permission = await Permission.camera.request();
      if (permission.isGranted) {
        final XFile? image = await _imagePicker.pickImage(
          source: ImageSource.camera,
          imageQuality: 80,
        );
        if (image != null) {
          setState(() {
            selectedFiles.add(File(image.path));
          });
        }
      }
    } catch (e) {
      print('Error taking photo: $e');
    }
  }

  Future<void> _pickFile() async {
    try {
      FilePickerResult? result = await FilePicker.platform.pickFiles(
        type: FileType.any,
        allowMultiple: false,
      );

      if (result != null && result.files.single.path != null) {
        setState(() {
          selectedFiles.add(File(result.files.single.path!));
        });
      }
    } catch (e) {
      print('Error picking file: $e');
    }
  }

  void _removeFile(int index) {
    setState(() {
      selectedFiles.removeAt(index);
    });
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      builder: (BuildContext context) {
        return Container(
          padding: EdgeInsets.all(16),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(Icons.photo_library, color: Colors.blue),
                title: Text('اختيار صورة'),
                onTap: () {
                  Navigator.pop(context);
                  _pickImage();
                },
              ),
              ListTile(
                leading: Icon(Icons.camera_alt, color: Colors.green),
                title: Text('التقاط صورة'),
                onTap: () {
                  Navigator.pop(context);
                  _takePhoto();
                },
              ),
              ListTile(
                leading: Icon(Icons.mic, color: Colors.red),
                title: Text('تسجيل صوتي'),
                onTap: () {
                  Navigator.pop(context);
                  _showVoiceRecordingDialog();
                },
              ),
              ListTile(
                leading: Icon(Icons.attach_file, color: Colors.orange),
                title: Text('اختيار ملف'),
                onTap: () {
                  Navigator.pop(context);
                  _pickFile();
                },
              ),
            ],
          ),
        );
      },
    );
  }

  // Voice Recording Methods
  Future<void> _startRecording() async {
    try {
      final permission = await Permission.microphone.request();
      if (permission.isGranted) {
        final directory = await getTemporaryDirectory();
        final fileName = 'voice_message_${DateTime.now().millisecondsSinceEpoch}.m4a';
        recordingPath = '${directory.path}/$fileName';
        
        await _audioRecorder.start(
          path: recordingPath!,
          encoder: AudioEncoder.aacLc,
          bitRate: 128000,
          samplingRate: 44100,
        );
        
        setState(() {
          isRecording = true;
          recordingDuration = Duration.zero;
        });
        
        // Start timer
        recordingTimer = Timer.periodic(Duration(seconds: 1), (timer) {
          setState(() {
            recordingDuration = Duration(seconds: timer.tick);
          });
        });
      }
    } catch (e) {
      print('Error starting recording: $e');
    }
  }

  Future<void> _stopRecording() async {
    try {
      await _audioRecorder.stop();
      recordingTimer?.cancel();
      
      setState(() {
        isRecording = false;
      });
      
      if (recordingPath != null) {
        final file = File(recordingPath!);
        if (await file.exists()) {
          setState(() {
            selectedFiles.add(file);
          });
        }
      }
    } catch (e) {
      print('Error stopping recording: $e');
    }
  }

  void _showVoiceRecordingDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (BuildContext context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: Text('تسجيل رسالة صوتية'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    isRecording ? Icons.mic : Icons.mic_none,
                    size: 64,
                    color: isRecording ? Colors.red : Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    isRecording 
                        ? '${recordingDuration.inMinutes}:${(recordingDuration.inSeconds % 60).toString().padLeft(2, '0')}'
                        : 'اضغط لبدء التسجيل',
                    style: TextStyle(fontSize: 18),
                  ),
                  SizedBox(height: 16),
                  if (isRecording)
                    LinearProgressIndicator(
                      backgroundColor: Colors.grey[300],
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.red),
                    ),
                ],
              ),
              actions: [
                if (!isRecording)
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    child: Text('إلغاء'),
                  ),
                ElevatedButton(
                  onPressed: () async {
                    if (isRecording) {
                      await _stopRecording();
                      Navigator.pop(context);
                    } else {
                      await _startRecording();
                      setDialogState(() {});
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: isRecording ? Colors.red : Colors.blue,
                  ),
                  child: Text(isRecording ? 'إيقاف التسجيل' : 'بدء التسجيل'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  void dispose() {
    _audioRecorder.dispose();
    _audioPlayer.dispose();
    recordingTimer?.cancel();
    super.dispose();
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
      appBar: AppBar(
        title: Text(widget.receiverName),
        backgroundColor: Colors.blue,
      ),
      body: Column(
        children: [
          // Messages List
          Expanded(
            child: isLoading
                ? Center(child: CircularProgressIndicator())
                : ListView.builder(
                    controller: _scrollController,
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final message = messages[index];
                      final isMe = message['sender']['_id'] == getCurrentUserId();
                      
                      return _buildMessageBubble(message, isMe);
                    },
                  ),
          ),
          
          // Message Input
          Container(
            padding: EdgeInsets.all(8.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.grey.withOpacity(0.2),
                  spreadRadius: 1,
                  blurRadius: 3,
                ),
              ],
            ),
            child: Column(
              children: [
                // File Preview Section
                if (selectedFiles.isNotEmpty)
                  Container(
                    height: 100,
                    padding: EdgeInsets.all(8),
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: selectedFiles.length,
                      itemBuilder: (context, index) {
                        final file = selectedFiles[index];
                        final fileName = path.basename(file.path);
                        final isImage = _getMessageType(file) == 'image';
                        
                        return Container(
                          width: 80,
                          height: 80,
                          margin: EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey),
                          ),
                          child: Stack(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: isImage
                                    ? Image.file(
                                        file,
                                        width: 80,
                                        height: 80,
                                        fit: BoxFit.cover,
                                      )
                                    : Container(
                                        width: 80,
                                        height: 80,
                                        color: Colors.grey[200],
                                        child: Column(
                                          mainAxisAlignment: MainAxisAlignment.center,
                                          children: [
                                            Icon(
                                              _getFileIcon(file),
                                              size: 24,
                                              color: Colors.grey[600],
                                            ),
                                            SizedBox(height: 4),
                                            Text(
                                              fileName.length > 8
                                                  ? '${fileName.substring(0, 8)}...'
                                                  : fileName,
                                              style: TextStyle(
                                                fontSize: 10,
                                                color: Colors.grey[600],
                                              ),
                                              textAlign: TextAlign.center,
                                            ),
                                          ],
                                        ),
                                      ),
                              ),
                              Positioned(
                                top: 2,
                                right: 2,
                                child: GestureDetector(
                                  onTap: () => _removeFile(index),
                                  child: Container(
                                    width: 20,
                                    height: 20,
                                    decoration: BoxDecoration(
                                      color: Colors.red,
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      Icons.close,
                                      size: 14,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                
                // Message Input Row
                Row(
                  children: [
                    // Attachment Button
                    IconButton(
                      onPressed: _showAttachmentOptions,
                      icon: Icon(Icons.attach_file, color: Colors.grey[600]),
                    ),
                    
                    // Text Input
                    Expanded(
                      child: TextField(
                        controller: _messageController,
                        decoration: InputDecoration(
                          hintText: 'اكتب رسالتك هنا...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(25),
                            borderSide: BorderSide(color: Colors.grey[300]!),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(25),
                            borderSide: BorderSide(color: Colors.grey[300]!),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(25),
                            borderSide: BorderSide(color: Colors.blue),
                          ),
                          contentPadding: EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                        ),
                        maxLines: null,
                        textInputAction: TextInputAction.newline,
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    
                    SizedBox(width: 8),
                    
                    // Send Button
                    FloatingActionButton(
                      mini: true,
                      onPressed: isSending ? null : _sendMessage,
                      backgroundColor: isSending ? Colors.grey : Colors.blue,
                      child: isSending
                          ? SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Icon(Icons.send, color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(dynamic message, bool isMe) {
    final hasAttachments = message['attachments'] != null && 
                          (message['attachments'] as List).isNotEmpty;
    final hasContent = message['content'] != null && 
                      message['content'].toString().isNotEmpty;
    
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 4, horizontal: 8),
        padding: EdgeInsets.all(12),
        constraints: BoxConstraints(maxWidth: 280),
        decoration: BoxDecoration(
          color: isMe ? Colors.blue : Colors.grey[300],
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Attachments
            if (hasAttachments) ...[
              ...((message['attachments'] as List).map((attachment) => 
                _buildAttachmentWidget(attachment, isMe))),
              if (hasContent) SizedBox(height: 8),
            ],
            
            // Text Content
            if (hasContent)
              Text(
                message['content'],
                style: TextStyle(
                  color: isMe ? Colors.white : Colors.black,
                  fontSize: 16,
                ),
              ),
            
            SizedBox(height: 4),
            Text(
              _formatTime(message['sentAt']),
              style: TextStyle(
                color: isMe ? Colors.white70 : Colors.grey[600],
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAttachmentWidget(dynamic attachment, bool isMe) {
    final type = attachment['type'] ?? 'file';
    final url = attachment['url'] ?? '';
    final name = attachment['name'] ?? 'ملف';
    
    switch (type) {
      case 'image':
        return ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            url,
            width: 200,
            height: 150,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              width: 200,
              height: 150,
              color: Colors.grey[300],
              child: Icon(Icons.broken_image, size: 50),
            ),
          ),
        );
      
      case 'voice':
        return Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isMe ? Colors.blue[700] : Colors.grey[400],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              GestureDetector(
                onTap: () => _playVoiceMessage(url),
                child: Icon(
                  isPlaying ? Icons.pause : Icons.play_arrow,
                  color: isMe ? Colors.white : Colors.black,
                ),
              ),
              SizedBox(width: 8),
              Text(
                'رسالة صوتية',
                style: TextStyle(
                  color: isMe ? Colors.white : Colors.black,
                ),
              ),
              SizedBox(width: 8),
              if (attachment['duration'] != null)
                Text(
                  '${(attachment['duration'] ~/ 60)}:${(attachment['duration'] % 60).toString().padLeft(2, '0')}',
                  style: TextStyle(
                    color: isMe ? Colors.white70 : Colors.black54,
                    fontSize: 12,
                  ),
                ),
            ],
          ),
        );
      
      case 'video':
        return Container(
          width: 200,
          height: 150,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              Image.network(
                url,
                width: 200,
                height: 150,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => Container(
                  color: Colors.grey[800],
                  child: Icon(Icons.videocam, size: 50, color: Colors.white),
                ),
              ),
              Container(
                padding: EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 30,
                ),
              ),
            ],
          ),
        );
      
      default: // file
        return Container(
          padding: EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: isMe ? Colors.blue[700] : Colors.grey[400],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.insert_drive_file,
                color: isMe ? Colors.white : Colors.black,
              ),
              SizedBox(width: 8),
              Flexible(
                child: Text(
                  name,
                  style: TextStyle(
                    color: isMe ? Colors.white : Colors.black,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        );
    }
  }

  IconData _getFileIcon(File file) {
    final extension = path.extension(file.path).toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].contains(extension)) {
      return Icons.image;
    } else if (['.mp3', '.wav', '.aac', '.m4a'].contains(extension)) {
      return Icons.audiotrack;
    } else if (['.mp4', '.avi', '.mov', '.mkv'].contains(extension)) {
      return Icons.videocam;
    } else if (['.pdf'].contains(extension)) {
      return Icons.picture_as_pdf;
    } else if (['.doc', '.docx'].contains(extension)) {
      return Icons.description;
    } else {
      return Icons.insert_drive_file;
    }
  }

  // Voice Message Playback
  Future<void> _playVoiceMessage(String url) async {
    try {
      if (isPlaying) {
        await _audioPlayer.stop();
        setState(() {
          isPlaying = false;
        });
      } else {
        await _audioPlayer.play(UrlSource(url));
        setState(() {
          isPlaying = true;
        });
        
        // Listen for completion
        _audioPlayer.onPlayerComplete.listen((_) {
          setState(() {
            isPlaying = false;
          });
        });
      }
    } catch (e) {
      print('Error playing voice message: $e');
    }
  }

  String _formatTime(String? timestamp) {
    if (timestamp == null) return '';
    final date = DateTime.parse(timestamp);
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }
}
```

---

## 🔐 **Authentication Helper**

```dart
import 'package:shared_preferences/shared_preferences.dart';

// Token storage helper
Future<String?> getTokenFromStorage() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  } catch (e) {
    print('Error getting token: $e');
    return null;
  }
}

Future<String?> getCurrentUserId() async {
  try {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('user_id');
  } catch (e) {
    print('Error getting user ID: $e');
    return null;
  }
}

// Save user data after login
Future<void> saveUserData(String token, String userId) async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.setString('auth_token', token);
  await prefs.setString('user_id', userId);
}

// Clear user data on logout
Future<void> clearUserData() async {
  final prefs = await SharedPreferences.getInstance();
  await prefs.remove('auth_token');
  await prefs.remove('user_id');
}
```

---

## 🎯 **Permissions Setup**

### **Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MICROPHONE" />
```

### **iOS (ios/Runner/Info.plist):**
```xml
<key>NSCameraUsageDescription</key>
<string>يحتاج التطبيق للوصول للكاميرا لالتقاط الصور</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>يحتاج التطبيق للوصول لمعرض الصور لاختيار الصور</string>
<key>NSMicrophoneUsageDescription</key>
<string>يحتاج التطبيق للوصول للميكروفون لتسجيل الرسائل الصوتية</string>
```

---

## 📱 **Usage Example**

```dart
void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: ChatListScreen(),
    );
  }
}

class ChatListScreen extends StatefulWidget {
  @override
  _ChatListScreenState createState() => _ChatListScreenState();
}

class _ChatListScreenState extends State<ChatListScreen> {
  @override
  void initState() {
    super.initState();
    _initializeSocket();
  }

  void _initializeSocket() async {
    String? token = await getTokenFromStorage();
    String? userId = getCurrentUserId();
    
    if (token != null && userId != null) {
      ChatService.instance.initSocket(userId, token);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('الرسائل')),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => ChatScreen(
                  chatId: 'chat_id_here',
                  receiverId: 'receiver_id_here',
                  receiverName: 'مريم فوزي',
                ),
              ),
            );
          },
          child: Text('فتح المحادثة'),
        ),
      ),
    );
  }
}
```

---

## 🎬 **Video Player Screen**

```dart
import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

class VideoPlayerScreen extends StatefulWidget {
  final String videoUrl;

  const VideoPlayerScreen({Key? key, required this.videoUrl}) : super(key: key);

  @override
  _VideoPlayerScreenState createState() => _VideoPlayerScreenState();
}

class _VideoPlayerScreenState extends State<VideoPlayerScreen> {
  late VideoPlayerController _controller;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    _initializeVideo();
  }

  void _initializeVideo() async {
    _controller = VideoPlayerController.network(widget.videoUrl);
    try {
      await _controller.initialize();
      setState(() {
        _isInitialized = true;
      });
      _controller.play();
    } catch (e) {
      print('Error initializing video: $e');
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        iconTheme: IconThemeData(color: Colors.white),
        title: Text('تشغيل الفيديو', style: TextStyle(color: Colors.white)),
      ),
      body: Center(
        child: _isInitialized
            ? AspectRatio(
                aspectRatio: _controller.value.aspectRatio,
                child: Stack(
                  children: [
                    VideoPlayer(_controller),
                    Positioned(
                      bottom: 20,
                      left: 20,
                      right: 20,
                      child: VideoProgressIndicator(
                        _controller,
                        allowScrubbing: true,
                        colors: VideoProgressColors(
                          playedColor: Colors.blue,
                          backgroundColor: Colors.grey,
                        ),
                      ),
                    ),
                    Center(
                      child: GestureDetector(
                        onTap: () {
                          setState(() {
                            _controller.value.isPlaying
                                ? _controller.pause()
                                : _controller.play();
                          });
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.black54,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            _controller.value.isPlaying
                                ? Icons.pause
                                : Icons.play_arrow,
                            color: Colors.white,
                            size: 50,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              )
            : CircularProgressIndicator(color: Colors.white),
      ),
    );
  }
}
```

---

## 🔄 **Auto-Scroll & Typing Indicator**

```dart
// إضافة للـ ChatScreen class
class _ChatScreenState extends State<ChatScreen> {
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;
  bool _otherUserTyping = false;
  Timer? _typingTimer;

  // Auto-scroll عند وصول رسالة جديدة
  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  // مؤشر الكتابة
  void _handleTyping() {
    if (!_isTyping) {
      setState(() => _isTyping = true);
      socket.emit('typing', {'chatId': widget.chatId, 'userId': currentUserId});
    }
    
    // إلغاء المؤشر بعد 3 ثوانٍ من التوقف عن الكتابة
    _typingTimer?.cancel();
    _typingTimer = Timer(Duration(seconds: 3), () {
      if (_isTyping) {
        setState(() => _isTyping = false);
        socket.emit('stop_typing', {'chatId': widget.chatId, 'userId': currentUserId});
      }
    });
  }

  @override
  void initState() {
    super.initState();
    
    // إضافة مستمع للكتابة
    socket.on('user_typing', (data) {
      if (data['userId'] != currentUserId) {
        setState(() {
          _otherUserTyping = true;
        });
        
        // إخفاء مؤشر الكتابة بعد 5 ثوانٍ
        Timer(Duration(seconds: 5), () {
          setState(() {
            _otherUserTyping = false;
          });
        });
      }
    });

    socket.on('user_stopped_typing', (data) {
      if (data['userId'] != currentUserId) {
        setState(() {
          _otherUserTyping = false;
        });
      }
    });

    // Auto-scroll عند وصول رسالة جديدة
    socket.on('newMessage', (data) {
      setState(() {
        messages.add(data);
        _otherUserTyping = false; // إخفاء مؤشر الكتابة عند وصول رسالة
      });
      
      // Auto-scroll بعد تأخير قصير للسماح للـ UI بالتحديث
      Future.delayed(Duration(milliseconds: 100), () {
        _scrollToBottom();
      });
    });
  }

  // تحديث TextField لإرسال مؤشر الكتابة
  Widget _buildMessageInput() {
    return TextField(
      controller: messageController,
      onChanged: (text) {
        if (text.isNotEmpty) {
          _handleTyping(); // إرسال مؤشر الكتابة
        }
      },
      decoration: InputDecoration(
        hintText: 'اكتب رسالتك...',
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(25),
          borderSide: BorderSide.none,
        ),
        filled: true,
        fillColor: Colors.grey[100],
      ),
    );
  }

  // مؤشر الكتابة في قائمة الرسائل
  Widget _buildTypingIndicator() {
    if (!_otherUserTyping) return SizedBox.shrink();
    
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: Colors.grey[200],
              borderRadius: BorderRadius.circular(18),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.grey),
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  'يكتب الآن...',
                  style: TextStyle(
                    color: Colors.grey[600],
                    fontSize: 12,
                    fontStyle: FontStyle.italic,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // تحديث قائمة الرسائل لإضافة مؤشر الكتابة
  Widget _buildMessagesList() {
    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            reverse: true,
            itemCount: messages.length,
            itemBuilder: (context, index) {
              final message = messages[messages.length - 1 - index];
              final isMe = message['sender']['_id'] == currentUserId;
              return _buildMessageBubble(message, isMe);
            },
          ),
        ),
        _buildTypingIndicator(), // مؤشر الكتابة في الأسفل
      ],
    );
  }
}
```

---

## 🛡️ **Security & Performance Tips**

### **أمان الملفات:**
```dart
// فحص نوع الملف قبل الرفع
bool _isValidFileType(File file) {
  final allowedExtensions = ['jpg', 'jpeg', 'png', 'pdf', 'mp4', 'mp3', 'wav', 'doc', 'docx'];
  final extension = path.extension(file.path).toLowerCase().substring(1);
  return allowedExtensions.contains(extension);
}

// فحص حجم الملف
bool _isValidFileSize(File file) {
  final maxSize = 10 * 1024 * 1024; // 10MB
  return file.lengthSync() <= maxSize;
}

// فحص نوع MIME للملف
bool _isValidMimeType(File file) {
  // يمكن استخدام mime package لفحص نوع الملف الحقيقي
  final allowedMimes = [
    'image/jpeg', 'image/png', 'image/gif',
    'audio/mpeg', 'audio/wav', 'audio/aac',
    'video/mp4', 'video/quicktime',
    'application/pdf', 'application/msword'
  ];
  
  // يجب فحص نوع الملف الحقيقي وليس فقط الامتداد
  return true; // مؤقتاً - يحتاج تطبيق حقيقي
}

// تشفير بسيط للرسائل الحساسة (اختياري)
import 'dart:convert';
import 'package:crypto/crypto.dart';

String hashMessage(String message) {
  var bytes = utf8.encode(message);
  var digest = sha256.convert(bytes);
  return digest.toString();
}
```

### **تحسين الأداء:**
```dart
// استخدام ListView.builder مع pagination للرسائل الكثيرة
class _ChatScreenState extends State<ChatScreen> {
  int currentPage = 1;
  bool isLoadingMore = false;
  bool hasMoreMessages = true;

  // تحميل الرسائل بالتدريج
  void _loadMoreMessages() async {
    if (isLoadingMore || !hasMoreMessages) return;
    
    setState(() => isLoadingMore = true);
    
    try {
      final olderMessages = await ChatApiService.getChatMessages(
        widget.chatId,
        await getTokenFromStorage(),
        page: currentPage + 1,
      );
      
      if (olderMessages.isEmpty) {
        setState(() => hasMoreMessages = false);
      } else {
        setState(() {
          messages.insertAll(0, olderMessages);
          currentPage++;
        });
      }
    } catch (e) {
      print('Error loading more messages: $e');
    } finally {
      setState(() => isLoadingMore = false);
    }
  }

  // تحسين ListView مع lazy loading
  Widget _buildOptimizedMessagesList() {
    return NotificationListener<ScrollNotification>(
      onNotification: (ScrollNotification scrollInfo) {
        // تحميل رسائل إضافية عند الوصول لأعلى القائمة
        if (scrollInfo.metrics.pixels == scrollInfo.metrics.maxScrollExtent) {
          _loadMoreMessages();
        }
        return false;
      },
      child: ListView.builder(
        controller: _scrollController,
        reverse: true,
        itemCount: messages.length + (isLoadingMore ? 1 : 0),
        itemBuilder: (context, index) {
          // مؤشر التحميل في الأعلى
          if (index == messages.length) {
            return Center(
              child: Padding(
                padding: EdgeInsets.all(16),
                child: CircularProgressIndicator(),
              ),
            );
          }
          
          final message = messages[messages.length - 1 - index];
          final isMe = message['sender']['_id'] == currentUserId;
          return _buildMessageBubble(message, isMe);
        },
      ),
    );
  }

  // تحسين الذاكرة بحذف الرسائل القديمة
  void _cleanupOldMessages() {
    const maxMessages = 500; // الحد الأقصى للرسائل في الذاكرة
    
    if (messages.length > maxMessages) {
      setState(() {
        messages = messages.sublist(messages.length - maxMessages);
      });
    }
  }
}
```

---

## 🎨 **Enhanced Reply UI**

```dart
// تحسين واجهة الرد على الرسائل
class _ChatScreenState extends State<ChatScreen> {
  Map<String, dynamic>? replyToMessage;

  Widget _buildReplyPreview() {
    if (replyToMessage == null) return SizedBox.shrink();
    
    return Container(
      padding: EdgeInsets.all(12),
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(8),
        border: Border(
          left: BorderSide(color: Colors.blue, width: 3),
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'رد على ${replyToMessage!['sender']['displayName']}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.blue,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 4),
                Text(
                  replyToMessage!['content'] ?? 'ملف مرفق',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          IconButton(
            icon: Icon(Icons.close, size: 20, color: Colors.grey),
            onPressed: () {
              setState(() {
                replyToMessage = null;
              });
            },
          ),
        ],
      ),
    );
  }

  // تحديث بناء الرسالة لإضافة خيار الرد
  Widget _buildMessageBubble(dynamic message, bool isMe) {
    return GestureDetector(
      onLongPress: () => _showMessageOptions(message),
      child: Container(
        margin: EdgeInsets.symmetric(vertical: 4, horizontal: 16),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // عرض الرسالة المردود عليها
            if (message['replyTo'] != null)
              _buildReplyReference(message['replyTo']),
            
            // الرسالة الأساسية
            Container(
              constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
              padding: EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isMe ? Colors.blue : Colors.grey[200],
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(16),
                  topRight: Radius.circular(16),
                  bottomLeft: isMe ? Radius.circular(16) : Radius.circular(4),
                  bottomRight: isMe ? Radius.circular(4) : Radius.circular(16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (message['content'] != null && message['content'].isNotEmpty)
                    Text(
                      message['content'],
                      style: TextStyle(
                        color: isMe ? Colors.white : Colors.black87,
                        fontSize: 16,
                      ),
                    ),
                  
                  // المرفقات
                  if (message['attachments'] != null && message['attachments'].isNotEmpty)
                    ...message['attachments'].map<Widget>((attachment) => 
                      Padding(
                        padding: EdgeInsets.only(top: 8),
                        child: _buildAttachmentWidget(attachment),
                      )).toList(),
                  
                  // وقت الإرسال
                  SizedBox(height: 4),
                  Text(
                    _formatMessageTime(message['sentAt']),
                    style: TextStyle(
                      fontSize: 10,
                      color: isMe ? Colors.white70 : Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReplyReference(dynamic replyMessage) {
    return Container(
      margin: EdgeInsets.only(bottom: 4),
      padding: EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border(
          left: BorderSide(color: Colors.grey, width: 2),
        ),
      ),
      child: Text(
        replyMessage['content'] ?? 'ملف مرفق',
        style: TextStyle(
          fontSize: 12,
          color: Colors.grey[600],
          fontStyle: FontStyle.italic,
        ),
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
    );
  }

  void _showMessageOptions(dynamic message) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: Icon(Icons.reply),
              title: Text('رد على الرسالة'),
              onTap: () {
                Navigator.pop(context);
                setState(() {
                  replyToMessage = message;
                });
              },
            ),
            if (message['sender']['_id'] == currentUserId)
              ListTile(
                leading: Icon(Icons.delete, color: Colors.red),
                title: Text('حذف الرسالة', style: TextStyle(color: Colors.red)),
                onTap: () {
                  Navigator.pop(context);
                  _deleteMessage(message['_id']);
                },
              ),
          ],
        ),
      ),
    );
  }

  void _deleteMessage(String messageId) {
    // تطبيق حذف الرسالة
    print('Delete message: $messageId');
  }
}
```

---

## 🚀 **Important Notes**

### ✅ **Socket Events:**
- `authenticate` - مطلوب عند الاتصال
- `join_chat` - للانضمام للمحادثة
- `send_message` - لإرسال رسالة
- `new_message` - استقبال رسالة جديدة
- `typing` / `stop_typing` - مؤشرات الكتابة
- `mark_read` - تحديد الرسائل كمقروءة

### ✅ **API Endpoints:**
- `GET /api/chat` - جلب المحادثات
- `GET /api/chat/{chatId}/messages` - جلب الرسائل
- `POST /api/chat` - إنشاء محادثة جديدة
- `POST /api/chat/{chatId}/send` - إرسال رسالة (نص أو ملفات)

### ✅ **Authentication:**
- استخدم JWT Token في الـ Headershttps://arthub-backend.up.railway.app
- `Authorization: Bearer {token}`

---

### ✅ **File Upload Features:**
- 📸 **Image Upload**: Camera + Gallery
- 🎵 **Voice Recording**: Real-time audio recording with timer
- 🔊 **Voice Playback**: Play received voice messages
- 📁 **File Upload**: Documents, PDFs, etc.
- 🎬 **Video Upload**: Video files support
- 📎 **Multiple Files**: Up to 10 files per message
- 🔒 **Secure Upload**: Cloudinary integration

### ✅ **Supported File Types:**
- **Images**: JPG, PNG, GIF, WebP
- **Audio**: MP3, WAV, AAC, M4A
- **Video**: MP4, AVI, MOV, MKV
- **Documents**: PDF, DOC, DOCX, TXT

---

## 🎯 **Ready to Use!**

هذا الملف يحتوي على كل ما يحتاجه Flutter Developer لربط الشات مع رفع الملفات بسهولة! 

**✨ Features included:**
- 💬 Real-time messaging
- 📎 File upload (Images, Audio, Video, Documents)
- 🎤 Voice recording with real-time timer
- 🔊 Voice message playback
- 🔄 Socket.IO integration
- 📱 Mobile-optimized UI
- 🔐 JWT Authentication
- 📋 Permission handling

**نسخ الملف وابدأ الاستخدام مباشرة! 🚀**