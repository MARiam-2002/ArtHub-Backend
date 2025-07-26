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
  fileUpload(filterObject.image).single('profileImage'),
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
 *     summary: Get user wishlist
 *     tags: [Profile]
 *     description: Get the authenticated user's wishlist with pagination
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
 *         description: Wishlist retrieved successfully
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
 *                     wishlist:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/WishlistItem'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
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
 * /api/user/top-artists:
 *   get:
 *     summary: جلب أفضل الفنانين
 *     tags: [Artists]
 *     description: |
 *       جلب أفضل الفنانين مرتبين حسب التقييم والمتابعين.
 *       مخصص لشاشة "مشاهدة الجميع" لأفضل الفنانين.
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
 *         description: عدد الفنانين في الصفحة
 *         example: 20
 *     responses:
 *       200:
 *         description: تم جلب أفضل الفنانين بنجاح
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
 *                   example: "تم جلب أفضل الفنانين بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artists:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                           job:
 *                             type: string
 *                           bio:
 *                             type: string
 *                           rating:
 *                             type: number
 *                           reviewsCount:
 *                             type: number
 *                           artworksCount:
 *                             type: number
 *                           followersCount:
 *                             type: number
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistsScreen
 */
router.get('/top-artists',
  isValidation(Validators.paginationSchema, 'query'),
  userController.getTopArtists
);

/**
 * @swagger
 * /api/user/latest-artists:
 *   get:
 *     summary: جلب أحدث الفنانين
 *     tags: [Artists]
 *     description: |
 *       جلب أحدث الفنانين المسجلين في النظام.
 *       مخصص لشاشة "مشاهدة الجميع" لأحدث الفنانين.
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
 *         description: عدد الفنانين في الصفحة
 *         example: 20
 *     responses:
 *       200:
 *         description: تم جلب أحدث الفنانين بنجاح
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
 *                   example: "تم جلب أحدث الفنانين بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artists:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                           job:
 *                             type: string
 *                           bio:
 *                             type: string
 *                           joinDate:
 *                             type: string
 *                           artworksCount:
 *                             type: number
 *                           followersCount:
 *                             type: number
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistsScreen
 */
router.get('/latest-artists',
  isValidation(Validators.paginationSchema, 'query'),
  userController.getLatestArtists
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

/**
 * @swagger
 * /user/artist/{artistId}:
 *   get:
 *     summary: عرض تفاصيل الفنان
 *     tags: [Artist]
 *     description: جلب تفاصيل شاملة للفنان مع إحصائياته وأعماله
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الفنان
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *     responses:
 *       200:
 *         description: تم جلب تفاصيل الفنان بنجاح
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
 *                   example: "تم جلب تفاصيل الفنان بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         job:
 *                           type: string
 *                         profileImage:
 *                           type: object
 *                         bio:
 *                           type: string
 *                         location:
 *                           type: string
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalArtworks:
 *                           type: number
 *                         totalSales:
 *                           type: number
 *                         completedOrders:
 *                           type: number
 *                         averageRating:
 *                           type: number
 *                         totalReviews:
 *                           type: number
 *                     artworks:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Artwork'
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationResponse'
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                           reporter:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           rating:
 *                             type: number
 *                           comment:
 *                             type: string
 *                           artwork:
 *                             type: object
 *                           reviewer:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                           action:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *       404:
 *         description: الفنان غير موجود
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistDetailsScreen
 */
router.get('/artist/:artistId', 
  isValidation(Validators.artistIdSchema, 'params'),
  isValidation(Validators.artistDetailsQuerySchema, 'query'),
  userController.getArtistDetails
);

/**
 * @swagger
 * /user/artist/{artistId}/artworks:
 *   get:
 *     summary: جلب أعمال الفنان
 *     tags: [Artist]
 *     description: جلب أعمال الفنان مع إمكانية التصفية والترتيب
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الفنان
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 12
 *         description: عدد الأعمال في الصفحة
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, sold, reserved]
 *         description: تصفية حسب الحالة
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: تصفية حسب الفئة
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: الحد الأدنى للسعر
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: الحد الأقصى للسعر
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, title, viewCount]
 *           default: createdAt
 *         description: ترتيب حسب
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: ترتيب تصاعدي أو تنازلي
 *     responses:
 *       200:
 *         description: تم جلب أعمال الفنان بنجاح
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
 *                   example: "تم جلب أعمال الفنان بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalArtworks:
 *                           type: number
 *                         totalViews:
 *                           type: number
 *                         totalLikes:
 *                           type: number
 *                         avgPrice:
 *                           type: number
 *       404:
 *         description: الفنان غير موجود
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistArtworksScreen
 */
router.get('/artist/:artistId/artworks', userController.getArtistArtworks);

/**
 * @swagger
 * /user/artist/{artistId}/reports:
 *   get:
 *     summary: جلب البلاغات المقدمة على الفنان
 *     tags: [Artist]
 *     description: جلب البلاغات المقدمة على الفنان مع إحصائياتها
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الفنان
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: عدد البلاغات في الصفحة
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, reviewed, resolved, rejected]
 *         description: تصفية حسب حالة البلاغ
 *     responses:
 *       200:
 *         description: تم جلب البلاغات بنجاح
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
 *                   example: "تم جلب البلاغات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
 *                           reporter:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                     stats:
 *                       type: object
 *                       additionalProperties:
 *                         type: number
 *       404:
 *         description: الفنان غير موجود
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistReportsScreen
 */
router.get('/artist/:artistId/reports', userController.getArtistReports);

/**
 * @swagger
 * /user/artist/{artistId}/reviews:
 *   get:
 *     summary: جلب تقييمات الفنان
 *     tags: [Artist]
 *     description: جلب تقييمات الفنان مع إحصائيات التقييمات
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الفنان
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: عدد التقييمات في الصفحة
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: تصفية حسب التقييم
 *     responses:
 *       200:
 *         description: تم جلب التقييمات بنجاح
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
 *                   example: "تم جلب التقييمات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                     reviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           rating:
 *                             type: number
 *                           comment:
 *                             type: string
 *                           artwork:
 *                             type: object
 *                           reviewer:
 *                             type: object
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         averageRating:
 *                           type: number
 *                         totalReviews:
 *                           type: number
 *                         ratingDistribution:
 *                           type: object
 *                           additionalProperties:
 *                             type: number
 *       404:
 *         description: الفنان غير موجود
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistReviewsScreen
 */
router.get('/artist/:artistId/reviews', userController.getArtistReviews);

/**
 * @swagger
 * /user/artist/{artistId}/activities:
 *   get:
 *     summary: جلب سجل نشاط الفنان
 *     tags: [Artist]
 *     description: جلب سجل نشاط الفنان مع تفاصيل الأنشطة
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الفنان
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد الأنشطة في الصفحة
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [transaction, review, login]
 *         description: تصفية حسب نوع النشاط
 *     responses:
 *       200:
 *         description: تم جلب سجل النشاط بنجاح
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
 *                   example: "تم جلب سجل النشاط بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         displayName:
 *                           type: string
 *                     activities:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           type:
 *                             type: string
 *                           action:
 *                             type: string
 *                           title:
 *                             type: string
 *                           description:
 *                             type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *                           icon:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         currentPage:
 *                           type: number
 *                         totalItems:
 *                           type: number
 *                         hasNextPage:
 *                           type: boolean
 *       404:
 *         description: الفنان غير موجود
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ArtistActivitiesScreen
 */
router.get('/artist/:artistId/activities', userController.getArtistActivities);

export default router;
