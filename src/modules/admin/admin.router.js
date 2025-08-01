// NEW VERSION 2025-07-18 - Admin Router with Cloudinary Organized Folders
// FORCE DEPLOYMENT TRIGGER v1.0.4 - This comment forces Vercel to redeploy
// CLOUDINARY ORGANIZED FOLDERS SYSTEM - UPDATED 2025-07-19
import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './admin.validation.js';
import { fileUpload, filterObject } from '../../utils/multer.js';
import orderManagementRouter from './order-management.router.js';
import reviewsManagementRouter from './reviews-management.router.js';
import reportsManagementRouter from './reports-management.router.js';

// لوجات تشخيصية
console.log('adminController.updateAdminProfile:', typeof adminController.updateAdminProfile);
console.log('adminController.getAdminProfile:', typeof adminController.getAdminProfile);
console.log('adminController.changePassword:', typeof adminController.changePassword);
console.log('adminController.getUsers:', typeof adminController.getUsers);
console.log('Validators.changeAdminPasswordSchema:', typeof Validators.changeAdminPasswordSchema);
console.log('Validators.updateProfileSchema:', typeof Validators.updateProfileSchema);
console.log('Validators.changePasswordSchema:', typeof Validators.changePasswordSchema);
console.log('Validators.getUsersSchema:', typeof Validators.getUsersSchema);

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Admin Dashboard
 *   description: Admin dashboard management endpoints
 */

/**
 * @swagger
 * /api/admin/login:
 *   post:
 *     summary: Admin login
 *     tags: [Admin Dashboard]
 *     description: Login for admin and superadmin users
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
 *                 description: Admin email
 *               password:
 *                 type: string
 *                 description: Admin password
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', isValidation(Validators.adminLoginSchema), adminController.adminLogin);

/**
 * @swagger
 * /api/admin/admins:
 *   get:
 *     summary: Get all admins
 *     tags: [Admin Dashboard]
 *     description: Get list of all admin users (SuperAdmin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, superadmin]
 *     responses:
 *       200:
 *         description: Admins retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.get('/admins', 
  authenticate, 
  isAuthorized('superadmin'), 
  isValidation(Validators.getAdminsSchema), 
  adminController.getAdmins
);

/**
 * @swagger
 * /api/admin/admins/{id}:
 *   get:
 *     summary: Get admin by ID
 *     tags: [Admin Dashboard]
 *     description: Get detailed information about a specific admin (Admin & SuperAdmin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Admin ID
 *         example: "507f1f77bcf86cd799439011"
 *     responses:
 *       200:
 *         description: Admin retrieved successfully
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
 *                   example: "تم جلب بيانات الأدمن بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     displayName:
 *                       type: string
 *                       example: "أحمد محمد"
 *                     email:
 *                       type: string
 *                       example: "ahmed@example.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     profileImage:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: "https://res.cloudinary.com/example/image/upload/v1234567890/admin-profile.jpg"
 *                         id:
 *                           type: string
 *                           example: "arthub/admin-profiles/admin_1234567890_abc123"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *                     lastActive:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid admin ID
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin & SuperAdmin only
 *       404:
 *         description: Admin not found
 */
router.get('/admins/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'), 
  adminController.getAdminById
);

