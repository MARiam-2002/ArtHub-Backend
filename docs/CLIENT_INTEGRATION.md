# دليل تكامل العميل مع نظام المحادثات (Socket.io)

## مقدمة

هذا الدليل يشرح كيفية دمج نظام المحادثات المطور حديثًا باستخدام Socket.io في تطبيقات العملاء (Flutter، React، React Native). يعتمد النظام الجديد على اتصال مباشر بدلاً من Firebase Realtime Database لتوفير تجربة محادثات آنية أكثر كفاءة.

## الاختلافات الرئيسية عن النظام السابق

1. استخدام اتصال Socket.io المباشر بدلاً من Firebase Realtime Database
2. استخدام حقل `content` بدلاً من `text` للرسائل (مع الاحتفاظ بالتوافق الرجعي)
3. إضافة ميزات جديدة مثل إشعارات الكتابة وتأكيدات القراءة الآنية
4. تحسين أداء وكفاءة المحادثات

## متطلبات التكامل

### تثبيت حزم Socket.io في العميل

#### Flutter

```bash
flutter pub add socket_io_client
```

#### React / React Native

```bash
npm install socket.io-client
# أو
yarn add socket.io-client
```

## خطوات التكامل

### 1. الحصول على رمز الاتصال

قبل الاتصال بـ Socket.io، يجب الحصول على رمز اتصال من الخادم:

```dart
// مثال Flutter
Future<String> getSocketToken() async {
  final response = await http.get(
    Uri.parse('$apiUrl/api/chat/socket-token'),
    headers: {'Authorization': 'Bearer $userToken'},
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return data['data']['token'];
  } else {
    throw Exception('فشل في الحصول على رمز الاتصال');
  }
}
```

```javascript
// مثال JavaScript (React / React Native)
async function getSocketToken() {
  const response = await fetch(`${apiUrl}/api/chat/socket-token`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });

  if (response.ok) {
    const data = await response.json();
    return data.data.token;
  } else {
    throw new Error('فشل في الحصول على رمز الاتصال');
  }
}
```

### 2. إنشاء خدمة Socket.io

