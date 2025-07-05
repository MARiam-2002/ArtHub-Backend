import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { isAuthorized } from '../../middleware/authorization.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './admin.validation.js';

const router = Router();

// Get all users (for admins)
router.get(
  '/users',
  authenticate,
  isAuthorized('admin', 'superadmin'),
  isValidation(Validators.getUsersSchema),
  adminController.getUsers
);

export default router; 