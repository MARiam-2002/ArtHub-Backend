import { Router } from 'express';
import * as Validators from './auth.validation.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as userController from './controller/auth.js';
import { isAuthenticated, invalidateToken, invalidateAllTokens } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken, firebaseToJWT } from '../../middleware/firebase-auth.middleware.js';
import { fileUpload } from '../../utils/multer.js';
import { refreshToken } from '../../middleware/refresh-token.middleware.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     VerificationCodeRequest:
 *       type: object
 *       required:
 *         - email
 *         - forgetCode
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         forgetCode:
 *           type: string
 *           pattern: ^\d{4}$
 *           example: "1234"
 *     ResetPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - confirmPassword
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: "NewPassword123!"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           example: "NewPassword123!"
 *     FCMTokenRequest:
 *       type: object
 *       required:
 *         - fcmToken
 *       properties:
 *         fcmToken:
 *           type: string
 *           example: "fMEGG8-TQVSEJHBFrk-BZ3:APA91bHZKmJLnmRJHBFrk..."
 *     AuthSuccessResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         message:
 *           type: string
 *           example: "تم تسجيل الدخول بنجاح"
 *         data:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: "60d0fe4f5311236168a109ca"
 *             displayName:
 *               type: string
 *               example: "مريم فوزي"
 *             email:
 *               type: string
 *               format: email
 *               example: "user@example.com"
 *             role:
 *               type: string
 *               enum: [user, artist]
 *               example: "artist"
 *             profileImage:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   format: uri
 *                   example: "https://res.cloudinary.com/demo/image/upload/v1612345678/profile.jpg"
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             refreshToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   responses:
 *     UnauthorizedError:
 *       description: غير مصرح - المصادقة مطلوبة
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "يجب تسجيل الدخول أولاً"
 *     BadRequestError:
 *       description: طلب غير صالح - مشكلة في البيانات المرسلة
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "بيانات غير صالحة"
 *     ServerError:
 *       description: خطأ في الخادم - فشل في معالجة الطلب
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *                 example: false
 *               message:
 *                 type: string
 *                 example: "حدث خطأ في الخادم"
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login or registration
 *     firebaseAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Firebase ID token obtained from Firebase Authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     description: |
 *       Create a new user account with email and password.
 *       Returns access and refresh tokens for authentication.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       409:
 *         description: Email already registered
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
 *                   example: البريد الإلكتروني مسجل بالفعل
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/register', isValidation(Validators.registerSchema), userController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: |
 *       Authenticate user with email and password.
 *       This endpoint validates credentials, checks user status,
 *       and generates JWT tokens for API access.
 *       The tokens are also saved in the database for tracking active sessions.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       400:
 *         description: Invalid credentials
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
 *                   example: البريد الإلكتروني أو كلمة المرور غير صحيحة
 *       401:
 *         description: Account disabled or suspended
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
 *                   example: تم تعليق الحساب، يرجى التواصل مع الدعم الفني
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/login', isValidation(Validators.loginSchema), userController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user (invalidate current token)
 *     tags: [Authentication]
 *     description: |
 *       Invalidate the current authentication token, effectively logging the user out.
 *       This endpoint marks the token as invalid in the database to prevent further use.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
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
 *                   example: تم تسجيل الخروج بنجاح
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout', isAuthenticated, invalidateToken);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Authentication]
 *     description: |
 *       Invalidate all authentication tokens for the current user, effectively logging out from all devices.
 *       This endpoint marks all tokens as invalid in the database to prevent further use.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Logout from all devices successful
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
 *                   example: تم تسجيل الخروج من جميع الأجهزة بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     invalidatedCount:
 *                       type: integer
 *                       example: 3
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/logout-all', isAuthenticated, invalidateAllTokens);

/**
 * @swagger
 * /api/auth/forget-password:
 *   post:
 *     summary: Send forget password code
 *     tags: [Authentication]
 *     description: |
 *       Send a 4-digit verification code to the user's email for password reset.
 *       For security, the response doesn't reveal if the email exists.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgetPasswordRequest'
 *     responses:
 *       200:
 *         description: Code sent (if email exists)
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
 *                   example: تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/forget-password', isValidation(Validators.forgetPasswordSchema), userController.sendForgetCode);

/**
 * @swagger
 * /api/auth/verify-forget-code:
 *   post:
 *     summary: Verify forget password code
 *     tags: [Authentication]
 *     description: |
 *       Verify the 4-digit code sent for password reset.
 *       Must be called before reset-password endpoint.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerificationCodeRequest'
 *     responses:
 *       200:
 *         description: Code verified successfully
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
 *                   example: تم التحقق من الرمز بنجاح
 *       400:
 *         description: Invalid code
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
 *                   example: رمز التحقق غير صحيح أو منتهي الصلاحية
 */
router.post('/verify-forget-code', isValidation(Validators.verifyForgetCodeSchema), userController.verifyForgetCode);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using verified code
 *     tags: [Authentication]
 *     description: |
 *       Reset user password after code verification.
 *       Requires prior verification of forget code.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successful
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
 *                   example: تم تحديث كلمة المرور بنجاح
 *       400:
 *         description: Invalid request
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
 *                   example: يرجى التحقق من الكود أولاً
 */
router.post('/reset-password', isValidation(Validators.resetPasswordSchema), userController.resetPasswordByCode);

/**
 * @swagger
 * /api/auth/firebase:
 *   post:
 *     summary: Login with Firebase token
 *     tags: [Authentication]
 *     description: |
 *       Authenticate user with Firebase token.
 *       This endpoint allows clients to login using a Firebase ID token.
 *       If the user doesn't exist, a new account will be created automatically.
 *     security:
 *       - firebaseAuth: []
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthSuccessResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/firebase', verifyFirebaseToken, firebaseToJWT, userController.firebaseLogin);

/**
 * @swagger
 * /api/auth/fcm-token:
 *   post:
 *     summary: Update FCM token for push notifications
 *     tags: [Authentication]
 *     description: |
 *       Update the Firebase Cloud Messaging (FCM) token for the current user.
 *       This token is used to send push notifications to the user's device.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/FCMTokenRequest'
 *     responses:
 *       200:
 *         description: FCM token updated successfully
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
 *                   example: تم تحديث رمز الإشعارات بنجاح
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post('/fcm-token', isAuthenticated, isValidation(Validators.fcmTokenSchema), userController.updateFCMToken);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Authentication]
 *     description: |
 *       Generate a new access token using a valid refresh token.
 *       This endpoint allows clients to get a new access token without requiring the user to log in again.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshTokenResponse'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/refresh-token', isValidation(Validators.refreshTokenSchema), refreshToken);

// router.put(
//   "/redHeart/:productId",
//   isAuthenticated,
// userController.redHeart
// );
// router.get("/wishlist", isAuthenticated, userController.wishlist);
export default router;