#### مثال كامل لـ Flutter

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class ChatService {
  late IO.Socket socket;
  String? userId;

  // إعداد المستمعين للأحداث
  Function(Map<String, dynamic>)? onNewMessage;
  Function(Map<String, dynamic>)? onMessagesRead;
  Function(Map<String, dynamic>)? onUserTyping;
  Function(Map<String, dynamic>)? onUserStoppedTyping;
  Function(Map<String, dynamic>)? onChatListUpdate;
  Function(Map<String, dynamic>)? onNewChat;

  // الاتصال بالسوكت
  Future<void> connect(String token, String uid) async {
    userId = uid;

    socket = IO.io('https://your-api-url', {
      'transports': ['websocket'],
      'query': {'token': token}
    });

    socket.on('connect', (_) {
      print('تم الاتصال بنجاح');
      socket.emit('authenticate', {'userId': userId});
    });

    socket.on('authenticated', (_) {
      print('تم التوثيق بنجاح');
    });

    socket.on('error', (error) {
      print('خطأ في الاتصال: $error');
    });

    socket.on('disconnect', (_) {
      print('تم قطع الاتصال');
    });

    _setupEventListeners();
  }

  void _setupEventListeners() {
    // استقبال رسالة جديدة
    socket.on('new_message', (data) {
      if (onNewMessage != null) {
        onNewMessage!(data);
      }
    });

    // تحديث حالة القراءة
    socket.on('messages_read', (data) {
      if (onMessagesRead != null) {
        onMessagesRead!(data);
      }
    });

    // مؤشرات الكتابة
    socket.on('user_typing', (data) {
      if (onUserTyping != null) {
        onUserTyping!(data);
      }
    });

    socket.on('user_stopped_typing', (data) {
      if (onUserStoppedTyping != null) {
        onUserStoppedTyping!(data);
      }
    });

    // تحديثات قائمة المحادثات
    socket.on('update_chat_list', (data) {
      if (onChatListUpdate != null) {
        onChatListUpdate!(data);
      }
    });

    socket.on('new_chat', (data) {
      if (onNewChat != null) {
        onNewChat!(data);
      }
    });
  }

  // الانضمام إلى محادثة
  void joinChat(String chatId) {
    if (socket.connected) {
      socket.emit('join_chat', {'chatId': chatId, 'userId': userId});
    }
  }

  // إرسال رسالة
  void sendMessage(String chatId, String content, String receiverId) {
    if (socket.connected) {
      socket.emit('send_message', {
        'chatId': chatId,
        'content': content,
        'senderId': userId,
        'receiverId': receiverId
      });
    }
  }

  // تحديث حالة القراءة
  void markAsRead(String chatId) {
    if (socket.connected) {
      socket.emit('mark_read', {'chatId': chatId, 'userId': userId});
    }
  }

  // إرسال مؤشر الكتابة
  void sendTypingStatus(String chatId, bool isTyping) {
    if (socket.connected) {
      final event = isTyping ? 'typing' : 'stop_typing';
      socket.emit(event, {'chatId': chatId, 'userId': userId});
    }
  }

  // قطع الاتصال
  void disconnect() {
    if (socket.connected) {
      socket.disconnect();
    }
  }
}
```

#### مثال كامل لـ React / React Native

```javascript
import { io } from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.callbacks = {
      newMessage: null,
      messagesRead: null,
      userTyping: null,
      userStoppedTyping: null,
      updateChatList: null,
      newChat: null
    };
  }

  // تسجيل المستمعين للأحداث
  registerCallback(event, callback) {
    if (this.callbacks.hasOwnProperty(event)) {
      this.callbacks[event] = callback;
    }
  }

  // الاتصال بالسوكت
  async connect(token, userId) {
    this.userId = userId;

    this.socket = io('https://your-api-url', {
      query: { token },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('تم الاتصال بنجاح');
      this.socket.emit('authenticate', { userId });
    });

    this.socket.on('authenticated', () => {
      console.log('تم التوثيق بنجاح');
    });

    this.socket.on('error', error => {
      console.error('خطأ في الاتصال:', error);
    });

    this.socket.on('disconnect', () => {
      console.log('تم قطع الاتصال');
    });

    this._setupEventListeners();

    return new Promise((resolve, reject) => {
      this.socket.on('authenticated', () => resolve());
      this.socket.on('error', error => reject(error));

      // وقت انتهاء مهلة الاتصال
      setTimeout(() => reject(new Error('Connection timeout')), 10000);
    });
  }

  _setupEventListeners() {
    // استقبال رسالة جديدة
    this.socket.on('new_message', data => {
      if (this.callbacks.newMessage) {
        this.callbacks.newMessage(data);
      }
    });

    // تحديث حالة القراءة
    this.socket.on('messages_read', data => {
      if (this.callbacks.messagesRead) {
        this.callbacks.messagesRead(data);
      }
    });

    // مؤشرات الكتابة
    this.socket.on('user_typing', data => {
      if (this.callbacks.userTyping) {
        this.callbacks.userTyping(data);
      }
    });

    this.socket.on('user_stopped_typing', data => {
      if (this.callbacks.userStoppedTyping) {
        this.callbacks.userStoppedTyping(data);
      }
    });

    // تحديثات قائمة المحادثات
    this.socket.on('update_chat_list', data => {
      if (this.callbacks.updateChatList) {
        this.callbacks.updateChatList(data);
      }
    });

    this.socket.on('new_chat', data => {
      if (this.callbacks.newChat) {
        this.callbacks.newChat(data);
      }
    });
  }

  // الانضمام إلى محادثة
  joinChat(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('join_chat', {
        chatId,
        userId: this.userId
      });
    }
  }

  // إرسال رسالة
  sendMessage(chatId, content, receiverId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('send_message', {
        chatId,
        content,
        senderId: this.userId,
        receiverId
      });
    }
  }

  // تحديث حالة القراءة
  markAsRead(chatId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('mark_read', {
        chatId,
        userId: this.userId
      });
    }
  }

  // إرسال مؤشر الكتابة
  sendTypingStatus(chatId, isTyping) {
    if (this.socket && this.socket.connected) {
      const event = isTyping ? 'typing' : 'stop_typing';
      this.socket.emit(event, {
        chatId,
        userId: this.userId
      });
    }
  }

  // قطع الاتصال
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new ChatService();
```

## استخدام الخدمة في التطبيق

### مثال استخدام في Flutter

```dart
// في صفحة المحادثات
class _ChatPageState extends State<ChatPage> {
  final ChatService _chatService = ChatService();
  final List<Message> _messages = [];
  bool _isTyping = false;

