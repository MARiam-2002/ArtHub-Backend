import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './admin.validation.js';

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

export default router; 