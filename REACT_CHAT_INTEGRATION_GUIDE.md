# 💬 ArtHub Chat Integration Guide for React

## 🚀 **Quick Setup**

### 1️⃣ **Install Dependencies**
```bash
npm install socket.io-client axios
# or
yarn add socket.io-client axios
```

### 2️⃣ **Environment Configuration**
```javascript
// config/constants.js
export const API_CONFIG = {
  BASE_URL: 'https://arthub-backend.up.railway.app/api',
  SOCKET_URL: 'https://arthub-backend.up.railway.app',
  WS_TRANSPORTS: ['websocket']
};
```

---

## 🔌 **Socket.IO Service**

### **ChatSocketService.js:**
```javascript
import io from 'socket.io-client';
import { API_CONFIG } from '../config/constants';

class ChatSocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.currentUserId = null;
    this.eventCallbacks = new Map();
  }

  // Initialize Socket Connection
  connect(userId, token) {
    this.currentUserId = userId;
    
    this.socket = io(API_CONFIG.SOCKET_URL, {
      transports: API_CONFIG.WS_TRANSPORTS,
      autoConnect: false,
      extraHeaders: {
        'Authorization': `Bearer ${token}`,
      },
    });

    this.setupEventListeners();
    this.socket.connect();
    
    return this;
  }

  setupEventListeners() {
    if (!this.socket) return;

    // Connection Events
    this.socket.on('connect', () => {
      console.log('✅ Socket Connected');
      this.isConnected = true;
      this.authenticateUser();
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Socket Disconnected');
      this.isConnected = false;
      this.emit('connection_status', { connected: false });
    });

    this.socket.on('authenticated', (data) => {
      console.log('✅ User Authenticated:', data);
      this.emit('authenticated', data);
    });

    this.socket.on('error', (error) => {
      console.error('❌ Socket Error:', error);
      this.emit('socket_error', error);
    });

    // Chat Events
    this.socket.on('new_message', (data) => {
      console.log('📨 New Message:', data);
      this.emit('new_message', data);
    });

    this.socket.on('messages_read', (data) => {
      console.log('👁️ Messages Read:', data);
      this.emit('messages_read', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User Typing:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      console.log('⌨️ User Stopped Typing:', data);
      this.emit('user_stopped_typing', data);
    });
  }

  authenticateUser() {
    if (this.currentUserId && this.socket) {
      this.socket.emit('authenticate', {
        userId: this.currentUserId,
      });
    }
  }

  // Join Chat Room
  joinChat(chatId) {
    if (this.isConnected && this.currentUserId && this.socket) {
      this.socket.emit('join_chat', {
        chatId,
        userId: this.currentUserId,
      });
    }
  }

  // Send Message
  sendMessage(chatId, content, receiverId) {
    if (this.isConnected && this.currentUserId && this.socket) {
      this.socket.emit('send_message', {
        chatId,
        content,
        senderId: this.currentUserId,
        receiverId,
      });
    }
  }

  // Send File Message (for uploaded files)
  sendFileMessage(chatId, fileData, receiverId) {
    if (this.isConnected && this.currentUserId && this.socket) {
      this.socket.emit('send_message', {
        chatId,
        content: fileData.caption || '',
        messageType: fileData.type,
        senderId: this.currentUserId,
        receiverId,
        attachments: [fileData]
      });
    }
  }

  // Typing Indicators
  startTyping(chatId) {
    if (this.isConnected && this.currentUserId && this.socket) {
      this.socket.emit('typing', {
        chatId,
        userId: this.currentUserId,
      });
    }
  }

  stopTyping(chatId) {
    if (this.isConnected && this.currentUserId && this.socket) {
      this.socket.emit('stop_typing', {
        chatId,
        userId: this.currentUserId,
      });
    }
  }

  // Mark Messages as Read
  markMessagesAsRead(chatId) {
    if (this.isConnected && this.currentUserId && this.socket) {
      this.socket.emit('mark_read', {
        chatId,
        userId: this.currentUserId,
      });
    }
  }

  // Event Management
  on(event, callback) {
    if (!this.eventCallbacks.has(event)) {
      this.eventCallbacks.set(event, []);
    }
    this.eventCallbacks.get(event).push(callback);
  }

  off(event, callback) {
    if (this.eventCallbacks.has(event)) {
      const callbacks = this.eventCallbacks.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.eventCallbacks.has(event)) {
      this.eventCallbacks.get(event).forEach(callback => {
        callback(data);
      });
    }
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.currentUserId = null;
    this.eventCallbacks.clear();
  }
}

// Singleton instance
export const chatSocketService = new ChatSocketService();
export default chatSocketService;
```

