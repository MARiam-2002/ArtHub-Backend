import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// Mock the database models
jest.unstable_mockModule('../../../DB/models/category.model.js', () => ({
  default: {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    paginate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn()
  }
}));

jest.unstable_mockModule('../../../DB/models/artwork.model.js', () => ({
  default: {
    countDocuments: jest.fn(),
    find: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    populate: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn()
  }
}));

// Import after mocking
const categoryModel = (await import('../../../DB/models/category.model.js')).default;
const artworkModel = (await import('../../../DB/models/artwork.model.js')).default;
const * as categoryController = await import('../../../src/modules/category/category.controller.js');

describe('Category Controller Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: {
        _id: 'admin123',
        role: 'admin'
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
    jest.clearAllMocks();
  });

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      // Setup
      req.body = {
        name: 'لوحات زيتية',
        description: 'لوحات مرسومة بالألوان الزيتية',
        image: {
          url: 'https://example.com/image.jpg',
          id: 'image123'
        }
      };

      const mockCreatedCategory = {
        _id: 'category123',
        name: 'لوحات زيتية',
        description: 'لوحات مرسومة بالألوان الزيتية',
        image: {
          url: 'https://example.com/image.jpg',
          id: 'image123'
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      categoryModel.findOne.mockResolvedValue(null);
      categoryModel.create.mockResolvedValue(mockCreatedCategory);

      // Execute
      await categoryController.createCategory(req, res, next);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        name: { $regex: new RegExp(`^${req.body.name.trim()}$`, 'i') }
      });
      expect(categoryModel.create).toHaveBeenCalledWith({
        name: req.body.name.trim(),
        description: req.body.description.trim(),
        image: req.body.image
      });
      expect(res.success).toHaveBeenCalledWith(
        mockCreatedCategory,
        'تم إنشاء التصنيف بنجاح',
        201
      );
    });

    it('should fail when category name already exists', async () => {
      // Setup
      req.body = {
        name: 'لوحات زيتية',
        description: 'لوحات مرسومة بالألوان الزيتية'
      };

      const existingCategory = {
        _id: 'existing123',
        name: 'لوحات زيتية'
      };

      categoryModel.findOne.mockResolvedValue(existingCategory);

      // Execute
      await categoryController.createCategory(req, res, next);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalled();
      expect(categoryModel.create).not.toHaveBeenCalled();
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'يوجد تصنيف بنفس هذا الاسم بالفعل',
        409
      );
    });

    it('should handle database errors', async () => {
      // Setup
      req.body = {
        name: 'لوحات زيتية'
      };

      categoryModel.findOne.mockRejectedValue(new Error('Database error'));

      // Execute
      await categoryController.createCategory(req, res, next);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء إنشاء التصنيف',
        500
      );
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      // Setup
      req.params.id = 'category123';
      req.body = {
        name: 'لوحات زيتية محدثة',
        description: 'وصف محدث'
      };

      const existingCategory = {
        _id: 'category123',
        name: 'لوحات زيتية',
        description: 'وصف قديم'
      };

      const updatedCategory = {
        ...existingCategory,
        name: 'لوحات زيتية محدثة',
        description: 'وصف محدث'
      };

      categoryModel.findById.mockResolvedValue(existingCategory);
      categoryModel.findOne.mockResolvedValue(null);
      categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      // Execute
      await categoryController.updateCategory(req, res, next);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(req.params.id);
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        req.params.id,
        {
          name: req.body.name.trim(),
          description: req.body.description.trim()
        },
        { new: true, runValidators: true }
      );
      expect(res.success).toHaveBeenCalledWith(
        updatedCategory,
        'تم تحديث التصنيف بنجاح'
      );
    });

    it('should fail when category not found', async () => {
      // Setup
      req.params.id = 'nonexistent123';
      req.body = { name: 'اسم جديد' };

      categoryModel.findById.mockResolvedValue(null);

      // Execute
      await categoryController.updateCategory(req, res, next);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التصنيف غير موجود',
        404
      );
    });

    it('should fail when new name already exists', async () => {
      // Setup
      req.params.id = 'category123';
      req.body = { name: 'اسم موجود' };

      const existingCategory = {
        _id: 'category123',
        name: 'اسم قديم'
      };

      const duplicateCategory = {
        _id: 'other123',
        name: 'اسم موجود'
      };

      categoryModel.findById.mockResolvedValue(existingCategory);
      categoryModel.findOne.mockResolvedValue(duplicateCategory);

      // Execute
      await categoryController.updateCategory(req, res, next);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'يوجد تصنيف بنفس هذا الاسم بالفعل',
        409
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully when no artworks exist', async () => {
      // Setup
      req.params.id = 'category123';

      const existingCategory = {
        _id: 'category123',
        name: 'تصنيف للحذف'
      };

      categoryModel.findById.mockResolvedValue(existingCategory);
      artworkModel.countDocuments.mockResolvedValue(0);
      categoryModel.findByIdAndDelete.mockResolvedValue(existingCategory);

      // Execute
      await categoryController.deleteCategory(req, res, next);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(req.params.id);
      expect(artworkModel.countDocuments).toHaveBeenCalledWith({ 
        category: req.params.id 
      });
      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(req.params.id);
      expect(res.success).toHaveBeenCalledWith(
        null,
        'تم حذف التصنيف بنجاح'
      );
    });

    it('should fail when category has associated artworks', async () => {
      // Setup
      req.params.id = 'category123';

      const existingCategory = {
        _id: 'category123',
        name: 'تصنيف مرتبط'
      };

      categoryModel.findById.mockResolvedValue(existingCategory);
      artworkModel.countDocuments.mockResolvedValue(5);

      // Execute
      await categoryController.deleteCategory(req, res, next);

      // Assert
      expect(artworkModel.countDocuments).toHaveBeenCalledWith({ 
        category: req.params.id 
      });
      expect(categoryModel.findByIdAndDelete).not.toHaveBeenCalled();
      expect(res.fail).toHaveBeenCalledWith(
        { artworksCount: 5 },
        'لا يمكن حذف التصنيف لأنه مرتبط بـ 5 عمل فني',
        400
      );
    });

    it('should fail when category not found', async () => {
      // Setup
      req.params.id = 'nonexistent123';

      categoryModel.findById.mockResolvedValue(null);

      // Execute
      await categoryController.deleteCategory(req, res, next);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التصنيف غير موجود',
        404
      );
    });
  });

  describe('getCategories', () => {
    it('should get categories with pagination successfully', async () => {
      // Setup
      req.query = {
        page: '1',
        limit: '10',
        search: 'لوحات'
      };

      const mockCategories = [
        { _id: 'cat1', name: 'لوحات زيتية' },
        { _id: 'cat2', name: 'لوحات مائية' }
      ];

      const mockPaginationResult = {
        docs: mockCategories,
        page: 1,
        limit: 10,
        totalPages: 1,
        totalDocs: 2,
        hasNextPage: false,
        hasPrevPage: false
      };

      categoryModel.paginate.mockResolvedValue(mockPaginationResult);

      // Execute
      await categoryController.getCategories(req, res, next);

      // Assert
      expect(categoryModel.paginate).toHaveBeenCalledWith(
        {
          $or: [
            { name: { $regex: 'لوحات', $options: 'i' } },
            { description: { $regex: 'لوحات', $options: 'i' } }
          ]
        },
        {
          page: 1,
          limit: 10,
          sort: { createdAt: -1 },
          lean: true
        }
      );

      expect(res.success).toHaveBeenCalledWith(
        {
          categories: mockCategories,
          pagination: {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalItems: 2,
            hasNextPage: false,
            hasPrevPage: false
          }
        },
        'تم جلب التصنيفات بنجاح'
      );
    });

    it('should include artwork stats when requested', async () => {
      // Setup
      req.query = {
        includeStats: 'true'
      };

      const mockCategories = [
        { _id: 'cat1', name: 'لوحات زيتية' }
      ];

      const mockPaginationResult = {
        docs: mockCategories,
        page: 1,
        limit: 10,
        totalPages: 1,
        totalDocs: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      categoryModel.paginate.mockResolvedValue(mockPaginationResult);
      artworkModel.countDocuments.mockResolvedValue(5);

      // Execute
      await categoryController.getCategories(req, res, next);

      // Assert
      expect(artworkModel.countDocuments).toHaveBeenCalledWith({
        category: 'cat1'
      });
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          categories: [
            expect.objectContaining({
              _id: 'cat1',
              name: 'لوحات زيتية',
              artworkCount: 5
            })
          ]
        }),
        'تم جلب التصنيفات بنجاح'
      );
    });
  });

  describe('getCategory', () => {
    it('should get single category successfully', async () => {
      // Setup
      req.params.id = 'category123';

      const mockCategory = {
        _id: 'category123',
        name: 'لوحات زيتية',
        description: 'وصف التصنيف'
      };

      categoryModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCategory)
      });

      // Execute
      await categoryController.getCategory(req, res, next);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(req.params.id);
      expect(res.success).toHaveBeenCalledWith(
        mockCategory,
        'تم جلب التصنيف بنجاح'
      );
    });

    it('should include stats and recent artworks when requested', async () => {
      // Setup
      req.params.id = 'category123';
      req.query.includeStats = 'true';

      const mockCategory = {
        _id: 'category123',
        name: 'لوحات زيتية'
      };

      const mockRecentArtworks = [
        {
          _id: 'art1',
          title: 'لوحة جميلة',
          price: 100,
          artist: { name: 'فنان', avatar: {} }
        }
      ];

      categoryModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCategory)
      });
      artworkModel.countDocuments.mockResolvedValue(10);
      artworkModel.lean.mockResolvedValue(mockRecentArtworks);

      // Execute
      await categoryController.getCategory(req, res, next);

      // Assert
      expect(artworkModel.countDocuments).toHaveBeenCalledWith({
        category: req.params.id
      });
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          _id: 'category123',
          name: 'لوحات زيتية',
          artworkCount: 10,
          recentArtworks: mockRecentArtworks
        }),
        'تم جلب التصنيف بنجاح'
      );
    });

    it('should fail when category not found', async () => {
      // Setup
      req.params.id = 'nonexistent123';

      categoryModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await categoryController.getCategory(req, res, next);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التصنيف غير موجود',
        404
      );
    });
  });

  describe('getCategoryStats', () => {
    it('should get comprehensive category statistics', async () => {
      // Setup
      const mockAggregationResult = [
        { _id: 'cat1', name: 'لوحات زيتية', artworkCount: 15, createdAt: new Date() },
        { _id: 'cat2', name: 'لوحات مائية', artworkCount: 10, createdAt: new Date() },
        { _id: 'cat3', name: 'منحوتات', artworkCount: 0, createdAt: new Date() }
      ];

      categoryModel.countDocuments
        .mockResolvedValueOnce(3) // totalCategories
        .mockResolvedValueOnce(1); // recentCategoriesCount

      categoryModel.aggregate.mockResolvedValue(mockAggregationResult);

      // Execute
      await categoryController.getCategoryStats(req, res, next);

      // Assert
      expect(categoryModel.countDocuments).toHaveBeenCalledTimes(2);
      expect(categoryModel.aggregate).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        expect.objectContaining({
          totalCategories: 3,
          emptyCategoriesCount: 1,
          recentCategoriesCount: 1,
          mostPopularCategories: expect.arrayContaining([
            expect.objectContaining({ name: 'لوحات زيتية', artworkCount: 15 })
          ]),
          averageArtworksPerCategory: 8
        }),
        'تم جلب إحصائيات التصنيفات بنجاح'
      );
    });
  });

  describe('getPopularCategories', () => {
    it('should get popular categories successfully', async () => {
      // Setup
      req.query.limit = '5';

      const mockPopularCategories = [
        {
          _id: 'cat1',
          name: 'لوحات زيتية',
          description: 'وصف',
          image: { url: 'image.jpg', id: 'img1' },
          artworkCount: 20
        },
        {
          _id: 'cat2',
          name: 'منحوتات',
          description: 'وصف',
          image: { url: 'image2.jpg', id: 'img2' },
          artworkCount: 15
        }
      ];

      categoryModel.aggregate.mockResolvedValue(mockPopularCategories);

      // Execute
      await categoryController.getPopularCategories(req, res, next);

      // Assert
      expect(categoryModel.aggregate).toHaveBeenCalledWith([
        {
          $lookup: {
            from: 'artworks',
            localField: '_id',
            foreignField: 'category',
            as: 'artworks'
          }
        },
        {
          $addFields: {
            artworkCount: { $size: '$artworks' }
          }
        },
        {
          $match: {
            artworkCount: { $gt: 0 }
          }
        },
        {
          $project: {
            name: 1,
            description: 1,
            image: 1,
            artworkCount: 1
          }
        },
        {
          $sort: { artworkCount: -1 }
        },
        {
          $limit: 5
        }
      ]);

      expect(res.success).toHaveBeenCalledWith(
        mockPopularCategories,
        'تم جلب التصنيفات الشائعة بنجاح'
      );
    });

    it('should use default limit when not provided', async () => {
      // Setup - no limit in query
      categoryModel.aggregate.mockResolvedValue([]);

      // Execute
      await categoryController.getPopularCategories(req, res, next);

      // Assert
      expect(categoryModel.aggregate).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            $limit: 8 // default limit
          })
        ])
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle database connection errors', async () => {
      // Setup
      req.body = { name: 'تصنيف جديد' };
      categoryModel.findOne.mockRejectedValue(new Error('Connection failed'));

      // Execute
      await categoryController.createCategory(req, res, next);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء إنشاء التصنيف',
        500
      );
    });

    it('should handle aggregation pipeline errors', async () => {
      // Setup
      categoryModel.aggregate.mockRejectedValue(new Error('Aggregation failed'));

      // Execute
      await categoryController.getCategoryStats(req, res, next);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'حدث خطأ أثناء جلب إحصائيات التصنيفات',
        500
      );
    });
  });
}); 