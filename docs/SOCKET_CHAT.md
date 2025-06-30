# توثيق نظام المحادثات باستخدام Socket.io

## نظرة عامة

تم تطوير نظام المحادثات في تطبيق ArtHub باستخدام Socket.io لتوفير تجربة مستخدم تفاعلية وآنية. يعتمد النظام على اتصال مباشر بين العميل والخادم لإرسال واستقبال الرسائل بشكل فوري، مع دعم كامل للإشعارات وعلامات القراءة.

## الاتصال بخدمة Socket.io

### الحصول على رمز الاتصال

قبل إنشاء اتصال Socket.io، يجب الحصول على رمز اتصال من واجهة API:

```javascript
GET /api/chat/socket-token
Headers: {
  Authorization: "Bearer {token}"
}

// استجابة
{
  "success": true,
  "message": "تم إنشاء رمز الاتصال بنجاح",
  "data": {
    "token": "BASE64_ENCODED_TOKEN",
    "userId": "USER_ID"
  }
}
```

### إنشاء اتصال Socket.io

```javascript
// استيراد المكتبة
import { io } from "socket.io-client";

// إنشاء اتصال مع إرسال الرمز
const socket = io("https://your-api-url", {
  query: {
    token: "BASE64_ENCODED_TOKEN"
  },
  transports: ["websocket", "polling"]
});

// الاستماع لأحداث الاتصال
socket.on("connect", () => {
  console.log("تم الاتصال بنجاح");
  
  // مصادقة المستخدم بعد الاتصال
  socket.emit("authenticate", { userId: "USER_ID" });
});

socket.on("authenticated", ({ userId }) => {
  console.log("تم توثيق المستخدم", userId);
});

socket.on("error", (error) => {
  console.error("خطأ في الاتصال:", error);
});

socket.on("disconnect", () => {
  console.log("تم قطع الاتصال");
});
```

## الأحداث والوظائف المتاحة

### الانضمام إلى غرفة محادثة

```javascript
// الانضمام إلى محادثة
socket.emit("join_chat", {
  chatId: "CHAT_ID",
  userId: "USER_ID"
});
```

### إرسال رسالة جديدة

```javascript
// إرسال رسالة
socket.emit("send_message", {
  chatId: "CHAT_ID",
  content: "مرحباً، كيف حالك؟",
  senderId: "USER_ID",
  receiverId: "RECEIVER_ID"
});

// استقبال رسالة جديدة
socket.on("new_message", (message) => {
  console.log("رسالة جديدة:", message);
  // {
  //   _id: "MESSAGE_ID",
  //   content: "مرحباً، كيف حالك؟",
  //   isFromMe: false, // هل الرسالة من المستخدم الحالي؟
  //   sender: {
  //     _id: "SENDER_ID",
  //     displayName: "اسم المرسل",
  //     profileImage: "URL_الصورة"
  //   },
  //   isRead: false,
  //   createdAt: "2023-01-01T00:00:00.000Z"
  // }
});
```

### تحديث حالة القراءة

```javascript
// وضع علامة "مقروء" على الرسائل
socket.emit("mark_read", {
  chatId: "CHAT_ID",
  userId: "USER_ID"
});

// استقبال تحديث حالة القراءة
socket.on("messages_read", ({ chatId, readBy }) => {
  console.log(`تم قراءة الرسائل في المحادثة ${chatId} بواسطة ${readBy}`);
});
```

### مؤشرات الكتابة

```javascript
// إرسال مؤشر أن المستخدم يكتب حالياً
socket.emit("typing", {
  chatId: "CHAT_ID",
  userId: "USER_ID"
});

// إرسال مؤشر أن المستخدم توقف عن الكتابة
socket.emit("stop_typing", {
  chatId: "CHAT_ID",
  userId: "USER_ID"
});

// استقبال مؤشر الكتابة
socket.on("user_typing", ({ chatId, userId }) => {
  console.log(`المستخدم ${userId} يكتب في المحادثة ${chatId}`);
});

// استقبال مؤشر توقف الكتابة
socket.on("user_stopped_typing", ({ chatId, userId }) => {
  console.log(`المستخدم ${userId} توقف عن الكتابة في المحادثة ${chatId}`);
});
```

