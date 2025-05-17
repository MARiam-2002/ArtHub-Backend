import { Router } from 'express';
import * as controller from './user.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
const router = Router();

router.post('/wishlist/toggle', isAuthenticated, controller.toggleWishlist);
router.get('/wishlist', isAuthenticated, controller.getWishlist);
router.put('/profile', isAuthenticated, controller.updateProfile);
router.patch('/change-password', isAuthenticated, controller.changePassword);
router.get('/artist-profile/:artistId', controller.getArtistProfile);
router.get('/profile/:artistId', controller.getArtistProfile);

export default router; 