  @override
  void initState() {
    super.initState();
    _initChatService();
  }

  Future<void> _initChatService() async {
    // الحصول على رمز الاتصال
    final token = await getSocketToken();

    // تهيئة خدمة المحادثات
    await _chatService.connect(token, widget.userId);

    // تسجيل المستمعين للأحداث
    _chatService.onNewMessage = (data) {
      setState(() {
        _messages.add(Message.fromJson(data));
      });
    };

    _chatService.onUserTyping = (data) {
      if (data['chatId'] == widget.chatId && data['userId'] != widget.userId) {
        setState(() {
          _isTyping = true;
        });
      }
    };

    _chatService.onUserStoppedTyping = (data) {
      if (data['chatId'] == widget.chatId && data['userId'] != widget.userId) {
        setState(() {
          _isTyping = false;
        });
      }
    };

    // الانضمام إلى المحادثة
    _chatService.joinChat(widget.chatId);

    // تحديث حالة القراءة
    _chatService.markAsRead(widget.chatId);
  }

  void _sendMessage() {
    if (_messageController.text.trim().isNotEmpty) {
      // إرسال الرسالة
      _chatService.sendMessage(
        widget.chatId,
        _messageController.text.trim(),
        widget.receiverId
      );

      // مسح حقل الإدخال
      _messageController.clear();
    }
  }

  void _handleTyping(String text) {
    if (text.isNotEmpty) {
      _chatService.sendTypingStatus(widget.chatId, true);
    } else {
      _chatService.sendTypingStatus(widget.chatId, false);
    }
  }

  @override
  void dispose() {
    // إغلاق الاتصال عند الخروج من الصفحة
    _chatService.disconnect();
    super.dispose();
  }

  // الواجهة...
}
```

### مثال استخدام في React / React Native

```jsx
import React, { useEffect, useState, useRef } from 'react';
import chatService from '../services/chatService';

function ChatScreen({ route, navigation }) {
  const { chatId, receiverId } = route.params;
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    async function initChat() {
      try {
        // الحصول على رمز الاتصال (افتراض أنه تم الحصول عليه في مكان آخر)
        const token = await getSocketToken();
        const userId = getUserId(); // دالة مساعدة للحصول على معرف المستخدم

        // تهيئة الاتصال
        await chatService.connect(token, userId);

        // تسجيل المستمعين للأحداث
        chatService.registerCallback('newMessage', data => {
          setMessages(prev => [...prev, data]);
        });

        chatService.registerCallback('userTyping', data => {
          if (data.chatId === chatId && data.userId !== userId) {
            setIsTyping(true);
          }
        });

        chatService.registerCallback('userStoppedTyping', data => {
          if (data.chatId === chatId && data.userId !== userId) {
            setIsTyping(false);
          }
        });

        // الانضمام إلى المحادثة
        chatService.joinChat(chatId);

        // تحديث حالة القراءة
        chatService.markAsRead(chatId);

        // جلب الرسائل السابقة (باستخدام API)
        fetchPreviousMessages();
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    }

    initChat();

    return () => {
      // إغلاق الاتصال عند الخروج من الصفحة
      chatService.disconnect();
    };
  }, [chatId, receiverId]);

  const fetchPreviousMessages = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/chat/${chatId}/messages`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data.data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = () => {
    if (newMessage.trim()) {
      chatService.sendMessage(chatId, newMessage.trim(), receiverId);
      setNewMessage('');
    }
  };

  const handleTyping = text => {
    setNewMessage(text);

    if (text) {
      chatService.sendTypingStatus(chatId, true);

      // إعادة ضبط المؤقت
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // إرسال إشعار توقف الكتابة بعد 3 ثوانٍ من عدم الكتابة
      typingTimeoutRef.current = setTimeout(() => {
        chatService.sendTypingStatus(chatId, false);
      }, 3000);
    } else {
      chatService.sendTypingStatus(chatId, false);
    }
  };

  // الواجهة...
}
```

