import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as followController from '../../src/modules/follow/follow.controller.js';
import followModel from '../../DB/models/follow.model.js';
import userModel from '../../DB/models/user.model.js';
import { sendFollowNotification } from '../../src/utils/pushNotifications.js';

// Mock the models and utilities
jest.mock('../../DB/models/follow.model.js');
jest.mock('../../DB/models/user.model.js');
jest.mock('../../src/utils/pushNotifications.js');

describe('Follow Controller Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: 'user123',
        displayName: 'Test User',
        userName: 'testuser'
      }
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

  describe('followArtist', () => {
    it('should follow artist successfully', async () => {
      // Setup
      const artistId = 'artist123';
      req.body = { artistId };

      const mockArtist = {
        _id: artistId,
        displayName: 'Test Artist',
        userName: 'testartist',
        isActive: true
      };

      const mockFollowRecord = {
        _id: 'follow123',
        follower: req.user._id,
        following: artistId,
        createdAt: new Date()
      };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockArtist)
      });
      followModel.findOne.mockResolvedValue(null); // Not already following
      followModel.create.mockResolvedValue(mockFollowRecord);
      sendFollowNotification.mockResolvedValue();

      // Execute
      await followController.followArtist(req, res);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith(artistId);
      expect(followModel.findOne).toHaveBeenCalledWith({
        follower: req.user._id,
        following: artistId
      });
      expect(followModel.create).toHaveBeenCalledWith({
        follower: req.user._id,
        following: artistId
      });
      expect(res.success).toHaveBeenCalledWith(
        {
          _id: mockFollowRecord._id,
          artistId,
          artistName: mockArtist.displayName,
          followedAt: mockFollowRecord.createdAt
        },
        'تمت المتابعة بنجاح',
        201
      );
    });

    it('should fail when trying to follow self', async () => {
      // Setup
      req.body = { artistId: req.user._id };

      // Execute
      await followController.followArtist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'لا يمكنك متابعة نفسك',
        400
      );
      expect(userModel.findById).not.toHaveBeenCalled();
    });

    it('should fail when artist does not exist', async () => {
      // Setup
      const artistId = 'nonexistent123';
      req.body = { artistId };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await followController.followArtist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'الفنان غير موجود',
        404
      );
    });

    it('should fail when artist is inactive', async () => {
      // Setup
      const artistId = 'artist123';
      req.body = { artistId };

      const mockArtist = {
        _id: artistId,
        displayName: 'Inactive Artist',
        isActive: false
      };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockArtist)
      });

      // Execute
      await followController.followArtist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حساب الفنان غير نشط',
        400
      );
    });

    it('should fail when already following', async () => {
      // Setup
      const artistId = 'artist123';
      req.body = { artistId };

      const mockArtist = {
        _id: artistId,
        displayName: 'Test Artist',
        isActive: true
      };

      const existingFollow = {
        _id: 'existing123',
        follower: req.user._id,
        following: artistId
      };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockArtist)
      });
      followModel.findOne.mockResolvedValue(existingFollow);

      // Execute
      await followController.followArtist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'أنت تتابع هذا الفنان بالفعل',
        409
      );
      expect(followModel.create).not.toHaveBeenCalled();
    });
  });

  describe('unfollowArtist', () => {
    it('should unfollow artist successfully', async () => {
      // Setup
      const artistId = 'artist123';
      req.body = { artistId };

      const existingFollow = {
        _id: 'follow123',
        follower: req.user._id,
        following: artistId
      };

      followModel.findOne.mockResolvedValue(existingFollow);
      followModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Execute
      await followController.unfollowArtist(req, res);

      // Assert
      expect(followModel.findOne).toHaveBeenCalledWith({
        follower: req.user._id,
        following: artistId
      });
      expect(followModel.deleteOne).toHaveBeenCalledWith({
        follower: req.user._id,
        following: artistId
      });
      expect(res.success).toHaveBeenCalledWith(
        null,
        'تم إلغاء المتابعة بنجاح'
      );
    });

    it('should fail when not following artist', async () => {
      // Setup
      const artistId = 'artist123';
      req.body = { artistId };

      followModel.findOne.mockResolvedValue(null);

      // Execute
      await followController.unfollowArtist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'أنت لا تتابع هذا الفنان',
        400
      );
      expect(followModel.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('toggleFollow', () => {
    it('should follow when not already following', async () => {
      // Setup
      const artistId = 'artist123';
      req.body = { artistId };

      const mockArtist = {
        _id: artistId,
        displayName: 'Test Artist',
        isActive: true
      };

      const mockFollowRecord = {
        _id: 'follow123',
        follower: req.user._id,
        following: artistId,
        createdAt: new Date()
      };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockArtist)
      });
      followModel.findOne.mockResolvedValue(null); // Not following
      followModel.create.mockResolvedValue(mockFollowRecord);
      sendFollowNotification.mockResolvedValue();

      // Execute
      await followController.toggleFollow(req, res);

      // Assert
      expect(followModel.create).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'followed',
          isFollowing: true,
          artistId,
          artistName: mockArtist.displayName
        }),
        'تمت المتابعة بنجاح'
      );
    });

    it('should unfollow when already following', async () => {
      // Setup
      const artistId = 'artist123';
      req.body = { artistId };

      const mockArtist = {
        _id: artistId,
        displayName: 'Test Artist',
        isActive: true
      };

      const existingFollow = {
        _id: 'follow123',
        follower: req.user._id,
        following: artistId
      };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockArtist)
      });
      followModel.findOne.mockResolvedValue(existingFollow); // Already following
      followModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      // Execute
      await followController.toggleFollow(req, res);

      // Assert
      expect(followModel.deleteOne).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'unfollowed',
          isFollowing: false,
          artistId,
          artistName: mockArtist.displayName
        }),
        'تم إلغاء المتابعة بنجاح'
      );
    });
  });

  describe('getFollowers', () => {
    it('should get followers with pagination', async () => {
      // Setup
      const artistId = 'artist123';
      req.params = { artistId };
      req.query = { page: 1, limit: 10 };

      const mockArtist = {
        _id: artistId,
        displayName: 'Test Artist'
      };

      const mockFollowers = [
        {
          follower: {
            _id: 'user1',
            displayName: 'User 1',
            profileImage: { url: 'image1.jpg' },
            job: 'Artist',
            isActive: true
          },
          createdAt: new Date()
        }
      ];

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockArtist)
      });

      followModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockFollowers)
              })
            })
          })
        })
      });

      followModel.countDocuments.mockResolvedValue(1);

      // Execute
      await followController.getFollowers(req, res);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith(artistId);
      expect(followModel.find).toHaveBeenCalledWith({ following: artistId });
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          followers: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalItems: 1
          }),
          artist: expect.objectContaining({
            _id: artistId,
            name: mockArtist.displayName
          })
        }),
        'تم جلب المتابعين بنجاح'
      );
    });

    it('should fail when artist not found', async () => {
      // Setup
      const artistId = 'nonexistent123';
      req.params = { artistId };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await followController.getFollowers(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'الفنان غير موجود',
        404
      );
    });
  });

  describe('getFollowing', () => {
    it('should get following with pagination', async () => {
      // Setup
      const userId = 'user123';
      req.params = { userId };
      req.query = { page: 1, limit: 10 };

      const mockUser = {
        _id: userId,
        displayName: 'Test User'
      };

      const mockFollowing = [
        {
          following: {
            _id: 'artist1',
            displayName: 'Artist 1',
            profileImage: { url: 'image1.jpg' },
            job: 'Digital Artist',
            isActive: true
          },
          createdAt: new Date()
        }
      ];

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      followModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockFollowing)
              })
            })
          })
        })
      });

      followModel.countDocuments.mockResolvedValue(1);

      // Execute
      await followController.getFollowing(req, res);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith(userId);
      expect(followModel.find).toHaveBeenCalledWith({ follower: userId });
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          following: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalItems: 1
          }),
          user: expect.objectContaining({
            _id: userId,
            name: mockUser.displayName
          })
        }),
        'تم جلب المتابَعين بنجاح'
      );
    });
  });

  describe('checkFollowStatus', () => {
    it('should return true when following', async () => {
      // Setup
      const artistId = 'artist123';
      req.params = { artistId };

      const mockFollow = {
        _id: 'follow123',
        follower: req.user._id,
        following: artistId
      };

      followModel.findOne.mockResolvedValue(mockFollow);

      // Execute
      await followController.checkFollowStatus(req, res);

      // Assert
      expect(followModel.findOne).toHaveBeenCalledWith({
        follower: req.user._id,
        following: artistId
      });
      expect(res.success).toHaveBeenCalledWith(
        {
          isFollowing: true,
          artistId
        },
        'تم التحقق من حالة المتابعة'
      );
    });

    it('should return false when not following', async () => {
      // Setup
      const artistId = 'artist123';
      req.params = { artistId };

      followModel.findOne.mockResolvedValue(null);

      // Execute
      await followController.checkFollowStatus(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        {
          isFollowing: false,
          artistId
        },
        'تم التحقق من حالة المتابعة'
      );
    });

    it('should return false when not authenticated', async () => {
      // Setup
      const artistId = 'artist123';
      req.params = { artistId };
      req.user = null; // Not authenticated

      // Execute
      await followController.checkFollowStatus(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        { isFollowing: false },
        'حالة المتابعة'
      );
      expect(followModel.findOne).not.toHaveBeenCalled();
    });
  });

  describe('getFollowStats', () => {
    it('should get follow statistics successfully', async () => {
      // Setup
      const artistId = 'artist123';
      req.params = { artistId };

      const mockArtist = {
        _id: artistId,
        displayName: 'Test Artist'
      };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockArtist)
      });

      followModel.countDocuments
        .mockResolvedValueOnce(150) // followers count
        .mockResolvedValueOnce(75); // following count

      // Execute
      await followController.getFollowStats(req, res);

      // Assert
      expect(userModel.findById).toHaveBeenCalledWith(artistId);
      expect(followModel.countDocuments).toHaveBeenCalledWith({ following: artistId });
      expect(followModel.countDocuments).toHaveBeenCalledWith({ follower: artistId });
      expect(res.success).toHaveBeenCalledWith(
        {
          artistId,
          artistName: mockArtist.displayName,
          followersCount: 150,
          followingCount: 75
        },
        'تم جلب إحصائيات المتابعة بنجاح'
      );
    });

    it('should fail when artist not found', async () => {
      // Setup
      const artistId = 'nonexistent123';
      req.params = { artistId };

      userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await followController.getFollowStats(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'الفنان غير موجود',
        404
      );
    });
  });
}); 