import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import * as dashboardController from './dashboard.controller.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as dashboardValidation from './dashboard.validation.js';

const router = Router();

// Dashboard Statistics Routes
router.get(
  '/statistics',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  dashboardController.getDashboardStatistics
);

router.get(
  '/charts',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(dashboardValidation.getChartsValidation),
  dashboardController.getDashboardCharts
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