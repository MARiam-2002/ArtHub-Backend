import { Router } from 'express';
import * as followController from './follow.controller.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import Validators from './follow.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FollowUser:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d0fe4f5311236168a109ca"
 *         displayName:
 *           type: string
 *           example: "أحمد محمد"
 *         profileImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *             id:
 *               type: string
 *         job:
 *           type: string
 *           example: "فنان تشكيلي"
 *         bio:
 *           type: string
 *           example: "رسام محترف متخصص في اللوحات الزيتية"
 *         followedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:45.123Z"
 *
 *     FollowStats:
 *       type: object
 *       properties:
 *         artistId:
 *           type: string
 *           example: "60d0fe4f5311236168a109ca"
 *         artistName:
 *           type: string
 *           example: "أحمد محمد"
 *         followersCount:
 *           type: integer
 *           example: 150
 *         followingCount:
 *           type: integer
 *           example: 75
 *         recentFollowersCount:
 *           type: integer
 *           example: 12
 *         recentFollowers:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               _id:
 *                 type: string
 *               displayName:
 *                 type: string
 *               profileImage:
 *                 type: object
 *               followedAt:
 *                 type: string
 *                 format: date-time
 *         memberSince:
 *           type: string
 *           format: date-time
 *           example: "2023-01-15T10:30:45.123Z"
 *
 *     FollowResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "تمت المتابعة بنجاح"
 *         data:
 *           oneOf:
 *             - type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 artistId:
 *                   type: string
 *                 artistName:
 *                   type: string
 *                 followedAt:
 *                   type: string
 *                   format: date-time
 *                 isFollowing:
 *                   type: boolean
 *             - type: object
 *               properties:
 *                 action:
 *                   type: string
 *                   enum: ['followed', 'unfollowed']
 *                 artistId:
 *                   type: string
 *                 artistName:
 *                   type: string
 *                 isFollowing:
 *                   type: boolean
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *             - type: object
 *               properties:
 *                 followers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FollowUser'
 *                 pagination:
 *                   $ref: '#/components/schemas/PaginationResponse'
 *             - $ref: '#/components/schemas/FollowStats'
 */

/**
 * @swagger
 * tags:
 *   name: Follow
 *   description: Follow/unfollow functionality
 */

/**
 * @swagger
 * /follow/toggle:
 *   post:
 *     summary: Toggle follow/unfollow artist
 *     tags: [Follow]
 *     description: Follow or unfollow an artist (toggle action)
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
 *                 description: Artist ID to follow/unfollow
 *     responses:
 *       200:
 *         description: Follow status toggled successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: Artist not found
 *       500:
 *         description: Server error
 */
router.post('/toggle', isAuthenticated, followController.toggleFollow);

/**
 * @swagger
 * /follow/followers/{userId}:
 *   get:
 *     summary: Get user followers
 *     tags: [Follow]
 *     description: Get paginated list of user followers
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/followers/:userId', followController.getFollowers);

/**
 * @swagger
 * /follow/followers:
 *   get:
 *     summary: قائمة المتابعين
 *     tags: [Follow]
 *     description: |
 *       جلب قائمة مقسمة من المتابعين للمستخدم الحالي.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد المتابعين في الصفحة
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: البحث في أسماء المتابعين
 *         example: "أحمد"
 *     responses:
 *       200:
 *         description: تم جلب قائمة متابعيك بنجاح
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
 *                   example: "تم جلب قائمة متابعيك بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FollowUser'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: MyFollowersScreen
 */
router.get('/followers', isAuthenticated, (req, res, next) => {
  // Add current user ID to params for the existing controller
  req.params.userId = req.user._id;
  return followController.getFollowers(req, res, next);
});

/**
 * @swagger
 * /follow/following/{userId}:
 *   get:
 *     summary: Get user following
 *     tags: [Follow]
 *     description: Get paginated list of users that the user is following
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/following/:userId', followController.getFollowing);

/**
 * @swagger
 * /follow/following:
 *   get:
 *     summary: قائمة المتابَعين
 *     tags: [Follow]
 *     description: |
 *       جلب قائمة مقسمة من الفنانين الذين يتابعهم المستخدم الحالي.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد المتابَعين في الصفحة
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: البحث في أسماء الفنانين
 *         example: "فاطمة"
 *     responses:
 *       200:
 *         description: تم جلب قائمة متابعاتك بنجاح
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
 *                   example: "تم جلب قائمة متابعاتك بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     following:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FollowUser'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: MyFollowingScreen
 */