/**
 * @swagger
 * /api/admin/overview:
 *   get:
 *     summary: Get admin dashboard overview with latest orders
 *     tags: [Admin Dashboard]
 *     description: Get overview of admin dashboard with latest orders and statistics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Overview retrieved successfully
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
 *                   example: "تم جلب نظرة عامة للوحة التحكم بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     overview:
 *                       type: object
 *                       properties:
 *                         latestOrders:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "507f1f77bcf86cd799439011"
 *                               title:
 *                                 type: string
 *                                 example: "لوحة زيتية مخصصة"
 *                               artist:
 *                                 type: object
 *                                 properties:
 *                                   name:
 *                                     type: string
 *                                     example: "احمد محمد"
 *                                   id:
 *                                     type: string
 *                                     example: "507f1f77bcf86cd799439012"
 *                               date:
 *                                 type: string
 *                                 example: "١٨ - ١ - ٢٠٢٥"
 *                               price:
 *                                 type: string
 *                                 example: "٨٥٠"
 *                               currency:
 *                                 type: string
 *                                 example: "SAR"
 *                               status:
 *                                 type: object
 *                                 properties:
 *                                   en:
 *                                     type: string
 *                                     example: "completed"
 *                                   ar:
 *                                     type: string
 *                                     example: "مكتمل"
 *                                   color:
 *                                     type: string
 *                                     example: "green"
 *                               requestType:
 *                                 type: string
 *                                 example: "custom_artwork"
 *                               description:
 *                                 type: string
 *                                 example: "طلب لوحة زيتية مخصصة"
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             totalUsers:
 *                               type: number
 *                               example: 12847
 *                             totalArtists:
 *                               type: number
 *                               example: 3429
 *                             totalOrders:
 *                               type: number
 *                               example: 1243
 *                             totalRevenue:
 *                               type: number
 *                               example: 1545118
 *                             activeUsers:
 *                               type: number
 *                               example: 10234
 *                             completedOrders:
 *                               type: number
 *                               example: 856
 *                     currency:
 *                       type: string
 *                       example: "SAR"
 *                     lastUpdated:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin & SuperAdmin only
 */
router.get('/overview',
  authenticate,
  isAuthorized('admin', 'superadmin'), 
  adminController.getAdminOverview
);

/**
 * @swagger
 * /api/admin/admins:
 *   post:
 *     summary: Create new admin
 *     tags: [Admin Dashboard]
 *     description: Create a new admin user with optional profile image upload (SuperAdmin only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: "newadmin@example.com"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Admin password
 *                 example: "Password123!"
 *               displayName:
 *                 type: string
 *                 description: Admin display name
 *                 example: "أحمد محمد"
 *               role:
 *                 type: string
 *                 enum: [admin, superadmin]
 *                 default: admin
 *                 description: Admin role
 *                 example: "admin"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG) - optional
 *     responses:
 *       201:
 *         description: Admin created successfully
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
 *                   example: "تم إنشاء الأدمن بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     displayName:
 *                       type: string
 *                       example: "أحمد محمد"
 *                     email:
 *                       type: string
 *                       example: "newadmin@example.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     profileImage:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           example: "https://res.cloudinary.com/example/image/upload/v1234567890/admin-profile.jpg"
 *                         id:
 *                           type: string
 *                           example: "arthub/admin-profiles/admin_1234567890_abc123"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid data, email already exists, or image upload failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.post('/admins', 
  authenticate, 
  isAuthorized('superadmin'), 
  fileUpload(filterObject.image).single('profileImage'),
  isValidation(Validators.createAdminSchema), 
  adminController.createAdmin
);



/**
 * @swagger
 * /api/admin/admins/{id}:
 *   put:
 *     summary: Update admin
 *     tags: [Admin Dashboard]
 *     description: Update admin information including profile image file upload and password (SuperAdmin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Admin ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 description: Admin display name
 *                 example: "أحمد محمد"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: "ahmed@example.com"
 *               role:
 *                 type: string
 *                 enum: [admin, superadmin]
 *                 description: Admin role
 *                 example: "admin"
 *               isActive:
 *                 type: boolean
 *                 description: Admin active status
 *                 example: true
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG)
 *                 example: "image file"
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: New password (will be hashed automatically)
 *                 example: "NewPassword123!"
 *     responses:
 *       200:
 *         description: Admin updated successfully
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
 *                   example: "تم تحديث الأدمن بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     displayName:
 *                       type: string
 *                       example: "أحمد محمد"
 *                     email:
 *                       type: string
 *                       example: "ahmed@example.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     profileImage:
 *                       type: string
 *                       example: "https://example.com/profile.jpg"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid data or email already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 *       404:
 *         description: Admin not found
 */
router.put('/admins/:id', 
  authenticate, 
  isAuthorized('superadmin'), 
  fileUpload(filterObject.image).single('profileImage'),
  isValidation(Validators.updateAdminSchema), 
  adminController.updateAdmin
);