### تحديث قائمة المحادثات

```javascript
// استقبال تحديث لقائمة المحادثات
socket.on("update_chat_list", ({ chatId }) => {
  console.log(`يجب تحديث المحادثة ${chatId} في القائمة`);
  // يمكن استخدام هذا الحدث لإعادة تحميل قائمة المحادثات
  // أو تحديث محادثة محددة في القائمة
});

// استقبال محادثة جديدة
socket.on("new_chat", ({ chatId, user }) => {
  console.log(`محادثة جديدة ${chatId} من المستخدم ${user.displayName}`);
  // إعادة تحميل قائمة المحادثات
});
```

## التكامل مع واجهة API

على الرغم من استخدام Socket.io للتواصل المباشر، يمكن أيضًا استخدام واجهات API التقليدية للقيام بعمليات المحادثة:

### جلب قائمة المحادثات

```javascript
GET /api/chat
Headers: {
  Authorization: "Bearer {token}"
}

// استجابة
{
  "success": true,
  "message": "تم جلب المحادثات بنجاح",
  "data": [
    {
      "_id": "CHAT_ID",
      "otherUser": {
        "_id": "USER_ID",
        "displayName": "اسم المستخدم",
        "profileImage": "URL_الصورة"
      },
      "lastMessage": {
        "content": "مرحباً، كيف حالك؟",
        "isFromMe": true,
        "createdAt": "2023-01-01T00:00:00.000Z"
      },
      "unreadCount": 0,
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ]
}
```

### جلب رسائل محادثة

```javascript
GET /api/chat/{chatId}/messages
Headers: {
  Authorization: "Bearer {token}"
}

// استجابة
{
  "success": true,
  "message": "تم جلب الرسائل بنجاح",
  "data": {
    "chat": {
      "_id": "CHAT_ID",
      "otherUser": {
        "_id": "USER_ID",
        "displayName": "اسم المستخدم",
        "profileImage": "URL_الصورة"
      }
    },
    "messages": [
      {
        "_id": "MESSAGE_ID",
        "content": "مرحباً، كيف حالك؟",
        "isFromMe": true,
        "sender": {
          "_id": "SENDER_ID",
          "displayName": "اسم المرسل",
          "profileImage": "URL_الصورة"
        },
        "isRead": true,
        "createdAt": "2023-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### إرسال رسالة

```javascript
POST /api/chat/{chatId}/messages
Headers: {
  Authorization: "Bearer {token}",
  Content-Type: "application/json"
}
Body: {
  "content": "مرحباً، كيف حالك؟"
}

