import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as reviewController from '../../src/modules/review/review.controller.js';

// Mock dependencies
const mockReviewModel = {
  findOne: jest.fn(),
  findById: jest.fn(),
  find: jest.fn(),
  create: jest.fn(),
  countDocuments: jest.fn(),
  aggregate: jest.fn(),
  getAverageRating: jest.fn(),
  getRatingDistribution: jest.fn()
};

const mockArtworkModel = {
  findById: jest.fn(),
  findByIdAndUpdate: jest.fn()
};

const mockUserModel = {
  findOne: jest.fn(),
  find: jest.fn()
};

const mockTransactionModel = {
  findOne: jest.fn()
};

const mockCreateNotificationHelper = jest.fn();

// Mock modules
jest.unstable_mockModule('../../../DB/models/review.model.js', () => ({
  default: mockReviewModel
}));

jest.unstable_mockModule('../../../DB/models/artwork.model.js', () => ({
  default: mockArtworkModel
}));

jest.unstable_mockModule('../../../DB/models/user.model.js', () => ({
  default: mockUserModel
}));

jest.unstable_mockModule('../../../DB/models/transaction.model.js', () => ({
  default: mockTransactionModel
}));

jest.unstable_mockModule('../../src/modules/notification/notification.controller.js', () => ({
  createNotificationHelper: mockCreateNotificationHelper
}));

