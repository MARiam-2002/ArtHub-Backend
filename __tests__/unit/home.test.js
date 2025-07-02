import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { getHomeData, search, getTrendingArtworks } from '../../src/modules/home/home.controller.js';
import artworkModel from '../../DB/models/artwork.model.js';
import userModel from '../../DB/models/user.model.js';
import categoryModel from '../../DB/models/category.model.js';
import reviewModel from '../../DB/models/review.model.js';

// Mock the models
jest.mock('../../DB/models/artwork.model.js');
jest.mock('../../DB/models/user.model.js');
jest.mock('../../DB/models/category.model.js');
jest.mock('../../DB/models/review.model.js');

// Mock response middleware
const mockResponse = () => {
  const res = {};
  res.success = jest.fn().mockReturnValue(res);
  res.fail = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

describe('Home Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getHomeData', () => {
    it('should return home data successfully for anonymous user', async () => {
      // Mock data
      const mockCategories = [
        { _id: '1', name: 'لوحات زيتية', image: { url: 'image1.jpg' } },
        { _id: '2', name: 'رسم رقمي', image: { url: 'image2.jpg' } }
      ];

      const mockTopArtists = [
        {
          _id: '1',
          displayName: 'أحمد الفنان',
          profileImage: { url: 'profile1.jpg' },
          job: 'رسام',
          averageRating: 4.5,
          reviewsCount: 10,
          artworksCount: 15
        }
      ];

      const mockFeaturedArtworks = [
        {
          _id: '1',
          title: { ar: 'لوحة جميلة' },
          images: [{ url: 'artwork1.jpg' }],
          price: 500,
          currency: 'SAR',
          isAvailable: true,
          artist: {
            _id: '1',
            displayName: 'أحمد الفنان',
            profileImage: { url: 'profile1.jpg' },
            job: 'رسام'
          },
          category: { _id: '1', name: 'لوحات زيتية' },
          createdAt: new Date()
        }
      ];

      const mockLatestArtworks = [mockFeaturedArtworks[0]];

      // Mock model methods
      categoryModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockCategories)
        })
      });

      userModel.aggregate.mockResolvedValue(mockTopArtists);

      artworkModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockFeaturedArtworks)
              })
            })
          })
        })
      });

      const req = { user: null };
      const res = mockResponse();

      await getHomeData(req, res, mockNext);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: expect.arrayContaining([
            expect.objectContaining({
              _id: '1',
              name: 'لوحات زيتية'
            })
          ]),
          topArtists: expect.arrayContaining([
            expect.objectContaining({
              _id: '1',
              displayName: 'أحمد الفنان'
            })
          ]),
          featuredArtworks: expect.any(Array),
          latestArtworks: expect.any(Array),
          personalizedArtworks: expect.any(Array)
        }),
        'تم جلب بيانات الصفحة الرئيسية بنجاح'
      );
    });

    it('should handle errors and call next', async () => {
      categoryModel.find.mockImplementation(() => {
        throw new Error('Database error');
      });

      const req = { user: null };
      const res = mockResponse();

      await getHomeData(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'حدث خطأ أثناء جلب بيانات الصفحة الرئيسية'
        })
      );
    });

    it('should include personalized artworks for authenticated user', async () => {
      // Mock user with preferences
      const mockUser = {
        _id: 'user1',
        viewedCategories: ['cat1', 'cat2'],
        wishlist: ['artwork1']
      };

      const mockPersonalizedArtworks = [
        {
          _id: 'artwork1',
          title: { ar: 'عمل مخصص' },
          images: [{ url: 'custom.jpg' }],
          price: 300,
          isAvailable: true,
          artist: { _id: 'artist1', displayName: 'فنان مخصص' },
          category: { _id: 'cat1', name: 'تصنيف مخصص' },
          createdAt: new Date()
        }
      ];

      // Mock the basic data
      categoryModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      userModel.aggregate.mockResolvedValue([]);

      artworkModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue([])
              })
            })
          })
        })
      });

      // Mock personalized artworks
      userModel.findById.mockReturnValue({
        select: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(mockUser)
        })
      });

      const req = { user: mockUser };
      const res = mockResponse();

      await getHomeData(req, res, mockNext);

      expect(userModel.findById).toHaveBeenCalledWith('user1');
    });
  });

  describe('search', () => {
    it('should search artworks and artists successfully', async () => {
      const mockArtworks = [
        {
          _id: 'artwork1',
          title: { ar: 'لوحة بحث' },
          images: [{ url: 'search.jpg' }],
          price: 400,
          isAvailable: true,
          artist: { _id: 'artist1', displayName: 'فنان البحث' },
          category: { _id: 'cat1', name: 'تصنيف البحث' },
          createdAt: new Date()
        }
      ];

      const mockArtists = [
        {
          _id: 'artist1',
          displayName: 'فنان البحث',
          profileImage: { url: 'artist.jpg' },
          job: 'رسام',
          bio: 'فنان موهوب'
        }
      ];

      // Mock artwork search
      artworkModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockArtworks)
                })
              })
            })
          })
        })
      });

      artworkModel.countDocuments.mockResolvedValue(1);

      // Mock artist search
      userModel.find.mockReturnValue({
        select: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockResolvedValue(mockArtists)
            })
          })
        })
      });

      userModel.countDocuments.mockResolvedValue(1);

      const req = {
        query: {
          q: 'بحث',
          type: 'all',
          page: 1,
          limit: 10
        }
      };
      const res = mockResponse();

      await search(req, res, mockNext);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          artworks: expect.objectContaining({
            data: expect.any(Array),
            pagination: expect.any(Object)
          }),
          artists: expect.objectContaining({
            data: expect.any(Array),
            pagination: expect.any(Object)
          })
        }),
        'تم البحث بنجاح'
      );
    });

    it('should search only artworks when type is artworks', async () => {
      const mockArtworks = [
        {
          _id: 'artwork1',
          title: { ar: 'لوحة' },
          images: [{ url: 'artwork.jpg' }],
          price: 300,
          isAvailable: true,
          artist: { _id: 'artist1', displayName: 'فنان' },
          category: { _id: 'cat1', name: 'تصنيف' },
          createdAt: new Date()
        }
      ];

      artworkModel.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            sort: jest.fn().mockReturnValue({
              skip: jest.fn().mockReturnValue({
                limit: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockArtworks)
                })
              })
            })
          })
        })
      });

      artworkModel.countDocuments.mockResolvedValue(1);

      const req = {
        query: {
          q: 'لوحة',
          type: 'artworks',
          page: 1,
          limit: 10
        }
      };
      const res = mockResponse();

      await search(req, res, mockNext);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          artworks: expect.any(Object)
        }),
        'تم البحث بنجاح'
      );

      // Should not include artists in response
      expect(res.success.mock.calls[0][0]).not.toHaveProperty('artists');
    });

    it('should handle search with filters', async () => {
      artworkModel.find.mockReturnValue({
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

      artworkModel.countDocuments.mockResolvedValue(0);

      const req = {
        query: {
          q: 'لوحة',
          type: 'artworks',
          category: '60d0fe4f5311236168a109ca',
          minPrice: 100,
          maxPrice: 500,
          page: 1,
          limit: 10
        }
      };
      const res = mockResponse();

      await search(req, res, mockNext);

      // Verify that the search query was built with filters
      expect(artworkModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          isAvailable: true,
          category: '60d0fe4f5311236168a109ca',
          price: { $gte: 100, $lte: 500 },
          $or: expect.any(Array)
        })
      );
    });

    it('should handle search errors', async () => {
      artworkModel.find.mockImplementation(() => {
        throw new Error('Search error');
      });

      const req = {
        query: {
          q: 'بحث',
          type: 'all'
        }
      };
      const res = mockResponse();

      await search(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'حدث خطأ أثناء البحث'
        })
      );
    });
  });

  describe('getTrendingArtworks', () => {
    it('should return trending artworks successfully', async () => {
      const mockTrendingArtworks = [
        {
          _id: 'trending1',
          title: { ar: 'عمل رائج' },
          images: [{ url: 'trending.jpg' }],
          price: 600,
          viewCount: 100,
          likeCount: 50,
          isAvailable: true,
          artist: { _id: 'artist1', displayName: 'فنان رائج' },
          category: { _id: 'cat1', name: 'تصنيف رائج' },
          createdAt: new Date()
        }
      ];

      artworkModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockTrendingArtworks)
                })
              })
            })
          })
        })
      });

      artworkModel.countDocuments.mockResolvedValue(1);

      const req = {
        query: {
          page: 1,
          limit: 10
        }
      };
      const res = mockResponse();

      await getTrendingArtworks(req, res, mockNext);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          artworks: expect.arrayContaining([
            expect.objectContaining({
              _id: 'trending1',
              title: { ar: 'عمل رائج' },
              viewCount: 100,
              likeCount: 50
            })
          ]),
          pagination: expect.objectContaining({
            currentPage: 1,
            totalPages: 1,
            totalItems: 1,
            hasNextPage: false
          })
        }),
        'تم جلب الأعمال الرائجة بنجاح'
      );
    });

    it('should handle pagination correctly', async () => {
      artworkModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue([])
                })
              })
            })
          })
        })
      });

      artworkModel.countDocuments.mockResolvedValue(25);

      const req = {
        query: {
          page: 2,
          limit: 10
        }
      };
      const res = mockResponse();

      await getTrendingArtworks(req, res, mockNext);

      // Verify skip calculation
      expect(artworkModel.find().sort().skip).toHaveBeenCalledWith(10);
      expect(artworkModel.find().sort().skip().limit).toHaveBeenCalledWith(10);

      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({
            currentPage: 2,
            totalPages: 3,
            totalItems: 25,
            hasNextPage: true
          })
        }),
        'تم جلب الأعمال الرائجة بنجاح'
      );
    });

    it('should handle trending artworks errors', async () => {
      artworkModel.find.mockImplementation(() => {
        throw new Error('Trending error');
      });

      const req = {
        query: {
          page: 1,
          limit: 10
        }
      };
      const res = mockResponse();

      await getTrendingArtworks(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'حدث خطأ أثناء جلب الأعمال الرائجة'
        })
      );
    });
  });

  describe('Helper Functions', () => {
    it('should format artworks list correctly', async () => {
      const mockArtworks = [
        {
          _id: 'artwork1',
          title: { ar: 'لوحة', en: 'Painting' },
          description: { ar: 'وصف', en: 'Description' },
          images: [{ url: 'image.jpg' }],
          price: 500,
          currency: 'SAR',
          dimensions: { width: 100, height: 80 },
          tags: ['فن', 'لوحة'],
          viewCount: 50,
          likeCount: 25,
          isAvailable: true,
          artist: {
            _id: 'artist1',
            displayName: 'فنان',
            profileImage: { url: 'profile.jpg' },
            job: 'رسام'
          },
          category: {
            _id: 'cat1',
            name: 'تصنيف'
          },
          createdAt: new Date('2023-01-01')
        }
      ];

      // Mock the home data call to test formatting
      categoryModel.find.mockReturnValue({
        limit: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue([])
        })
      });

      userModel.aggregate.mockResolvedValue([]);

      artworkModel.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockArtworks)
              })
            })
          })
        })
      });

      const req = { user: null };
      const res = mockResponse();

      await getHomeData(req, res, mockNext);

      const responseData = res.success.mock.calls[0][0];
      const formattedArtwork = responseData.featuredArtworks[0];

      expect(formattedArtwork).toEqual(
        expect.objectContaining({
          _id: 'artwork1',
          title: { ar: 'لوحة', en: 'Painting' },
          description: { ar: 'وصف', en: 'Description' },
          images: [{ url: 'image.jpg' }],
          price: 500,
          currency: 'SAR',
          dimensions: { width: 100, height: 80 },
          tags: ['فن', 'لوحة'],
          viewCount: 50,
          likeCount: 25,
          isAvailable: true,
          artist: expect.objectContaining({
            _id: 'artist1',
            displayName: 'فنان'
          }),
          category: expect.objectContaining({
            _id: 'cat1',
            name: 'تصنيف'
          }),
          createdAt: expect.any(Date)
        })
      );
    });
  });
}); 