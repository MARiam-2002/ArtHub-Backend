import { Router } from 'express';
import * as homeController from './home.controller.js';
import { optionalAuth } from '../../middleware/auth.middleware.js';
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
