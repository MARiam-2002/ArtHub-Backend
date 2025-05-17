import { Router } from 'express';
import * as controller from './specialRequest.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
const router = Router();

router.post('/', isAuthenticated, controller.createSpecialRequest);
router.get('/my', isAuthenticated, controller.getUserRequests);
router.get('/artist', isAuthenticated, controller.getArtistRequests);
router.patch('/:requestId/status', isAuthenticated, controller.updateRequestStatus);
router.patch('/:requestId/complete', isAuthenticated, controller.completeRequest);
router.delete('/:requestId', isAuthenticated, controller.deleteRequest);

export default router; 