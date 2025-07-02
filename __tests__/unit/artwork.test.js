import { jest, describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from '@jest/globals';
import mongoose from 'mongoose';
import artworkModel from '../../DB/models/artwork.model.js';
import userModel from '../../DB/models/user.model.js';
import categoryModel from '../../DB/models/category.model.js';
import * as artworkController from '../../src/modules/artwork/controller/artwork.js';

// Mock dependencies
jest.mock('../../DB/models/artwork.model.js');
jest.mock('../../DB/models/user.model.js');
jest.mock('../../DB/models/category.model.js');
jest.mock('../../DB/models/review.model.js');
jest.mock('../../src/utils/pagination.js');
jest.mock('../../src/utils/asyncHandler.js');

// Mock external services
jest.mock('../../src/utils/cloudinary.js', () => ({
  uploadImage: jest.fn().mockResolvedValue({
    secure_url: 'https://cloudinary.com/test-image.jpg',
    public_id: 'test-image-id'
  }),
  deleteImage: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../src/utils/pushNotifications.js', () => ({
  sendNotificationToFollowers: jest.fn().mockResolvedValue(true)
}));

describe('Artwork Controller', () => {
  let req, res, next;
  let testUser, testArtist, testCategory, testArtwork;
  
  // Import artwork controller functions
  let artworkController;

  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.TEST_DB_URI || 'mongodb://localhost:27017/arthub-test';
    await mongoose.connect(mongoUri);
    
    // Import controller after mocks are set up
    artworkController = await import('../../src/modules/artwork/controller/artwork.js');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections
    await artworkModel.deleteMany({});
    await userModel.deleteMany({});
    await categoryModel.deleteMany({});

    // Create test category
    testCategory = await categoryModel.create({
      name: 'Test Category',
      description: 'Test category description'
    });

    // Create test user (regular user)
    testUser = await userModel.create({
      email: 'user@example.com',
      password: 'hashedpassword',
      displayName: 'Test User',
      role: 'user',
      isActive: true
    });

    // Create test artist
    testArtist = await userModel.create({
      email: 'artist@example.com',
      password: 'hashedpassword',
      displayName: 'Test Artist',
      role: 'artist',
      isActive: true
    });

    // Create test artwork
    testArtwork = await artworkModel.create({
      title: 'Test Artwork',
      description: 'Test artwork description',
      price: 500,
      category: testCategory._id,
      artist: testArtist._id,
      images: ['https://example.com/image1.jpg'],
      tags: ['test', 'artwork'],
      status: 'available'
    });

    // Setup request, response, and next mocks
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: testArtist._id,
        email: testArtist.email,
        displayName: testArtist.displayName,
        role: testArtist.role
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(async () => {
    // Clean up after each test
    await artworkModel.deleteMany({});
    await userModel.deleteMany({});
    await categoryModel.deleteMany({});
  });

  describe('Get All Artworks', () => {
    beforeEach(() => {
      req.query = {
        page: 1,
        limit: 10
      };
    });

    it('should get all artworks successfully', async () => {
      await artworkController.getAllArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: expect.arrayContaining([
              expect.objectContaining({
                title: 'Test Artwork',
                price: 500
              })
            ]),
            pagination: expect.any(Object)
          })
        })
      );
    });

    it('should filter artworks by category', async () => {
      req.query.category = testCategory._id.toString();
      
      await artworkController.getAllArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: expect.arrayContaining([
              expect.objectContaining({
                category: expect.objectContaining({
                  _id: testCategory._id.toString()
                })
              })
            ])
          })
        })
      );
    });

    it('should filter artworks by price range', async () => {
      req.query.minPrice = 100;
      req.query.maxPrice = 1000;
      
      await artworkController.getAllArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: expect.arrayContaining([
              expect.objectContaining({
                price: expect.any(Number)
              })
            ])
          })
        })
      );
    });

    it('should search artworks by title', async () => {
      req.query.search = 'Test';
      
      await artworkController.getAllArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: expect.arrayContaining([
              expect.objectContaining({
                title: expect.stringContaining('Test')
              })
            ])
          })
        })
      );
    });
  });

  describe('Get Artwork by ID', () => {
    beforeEach(() => {
      req.params = { artworkId: testArtwork._id.toString() };
    });

    it('should get artwork by ID successfully', async () => {
      await artworkController.getArtworkById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            _id: testArtwork._id.toString(),
            title: 'Test Artwork',
            artist: expect.objectContaining({
              displayName: 'Test Artist'
            })
          })
        })
      );
    });

    it('should return 404 for non-existent artwork', async () => {
      req.params.artworkId = new mongoose.Types.ObjectId().toString();
      
      await artworkController.getArtworkById(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'العمل الفني غير موجود',
          cause: 404
        })
      );
    });

    it('should increment view count when artwork is viewed', async () => {
      const initialViewCount = testArtwork.viewCount || 0;
      
      await artworkController.getArtworkById(req, res, next);

      const updatedArtwork = await artworkModel.findById(testArtwork._id);
      expect(updatedArtwork.viewCount).toBe(initialViewCount + 1);
    });
  });

  describe('Create Artwork', () => {
    beforeEach(() => {
      req.body = {
        title: 'New Artwork',
        description: 'New artwork description',
        price: 750,
        category: testCategory._id.toString(),
        images: ['https://example.com/new-image.jpg'],
        tags: ['new', 'artwork'],
        status: 'available'
      };
    });

    it('should create artwork successfully for artist', async () => {
      await artworkController.createArtwork(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم إنشاء العمل الفني بنجاح',
          data: expect.objectContaining({
            title: 'New Artwork',
            price: 750,
            artist: testArtist._id.toString()
          })
        })
      );
    });

    it('should reject artwork creation for non-artist', async () => {
      req.user = {
        _id: testUser._id,
        role: 'user'
      };
      
      await artworkController.createArtwork(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'يمكن للفنانين فقط إنشاء الأعمال الفنية',
          cause: 403
        })
      );
    });

    it('should reject artwork with invalid category', async () => {
      req.body.category = new mongoose.Types.ObjectId().toString();
      
      await artworkController.createArtwork(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'الفئة غير موجودة',
          cause: 404
        })
      );
    });

    it('should create artwork with default values', async () => {
      delete req.body.tags;
      delete req.body.status;
      
      await artworkController.createArtwork(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            tags: [],
            status: 'available'
          })
        })
      );
    });
  });

  describe('Update Artwork', () => {
    beforeEach(() => {
      req.params = { artworkId: testArtwork._id.toString() };
      req.body = {
        title: 'Updated Artwork',
        price: 600
      };
    });

    it('should update artwork successfully by owner', async () => {
      await artworkController.updateArtwork(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم تحديث العمل الفني بنجاح',
          data: expect.objectContaining({
            title: 'Updated Artwork',
            price: 600
          })
        })
      );
    });

    it('should reject update by non-owner', async () => {
      req.user = {
        _id: testUser._id,
        role: 'user'
      };
      
      await artworkController.updateArtwork(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'غير مصرح لك بتعديل هذا العمل الفني',
          cause: 403
        })
      );
    });

    it('should return 404 for non-existent artwork', async () => {
      req.params.artworkId = new mongoose.Types.ObjectId().toString();
      
      await artworkController.updateArtwork(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'العمل الفني غير موجود',
          cause: 404
        })
      );
    });
  });

  describe('Delete Artwork', () => {
    beforeEach(() => {
      req.params = { artworkId: testArtwork._id.toString() };
    });

    it('should delete artwork successfully by owner', async () => {
      await artworkController.deleteArtwork(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'تم حذف العمل الفني بنجاح'
        })
      );

      // Verify artwork is deleted
      const deletedArtwork = await artworkModel.findById(testArtwork._id);
      expect(deletedArtwork).toBeNull();
    });

    it('should reject deletion by non-owner', async () => {
      req.user = {
        _id: testUser._id,
        role: 'user'
      };
      
      await artworkController.deleteArtwork(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'غير مصرح لك بحذف هذا العمل الفني',
          cause: 403
        })
      );
    });

    it('should return 404 for non-existent artwork', async () => {
      req.params.artworkId = new mongoose.Types.ObjectId().toString();
      
      await artworkController.deleteArtwork(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'العمل الفني غير موجود',
          cause: 404
        })
      );
    });
  });

  describe('Search Artworks', () => {
    beforeEach(() => {
      req.query = {
        q: 'Test',
        page: 1,
        limit: 10
      };
    });

    it('should search artworks successfully', async () => {
      await artworkController.searchArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: expect.any(Array),
            pagination: expect.any(Object),
            searchQuery: 'Test'
          })
        })
      );
    });

    it('should return empty results for no matches', async () => {
      req.query.q = 'NonExistentArtwork';
      
      await artworkController.searchArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: [],
            pagination: expect.objectContaining({
              total: 0
            })
          })
        })
      );
    });
  });

  describe('Toggle Favorite', () => {
    beforeEach(() => {
      req.params = { artworkId: testArtwork._id.toString() };
      req.user = {
        _id: testUser._id,
        role: 'user'
      };
    });

    it('should add artwork to favorites', async () => {
      await artworkController.toggleFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          action: 'added',
          message: expect.stringContaining('تم إضافة')
        })
      );
    });

    it('should remove artwork from favorites if already favorited', async () => {
      // First add to favorites
      await userModel.findByIdAndUpdate(testUser._id, {
        $push: { favoriteArtworks: testArtwork._id }
      });

      await artworkController.toggleFavorite(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          action: 'removed',
          message: expect.stringContaining('تم إزالة')
        })
      );
    });

    it('should return 404 for non-existent artwork', async () => {
      req.params.artworkId = new mongoose.Types.ObjectId().toString();
      
      await artworkController.toggleFavorite(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'العمل الفني غير موجود',
          cause: 404
        })
      );
    });
  });

  describe('Get Artworks by Artist', () => {
    beforeEach(() => {
      req.params = { artistId: testArtist._id.toString() };
      req.query = { page: 1, limit: 10 };
    });

    it('should get artworks by artist successfully', async () => {
      await artworkController.getArtworksByArtist(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: expect.arrayContaining([
              expect.objectContaining({
                artist: expect.objectContaining({
                  _id: testArtist._id.toString()
                })
              })
            ]),
            pagination: expect.any(Object)
          })
        })
      );
    });

    it('should return 404 for non-existent artist', async () => {
      req.params.artistId = new mongoose.Types.ObjectId().toString();
      
      await artworkController.getArtworksByArtist(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'الفنان غير موجود',
          cause: 404
        })
      );
    });
  });

  describe('Get My Artworks', () => {
    beforeEach(() => {
      req.query = { page: 1, limit: 10 };
    });

    it('should get current user artworks successfully', async () => {
      await artworkController.getMyArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: expect.arrayContaining([
              expect.objectContaining({
                artist: testArtist._id.toString()
              })
            ]),
            pagination: expect.any(Object),
            stats: expect.any(Object)
          })
        })
      );
    });

    it('should return empty results for user with no artworks', async () => {
      req.user._id = testUser._id;
      
      await artworkController.getMyArtworks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            artworks: [],
            pagination: expect.objectContaining({
              total: 0
            })
          })
        })
      );
    });
  });
});