/**
 * @swagger
 * /api/admin/admins/{id}:
 *   delete:
 *     summary: Delete admin
 *     tags: [Admin Dashboard]
 *     description: Soft delete admin (SuperAdmin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Admin deleted successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 *       404:
 *         description: Admin not found
 */
router.delete('/admins/:id', 
  authenticate, 
  isAuthorized('superadmin'), 
  adminController.deleteAdmin
);

/**
 * @swagger
 * /api/admin/admins/{id}/change-password:
 *   put:
 *     summary: Change admin password
 *     tags: [Admin Dashboard]
 *     description: Change admin password (SuperAdmin only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 *       404:
 *         description: Admin not found
 */
router.put('/admins/:id/change-password', 
  authenticate, 
  isAuthorized('superadmin'), 
  isValidation(Validators.changeAdminPasswordSchema), 
  adminController.changeAdminPassword
);

/**
 * @swagger
 * /api/admin/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admin Dashboard]
 *     description: Get current admin profile information
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  adminController.getAdminProfile
);

/**
 * @swagger
 * /api/admin/profile:
 *   put:
 *     summary: Update admin profile
 *     tags: [Admin Dashboard]
 *     description: Update current admin profile information including profile image
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               displayName:
 *                 type: string
 *                 description: Admin display name
 *                 example: "أحمد محمد"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email address
 *                 example: "admin@example.com"
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: Profile image file (JPEG, PNG, JPG, GIF, WEBP - max 5MB)
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
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     email:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     role:
 *                       type: string
 *                     profileImage:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                         id:
 *                           type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Bad request - validation error or email already exists
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Admin not found
 *       500:
 *         description: Internal server error
 */
router.put('/profile', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  fileUpload(filterObject.image).single('profileImage'),
  isValidation(Validators.updateProfileSchema), 
  adminController.updateAdminProfile
);

/**
 * @swagger
 * /api/admin/change-password:
 *   put:
 *     summary: Change own password
 *     tags: [Admin Dashboard]
 *     description: Change current admin password
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/change-password', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.changePasswordSchema), 
  adminController.changePassword
);

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (clients and artists)
 *     tags: [Admin Dashboard]
 *     description: Get all users with pagination - 10 users per page by default. Use limit=full to get all users without pagination
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *           minimum: 1
 *         description: Page number (ignored when limit=full)
 *       - in: query
 *         name: limit
 *         schema:
 *           oneOf:
 *             - type: integer
 *               minimum: 1
 *               maximum: 100
 *               default: 10
 *             - type: string
 *               enum: [full]
 *         description: Number of users per page or 'full' to get all users
 *         example: 10
 *     responses:
 *       200:
 *         description: Users retrieved successfully
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
 *                   example: "تم جلب قائمة المستخدمين بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439011"
 *                           displayName:
 *                             type: string
 *                             example: "عمر خالد محمد"
 *                           email:
 *                             type: string
 *                             example: "omar.2004@gmail.com"
 *                           phoneNumber:
 *                             type: string
 *                             example: "+201140067845"
 *                           role:
 *                             type: string
 *                             enum: [user, artist]
 *                             example: "user"
 *                           isActive:
 *                             type: boolean
 *                             example: true
 *                           isVerified:
 *                             type: boolean
 *                             example: true
 *                           profileImage:
 *                             type: object
 *                             properties:
 *                               url:
 *                                 type: string
 *                               id:
 *                                 type: string
 *                           lastActive:
 *                             type: string
 *                             format: date-time
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                           job:
 *                             type: string
 *                             example: "طالب"
 *                           location:
 *                             type: string
 *                             example: "القاهرة, مصر"
 *                           bio:
 *                             type: string
 *                             example: "مستخدم نشط"
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalUsers:
 *                           type: number
 *                           example: 150
 *                         activeUsers:
 *                           type: number
 *                           example: 120
 *                         bannedUsers:
 *                           type: number
 *                           example: 5
 *                         clients:
 *                           type: number
 *                           example: 100
 *                         artists:
 *                           type: number
 *                           example: 50
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 10
 *                         total:
 *                           type: number
 *                           example: 150
 *                         pages:
 *                           type: number
 *                           example: 15
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/users', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getUsersSchema), 
  adminController.getUsers
);

/**
 * @swagger
 * /api/admin/users/export:
 *   get:
 *     summary: Export users data
 *     tags: [Admin Dashboard]
 *     description: Export all users data to Excel format with beautiful design
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [excel, json]
 *           default: excel
 *         description: صيغة التصدير (Excel أو JSON)
 *     responses:
 *       200:
 *         description: Users data exported successfully
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *             description: ملف Excel جميل مع ألوان التطبيق
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم تصدير بيانات المستخدمين بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                     totalUsers:
 *                       type: number
 *                       example: 82
 *                     exportedAt:
 *                       type: string
 *                       format: date-time
 *    401:
 *       description: Unauthorized
 *    403:
 *       description: Forbidden - Admin only
 *    500:
 *       description: Error generating Excel file
 */