describe('Review Controller Tests', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
        role: 'user'
      },
      params: {},
      body: {},
      query: {},
      get: jest.fn().mockReturnValue('test-user-agent'),
      ip: '127.0.0.1'
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

  describe('createArtworkReview', () => {
    beforeEach(() => {
      req.body = {
        artwork: '507f1f77bcf86cd799439011',
        rating: 5,
        title: 'عمل فني رائع',
        comment: 'تعليق مفصل',
        pros: ['تقنية ممتازة'],
        cons: ['يحتاج تحسين'],
        subRatings: { creativity: 5, technique: 4 },
        isRecommended: true
      };
    });

    it('should create artwork review successfully', async () => {
      const mockArtwork = {
        _id: '507f1f77bcf86cd799439011',
        title: 'عمل فني',
        artist: 'artist123'
      };

      const mockReview = {
        _id: 'review123',
        ...req.body,
        user: req.user._id,
        artist: mockArtwork.artist
      };

      const mockPopulatedReview = {
        ...mockReview,
        user: { displayName: 'مستخدم', userName: 'user' },
        artwork: { title: 'عمل فني', images: [] }
      };

      mockArtworkModel.findById.mockResolvedValue(mockArtwork);
      mockReviewModel.findOne.mockResolvedValue(null);
      mockTransactionModel.findOne.mockResolvedValue({ _id: 'transaction123' });
      mockReviewModel.create.mockResolvedValue(mockReview);
      mockReviewModel.getAverageRating.mockResolvedValue({ avgRating: 4.5, count: 10 });
      mockReviewModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockPopulatedReview)
          })
        })
      });
      mockCreateNotificationHelper.mockResolvedValue();

      await reviewController.createArtworkReview(req, res, next);

      expect(mockReviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: req.user._id,
          artwork: req.body.artwork,
          rating: req.body.rating,
          title: req.body.title,
          comment: req.body.comment,
          isVerifiedPurchase: true,
          status: 'active'
        })
      );
      expect(res.success).toHaveBeenCalledWith(
        mockPopulatedReview,
        'تم إضافة التقييم بنجاح',
        201
      );
    });

    it('should fail with invalid artwork ID', async () => {
      req.body.artwork = 'invalid-id';

      await reviewController.createArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'معرف العمل الفني غير صالح',
        400
      );
    });

    it('should fail when artwork not found', async () => {
      mockArtworkModel.findById.mockResolvedValue(null);

      await reviewController.createArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'العمل الفني غير موجود',
        404
      );
    });

    it('should prevent user from reviewing own artwork', async () => {
      const mockArtwork = {
        _id: '507f1f77bcf86cd799439011',
        artist: req.user._id
      };

      mockArtworkModel.findById.mockResolvedValue(mockArtwork);

      await reviewController.createArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'لا يمكنك تقييم عملك الفني الخاص',
        400
      );
    });

    it('should prevent duplicate reviews', async () => {
      const mockArtwork = {
        _id: '507f1f77bcf86cd799439011',
        artist: 'artist123'
      };

      mockArtworkModel.findById.mockResolvedValue(mockArtwork);
      mockReviewModel.findOne.mockResolvedValue({ _id: 'existing-review' });

      await reviewController.createArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'لقد قمت بتقييم هذا العمل الفني مسبقاً. يمكنك تحديث تقييمك بدلاً من ذلك.',
        400
      );
    });
  });

  describe('updateArtworkReview', () => {
    beforeEach(() => {
      req.params.reviewId = '507f1f77bcf86cd799439013';
      req.body = {
        rating: 4,
        title: 'عنوان محدث',
        comment: 'تعليق محدث'
      };
    });

    it('should update artwork review successfully', async () => {
      const mockReview = {
        _id: req.params.reviewId,
        user: req.user._id,
        artwork: '507f1f77bcf86cd799439011',
        rating: 5,
        save: jest.fn().mockResolvedValue()
      };

      const mockUpdatedReview = {
        ...mockReview,
        ...req.body,
        user: { displayName: 'مستخدم' }
      };

      mockReviewModel.findOne.mockResolvedValue(mockReview);
      mockReviewModel.getAverageRating.mockResolvedValue({ avgRating: 4.2, count: 8 });
      mockReviewModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockUpdatedReview)
          })
        })
      });

      await reviewController.updateArtworkReview(req, res, next);

      expect(mockReview.save).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        mockUpdatedReview,
        'تم تحديث التقييم بنجاح'
      );
    });

    it('should fail with invalid review ID', async () => {
      req.params.reviewId = 'invalid-id';

      await reviewController.updateArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'معرف التقييم غير صالح',
        400
      );
    });

    it('should fail when review not found', async () => {
      mockReviewModel.findOne.mockResolvedValue(null);

      await reviewController.updateArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التقييم غير موجود أو لا يمكن تحديثه',
        404
      );
    });
  });

  describe('getArtworkReviews', () => {
    beforeEach(() => {
      req.params.artworkId = '507f1f77bcf86cd799439011';
      req.query = { page: 1, limit: 10 };
    });

    it('should get artwork reviews with stats successfully', async () => {
      const mockArtwork = { _id: req.params.artworkId, title: 'عمل فني' };
      const mockReviews = [
        { _id: 'review1', rating: 5, comment: 'ممتاز' },
        { _id: 'review2', rating: 4, comment: 'جيد' }
      ];

      mockArtworkModel.findById.mockResolvedValue(mockArtwork);
      mockReviewModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockReviews)
              })
            })
          })
        })
      });
      mockReviewModel.countDocuments.mockResolvedValue(2);
      mockReviewModel.getAverageRating.mockResolvedValue({ avgRating: 4.5, count: 2 });
      mockReviewModel.getRatingDistribution.mockResolvedValue([1, 1, 0, 0, 0]);

      await reviewController.getArtworkReviews(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews: mockReviews,
          stats: expect.objectContaining({
            avgRating: 4.5,
            totalReviews: 2
          }),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 1
          })
        }),
        'تم جلب التقييمات بنجاح'
      );
    });

    it('should fail with invalid artwork ID', async () => {
      req.params.artworkId = 'invalid-id';

      await reviewController.getArtworkReviews(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'معرف العمل الفني غير صالح',
        400
      );
    });

    it('should fail when artwork not found', async () => {
      mockArtworkModel.findById.mockResolvedValue(null);

      await reviewController.getArtworkReviews(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'العمل الفني غير موجود',
        404
      );
    });

    it('should apply filters correctly', async () => {
      req.query = {
        page: 1,
        limit: 10,
        rating: 5,
        verified: 'true',
        recommended: 'true',
        search: 'ممتاز'
      };

      const mockArtwork = { _id: req.params.artworkId };
      mockArtworkModel.findById.mockResolvedValue(mockArtwork);
      mockReviewModel.find.mockReturnValue({
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
      mockReviewModel.countDocuments.mockResolvedValue(0);
      mockReviewModel.getAverageRating.mockResolvedValue({ avgRating: 0, count: 0 });
      mockReviewModel.getRatingDistribution.mockResolvedValue([0, 0, 0, 0, 0]);

      await reviewController.getArtworkReviews(req, res, next);

      expect(mockReviewModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          artwork: req.params.artworkId,
          status: 'active',
          rating: 5,
          isVerifiedPurchase: true,
          isRecommended: true,
          $or: expect.arrayContaining([
            { title: { $regex: 'ممتاز', $options: 'i' } },
            { comment: { $regex: 'ممتاز', $options: 'i' } }
          ])
        })
      );
    });
  });

  describe('createArtistReview', () => {
    beforeEach(() => {
      req.body = {
        artist: '507f1f77bcf86cd799439012',
        rating: 5,
        title: 'فنان محترف',
        comment: 'تعامل ممتاز',
        pros: ['سرعة في التنفيذ'],
        cons: ['الأسعار مرتفعة'],
        isRecommended: true
      };
    });

    it('should create artist review successfully', async () => {
      const mockArtist = {
        _id: req.body.artist,
        role: 'artist',
        displayName: 'فنان'
      };

      const mockReview = {
        _id: 'review123',
        ...req.body,
        user: req.user._id
      };

      mockUserModel.findOne.mockResolvedValue(mockArtist);
      mockReviewModel.findOne.mockResolvedValue(null);
      mockTransactionModel.findOne.mockResolvedValue({ _id: 'transaction123' });
      mockReviewModel.create.mockResolvedValue(mockReview);
      mockReviewModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReview)
          })
        })
      });
      mockCreateNotificationHelper.mockResolvedValue();

      await reviewController.createArtistReview(req, res, next);

      expect(mockReviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          user: req.user._id,
          artist: req.body.artist,
          rating: req.body.rating,
          isVerifiedPurchase: true,
          status: 'active'
        })
      );
      expect(res.success).toHaveBeenCalledWith(
        mockReview,
        'تم إضافة تقييم الفنان بنجاح',
        201
      );
    });

    it('should prevent self-review', async () => {
      req.body.artist = req.user._id;

      const mockArtist = {
        _id: req.user._id,
        role: 'artist'
      };

      mockUserModel.findOne.mockResolvedValue(mockArtist);

      await reviewController.createArtistReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'لا يمكنك تقييم نفسك',
        400
      );
    });
  });

  describe('deleteReview', () => {
    beforeEach(() => {
      req.params.reviewId = '507f1f77bcf86cd799439013';
    });

    it('should delete review successfully', async () => {
      const mockReview = {
        _id: req.params.reviewId,
        user: req.user._id,
        artwork: '507f1f77bcf86cd799439011',
        status: 'active',
        save: jest.fn().mockResolvedValue()
      };

      mockReviewModel.findOne.mockResolvedValue(mockReview);
      mockReviewModel.getAverageRating.mockResolvedValue({ avgRating: 4.0, count: 5 });

      await reviewController.deleteReview(req, res, next);

      expect(mockReview.status).toBe('deleted');
      expect(mockReview.save).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(null, 'تم حذف التقييم بنجاح');
    });

    it('should fail when review not found', async () => {
      mockReviewModel.findOne.mockResolvedValue(null);

      await reviewController.deleteReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التقييم غير موجود أو لا يمكن حذفه',
        404
      );
    });
  });

  describe('markReviewAsHelpful', () => {
    beforeEach(() => {
      req.params.reviewId = '507f1f77bcf86cd799439013';
      req.body = { helpful: true };
    });

    it('should mark review as helpful successfully', async () => {
      const mockReview = {
        _id: req.params.reviewId,
        user: 'different-user',
        status: 'active',
        helpfulVotes: 5,
        interactions: { helpful: [] },
        markAsHelpful: jest.fn(),
        save: jest.fn().mockResolvedValue()
      };

      mockReviewModel.findOne.mockResolvedValue(mockReview);

      await reviewController.markReviewAsHelpful(req, res, next);

      expect(mockReview.markAsHelpful).toHaveBeenCalledWith(req.user._id);
      expect(mockReview.save).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalled();
    });

    it('should prevent marking own review as helpful', async () => {
      const mockReview = {
        _id: req.params.reviewId,
        user: req.user._id,
        status: 'active'
      };

      mockReviewModel.findOne.mockResolvedValue(mockReview);

      await reviewController.markReviewAsHelpful(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'لا يمكنك تمييز تقييمك الخاص',
        400
      );
    });
  });

  describe('reportReview', () => {
    beforeEach(() => {
      req.params.reviewId = '507f1f77bcf86cd799439013';
      req.body = {
        reason: 'inappropriate',
        description: 'محتوى غير مناسب'
      };
    });

    it('should report review successfully', async () => {
      const mockReview = {
        _id: req.params.reviewId,
        user: 'different-user',
        status: 'active',
        reportedCount: 2,
        interactions: { reported: [] },
        reportReview: jest.fn(),
        save: jest.fn().mockResolvedValue()
      };

      mockReviewModel.findOne.mockResolvedValue(mockReview);
      mockUserModel.find.mockResolvedValue([{ _id: 'admin1' }, { _id: 'admin2' }]);
      mockCreateNotificationHelper.mockResolvedValue();

      await reviewController.reportReview(req, res, next);

      expect(mockReview.reportReview).toHaveBeenCalledWith(req.user._id);
      expect(mockReview.save).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(null, 'تم الإبلاغ عن التقييم بنجاح');
    });

    it('should hide review when reports exceed threshold', async () => {
      const mockReview = {
        _id: req.params.reviewId,
        user: 'different-user',
        status: 'active',
        reportedCount: 5, // Will become 6 after reporting
        interactions: { reported: [] },
        reportReview: jest.fn().mockImplementation(() => {
          mockReview.reportedCount = 6;
        }),
        save: jest.fn().mockResolvedValue()
      };

      mockReviewModel.findOne.mockResolvedValue(mockReview);
      mockUserModel.find.mockResolvedValue([]);

      await reviewController.reportReview(req, res, next);

      expect(mockReview.status).toBe('reported');
    });
  });

  describe('getMyReviews', () => {
    beforeEach(() => {
      req.query = { page: 1, limit: 10 };
    });

    it('should get user reviews successfully', async () => {
      const mockReviews = [
        { _id: 'review1', rating: 5, helpfulVotes: 3 },
        { _id: 'review2', rating: 4, helpfulVotes: 1 }
      ];

      const mockStats = [{
        avgRating: 4.5,
        totalHelpfulVotes: 4,
        artworkReviews: 1,
        artistReviews: 1
      }];

      mockReviewModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockReviews)
                })
              })
            })
          })
        })
      });
      mockReviewModel.countDocuments.mockResolvedValue(2);
      mockReviewModel.aggregate.mockResolvedValue(mockStats);

      await reviewController.getMyReviews(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          reviews: mockReviews,
          stats: mockStats[0],
          pagination: expect.objectContaining({
            currentPage: 1,
            totalItems: 2
          })
        }),
        'تم جلب تقييماتك بنجاح'
      );
    });

    it('should filter by type correctly', async () => {
      req.query.type = 'artwork';

      mockReviewModel.find.mockReturnValue({
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
      mockReviewModel.countDocuments.mockResolvedValue(0);
      mockReviewModel.aggregate.mockResolvedValue([]);

      await reviewController.getMyReviews(req, res, next);

      expect(mockReviewModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: req.user._id,
          artwork: { $exists: true }
        })
      );
    });
  });

  describe('getReviewsStats (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
      req.query = { period: 'month', groupBy: 'rating' };
    });

    it('should get review stats for admin successfully', async () => {
      const mockStats = {
        totalReviews: 100,
        artworkReviews: 60,
        artistReviews: 40,
        avgRating: [{ avgRating: 4.2 }],
        distribution: [{ _id: 5, count: 50 }, { _id: 4, count: 30 }],
        activity: [{ _id: '2024-01-15', count: 10 }]
      };

      mockReviewModel.countDocuments
        .mockResolvedValueOnce(100) // total
        .mockResolvedValueOnce(60)  // artwork
        .mockResolvedValueOnce(40); // artist

      mockReviewModel.aggregate
        .mockResolvedValueOnce([{ avgRating: 4.2 }]) // avgRating
        .mockResolvedValueOnce([{ _id: 5, count: 50 }]) // distribution
        .mockResolvedValueOnce([{ _id: '2024-01-15', count: 10 }]); // activity

      await reviewController.getReviewsStats(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          summary: expect.objectContaining({
            total: 100,
            artworkReviews: 60,
            artistReviews: 40
          }),
          distribution: expect.any(Array),
          activity: expect.any(Array)
        }),
        'تم جلب إحصائيات التقييمات بنجاح'
      );
    });

    it('should deny access for non-admin users', async () => {
      req.user.role = 'user';

      await reviewController.getReviewsStats(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'غير مصرح لك بعرض إحصائيات التقييمات',
        403
      );
    });
  });

  describe('moderateReview (Admin)', () => {
    beforeEach(() => {
      req.user.role = 'admin';
      req.params.reviewId = '507f1f77bcf86cd799439013';
      req.body = {
        status: 'hidden',
        moderationNotes: 'محتوى غير مناسب'
      };
    });

    it('should moderate review successfully', async () => {
      const mockReview = {
        _id: req.params.reviewId,
        user: 'user123',
        status: 'active',
        save: jest.fn().mockResolvedValue()
      };

      mockReviewModel.findById.mockResolvedValue(mockReview);
      mockCreateNotificationHelper.mockResolvedValue();

      await reviewController.moderateReview(req, res, next);

      expect(mockReview.status).toBe('hidden');
      expect(mockReview.moderationNotes).toBe('محتوى غير مناسب');
      expect(mockReview.moderatedBy).toBe(req.user._id);
      expect(mockReview.save).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        mockReview,
        'تم تحديث حالة التقييم بنجاح'
      );
    });

    it('should deny access for non-admin users', async () => {
      req.user.role = 'user';

      await reviewController.moderateReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'غير مصرح لك بإدارة التقييمات',
        403
      );
    });

    it('should fail when review not found', async () => {
      mockReviewModel.findById.mockResolvedValue(null);

      await reviewController.moderateReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التقييم غير موجود',
        404
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      req.body = {
        artwork: '507f1f77bcf86cd799439011',
        rating: 5
      };

      mockArtworkModel.findById.mockRejectedValue(new Error('Database error'));

      await expect(reviewController.createArtworkReview(req, res, next)).rejects.toThrow('Database error');
    });

    it('should handle notification errors gracefully', async () => {
      const mockArtwork = {
        _id: '507f1f77bcf86cd799439011',
        artist: 'artist123',
        title: 'عمل فني'
      };

      const mockReview = { _id: 'review123', user: req.user._id };

      req.body = { artwork: '507f1f77bcf86cd799439011', rating: 5 };

      mockArtworkModel.findById.mockResolvedValue(mockArtwork);
      mockReviewModel.findOne.mockResolvedValue(null);
      mockTransactionModel.findOne.mockResolvedValue(null);
      mockReviewModel.create.mockResolvedValue(mockReview);
      mockReviewModel.getAverageRating.mockResolvedValue({ avgRating: 4.5, count: 1 });
      mockReviewModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReview)
          })
        })
      });
      
      // Mock notification error
      mockCreateNotificationHelper.mockRejectedValue(new Error('Notification failed'));

      // Should still succeed despite notification error
      await reviewController.createArtworkReview(req, res, next);

      expect(res.success).toHaveBeenCalledWith(
        mockReview,
        'تم إضافة التقييم بنجاح',
        201
      );
    });
  });

  describe('Security Tests', () => {
    it('should validate ObjectId format', async () => {
      req.body = { artwork: 'not-an-objectid', rating: 5 };

      await reviewController.createArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'معرف العمل الفني غير صالح',
        400
      );
    });

    it('should prevent unauthorized access to other users reviews', async () => {
      req.params.reviewId = '507f1f77bcf86cd799439013';
      req.body = { rating: 4 };

      const mockReview = {
        _id: req.params.reviewId,
        user: 'different-user', // Different user
        status: 'active'
      };

      mockReviewModel.findOne.mockResolvedValue(null); // Simulates not finding review for current user

      await reviewController.updateArtworkReview(req, res, next);

      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التقييم غير موجود أو لا يمكن تحديثه',
        404
      );
    });

    it('should sanitize user input', async () => {
      req.body = {
        artwork: '507f1f77bcf86cd799439011',
        rating: 5,
        pros: ['  نقطة إيجابية  ', '', '   ', 'نقطة أخرى'],
        cons: ['  نقطة سلبية  ', null, undefined, 'نقطة أخرى']
      };

      const mockArtwork = { _id: req.body.artwork, artist: 'artist123' };
      const mockReview = { _id: 'review123', user: req.user._id };

      mockArtworkModel.findById.mockResolvedValue(mockArtwork);
      mockReviewModel.findOne.mockResolvedValue(null);
      mockTransactionModel.findOne.mockResolvedValue(null);
      mockReviewModel.create.mockResolvedValue(mockReview);
      mockReviewModel.getAverageRating.mockResolvedValue({ avgRating: 5, count: 1 });
      mockReviewModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockReview)
          })
        })
      });

      await reviewController.createArtworkReview(req, res, next);

      expect(mockReviewModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          pros: ['نقطة إيجابية', 'نقطة أخرى'], // Trimmed and filtered
          cons: ['نقطة سلبية', 'نقطة أخرى'] // Trimmed and filtered
        })
      );
    });
  });
}); 