
import { Router } from 'express';
import * as controller from './user.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken } from '../../middleware/firebase.middleware.js';
const router = Router();

/**
 * @swagger
 * /api/user/wishlist/toggle:
 *   post:
 *     tags:
 *       - User
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
 *                 description: ID of the artwork to toggle in wishlist
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
 */
router.post('/wishlist/toggle', isAuthenticated, controller.toggleWishlist);

/**
 * @swagger
 * /api/user/wishlist/toggle/firebase:
 *   post:
 *     tags:
 *       - User
 *     summary: Toggle artwork in wishlist with Firebase auth
 *     description: Add or remove an artwork from user's wishlist using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
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
 *     responses:
 *       200:
 *         description: Artwork toggled in wishlist
 */
router.post('/wishlist/toggle/firebase', verifyFirebaseToken, controller.toggleWishlist);

/**
 * @swagger
 * /api/user/wishlist:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user wishlist
 *     description: Get all artworks in the user's wishlist
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/wishlist', isAuthenticated, controller.getWishlist);

/**
 * @swagger
 * /api/user/wishlist/firebase:
 *   get:
 *     tags:
 *       - User
 *     summary: Get user wishlist with Firebase auth
 *     description: Get all artworks in the user's wishlist using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Wishlist retrieved successfully
 */
router.get('/wishlist/firebase', verifyFirebaseToken, controller.getWishlist);

/**
 * @swagger
 * /api/user/profile:
 *   put:
 *     tags:
 *       - User
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
 *               job:
 *                 type: string
 *               profileImage:
 *                 type: object
 *                 properties:
 *                   url:
 *                     type: string
 *                   id:
 *                     type: string
 *               coverImages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     id:
 *                       type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', isAuthenticated, controller.updateProfile);

/**
 * @swagger
 * /api/user/profile/firebase:
 *   put:
 *     tags:
 *       - User
 *     summary: Update user profile with Firebase auth
 *     description: Update user profile information using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *               job:
 *                 type: string
 *               profileImage:
 *                 type: object
 *               coverImages:
 *                 type: array
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile/firebase', verifyFirebaseToken, controller.updateProfile);

/**
 * @swagger
 * /api/user/change-password:
 *   patch:
 *     tags:
 *       - User
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
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.patch('/change-password', isAuthenticated, controller.changePassword);

/**
 * @swagger
 * /api/user/artist-profile/{artistId}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get artist profile
 *     description: Get detailed profile information for an artist
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artist profile retrieved successfully
 *       404:
 *         description: Artist not found
 */
router.get('/artist-profile/:artistId', controller.getArtistProfile);

/**
 * @swagger
 * /api/user/profile/{artistId}:
 *   get:
 *     tags:
 *       - User
 *     summary: Get artist profile (alias)
 *     description: Get detailed profile information for an artist (alias of /artist-profile/{artistId})
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artist profile retrieved successfully
 *       404:
 *         description: Artist not found
 */
router.get('/profile/:artistId', controller.getArtistProfile);

/**
 * @swagger
 * /api/user/follow/{artistId}:
 *   post:
 *     tags:
 *       - User
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
 *     responses:
 *       200:
 *         description: Artist followed successfully
 */
router.post('/follow/:artistId', isAuthenticated, controller.followArtist);

/**
 * @swagger
 * /api/user/follow/{artistId}/firebase:
 *   post:
 *     tags:
 *       - User
 *     summary: Follow artist with Firebase auth
 *     description: Follow an artist using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artist followed successfully
 */
router.post('/follow/:artistId/firebase', verifyFirebaseToken, controller.followArtist);

/**
 * @swagger
 * /api/user/unfollow/{artistId}:
 *   post:
 *     tags:
 *       - User
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
 *     responses:
 *       200:
 *         description: Artist unfollowed successfully
 */
router.post('/unfollow/:artistId', isAuthenticated, controller.unfollowArtist);

/**
 * @swagger
 * /api/user/unfollow/{artistId}/firebase:
 *   post:
 *     tags:
 *       - User
 *     summary: Unfollow artist with Firebase auth
 *     description: Unfollow an artist using Firebase authentication
 *     security:
 *       - FirebaseAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Artist unfollowed successfully
 */
router.post('/unfollow/:artistId/firebase', verifyFirebaseToken, controller.unfollowArtist);

export default router;