## التعامل مع واجهات API التقليدية

بجانب Socket.io، يمكن استخدام واجهات API التقليدية للقيام بعمليات المحادثة:

### جلب قائمة المحادثات

```javascript
async function getChats() {
  const response = await fetch(`${apiUrl}/api/chat`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });

  if (response.ok) {
    const data = await response.json();
    return data.data;
  } else {
    throw new Error('فشل في جلب المحادثات');
  }
}
```

### جلب رسائل محادثة

```javascript
async function getChatMessages(chatId) {
  const response = await fetch(`${apiUrl}/api/chat/${chatId}/messages`, {
    headers: { Authorization: `Bearer ${userToken}` }
  });

  if (response.ok) {
    const data = await response.json();
    return data.data;
  } else {
    throw new Error('فشل في جلب الرسائل');
  }
}
```

### إرسال رسالة

```javascript
async function sendMessage(chatId, content) {
  const response = await fetch(`${apiUrl}/api/chat/${chatId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ content })
  });

  if (response.ok) {
    const data = await response.json();
    return data.data;
  } else {
    throw new Error('فشل في إرسال الرسالة');
  }
}
```

### إنشاء محادثة جديدة

```javascript
async function createChat(userId) {
  const response = await fetch(`${apiUrl}/api/chat/create`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ userId })
  });

  if (response.ok) {
    const data = await response.json();
    return data.data;
  } else {
    throw new Error('فشل في إنشاء المحادثة');
  }
}
```

## معالجة حالات الخطأ

### إعادة الاتصال التلقائي

Socket.io يوفر آلية إعادة اتصال تلقائية، لكن يمكن أيضًا تنفيذ إعادة الاتصال اليدوية:

```javascript
function setupReconnection() {
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  chatService.socket.io.on('reconnect_attempt', attempt => {
    console.log(`محاولة إعادة اتصال ${attempt}...`);
  });

  chatService.socket.io.on('reconnect', attempt => {
    console.log(`تم إعادة الاتصال بعد ${attempt} محاولات`);

    // إعادة المصادقة بعد إعادة الاتصال
    chatService.socket.emit('authenticate', { userId: chatService.userId });

    // إعادة الانضمام إلى المحادثة الحالية
    if (currentChatId) {
      chatService.joinChat(currentChatId);
    }
  });

  chatService.socket.io.on('reconnect_failed', () => {
    console.error('فشلت جميع محاولات إعادة الاتصال');
    // إظهار رسالة للمستخدم
  });
}
```

## أفضل الممارسات

1. **المزامنة مع حالة التطبيق**: تحديث حالة التطبيق المحلية عند استقبال رسائل جديدة.

2. **معالجة الاتصال المتقطع**: تخزين الرسائل مؤقتًا عند فقدان الاتصال وإعادة إرسالها عند استعادة الاتصال.

3. **التخزين المحلي**: تخزين المحادثات والرسائل محليًا للوصول دون اتصال.

4. **أمان الاتصال**: استخدام HTTPS لجميع اتصالات Socket.io.

5. **تحسين الأداء**: استخدام WebSocket كوسيلة نقل أساسية مع التراجع إلى Long Polling عند الضرورة.

## الملاحظات الهامة للانتقال من النظام القديم

1. حقل `content` هو البديل الجديد لحقل `text` في الرسائل.

2. نظام Socket.io يحتاج إلى استراتيجية تعامل مع انقطاع الاتصال أكثر من النظام السابق.

3. استخدم عملية اتصال مثالية: جلب الرمز → اتصال Socket.io → مصادقة → انضمام للمحادثة.

4. إذا واجهت مشاكل في Socket.io، يمكنك دائمًا العودة إلى واجهات API التقليدية كخطة بديلة.

## التوافق مع الأجهزة القديمة

النظام الجديد متوافق بشكل كامل مع الأجهزة والإصدارات القديمة، حيث:

1. تم الحفاظ على واجهات API التقليدية بجانب Socket.io.
2. تم الاحتفاظ بحقل `text` للتوافق الرجعي مع تطبيقات العملاء القديمة.
3. تم إضافة منطق في الخادم للتعامل مع كلا الحقلين `content` و `text`.

## Authentication Integration

### Firebase Authentication

ArtHub now supports a unified authentication approach using Firebase Authentication. This allows for seamless login across web and mobile applications.

#### Flutter Integration

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final String apiUrl = 'https://your-api-url';
  
  // Get current Firebase ID token
  Future<String> getIdToken() async {
    User? user = _auth.currentUser;
    if (user == null) {
      throw Exception('المستخدم غير مسجل الدخول');
    }
    
    return await user.getIdToken();
  }
  
  // Convert Firebase token to ArtHub JWT token
  Future<Map<String, dynamic>> convertToJWT() async {
    try {
      final idToken = await getIdToken();
      
      final response = await http.post(
        Uri.parse('$apiUrl/api/auth/firebase'),
        headers: {
          'Authorization': 'Bearer $idToken',
          'Content-Type': 'application/json'
        }
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('فشل في تحويل التوكن: ${response.body}');
      }
    } catch (e) {
      throw Exception('خطأ في المصادقة: $e');
    }
  }
  
  // Register with email and password
  Future<Map<String, dynamic>> register(String email, String password, String displayName) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password,
          'displayName': displayName
        })
      );
      
      if (response.statusCode == 201) {
        return jsonDecode(response.body);
      } else {
        throw Exception('فشل في التسجيل: ${response.body}');
      }
    } catch (e) {
      throw Exception('خطأ في التسجيل: $e');
    }
  }
  
  // Login with email and password
  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email,
          'password': password
        })
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('فشل في تسجيل الدخول: ${response.body}');
      }
    } catch (e) {
      throw Exception('خطأ في تسجيل الدخول: $e');
    }
  }
  
  // Reset password
  Future<bool> resetPassword(String email) async {
    try {
      final response = await http.post(
        Uri.parse('$apiUrl/api/auth/forgot-password'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email
        })
      );
      
      return response.statusCode == 200;
    } catch (e) {
      throw Exception('خطأ في إعادة تعيين كلمة المرور: $e');
    }
  }
}
```