---

## 📡 **REST API Service**

### **ChatApiService.js:**
```javascript
import axios from 'axios';
import { API_CONFIG } from '../config/constants';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: 10000,
});

// Add auth interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export class ChatApiService {
  // Get User Chats
  static async getUserChats(page = 1, limit = 20, search = '') {
    try {
      const params = { page, limit };
      if (search) params.search = search;

      const response = await apiClient.get('/chat', { params });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Error fetching chats:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load chats',
      };
    }
  }

  // Get Chat Messages
  static async getChatMessages(chatId, page = 1, limit = 50) {
    try {
      const response = await apiClient.get(`/chat/${chatId}/messages`, {
        params: { page, limit },
      });
      return {
        success: true,
        data: response.data.data,
        pagination: response.data.pagination,
      };
    } catch (error) {
      console.error('Error fetching messages:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load messages',
      };
    }
  }

  // Create New Chat
  static async createChat(receiverId) {
    try {
      const response = await apiClient.post('/chat', {
        receiver: receiverId,
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error creating chat:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create chat',
      };
    }
  }

  // Get Unread Messages Count
  static async getUnreadCount() {
    try {
      const response = await apiClient.get('/chat/unread-count');
      return {
        success: true,
        count: response.data.data.unreadCount,
      };
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get unread count',
      };
    }
  }

  // Send Text Message
  static async sendMessage(chatId, content) {
    try {
      const response = await apiClient.post(`/chat/${chatId}/send`, {
        content,
        messageType: 'text'
      });
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error sending message:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send message',
      };
    }
  }

  // Send File Message (Images, Audio, Video, Documents)
  static async sendFileMessage(chatId, files, content = '', messageType = 'file') {
    try {
      const formData = new FormData();
      
      // Add files
      if (Array.isArray(files)) {
        files.forEach(file => {
          formData.append('files', file);
        });
      } else {
        formData.append('files', files);
      }
      
      // Add other data
      if (content) formData.append('content', content);
      formData.append('messageType', messageType);

      const response = await apiClient.post(`/chat/${chatId}/send`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return {
        success: true,
        data: response.data.data,
      };
    } catch (error) {
      console.error('Error sending file message:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to send file message',
      };
    }
  }
}

export default ChatApiService;
```

---

## 🎯 **React Hooks**

### **useChatSocket.js:**
```javascript
import { useEffect, useCallback, useRef } from 'react';
import { chatSocketService } from '../services/ChatSocketService';

export const useChatSocket = (userId, token) => {
  const isInitialized = useRef(false);

  useEffect(() => {
    if (userId && token && !isInitialized.current) {
      chatSocketService.connect(userId, token);
      isInitialized.current = true;
    }

    return () => {
      if (isInitialized.current) {
        chatSocketService.disconnect();
        isInitialized.current = false;
      }
    };
  }, [userId, token]);

  const joinChat = useCallback((chatId) => {
    chatSocketService.joinChat(chatId);
  }, []);

  const sendMessage = useCallback((chatId, content, receiverId) => {
    chatSocketService.sendMessage(chatId, content, receiverId);
  }, []);

  const startTyping = useCallback((chatId) => {
    chatSocketService.startTyping(chatId);
  }, []);

  const stopTyping = useCallback((chatId) => {
    chatSocketService.stopTyping(chatId);
  }, []);

  const markAsRead = useCallback((chatId) => {
    chatSocketService.markMessagesAsRead(chatId);
  }, []);

  const addEventListener = useCallback((event, callback) => {
    chatSocketService.on(event, callback);
    return () => chatSocketService.off(event, callback);
  }, []);

  return {
    joinChat,
    sendMessage,
    startTyping,
    stopTyping,
    markAsRead,
    addEventListener,
    isConnected: chatSocketService.isConnected,
  };
};
```

