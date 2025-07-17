import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './admin.validation.js';
import orderManagementRouter from './order-management.router.js';
import reviewsManagementRouter from './reviews-management.router.js';

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
 * /api/admin/admins:
 *   post:
 *     summary: Create new admin
 *     tags: [Admin Dashboard]
 *     description: Create a new admin user (SuperAdmin only)
 *     security:
 *       - BearerAuth: []
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
 *                 minLength: 8
 *               displayName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, superadmin]
 *                 default: admin
 *     responses:
 *       201:
 *         description: Admin created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - SuperAdmin only
 */
router.post('/admins', 
  authenticate, 
  isAuthorized('superadmin'), 
  isValidation(Validators.createAdminSchema), 
  adminController.createAdmin
);

/**
 * @swagger
 * /api/admin/admins/{id}:
 *   put:
 *     summary: Update admin
 *     tags: [Admin Dashboard]
 *     description: Update admin information (SuperAdmin only)
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
 *             properties:
 *               displayName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [active, inactive, banned]
 *               isActive:
 *                 type: boolean
 *               role:
 *                 type: string
 *                 enum: [admin, superadmin]
 *     responses:
 *       200:
 *         description: Admin updated successfully
 *       400:
 *         description: Bad request
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
 *     description: Update current admin profile information
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
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
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
 *     description: Get paginated list of all users with filtering and search
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
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name, email, or phone
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, artist]
 *         description: Filter by user role
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned]
 *         description: Filter by user status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, displayName, email, lastLogin]
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
 *    200       description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: #/components/schemas/UserForAdmin'
 *                     pagination:
 *                       $ref: #/components/schemas/PaginationResponse'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     bannedUsers:
 *                       type: number
 *    401       description: Unauthorized
 *    403       description: Forbidden - Admin only
 */
router.get('/users', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getUsersSchema), 
  adminController.getUsers
);

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details with overview
 *     tags: [Admin Dashboard]
 *     description: Get detailed information about a specific user including latest orders, statistics, and overview
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
router.patch('/users/:id/block', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.blockUserSchema), 
  adminController.blockUser
);

/**
 * @swagger
 * /api/admin/users/{id}/send-message:
 *   post:
 *     summary: Send message to user
 *     tags: [Admin Dashboard]
 *     description: Send a message to a specific user (via email or chat)
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
 *               - subject
 *               - message
 *               - deliveryMethod
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Message subject
 *               message:
 *                 type: string
 *                 description: Message content
 *               deliveryMethod:
 *                 type: string
 *                 enum: [email, chat, both]
 *                 description: How to deliver the message
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: File URLs to attach
 *     responses:
 *    200       description: Message sent successfully
 *    401       description: Unauthorized
 *    403       description: Forbidden - Admin only
 *    404       description: User not found
 */
router.post('/users/:id/send-message', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
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
 *     description: Get activity log for a specific user
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
 *         name: activityType
 *         schema:
 *           type: string
 *           enum: [login, order, review, profile_update, artwork_view]
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *    200       description: User activity log retrieved successfully
 *    401       description: Unauthorized
 *    403       description: Forbidden - Admin only
 *    404       description: User not found
 */
router.get('/users/:id/activity', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.getUserActivitySchema), 
  adminController.getUserActivity
);

/**
 * @swagger
 * /api/admin/users/export:
 *   get:
 *     summary: Export users data
 *     tags: [Admin Dashboard]
 *     description: Export users data to CSV/Excel format
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, excel]
 *           default: csv
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, artist, all]
 *           default: all
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, banned, all]
 *           default: all
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *    200       description: Users data exported successfully
 *         content:
 *           application/csv:
 *             schema:
 *               type: string
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *    401       description: Unauthorized
 *    403       description: Forbidden - Admin only
 */
router.get('/users/export', 
  authenticate, 
  isAuthorized('admin', 'superadmin'), 
  isValidation(Validators.exportUsersSchema), 
  adminController.exportUsers
);

// إضافة مسارات إدارة الطلبات
router.use('/', orderManagementRouter);

// إضافة مسارات إدارة التقييمات
router.use('/reviews', reviewsManagementRouter);

export default router; 