router.get('/users/export', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.exportUsersSchema), 
  adminController.exportUsers
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get regular user details (not artists)
 *     tags: [Admin Dashboard]
 *     description: Get detailed information about a specific regular user (role: user) including statistics and overview. This endpoint is for regular users only, not artists.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details retrieved successfully
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
 *                   example: "تم جلب تفاصيل المستخدم بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     displayName:
 *                       type: string
 *                       example: "عمر خالد محمد"
 *                     email:
 *                       type: string
 *                       example: "omar.2004@gmail.com"
 *                     phoneNumber:
 *                       type: string
 *                       example: "+201140067845"
 *                     role:
 *                       type: string
 *                       example: "user"
 *                     isActive:
 *                       type: boolean
 *                       example: true
 *                     isVerified:
 *                       type: boolean
 *                       example: true
 *                     profileImage:
 *                       type: string
 *                       example: "https://example.com/profile.jpg"
 *                     coverImages:
 *                       type: array
 *                       items:
 *                         type: string
 *                     bio:
 *                       type: string
 *                       example: "نبذة عن المستخدم"
 *                     job:
 *                       type: string
 *                       example: "مهندس"
 *                     location:
 *                       type: string
 *                       example: "القاهرة, مصر"
 *                     lastActive:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T10:30:00.000Z"
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2023-01-15T10:30:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-15T10:30:00.000Z"
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         totalOrders:
 *                           type: number
 *                           example: 12
 *                         totalSpent:
 *                           type: number
 *                           example: 2450
 *                         totalReviews:
 *                           type: number
 *                           example: 8
 *                         averageRating:
 *                           type: number
 *                           example: 4.8
 *                     latestOrders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "507f1f77bcf86cd799439012"
 *                           title:
 *                             type: string
 *                             example: "لوحة زيتية مخصصة"
 *                           description:
 *                             type: string
 *                             example: "وصف الطلب"
 *                           price:
 *                             type: number
 *                             example: 850
 *                           status:
 *                             type: string
 *                             enum: [pending, accepted, rejected, completed, cancelled]
 *                             example: "completed"
 *                           artist:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "507f1f77bcf86cd799439013"
 *                               displayName:
 *                                 type: string
 *                                 example: "أحمد محمد"
 *                               profileImage:
 *                                 type: string
 *                                 example: "https://example.com/artist.jpg"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-18T10:30:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             example: "2025-01-18T10:30:00.000Z"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */
router.get('/users/:id', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getUserDetailsSchema), 
  adminController.getUserDetails
);

/**
 * @swagger
 * /api/admin/users/{id}/block:
 *   patch:
 *     summary: Block/Unblock user
 *     tags: [Admin Dashboard]
 *     description: Block or unblock a user account
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *             properties:
 *               action:
 *                 type: string
 *                 enum:block, unblock]
 *                 description: Action to perform
 *               reason:
 *                 type: string
 *                 description: Reason for blocking (optional)
 *     responses:
 *    200       description: User status updated successfully
 *    401       description: Unauthorized
 *    403       description: Forbidden - Admin only
 *    404       description: User not found
 */
router.delete('/users/:id/block', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.blockUserSchema), 
  adminController.blockUser
);

