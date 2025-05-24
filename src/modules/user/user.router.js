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

/**
 * @swagger
 * /api/users/artists/{artistId}/profile:
 *   get:
 *     tags:
 *       - Artists
 *     summary: الحصول على الملف الشخصي للفنان
 *     description: جلب بيانات الفنان مع أعماله وإحصائياته
 *     parameters:
 *       - name: artistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: معرف الفنان
 *     responses:
 *       200:
 *         description: تم جلب ملف الفنان بنجاح
 *       404:
 *         description: الفنان غير موجود
 */
router.get('/artists/:artistId/profile', controller.getArtistProfile);

/**
 * @swagger
 * /api/user/favorites:
 *   get:
 *     tags:
 *       - User
 *     summary: جلب الأعمال الفنية المفضلة
 *     description: جلب قائمة الأعمال الفنية المفضلة للمستخدم
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الأعمال الفنية المفضلة بنجاح
 */
router.get('/favorites', isAuthenticated, controller.getFavoriteArtworks);

/**
 * @swagger
 * /api/user/favorites/firebase:
 *   get:
 *     tags:
 *       - User
 *     summary: جلب الأعمال الفنية المفضلة باستخدام Firebase
 *     description: جلب قائمة الأعمال الفنية المفضلة للمستخدم المصادق عبر Firebase
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: تم جلب الأعمال الفنية المفضلة بنجاح
 */
router.get('/favorites/firebase', verifyFirebaseToken, controller.getFavoriteArtworks);

/**
 * @swagger
 * /api/user/discover-artists:
 *   get:
 *     tags:
 *       - User
 *     summary: Discover new artists
 *     description: Get a list of new or popular artists with pagination
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of artists per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, popular, recommended]
 *           default: newest
 *         description: Sort order for artists
 *     responses:
 *       200:
 *         description: Artists retrieved successfully
 */
router.get('/discover-artists', controller.discoverArtists);

/**
 * @swagger
 * /api/user/settings/language:
 *   put:
 *     tags:
 *       - User Settings
 *     summary: تحديث تفضيلات اللغة
 *     description: تحديث لغة التطبيق المفضلة للمستخدم
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
 *                 description: رمز اللغة المطلوبة
 *     responses:
 *       200:
 *         description: تم تحديث اللغة بنجاح
 *       400:
 *         description: اللغة غير مدعومة
 */
router.put('/settings/language', isAuthenticated, controller.updateLanguagePreference);

/**
 * @swagger
 * /api/user/settings/language/firebase:
 *   put:
 *     tags:
 *       - User Settings
 *     summary: تحديث تفضيلات اللغة (Firebase)
 *     description: تحديث لغة التطبيق المفضلة للمستخدم مع مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
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
 *                 description: رمز اللغة المطلوبة
 *     responses:
 *       200:
 *         description: تم تحديث اللغة بنجاح
 *       400:
 *         description: اللغة غير مدعومة
 */
router.put('/settings/language/firebase', verifyFirebaseToken, controller.updateLanguagePreference);

/**
 * @swagger
 * /api/user/settings/notifications:
 *   put:
 *     tags:
 *       - User Settings
 *     summary: تحديث إعدادات الإشعارات
 *     description: تحديث تفضيلات الإشعارات للمستخدم
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enablePush:
 *                 type: boolean
 *                 description: تفعيل الإشعارات المباشرة
 *               enableEmail:
 *                 type: boolean
 *                 description: تفعيل إشعارات البريد الإلكتروني
 *               muteChat:
 *                 type: boolean
 *                 description: كتم إشعارات المحادثات
 *     responses:
 *       200:
 *         description: تم تحديث إعدادات الإشعارات بنجاح
 */
router.put('/settings/notifications', isAuthenticated, controller.updateNotificationSettings);

/**
 * @swagger
 * /api/user/settings/notifications/firebase:
 *   put:
 *     tags:
 *       - User Settings
 *     summary: تحديث إعدادات الإشعارات (Firebase)
 *     description: تحديث تفضيلات الإشعارات للمستخدم مع مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               enablePush:
 *                 type: boolean
 *                 description: تفعيل الإشعارات المباشرة
 *               enableEmail:
 *                 type: boolean
 *                 description: تفعيل إشعارات البريد الإلكتروني
 *               muteChat:
 *                 type: boolean
 *                 description: كتم إشعارات المحادثات
 *     responses:
 *       200:
 *         description: تم تحديث إعدادات الإشعارات بنجاح
 */
router.put('/settings/notifications/firebase', verifyFirebaseToken, controller.updateNotificationSettings);

/**
 * @swagger
 * /api/user/delete-account:
 *   delete:
 *     tags:
 *       - User
 *     summary: حذف الحساب
 *     description: حذف حساب المستخدم بشكل نهائي
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 description: كلمة المرور للتأكيد
 *     responses:
 *       200:
 *         description: تم حذف الحساب بنجاح
 *       400:
 *         description: كلمة المرور غير صحيحة
 */
router.delete('/delete-account', isAuthenticated, controller.deleteAccount);

/**
 * @swagger
 * /api/user/delete-account/firebase:
 *   delete:
 *     tags:
 *       - User
 *     summary: حذف الحساب (Firebase)
 *     description: حذف حساب المستخدم بشكل نهائي مع مصادقة Firebase
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: تم حذف الحساب بنجاح
 */
router.delete('/delete-account/firebase', verifyFirebaseToken, controller.deleteAccount);

/**
 * @swagger
 * /api/user/logout-all:
 *   post:
 *     tags:
 *       - User
 *     summary: تسجيل الخروج من جميع الأجهزة
 *     description: إبطال جميع جلسات المستخدم وتسجيل الخروج من جميع الأجهزة
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم تسجيل الخروج بنجاح
 */
router.post('/logout-all', isAuthenticated, controller.logoutAllDevices);

/**
 * @swagger
 * /api/user/deactivate:
 *   post:
 *     tags:
 *       - User
 *     summary: تعطيل الحساب
 *     description: تعطيل حساب المستخدم مؤقتاً
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: تم تعطيل الحساب بنجاح
 */
router.post('/deactivate', isAuthenticated, controller.deactivateAccount);

/**
 * @swagger
 * /api/user/reactivate:
 *   post:
 *     tags:
 *       - User
 *     summary: إعادة تنشيط الحساب
 *     description: إعادة تنشيط حساب المستخدم المعطل
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
 *     responses:
 *       200:
 *         description: تم إعادة تنشيط الحساب بنجاح
 *       404:
 *         description: البريد الإلكتروني غير مسجل
 */
router.post('/reactivate', controller.reactivateAccount);

/**
 * @swagger
 * /api/user/preferences/language:
 *   patch:
 *     tags:
 *       - Users
 *       - Settings
 *     summary: تحديث اللغة المفضلة
 *     description: تحديث إعداد اللغة المفضلة للمستخدم
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LanguagePreference'
 *           examples:
 *             Arabic:
 *               value:
 *                 language: 'ar'
 *             English:
 *               value:
 *                 language: 'en'
 *     responses:
 *       200:
 *         description: تم تحديث اللغة المفضلة بنجاح
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
 *                   example: تم تحديث اللغة المفضلة بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferredLanguage:
 *                       type: string
 *                       example: ar
 *       400:
 *         description: بيانات غير صالحة
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.patch('/preferences/language', isAuthenticated, controller.updateLanguagePreference);

export default router;
