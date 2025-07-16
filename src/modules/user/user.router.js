import { Router } from 'express';
import * as userController from './user.controller.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './user.validation.js';
import { fileUpload, filterObject } from '../../utils/multer.js';

const router = Router();

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     description: Get the authenticated user's profile with statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
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
 *                   example: "تم جلب الملف الشخصي بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/profile', isAuthenticated, userController.getProfile);

/**
 * @swagger
 * /user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     description: Update the authenticated user's profile information
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                   example: "تم تحديث الملف الشخصي بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/profile', 
  isAuthenticated,
  fileUpload().single('profileImage'),
  isValidation(Validators.updateProfileSchema),
  userController.updateProfile
);

/**
 * @swagger
 * /user/change-password:
 *   put:
 *     summary: Change user password
 *     tags: [Profile]
 *     description: Change the authenticated user's password
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "تم تغيير كلمة المرور بنجاح"
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/change-password',
  isAuthenticated,
  isValidation(Validators.changePasswordSchema),
  userController.changePassword
);

/**
 * @swagger
 * /user/wishlist:
 *   get:
 *     summary: جلب قائمة المفضلة
 *     tags: [Profile]
 *     description: |
 *       جلب قائمة الأعمال الفنية المحفوظة في المفضلة للمستخدم المسجل دخوله.
 *       يدعم التقسيم (pagination) وترتيب العناصر حسب تاريخ الإضافة.
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
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *         example: 10
 *     responses:
 *       200:
 *         description: تم جلب قائمة المفضلة بنجاح
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
 *                   example: "تم جلب قائمة المفضلة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WishlistItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: WishlistScreen
 */
router.get('/wishlist', 
  isAuthenticated,
  isValidation(Validators.paginationSchema),
  userController.getWishlist
);

/**
 * @swagger
 * /user/wishlist/toggle:
 *   post:
 *     summary: Toggle artwork in wishlist
 *     tags: [Profile]
 *     description: Add or remove an artwork from the user's wishlist
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - artworkId
 *             properties:
 *               artworkId:
 *                 type: string
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *                 example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Wishlist updated successfully
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
 *                   example: "تم إضافة العمل إلى المفضلة"
 *                 data:
 *                   type: object
 *                   properties:
 *                     action:
 *                       type: string
 *                       enum: [added, removed]
 *                       example: "added"
 *                     wishlistCount:
 *                       type: integer
 *                       example: 5
 *                     isInWishlist:
 *                       type: boolean
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Artwork not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/wishlist/toggle',
  isAuthenticated,
  isValidation(Validators.toggleWishlistSchema),
  userController.toggleWishlist
);

/**
 * @swagger
 * /user/artist/{artistId}:
 *   get:
 *     summary: Get artist profile
 *     tags: [Profile]
 *     description: Get public artist profile with statistics and recent artworks
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
 *         example: "60d0fe4f5311236168a109ca"
 *     responses:
 *       200:
 *         description: Artist profile retrieved successfully
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
 *                   example: "تم جلب بيانات الفنان بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/ArtistProfile'
 *       404:
 *         description: Artist not found
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/artist/:artistId',
  isValidation(Validators.artistIdSchema),
  userController.getArtistProfile
);

/**
 * @swagger
 * /user/my-artworks:
 *   get:
 *     summary: Get user's own artworks
 *     tags: [Profile]
 *     description: Get artworks created by the authenticated artist
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, sold]
 *         description: Filter by availability status
 *     responses:
 *       200:
 *         description: Artworks retrieved successfully
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
 *                   example: "تم جلب أعمالك الفنية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ArtworkSummary'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/my-artworks',
  isAuthenticated,
  isValidation(Validators.myArtworksSchema),
  userController.getMyArtworks
);

/**
 * @swagger
 * /user/following:
 *   get:
 *     summary: Get following artists
 *     tags: [Profile]
 *     description: Get list of artists that the user is following
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
 *           default: 10
 *         description: Items per page
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
 *                 message:
 *                   type: string
 *                   example: "تم جلب قائمة المتابعين بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     following:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ArtistSummary'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/following',
  isAuthenticated,
  isValidation(Validators.paginationSchema),
  userController.getFollowing
);

/**
 * @swagger
 * /user/notification-settings:
 *   get:
 *     summary: Get notification settings
 *     tags: [Profile]
 *     description: Get the authenticated user's notification settings
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Notification settings retrieved successfully
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
 *                   example: "تم جلب إعدادات الإشعارات بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/notification-settings',
  isAuthenticated,
  userController.getNotificationSettings
);

/**
 * @swagger
 * /user/notification-settings:
 *   put:
 *     summary: Update notification settings
 *     tags: [Profile]
 *     description: Update the authenticated user's notification settings
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateNotificationSettings'
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
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
 *                   example: "تم تحديث إعدادات الإشعارات بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/NotificationSettings'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/notification-settings',
  isAuthenticated,
  isValidation(Validators.notificationSettingsSchema),
  userController.updateNotificationSettings
);

/**
 * @swagger
 * /user/delete-account:
 *   delete:
 *     summary: Delete user account
 *     tags: [Profile]
 *     description: Permanently delete user account (soft delete)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "userPassword123!"
 *     responses:
 *       200:
 *         description: Account deleted successfully
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
 *                   example: "تم حذف الحساب بنجاح"
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/delete-account',
  isAuthenticated,
  isValidation(Validators.deleteAccountSchema),
  userController.deleteAccount
);

export default router;