### **useChat.js:**
```javascript
import { useState, useEffect, useCallback } from 'react';
import { ChatApiService } from '../services/ChatApiService';
import { useChatSocket } from './useChatSocket';

export const useChat = (chatId, userId, token) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [typing, setTyping] = useState(null);

  const { 
    joinChat, 
    sendMessage: socketSendMessage, 
    startTyping, 
    stopTyping, 
    markAsRead,
    addEventListener 
  } = useChatSocket(userId, token);

  // Load messages
  const loadMessages = useCallback(async (page = 1) => {
    if (!chatId) return;

    setLoading(true);
    const result = await ChatApiService.getChatMessages(chatId, page);
    
    if (result.success) {
      setMessages(prev => page === 1 ? result.data.messages.reverse() : [...result.data.messages.reverse(), ...prev]);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, [chatId]);

  // Send message
  const sendMessage = useCallback((content, receiverId) => {
    if (!chatId || !content.trim()) return;
    socketSendMessage(chatId, content.trim(), receiverId);
  }, [chatId, socketSendMessage]);

  // Send file message
  const sendFileMessage = useCallback(async (files, caption = '') => {
    if (!chatId || !files) return;
    
    try {
      const result = await ChatApiService.sendFileMessage(chatId, files, caption);
      if (result.success) {
        // File uploaded successfully, real-time update will come via socket
        console.log('File message sent:', result.data);
      } else {
        console.error('Failed to send file:', result.error);
      }
    } catch (error) {
      console.error('Error sending file message:', error);
    }
  }, [chatId]);

  // Handle typing
  const handleStartTyping = useCallback(() => {
    if (chatId) startTyping(chatId);
  }, [chatId, startTyping]);

  const handleStopTyping = useCallback(() => {
    if (chatId) stopTyping(chatId);
  }, [chatId, stopTyping]);

  // Socket event listeners
  useEffect(() => {
    if (!chatId) return;

    // Join chat room
    joinChat(chatId);
    
    // Mark messages as read
    markAsRead(chatId);

    // Load initial messages
    loadMessages();

    // Listen for new messages
    const unsubscribeNewMessage = addEventListener('new_message', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => [...prev, data.message]);
        // Auto-mark as read if chat is active
        markAsRead(chatId);
      }
    });

    // Listen for typing indicators
    const unsubscribeTyping = addEventListener('user_typing', (data) => {
      if (data.chatId === chatId && data.userId !== userId) {
        setTyping(data.userName || 'Someone');
      }
    });

    const unsubscribeStopTyping = addEventListener('user_stopped_typing', (data) => {
      if (data.chatId === chatId && data.userId !== userId) {
        setTyping(null);
      }
    });

    // Listen for read status
    const unsubscribeRead = addEventListener('messages_read', (data) => {
      if (data.chatId === chatId) {
        setMessages(prev => prev.map(msg => 
          msg.sender._id === userId ? { ...msg, isRead: true } : msg
        ));
      }
    });

    return () => {
      unsubscribeNewMessage();
      unsubscribeTyping();
      unsubscribeStopTyping();
      unsubscribeRead();
    };
  }, [chatId, userId, joinChat, markAsRead, loadMessages, addEventListener]);

  return {
    messages,
    loading,
    error,
    typing,
    sendMessage,
    sendFileMessage,
    loadMessages,
    startTyping: handleStartTyping,
    stopTyping: handleStopTyping,
  };
};
```

