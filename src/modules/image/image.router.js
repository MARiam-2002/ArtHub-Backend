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
 *       - Images
 *     summary: رفع صورة أو أكثر
 *     description: رفع صورة واحدة أو أكثر مع بيانات وصفية وخيارات للعلامة المائية
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
 *                 description: الصور المراد رفعها (الحد الأقصى 10)
 *               title:
 *                 type: string
 *                 description: عنوان الصورة (اختياري)
 *               description:
 *                 type: string
 *                 description: وصف الصورة (اختياري)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: وسوم الصورة (اختياري)
 *               category:
 *                 type: string
 *                 description: فئة الصورة (اختياري)
 *               applyWatermark:
 *                 type: boolean
 *                 description: تطبيق علامة مائية على الصورة (اختياري)
 *     responses:
 *       201:
 *         description: تم رفع الصور بنجاح
 *       400:
 *         description: لم يتم توفير أي صور أو خطأ في البيانات
 *       401:
 *         description: غير مصرح به
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
 *       - Images
 *     summary: رفع صورة أو أكثر باستخدام مصادقة Firebase
 *     description: رفع صورة واحدة أو أكثر مع بيانات وصفية وخيارات للعلامة المائية باستخدام مصادقة Firebase
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
 *                 description: الصور المراد رفعها (الحد الأقصى 10)
 *               title:
 *                 type: string
 *                 description: عنوان الصورة (اختياري)
 *               description:
 *                 type: string
 *                 description: وصف الصورة (اختياري)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: وسوم الصورة (اختياري)
 *               category:
 *                 type: string
 *                 description: فئة الصورة (اختياري)
 *               applyWatermark:
 *                 type: boolean
 *                 description: تطبيق علامة مائية على الصورة (اختياري)
 *     responses:
 *       201:
 *         description: تم رفع الصور بنجاح
 *       400:
 *         description: لم يتم توفير أي صور أو خطأ في البيانات
 *       401:
 *         description: غير مصرح به
 */
router.post('/upload/firebase', 
  verifyFirebaseToken, 
  fileUpload(filterObject.image).array('images', 10),
  isValidation(createImageSchema),
  imageController.uploadImages
);

/**
 * @swagger
 * /api/image/upload/album:
 *   post:
 *     tags:
 *       - Images
 *     summary: رفع ألبوم صور
 *     description: رفع مجموعة صور كألبوم
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
 *                 description: الصور المراد رفعها للألبوم (الحد الأقصى 30)
 *               albumTitle:
 *                 type: string
 *                 description: عنوان الألبوم
 *               applyWatermark:
 *                 type: boolean
 *                 description: تطبيق علامة مائية على جميع الصور (اختياري)
 *     responses:
 *       201:
 *         description: تم رفع الألبوم بنجاح
 *       400:
 *         description: لم يتم توفير أي صور أو خطأ في البيانات
 *       401:
 *         description: غير مصرح به
 */
router.post('/upload/album', 
  isAuthenticated, 
  fileUpload(filterObject.image).array('images', 30), 
  imageController.uploadMultipleImages
);

/**
 * @swagger
 * /api/image/upload/album/firebase:
 *   post:
 *     tags:
 *       - Images
 *     summary: رفع ألبوم صور باستخدام مصادقة Firebase
 *     description: رفع مجموعة صور كألبوم باستخدام مصادقة Firebase
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
 *                 description: الصور المراد رفعها للألبوم (الحد الأقصى 30)
 *               albumTitle:
 *                 type: string
 *                 description: عنوان الألبوم
 *               applyWatermark:
 *                 type: boolean
 *                 description: تطبيق علامة مائية على جميع الصور (اختياري)
 *     responses:
 *       201:
 *         description: تم رفع الألبوم بنجاح
 *       400:
 *         description: لم يتم توفير أي صور أو خطأ في البيانات
 *       401:
 *         description: غير مصرح به
 */
router.post('/upload/album/firebase', 
  verifyFirebaseToken, 
  fileUpload(filterObject.image).array('images', 30), 
  imageController.uploadMultipleImages
);

/**
 * @swagger
 * /api/image/albums:
 *   get:
 *     tags:
 *       - Images
 *     summary: الحصول على ألبومات المستخدم
 *     description: استرجاع جميع ألبومات الصور الخاصة بالمستخدم المصادق
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الألبومات بنجاح
 *       401:
 *         description: غير مصرح به
 */
