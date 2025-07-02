import mongoose from 'mongoose';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as userController from '../../src/modules/user/user.controller.js';

// Mock dependencies before imports
jest.mock('mongoose');

// Create mock functions for the controller functions we're testing
const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.params.id || req.user._id;

    // Mock user data
    const userData = {
      _id: userId,
      displayName: 'Test User',
      email: 'test@example.com',
      profileImage: 'profile.jpg',
      job: 'Artist',
      createdAt: new Date()
    };

    // Return user data
    return res.success(userData, 'تم جلب بيانات المستخدم بنجاح');
  } catch (error) {
    next(error);
  }
};

const updateUserProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { displayName, bio } = req.body;

    // Mock updated user data
    const updatedUser = {
      _id: userId,
      displayName: displayName || 'Test User',
      bio: bio || 'Default bio',
      email: 'test@example.com'
    };

    // Return success response
    return res.success(updatedUser, 'تم تحديث الملف الشخصي بنجاح');
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { displayName, job, profileImage, coverImages } = req.body;

    // Create update object with only provided fields
    const updateData = {};
    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }
    if (job !== undefined) {
      updateData.job = job;
    }
    if (profileImage !== undefined) {
      updateData.profileImage = profileImage;
    }
    if (coverImages !== undefined) {
      updateData.coverImages = coverImages;
    }

    // Mock user update
    if (userId === 'invalid_user_id') {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // Return updated user data directly
    res.success(
      {
        _id: userId,
        displayName: displayName || 'Original Name',
        job: job || 'Original Job',
        profileImage: profileImage || 'original-profile.jpg',
        coverImages: coverImages || ['original-cover.jpg'],
        email: 'user@example.com'
      },
      'تم تحديث الملف الشخصي بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'يجب توفير كلمة المرور القديمة والجديدة'
      });
    }

    // Mock user lookup
    if (userId === 'invalid_user_id') {
      return res.fail(null, 'المستخدم غير موجود', 404);
    }

    // Mock password check
    if (oldPassword !== 'correct_password') {
      return res.fail(null, 'كلمة المرور القديمة غير صحيحة', 400);
    }

    return res.success(null, 'تم تغيير كلمة المرور بنجاح');
  } catch (error) {
    next(error);
  }
};

const getUserStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Mock user stats
    return res.success(
      {
        artworksCount: 10,
        imagesCount: 25,
        wishlistCount: 5,
        followingCount: 15,
        followersCount: 8
      },
      'تم جلب إحصائيات المستخدم بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

describe('User Controller Tests', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
        email: 'test@example.com',
        displayName: 'Test User'
      },
      body: {},
      params: {},
      query: {}
    };

    res = {
      success: jest.fn(),
      fail: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('toggleWishlist', () => {
    it('should add artwork to wishlist successfully', async () => {
      // Setup
      const artworkId = 'artwork123';
      req.body = { artworkId };

      const mockArtwork = {
        _id: artworkId,
        title: 'Test Artwork'
      };

      const mockUser = {
        _id: 'user123',
        wishlist: [],
        save: jest.fn().mockResolvedValue(true)
      };

      userController.artworkModel.findById.mockResolvedValue(mockArtwork);
      userController.userModel.findById.mockResolvedValue(mockUser);

      // Execute
      await userController.toggleWishlist(req, res);

      // Assert
      expect(userController.artworkModel.findById).toHaveBeenCalledWith(artworkId);
      expect(userController.userModel.findById).toHaveBeenCalledWith('user123');
      expect(mockUser.wishlist).toContain(artworkId);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith({
        success: true,
        action: 'added',
        wishlistCount: 1,
        artworkTitle: 'Test Artwork'
      }, 'تم إضافة العمل إلى المفضلة');
    });

    it('should remove artwork from wishlist successfully', async () => {
      // Setup
      const artworkId = 'artwork123';
      req.body = { artworkId };

      const mockArtwork = {
        _id: artworkId,
        title: 'Test Artwork'
      };

      const mockUser = {
        _id: 'user123',
        wishlist: [artworkId],
        save: jest.fn().mockResolvedValue(true)
      };

      userController.artworkModel.findById.mockResolvedValue(mockArtwork);
      userController.userModel.findById.mockResolvedValue(mockUser);

      // Execute
      await userController.toggleWishlist(req, res);

      // Assert
      expect(mockUser.wishlist).not.toContain(artworkId);
      expect(res.success).toHaveBeenCalledWith({
        success: true,
        action: 'removed',
        wishlistCount: 0,
        artworkTitle: 'Test Artwork'
      }, 'تم إزالة العمل من المفضلة');
    });

    it('should return error if artwork not found', async () => {
      // Setup
      req.body = { artworkId: 'nonexistent' };
      userController.artworkModel.findById.mockResolvedValue(null);

      // Execute
      await userController.toggleWishlist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(null, 'العمل الفني غير موجود', 404);
    });

    it('should return error if user not found', async () => {
      // Setup
      req.body = { artworkId: 'artwork123' };
      userController.artworkModel.findById.mockResolvedValue({ _id: 'artwork123' });
      userController.userModel.findById.mockResolvedValue(null);

      // Execute
      await userController.toggleWishlist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(null, 'المستخدم غير موجود', 404);
    });

    it('should handle database errors', async () => {
      // Setup
      req.body = { artworkId: 'artwork123' };
      const error = new Error('Database error');
      userController.artworkModel.findById.mockRejectedValue(error);

      // Execute
      await userController.toggleWishlist(req, res);

      // Assert
      expect(userController.errorHandler).toHaveBeenCalledWith(res, error, 'حدث خطأ أثناء تحديث المفضلة');
    });
  });

  describe('getWishlist', () => {
    it('should return user wishlist successfully', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        wishlist: [
          { _id: 'artwork1', title: 'Artwork 1' },
          { _id: 'artwork2', title: 'Artwork 2' }
        ]
      };

      userController.userModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUser)
      });

      // Execute
      await userController.getWishlist(req, res);

      // Assert
      expect(userController.userModel.findById).toHaveBeenCalledWith('user123');
      expect(res.success).toHaveBeenCalledWith(mockUser.wishlist, 'تم جلب قائمة المفضلة بنجاح');
    });

    it('should return error if user not found', async () => {
      // Setup
      userController.userModel.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await userController.getWishlist(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(null, 'المستخدم غير موجود', 404);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      // Setup
      const updateData = {
        displayName: 'Updated Name',
        job: 'Designer',
        bio: 'Updated bio'
      };
      req.body = updateData;

      const mockUpdatedUser = {
        _id: 'user123',
        displayName: 'Updated Name',
        job: 'Designer',
        bio: 'Updated bio'
      };

      userController.userModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUpdatedUser)
      });

      // Execute
      await userController.updateProfile(req, res);

      // Assert
      expect(userController.userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        updateData,
        { new: true }
      );
      expect(res.success).toHaveBeenCalledWith({
        success: true,
        message: 'تم تحديث الملف الشخصي بنجاح',
        data: mockUpdatedUser
      });
    });

    it('should return error if user not found', async () => {
      // Setup
      req.body = { displayName: 'New Name' };
      userController.userModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await userController.updateProfile(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(null, 'المستخدم غير موجود', 404);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // Setup
      req.body = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123'
      };

      const mockUser = {
        _id: 'user123',
        password: 'hashedOldPassword',
        save: jest.fn().mockResolvedValue(true)
      };

      userController.userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      userController.bcryptjs.compare.mockResolvedValue(true);
      userController.bcryptjs.hash.mockResolvedValue('hashedNewPassword');

      // Execute
      await userController.changePassword(req, res);

      // Assert
      expect(userController.bcryptjs.compare).toHaveBeenCalledWith('oldpass123', 'hashedOldPassword');
      expect(userController.bcryptjs.hash).toHaveBeenCalledWith('newpass123', 8);
      expect(mockUser.save).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(null, 'تم تغيير كلمة المرور بنجاح');
    });

    it('should return error if old password is incorrect', async () => {
      // Setup
      req.body = {
        oldPassword: 'wrongpass',
        newPassword: 'newpass123'
      };

      const mockUser = {
        password: 'hashedOldPassword'
      };

      userController.userModel.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });
      userController.bcryptjs.compare.mockResolvedValue(false);

      // Execute
      await userController.changePassword(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(null, 'كلمة المرور القديمة غير صحيحة', 400);
    });

    it('should return error if passwords not provided', async () => {
      // Setup
      req.body = {};

      // Execute
      await userController.changePassword(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'يجب توفير كلمة المرور القديمة والجديدة'
      });
    });
  });

  describe('searchUsers', () => {
    it('should search users successfully', async () => {
      // Setup
      req.query = {
        query: 'artist',
        role: 'artist',
        page: 1,
        limit: 10
      };

      const mockUsers = [
        {
          _id: 'user1',
          displayName: 'Artist 1',
          role: 'artist'
        },
        {
          _id: 'user2',
          displayName: 'Artist 2',
          role: 'artist'
        }
      ];

      userController.userModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUsers)
      });

      userController.userModel.countDocuments.mockResolvedValue(2);
      userController.followModel.countDocuments.mockResolvedValue(5);
      userController.artworkModel.countDocuments.mockResolvedValue(3);

      // Execute
      await userController.searchUsers(req, res);

      // Assert
      expect(userController.userModel.find).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          users: expect.any(Array),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalCount: 2
          })
        }),
        'تم البحث عن المستخدمين بنجاح'
      );
    });

    it('should handle search with no results', async () => {
      // Setup
      req.query = { query: 'nonexistent' };

      userController.userModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });

      userController.userModel.countDocuments.mockResolvedValue(0);

      // Execute
      await userController.searchUsers(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          users: [],
          pagination: expect.objectContaining({
            totalCount: 0
          })
        }),
        'تم البحث عن المستخدمين بنجاح'
      );
    });
  });

  describe('getMyProfile', () => {
    it('should return complete user profile with stats', async () => {
      // Setup
      const mockUser = {
        _id: 'user123',
        displayName: 'Test User',
        email: 'test@example.com'
      };

      userController.userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser)
      });

      // Mock all the Promise.all calls
      userController.followModel.countDocuments.mockResolvedValueOnce(10); // followers
      userController.followModel.countDocuments.mockResolvedValueOnce(5);  // following
      userController.artworkModel.countDocuments.mockResolvedValue(8);
      userController.imageModel.countDocuments.mockResolvedValue(15);
      userController.userModel.findById.mockResolvedValueOnce({ wishlist: ['1', '2', '3'] });
      userController.transactionModel.countDocuments.mockResolvedValue(2);
      userController.reviewModel.countDocuments.mockResolvedValue(4);
      userController.reviewModel.aggregate.mockResolvedValue([{ avgRating: 4.5 }]);

      // Execute
      await userController.getMyProfile(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          user: mockUser,
          stats: expect.objectContaining({
            followersCount: 10,
            followingCount: 5,
            artworksCount: 8,
            imagesCount: 15,
            wishlistCount: 3,
            salesCount: 2,
            reviewsCount: 4,
            avgRating: 4.5
          })
        }),
        'تم جلب الملف الشخصي بنجاح'
      );
    });

    it('should return error if user not found', async () => {
      // Setup
      userController.userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await userController.getMyProfile(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(null, 'المستخدم غير موجود', 404);
    });
  });

  describe('updatePrivacySettings', () => {
    it('should update privacy settings successfully', async () => {
      // Setup
      req.body = {
        profileVisibility: 'private',
        showEmail: false,
        allowMessages: 'followers'
      };

      const mockUser = {
        privacySettings: {
          profileVisibility: 'private',
          showEmail: false,
          allowMessages: 'followers'
        }
      };

      userController.userModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser)
      });

      // Execute
      await userController.updatePrivacySettings(req, res);

      // Assert
      expect(userController.userModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'user123',
        {
          $set: {
            'privacySettings.profileVisibility': 'private',
            'privacySettings.showEmail': false,
            'privacySettings.allowMessages': 'followers'
          }
        },
        { new: true }
      );
      expect(res.success).toHaveBeenCalledWith(
        { privacySettings: mockUser.privacySettings },
        'تم تحديث إعدادات الخصوصية بنجاح'
      );
    });

    it('should return error if user not found', async () => {
      // Setup
      req.body = { profileVisibility: 'private' };
      userController.userModel.findByIdAndUpdate.mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await userController.updatePrivacySettings(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(null, 'المستخدم غير موجود', 404);
    });
  });

  describe('getDetailedStats', () => {
    it('should return detailed statistics successfully', async () => {
      // Setup
      req.query = { period: 'month' };

      // Mock all the Promise.all calls for basic stats
      userController.artworkModel.countDocuments.mockResolvedValue(10);
      userController.imageModel.countDocuments.mockResolvedValue(25);
      userController.followModel.countDocuments.mockResolvedValueOnce(15); // followers
      userController.followModel.countDocuments.mockResolvedValueOnce(8);  // following
      userController.transactionModel.countDocuments.mockResolvedValue(5);
      userController.transactionModel.aggregate.mockResolvedValueOnce([{ total: 1500 }]); // earnings
      userController.artworkModel.aggregate.mockResolvedValueOnce([{ total: 2000 }]); // views

      // Mock category stats
      userController.artworkModel.aggregate.mockResolvedValueOnce([
        { _id: 'Painting', count: 6 },
        { _id: 'Digital Art', count: 4 }
      ]);

      // Mock monthly stats
      userController.artworkModel.aggregate.mockResolvedValueOnce([
        { _id: 1, artworks: 3, views: 500 },
        { _id: 2, artworks: 4, views: 700 }
      ]);

      // Execute
      await userController.getDetailedStats(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          overview: expect.objectContaining({
            totalArtworks: 10,
            totalImages: 25,
            totalFollowers: 15,
            totalFollowing: 8,
            totalSales: 5,
            totalEarnings: 1500,
            totalViews: 2000
          }),
          categoryStats: expect.any(Array),
          monthlyStats: expect.any(Array),
          period: 'month'
        }),
        'تم جلب الإحصائيات التفصيلية بنجاح'
      );
    });

    it('should handle period "all" correctly', async () => {
      // Setup
      req.query = { period: 'all' };

      // Mock basic responses
      userController.artworkModel.countDocuments.mockResolvedValue(0);
      userController.imageModel.countDocuments.mockResolvedValue(0);
      userController.followModel.countDocuments.mockResolvedValue(0);
      userController.transactionModel.countDocuments.mockResolvedValue(0);
      userController.transactionModel.aggregate.mockResolvedValue([]);
      userController.artworkModel.aggregate.mockResolvedValue([]);

      // Execute
      await userController.getDetailedStats(req, res);

      // Assert
      expect(userController.artworkModel.countDocuments).toHaveBeenCalledWith(
        expect.objectContaining({ artist: 'user123' })
      );
    });
  });

  describe('getArtistProfile', () => {
    it('should return artist profile successfully', async () => {
      // Setup
      req.params = { artistId: 'artist123' };

      const mockArtist = {
        _id: 'artist123',
        displayName: 'Test Artist',
        email: 'artist@example.com',
        role: 'artist'
      };

      const mockArtworks = [
        { _id: 'artwork1', title: 'Art 1' },
        { _id: 'artwork2', title: 'Art 2' }
      ];

      userController.userModel.findOne.mockResolvedValue(mockArtist);
      userController.followModel.countDocuments.mockResolvedValueOnce(20); // followers
      userController.followModel.findOne.mockResolvedValue(null); // not following
      userController.reviewModel.aggregate.mockResolvedValue([{ avgRating: 4.2, ratingsCount: 8 }]);
      userController.artworkModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockArtworks)
      });
      userController.transactionModel.countDocuments.mockResolvedValue(3);

      // Execute
      await userController.getArtistProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم جلب بيانات الفنان بنجاح',
          data: expect.objectContaining({
            artist: expect.objectContaining({
              _id: 'artist123',
              displayName: 'Test Artist'
            }),
            stats: expect.objectContaining({
              followersCount: 20,
              salesCount: 3
            }),
            isFollowing: false,
            artworks: mockArtworks
          })
        })
      );
    });

    it('should return 404 if artist not found', async () => {
      // Setup
      req.params = { artistId: 'nonexistent' };
      userController.userModel.findOne.mockResolvedValue(null);

      // Execute
      await userController.getArtistProfile(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'الفنان غير موجود'
      });
    });
  });

  describe('discoverArtists', () => {
    it('should discover artists with default sorting', async () => {
      // Setup
      req.query = { page: 1, limit: 10, sort: 'newest' };

      const mockArtists = [
        {
          _id: 'artist1',
          displayName: 'Artist 1',
          role: 'artist'
        }
      ];

      userController.userModel.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockResolvedValue(mockArtists)
      });

      userController.userModel.countDocuments.mockResolvedValue(1);
      userController.followModel.countDocuments.mockResolvedValue(5);

      // Execute
      await userController.discoverArtists(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          artists: expect.any(Array),
          pagination: expect.any(Object)
        }),
        'تم جلب الفنانين بنجاح'
      );
    });

    it('should handle popular sorting with followers aggregation', async () => {
      // Setup
      req.query = { sort: 'popular', page: 1, limit: 10 };

      const mockFollowersAgg = [
        { _id: 'artist1', followersCount: 10 }
      ];

      const mockArtists = [
        {
          _id: 'artist1',
          displayName: 'Popular Artist',
          role: 'artist'
        }
      ];

      userController.followModel.aggregate.mockResolvedValue(mockFollowersAgg);
      userController.userModel.find.mockResolvedValue(mockArtists);
      userController.userModel.countDocuments.mockResolvedValue(1);

      // Execute
      await userController.discoverArtists(req, res);

      // Assert
      expect(userController.followModel.aggregate).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          artists: expect.any(Array)
        }),
        'تم جلب الفنانين بنجاح'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle async errors in toggleWishlist', async () => {
      // Setup
      req.body = { artworkId: 'artwork123' };
      const error = new Error('Async error');
      userController.artworkModel.findById.mockRejectedValue(error);

      // Execute
      await userController.toggleWishlist(req, res);

      // Assert
      expect(userController.errorHandler).toHaveBeenCalledWith(res, error, 'حدث خطأ أثناء تحديث المفضلة');
    });

    it('should handle async errors in searchUsers', async () => {
      // Setup
      req.query = { query: 'test' };
      const error = new Error('Search error');
      userController.userModel.find.mockImplementation(() => {
        throw error;
      });

      // Execute
      await userController.searchUsers(req, res);

      // Assert
      expect(userController.errorHandler).toHaveBeenCalledWith(res, error, 'حدث خطأ أثناء البحث عن المستخدمين');
    });

    it('should handle async errors in getMyProfile', async () => {
      // Setup
      const error = new Error('Profile error');
      userController.userModel.findById.mockImplementation(() => {
        throw error;
      });

      // Execute
      await userController.getMyProfile(req, res);

      // Assert
      expect(userController.errorHandler).toHaveBeenCalledWith(res, error, 'حدث خطأ أثناء جلب الملف الشخصي');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty wishlist in toggleWishlist', async () => {
      // Setup
      req.body = { artworkId: 'artwork123' };
      const mockArtwork = { _id: 'artwork123', title: 'Test Art' };
      const mockUser = {
        _id: 'user123',
        wishlist: [],
        save: jest.fn().mockResolvedValue(true)
      };

      userController.artworkModel.findById.mockResolvedValue(mockArtwork);
      userController.userModel.findById.mockResolvedValue(mockUser);

      // Execute
      await userController.toggleWishlist(req, res);

      // Assert
      expect(mockUser.wishlist).toHaveLength(1);
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'added' }),
        'تم إضافة العمل إلى المفضلة'
      );
    });

    it('should handle user with no stats in getMyProfile', async () => {
      // Setup
      const mockUser = { _id: 'user123', displayName: 'Test' };
      
      userController.userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockUser)
      });

      // Mock all counts as 0
      userController.followModel.countDocuments.mockResolvedValue(0);
      userController.artworkModel.countDocuments.mockResolvedValue(0);
      userController.imageModel.countDocuments.mockResolvedValue(0);
      userController.userModel.findById.mockResolvedValueOnce({ wishlist: [] });
      userController.transactionModel.countDocuments.mockResolvedValue(0);
      userController.reviewModel.countDocuments.mockResolvedValue(0);
      userController.reviewModel.aggregate.mockResolvedValue([]);

      // Execute
      await userController.getMyProfile(req, res);

      // Assert
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          stats: expect.objectContaining({
            followersCount: 0,
            avgRating: 0
          })
        }),
        'تم جلب الملف الشخصي بنجاح'
      );
    });
  });
});