// استجابة
{
  "success": true,
  "message": "تم إرسال الرسالة بنجاح",
  "data": {
    "_id": "MESSAGE_ID",
    "content": "مرحباً، كيف حالك؟",
    "isFromMe": true,
    "sender": {
      "_id": "SENDER_ID",
      "displayName": "اسم المرسل",
      "profileImage": "URL_الصورة"
    },
    "isRead": false,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### إنشاء محادثة جديدة

```javascript
POST /api/chat/create
Headers: {
  Authorization: "Bearer {token}",
  Content-Type: "application/json"
}
Body: {
  "userId": "USER_ID"
}

// استجابة
{
  "success": true,
  "message": "تم إنشاء المحادثة بنجاح",
  "data": {
    "_id": "CHAT_ID",
    "otherUser": {
      "_id": "USER_ID",
      "displayName": "اسم المستخدم",
      "profileImage": "URL_الصورة"
    }
  }
}
```

### وضع علامة "مقروء" على الرسائل

```javascript
POST /api/chat/{chatId}/read
Headers: {
  Authorization: "Bearer {token}"
}

// استجابة
{
  "success": true,
  "message": "تم تحديث حالة قراءة الرسائل بنجاح",
  "data": {
    "modifiedCount": 5
  }
}
```

## هيكل البيانات

### نموذج المحادثة (Chat)

```javascript
{
  _id: ObjectId,
  members: [ObjectId], // قائمة بمعرفات المستخدمين في المحادثة
  lastMessage: ObjectId, // إشارة إلى آخر رسالة
  sender: ObjectId, // المستخدم الذي بدأ المحادثة
  receiver: ObjectId, // المستخدم المستقبل الأصلي
  isDeleted: Boolean, // هل تم حذف المحادثة
  createdAt: Date,
  updatedAt: Date
}
```

### نموذج الرسالة (Message)

```javascript
{
  _id: ObjectId,
  chat: ObjectId, // إشارة إلى المحادثة
  sender: ObjectId, // المستخدم المرسل
  content: String, // محتوى الرسالة
  text: String, // (حقل قديم للتوافق)
  isRead: Boolean, // هل تم قراءة الرسالة
  readBy: [ObjectId], // (حقل قديم للتوافق)
  images: [String], // قائمة بروابط الصور المرفقة (إن وجدت)
  isDeleted: Boolean, // هل تم حذف الرسالة
  sentAt: Date, // وقت الإرسال
  createdAt: Date,
  updatedAt: Date
}
```

## معالجة حالات الخطأ

### إعادة الاتصال التلقائي

في حالة انقطاع الاتصال، يحاول Socket.io إعادة الاتصال تلقائيًا. يمكن ضبط إعدادات إعادة الاتصال:

```javascript
const socket = io("https://your-api-url", {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5
});

socket.io.on("reconnect", (attempt) => {
  console.log(`تم إعادة الاتصال بعد ${attempt} محاولات`);
  
  // إعادة المصادقة بعد إعادة الاتصال
  socket.emit("authenticate", { userId: "USER_ID" });
  
  // إعادة الانضمام إلى غرف المحادثة النشطة
  if (currentChatId) {
    socket.emit("join_chat", {
      chatId: currentChatId,
      userId: "USER_ID"
    });
  }
});

socket.io.on("reconnect_attempt", (attempt) => {
  console.log(`محاولة إعادة الاتصال ${attempt}...`);
});

socket.io.on("reconnect_failed", () => {
  console.error("فشلت جميع محاولات إعادة الاتصال");
  // إظهار رسالة للمستخدم بفقدان الاتصال
});
```

### التعامل مع الأخطاء

```javascript
socket.on("error", (error) => {
  console.error("خطأ في Socket.io:", error);
  // معالجة الخطأ حسب النوع
  if (error.message === "Authentication failed") {
    // إعادة المصادقة أو تسجيل الخروج
  }
});
```

## أفضل الممارسات

1. **المزامنة مع قاعدة البيانات**: عند استقبال رسائل جديدة عبر Socket.io، قم بتحديث حالة التطبيق المحلية.

2. **معالجة الاتصال المتقطع**: تنفيذ استراتيجية "التسليم مرة واحدة على الأقل" لضمان عدم فقدان الرسائل في حالة انقطاع الاتصال.

3. **حفظ الرسائل محليًا**: تخزين الرسائل في قاعدة بيانات محلية لتمكين الوصول دون اتصال.

4. **الحفاظ على الأمان**: استخدام JWT أو آليات أمان مماثلة للتحقق من هوية المستخدم.

5. **تحسين الأداء**: استخدام "websocket" كطريقة النقل الأساسية مع "polling" كخطة احتياطية.

## مثال لتنفيذ العميل

```javascript
class ChatService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.currentChatId = null;
    this.listeners = new Map();
  }

  async connect(token, userId) {
    this.userId = userId;
    
    this.socket = io("https://your-api-url", {
      query: { token },
      transports: ["websocket", "polling"]
    });
    
    this.socket.on("connect", () => {
      console.log("تم الاتصال بنجاح");
      this.socket.emit("authenticate", { userId });
    });
    
    this.socket.on("authenticated", () => {
      console.log("تم التوثيق بنجاح");
      this._notifyListeners("authenticated");
      
      // إعادة الانضمام إلى المحادثة الحالية إذا كانت موجودة
      if (this.currentChatId) {
        this.joinChat(this.currentChatId);
      }
    });
    
    // إعداد المستمعين للأحداث
    this._setupEventListeners();
    
    return new Promise((resolve, reject) => {
      this.socket.on("authenticated", () => resolve());
      this.socket.on("error", (error) => reject(error));
      
      // فترة انتهاء المهلة للاتصال
      setTimeout(() => reject(new Error("Connection timeout")), 10000);
    });
  }
  
  _setupEventListeners() {
    // استقبال الرسائل الجديدة
    this.socket.on("new_message", (message) => {
      this._notifyListeners("new_message", message);
    });
    
    // تحديثات حالة القراءة
    this.socket.on("messages_read", (data) => {
      this._notifyListeners("messages_read", data);
    });
    
    // مؤشرات الكتابة
    this.socket.on("user_typing", (data) => {
      this._notifyListeners("user_typing", data);
    });
    
    this.socket.on("user_stopped_typing", (data) => {
      this._notifyListeners("user_stopped_typing", data);
    });
    
    // تحديثات قائمة المحادثات
    this.socket.on("update_chat_list", (data) => {
      this._notifyListeners("update_chat_list", data);
    });
    
    this.socket.on("new_chat", (data) => {
      this._notifyListeners("new_chat", data);
    });
    
    // أحداث الاتصال
    this.socket.on("disconnect", () => {
      this._notifyListeners("disconnect");
    });
    
    this.socket.on("error", (error) => {
      this._notifyListeners("error", error);
    });
  }
  
  // الانضمام إلى غرفة محادثة
  joinChat(chatId) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket غير متصل");
      return false;
    }
    
    this.currentChatId = chatId;
    this.socket.emit("join_chat", {
      chatId,
      userId: this.userId
    });
    
    return true;
  }
  
  // إرسال رسالة
  sendMessage(chatId, content, receiverId) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket غير متصل");
      return false;
    }
    
    this.socket.emit("send_message", {
      chatId,
      content,
      senderId: this.userId,
      receiverId
    });
    
    return true;
  }
  
  // وضع علامة "مقروء"
  markAsRead(chatId) {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket غير متصل");
      return false;
    }
    
    this.socket.emit("mark_read", {
      chatId,
      userId: this.userId
    });
    
    return true;
  }
  
  // إرسال مؤشر الكتابة
  sendTyping(chatId, isTyping = true) {
    if (!this.socket || !this.socket.connected) {
      return false;
    }
    
    const event = isTyping ? "typing" : "stop_typing";
    this.socket.emit(event, {
      chatId,
      userId: this.userId
    });
    
    return true;
  }
  
  // إضافة مستمع للأحداث
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    
    this.listeners.get(event).push(callback);
  }
  
  // إزالة مستمع
  removeListener(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }
  
  // إبلاغ المستمعين بحدث
  _notifyListeners(event, data) {
    if (!this.listeners.has(event)) return;
    
    for (const callback of this.listeners.get(event)) {
      try {
        callback(data);
      } catch (error) {
        console.error(`خطأ في مستمع الحدث ${event}:`, error);
      }
    }
  }
  
  // قطع الاتصال
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentChatId = null;
    }
  }
}

// كيفية استخدام الخدمة
// const chatService = new ChatService();
// await chatService.connect(token, userId);
// chatService.addListener("new_message", (message) => {
//   console.log("رسالة جديدة:", message);
//   // تحديث واجهة المستخدم
// });
// chatService.joinChat(chatId);
// chatService.sendMessage(chatId, "مرحباً!", receiverId);
```

## الخاتمة

يوفر نظام المحادثات باستخدام Socket.io تجربة مستخدم متميزة مع تواصل فوري ومزامنة آنية بين الأجهزة. مع دعم ميزات مثل إشعارات الكتابة، تأكيد القراءة، والإشعارات، يقدم النظام تجربة محادثات كاملة للمستخدمين. 