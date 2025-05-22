import { Router } from 'express';
import * as controller from './review.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './review.validation.js';
const router = Router();

/**
 * @swagger
 * /api/reviews/artwork:
 *   post:
 *     tags:
 *       - Reviews
 *     summary: إضافة تقييم لعمل فني
 *     description: إضافة تقييم وتعليق جديد لعمل فني
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artwork
 *               - rating
 *             properties:
 *               artwork:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إضافة التقييم بنجاح
 */
router.post(
  '/artwork', 
  isAuthenticated, 
  isValidation(Validators.addReviewSchema),
  controller.addArtworkReview
);

/**
 * @swagger
 * /api/reviews/artwork/update:
 *   put:
 *     tags:
 *       - Reviews
 *     summary: تحديث تقييم لعمل فني
 *     description: تحديث تقييم وتعليق موجود لعمل فني
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artwork
 *               - rating
 *             properties:
 *               artwork:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم تحديث التقييم بنجاح
 */
router.put(
  '/artwork/update', 
  isAuthenticated, 
  isValidation(Validators.updateReviewSchema),
  controller.updateArtworkReview
);

/**
 * @swagger
 * /api/reviews/artwork/{artworkId}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: جلب تقييمات عمل فني
 *     description: جلب جميع التقييمات والتعليقات لعمل فني معين
 *     parameters:
 *       - name: artworkId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: تم جلب التقييمات بنجاح
 */
router.get('/artwork/:artworkId', controller.getArtworkReviews);

/**
 * @swagger
 * /api/reviews/artist:
 *   post:
 *     tags:
 *       - Reviews
 *     summary: إضافة تقييم لفنان
 *     description: إضافة تقييم وتعليق جديد لفنان
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artist
 *               - rating
 *             properties:
 *               artist:
 *                 type: string
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: تم إضافة التقييم بنجاح
 */
router.post(
  '/artist', 
  isAuthenticated, 
  isValidation(Validators.addArtistReviewSchema),
  controller.addArtistReview
);

/**
 * @swagger
 * /api/reviews/artist/{artistId}:
 *   get:
 *     tags:
 *       - Reviews
 *     summary: جلب تقييمات فنان
 *     description: جلب جميع التقييمات والتعليقات لفنان معين
 *     parameters:
 *       - name: artistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: تم جلب التقييمات بنجاح
 */
router.get('/artist/:artistId', controller.getArtistReviews);

export default router; 