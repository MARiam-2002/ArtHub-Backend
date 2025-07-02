import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import chatModel from '../../DB/models/chat.model.js';
import messageModel from '../../DB/models/message.model.js';
import userModel from '../../DB/models/user.model.js';

// Mock Socket.io
jest.mock('../../src/utils/socketService.js', () => ({
  emitToUser: jest.fn(),
  emitToRoom: jest.fn(),
  joinRoom: jest.fn(),
  leaveRoom: jest.fn()
}));

// Mock push notifications
jest.mock('../../src/utils/pushNotifications.js', () => ({
  sendPushNotification: jest.fn().mockResolvedValue(true)
}));

describe('Chat Controller', () => {
  let req, res, next;
  let testUser1, testUser2, testChat, testMessage;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/arthub_test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clean up database
    await chatModel.deleteMany({});
    await messageModel.deleteMany({});
    await userModel.deleteMany({});

    // Create test users
    testUser1 = await userModel.create({
      displayName: 'Test User 1',
      email: 'user1@test.com',
      password: 'password123',
      isEmailVerified: true
    });

    testUser2 = await userModel.create({
      displayName: 'Test User 2',
      email: 'user2@test.com',
      password: 'password123',
      isEmailVerified: true
    });

    // Create test chat
    testChat = await chatModel.create({
      participants: [testUser1._id, testUser2._id]
    });

    // Create test message
    testMessage = await messageModel.create({
      chat: testChat._id,
      sender: testUser1._id,
      content: 'Test message',
      messageType: 'text'
    });

    // Mock request, response, and next
    req = {
      user: { _id: testUser1._id },
      params: {},
      query: {},
      body: {}
    };

    res = {
      success: jest.fn(),
      error: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  describe('getUserChats', () => {
    it('should get user chats successfully', async () => {
      const { getUserChats } = await import('../../src/modules/chat/chat.controller.js');
      
      req.query = { page: 1, limit: 20 };

      await getUserChats(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          chats: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'تم جلب المحادثات بنجاح'
      );
    });

    it('should handle pagination correctly', async () => {
      const { getUserChats } = await import('../../src/modules/chat/chat.controller.js');
      
      req.query = { page: 2, limit: 10 };

      await getUserChats(req, res, next);

      expect(res.success).toHaveBeenCalled();
    });

    it('should filter chats by search query', async () => {
      const { getUserChats } = await import('../../src/modules/chat/chat.controller.js');
      
      req.query = { search: 'Test User' };

      await getUserChats(req, res, next);

      expect(res.success).toHaveBeenCalled();
    });
  });

  describe('createChat', () => {
    it('should create a new chat successfully', async () => {
      const { createChat } = await import('../../src/modules/chat/chat.controller.js');
      
      // Create a third user to chat with
      const testUser3 = await userModel.create({
        displayName: 'Test User 3',
        email: 'user3@test.com',
        password: 'password123',
        isEmailVerified: true
      });

      req.body = { participantId: testUser3._id.toString() };

      await createChat(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(Object),
          participants: expect.any(Array)
        }),
        'تم إنشاء المحادثة بنجاح'
      );
    });

    it('should return existing chat if already exists', async () => {
      const { createChat } = await import('../../src/modules/chat/chat.controller.js');
      
      req.body = { participantId: testUser2._id.toString() };

      await createChat(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: testChat._id
        }),
        'المحادثة موجودة بالفعل'
      );
    });

    it('should handle invalid participant ID', async () => {
      const { createChat } = await import('../../src/modules/chat/chat.controller.js');
      
      req.body = { participantId: new mongoose.Types.ObjectId().toString() };

      await createChat(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'المستخدم غير موجود'
        })
      );
    });

    it('should prevent creating chat with self', async () => {
      const { createChat } = await import('../../src/modules/chat/chat.controller.js');
      
      req.body = { participantId: testUser1._id.toString() };

      await createChat(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: 'لا يمكن إنشاء محادثة مع نفسك'
        })
      );
    });
  });

  describe('getMessages', () => {
    it('should get chat messages successfully', async () => {
      const { getMessages } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: testChat._id.toString() };
      req.query = { page: 1, limit: 50 };

      await getMessages(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'تم جلب الرسائل بنجاح'
      );
    });

    it('should handle non-participant access', async () => {
      const { getMessages } = await import('../../src/modules/chat/chat.controller.js');
      
      // Create another user who is not a participant
      const testUser3 = await userModel.create({
        displayName: 'Test User 3',
        email: 'user3@test.com',
        password: 'password123',
        isEmailVerified: true
      });

      req.user = { _id: testUser3._id };
      req.params = { chatId: testChat._id.toString() };

      await getMessages(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'ليس لديك صلاحية للوصول لهذه المحادثة'
        })
      );
    });

    it('should handle invalid chat ID', async () => {
      const { getMessages } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: new mongoose.Types.ObjectId().toString() };

      await getMessages(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'المحادثة غير موجودة'
        })
      );
    });

    it('should filter messages by date range', async () => {
      const { getMessages } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: testChat._id.toString() };
      req.query = { 
        before: new Date().toISOString(),
        after: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      };

      await getMessages(req, res, next);

      expect(res.success).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const { sendMessage } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: testChat._id.toString() };
      req.body = { 
        content: 'New test message',
        messageType: 'text'
      };

      await sendMessage(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(Object),
          content: 'New test message',
          sender: testUser1._id
        }),
        'تم إرسال الرسالة بنجاح'
      );
    });

    it('should handle non-participant sending message', async () => {
      const { sendMessage } = await import('../../src/modules/chat/chat.controller.js');
      
      // Create another user who is not a participant
      const testUser3 = await userModel.create({
        displayName: 'Test User 3',
        email: 'user3@test.com',
        password: 'password123',
        isEmailVerified: true
      });

      req.user = { _id: testUser3._id };
      req.params = { chatId: testChat._id.toString() };
      req.body = { content: 'Unauthorized message' };

      await sendMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'ليس لديك صلاحية للإرسال في هذه المحادثة'
        })
      );
    });

    it('should handle empty message content', async () => {
      const { sendMessage } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: testChat._id.toString() };
      req.body = { content: '' };

      await sendMessage(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400
        })
      );
    });

    it('should update chat lastMessage', async () => {
      const { sendMessage } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: testChat._id.toString() };
      req.body = { content: 'Latest message' };

      await sendMessage(req, res, next);

      const updatedChat = await chatModel.findById(testChat._id).populate('lastMessage');
      expect(updatedChat.lastMessage.content).toBe('Latest message');
    });
  });

  describe('markAsRead', () => {
    it('should mark messages as read successfully', async () => {
      const { markAsRead } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: testChat._id.toString() };

      await markAsRead(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        null,
        'تم تحديث حالة القراءة بنجاح'
      );
    });

    it('should handle non-participant marking as read', async () => {
      const { markAsRead } = await import('../../src/modules/chat/chat.controller.js');
      
      // Create another user who is not a participant
      const testUser3 = await userModel.create({
        displayName: 'Test User 3',
        email: 'user3@test.com',
        password: 'password123',
        isEmailVerified: true
      });

      req.user = { _id: testUser3._id };
      req.params = { chatId: testChat._id.toString() };

      await markAsRead(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'ليس لديك صلاحية للوصول لهذه المحادثة'
        })
      );
    });
  });

  describe('deleteChat', () => {
    it('should delete chat successfully', async () => {
      const { deleteChat } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: testChat._id.toString() };

      await deleteChat(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        null,
        'تم حذف المحادثة بنجاح'
      );

      const deletedChat = await chatModel.findById(testChat._id);
      expect(deletedChat).toBeNull();
    });

    it('should handle non-participant deleting chat', async () => {
      const { deleteChat } = await import('../../src/modules/chat/chat.controller.js');
      
      // Create another user who is not a participant
      const testUser3 = await userModel.create({
        displayName: 'Test User 3',
        email: 'user3@test.com',
        password: 'password123',
        isEmailVerified: true
      });

      req.user = { _id: testUser3._id };
      req.params = { chatId: testChat._id.toString() };

      await deleteChat(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          message: 'ليس لديك صلاحية لحذف هذه المحادثة'
        })
      );
    });
  });

  describe('getSocketToken', () => {
    it('should generate socket token successfully', async () => {
      const { getSocketToken } = await import('../../src/modules/chat/chat.controller.js');
      
      await getSocketToken(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          token: expect.any(String),
          userId: testUser1._id.toString(),
          expiresAt: expect.any(Date)
        }),
        'تم إنشاء رمز الاتصال بنجاح'
      );
    });

    it('should generate unique tokens for each request', async () => {
      const { getSocketToken } = await import('../../src/modules/chat/chat.controller.js');
      
      await getSocketToken(req, res, next);
      const firstCall = res.success.mock.calls[0][0];

      res.success.mockClear();
      
      await getSocketToken(req, res, next);
      const secondCall = res.success.mock.calls[0][0];

      expect(firstCall.token).not.toBe(secondCall.token);
    });
  });

  describe('Validation Tests', () => {
    it('should validate chat creation data', async () => {
      const { createChatSchema } = await import('../../src/modules/chat/chat.validation.js');
      
      const validData = { participantId: testUser2._id.toString() };
      const { error } = createChatSchema.body.validate(validData);
      
      expect(error).toBeUndefined();
    });

    it('should reject invalid participant ID format', async () => {
      const { createChatSchema } = await import('../../src/modules/chat/chat.validation.js');
      
      const invalidData = { participantId: 'invalid-id' };
      const { error } = createChatSchema.body.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('معرف المستخدم غير صحيح');
    });

    it('should validate message sending data', async () => {
      const { sendMessageSchema } = await import('../../src/modules/chat/chat.validation.js');
      
      const validData = { 
        content: 'Valid message content',
        messageType: 'text'
      };
      const { error } = sendMessageSchema.body.validate(validData);
      
      expect(error).toBeUndefined();
    });

    it('should reject empty message content', async () => {
      const { sendMessageSchema } = await import('../../src/modules/chat/chat.validation.js');
      
      const invalidData = { content: '' };
      const { error } = sendMessageSchema.body.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('الرسالة لا يمكن أن تكون فارغة');
    });

    it('should reject message content exceeding limit', async () => {
      const { sendMessageSchema } = await import('../../src/modules/chat/chat.validation.js');
      
      const invalidData = { content: 'a'.repeat(1001) };
      const { error } = sendMessageSchema.body.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('1000 حرف على الأكثر');
    });

    it('should validate chat ID parameter', async () => {
      const { chatIdParamSchema } = await import('../../src/modules/chat/chat.validation.js');
      
      const validData = { chatId: testChat._id.toString() };
      const { error } = chatIdParamSchema.params.validate(validData);
      
      expect(error).toBeUndefined();
    });

    it('should reject invalid chat ID format', async () => {
      const { chatIdParamSchema } = await import('../../src/modules/chat/chat.validation.js');
      
      const invalidData = { chatId: 'invalid-chat-id' };
      const { error } = chatIdParamSchema.params.validate(invalidData);
      
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('معرف المحادثة غير صحيح');
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      const { getUserChats } = await import('../../src/modules/chat/chat.controller.js');
      
      // Mock database error
      jest.spyOn(chatModel, 'find').mockImplementationOnce(() => {
        throw new Error('Database connection error');
      });

      await getUserChats(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Database connection error')
        })
      );
    });

    it('should handle invalid ObjectId format', async () => {
      const { getMessages } = await import('../../src/modules/chat/chat.controller.js');
      
      req.params = { chatId: 'invalid-object-id' };

      await getMessages(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400
        })
      );
    });
  });
});
