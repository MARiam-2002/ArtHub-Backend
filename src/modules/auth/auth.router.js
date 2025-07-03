import { Router } from 'express';
import * as Validators from './auth.validation.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as authController from './controller/auth.js';
import { authenticate, firebaseToJWT, optionalAuth } from '../../middleware/auth.middleware.js';
import { fileUpload } from '../../utils/multer.js';
import { refreshToken } from '../../middleware/refresh-token.middleware.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - confirmPassword
 *         - displayName
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           minLength: 8
 *           example: "Password123!"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           example: "Password123!"
 *         displayName:
 *           type: string
 *           minLength: 2
 *           maxLength: 50
 *           example: "مريم فوزي"
 *         role:
 *           type: string
 *           enum: [user, artist]
 *           default: user
 *           example: "artist"
 *     
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: "Password123!"
 *     
 *     ForgotPasswordRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *     
 *     VerifyCodeRequest:
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
 *     
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
 *           minLength: 8
 *           example: "NewPassword123!"
 *         confirmPassword:
 *           type: string
 *           format: password
 *           example: "NewPassword123!"
 *     
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     
 *     FCMTokenRequest:
 *       type: object
 *       required:
 *         - fcmToken
 *       properties:
 *         fcmToken:
 *           type: string
 *           example: "fMEGG8-TQVSEJHBFrk-BZ3:APA91bHZKmJLnmRJHBFrk..."
 *     
 *     AuthResponse:
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
 *             email:
 *               type: string
 *               format: email
 *               example: "user@example.com"
 *             displayName:
 *               type: string
 *               example: "مريم فوزي"
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
 *             isVerified:
 *               type: boolean
 *               example: true
 *             accessToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *             refreshToken:
 *               type: string
 *               example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *   
 *   securitySchemes:
 *     BearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: JWT token obtained from login or registration
 *     FirebaseAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *       description: Firebase ID token obtained from Firebase Authentication
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     description: Create a new user account with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Invalid input data
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
 *                   example: "كلمة المرور وتأكيدها غير متطابقين"
 *                 errorCode:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 *       409:
 *         description: Email already exists
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
 *                   example: "البريد الإلكتروني مستخدم بالفعل"
 *                 errorCode:
 *                   type: string
 *                   example: "DUPLICATE_ENTITY"
 */
router.post('/register', isValidation(Validators.registerSchema), authController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     description: Authenticate user with email and password
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
 *               $ref: '#/components/schemas/AuthResponse'
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
 *                   example: "البريد الإلكتروني أو كلمة المرور غير صحيحة"
 *                 errorCode:
 *                   type: string
 *                   example: "INVALID_PASSWORD"
 *       403:
 *         description: Account disabled
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
 *                   example: "تم تعطيل هذا الحساب"
 *                 errorCode:
 *                   type: string
 *                   example: "ACCESS_DENIED"
 */
router.post('/login', isValidation(Validators.loginSchema), authController.login);

/**
 * @swagger
 * /api/auth/firebase:
 *   post:
 *     summary: Login with Firebase token
 *     tags: [Authentication]
 *     description: |
 *       Authenticate user with Firebase ID token.
 *       This endpoint allows clients to login using a Firebase ID token.
 *       If the user doesn't exist, a new account will be created automatically.
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Invalid Firebase token
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
 *                   example: "رمز المصادقة غير صالح"
 *                 errorCode:
 *                   type: string
 *                   example: "FIREBASE_ERROR"
 */
router.post('/firebase', firebaseToJWT, authController.firebaseLogin);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     description: Send password reset code to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordRequest'
 *     responses:
 *       200:
 *         description: Reset code sent successfully
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
 *                   example: "تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني"
 *       404:
 *         description: Email not found
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
 *                   example: "لا يوجد حساب مرتبط بهذا البريد الإلكتروني"
 *                 errorCode:
 *                   type: string
 *                   example: "NOT_FOUND"
 */
router.post('/forgot-password', isValidation(Validators.forgetPasswordSchema), authController.forgetPassword);

/**
 * @swagger
 * /api/auth/verify-forget-code:
 *   post:
 *     summary: Verify password reset code
 *     tags: [Authentication]
 *     description: Verify the 4-digit code sent to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyCodeRequest'
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
 *                   example: "تم التحقق من الرمز بنجاح"
 *       400:
 *         description: Invalid or expired code
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
 *                   example: "الرمز غير صحيح أو منتهي الصلاحية"
 *                 errorCode:
 *                   type: string
 *                   example: "INVALID_TOKEN"
 */
router.post('/verify-forget-code', isValidation(Validators.verifyForgetCodeSchema), authController.verifyForgetCode);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     description: Reset user password using verified code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordRequest'
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: "تم إعادة تعيين كلمة المرور بنجاح"
 *       400:
 *         description: Invalid input or code not verified
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
 *                   example: "لم يتم التحقق من رمز إعادة التعيين"
 *                 errorCode:
 *                   type: string
 *                   example: "VALIDATION_ERROR"
 */
router.post('/reset-password', isValidation(Validators.resetPasswordSchema), authController.resetPassword);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     description: Get new access token using refresh token
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
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم تحديث رمز الوصول بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Invalid or expired refresh token
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
 *                   example: "رمز التحديث غير صالح أو منتهي الصلاحية"
 *                 errorCode:
 *                   type: string
 *                   example: "INVALID_TOKEN"
 */
router.post('/refresh-token', isValidation(Validators.refreshTokenSchema), authController.refreshToken);

/**
 * @swagger
 * /api/auth/fcm-token:
 *   post:
 *     summary: Update FCM token
 *     tags: [Authentication]
 *     description: Update user's FCM token for push notifications
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
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
 *                   example: "تم تحديث رمز الإشعارات بنجاح"
 *       401:
 *         description: Authentication required
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
 *                   example: "لم يتم توفير رمز المصادقة"
 *                 errorCode:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 */
router.post('/fcm-token', authenticate, isValidation(Validators.fcmTokenSchema), authController.updateFCMToken);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     description: Get the profile of the currently authenticated user
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
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
 *                   example: "تم جلب بيانات المستخدم بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
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
 *                   example: "لم يتم توفير رمز المصادقة"
 *                 errorCode:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 */
router.get('/me', authenticate, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Invalidate current access token or specific refresh token
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Specific refresh token to invalidate (optional)
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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
 *                   example: "تم تسجيل الخروج بنجاح"
 *       401:
 *         description: Authentication required
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
 *                   example: "لم يتم توفير رمز المصادقة"
 *                 errorCode:
 *                   type: string
 *                   example: "UNAUTHORIZED"
 */
router.post('/logout', authenticate, authController.logout);

export default router;
