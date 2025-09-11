import { Router } from 'express';
import * as homeController from './home.controller.js';
import { optionalAuth, authenticate } from '../../middleware/auth.middleware.js';
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
 *                           mainImage:
 *                             type: string
 *                           images:
 *                             type: array
 *                           price:
 *                             type: number
 *                           artist:
 *                             type: object
 *                     trendingArtworks:
 *                       type: array
 *                       items:
 *                         type: object
 *                     personalizedArtworks:
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
 *     description: Search for artworks and artists with advanced filtering
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
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price_low, price_high, rating, newest, popular]
 *           default: relevance
 *         description: Sort options
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
router.get('/search', 
  isValidation(Validators.searchQuerySchema, 'query'),
  homeController.search
);

/**
 * @swagger
 * /home/trending:
 *   get:
 *     summary: Get trending artworks
 *     tags: [Home]
 *     description: Get trending artworks for explore section
 *     parameters:
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
 *         description: Trending artworks retrieved successfully
 *       500:
 *         description: Server error
 */
router.get('/trending', homeController.getTrendingArtworks);

/**
 * @swagger
 * /home/artwork/{id}:
 *   get:
 *     summary: Get single artwork details
 *     tags: [Home]
 *     description: Get detailed information about a single artwork
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Artwork ID
 *     responses:
 *       200:
 *         description: Artwork details retrieved successfully
 *       400:
 *         description: Invalid artwork ID
 *       404:
 *         description: Artwork not found
 *       500:
 *         description: Server error
 */
router.get('/artwork/:id', optionalAuth, homeController.getSingleArtwork);

/**
 * @swagger
 * /home/artist/{id}:
 *   get:
 *     summary: Get artist profile
 *     tags: [Home]
 *     description: Get artist profile with their artworks
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Artist ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for artworks
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Artist profile retrieved successfully
 *       400:
 *         description: Invalid artist ID
 *       404:
 *         description: Artist not found
 *       500:
 *         description: Server error
 */
router.get('/artist/:id', optionalAuth, homeController.getArtistProfile);

/**
 * @swagger
 * /home/category/{id}:
 *   get:
 *     summary: Get artworks by category
 *     tags: [Home]
 *     description: Get artworks filtered by category
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Category ID
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [newest, price_low, price_high, rating, popular]
 *           default: newest
 *         description: Sort options
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
 *         description: Category artworks retrieved successfully
 *       400:
 *         description: Invalid category ID
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get('/category/:id', homeController.getArtworksByCategory);

/**
 * @swagger
 * /home/featured-artworks:
 *   get:
 *     summary: جلب الأعمال المميزة
 *     tags: [Home]
 *     description: |
 *       جلب الأعمال الفنية المميزة (Featured) مع التقسيم.
 *       مخصص لشاشة "مشاهدة الجميع" للأعمال المميزة.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد الأعمال في الصفحة
 *         example: 20
 *     responses:
 *       200:
 *         description: تم جلب الأعمال المميزة بنجاح
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
 *                   example: "تم جلب الأعمال المميزة بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: FeaturedArtworksScreen
 */
router.get('/featured-artworks', homeController.getFeaturedArtworks);

/**
 * @swagger
 * /home/most-rated-artworks:
 *   get:
 *     summary: جلب أكثر الأعمال تقييماً
 *     tags: [Home]
 *     description: |
 *       جلب الأعمال الفنية الأكثر تقييماً مع التقسيم.
 *       مخصص لشاشة "مشاهدة الجميع" لأكثر الأعمال تقييماً.
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد الأعمال في الصفحة
 *         example: 20
 *     responses:
 *       200:
 *         description: تم جلب أكثر الأعمال تقييماً بنجاح
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
 *                   example: "تم جلب أكثر الأعمال تقييماً بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: MostRatedArtworksScreen
 */
router.get('/most-rated-artworks', homeController.getMostRatedArtworks);

/**
 * @swagger
 * /home/personalized-artworks:
 *   get:
 *     summary: جلب الأعمال المخصصة لك
 *     tags: [Home]
 *     description: |
 *       جلب الأعمال الفنية المخصصة للمستخدم بناءً على تفضيلاته.
 *       مخصص لشاشة "مشاهدة الجميع" للأعمال المخصصة.
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: عدد الأعمال في الصفحة
 *         example: 20
 *     responses:
 *       200:
 *         description: تم جلب الأعمال المخصصة بنجاح
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
 *                   example: "تم جلب الأعمال المخصصة لك بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationResponse'
 *                 meta:
 *                   type: object
 *                   properties:
 *                     isPersonalized:
 *                       type: boolean
 *                       description: هل المحتوى مخصص للمستخدم
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: PersonalizedArtworksScreen
 */
router.get('/personalized-artworks', optionalAuth, homeController.getPersonalizedArtworks);

/**
 * @swagger
 * components:
 *   schemas:
 *     HomeData:
 *       type: object
 *       properties:
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Category'
 *         featuredArtists:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artist'
 *         featuredArtworks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artwork'
 *         trendingArtworks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artwork'
 *         personalizedArtworks:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Artwork'
 *     Category:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         image:
 *           type: string
 *         artworksCount:
 *           type: number
 *     Artist:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         displayName:
 *           type: string
 *         profileImage:
 *           type: string
 *         coverImages:
 *           type: array
 *           items:
 *             type: string
 *         job:
 *           type: string
 *         rating:
 *           type: number
 *         reviewsCount:
 *           type: number
 *         followersCount:
 *           type: number
 *         artworksCount:
 *           type: number
 *         isVerified:
 *           type: boolean
 *     Artwork:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         title:
 *           type: string
 *         description:
 *           type: string
 *         mainImage:
 *           type: string
 *         images:
 *           type: array
 *           items:
 *             type: string
 *         allImages:
 *           type: array
 *           items:
 *             type: string
 *         price:
 *           type: number
 *         currency:
 *           type: string
 *         dimensions:
 *           type: object
 *         medium:
 *           type: string
 *         year:
 *           type: number
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *         artist:
 *           $ref: '#/components/schemas/Artist'
 *         category:
 *           $ref: '#/components/schemas/Category'
 *         stats:
 *           type: object
 *           properties:
 *             likeCount:
 *               type: number
 *             viewCount:
 *               type: number
 *             rating:
 *               type: number
 *             reviewsCount:
 *               type: number
 *         availability:
 *           type: object
 *           properties:
 *             isAvailable:
 *               type: boolean
 *             isFeatured:
 *               type: boolean
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
