import { Router } from 'express';
import * as controller from './follow.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
const router = Router();

router.post('/follow', isAuthenticated, controller.followArtist);
router.post('/unfollow', isAuthenticated, controller.unfollowArtist);
router.get('/followers/:artistId', controller.getFollowers);
router.get('/following/:userId', controller.getFollowing);

export default router; 