#### React / React Native Integration

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import axios from 'axios';

// Initialize Firebase
const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const API_URL = 'https://your-api-url';

class AuthService {
  // Get current Firebase ID token
  async getIdToken() {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('المستخدم غير مسجل الدخول');
    }
    
    return await user.getIdToken();
  }
  
  // Convert Firebase token to ArtHub JWT token
  async convertToJWT() {
    try {
      const idToken = await this.getIdToken();
      
      const response = await axios.post(`${API_URL}/api/auth/firebase`, {}, {
        headers: {
          Authorization: `Bearer ${idToken}`
        }
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`خطأ في المصادقة: ${error.message}`);
    }
  }
  
  // Register with email and password
  async register(email, password, displayName) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        email,
        password,
        displayName
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`فشل في التسجيل: ${error.message}`);
    }
  }
  
  // Login with email and password
  async login(email, password) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        email,
        password
      });
      
      return response.data;
    } catch (error) {
      throw new Error(`فشل في تسجيل الدخول: ${error.message}`);
    }
  }
  
  // Reset password
  async resetPassword(email) {
    try {
      const response = await axios.post(`${API_URL}/api/auth/forgot-password`, {
        email
      });
      
      return response.status === 200;
    } catch (error) {
      throw new Error(`خطأ في إعادة تعيين كلمة المرور: ${error.message}`);
    }
  }
}

