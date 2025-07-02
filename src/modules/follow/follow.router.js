import { Router } from 'express';
import * as controller from './follow.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  followUserSchema,
  userIdParamSchema,
  getFollowersQuerySchema,
  getFollowingQuerySchema
} from './follow.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Follow:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف المتابعة
 *         follower:
 *           $ref: '#/components/schemas/User'
 *         following:
 *           $ref: '#/components/schemas/User'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: تاريخ المتابعة
 *     FollowStats:
 *       type: object
 *       properties:
 *         followersCount:
 *           type: integer
 *           description: عدد المتابعين
 *         followingCount:
 *           type: integer
 *           description: عدد المتابعين
 *         isFollowing:
 *           type: boolean
 *           description: هل يتابع المستخدم الحالي هذا المستخدم
 */

// Toggle Follow
/**
 * @swagger
 * /api/follow/{userId}:
 *   post:
 *     tags: [Follow]
 *     summary: Toggle follow user
 *     description: Follow or unfollow a user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: User ID to follow/unfollow
 *     responses:
 *       200:
 *         description: Follow status toggled successfully
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
 *                     action:
 *                       type: string
 *                       enum: [followed, unfollowed]
 *                       example: "followed"
 *                     isFollowing:
 *                       type: boolean
 *                       example: true
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Cannot follow yourself
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 */
router.post('/:userId', isAuthenticated, isValidation(userIdParamSchema), controller.toggleFollow);

// Get User Followers
/**
 * @swagger
 * /api/follow/{userId}/followers:
 *   get:
 *     tags: [Follow]
 *     summary: Get user followers
 *     description: Get a list of users who follow the specified user
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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search in follower names
 *     responses:
 *       200:
 *         description: Followers retrieved successfully
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
 *                     followers:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       404:
 *         description: User not found
 */
router.get('/:userId/followers', isValidation(userIdParamSchema), isValidation(getFollowersQuerySchema), controller.getFollowers);

// Get User Following
/**
 * @swagger
 * /api/follow/{userId}/following:
 *   get:
 *     tags: [Follow]
 *     summary: Get user following
 *     description: Get a list of users that the specified user follows
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
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search in following names
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
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
 *                     following:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       404:
 *         description: User not found
 */
router.get('/:userId/following', isValidation(userIdParamSchema), isValidation(getFollowingQuerySchema), controller.getFollowing);

// Get Follow Stats
/**
 * @swagger
 * /api/follow/{userId}/stats:
 *   get:
 *     tags: [Follow]
 *     summary: Get follow statistics
 *     description: Get follower and following counts for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: User ID
 *     responses:
 *       200:
 *         description: Follow stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/FollowStats'
 *       404:
 *         description: User not found
 */
router.get('/:userId/stats', isValidation(userIdParamSchema), controller.getFollowStats);

// Check Follow Status
/**
 * @swagger
 * /api/follow/{userId}/status:
 *   get:
 *     tags: [Follow]
 *     summary: Check follow status
 *     description: Check if the authenticated user follows the specified user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: User ID to check
 *     responses:
 *       200:
 *         description: Follow status retrieved successfully
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
 *                     isFollowing:
 *                       type: boolean
 *                       example: true
 *                     followedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Date when follow relationship was created (if following)
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: User not found
 */
router.get('/:userId/status', isAuthenticated, isValidation(userIdParamSchema), controller.getFollowStatus);

// Get My Followers
/**
 * @swagger
 * /api/follow/my-followers:
 *   get:
 *     tags: [Follow]
 *     summary: Get my followers
 *     description: Get a list of users who follow the authenticated user
 *     security:
 *       - BearerAuth: []
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search in follower names
 *     responses:
 *       200:
 *         description: My followers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-followers', isAuthenticated, isValidation(getFollowersQuerySchema), controller.getMyFollowers);

// Get My Following
/**
 * @swagger
 * /api/follow/my-following:
 *   get:
 *     tags: [Follow]
 *     summary: Get my following
 *     description: Get a list of users that the authenticated user follows
 *     security:
 *       - BearerAuth: []
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search in following names
 *     responses:
 *       200:
 *         description: My following list retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-following', isAuthenticated, isValidation(getFollowingQuerySchema), controller.getMyFollowing);

export default router;
