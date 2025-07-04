import { Router } from 'express';
import { fileUpload, filterObject } from '../../utils/multer.js';
import * as imageController from './controller/image.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  uploadImageSchema,
  updateImageSchema,
  imageIdParamSchema,
  getImagesQuerySchema,
  searchImagesQuerySchema
} from './image.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Image:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف الصورة
 *         title:
 *           type: string
 *           description: عنوان الصورة
 *         description:
 *           type: string
 *           description: وصف الصورة
 *         url:
 *           type: string
 *           description: رابط الصورة
 *         publicId:
 *           type: string
 *           description: معرف الصورة في Cloudinary
 *         user:
 *           $ref: '#/components/schemas/User'
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: وسوم الصورة
 *         size:
 *           type: number
 *           description: حجم الصورة بالبايت
 *         format:
 *           type: string
 *           description: تنسيق الصورة
 *         width:
 *           type: number
 *           description: عرض الصورة
 *         height:
 *           type: number
 *           description: ارتفاع الصورة
 *         views:
 *           type: number
 *           description: عدد المشاهدات
 *         downloads:
 *           type: number
 *           description: عدد التحميلات
 *         isPrivate:
 *           type: boolean
 *           description: هل الصورة خاصة
 *         allowDownload:
 *           type: boolean
 *           description: السماح بالتحميل
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

// Image Upload
/**
 * @swagger
 * /image/upload:
 *   post:
 *     tags: [Images]
 *     summary: Upload image
 *     description: Upload a single image with optional metadata
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - image
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Image title
 *                 example: "Beautiful Artwork"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: Image description
 *                 example: "Abstract painting with vibrant colors"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *                 description: Image tags
 *                 example: ["art", "abstract", "colors"]
 *               category:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 description: Category ID
 *               isPrivate:
 *                 type: boolean
 *                 default: false
 *                 description: Make image private
 *               allowDownload:
 *                 type: boolean
 *                 default: true
 *                 description: Allow image download
 *     responses:
 *       201:
 *         description: Image uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم رفع الصورة بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/upload',
  isAuthenticated,
  fileUpload(filterObject.image).single('image'),
  isValidation(uploadImageSchema),
  imageController.uploadImage
);

// Get Images
/**
 * @swagger
 * /image:
 *   get:
 *     tags: [Images]
 *     summary: Get all images
 *     description: Get a paginated list of images with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by category ID
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by user ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, views, downloads, title]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Images retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Image'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', isValidation(getImagesQuerySchema), imageController.getAllImages);

// Search Images
/**
 * @swagger
 * /image/search:
 *   get:
 *     tags: [Images]
 *     summary: Search images
 *     description: Search for images by title, description, or tags
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by category
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.get('/search', isValidation(searchImagesQuerySchema), imageController.searchImages);

// Get Image by ID
/**
 * @swagger
 * /image/{imageId}:
 *   get:
 *     tags: [Images]
 *     summary: Get image by ID
 *     description: Get detailed information about a specific image
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Image ID
 *     responses:
 *       200:
 *         description: Image details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Image'
 *       404:
 *         description: Image not found
 */
router.get('/:imageId', isValidation(imageIdParamSchema), imageController.getImageById);

// Update Image
/**
 * @swagger
 * /image/{imageId}:
 *   put:
 *     tags: [Images]
 *     summary: Update image
 *     description: Update image metadata (owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 maxItems: 10
 *               isPrivate:
 *                 type: boolean
 *               allowDownload:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Image not found
 */
router.put('/:imageId', isAuthenticated, isValidation(imageIdParamSchema), isValidation(updateImageSchema), imageController.updateImage);

// Delete Image
/**
 * @swagger
 * /image/{imageId}:
 *   delete:
 *     tags: [Images]
 *     summary: Delete image
 *     description: Delete an image (owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Image not found
 */
router.delete('/:imageId', isAuthenticated, isValidation(imageIdParamSchema), imageController.deleteImage);

// My Images
/**
 * @swagger
 * /image/my-images:
 *   get:
 *     tags: [Images]
 *     summary: Get my images
 *     description: Get all images uploaded by the authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: isPrivate
 *         schema:
 *           type: boolean
 *         description: Filter by privacy status
 *     responses:
 *       200:
 *         description: User images retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-images', isAuthenticated, imageController.getMyImages);

// Download Image
/**
 * @swagger
 * /image/{imageId}/download:
 *   get:
 *     tags: [Images]
 *     summary: Download image
 *     description: Download an image file (if allowed)
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Image ID
 *       - in: query
 *         name: quality
 *         schema:
 *           type: string
 *           enum: [low, medium, high, original]
 *           default: original
 *         description: Download quality
 *     responses:
 *       200:
 *         description: Image file
 *         content:
 *           image/*:
 *             schema:
 *               type: string
 *               format: binary
 *       403:
 *         description: Download not allowed for this image
 *       404:
 *         description: Image not found
 */
router.get('/:imageId/download', isValidation(imageIdParamSchema), imageController.downloadImage);

// Get User Images
/**
 * @swagger
 * /image/user/{userId}:
 *   get:
 *     tags: [Images]
 *     summary: Get user images
 *     description: Get all images uploaded by a specific user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: User images retrieved successfully
 *       404:
 *         description: User not found
 */
router.get('/user/:userId', isValidation(getImagesQuerySchema), imageController.getUserImages);

export default router;
