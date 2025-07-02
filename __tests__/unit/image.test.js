import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import * as imageController from '../../src/modules/image/controller/image.js';

// Mock dependencies
jest.mock('../../../DB/models/image.model.js');
jest.mock('../../../DB/models/category.model.js');
jest.mock('../../../DB/models/user.model.js');
jest.mock('../../src/utils/cloudinary.js');
jest.mock('../../src/utils/imageProcessing.js');
jest.mock('../../src/utils/errorHandler.js');

import imageModel from '../../DB/models/image.model.js';
import categoryModel from '../../DB/models/category.model.js';
import userModel from '../../DB/models/user.model.js';
import cloudinary from '../../src/utils/cloudinary.js';
import { processAndUploadImage, isSafeImage } from '../../src/utils/imageProcessing.js';
import { errorHandler } from '../../src/utils/errorHandler.js';

describe('Image Controller Tests', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      user: {
        _id: 'user123',
        name: 'Test User'
      },
      file: {
        path: '/tmp/test-image.jpg',
        originalname: 'test-image.jpg'
      },
      files: [
        {
          path: '/tmp/test-image1.jpg',
          originalname: 'test-image1.jpg'
        },
        {
          path: '/tmp/test-image2.jpg',
          originalname: 'test-image2.jpg'
        }
      ],
      body: {},
      query: {},
      params: {}
    };

    res = {
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

  describe('uploadImage', () => {
    it('should upload a single image successfully', async () => {
      // Setup
      req.body = {
        title: 'Test Image',
        description: 'Test Description',
        tags: ['art', 'test'],
        category: 'category123'
      };

      const mockCategory = { _id: 'category123', name: 'Art' };
      const mockUploadResult = {
        public_id: 'test_public_id',
        secure_url: 'https://cloudinary.com/test.jpg',
        bytes: 1024,
        format: 'jpg',
        width: 800,
        height: 600
      };
      const mockImage = {
        _id: 'image123',
        title: 'Test Image',
        url: 'https://cloudinary.com/test.jpg',
        user: 'user123'
      };

      categoryModel.findById.mockResolvedValue(mockCategory);
      processAndUploadImage.mockResolvedValue(mockUploadResult);
      isSafeImage.mockResolvedValue(true);
      imageModel.create.mockResolvedValue(mockImage);
      userModel.findByIdAndUpdate.mockResolvedValue({});

      // Execute
      await imageController.uploadImage(req, res, next);

      // Assert
      expect(categoryModel.findById).toHaveBeenCalledWith('category123');
      expect(processAndUploadImage).toHaveBeenCalled();
      expect(isSafeImage).toHaveBeenCalledWith('test_public_id');
      expect(imageModel.create).toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', { $inc: { imagesCount: 1 } });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم رفع الصورة بنجاح',
        data: mockImage
      });
    });

    it('should return error when no file is provided', async () => {
      // Setup
      req.file = null;
      errorHandler.mockReturnValue(new Error('يرجى تحميل صورة'));

      // Execute
      await imageController.uploadImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reject unsafe images', async () => {
      // Setup
      req.body = { title: 'Test Image' };
      const mockUploadResult = {
        public_id: 'test_public_id',
        secure_url: 'https://cloudinary.com/test.jpg'
      };

      processAndUploadImage.mockResolvedValue(mockUploadResult);
      isSafeImage.mockResolvedValue(false);
      cloudinary.uploader.destroy.mockResolvedValue({});
      errorHandler.mockReturnValue(new Error('الصورة غير مناسبة'));

      // Execute
      await imageController.uploadImage(req, res, next);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test_public_id');
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle category validation error', async () => {
      // Setup
      req.body = { category: 'invalid_category' };
      categoryModel.findById.mockResolvedValue(null);
      errorHandler.mockReturnValue(new Error('الفئة المحددة غير موجودة'));

      // Execute
      await imageController.uploadImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('uploadMultipleImages', () => {
    it('should upload multiple images successfully', async () => {
      // Setup
      req.body = {
        albumTitle: 'Test Album',
        applyWatermark: true,
        optimizationLevel: 'medium'
      };

      const mockUploadResults = [
        {
          public_id: 'test_public_id_1',
          secure_url: 'https://cloudinary.com/test1.jpg',
          bytes: 1024,
          format: 'jpg',
          width: 800,
          height: 600
        },
        {
          public_id: 'test_public_id_2',
          secure_url: 'https://cloudinary.com/test2.jpg',
          bytes: 2048,
          format: 'jpg',
          width: 1200,
          height: 800
        }
      ];

      const mockImages = [
        { _id: 'image1', title: 'Test Album - صورة 1' },
        { _id: 'image2', title: 'Test Album - صورة 2' }
      ];

      processAndUploadImage.mockResolvedValueOnce(mockUploadResults[0])
                           .mockResolvedValueOnce(mockUploadResults[1]);
      isSafeImage.mockResolvedValue(true);
      imageModel.insertMany.mockResolvedValue(mockImages);
      userModel.findByIdAndUpdate.mockResolvedValue({});

      // Execute
      await imageController.uploadMultipleImages(req, res, next);

      // Assert
      expect(processAndUploadImage).toHaveBeenCalledTimes(2);
      expect(isSafeImage).toHaveBeenCalledTimes(2);
      expect(imageModel.insertMany).toHaveBeenCalled();
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', { $inc: { imagesCount: 2 } });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم رفع 2 صور بنجاح',
        data: mockImages
      });
    });

    it('should return error when no files are provided', async () => {
      // Setup
      req.files = [];
      errorHandler.mockReturnValue(new Error('يرجى تحميل صورة واحدة على الأقل'));

      // Execute
      await imageController.uploadMultipleImages(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should return error when too many files are provided', async () => {
      // Setup
      req.files = new Array(15).fill({ path: '/tmp/test.jpg' });
      errorHandler.mockReturnValue(new Error('لا يمكن رفع أكثر من 10 صور في المرة الواحدة'));

      // Execute
      await imageController.uploadMultipleImages(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getAllImages', () => {
    it('should get all public images with pagination', async () => {
      // Setup
      req.query = {
        page: '1',
        limit: '10',
        sortBy: 'createdAt',
        sortOrder: 'desc'
      };

      const mockImages = [
        { _id: 'image1', title: 'Image 1', isPrivate: false },
        { _id: 'image2', title: 'Image 2', isPrivate: false }
      ];

      imageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockImages)
      });
      imageModel.countDocuments.mockResolvedValue(25);

      // Execute
      await imageController.getAllImages(req, res, next);

      // Assert
      expect(imageModel.find).toHaveBeenCalledWith({ isPrivate: false });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم جلب الصور بنجاح',
        data: mockImages,
        pagination: {
          currentPage: 1,
          totalPages: 3,
          totalCount: 25,
          hasNextPage: true,
          hasPrevPage: false
        }
      });
    });

    it('should filter images by category', async () => {
      // Setup
      req.query = { category: 'category123' };

      imageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      imageModel.countDocuments.mockResolvedValue(0);

      // Execute
      await imageController.getAllImages(req, res, next);

      // Assert
      expect(imageModel.find).toHaveBeenCalledWith({
        isPrivate: false,
        category: 'category123'
      });
    });

    it('should search images by query', async () => {
      // Setup
      req.query = { query: 'art' };

      imageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue([])
      });
      imageModel.countDocuments.mockResolvedValue(0);

      // Execute
      await imageController.getAllImages(req, res, next);

      // Assert
      expect(imageModel.find).toHaveBeenCalledWith({
        isPrivate: false,
        $or: [
          { title: { $regex: 'art', $options: 'i' } },
          { description: { $regex: 'art', $options: 'i' } },
          { tags: { $in: [expect.any(RegExp)] } }
        ]
      });
    });
  });

  describe('getImageById', () => {
    it('should get image by ID with similar images', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      const mockImage = {
        _id: 'image123',
        title: 'Test Image',
        user: { _id: 'user123' },
        category: { _id: 'category123' },
        tags: ['art'],
        views: 10,
        isPrivate: false
      };
      const mockSimilarImages = [
        { _id: 'image456', title: 'Similar Image' }
      ];

      imageModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockImage)
      });
      imageModel.findByIdAndUpdate.mockResolvedValue({});
      imageModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockSimilarImages)
      });

      // Execute
      await imageController.getImageById(req, res, next);

      // Assert
      expect(imageModel.findById).toHaveBeenCalledWith('image123');
      expect(imageModel.findByIdAndUpdate).toHaveBeenCalledWith('image123', { $inc: { views: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم جلب الصورة بنجاح',
        data: {
          ...mockImage,
          views: 11,
          similarImages: mockSimilarImages
        }
      });
    });

    it('should return error when image not found', async () => {
      // Setup
      req.params = { imageId: 'nonexistent' };
      imageModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(null)
      });
      errorHandler.mockReturnValue(new Error('الصورة غير موجودة'));

      // Execute
      await imageController.getImageById(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access to private images for non-owners', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      req.user = { _id: 'different_user' };
      const mockImage = {
        _id: 'image123',
        isPrivate: true,
        user: { _id: 'owner_user' }
      };

      imageModel.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockImage)
      });
      errorHandler.mockReturnValue(new Error('غير مصرح لك بعرض هذه الصورة'));

      // Execute
      await imageController.getImageById(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('updateImage', () => {
    it('should update image successfully', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      req.body = {
        title: 'Updated Title',
        description: 'Updated Description',
        tags: ['updated', 'art']
      };

      const mockImage = {
        _id: 'image123',
        user: 'user123',
        title: 'Original Title'
      };
      const mockUpdatedImage = {
        ...mockImage,
        title: 'Updated Title',
        description: 'Updated Description'
      };

      imageModel.findById.mockResolvedValue(mockImage);
      imageModel.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockUpdatedImage)
      });

      // Execute
      await imageController.updateImage(req, res, next);

      // Assert
      expect(imageModel.findById).toHaveBeenCalledWith('image123');
      expect(imageModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'image123',
        {
          title: 'Updated Title',
          description: 'Updated Description',
          tags: ['updated', 'art']
        },
        { new: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم تحديث الصورة بنجاح',
        data: mockUpdatedImage
      });
    });

    it('should return error when image not found', async () => {
      // Setup
      req.params = { imageId: 'nonexistent' };
      imageModel.findById.mockResolvedValue(null);
      errorHandler.mockReturnValue(new Error('الصورة غير موجودة'));

      // Execute
      await imageController.updateImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access to non-owners', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      req.user = { _id: 'different_user' };
      const mockImage = { user: 'owner_user' };

      imageModel.findById.mockResolvedValue(mockImage);
      errorHandler.mockReturnValue(new Error('غير مصرح لك بتعديل هذه الصورة'));

      // Execute
      await imageController.updateImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('deleteImage', () => {
    it('should delete image successfully', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      const mockImage = {
        _id: 'image123',
        user: 'user123',
        publicId: 'test_public_id'
      };

      imageModel.findById.mockResolvedValue(mockImage);
      cloudinary.uploader.destroy.mockResolvedValue({});
      imageModel.findByIdAndDelete.mockResolvedValue(mockImage);
      userModel.findByIdAndUpdate.mockResolvedValue({});

      // Execute
      await imageController.deleteImage(req, res, next);

      // Assert
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('test_public_id');
      expect(imageModel.findByIdAndDelete).toHaveBeenCalledWith('image123');
      expect(userModel.findByIdAndUpdate).toHaveBeenCalledWith('user123', { $inc: { imagesCount: -1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم حذف الصورة بنجاح'
      });
    });

    it('should return error when image not found', async () => {
      // Setup
      req.params = { imageId: 'nonexistent' };
      imageModel.findById.mockResolvedValue(null);
      errorHandler.mockReturnValue(new Error('الصورة غير موجودة'));

      // Execute
      await imageController.deleteImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny access to non-owners', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      req.user = { _id: 'different_user' };
      const mockImage = { user: 'owner_user' };

      imageModel.findById.mockResolvedValue(mockImage);
      errorHandler.mockReturnValue(new Error('غير مصرح لك بحذف هذه الصورة'));

      // Execute
      await imageController.deleteImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('searchImages', () => {
    it('should search images successfully', async () => {
      // Setup
      req.query = {
        query: 'art',
        category: 'category123',
        page: '1',
        limit: '10'
      };

      const mockImages = [
        { _id: 'image1', title: 'Art Image 1' },
        { _id: 'image2', title: 'Art Image 2' }
      ];

      imageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockImages)
      });
      imageModel.countDocuments.mockResolvedValue(15);

      // Execute
      await imageController.searchImages(req, res, next);

      // Assert
      expect(imageModel.find).toHaveBeenCalledWith({
        isPrivate: false,
        $or: [
          { title: { $regex: 'art', $options: 'i' } },
          { description: { $regex: 'art', $options: 'i' } },
          { tags: { $in: [expect.any(RegExp)] } }
        ],
        category: 'category123'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم العثور على 15 صورة',
        data: mockImages,
        pagination: expect.any(Object)
      });
    });

    it('should return error when no search criteria provided', async () => {
      // Setup
      req.query = {};
      errorHandler.mockReturnValue(new Error('يرجى تحديد معايير البحث'));

      // Execute
      await imageController.searchImages(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getMyImages', () => {
    it('should get user images with stats', async () => {
      // Setup
      req.query = { page: '1', limit: '10' };
      const mockImages = [
        { _id: 'image1', title: 'My Image 1', user: 'user123' }
      ];
      const mockStats = [{
        totalViews: 100,
        totalDownloads: 20,
        totalSize: 5000000,
        publicImages: 8,
        privateImages: 2
      }];

      imageModel.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockImages)
      });
      imageModel.countDocuments.mockResolvedValue(10);
      imageModel.aggregate.mockResolvedValue(mockStats);

      // Execute
      await imageController.getMyImages(req, res, next);

      // Assert
      expect(imageModel.find).toHaveBeenCalledWith({ user: 'user123' });
      expect(imageModel.aggregate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم جلب صورك بنجاح',
        data: mockImages,
        stats: mockStats[0],
        pagination: expect.any(Object)
      });
    });
  });

  describe('downloadImage', () => {
    it('should generate download link successfully', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      req.body = { format: 'jpg', quality: 80, size: 'medium' };
      const mockImage = {
        _id: 'image123',
        title: 'Test Image',
        url: 'https://cloudinary.com/test.jpg',
        isPrivate: false,
        allowDownload: true,
        format: 'jpg'
      };

      imageModel.findById.mockResolvedValue(mockImage);
      imageModel.findByIdAndUpdate.mockResolvedValue({});

      // Execute
      await imageController.downloadImage(req, res, next);

      // Assert
      expect(imageModel.findByIdAndUpdate).toHaveBeenCalledWith('image123', { $inc: { downloads: 1 } });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'رابط التحميل جاهز',
        data: {
          downloadUrl: expect.any(String),
          filename: expect.any(String)
        }
      });
    });

    it('should deny download for private images to non-owners', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      req.user = { _id: 'different_user' };
      const mockImage = {
        _id: 'image123',
        isPrivate: true,
        user: 'owner_user'
      };

      imageModel.findById.mockResolvedValue(mockImage);
      errorHandler.mockReturnValue(new Error('غير مصرح لك بتحميل هذه الصورة'));

      // Execute
      await imageController.downloadImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should deny download when not allowed', async () => {
      // Setup
      req.params = { imageId: 'image123' };
      req.user = { _id: 'different_user' };
      const mockImage = {
        _id: 'image123',
        isPrivate: false,
        allowDownload: false,
        user: 'owner_user'
      };

      imageModel.findById.mockResolvedValue(mockImage);
      errorHandler.mockReturnValue(new Error('التحميل غير مسموح لهذه الصورة'));

      // Execute
      await imageController.downloadImage(req, res, next);

      // Assert
      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getImageStats', () => {
    it('should get image statistics successfully', async () => {
      // Setup
      req.query = { period: 'month' };
      const mockGeneralStats = [{
        totalImages: 100,
        totalViews: 5000,
        totalDownloads: 500,
        totalSize: 100000000,
        avgViews: 50,
        avgDownloads: 5
      }];
      const mockCategoryStats = [
        { _id: 'category1', count: 30, totalViews: 1500 }
      ];
      const mockTopImages = [
        { _id: 'image1', title: 'Top Image', views: 200 }
      ];

      imageModel.aggregate.mockResolvedValueOnce(mockGeneralStats);
      imageModel.aggregate.mockResolvedValueOnce(mockCategoryStats);
      imageModel.find.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(mockTopImages)
      });

      // Execute
      await imageController.getImageStats(req, res, next);

      // Assert
      expect(imageModel.aggregate).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'تم جلب الإحصائيات بنجاح',
        data: {
          general: mockGeneralStats[0],
          byCategory: mockCategoryStats,
          topImages: mockTopImages
        }
      });
    });
  });
});
