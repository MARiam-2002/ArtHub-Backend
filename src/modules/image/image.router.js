
import { Router } from 'express';
import { fileUpload, filterObject } from '../../utils/multer.js';
import * as imageController from './controller/image.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken } from '../../middleware/firebase.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import { createImageSchema, updateImageSchema } from './image.validation.js';

const router = Router();

/**
 * @swagger
 * /api/image/upload:
 *   post:
 *     tags:
 *       - Image
 *     summary: Upload images
 *     description: Upload one or more images with metadata
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files to upload (maximum 10)
 *               title:
 *                 type: string
 *                 description: Image title (optional)
 *               description:
 *                 type: string
 *                 description: Image description (optional)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Image tags (optional)
 *               category:
 *                 type: string
 *                 description: Image category (optional)
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UploadImagesResponse'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/upload', 
  isAuthenticated, 
  fileUpload(filterObject.image).array('images', 10),
  isValidation(createImageSchema),
  imageController.uploadImages
);

/**
 * @swagger
 * /api/image/upload/firebase:
 *   post:
 *     tags:
 *       - Image
 *     summary: Upload images with Firebase auth
 *     description: Upload one or more images using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Images uploaded successfully
 */
router.post('/upload/firebase', 
  verifyFirebaseToken, 
  fileUpload(filterObject.image).array('images', 10),
  isValidation(createImageSchema),
  imageController.uploadImages
);

/**
 * @swagger
 * /api/image/my-images:
 *   get:
 *     tags:
 *       - Image
 *     summary: Get user images
 *     description: Get all images uploaded by the authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Images retrieved successfully
 */
router.get('/my-images', 
  isAuthenticated, 
  imageController.getUserImages
);

/**
 * @swagger
 * /api/image/my-images/firebase:
 *   get:
 *     tags:
 *       - Image
 *     summary: Get user images with Firebase auth
 *     description: Get all images uploaded by the user authenticated with Firebase
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Images retrieved successfully
 */
router.get('/my-images/firebase', 
  verifyFirebaseToken, 
  imageController.getUserImages
);

/**
 * @swagger
 * /api/image/{imageId}:
 *   get:
 *     tags:
 *       - Image
 *     summary: Get image details
 *     description: Get details of a specific image
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image retrieved successfully
 *       404:
 *         description: Image not found
 */
router.get('/:imageId', 
  imageController.getImageById
);

/**
 * @swagger
 * /api/image/{imageId}:
 *   patch:
 *     tags:
 *       - Image
 *     summary: Update image metadata
 *     description: Update metadata of a specific image
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       404:
 *         description: Image not found
 */
router.patch('/:imageId', 
  isAuthenticated,
  isValidation(updateImageSchema),
  imageController.updateImageMetadata
);

/**
 * @swagger
 * /api/image/{imageId}/firebase:
 *   patch:
 *     tags:
 *       - Image
 *     summary: Update image metadata with Firebase auth
 *     description: Update metadata of a specific image using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: imageId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               category:
 *                 type: string
 *     responses:
 *       200:
 *         description: Image updated successfully
 *       404:
 *         description: Image not found
 */
router.patch('/:imageId/firebase', 
  verifyFirebaseToken,
  isValidation(updateImageSchema),
  imageController.updateImageMetadata
);

/**
 * @swagger
 * /api/image/{publicId}:
 *   delete:
 *     tags:
 *       - Image
 *     summary: Delete image
 *     description: Delete a specific image
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 */
router.delete('/:publicId', 
  isAuthenticated, 
  imageController.deleteImage
);

/**
 * @swagger
 * /api/image/{publicId}/firebase:
 *   delete:
 *     tags:
 *       - Image
 *     summary: Delete image with Firebase auth
 *     description: Delete a specific image using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: publicId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *       404:
 *         description: Image not found
 */
router.delete('/:publicId/firebase', 
  verifyFirebaseToken, 
  imageController.deleteImage
);

/**
 * @swagger
 * /api/image/categories/popular:
 *   get:
 *     tags:
 *       - Image
 *       - Categories
 *     summary: Get popular image categories
 *     description: Get a list of popular image categories with counts
 *     responses:
 *       200:
 *         description: Categories retrieved successfully
 */
router.get('/categories/popular', 
  imageController.getImageCategories
);

export default router;