---

## 🎨 **React Components**

### **ChatScreen.jsx:**
```jsx
import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../hooks/useChat';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import './ChatScreen.css';

const ChatScreen = ({ chatId, receiverId, receiverName, currentUserId, token }) => {
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { 
    messages, 
    loading, 
    error, 
    typing, 
    sendMessage, 
    sendFileMessage,
    startTyping, 
    stopTyping 
  } = useChat(chatId, currentUserId, token);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = (content) => {
    sendMessage(content, receiverId);
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      sendFileMessage(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="spinner"></div>
        <p>جاري تحميل المحادثة...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <p>خطأ في تحميل المحادثة: {error}</p>
        <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
      </div>
    );
  }

  return (
    <div className="chat-screen">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <h2>{receiverName}</h2>
          <span className="online-status">متصل</span>
        </div>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>ابدأ المحادثة الآن! 💬</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <MessageBubble
              key={message._id || index}
              message={message}
              isOwn={message.sender._id === currentUserId}
            />
          ))
        )}
        
        {/* Typing Indicator */}
        {typing && (
          <TypingIndicator userName={typing} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <MessageInput
        onSendMessage={handleSendMessage}
        onStartTyping={startTyping}
        onStopTyping={stopTyping}
        onFileUpload={openFileDialog}
      />
      
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        accept="image/*,audio/*,video/*,.pdf,.doc,.docx,.txt"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ChatScreen;
```

### **MessageBubble.jsx:**
```jsx
import React from 'react';
import './MessageBubble.css';

const MessageBubble = ({ message, isOwn }) => {
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      <div className="message-content">
        <p>{message.content}</p>
        <div className="message-meta">
          <span className="message-time">
            {formatTime(message.sentAt)}
          </span>
          {isOwn && (
            <span className={`read-status ${message.isRead ? 'read' : 'unread'}`}>
              {message.isRead ? '✓✓' : '✓'}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
```

### **MessageInput.jsx:**
```jsx
import React, { useState, useRef } from 'react';
import './MessageInput.css';

const MessageInput = ({ onSendMessage, onStartTyping, onStopTyping, onFileUpload }) => {
  const [message, setMessage] = useState('');
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);

    // Handle typing indicators
    if (value && !isTypingRef.current) {
      onStartTyping();
      isTypingRef.current = true;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        onStopTyping();
        isTypingRef.current = false;
      }
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (message.trim()) {
      onSendMessage(message.trim());
      setMessage('');
      
      // Stop typing indicator
      if (isTypingRef.current) {
        onStopTyping();
        isTypingRef.current = false;
      }
      
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    }
  };

  return (
    <form className="message-input-form" onSubmit={handleSubmit}>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={handleInputChange}
          placeholder="اكتب رسالتك هنا..."
          className="message-input"
          autoComplete="off"
        />
        <button 
          type="button"
          className="attachment-button"
          onClick={onFileUpload}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5a2.5 2.5 0 0 1 5 0v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5a2.5 2.5 0 0 0 5 0V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.31 2.69 6 6 6s6-2.69 6-6V6h-2.5z"/>
          </svg>
        </button>
        <button 
          type="submit" 
          className="send-button"
          disabled={!message.trim()}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>
    </form>
  );
};

export default MessageInput;
```

### **TypingIndicator.jsx:**
```jsx
import React from 'react';
import './TypingIndicator.css';

const TypingIndicator = ({ userName }) => {
  return (
    <div className="typing-indicator">
      <div className="typing-bubble">
        <span className="typing-text">{userName} يكتب</span>
        <div className="typing-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;
```

