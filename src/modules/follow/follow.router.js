import { Router } from 'express';
import * as controller from './follow.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './follow.validation.js';
const router = Router();

/**
 * @swagger
 * /api/follow/follow:
 *   post:
 *     tags:
 *       - Follow
 *     summary: متابعة فنان
 *     description: إنشاء متابعة جديدة لفنان
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artistId
 *             properties:
 *               artistId:
 *                 type: string
 *     responses:
 *       201:
 *         description: تمت المتابعة بنجاح
 */
router.post(
  '/follow',
  isAuthenticated,
  isValidation(Validators.followArtistSchema),
  controller.followArtist
);

/**
 * @swagger
 * /api/follow/unfollow:
 *   post:
 *     tags:
 *       - Follow
 *     summary: إلغاء متابعة فنان
 *     description: إلغاء متابعة فنان تتم متابعته حاليًا
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artistId
 *             properties:
 *               artistId:
 *                 type: string
 *     responses:
 *       200:
 *         description: تم إلغاء المتابعة بنجاح
 */
router.post(
  '/unfollow',
  isAuthenticated,
  isValidation(Validators.unfollowArtistSchema),
  controller.unfollowArtist
);

/**
 * @swagger
 * /api/follow/followers/{artistId}:
 *   get:
 *     tags:
 *       - Follow
 *     summary: الحصول على متابعي فنان
 *     description: جلب قائمة المستخدمين الذين يتابعون فنانًا معينًا
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
 *           default: 20
 *     responses:
 *       200:
 *         description: تم جلب المتابعين بنجاح
 */
router.get('/followers/:artistId', controller.getFollowers);

/**
 * @swagger
 * /api/follow/following/{userId}:
 *   get:
 *     tags:
 *       - Follow
 *     summary: الحصول على متابَعي مستخدم
 *     description: جلب قائمة الفنانين الذين يتابعهم المستخدم
 *     parameters:
 *       - name: userId
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
 *           default: 20
 *     responses:
 *       200:
 *         description: تم جلب المتابَعين بنجاح
 */
router.get('/following/:userId', controller.getFollowing);

/**
 * @swagger
 * /api/follow/status/{artistId}:
 *   get:
 *     tags:
 *       - Follow
 *     summary: التحقق من حالة المتابعة
 *     description: التحقق مما إذا كان المستخدم الحالي يتابع فنانًا معينًا
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - name: artistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: تم التحقق من حالة المتابعة بنجاح
 */
router.get('/status/:artistId', isAuthenticated, controller.checkFollowStatus);

export default router; 