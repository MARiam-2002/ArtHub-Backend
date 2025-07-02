import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as notificationController from '../../src/modules/notification/notification.controller.js';

// Mock dependencies
jest.mock('../../../DB/models/notification.model.js');
jest.mock('../../../DB/models/user.model.js');
jest.mock('../../src/utils/asyncHandler.js');
jest.mock('../../src/utils/pagination.js');
jest.mock('../../src/utils/pushNotifications.js');

import notificationModel from '../../DB/models/notification.model.js';
import userModel from '../../DB/models/user.model.js';
import { getPaginationParams } from '../../src/utils/pagination.js';
import { sendPushNotificationToUser } from '../../src/utils/pushNotifications.js';

describe('Notification Controller Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
        email: 'test@example.com',
        role: 'user'
      },
      params: {},
      body: {},
      query: {}
    };

    res = {
      success: jest.fn(),
      fail: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('getUserNotifications', () => {
    it('should get user notifications successfully with default parameters', async () => {
      // Setup
      const mockNotifications = [
        {
          _id: 'notif1',
          title: { ar: 'إشعار 1', en: 'Notification 1' },
          message: { ar: 'رسالة 1', en: 'Message 1' },
          type: 'message',
          isRead: false,
          sender: { _id: 'sender1', displayName: 'أحمد' },
          data: {},
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockNotifications)
      });
      notificationModel.countDocuments.mockResolvedValueOnce(1).mockResolvedValueOnce(1);

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(getPaginationParams).toHaveBeenCalledWith({ page: 1, limit: 20 });
      expect(notificationModel.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              _id: 'notif1',
              title: 'إشعار 1',
              message: 'رسالة 1'
            })
          ]),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            unreadCount: 1
          }),
          summary: expect.objectContaining({
            total: 1,
            unread: 1,
            read: 0
          })
        }),
        'تم جلب الإشعارات بنجاح'
      );
    });

    it('should filter notifications by type', async () => {
      // Setup
      req.query = { type: 'message', language: 'en' };
      
      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      notificationModel.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(notificationModel.find).toHaveBeenCalledWith({
        user: 'user123',
        type: 'message'
      });
      expect(res.success).toHaveBeenCalledWith(
        expect.anything(),
        'Notifications retrieved successfully'
      );
    });

    it('should filter notifications by date range', async () => {
      // Setup
      req.query = {
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31'
      };

      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      notificationModel.countDocuments.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(notificationModel.find).toHaveBeenCalledWith({
        user: 'user123',
        createdAt: {
          $gte: new Date('2024-01-01'),
          $lte: new Date('2024-12-31')
        }
      });
    });

    it('should handle database errors gracefully', async () => {
      // Setup
      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء جلب الإشعارات',
        500
      );
      expect(consoleSpy).toHaveBeenCalledWith('خطأ في جلب الإشعارات:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('markNotificationAsRead', () => {
    it('should mark notification as read successfully', async () => {
      // Setup
      req.params = { notificationId: 'notif123' };
      const mockNotification = {
        _id: 'notif123',
        title: { ar: 'إشعار', en: 'Notification' },
        message: { ar: 'رسالة', en: 'Message' },
        type: 'message',
        isRead: true,
        readAt: new Date(),
        data: {},
        createdAt: new Date()
      };

      notificationModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockNotification)
      });

      // Execute
      await notificationController.markNotificationAsRead(req, res);

      // Assert
      expect(notificationModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'notif123', user: 'user123', isRead: false },
        { isRead: true, readAt: expect.any(Date) },
        { new: true }
      );
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'notif123',
          title: 'إشعار',
          isRead: true
        }),
        'تم وضع علامة مقروء على الإشعار بنجاح'
      );
    });

    it('should return 404 if notification not found', async () => {
      // Setup
      req.params = { notificationId: 'notif123' };
      notificationModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await notificationController.markNotificationAsRead(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'الإشعار غير موجود أو مقروء بالفعل',
        404
      );
    });

    it('should handle database errors', async () => {
      // Setup
      req.params = { notificationId: 'notif123' };
      notificationModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Database error'))
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      await notificationController.markNotificationAsRead(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء تحديث حالة الإشعار',
        500
      );

      consoleSpy.mockRestore();
    });
  });

  describe('markAllNotificationsAsRead', () => {
    it('should mark all notifications as read successfully', async () => {
      // Setup
      notificationModel.updateMany.mockResolvedValue({ modifiedCount: 5 });

      // Execute
      await notificationController.markAllNotificationsAsRead(req, res);

      // Assert
      expect(notificationModel.updateMany).toHaveBeenCalledWith(
        { user: 'user123', isRead: false },
        { isRead: true, readAt: expect.any(Date) }
      );
      expect(res.success).toHaveBeenCalledWith(
        {
          modifiedCount: 5,
          message: 'تم وضع علامة مقروء على 5 إشعار'
        },
        'تم وضع علامة مقروء على جميع الإشعارات بنجاح'
      );
    });

    it('should handle database errors', async () => {
      // Setup
      notificationModel.updateMany.mockRejectedValue(new Error('Database error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      await notificationController.markAllNotificationsAsRead(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء تحديث الإشعارات',
        500
      );

      consoleSpy.mockRestore();
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification successfully', async () => {
      // Setup
      req.params = { notificationId: 'notif123' };
      const mockNotification = { _id: 'notif123' };
      notificationModel.findOneAndDelete.mockResolvedValue(mockNotification);

      // Execute
      await notificationController.deleteNotification(req, res);

      // Assert
      expect(notificationModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'notif123',
        user: 'user123'
      });
      expect(res.success).toHaveBeenCalledWith(
        { deletedId: 'notif123' },
        'تم حذف الإشعار بنجاح'
      );
    });

    it('should return 404 if notification not found', async () => {
      // Setup
      req.params = { notificationId: 'notif123' };
      notificationModel.findOneAndDelete.mockResolvedValue(null);

      // Execute
      await notificationController.deleteNotification(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'الإشعار غير موجود',
        404
      );
    });
  });

  describe('deleteAllNotifications', () => {
    it('should delete all notifications successfully', async () => {
      // Setup
      notificationModel.deleteMany.mockResolvedValue({ deletedCount: 10 });

      // Execute
      await notificationController.deleteAllNotifications(req, res);

      // Assert
      expect(notificationModel.deleteMany).toHaveBeenCalledWith({ user: 'user123' });
      expect(res.success).toHaveBeenCalledWith(
        {
          deletedCount: 10,
          message: 'تم حذف 10 إشعار'
        },
        'تم حذف جميع الإشعارات بنجاح'
      );
    });
  });

  describe('registerFCMToken', () => {
    it('should register new FCM token successfully', async () => {
      // Setup
      req.body = { token: 'fcm_token_123', deviceType: 'android' };
      const mockUser = {
        _id: 'user123',
        fcmTokens: []
      };
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Execute
      await notificationController.registerFCMToken(req, res);

      // Assert
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $push: {
            fcmTokens: {
              token: 'fcm_token_123',
              deviceType: 'android',
              addedAt: expect.any(Date),
              isActive: true
            }
          },
          $set: { lastActiveAt: expect.any(Date) }
        }
      );
      expect(res.success).toHaveBeenCalledWith(
        {
          token: 'fcm_token_123',
          deviceType: 'android',
          registered: true
        },
        'تم تسجيل رمز الإشعارات بنجاح'
      );
    });

    it('should update existing FCM token', async () => {
      // Setup
      req.body = { token: 'fcm_token_123', deviceType: 'ios' };
      const mockUser = {
        _id: 'user123',
        fcmTokens: [{ token: 'fcm_token_123', deviceType: 'android' }]
      };
      userModel.findById.mockResolvedValue(mockUser);
      userModel.findOneAndUpdate.mockResolvedValue(mockUser);

      // Execute
      await notificationController.registerFCMToken(req, res);

      // Assert
      expect(userModel.findOneAndUpdate).toHaveBeenCalledWith(
        { _id: 'user123', 'fcmTokens.token': 'fcm_token_123' },
        {
          $set: {
            'fcmTokens.$.isActive': true,
            'fcmTokens.$.lastUsedAt': expect.any(Date),
            lastActiveAt: expect.any(Date)
          }
        }
      );
      expect(res.success).toHaveBeenCalledWith(
        {
          token: 'fcm_token_123',
          deviceType: 'ios',
          registered: false
        },
        'تم تسجيل رمز الإشعارات بنجاح'
      );
    });

    it('should return 404 if user not found', async () => {
      // Setup
      req.body = { token: 'fcm_token_123' };
      userModel.findById.mockResolvedValue(null);

      // Execute
      await notificationController.registerFCMToken(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'المستخدم غير موجود',
        404
      );
    });
  });

  describe('unregisterFCMToken', () => {
    it('should unregister FCM token successfully', async () => {
      // Setup
      req.body = { token: 'fcm_token_123' };
      const mockUser = { _id: 'user123' };
      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Execute
      await notificationController.unregisterFCMToken(req, res);

      // Assert
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $pull: { fcmTokens: { token: 'fcm_token_123' } },
          $set: { lastActiveAt: expect.any(Date) }
        },
        { new: true }
      );
      expect(res.success).toHaveBeenCalledWith(
        {
          token: 'fcm_token_123',
          unregistered: true
        },
        'تم إلغاء تسجيل رمز الإشعارات بنجاح'
      );
    });

    it('should return 404 if user not found', async () => {
      // Setup
      req.body = { token: 'fcm_token_123' };
      userModel.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await notificationController.unregisterFCMToken(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'المستخدم غير موجود',
        404
      );
    });
  });

  describe('createNotification', () => {
    it('should create notification successfully', async () => {
      // Setup
      req.body = {
        recipient: 'recipient123',
        title: { ar: 'إشعار جديد', en: 'New Notification' },
        message: { ar: 'رسالة جديدة', en: 'New Message' },
        type: 'message',
        sendPush: true
      };

      const mockRecipient = {
        _id: 'recipient123',
        language: 'ar',
        fcmTokens: [{ token: 'fcm_token_123' }]
      };
      const mockNotification = {
        _id: 'notif123',
        title: { ar: 'إشعار جديد', en: 'New Notification' },
        message: { ar: 'رسالة جديدة', en: 'New Message' },
        type: 'message',
        isRead: false,
        data: {},
        createdAt: new Date()
      };

      userModel.findById.mockResolvedValue(mockRecipient);
      notificationModel.create.mockResolvedValue(mockNotification);
      sendPushNotificationToUser.mockResolvedValue();

      // Execute
      await notificationController.createNotification(req, res);

      // Assert
      expect(notificationModel.create).toHaveBeenCalledWith({
        user: 'recipient123',
        sender: 'user123',
        title: { ar: 'إشعار جديد', en: 'New Notification' },
        message: { ar: 'رسالة جديدة', en: 'New Message' },
        type: 'message',
        ref: undefined,
        refModel: undefined,
        data: {}
      });
      expect(sendPushNotificationToUser).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'notif123',
          title: 'إشعار جديد',
          message: 'رسالة جديدة'
        }),
        'تم إنشاء الإشعار بنجاح',
        201
      );
    });

    it('should return 404 if recipient not found', async () => {
      // Setup
      req.body = {
        recipient: 'recipient123',
        title: { ar: 'إشعار جديد' },
        message: { ar: 'رسالة جديدة' }
      };
      userModel.findById.mockResolvedValue(null);

      // Execute
      await notificationController.createNotification(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'المستخدم المتلقي غير موجود',
        404
      );
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send bulk notifications successfully', async () => {
      // Setup
      req.body = {
        recipients: ['user1', 'user2', 'user3'],
        title: { ar: 'إشعار عام', en: 'General Notification' },
        message: { ar: 'رسالة عامة', en: 'General Message' },
        type: 'system'
      };

      const mockUsers = [
        { _id: 'user1', language: 'ar', fcmTokens: [{ token: 'token1' }] },
        { _id: 'user2', language: 'en', fcmTokens: [{ token: 'token2' }] }
      ];
      const mockNotifications = [
        { _id: 'notif1', user: 'user1', createdAt: new Date() },
        { _id: 'notif2', user: 'user2', createdAt: new Date() }
      ];

      userModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers)
      });
      notificationModel.insertMany.mockResolvedValue(mockNotifications);
      sendPushNotificationToUser.mockResolvedValue();

      // Execute
      await notificationController.sendBulkNotifications(req, res);

      // Assert
      expect(notificationModel.insertMany).toHaveBeenCalledWith([
        {
          user: 'user1',
          sender: 'user123',
          title: { ar: 'إشعار عام', en: 'General Notification' },
          message: { ar: 'رسالة عامة', en: 'General Message' },
          type: 'system',
          data: {}
        },
        {
          user: 'user2',
          sender: 'user123',
          title: { ar: 'إشعار عام', en: 'General Notification' },
          message: { ar: 'رسالة عامة', en: 'General Message' },
          type: 'system',
          data: {}
        }
      ]);
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          totalSent: 2,
          totalRecipients: 3,
          validRecipients: 2,
          invalidRecipients: 1
        }),
        'تم إرسال 2 إشعار بنجاح',
        201
      );
    });

    it('should return 400 if no valid recipients found', async () => {
      // Setup
      req.body = {
        recipients: ['invalid1', 'invalid2'],
        title: { ar: 'إشعار' },
        message: { ar: 'رسالة' }
      };
      userModel.find.mockReturnValue({
        select: jest.fn().mockResolvedValue([])
      });

      // Execute
      await notificationController.sendBulkNotifications(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'لا يوجد مستخدمون صالحون للإرسال',
        400
      );
    });
  });

  describe('getNotificationStats', () => {
    it('should get notification statistics successfully', async () => {
      // Setup
      req.query = { period: 'month', groupBy: 'type' };

      notificationModel.countDocuments
        .mockResolvedValueOnce(50) // total
        .mockResolvedValueOnce(10) // unread
        .mockResolvedValueOnce(40); // read

      notificationModel.aggregate.mockResolvedValue([
        { _id: 'message', count: 30 },
        { _id: 'system', count: 20 }
      ]);

      notificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([
          { type: 'message', isRead: false, createdAt: new Date() }
        ])
      });

      // Execute
      await notificationController.getNotificationStats(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: {
            total: 50,
            unread: 10,
            read: 40,
            readRate: '80.0%'
          },
          byType: {
            message: 30,
            system: 20
          },
          period: 'month'
        }),
        'تم جلب إحصائيات الإشعارات بنجاح'
      );
    });

    it('should handle different time periods', async () => {
      // Setup
      req.query = { period: 'week' };

      notificationModel.countDocuments
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(5);

      notificationModel.aggregate.mockResolvedValue([]);
      notificationModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      // Execute
      await notificationController.getNotificationStats(req, res);

      // Assert
      expect(notificationModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          user: 'user123',
          createdAt: expect.any(Object)
        })
      );
    });
  });

  describe('updateNotificationSettings', () => {
    it('should update notification settings successfully', async () => {
      // Setup
      req.body = {
        enablePush: true,
        enableEmail: false,
        categories: {
          messages: true,
          requests: false
        }
      };

      const mockUser = {
        notificationSettings: {
          enablePush: true,
          enableEmail: false,
          categories: {
            messages: true,
            requests: false
          },
          updatedAt: new Date()
        }
      };

      userModel.findByIdAndUpdate.mockResolvedValue(mockUser);

      // Execute
      await notificationController.updateNotificationSettings(req, res);

      // Assert
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $set: {
            notificationSettings: {
              enablePush: true,
              enableEmail: false,
              categories: {
                messages: true,
                requests: false
              },
              updatedAt: expect.any(Date)
            }
          }
        },
        { new: true, select: 'notificationSettings' }
      );
      expect(res.success).toHaveBeenCalledWith(
        mockUser.notificationSettings,
        'تم تحديث إعدادات الإشعارات بنجاح'
      );
    });

    it('should return 404 if user not found', async () => {
      // Setup
      req.body = { enablePush: true };
      userModel.findByIdAndUpdate.mockResolvedValue(null);

      // Execute
      await notificationController.updateNotificationSettings(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'المستخدم غير موجود',
        404
      );
    });
  });

  describe('getNotificationSettings', () => {
    it('should get notification settings successfully', async () => {
      // Setup
      const mockUser = {
        notificationSettings: {
          enablePush: true,
          enableEmail: false,
          categories: {
            messages: true,
            requests: true
          }
        }
      };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Execute
      await notificationController.getNotificationSettings(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        mockUser.notificationSettings,
        'تم جلب إعدادات الإشعارات بنجاح'
      );
    });

    it('should return default settings if user has no settings', async () => {
      // Setup
      const mockUser = { notificationSettings: null };
      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Execute
      await notificationController.getNotificationSettings(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          enablePush: true,
          enableEmail: false,
          categories: expect.objectContaining({
            messages: true,
            requests: true,
            reviews: true
          })
        }),
        'تم جلب إعدادات الإشعارات بنجاح'
      );
    });
  });

  describe('createNotificationHelper', () => {
    it('should create notification using helper function', async () => {
      // Setup
      const title = { ar: 'إشعار مساعد', en: 'Helper Notification' };
      const message = { ar: 'رسالة مساعدة', en: 'Helper Message' };
      
      userModel.exists.mockResolvedValue(true);
      const mockNotification = {
        _id: 'notif123',
        title,
        message,
        type: 'system'
      };
      notificationModel.create.mockResolvedValue(mockNotification);
      
      const mockUser = {
        _id: 'recipient123',
        language: 'ar',
        fcmTokens: [{ token: 'token123' }]
      };
      userModel.findById.mockResolvedValue(mockUser);
      sendPushNotificationToUser.mockResolvedValue();

      // Execute
      const result = await notificationController.createNotificationHelper(
        'recipient123',
        title,
        message,
        'system',
        'sender123',
        { extra: 'data' },
        'ref123',
        'Message'
      );

      // Assert
      expect(result).toEqual(mockNotification);
      expect(notificationModel.create).toHaveBeenCalledWith({
        user: 'recipient123',
        sender: 'sender123',
        title,
        message,
        type: 'system',
        ref: 'ref123',
        refModel: 'Message',
        data: { extra: 'data' }
      });
      expect(sendPushNotificationToUser).toHaveBeenCalled();
    });

    it('should return null if recipient does not exist', async () => {
      // Setup
      userModel.exists.mockResolvedValue(false);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      const result = await notificationController.createNotificationHelper(
        'invalid_recipient',
        { ar: 'title' },
        { ar: 'message' }
      );

      // Assert
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'المستخدم المتلقي غير موجود - لا يمكن إنشاء الإشعار'
      );

      consoleSpy.mockRestore();
    });

    it('should handle push notification errors gracefully', async () => {
      // Setup
      userModel.exists.mockResolvedValue(true);
      const mockNotification = { _id: 'notif123' };
      notificationModel.create.mockResolvedValue(mockNotification);
      
      const mockUser = {
        _id: 'recipient123',
        fcmTokens: [{ token: 'token123' }]
      };
      userModel.findById.mockResolvedValue(mockUser);
      sendPushNotificationToUser.mockRejectedValue(new Error('Push error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      const result = await notificationController.createNotificationHelper(
        'recipient123',
        { ar: 'title' },
        { ar: 'message' }
      );

      // Assert
      expect(result).toEqual(mockNotification);
      expect(consoleSpy).toHaveBeenCalledWith(
        'خطأ في إرسال الإشعار الفوري:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Security Tests', () => {
    it('should only allow users to access their own notifications', async () => {
      // Setup
      req.user._id = 'user123';
      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      notificationModel.countDocuments.mockResolvedValue(0);

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(notificationModel.find).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'user123' })
      );
    });

    it('should only allow users to modify their own notifications', async () => {
      // Setup
      req.params = { notificationId: 'notif123' };
      req.user._id = 'user123';
      notificationModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await notificationController.markNotificationAsRead(req, res);

      // Assert
      expect(notificationModel.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ user: 'user123' }),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should validate notification ownership before deletion', async () => {
      // Setup
      req.params = { notificationId: 'notif123' };
      req.user._id = 'user123';
      notificationModel.findOneAndDelete.mockResolvedValue(null);

      // Execute
      await notificationController.deleteNotification(req, res);

      // Assert
      expect(notificationModel.findOneAndDelete).toHaveBeenCalledWith({
        _id: 'notif123',
        user: 'user123'
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle database connection errors', async () => {
      // Setup
      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء جلب الإشعارات',
        500
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid ObjectId in parameters', async () => {
      // Setup
      req.params = { notificationId: 'invalid_id' };
      notificationModel.findOneAndUpdate.mockReturnValue({
        lean: jest.fn().mockRejectedValue(new Error('Cast error'))
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Execute
      await notificationController.markNotificationAsRead(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء تحديث حالة الإشعار',
        500
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Language Support Tests', () => {
    it('should return notifications in Arabic by default', async () => {
      // Setup
      const mockNotifications = [{
        _id: 'notif1',
        title: { ar: 'عنوان عربي', en: 'English Title' },
        message: { ar: 'رسالة عربية', en: 'English Message' },
        type: 'message',
        isRead: false,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockNotifications)
      });
      notificationModel.countDocuments.mockResolvedValue(1);

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              title: 'عنوان عربي',
              message: 'رسالة عربية'
            })
          ])
        }),
        'تم جلب الإشعارات بنجاح'
      );
    });

    it('should return notifications in English when requested', async () => {
      // Setup
      req.query = { language: 'en' };
      const mockNotifications = [{
        _id: 'notif1',
        title: { ar: 'عنوان عربي', en: 'English Title' },
        message: { ar: 'رسالة عربية', en: 'English Message' },
        type: 'message',
        isRead: false,
        data: {},
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      getPaginationParams.mockReturnValue({ skip: 0 });
      notificationModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockNotifications)
      });
      notificationModel.countDocuments.mockResolvedValue(1);

      // Execute
      await notificationController.getUserNotifications(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          notifications: expect.arrayContaining([
            expect.objectContaining({
              title: 'English Title',
              message: 'English Message'
            })
          ])
        }),
        'Notifications retrieved successfully'
      );
    });
  });
});