### **ChatList.jsx:**
```jsx
import React, { useState, useEffect } from 'react';
import { ChatApiService } from '../services/ChatApiService';
import { useChatSocket } from '../hooks/useChatSocket';
import './ChatList.css';

const ChatList = ({ currentUserId, token, onChatSelect }) => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const { addEventListener } = useChatSocket(currentUserId, token);

  useEffect(() => {
    loadChats();
    loadUnreadCount();
  }, []);

  useEffect(() => {
    // Listen for new messages to update chat list
    const unsubscribe = addEventListener('new_message', (data) => {
      setChats(prev => prev.map(chat => 
        chat._id === data.chatId 
          ? { 
              ...chat, 
              lastMessage: data.message,
              unreadCount: chat.participants.find(p => p._id === currentUserId) 
                ? chat.unreadCount + 1 
                : chat.unreadCount
            }
          : chat
      ));
      
      // Update total unread count
      loadUnreadCount();
    });

    return unsubscribe;
  }, [addEventListener, currentUserId]);

  const loadChats = async () => {
    setLoading(true);
    const result = await ChatApiService.getUserChats();
    
    if (result.success) {
      setChats(result.data.chats || []);
    }
    setLoading(false);
  };

  const loadUnreadCount = async () => {
    const result = await ChatApiService.getUnreadCount();
    if (result.success) {
      setUnreadCount(result.count);
    }
  };

  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('ar-EG', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } else {
      return date.toLocaleDateString('ar-EG');
    }
  };

  const getOtherParticipant = (chat) => {
    return chat.participants.find(p => p._id !== currentUserId);
  };

  if (loading) {
    return (
      <div className="chat-list-loading">
        <div className="spinner"></div>
        <p>جاري تحميل المحادثات...</p>
      </div>
    );
  }

  return (
    <div className="chat-list">
      <div className="chat-list-header">
        <h2>الرسائل</h2>
        {unreadCount > 0 && (
          <span className="unread-badge">{unreadCount}</span>
        )}
      </div>

      <div className="chat-list-content">
        {chats.length === 0 ? (
          <div className="no-chats">
            <p>لا توجد محادثات حتى الآن</p>
          </div>
        ) : (
          chats.map(chat => {
            const otherUser = getOtherParticipant(chat);
            return (
              <div
                key={chat._id}
                className="chat-item"
                onClick={() => onChatSelect(chat._id, otherUser._id, otherUser.name)}
              >
                <div className="chat-avatar">
                  <img 
                    src={otherUser.profileImage || '/default-avatar.png'} 
                    alt={otherUser.name}
                  />
                </div>
                
                <div className="chat-info">
                  <div className="chat-header">
                    <h3>{otherUser.name}</h3>
                    <span className="chat-time">
                      {formatLastMessageTime(chat.lastMessage?.sentAt)}
                    </span>
                  </div>
                  
                  <div className="chat-preview">
                    <p className="last-message">
                      {chat.lastMessage?.content || 'ابدأ المحادثة'}
                    </p>
                    {chat.unreadCount > 0 && (
                      <span className="unread-count">{chat.unreadCount}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ChatList;
```

---

## 🎨 **CSS Styles**

### **ChatScreen.css:**
```css
.chat-screen {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.chat-header {
  background: #fff;
  padding: 1rem;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.chat-header-info h2 {
  margin: 0;
  font-size: 1.2rem;
  color: #333;
}

.online-status {
  color: #4CAF50;
  font-size: 0.9rem;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.no-messages {
  text-align: center;
  margin-top: 2rem;
  color: #666;
}

.chat-loading, .chat-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e0e0e0;
  border-top: 4px solid #2196F3;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

### **MessageBubble.css:**
```css
.message-bubble {
  display: flex;
  margin-bottom: 0.5rem;
}

.message-bubble.own {
  justify-content: flex-end;
}

.message-bubble.other {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  position: relative;
}

.message-bubble.own .message-content {
  background: #2196F3;
  color: white;
  border-bottom-right-radius: 4px;
}

