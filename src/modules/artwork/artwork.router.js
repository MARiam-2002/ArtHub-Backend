import { Router } from 'express';
import { getAllArtworks, getArtworkById, createArtwork, updateArtwork, deleteArtwork } from './controller/artwork.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { createArtworkSchema, updateArtworkSchema } from './artwork.validation.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as reviewController from '../../modules/review/review.controller.js';

const router = Router();

router.get('/', getAllArtworks);
router.get('/:id', getArtworkById);
router.post('/', isAuthenticated, isValidation(createArtworkSchema), createArtwork);
router.put('/:id', isAuthenticated, isValidation(updateArtworkSchema), updateArtwork);
router.delete('/:id', isAuthenticated, deleteArtwork);

router.get('/artist/:artistId', async (req, res, next) => {
  try {
    const artworks = await getAllArtworksByArtist(req.params.artistId);
    res.json({ success: true, data: artworks });
  } catch (err) { next(err); }
});

router.get('/category/:categoryId', async (req, res, next) => {
  try {
    const artworks = await getAllArtworksByCategory(req.params.categoryId);
    res.json({ success: true, data: artworks });
  } catch (err) { next(err); }
});

router.get('/:id/reviews', reviewController.getArtworkReviewsWithStats);

export default router; 