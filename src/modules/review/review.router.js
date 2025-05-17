import { Router } from 'express';
import * as controller from './review.controller.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
const router = Router();

router.post('/artwork', isAuthenticated, controller.addArtworkReview);
router.get('/artwork/:artworkId', controller.getArtworkReviews);
router.post('/artist', isAuthenticated, controller.addArtistReview);
router.get('/artist/:artistId', controller.getArtistReviews);

export default router; 