.message-bubble.other .message-content {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.message-content p {
  margin: 0 0 0.25rem 0;
  line-height: 1.4;
  word-wrap: break-word;
}

.message-meta {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.25rem;
  font-size: 0.75rem;
  opacity: 0.7;
}

.message-bubble.other .message-meta {
  justify-content: flex-start;
}

.read-status.read {
  color: #4CAF50;
}

.read-status.unread {
  color: #ccc;
}
```

### **MessageInput.css:**
```css
.message-input-form {
  background: white;
  padding: 1rem;
  border-top: 1px solid #e0e0e0;
}

.input-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  border-radius: 25px;
  padding: 0.5rem;
}

.message-input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 0.5rem 1rem;
  font-size: 1rem;
  outline: none;
  direction: rtl;
}

.message-input::placeholder {
  color: #999;
}

.send-button {
  background: #2196F3;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: background 0.3s;
}

.send-button:hover:not(:disabled) {
  background: #1976D2;
}

.send-button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.attachment-button {
  background: #f5f5f5;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  cursor: pointer;
  transition: background 0.3s;
}

.attachment-button:hover {
  background: #e0e0e0;
}
```

### **TypingIndicator.css:**
```css
.typing-indicator {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0.5rem;
}

.typing-bubble {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  border-bottom-left-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.typing-text {
  font-size: 0.9rem;
  color: #666;
}

.typing-dots {
  display: flex;
  gap: 2px;
}

.typing-dots span {
  width: 4px;
  height: 4px;
  background: #999;
  border-radius: 50%;
  animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-dots span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes typing {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}
```

---

## 🚀 **Usage Example**

### **App.jsx:**
```jsx
import React, { useState, useEffect } from 'react';
import ChatList from './components/ChatList';
import ChatScreen from './components/ChatScreen';
import { useChatSocket } from './hooks/useChatSocket';

function App() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [token, setToken] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);

  useEffect(() => {
    // Get user data from localStorage or your auth system
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    const authToken = localStorage.getItem('authToken');
    
    if (userData._id && authToken) {
      setCurrentUserId(userData._id);
      setToken(authToken);
    }
  }, []);

  // Initialize socket connection
  useChatSocket(currentUserId, token);

  const handleChatSelect = (chatId, receiverId, receiverName) => {
    setSelectedChat({ chatId, receiverId, receiverName });
  };

  const handleBackToList = () => {
    setSelectedChat(null);
  };

  if (!currentUserId || !token) {
    return (
      <div className="auth-required">
        <p>يرجى تسجيل الدخول أولاً</p>
      </div>
    );
  }

  return (
    <div className="app">
      {selectedChat ? (
        <ChatScreen
          chatId={selectedChat.chatId}
          receiverId={selectedChat.receiverId}
          receiverName={selectedChat.receiverName}
          currentUserId={currentUserId}
          token={token}
          onBack={handleBackToList}
        />
      ) : (
        <ChatList
          currentUserId={currentUserId}
          token={token}
          onChatSelect={handleChatSelect}
        />
      )}
    </div>
  );
}

export default App;
```

---

## 🔐 **Authentication Utils**

### **auth.js:**
```javascript
// Get current user data
export const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
  } catch {
    return null;
  }
};

// Get auth token
export const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  return !!(token && user);
};

// Logout
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userData');
  window.location.href = '/login';
};
```

---

## 📱 **Important Notes**

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
- `GET /api/chat/unread-count` - عدد الرسائل غير المقروءة

### ✅ **Authentication:**
- استخدم JWT Token في الـ Headers
- `Authorization: Bearer {token}`

### ✅ **State Management:**
- استخدم React Hooks للحالة المحلية
- يمكن دمجه مع Redux أو Zustand حسب الحاجة

---

## 🎯 **Ready to Use!**

هذا الملف يحتوي على كل ما يحتاجه React Developer لربط الشات بسهولة!

**نسخ الملف وابدأ الاستخدام مباشرة! 🚀**

### 📦 **Installation Command:**
```bash
npm install socket.io-client axios
```

### 🔧 **Quick Start:**
1. انسخ الـ Services والـ Hooks
2. انسخ الـ Components والـ CSS
3. اربط الـ Authentication
4. ابدأ الاستخدام! ✨