router.get('/following', isAuthenticated, (req, res, next) => {
  // Add current user ID to params for the existing controller
  req.params.userId = req.user._id;
  return followController.getFollowing(req, res, next);
});

/**
 * @swagger
 * /follow/status/{artistId}:
 *   get:
 *     summary: Check follow status
 *     tags: [Follow]
 *     description: Check if current user is following an artist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Follow status retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/status/:artistId', isAuthenticated, followController.checkFollowStatus);

/**
 * @swagger
 * /follow/stats/{userId}:
 *   get:
 *     summary: Get follow statistics
 *     tags: [Follow]
 *     description: Get follow statistics for a user (followers and following count)
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Follow statistics retrieved successfully
 *       500:
 *         description: Server error
 */
// Stats endpoint temporarily disabled - function not implemented

/**
 * @swagger
 * /follow/follow:
 *   post:
 *     summary: متابعة فنان
 *     tags: [Follow]
 *     description: |
 *       إنشاء علاقة متابعة بين المستخدم والفنان.
 *       لا يمكن للمستخدم متابعة نفسه.
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
 *                 pattern: ^[0-9a-fA-F]{24}$
 *                 example: "60d0fe4f5311236168a109ca"
 *                 description: "معرف الفنان المراد متابعته"
 *     responses:
 *       201:
 *         description: تمت المتابعة بنجاح
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
 *                   example: "تمت المتابعة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     artistId:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     artistName:
 *                       type: string
 *                       example: "أحمد محمد"
 *                     followedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-05-15T10:30:45.123Z"
 *                     isFollowing:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: خطأ في البيانات أو لا يمكن متابعة نفسك
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "لا يمكنك متابعة نفسك"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: الفنان غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "الفنان غير موجود"
 *       409:
 *         description: أنت تتابع هذا الفنان بالفعل
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "أنت تتابع هذا الفنان بالفعل"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistProfileScreen
 */
router.post(
  '/follow',
  isAuthenticated,
  isValidation(Validators.followUserSchema),
  followController.toggleFollow
);

/**
 * @swagger
 * /follow/unfollow:
 *   post:
 *     summary: إلغاء متابعة فنان
 *     tags: [Follow]
 *     description: |
 *       إزالة علاقة المتابعة بين المستخدم والفنان.
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
 *                 pattern: ^[0-9a-fA-F]{24}$
 *                 example: "60d0fe4f5311236168a109ca"
 *                 description: "معرف الفنان المراد إلغاء متابعته"
 *     responses:
 *       200:
 *         description: تم إلغاء المتابعة بنجاح
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
 *                   example: "تم إلغاء المتابعة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artistId:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     isFollowing:
 *                       type: boolean
 *                       example: false
 *                     unfollowedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-05-15T10:30:45.123Z"
 *       400:
 *         description: أنت لا تتابع هذا الفنان
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "أنت لا تتابع هذا الفنان"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistProfileScreen
 */
router.post(
  '/unfollow',
  isAuthenticated,
  isValidation(Validators.followUserSchema),
  followController.toggleFollow
);

/**
 * @swagger
 * /follow/my-followers:
 *   get:
 *     summary: جلب متابعيّ
 *     tags: [Follow]
 *     description: |
 *       جلب قائمة مقسمة من متابعي المستخدم الحالي مع إمكانية البحث.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد المتابعين في الصفحة
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: البحث في أسماء المتابعين
 *         example: "أحمد"
 *     responses:
 *       200:
 *         description: تم جلب متابعيك بنجاح
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
 *                   example: "تم جلب متابعيك بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     followers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FollowUser'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: MyFollowersScreen
 */
