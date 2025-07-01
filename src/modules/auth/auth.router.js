import { Router } from 'express';
import * as Validators from './auth.validation.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as userController from './controller/auth.js';
import { isAuthenticated, invalidateToken, invalidateAllTokens } from '../../middleware/authentication.middleware.js';
import { verifyFirebaseToken, firebaseToJWT } from '../../middleware/firebase-auth.middleware.js';
import { fileUpload } from '../../utils/multer.js';

const router = Router();

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
 *             $ref: '#/components/schemas/UserRegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
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
 *                   example: تم إنشاء الحساب بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: 60d0fe4f5311236168a109ca
 *                     displayName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     token:
 *                       type: string
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
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
 *                   example: البريد الإلكتروني مسجل بالفعل
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: RegisterScreen
 */
router.post('/register', isValidation(Validators.registerSchema), userController.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Authentication]
 *     description: Authenticate user with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserLoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: تم تسجيل الدخول بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     token:
 *                       type: string
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: LoginScreen
 */
router.post('/login', isValidation(Validators.loginSchema), userController.login);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     description: Invalidate the current user's token
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
 *       404:
 *         description: Token not found
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
 *                   example: رمز المصادقة غير موجود
 *     x-screen: ProfileScreen
 */
router.post('/logout', invalidateToken);

/**
 * @swagger
 * /api/auth/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags: [Authentication]
 *     description: Invalidate all tokens for the current user
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *     x-screen: ProfileScreen
 */
router.post('/logout-all', isAuthenticated, invalidateAllTokens);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Send password reset code to email
 *     tags: [Authentication]
 *     description: Send a verification code to the user's email for password reset
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
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
 *                   example: تم إرسال رمز إعادة تعيين كلمة المرور إلى بريدك الإلكتروني
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: ForgotPasswordScreen
 */
router.post('/forgot-password', isValidation(Validators.forgetCode), userController.sendForgetCode);

/**
 * @swagger
 * /api/auth/verify-code:
 *   post:
 *     summary: Verify password reset code
 *     tags: [Authentication]
 *     description: Verify the reset code sent to user's email
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - forgetCode
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               forgetCode:
 *                 type: string
 *                 pattern: ^\d{4}$
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
 *                   example: رمز التحقق غير صحيح
 *     x-screen: VerifyCodeScreen
 */
router.post(
  '/verify-code',
  isValidation(Validators.verifyForgetCode),
  userController.verifyForgetCode
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using verified code
 *     tags: [Authentication]
 *     description: Reset user password after code verification
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               confirmPassword:
 *                 type: string
 *                 format: password
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
 *     x-screen: ResetPasswordScreen
 */
router.post(
  '/reset-password',
  isValidation(Validators.resetPasswordByCode),
  userController.resetPasswordByCode
);

/**
 * @swagger
 * /api/auth/firebase:
 *   post:
 *     summary: Login or register with Firebase
 *     tags: [Authentication]
 *     description: Authenticate user with Firebase token and create JWT for API access
 *     security:
 *       - FirebaseAuth: []
 *     responses:
 *       200:
 *         description: Firebase authentication successful
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
 *                   example: تم تسجيل الدخول بنجاح
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     email:
 *                       type: string
 *                     profileImage:
 *                       type: string
 *                     role:
 *                       type: string
 *                     token:
 *                       type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *     x-screen: LoginScreen
 */
router.post('/firebase', verifyFirebaseToken, firebaseToJWT, (req, res) => {
  // User and token already attached by middleware
  res.status(200).json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: {
      _id: req.user._id,
      displayName: req.user.displayName,
      email: req.user.email,
      profileImage: req.user.profileImage,
      role: req.user.role,
      token: req.user.token
    }
  });
});

/**
 * @swagger
 * /api/auth/update-fcm-token:
 *   post:
 *     summary: Update FCM token for push notifications
 *     tags: [Authentication]
 *     description: Update the Firebase Cloud Messaging token for the current user
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fcmToken
 *             properties:
 *               fcmToken:
 *                 type: string
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
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.post(
  '/update-fcm-token',
  isAuthenticated,
  isValidation(Validators.fcmTokenSchema),
  userController.updateFCMToken
);

// router.put(
//   "/redHeart/:productId",
//   isAuthenticated,
// userController.redHeart
// );
// router.get("/wishlist", isAuthenticated, userController.wishlist);
export default router;
