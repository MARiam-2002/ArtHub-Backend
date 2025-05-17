
import { Router } from 'express';
import { getHomeData, search } from './home.controller.js';
const router = Router();

/**
 * @swagger
 * /api/home:
 *   get:
 *     tags:
 *       - Home
 *     summary: Get home page data
 *     description: Retrieve data for the home page including featured artworks, artists, and categories
 *     responses:
 *       200:
 *         description: Home page data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     featuredArtworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     featuredArtists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     categories:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Category'
 *                     banners:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Banner'
 */
router.get('/', getHomeData);

/**
 * @swagger
 * /api/home/search:
 *   get:
 *     tags:
 *       - Home
 *     summary: Search artworks, artists and images
 *     description: Search for artworks, artists and images by query term with filters
 *     parameters:
 *       - name: q
 *         in: query
 *         schema:
 *           type: string
 *         description: Search query
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, artworks, artists, images]
 *           default: all
 *         description: Type of results to return
 *       - name: category
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - name: price_min
 *         in: query
 *         schema:
 *           type: number
 *         description: Minimum price (for artworks)
 *       - name: price_max
 *         in: query
 *         schema:
 *           type: number
 *         description: Maximum price (for artworks)
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     artists:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *                     images:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Image'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/search', search);

/**
 * @swagger
 * /api/home/trending:
 *   get:
 *     tags:
 *       - Home
 *     summary: Get trending content
 *     description: Retrieve trending artworks, artists, and images
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [all, artworks, artists, images]
 *           default: all
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending content retrieved successfully
 */
router.get('/trending', getTrendingContent);

/**
 * @swagger
 * /api/home/explore:
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
