import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock dependencies first
const mockReportModel = {
  create: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  findById: jest.fn(),
  countDocuments: jest.fn(),
  deleteOne: jest.fn(),
  updateMany: jest.fn(),
  aggregate: jest.fn()
};

const mockUserModel = {
  find: jest.fn(),
  findById: jest.fn()
};

const mockArtworkModel = {
  findById: jest.fn()
};

const mockImageModel = {
  findById: jest.fn()
};

const mockNotificationHelper = jest.fn();

// Mock the modules
jest.unstable_mockModule('../../../DB/models/report.model.js', () => ({
  default: mockReportModel
}));

jest.unstable_mockModule('../../../DB/models/user.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../../DB/models/artwork.model.js', () => ({
  default: mockArtworkModel
}));

jest.unstable_mockModule('../../../DB/models/image.model.js', () => ({
  default: mockImageModel
}));

jest.unstable_mockModule('../../src/modules/notification/notification.controller.js', () => ({
  createNotificationHelper: mockNotificationHelper
}));

// Import the controller after mocking
const controller = await import('../../src/modules/report/report.controller.js');

describe('Report Controller Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
        role: 'user',
        email: 'test@example.com'
      },
      body: {},
      params: {},
      query: {},
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0')
    };

    res = {
      success: jest.fn(),
      fail: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn(),
      send: jest.fn()
    };

    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createReport', () => {
    beforeEach(() => {
      req.body = {
        contentType: 'artwork',
        contentId: '507f1f77bcf86cd799439011',
        reason: 'inappropriate',
        description: 'هذا المحتوى غير مناسب',
        priority: 'medium'
      };
    });

    it('should create report successfully for artwork', async () => {
      // Mock artwork exists
      mockArtworkModel.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        title: 'عمل فني',
        artist: 'artist123'
      });

      // Mock no existing report
      mockReportModel.findOne.mockResolvedValue(null);

      // Mock report creation
      const mockReport = { _id: 'report123', ...req.body };
      mockReportModel.create.mockResolvedValue(mockReport);

      // Mock admin users for notifications
      mockUserModel.find.mockResolvedValue([{ _id: 'admin1' }]);

      // Mock populated report
      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReport)
          })
        })
      });

      await controller.createReport(req, res, next);

      expect(mockReportModel.create).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        mockReport,
        'تم إرسال التقرير بنجاح، سيتم مراجعته قريباً',
        201
      );
    });

    it('should fail with invalid content ID', async () => {
      req.body.contentId = 'invalid_id';

      await controller.createReport(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'معرف المحتوى غير صالح', 400);
    });

    it('should fail when content does not exist', async () => {
      mockArtworkModel.findById.mockResolvedValue(null);

      await controller.createReport(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'المحتوى المبلغ عنه غير موجود', 404);
    });

    it('should fail when reporting own content', async () => {
      mockArtworkModel.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        title: 'عمل فني',
        artist: req.user._id
      });

      await controller.createReport(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'لا يمكنك الإبلاغ عن محتواك الخاص', 400);
    });

    it('should handle different content types', async () => {
      // Test image content type
      req.body.contentType = 'image';
      
      mockImageModel.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        title: 'صورة',
        user: 'user456'
      });

      mockReportModel.findOne.mockResolvedValue(null);
      mockReportModel.create.mockResolvedValue({ _id: 'report123' });
      mockUserModel.find.mockResolvedValue([]);
      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: 'report123' })
          })
        })
      });

      await controller.createReport(req, res, next);

      expect(mockImageModel.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439011');
      expect(res.success).toHaveBeenCalled();
    });
  });

  describe('getUserReports', () => {
    it('should get user reports successfully', async () => {
      req.query = { page: 1, limit: 20 };
      
      const mockReports = [
        { _id: 'report1', status: 'pending' },
        { _id: 'report2', status: 'resolved' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockReports)
              })
            })
          })
        })
      });

      mockReportModel.countDocuments.mockResolvedValue(2);
      mockReportModel.aggregate.mockResolvedValue([
        { _id: 'pending', count: 1 },
        { _id: 'resolved', count: 1 }
      ]);

      await controller.getUserReports(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          reports: mockReports,
          stats: { pending: 1, resolved: 1 }
        }),
        'تم جلب التقارير بنجاح'
      );
    });

    it('should filter reports by status', async () => {
      req.query.status = 'pending';

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      mockReportModel.countDocuments.mockResolvedValue(0);
      mockReportModel.aggregate.mockResolvedValue([]);

      await controller.getUserReports(req, res, next);

      expect(mockReportModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          reporter: req.user._id,
          status: 'pending'
        })
      );
    });

    it('should search in report descriptions', async () => {
      req.query.search = 'محتوى غير مناسب';

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      mockReportModel.countDocuments.mockResolvedValue(0);
      mockReportModel.aggregate.mockResolvedValue([]);

      await controller.getUserReports(req, res, next);

      expect(mockReportModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          $or: [
            { description: { $regex: 'محتوى غير مناسب', $options: 'i' } },
            { 'metadata.contentTitle': { $regex: 'محتوى غير مناسب', $options: 'i' } }
          ]
        })
      );
    });
  });

  describe('getReportById', () => {
    it('should get report details successfully for owner', async () => {
      req.params.reportId = '507f1f77bcf86cd799439011';
      
      const mockReport = {
        _id: '507f1f77bcf86cd799439011',
        reporter: { _id: req.user._id },
        status: 'pending'
      };

      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReport)
          })
        })
      });

      await controller.getReportById(req, res, next);

      expect(res.success).toHaveBeenCalledWith(mockReport, 'تم جلب تفاصيل التقرير بنجاح');
    });

    it('should get report details with related reports for admin', async () => {
      req.user.role = 'admin';
      
      const mockReport = {
        _id: '507f1f77bcf86cd799439011',
        reporter: { _id: 'other_user' },
        contentType: 'artwork',
        contentId: 'content123',
        status: 'pending'
      };

      const mockRelatedReports = [
        { _id: 'related1', reason: 'spam' }
      ];

      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReport)
          })
        })
      });

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockRelatedReports)
              })
            })
          })
        })
      });

      await controller.getReportById(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockReport,
          relatedReports: mockRelatedReports
        }),
        'تم جلب تفاصيل التقرير بنجاح'
      );
    });

    it('should fail with invalid report ID', async () => {
      req.params.reportId = 'invalid_id';

      await controller.getReportById(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'معرف التقرير غير صالح', 400);
    });

    it('should fail when report not found', async () => {
      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(null)
          })
        })
      });

      await controller.getReportById(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'التقرير غير موجود', 404);
    });

    it('should fail when user is not owner or admin', async () => {
      const mockReport = {
        _id: '507f1f77bcf86cd799439011',
        reporter: { _id: 'other_user' },
        status: 'pending'
      };

      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReport)
          })
        })
      });

      await controller.getReportById(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بعرض هذا التقرير', 403);
    });
  });

  describe('deleteReport', () => {
    beforeEach(() => {
      req.params.reportId = '507f1f77bcf86cd799439011';
    });

    it('should delete report successfully', async () => {
      const mockReport = {
        _id: '507f1f77bcf86cd799439011',
        reporter: req.user._id,
        status: 'pending'
      };

      mockReportModel.findOne.mockResolvedValue(mockReport);
      mockReportModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await controller.deleteReport(req, res, next);

      expect(mockReportModel.deleteOne).toHaveBeenCalledWith({ _id: '507f1f77bcf86cd799439011' });
      expect(res.success).toHaveBeenCalledWith(null, 'تم حذف التقرير بنجاح');
    });

    it('should fail with invalid report ID', async () => {
      req.params.reportId = 'invalid_id';

      await controller.deleteReport(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'معرف التقرير غير صالح', 400);
    });

    it('should fail when report cannot be deleted', async () => {
      mockReportModel.findOne.mockResolvedValue(null);

      await controller.deleteReport(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'التقرير غير موجود أو لا يمكن حذفه', 404);
    });
  });

  describe('getAllReports (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
      req.query = { page: 1, limit: 20 };
    });

    it('should get all reports successfully for admin', async () => {
      const mockReports = [
        { _id: 'report1', status: 'pending' },
        { _id: 'report2', status: 'resolved' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockReports)
                })
              })
            })
          })
        })
      });

      mockReportModel.countDocuments.mockResolvedValue(2);

      await controller.getAllReports(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          reports: mockReports
        }),
        'تم جلب قائمة التقارير بنجاح'
      );
    });

    it('should fail for non-admin users', async () => {
      req.user.role = 'user';

      await controller.getAllReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بعرض قائمة التقارير', 403);
    });

    it('should filter reports by multiple criteria', async () => {
      req.query = {
        status: 'pending',
        contentType: 'artwork',
        reason: 'inappropriate',
        priority: 'high',
        dateFrom: '2024-01-01',
        dateTo: '2024-12-31',
        search: 'test'
      };

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([])
                })
              })
            })
          })
        })
      });

      mockReportModel.countDocuments.mockResolvedValue(0);

      await controller.getAllReports(req, res, next);

      expect(mockReportModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'pending',
          contentType: 'artwork',
          reason: 'inappropriate',
          priority: 'high',
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-12-31')
          },
          $or: [
            { description: { $regex: 'test', $options: 'i' } },
            { 'metadata.contentTitle': { $regex: 'test', $options: 'i' } }
          ]
        })
      );
    });
  });

  describe('getReportStats (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
    });

    it('should get report statistics successfully', async () => {
      const mockCountResults = [5, 2, 1, 1, 0, 1]; // total, pending, resolved, rejected, investigating, escalated
      const mockGroupedStats = [{ _id: 'pending', count: 2 }];
      const mockTopReasons = [{ _id: 'inappropriate', count: 3 }];
      const mockActivity = [{ _id: '2024-01-15', count: 2 }];

      mockReportModel.countDocuments
        .mockResolvedValueOnce(5)  // total
        .mockResolvedValueOnce(2)  // pending
        .mockResolvedValueOnce(1)  // resolved
        .mockResolvedValueOnce(1)  // rejected
        .mockResolvedValueOnce(0)  // investigating
        .mockResolvedValueOnce(1); // escalated

      mockReportModel.aggregate
        .mockResolvedValueOnce(mockGroupedStats)
        .mockResolvedValueOnce(mockTopReasons)
        .mockResolvedValueOnce(mockActivity);

      await controller.getReportStats(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: {
            total: 5,
            pending: 2,
            investigating: 0,
            resolved: 1,
            rejected: 1,
            escalated: 1
          },
          topReasons: [{ reason: 'inappropriate', count: 3 }],
          activity: [{ date: '2024-01-15', count: 2 }]
        }),
        'تم جلب إحصائيات التقارير بنجاح'
      );
    });

    it('should fail for non-admin users', async () => {
      req.user.role = 'user';

      await controller.getReportStats(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بعرض إحصائيات التقارير', 403);
    });

    it('should handle custom date range', async () => {
      req.query = {
        dateFrom: '2024-01-01',
        dateTo: '2024-01-31'
      };

      // Mock all the Promise.all results
      mockReportModel.countDocuments.mockResolvedValue(0);
      mockReportModel.aggregate.mockResolvedValue([]);

      await controller.getReportStats(req, res, next);

      // Verify that date filter was applied
      expect(mockReportModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAt: {
            $gte: new Date('2024-01-01'),
            $lte: new Date('2024-01-31')
          }
        })
      );
    });
  });

  describe('updateReportStatus (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
      req.params.reportId = '507f1f77bcf86cd799439011';
      req.body = {
        status: 'resolved',
        adminNotes: 'تم حل المشكلة',
        actionTaken: 'content_removed',
        notifyReporter: true
      };
    });

    it('should update report status successfully', async () => {
      const mockReport = {
        _id: '507f1f77bcf86cd799439011',
        status: 'pending',
        reporter: 'reporter123',
        save: jest.fn().mockResolvedValue(true)
      };

      const mockUpdatedReport = {
        ...mockReport,
        status: 'resolved',
        adminNotes: 'تم حل المشكلة'
      };

      mockReportModel.findById.mockResolvedValue(mockReport);
      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockUpdatedReport)
            })
          })
        })
      });

      await controller.updateReportStatus(req, res, next);

      expect(mockReport.save).toHaveBeenCalled();
      expect(mockReport.status).toBe('resolved');
      expect(mockReport.adminNotes).toBe('تم حل المشكلة');
      expect(mockNotificationHelper).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'reporter123',
          type: 'report_status_updated'
        })
      );
      expect(res.success).toHaveBeenCalledWith(mockUpdatedReport, 'تم تحديث حالة التقرير بنجاح');
    });

    it('should fail for non-admin users', async () => {
      req.user.role = 'user';

      await controller.updateReportStatus(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بتحديث حالة التقارير', 403);
    });

    it('should fail with invalid report ID', async () => {
      req.params.reportId = 'invalid_id';

      await controller.updateReportStatus(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'معرف التقرير غير صالح', 400);
    });

    it('should fail when report not found', async () => {
      mockReportModel.findById.mockResolvedValue(null);

      await controller.updateReportStatus(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'التقرير غير موجود', 404);
    });
  });

  describe('bulkUpdateReports (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
      req.body = {
        reportIds: ['507f1f77bcf86cd799439011', '507f1f77bcf86cd799439012'],
        status: 'resolved',
        adminNotes: 'تم حل المشاكل'
      };
    });

    it('should bulk update reports successfully', async () => {
      mockReportModel.updateMany.mockResolvedValue({
        matchedCount: 2,
        modifiedCount: 2
      });

      await controller.bulkUpdateReports(req, res, next);

      expect(mockReportModel.updateMany).toHaveBeenCalledWith(
        { _id: { $in: req.body.reportIds } },
        expect.objectContaining({
          status: 'resolved',
          adminNotes: 'تم حل المشاكل',
          reviewedBy: req.user._id
        })
      );
      expect(res.success).toHaveBeenCalledWith(
        { matchedCount: 2, modifiedCount: 2 },
        'تم تحديث 2 تقرير بنجاح'
      );
    });

    it('should fail for non-admin users', async () => {
      req.user.role = 'user';

      await controller.bulkUpdateReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بتحديث التقارير', 403);
    });

    it('should fail with invalid report IDs', async () => {
      req.body.reportIds = ['invalid_id', '507f1f77bcf86cd799439011'];

      await controller.bulkUpdateReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'معرفات التقارير التالية غير صالحة: invalid_id',
        400
      );
    });

    it('should fail when no reports found to update', async () => {
      mockReportModel.updateMany.mockResolvedValue({
        matchedCount: 0,
        modifiedCount: 0
      });

      await controller.bulkUpdateReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'لم يتم العثور على تقارير للتحديث', 404);
    });
  });

  describe('getContentReports (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
      req.params = {
        contentType: 'artwork',
        contentId: '507f1f77bcf86cd799439011'
      };
      req.query = { page: 1, limit: 10 };
    });

    it('should get content reports successfully', async () => {
      const mockReports = [
        { _id: 'report1', reason: 'inappropriate' },
        { _id: 'report2', reason: 'spam' }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockReports)
                })
              })
            })
          })
        })
      });

      mockReportModel.countDocuments.mockResolvedValue(2);

      await controller.getContentReports(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          reports: mockReports,
          contentInfo: {
            contentType: 'artwork',
            contentId: '507f1f77bcf86cd799439011',
            totalReports: 2
          }
        }),
        'تم جلب تقارير المحتوى بنجاح'
      );
    });

    it('should fail for non-admin users', async () => {
      req.user.role = 'user';

      await controller.getContentReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بعرض تقارير المحتوى', 403);
    });

    it('should fail with invalid content ID', async () => {
      req.params.contentId = 'invalid_id';

      await controller.getContentReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'معرف المحتوى غير صالح', 400);
    });
  });

  describe('exportReports (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
      req.query = { format: 'csv' };
    });

    it('should export reports as CSV successfully', async () => {
      const mockReports = [
        {
          _id: 'report1',
          contentType: 'artwork',
          contentId: 'content1',
          reporter: { displayName: 'User 1', email: 'user1@example.com' },
          targetUser: { displayName: 'User 2', email: 'user2@example.com' },
          reason: 'inappropriate',
          description: 'Test description',
          status: 'pending',
          priority: 'medium',
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-02')
        }
      ];

      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockReports)
              })
            })
          })
        })
      });

      await controller.exportReports(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('attachment; filename="reports_')
      );
      expect(res.send).toHaveBeenCalledWith(expect.stringContaining('id,contentType'));
    });

    it('should export reports as JSON successfully', async () => {
      req.query.format = 'json';
      
      const mockReports = [];
      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockReports)
              })
            })
          })
        })
      });

      await controller.exportReports(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should fail for non-admin users', async () => {
      req.user.role = 'user';

      await controller.exportReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بتصدير التقارير', 403);
    });

    it('should fail for unsupported export format', async () => {
      req.query.format = 'xlsx';
      
      mockReportModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              sort: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      await controller.exportReports(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'تنسيق التصدير غير مدعوم حالياً', 400);
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      req.body = {
        contentType: 'artwork',
        contentId: '507f1f77bcf86cd799439011',
        reason: 'inappropriate'
      };

      mockArtworkModel.findById.mockRejectedValue(new Error('Database error'));

      await controller.createReport(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'حدث خطأ أثناء التحقق من المحتوى', 500);
    });

    it('should handle notification errors gracefully', async () => {
      req.body = {
        contentType: 'artwork',
        contentId: '507f1f77bcf86cd799439011',
        reason: 'inappropriate'
      };

      mockArtworkModel.findById.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        title: 'عمل فني',
        artist: 'artist123'
      });

      mockReportModel.findOne.mockResolvedValue(null);
      mockReportModel.create.mockResolvedValue({ _id: 'report123' });
      mockUserModel.find.mockResolvedValue([{ _id: 'admin1' }]);
      mockNotificationHelper.mockRejectedValue(new Error('Notification error'));

      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue({ _id: 'report123' })
          })
        })
      });

      // Should still succeed even if notification fails
      await controller.createReport(req, res, next);

      expect(res.success).toHaveBeenCalled();
    });
  });

  describe('Security Tests', () => {
    it('should deny non-admin access to admin functions', async () => {
      req.user.role = 'user';

      await controller.getAllReports(req, res, next);
      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بعرض قائمة التقارير', 403);

      await controller.getReportStats(req, res, next);
      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بعرض إحصائيات التقارير', 403);

      await controller.updateReportStatus(req, res, next);
      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بتحديث حالة التقارير', 403);
    });

    it('should prevent access to other users reports', async () => {
      req.params.reportId = '507f1f77bcf86cd799439011';
      
      const mockReport = {
        _id: '507f1f77bcf86cd799439011',
        reporter: { _id: 'other_user' },
        status: 'pending'
      };

      mockReportModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReport)
          })
        })
      });

      await controller.getReportById(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(null, 'غير مصرح لك بعرض هذا التقرير', 403);
    });
  });
}); 