router.get('/albums', isAuthenticated, imageController.getUserAlbums);

/**
 * @swagger
 * /api/image/albums/firebase:
 *   get:
 *     tags:
 *       - Images
 *     summary: الحصول على ألبومات المستخدم باستخدام مصادقة Firebase
 *     description: استرجاع جميع ألبومات الصور الخاصة بالمستخدم المصادق باستخدام Firebase
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الألبومات بنجاح
 *       401:
 *         description: غير مصرح به
 */
router.get('/albums/firebase', verifyFirebaseToken, imageController.getUserAlbums);

/**
 * @swagger
 * /api/image/albums/{albumName}:
 *   get:
 *     tags:
 *       - Images
 *     summary: الحصول على صور ألبوم محدد
 *     description: استرجاع جميع الصور في ألبوم محدد للمستخدم المصادق
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: albumName
 *         required: true
 *         schema:
 *           type: string
 *         description: اسم الألبوم
 *     responses:
 *       200:
 *         description: تم جلب صور الألبوم بنجاح
 *       401:
 *         description: غير مصرح به
 *       404:
 *         description: الألبوم غير موجود
 */
router.get('/albums/:albumName', isAuthenticated, imageController.getAlbumImages);

/**
 * @swagger
 * /api/image/albums/{albumName}/firebase:
 *   get:
 *     tags:
 *       - Images
 *     summary: الحصول على صور ألبوم محدد باستخدام مصادقة Firebase
 *     description: استرجاع جميع الصور في ألبوم محدد للمستخدم المصادق باستخدام Firebase
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: albumName
 *         required: true
 *         schema:
 *           type: string
 *         description: اسم الألبوم
 *     responses:
 *       200:
 *         description: تم جلب صور الألبوم بنجاح
 *       401:
 *         description: غير مصرح به
 *       404:
 *         description: الألبوم غير موجود
 */
router.get('/albums/:albumName/firebase', verifyFirebaseToken, imageController.getAlbumImages);

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

/**
 * @swagger
 * /api/image/optimize/{imageId}:
 *   post:
 *     tags:
 *       - Images
 *     summary: تحسين صورة موجودة
 *     description: تحسين صورة موجودة في النظام وإنشاء إصدارات محسنة مختلفة الأحجام
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: imageId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الصورة المراد تحسينها
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optimizationLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: مستوى تحسين الصورة
 *     responses:
 *       200:
 *         description: تم تحسين الصورة بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               {
 *                 "success": true,
 *                 "message": "تم تحسين الصورة بنجاح",
 *                 "data": {
 *                   "optimizedUrl": "https://res.cloudinary.com/demo/image/upload/q_auto,f_auto/v1612345678/artwork.jpg",
 *                   "variants": {
 *                     "thumbnail": "https://res.cloudinary.com/demo/image/upload/c_thumb,w_200,h_200/v1612345678/artwork.jpg",
 *                     "small": "https://res.cloudinary.com/demo/image/upload/c_scale,w_400/v1612345678/artwork.jpg",
 *                     "medium": "https://res.cloudinary.com/demo/image/upload/c_scale,w_800/v1612345678/artwork.jpg"
 *                   }
 *                 }
 *               }
 *       400:
 *         description: بيانات غير صالحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: الصورة غير موجودة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/optimize/:imageId', isAuthenticated, imageController.optimizeImage);

/**
 * @swagger
 * /api/image/optimize-all:
 *   post:
 *     tags:
 *       - Images
 *     summary: تحسين جميع صور المستخدم
 *     description: تحسين جميع صور المستخدم الحالي وإنشاء إصدارات محسنة مختلفة الأحجام
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               optimizationLevel:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: مستوى تحسين الصور
 *     responses:
 *       200:
 *         description: تم بدء عملية التحسين بنجاح
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               {
 *                 "success": true,
 *                 "message": "تم بدء عملية تحسين الصور",
 *                 "data": {
 *                   "totalImages": 10,
 *                   "jobId": "job-123456"
 *                 }
 *               }
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/optimize-all', isAuthenticated, imageController.optimizeAllUserImages);

export default router;
