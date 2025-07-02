import { Router } from 'express';
import * as controller from './user.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import {
  toggleWishlistSchema,
  updateProfileSchema,
  changePasswordSchema,
  discoverArtistsQuerySchema,
  languagePreferenceSchema,
  notificationSettingsSchema,
  deleteAccountSchema,
  reactivateAccountSchema,
  followersQuerySchema,
  userIdParamSchema,
  artistIdParamSchema,
  searchUsersSchema,
  privacySettingsSchema
} from './user.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     UserProfile:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف المستخدم
 *         displayName:
 *           type: string
 *           description: اسم المستخدم للعرض
 *         email:
 *           type: string
 *           format: email
 *           description: البريد الإلكتروني
 *         role:
 *           type: string
 *           enum: [user, artist]
 *           description: دور المستخدم
 *         profileImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *         bio:
 *           type: string
 *           description: نبذة عن المستخدم
 *         phoneNumber:
 *           type: string
 *           description: رقم الهاتف
 *         location:
 *           type: string
 *           description: الموقع
 *         isActive:
 *           type: boolean
 *           description: حالة النشاط
 *         createdAt:
 *           type: string
 *           format: date-time
 *         stats:
 *           type: object
 *           properties:
 *             totalArtworks:
 *               type: number
 *             totalFollowers:
 *               type: number
 *             totalFollowing:
 *               type: number
 *             avgRating:
 *               type: number
 */

// Profile Management
/**
 * @swagger
 * /api/user/profile:
 *   get:
 *     tags: [User]
 *     summary: Get current user profile
 *     description: Get the authenticated user's profile information
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
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/profile', isAuthenticated, controller.getMyProfile);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     tags: [User]
 *     summary: Update user profile
 *     description: Update user profile information
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: اسم المستخدم للعرض
 *               bio:
 *                 type: string
 *                 description: نبذة شخصية
 *               phoneNumber:
 *                 type: string
 *                 description: رقم الهاتف
 *               location:
 *                 type: string
 *                 description: الموقع
 *               profileImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   id:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/profile', isAuthenticated, isValidation(updateProfileSchema), controller.updateProfile);

/**
 * @swagger
 * /api/user/change-password:
 *   patch:
 *     tags: [User]
 *     summary: Change password
 *     description: Change user password
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *               - confirmPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/change-password', isAuthenticated, isValidation(changePasswordSchema), controller.changePassword);

// Artist Profiles
/**
 * @swagger
 * /api/user/artist/{artistId}:
 *   get:
 *     tags: [User]
 *     summary: Get artist profile
 *     description: Get detailed profile information for an artist
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الفنان
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
 *                 data:
 *                   $ref: '#/components/schemas/UserProfile'
 *       404:
 *         description: Artist not found
 */
router.get('/artist/:artistId', isValidation(artistIdParamSchema), controller.getArtistProfile);

