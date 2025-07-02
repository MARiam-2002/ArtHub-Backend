import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as categoryController from '../../src/modules/category/category.controller.js';
import categoryModel from '../../DB/models/category.model.js';

// Mock the category model
jest.mock('../../DB/models/category.model.js');

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
        _id: 'user123',
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
    jest.resetAllMocks();
  });

  describe('createCategory', () => {
    it('should create a new category successfully', async () => {
      // Setup
      const categoryData = {
        name: 'لوحات زيتية',
        description: 'لوحات مرسومة بالألوان الزيتية',
        image: {
          url: 'https://example.com/image.jpg',
          id: 'image123'
        }
      };

      req.body = categoryData;

      const mockCreatedCategory = {
        _id: 'category123',
        ...categoryData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      categoryModel.findOne.mockResolvedValue(null); // No existing category
      categoryModel.create.mockResolvedValue(mockCreatedCategory);

      // Execute
      await categoryController.createCategory(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') }
      });
      expect(categoryModel.create).toHaveBeenCalledWith({
        name: categoryData.name.trim(),
        description: categoryData.description.trim(),
        image: categoryData.image
      });
      expect(res.success).toHaveBeenCalledWith(
        mockCreatedCategory,
        'تم إنشاء التصنيف بنجاح',
        201
      );
    });

    it('should fail when category with same name exists', async () => {
      // Setup
      const categoryData = {
        name: 'لوحات زيتية',
        description: 'وصف التصنيف'
      };

      req.body = categoryData;

      const existingCategory = {
        _id: 'existing123',
        name: 'لوحات زيتية'
      };

      categoryModel.findOne.mockResolvedValue(existingCategory);

      // Execute
      await categoryController.createCategory(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalled();
      expect(categoryModel.create).not.toHaveBeenCalled();
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'يوجد تصنيف بنفس هذا الاسم بالفعل',
        409
      );
    });

    it('should handle missing optional fields', async () => {
      // Setup
      const categoryData = {
        name: 'تصنيف جديد'
        // No description or image
      };

      req.body = categoryData;

      const mockCreatedCategory = {
        _id: 'category123',
        name: categoryData.name,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      categoryModel.findOne.mockResolvedValue(null);
      categoryModel.create.mockResolvedValue(mockCreatedCategory);

      // Execute
      await categoryController.createCategory(req, res);

      // Assert
      expect(categoryModel.create).toHaveBeenCalledWith({
        name: categoryData.name.trim(),
        description: undefined,
        image: undefined
      });
      expect(res.success).toHaveBeenCalled();
    });
  });

  describe('updateCategory', () => {
    it('should update category successfully', async () => {
      // Setup
      const categoryId = 'category123';
      const updateData = {
        name: 'اسم محدث',
        description: 'وصف محدث'
      };

      req.params.id = categoryId;
      req.body = updateData;

      const existingCategory = {
        _id: categoryId,
        name: 'اسم قديم',
        description: 'وصف قديم'
      };

      const updatedCategory = {
        _id: categoryId,
        ...updateData,
        updatedAt: new Date()
      };

      categoryModel.findById.mockResolvedValue(existingCategory);
      categoryModel.findOne.mockResolvedValue(null); // No duplicate name
      categoryModel.findByIdAndUpdate.mockResolvedValue(updatedCategory);

      // Execute
      await categoryController.updateCategory(req, res);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(categoryId);
      expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
        categoryId,
        {
          name: updateData.name.trim(),
          description: updateData.description.trim()
        },
        { new: true, runValidators: true }
      );
      expect(res.success).toHaveBeenCalledWith(
        updatedCategory,
        'تم تحديث التصنيف بنجاح'
      );
    });

    it('should fail when category does not exist', async () => {
      // Setup
      const categoryId = 'nonexistent123';
      req.params.id = categoryId;
      req.body = { name: 'اسم جديد' };

      categoryModel.findById.mockResolvedValue(null);

      // Execute
      await categoryController.updateCategory(req, res);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(categoryId);
      expect(categoryModel.findByIdAndUpdate).not.toHaveBeenCalled();
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التصنيف غير موجود',
        404
      );
    });

    it('should fail when new name conflicts with existing category', async () => {
      // Setup
      const categoryId = 'category123';
      const updateData = { name: 'اسم موجود' };

      req.params.id = categoryId;
      req.body = updateData;

      const existingCategory = {
        _id: categoryId,
        name: 'اسم قديم'
      };

      const conflictingCategory = {
        _id: 'other123',
        name: 'اسم موجود'
      };

      categoryModel.findById.mockResolvedValue(existingCategory);
      categoryModel.findOne.mockResolvedValue(conflictingCategory);

      // Execute
      await categoryController.updateCategory(req, res);

      // Assert
      expect(categoryModel.findOne).toHaveBeenCalledWith({
        name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
        _id: { $ne: categoryId }
      });
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'يوجد تصنيف بنفس هذا الاسم بالفعل',
        409
      );
    });
  });

  describe('deleteCategory', () => {
    it('should delete category successfully', async () => {
      // Setup
      const categoryId = 'category123';
      req.params.id = categoryId;

      const existingCategory = {
        _id: categoryId,
        name: 'تصنيف للحذف'
      };

      categoryModel.findById.mockResolvedValue(existingCategory);
      categoryModel.findByIdAndDelete.mockResolvedValue(existingCategory);

      // Execute
      await categoryController.deleteCategory(req, res);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(categoryId);
      expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith(categoryId);
      expect(res.success).toHaveBeenCalledWith(
        null,
        'تم حذف التصنيف بنجاح'
      );
    });

    it('should fail when category does not exist', async () => {
      // Setup
      const categoryId = 'nonexistent123';
      req.params.id = categoryId;

      categoryModel.findById.mockResolvedValue(null);

      // Execute
      await categoryController.deleteCategory(req, res);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(categoryId);
      expect(categoryModel.findByIdAndDelete).not.toHaveBeenCalled();
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التصنيف غير موجود',
        404
      );
    });
  });

  describe('getCategories', () => {
    it('should get categories with default pagination', async () => {
      // Setup
      const mockCategories = [
        { _id: '1', name: 'تصنيف 1' },
        { _id: '2', name: 'تصنيف 2' }
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
      await categoryController.getCategories(req, res);

      // Assert
      expect(categoryModel.paginate).toHaveBeenCalledWith(
        {},
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

    it('should search categories when search query provided', async () => {
      // Setup
      req.query = { search: 'لوحات', page: 1, limit: 5 };

      const mockPaginationResult = {
        docs: [{ _id: '1', name: 'لوحات زيتية' }],
        page: 1,
        limit: 5,
        totalPages: 1,
        totalDocs: 1,
        hasNextPage: false,
        hasPrevPage: false
      };

      categoryModel.paginate.mockResolvedValue(mockPaginationResult);

      // Execute
      await categoryController.getCategories(req, res);

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
          limit: 5,
          sort: { createdAt: -1 },
          lean: true
        }
      );
    });
  });

  describe('getCategory', () => {
    it('should get single category successfully', async () => {
      // Setup
      const categoryId = 'category123';
      req.params.id = categoryId;

      const mockCategory = {
        _id: categoryId,
        name: 'تصنيف تجريبي',
        description: 'وصف التصنيف'
      };

      categoryModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockCategory)
      });

      // Execute
      await categoryController.getCategory(req, res);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith(categoryId);
      expect(res.success).toHaveBeenCalledWith(
        mockCategory,
        'تم جلب التصنيف بنجاح'
      );
    });

    it('should fail when category not found', async () => {
      // Setup
      const categoryId = 'nonexistent123';
      req.params.id = categoryId;

      categoryModel.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue(null)
      });

      // Execute
      await categoryController.getCategory(req, res);

      // Assert
      expect(res.fail).toHaveBeenCalledWith(
        null,
        'التصنيف غير موجود',
        404
      );
    });
  });

  describe('getCategoryStats', () => {
    it('should get category statistics successfully', async () => {
      // Setup
      const totalCount = 25;
      categoryModel.countDocuments.mockResolvedValue(totalCount);

      // Execute
      await categoryController.getCategoryStats(req, res);

      // Assert
      expect(categoryModel.countDocuments).toHaveBeenCalled();
      expect(res.success).toHaveBeenCalledWith(
        { totalCategories: totalCount },
        'تم جلب إحصائيات التصنيفات بنجاح'
      );
    });
  });
}); 