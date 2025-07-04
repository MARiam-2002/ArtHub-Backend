import { Router } from 'express';
import * as homeController from './home.controller.js';
// Optional auth middleware - allows both authenticated and non-authenticated requests
const optionalAuth = (req, res, next) => {
  // Skip authentication check for home route
  next();
};
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './home.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Home
 *   description: Home screen endpoints for mobile app
 */

/**
 * @swagger
 * /home:
 *   get:
 *     summary: Get home screen data
 *     tags: [Home]
 *     description: Get all data needed for the home screen including categories, featured artists, and artworks
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Home data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم جلب بيانات الصفحة الرئيسية بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     categories:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *                           artworksCount:
 *                             type: number
 *                     featuredArtists:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           displayName:
 *                             type: string
 *                           profileImage:
 *                             type: string
 *                           followersCount:
 *                             type: number
 *                           artworksCount:
 *                             type: number
 *                     featuredArtworks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                           title:
 *                             type: string
 *                           images:
 *                             type: array
 *                           price:
 *                             type: number
 *                           artist:
 *                             type: object
 *                     latestArtworks:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Server error
 */
router.get('/', optionalAuth, homeController.getHomeData);

/**
 * @swagger
 * /home/search:
 *   get:
 *     summary: Search artworks and artists
 *     tags: [Home]
 *     description: Search for artworks and artists
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *         required: true
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [all, artworks, artists]
 *           default: all
 *         description: Search type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.get('/search', homeController.search);

/**
 * @swagger
 * /home/trending:
 *   get:
 *     summary: Get trending artworks
 *     tags: [Home]
 *     description: Get trending artworks based on views and likes
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Trending artworks retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "تم جلب الأعمال الرائجة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ArtworkSummary'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/trending', isValidation(Validators.paginationSchema), homeController.getTrendingArtworks);

/**
 * @swagger
 * /home/explore:
 *   get:
 *     tags:
 *       - Home
 *     summary: Explore content for discovery
 *     description: Get curated content for the explore section
 *     parameters:
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Explore content retrieved successfully
 */
router.get('/explore', getExploreContent);

/**
 * @swagger
 * components:
 *   schemas:
 *     Banner:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         imageUrl:
 *           type: string
 *           format: uri
 *         linkType:
 *           type: string
 *           enum: [artwork, artist, category, external]
 *         linkId:
 *           type: string
 *         externalUrl:
 *           type: string
 *           format: uri
 */

export default router;

function getTrendingContent(req, res) {
  // Implementation will be in the controller file
  // This is just a placeholder for the router
  res.status(501).json({ success: false, message: 'Not implemented yet' });
}

function getExploreContent(req, res) {
  // Implementation will be in the controller file
  // This is just a placeholder for the router
  res.status(501).json({ success: false, message: 'Not implemented yet' });
}