// Wishlist Management
/**
 * @swagger
 * /api/user/wishlist:
 *   get:
 *     tags: [User]
 *     summary: Get user wishlist
 *     description: Get all artworks in the user's wishlist
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
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/wishlist', isAuthenticated, controller.getWishlist);

/**
 * @swagger
 * /api/user/wishlist/toggle:
 *   post:
 *     tags: [User]
 *     summary: Toggle artwork in wishlist
 *     description: Add or remove an artwork from user's wishlist
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
 *                 description: معرف العمل الفني
 *     responses:
 *       200:
 *         description: Artwork toggled in wishlist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 action:
 *                   type: string
 *                   enum: [added, removed]
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/wishlist/toggle', isAuthenticated, isValidation(toggleWishlistSchema), controller.toggleWishlist);

// Following System
/**
 * @swagger
 * /api/user/follow/{artistId}:
 *   post:
 *     tags: [User]
 *     summary: Follow artist
 *     description: Follow an artist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Artist followed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/follow/:artistId', isAuthenticated, isValidation(artistIdParamSchema), controller.followArtist);

/**
 * @swagger
 * /api/user/unfollow/{artistId}:
 *   post:
 *     tags: [User]
 *     summary: Unfollow artist
 *     description: Unfollow an artist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Artist unfollowed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/unfollow/:artistId', isAuthenticated, isValidation(artistIdParamSchema), controller.unfollowArtist);

/**
 * @swagger
 * /api/user/following:
 *   get:
 *     tags: [User]
 *     summary: Get following list
 *     description: Get list of artists the user is following
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
 *     responses:
 *       200:
 *         description: Following list retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/following', isAuthenticated, controller.getFollowing);

/**
 * @swagger
 * /api/user/followers:
 *   get:
 *     tags: [User]
 *     summary: Get followers list
 *     description: Get list of users following the current user
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
 *     responses:
 *       200:
 *         description: Followers list retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/followers', isAuthenticated, controller.getFollowers);

// Discovery
/**
 * @swagger
 * /api/user/discover/artists:
 *   get:
 *     tags: [User]
 *     summary: Discover artists
 *     description: Discover new artists based on preferences
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
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
 *         description: Artists discovered successfully
 */
router.get('/discover/artists', isValidation(discoverArtistsQuerySchema), controller.discoverArtists);

/**
 * @swagger
 * /api/user/search:
 *   get:
 *     tags: [User]
 *     summary: Search users
 *     description: Search for users by name or email
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, artist, user]
 *           default: all
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
 */
router.get('/search', isValidation(searchUsersSchema), controller.searchUsers);

// Settings
/**
 * @swagger
 * /api/user/settings/language:
 *   put:
 *     tags: [User]
 *     summary: Update language preference
 *     description: Update user's language preference
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - language
 *             properties:
 *               language:
 *                 type: string
 *                 enum: [ar, en]
 *                 description: Language code
 *     responses:
 *       200:
 *         description: Language preference updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/settings/language', isAuthenticated, isValidation(languagePreferenceSchema), controller.updateLanguagePreference);

/**
 * @swagger
 * /api/user/settings/notifications:
 *   put:
 *     tags: [User]
 *     summary: Update notification settings
 *     description: Update user's notification preferences
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailNotifications:
 *                 type: boolean
 *               pushNotifications:
 *                 type: boolean
 *               marketingEmails:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Notification settings updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/settings/notifications', isAuthenticated, isValidation(notificationSettingsSchema), controller.updateNotificationSettings);

/**
 * @swagger
 * /api/user/settings/privacy:
 *   put:
 *     tags: [User]
 *     summary: Update privacy settings
 *     description: Update user's privacy settings
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               profileVisibility:
 *                 type: string
 *                 enum: [public, private]
 *               showEmail:
 *                 type: boolean
 *               showPhone:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Privacy settings updated successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.put('/settings/privacy', isAuthenticated, isValidation(privacySettingsSchema), controller.updatePrivacySettings);

// Account Management
/**
 * @swagger
 * /api/user/delete-account:
 *   delete:
 *     tags: [User]
 *     summary: Delete user account
 *     description: Permanently delete user account
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
 *               - confirmDeletion
 *             properties:
 *               password:
 *                 type: string
 *                 format: password
 *               confirmDeletion:
 *                 type: string
 *                 enum: [DELETE]
 *               reason:
 *                 type: string
 *                 description: Optional reason for deletion
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.delete('/delete-account', isAuthenticated, isValidation(deleteAccountSchema), controller.deleteAccount);

/**
 * @swagger
 * /api/user/reactivate-account:
 *   post:
 *     tags: [User]
 *     summary: Reactivate deactivated account
 *     description: Reactivate a previously deactivated account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Account reactivated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       404:
 *         description: Account not found or not deactivated
 */
router.post('/reactivate-account', isValidation(reactivateAccountSchema), controller.reactivateAccount);

export default router;
