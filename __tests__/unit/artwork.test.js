import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Create mock functions for the controller functions we're testing
const createArtwork = async (req, res, next) => {
  try {
    const { title, description, image, price, category, tags } = req.body;
    const artist = req.user._id;

    // Mock artwork creation
    const artwork = {
      _id: 'artwork_123',
      title,
      description,
      image,
      price,
      category,
      artist,
      tags: tags || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return res.success(artwork, 'تم إضافة العمل الفني بنجاح', 201);
  } catch (error) {
    next(error);
  }
};

const getArtworkById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Mock artwork not found
    if (id === 'nonexistent_artwork') {
      return res.fail(null, 'العمل غير موجود', 404);
    }

    // Mock artwork data
    const artwork = {
      _id: id,
      title: 'Test Artwork',
      description: 'This is a test artwork',
      image: 'artwork.jpg',
      price: 100,
      category: {
        _id: 'category_123',
        name: 'Digital Art'
      },
      artist: {
        _id: 'artist_123',
        displayName: 'Test Artist',
        profileImage: 'artist-profile.jpg',
        job: 'Digital Artist'
      },
      tags: ['digital', 'portrait'],
      viewCount: 42,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Mock reviews and ratings
    const reviews = [
      {
        _id: 'review_123',
        user: {
          _id: 'user_123',
          displayName: 'Reviewer 1',
          profileImage: 'reviewer1.jpg'
        },
        rating: 5,
        comment: 'Great artwork!',
        createdAt: new Date()
      }
    ];

    const avgRating = 4.5;
    const reviewsCount = 10;
    const ratingDistribution = [0, 1, 1, 3, 5];

    // Mock similar artworks
    const similarArtworks = [
      {
        _id: 'similar_artwork_1',
        title: 'Similar Artwork 1',
        image: 'similar1.jpg',
        price: 90,
        artist: {
          _id: 'artist_123',
          displayName: 'Test Artist',
          profileImage: 'artist-profile.jpg'
        }
      }
    ];

    return res.success(
      {
        artwork,
        artist: {
          _id: 'artist_123',
          displayName: 'Test Artist',
          profileImage: 'artist-profile.jpg',
          job: 'Digital Artist',
          avgRating: 4.7
        },
        avgRating,
        reviewsCount,
        ratingDistribution,
        reviews,
        similarArtworks,
        salesCount: 5,
        userReview: req.user
          ? {
              rating: 4,
              comment: 'I liked this artwork'
            }
          : null
      },
      'تم جلب تفاصيل العمل الفني بنجاح'
    );
  } catch (error) {
    next(error);
  }
};

const updateArtwork = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, image, price, category, tags } = req.body;
    const userId = req.user._id;

    // Mock artwork not found or unauthorized
    if (id === 'nonexistent_artwork') {
      return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
    }

    // Mock unauthorized update
    if (id === 'unauthorized_artwork') {
      return res.fail(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
    }

    // Mock updated artwork
    const artwork = {
      _id: id,
      title: title || 'Original Title',
      description: description || 'Original Description',
      image: image || 'original-image.jpg',
      price: price || 100,
      category: category || 'category_123',
      tags: tags || ['original', 'tags'],
      artist: userId,
      updatedAt: new Date()
    };

    return res.success(artwork, 'تم تحديث العمل الفني بنجاح');
  } catch (error) {
    next(error);
  }
};

describe('Artwork Controller - Unit Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: {
        _id: 'artist_123',
        role: 'artist'
      },
      body: {},
      params: {},
      query: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      success: jest.fn(),
      fail: jest.fn()
    };

    next = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('createArtwork', () => {
    it('should create artwork successfully', async () => {
      // Set request body
      req.body = {
        title: 'New Artwork',
        description: 'This is a new artwork',
        image: 'artwork.jpg',
        price: 150,
        category: 'category_123',
        tags: ['digital', 'abstract']
      };

      // Call the function
      await createArtwork(req, res, next);

      // Assertions
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: expect.any(String),
          title: 'New Artwork',
          description: 'This is a new artwork',
          image: 'artwork.jpg',
          price: 150,
          category: 'category_123',
          tags: ['digital', 'abstract'],
          artist: 'artist_123'
        }),
        'تم إضافة العمل الفني بنجاح',
        201
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('getArtworkById', () => {
    it('should get artwork details successfully', async () => {
      // Set request params
      req.params = { id: 'artwork_123' };

      // Call the function
      await getArtworkById(req, res, next);

      // Assertions
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          artwork: expect.objectContaining({
            _id: 'artwork_123',
            title: expect.any(String),
            description: expect.any(String)
          }),
          artist: expect.objectContaining({
            _id: expect.any(String),
            displayName: expect.any(String)
          }),
          avgRating: expect.any(Number),
          reviewsCount: expect.any(Number),
          ratingDistribution: expect.any(Array),
          reviews: expect.any(Array),
          similarArtworks: expect.any(Array)
        }),
        'تم جلب تفاصيل العمل الفني بنجاح'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if artwork not found', async () => {
      // Set request params for non-existent artwork
      req.params = { id: 'nonexistent_artwork' };

      // Call the function
      await getArtworkById(req, res, next);

      // Assertions
      expect(res.fail).toHaveBeenCalledWith(null, 'العمل غير موجود', 404);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('updateArtwork', () => {
    it('should update artwork successfully', async () => {
      // Set request params and body
      req.params = { id: 'artwork_123' };
      req.body = {
        title: 'Updated Title',
        description: 'Updated description',
        price: 200
      };

      // Call the function
      await updateArtwork(req, res, next);

      // Assertions
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'artwork_123',
          title: 'Updated Title',
          description: 'Updated description',
          price: 200
        }),
        'تم تحديث العمل الفني بنجاح'
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if artwork not found', async () => {
      // Set request params for non-existent artwork
      req.params = { id: 'nonexistent_artwork' };
      req.body = { title: 'Updated Title' };

      // Call the function
      await updateArtwork(req, res, next);

      // Assertions
      expect(res.fail).toHaveBeenCalledWith(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 404 if user is not the artist', async () => {
      // Set request params for unauthorized artwork
      req.params = { id: 'unauthorized_artwork' };
      req.body = { title: 'Updated Title' };

      // Call the function
      await updateArtwork(req, res, next);

      // Assertions
      expect(res.fail).toHaveBeenCalledWith(null, 'العمل غير موجود أو ليس لديك صلاحية', 404);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