router.get(
  '/my-followers',
  isAuthenticated,
  isValidation(Validators.getFollowersQuerySchema, 'query'),
  (req, res, next) => {
    // Redirect to getFollowers with current user ID
    req.params.userId = req.user._id;
    return followController.getFollowers(req, res, next);
  }
);

/**
 * @swagger
 * /follow/my-following:
 *   get:
 *     summary: جلب متابعاتي
 *     tags: [Follow]
 *     description: |
 *       جلب قائمة مقسمة من الفنانين الذين يتابعهم المستخدم الحالي.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد المتابعات في الصفحة
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: البحث في أسماء الفنانين
 *         example: "فاطمة"
 *     responses:
 *       200:
 *         description: تم جلب قائمة متابعاتك بنجاح
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
 *                   example: "تم جلب قائمة متابعاتك بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     following:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/FollowUser'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: MyFollowingScreen
 */
router.get(
  '/my-following',
  isAuthenticated,
  isValidation(Validators.getFollowingQuerySchema, 'query'),
  (req, res, next) => {
    // Redirect to getFollowing with current user ID
    req.params.userId = req.user._id;
    return followController.getFollowing(req, res, next);
  }
);

/**
 * @swagger
 * /follow/mutual/{userId}:
 *   get:
 *     summary: جلب المتابعات المشتركة
 *     tags: [Follow]
 *     description: |
 *       جلب قائمة المستخدمين الذين يتابعهم كل من المستخدم الحالي والمستخدم المحدد.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: معرف المستخدم المراد مقارنة المتابعات معه
 *         example: "60d0fe4f5311236168a109ca"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد المتابعات المشتركة في الصفحة
 *         example: 20
 *     responses:
 *       200:
 *         description: تم جلب المتابعات المشتركة بنجاح
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
 *                   example: "تم جلب المتابعات المشتركة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     mutualFollows:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           userName:
 *                             type: string
 *                           profileImage:
 *                             type: object
 *                           job:
 *                             type: string
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                     targetUser:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         name:
 *                           type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: المستخدم غير موجود
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "المستخدم غير موجود"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: MutualFollowsScreen
 */
// Mutual follows endpoint temporarily disabled - function not implemented

/**
 * @swagger
 * /follow/artist/{artistId}:
 *   post:
 *     summary: متابعة فنان
 *     tags: [Follow]
 *     description: |
 *       متابعة فنان محدد باستخدام معرف الفنان في الرابط.
 *       لا يمكن للمستخدم متابعة نفسه.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: معرف الفنان المراد متابعته
 *         example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: تمت المتابعة بنجاح
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
 *                   example: "تمت المتابعة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artistId:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     isFollowing:
 *                       type: boolean
 *                       example: true
 *                     followedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-05-15T10:30:45.123Z"
 *       400:
 *         description: خطأ في البيانات أو لا يمكن متابعة نفسك
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: الفنان غير موجود
 *       409:
 *         description: أنت تتابع هذا الفنان بالفعل
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *   delete:
 *     summary: إلغاء متابعة فنان
 *     tags: [Follow]
 *     description: |
 *       إلغاء متابعة فنان محدد باستخدام معرف الفنان في الرابط.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: ^[0-9a-fA-F]{24}$
 *         description: معرف الفنان المراد إلغاء متابعته
 *         example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: تم إلغاء المتابعة بنجاح
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
 *                   example: "تم إلغاء المتابعة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artistId:
 *                       type: string
 *                       example: "60d0fe4f5311236168a109ca"
 *                     isFollowing:
 *                       type: boolean
 *                       example: false
 *                     unfollowedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-05-15T10:30:45.123Z"
 *       400:
 *         description: أنت لا تتابع هذا الفنان
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: الفنان غير موجود
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/artist/:artistId', isAuthenticated, (req, res, next) => {
  // Add artistId to request body for the existing controller
  req.body.artistId = req.params.artistId;
  return followController.toggleFollow(req, res, next);
});

router.delete('/artist/:artistId', isAuthenticated, (req, res, next) => {
  // Add artistId to request body for the existing controller
  req.body.artistId = req.params.artistId;
  return followController.toggleFollow(req, res, next);
});

export default router;