/**
 * @swagger
 * /api/admin/users/{id}/send-message:
 *   post:
 *     summary: Send message to user with attachments
 *     tags: [Admin Dashboard]
 *     description: Send a message to a specific user with file attachments and create system notification
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - message
 *             properties:
 *               subject:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *                 description: Message subject
 *                 example: "رسالة ترحيب من إدارة المنصة"
 *               message:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 2000
 *                 description: Message content
 *                 example: "مرحباً! نود أن نرحب بك في منصة ArtHub ونشكرك على انضمامك إلينا. نتمنى لك تجربة ممتعة معنا!"
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: File attachments (images, videos, documents, etc.)
 *                 example: ["image1.jpg", "document.pdf", "video.mp4"]
 *     responses:
 *       200:
 *         description: Message sent successfully
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
 *                   example: "تم إرسال الرسالة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439011"
 *                     userName:
 *                       type: string
 *                       example: "عمر خالد محمد"
 *                     notificationId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439012"
 *                     messageType:
 *                       type: string
 *                       example: "system_notification"
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-01-18T10:30:00.000Z"
 *                     attachmentsCount:
 *                       type: number
 *                       example: 3
 *                     attachments:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           originalName:
 *                             type: string
 *                             example: "document.pdf"
 *                           url:
 *                             type: string
 *                             example: "https://res.cloudinary.com/example/document.pdf"
 *                           format:
 *                             type: string
 *                             example: "pdf"
 *                           size:
 *                             type: number
 *                             example: 1024000
 *                           type:
 *                             type: string
 *                             example: "application/pdf"
 *                     notification:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "507f1f77bcf86cd799439012"
 *                         title:
 *                           type: string
 *                           example: "رسالة ترحيب من إدارة المنصة"
 *                         message:
 *                           type: string
 *                           example: "مرحباً! نود أن نرحب بك في منصة ArtHub..."
 *                         type:
 *                           type: string
 *                           example: "system"
 *                         data:
 *                           type: object
 *                           properties:
 *                             adminName:
 *                               type: string
 *                               example: "أحمد محمد"
 *                             adminRole:
 *                               type: string
 *                               example: "admin"
 *                             messageType:
 *                               type: string
 *                               example: "admin_message"
 *                             platformLogo:
 *                               type: string
 *                               example: "https://res.cloudinary.com/dz5dpvxg7/image/upload/v1691521498/arthub/logo/art-hub-logo.png"
 *                             attachments:
 *                               type: array
 *                               items:
 *                                 type: object
 *                             sentAt:
 *                               type: string
 *                               format: date-time
 *                               example: "2025-01-18T10:30:00.000Z"
 *       400:
 *         description: Bad request - Invalid data or file upload failed
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
 *                   example: "موضوع الرسالة مطلوب"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */
router.post('/users/:id/send-message', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  fileUpload([
    ...filterObject.image, 
    ...filterObject.document, 
    ...filterObject.video, 
    ...filterObject.audio, 
    ...filterObject.archive, 
    ...filterObject.code
  ]).array('attachments', 10),
  isValidation(Validators.sendMessageSchema), 
  adminController.sendMessageToUser
);

/**
 * @swagger
 * /api/admin/users/{id}/orders:
 *   get:
 *     summary: Get user orders
 *     tags: [Admin Dashboard]
 *     description: Get all orders for a specific user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default:20       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: pending, accepted, rejected, completed, cancelled]
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, updatedAt, price]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *    200       description: User orders retrieved successfully
 *    401       description: Unauthorized
 *    403       description: Forbidden - Admin only
 *    404       description: User not found
 */
router.get('/users/:id/orders', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getUserOrdersSchema), 
  adminController.getUserOrders
);

/**
 * @swagger
 * /api/admin/users/{id}/reviews:
 *   get:
 *     summary: Get user reviews
 *     tags: [Admin Dashboard]
 *     description: Get all reviews by a specific user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default:20       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, rating]
 *           default: createdAt
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *    200       description: User reviews retrieved successfully
 *    401       description: Unauthorized
 *    403       description: Forbidden - Admin only
 *    404       description: User not found
 */