export default new AuthService();
```

### Fingerprint Authentication

ArtHub supports fingerprint authentication for mobile applications. This allows users to login using their device's biometric authentication.

#### Flutter Integration

```dart
import 'package:local_auth/local_auth.dart';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

class BiometricAuthService {
  final LocalAuthentication _localAuth = LocalAuthentication();
  final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  final FlutterSecureStorage _secureStorage = const FlutterSecureStorage();
  final String apiUrl = 'https://your-api-url';
  
  // Check if biometric authentication is available
  Future<bool> isBiometricAvailable() async {
    final canAuthenticateWithBiometrics = await _localAuth.canCheckBiometrics;
    final canAuthenticate = canAuthenticateWithBiometrics || await _localAuth.isDeviceSupported();
    return canAuthenticate;
  }
  
  // Get device ID
  Future<String> getDeviceId() async {
    final androidInfo = await _deviceInfo.androidInfo;
    return androidInfo.id;
  }
  
  // Register device for fingerprint authentication
  Future<bool> registerDevice(String authToken) async {
    try {
      // Authenticate user with biometrics
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'قم بمسح بصمتك لتسجيل الجهاز',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
      
      if (!authenticated) {
        return false;
      }
      
      // Generate fingerprint data (in a real app, use a secure method)
      final deviceId = await getDeviceId();
      final fingerprintData = base64Encode(utf8.encode('$deviceId-${DateTime.now().millisecondsSinceEpoch}'));
      
      // Save fingerprint data securely
      await _secureStorage.write(key: 'fingerprint_data', value: fingerprintData);
      
      // Register device with API
      final response = await http.post(
        Uri.parse('$apiUrl/api/auth/register-device-fingerprint'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'deviceId': deviceId,
          'deviceName': 'Flutter Device',
          'fingerprintData': fingerprintData
        })
      );
      
      return response.statusCode == 200;
    } catch (e) {
      print('Error registering device: $e');
      return false;
    }
  }
  
  // Login with fingerprint
  Future<Map<String, dynamic>?> loginWithFingerprint(String authToken) async {
    try {
      // Authenticate user with biometrics
      final authenticated = await _localAuth.authenticate(
        localizedReason: 'قم بمسح بصمتك لتسجيل الدخول',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
      
      if (!authenticated) {
        return null;
      }
      
      // Get saved fingerprint data
      final fingerprintData = await _secureStorage.read(key: 'fingerprint_data');
      if (fingerprintData == null) {
        throw Exception('لم يتم تسجيل البصمة');
      }
      
      // Get device ID
      final deviceId = await getDeviceId();
      
      // Login with API
      final response = await http.post(
        Uri.parse('$apiUrl/api/auth/login-with-fingerprint'),
        headers: {
          'Authorization': 'Bearer $authToken',
          'Content-Type': 'application/json'
        },
        body: jsonEncode({
          'deviceId': deviceId,
          'fingerprintData': fingerprintData
        })
      );
      
      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        throw Exception('فشل في تسجيل الدخول باستخدام البصمة');
      }
    } catch (e) {
      print('Error logging in with fingerprint: $e');
      return null;
    }
  }
}
```
