import { Router } from 'express';
import * as controller from './notification.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
const router = Router();

router.get('/', isAuthenticated, controller.getNotifications);
router.patch('/:id/read', isAuthenticated, controller.markAsRead);
router.delete('/:id', isAuthenticated, controller.deleteNotification);

export default router; 