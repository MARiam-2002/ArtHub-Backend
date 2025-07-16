import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as dashboardValidation from './dashboard.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Admin dashboard endpoints
 */

/**
 * @swagger
 * /api/v1/dashboard/overview:
 *   get:
 *     summary: Get system overview with all key metrics
 *     tags: [Dashboard]
 *     description: Get comprehensive system overview including users, revenue, artworks, and other metrics
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: System overview retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/SuperAdmin only
 */
router.get(
  '/overview',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getSystemOverview
);

/**
 * @swagger
 * /api/v1/dashboard/statistics:
 *   get:
 *     summary: Get dashboard main statistics
 *     tags: [Dashboard]
 *     description: Get main dashboard statistics including users, revenue, artworks, orders, reviews, and reports
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/SuperAdmin only
 */
router.get(
  '/statistics',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getDashboardStatistics
);

/**
 * @swagger
 * /api/v1/dashboard/revenue:
 *   get:
 *     summary: Get revenue statistics with comparison
 *     tags: [Dashboard]
 *     description: Get detailed revenue statistics with period comparison
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Period for revenue comparison
 *     responses:
 *       200:
 *         description: Revenue statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/SuperAdmin only
 */
router.get(
  '/revenue',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getRevenueStatistics
);

/**
 * @swagger
 * /api/v1/dashboard/orders/statistics:
 *   get:
 *     summary: Get order statistics with detailed breakdown
 *     tags: [Dashboard]
 *     description: Get detailed order statistics including status breakdown and trends
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/SuperAdmin only
 */
router.get(
  '/orders/statistics',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getOrderStatistics
);

/**
 * @swagger
 * /api/v1/dashboard/charts:
 *   get:
 *     summary: Get dashboard charts data
 *     tags: [Dashboard]
 *     description: Get charts data for orders and revenue statistics
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: monthly
 *         description: Period for charts data
 *     responses:
 *       200:
 *         description: Charts data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/SuperAdmin only
 */
router.get(
  '/charts',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getChartsValidation),
  dashboardController.getDashboardCharts
);

/**
 * @swagger
 * /api/v1/dashboard/artists/performance:
 *   get:
 *     summary: Get top performing artists with detailed metrics
 *     tags: [Dashboard]
 *     description: Get detailed performance metrics for top artists
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of artists to return
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *           default: monthly
 *         description: Period for performance calculation
 *     responses:
 *       200:
 *         description: Artists performance data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin/SuperAdmin only
 */
router.get(
  '/artists/performance',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getArtistsPerformance
);

// User Management Routes
router.get(
  '/users',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getUsersValidation),
  dashboardController.getUsers
);

router.get(
  '/users/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getUserByIdValidation),
  dashboardController.getUserById
);

router.patch(
  '/users/:id/status',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.updateUserStatusValidation),
  dashboardController.updateUserStatus
);

// Orders Management Routes
router.get(
  '/orders',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getOrdersValidation),
  dashboardController.getOrders
);

router.get(
  '/orders/:id',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getOrderByIdValidation),
  dashboardController.getOrderById
);

// Reviews Management Routes
router.get(
  '/reviews',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getReviewsValidation),
  dashboardController.getReviews
);

router.patch(
  '/reviews/:id/status',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.updateReviewStatusValidation),
  dashboardController.updateReviewStatus
);

// Notifications Management Routes
router.post(
  '/notifications',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.sendNotificationValidation),
  dashboardController.sendNotification
);

// Artists Management Routes
router.get(
  '/artists/top',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getTopArtistsValidation),
  dashboardController.getTopArtists
);

// Activities Routes
router.get(
  '/activities',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getRecentActivitiesValidation),
  dashboardController.getRecentActivities
);

// Legacy route for backward compatibility
router.get(
  '/',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getDashboardStatistics
);

export default router; 