router.get('/users/:id/reviews', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getUserReviewsSchema), 
  adminController.getUserReviews
);

/**
 * @swagger
 * /api/admin/users/{id}/activity:
 *   get:
 *     summary: Get user activity log
 *     tags: [Admin Dashboard]
 *     description: Get activity log for a specific user (limit fixed at 10 items per page)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *           default: 10
 *           enum: [10]
 *         description: Number of items per page (fixed at 10)
 *     responses:
 *       200:
 *         description: User activity log retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: User not found
 */


router.get('/users/:id/activity', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getUserActivitySchema), 
  adminController.getUserActivity
);

/**
 * @swagger
 * /api/admin/artists:
 *   get:
 *     summary: Get all artists for admin dashboard
 *     tags: [Admin Dashboard]
 *     description: Get list of all artists with their statistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
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
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned]
 *         description: Filter by status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, displayName, artworksCount, totalSales]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Artists retrieved successfully
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
 *                   example: "تم جلب قائمة الفنانين بنجاح"
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
 *                           email:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                           location:
 *                             type: string
 *                           isActive:
 *                             type: boolean
 *                           isVerified:
 *                             type: boolean
 *                           joinDate:
 *                             type: string
 *                             format: date-time
 *                           stats:
 *                             type: object
 *                             properties:
 *                               artworksCount:
 *                                 type: number
 *                               totalSales:
 *                                 type: number
 *                               avgRating:
 *                                 type: number
 *                               reviewsCount:
 *                                 type: number
 *                               reportsCount:
 *                                 type: number
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get('/artists', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getAllArtistsSchema),
  adminController.getAllArtists
);

/**
 * @swagger
 * /api/admin/artists/{artistId}:
 *   get:
 *     summary: Get artist details for admin dashboard
 *     tags: [Admin Dashboard]
 *     description: Get detailed information about a specific artist including statistics, artworks, reports, reviews, and activity
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for artworks
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page for artworks
 *     responses:
 *       200:
 *         description: Artist details retrieved successfully
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
 *                         bio:
 *                           type: string
 *                         profileImage:
 *                           type: string
 *                         location:
 *                           type: string
 *                         joinDate:
 *                           type: string
 *                           format: date-time
 *                         isActive:
 *                           type: boolean
 *                         isVerified:
 *                           type: boolean
 *                         socialMedia:
 *                           type: object
 *                     stats:
 *                       type: object
 *                       properties:
 *                         artworksCount:
 *                           type: number
 *                         totalSales:
 *                           type: number
 *                         completedOrders:
 *                           type: number
 *                         avgRating:
 *                           type: number
 *                         reviewsCount:
 *                           type: number
 *                         reportsCount:
 *                           type: number
 *                         followersCount:
 *                           type: number
 *                     artworks:
 *                       type: object
 *                       properties:
 *                         items:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               _id:
 *                                 type: string
 *                               title:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               status:
 *                                 type: string
 *                               images:
 *                                 type: array
 *                               category:
 *                                 type: object
 *                               createdAt:
 *                                 type: string
 *                                 format: date-time
 *                         pagination:
 *                           $ref: '#/components/schemas/PaginationMeta'
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           reporter:
 *                             type: object
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *                           status:
 *                             type: string
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
 *                           reviewer:
 *                             type: object
 *                           artwork:
 *                             type: object
 *                           rating:
 *                             type: number
 *                           comment:
 *                             type: string
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
 *                           icon:
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
 *       400:
 *         description: Invalid artist ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Artist not found
 */
router.get('/artists/:artistId', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getArtistDetailsSchema),
  adminController.getArtistDetails
);

/**
 * @swagger
 * /api/admin/artists/{artistId}/info:
 *   get:
 *     summary: Get artist basic info and stats
 *     tags: [Admin Dashboard]
 *     description: Get artist basic information and statistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
 *     responses:
 *       200:
 *         description: Artist info retrieved successfully
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
 *                   example: "تم جلب معلومات الفنان بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artist:
 *                       $ref: '#/components/schemas/Artist'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         artworksCount:
 *                           type: integer
 *                           example: 15
 *                         totalSales:
 *                           type: number
 *                           example: 2500.50
 *                         completedOrders:
 *                           type: integer
 *                           example: 8
 *                         avgRating:
 *                           type: number
 *                           example: 4.5
 *                         reviewsCount:
 *                           type: integer
 *                           example: 12
 *                         reportsCount:
 *                           type: integer
 *                           example: 2
 *                         followersCount:
 *                           type: integer
 *                           example: 150
 *       400:
 *         description: Invalid artist ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Artist not found
 */
router.get('/artists/:artistId/info',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  adminController.getArtistInfo
);

/**
 * @swagger
 * /api/admin/artists/{artistId}/artworks:
 *   get:
 *     summary: Get artist artworks
 *     tags: [Admin Dashboard]
 *     description: Get artist artworks with pagination
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
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
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Artist artworks retrieved successfully
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
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid artist ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Artist not found
 */
router.get('/artists/:artistId/artworks',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  adminController.getArtistArtworks
);

/**
 * @swagger
 * /api/admin/artists/{artistId}/reports:
 *   get:
 *     summary: Get artist reports
 *     tags: [Admin Dashboard]
 *     description: Get reports filed against the artist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
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
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Artist reports retrieved successfully
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
 *                   example: "تم جلب بلاغات الفنان بنجاح"
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
 *                         $ref: '#/components/schemas/Report'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid artist ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Artist not found
 */
router.get('/artists/:artistId/reports',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  adminController.getArtistReports
);

/**
 * @swagger
 * /api/admin/artists/{artistId}/reviews:
 *   get:
 *     summary: Get artist reviews
 *     tags: [Admin Dashboard]
 *     description: Get reviews for the artist
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
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
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Artist reviews retrieved successfully
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
 *                   example: "تم جلب تقييمات الفنان بنجاح"
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
 *                         $ref: '#/components/schemas/Review'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 *       400:
 *         description: Invalid artist ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Artist not found
 */
router.get('/artists/:artistId/reviews',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  adminController.getArtistReviews
);

/**
 * @swagger
 * /api/admin/artists/{artistId}/activity:
 *   get:
 *     summary: Get artist activity log
 *     tags: [Admin Dashboard]
 *     description: Get artist activity log (logins, requests, reviews)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
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
 *           default: 20
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Artist activity retrieved successfully
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
 *                   example: "تم جلب سجل نشاط الفنان بنجاح"
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
 *                           type:
 *                             type: string
 *                             enum: [login, request, review]
 *                           icon:
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
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                           description: Current page number
 *                         limit:
 *                           type: integer
 *                           description: Number of items per page
 *                         total:
 *                           type: integer
 *                           description: Total number of activities
 *                         pages:
 *                           type: integer
 *                           description: Total number of pages
 *       400:
 *         description: Invalid artist ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Artist not found
 */
router.get('/artists/:artistId/activity',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  adminController.getArtistActivity
);

/**
 * @swagger
 * /api/admin/artists/{artistId}/status:
 *   patch:
 *     summary: Update artist status
 *     tags: [Admin Dashboard]
 *     description: Update artist status (activate/deactivate/ban)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artist ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *                 description: New status for the artist
 *               reason:
 *                 type: string
 *                 description: Reason for ban (required if status is banned)
 *     responses:
 *       200:
 *         description: Artist status updated successfully
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
 *                   example: "تم تحديث حالة الفنان بنجاح إلى active"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     displayName:
 *                       type: string
 *                     isActive:
 *                       type: boolean
 *                     isBanned:
 *                       type: boolean
 *                     banReason:
 *                       type: string
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid status or artist ID
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Artist not found
 */
router.patch('/artists/:artistId/status', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.updateArtistStatusSchema),
  adminController.updateArtistStatus
);

// إضافة مسارات إدارة الطلبات
router.use('/', orderManagementRouter);

// إضافة مسارات إدارة التقييمات
router.use('/reviews', reviewsManagementRouter);

// إضافة مسارات إدارة البلاغات
router.use('/reports', reportsManagementRouter);

export default router; 