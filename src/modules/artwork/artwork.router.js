import { Router } from 'express';
import * as artworkController from './controller/artwork.js';
import { isAuthenticated } from '../../middleware/authentication.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import { 
  createArtworkSchema, 
  updateArtworkSchema, 
  artworkIdParamSchema,
  getArtworksQuerySchema,
  searchArtworksQuerySchema,
  addReviewSchema,
  toggleFavoriteSchema
} from './artwork.validation.js';

const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Artwork:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: معرف العمل الفني
 *         title:
 *           type: string
 *           description: عنوان العمل الفني
 *         description:
 *           type: string
 *           description: وصف العمل الفني
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: روابط صور العمل الفني
 *         price:
 *           type: number
 *           description: سعر العمل الفني
 *         status:
 *           type: string
 *           enum: ["available", "sold", "reserved"]
 *           description: حالة العمل الفني
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: وسوم العمل الفني
 *         viewCount:
 *           type: number
 *           description: عدد المشاهدات
 *         isFramed:
 *           type: boolean
 *           description: هل العمل مؤطر
 *         dimensions:
 *           type: object
 *           properties:
 *             width:
 *               type: number
 *             height:
 *               type: number
 *             depth:
 *               type: number
 *         materials:
 *           type: array
 *           items:
 *             type: string
 *           description: المواد المستخدمة
 *         artist:
 *           $ref: '#/components/schemas/ArtistInfo'
 *         category:
 *           $ref: '#/components/schemas/CategoryInfo'
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     ArtistInfo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         displayName:
 *           type: string
 *         profileImage:
 *           type: string
 *         bio:
 *           type: string
 *         stats:
 *           type: object
 *           properties:
 *             totalArtworks:
 *               type: number
 *             avgRating:
 *               type: number
 *             totalReviews:
 *               type: number
 *     
 *     CategoryInfo:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *         description:
 *           type: string
 */

// Artwork CRUD Operations
/**
 * @swagger
 * /api/artwork:
 *   get:
 *     tags: [Artwork]
 *     summary: Get all artworks
 *     description: Get a paginated list of artworks with optional filtering
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by category ID
 *       - in: query
 *         name: artist
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by artist ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price filter
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, sold, reserved]
 *         description: Filter by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search in title and description
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [createdAt, price, title, views]
 *           default: createdAt
 *         description: Sort field
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Artworks retrieved successfully
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
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 */
router.get('/', isValidation(getArtworksQuerySchema), artworkController.getAllArtworks);

/**
 * @swagger
 * /api/artwork/search:
 *   get:
 *     tags: [Artwork]
 *     summary: Search artworks
 *     description: Search for artworks by title, description, or tags
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         description: Search query
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter by category
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           minimum: 0
 *         description: Maximum price
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 */
router.get('/search', isValidation(searchArtworksQuerySchema), artworkController.searchArtworks);

/**
 * @swagger
 * /api/artwork/{artworkId}:
 *   get:
 *     tags: [Artwork]
 *     summary: Get artwork by ID
 *     description: Get detailed information about a specific artwork
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Artwork ID
 *     responses:
 *       200:
 *         description: Artwork details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Artwork'
 *       404:
 *         description: Artwork not found
 */
router.get('/:artworkId', isValidation(artworkIdParamSchema), artworkController.getArtworkById);

/**
 * @swagger
 * /api/artwork:
 *   post:
 *     tags: [Artwork]
 *     summary: Create new artwork
 *     description: Create a new artwork (artists only)
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArtworkRequest'
 *     responses:
 *       201:
 *         description: Artwork created successfully
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
 *                   example: "تم إنشاء العمل الفني بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Artwork'
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only artists can create artworks
 */
router.post('/', isAuthenticated, isValidation(createArtworkSchema), artworkController.createArtwork);

/**
 * @swagger
 * /api/artwork/{artworkId}:
 *   put:
 *     tags: [Artwork]
 *     summary: Update artwork
 *     description: Update an existing artwork (owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateArtworkRequest'
 *     responses:
 *       200:
 *         description: Artwork updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only artwork owner can update
 *       404:
 *         description: Artwork not found
 */
router.put('/:artworkId', isAuthenticated, isValidation(artworkIdParamSchema), isValidation(updateArtworkSchema), artworkController.updateArtwork);

/**
 * @swagger
 * /api/artwork/{artworkId}:
 *   delete:
 *     tags: [Artwork]
 *     summary: Delete artwork
 *     description: Delete an artwork (owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Artwork deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only artwork owner can delete
 *       404:
 *         description: Artwork not found
 */
router.delete('/:artworkId', isAuthenticated, isValidation(artworkIdParamSchema), artworkController.deleteArtwork);

// Artwork Interactions
/**
 * @swagger
 * /api/artwork/{artworkId}/favorite:
 *   post:
 *     tags: [Artwork]
 *     summary: Toggle artwork favorite
 *     description: Add or remove artwork from favorites
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: Favorite status toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 action:
 *                   type: string
 *                   enum: [added, removed]
 *                 message:
 *                   type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Artwork not found
 */
router.post('/:artworkId/favorite', isAuthenticated, isValidation(artworkIdParamSchema), artworkController.toggleFavorite);

/**
 * @swagger
 * /api/artwork/{artworkId}/review:
 *   post:
 *     tags: [Artwork]
 *     summary: Add artwork review
 *     description: Add a review and rating for an artwork
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Rating from 1 to 5
 *               comment:
 *                 type: string
 *                 maxLength: 500
 *                 description: Review comment
 *     responses:
 *       201:
 *         description: Review added successfully
 *       400:
 *         $ref: '#/components/responses/BadRequestError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         description: Artwork not found
 *       409:
 *         description: User already reviewed this artwork
 */
router.post('/:artworkId/review', isAuthenticated, isValidation(artworkIdParamSchema), isValidation(addReviewSchema), artworkController.addReview);

/**
 * @swagger
 * /api/artwork/{artworkId}/reviews:
 *   get:
 *     tags: [Artwork]
 *     summary: Get artwork reviews
 *     description: Get all reviews for a specific artwork
 *     parameters:
 *       - in: path
 *         name: artworkId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
 *       404:
 *         description: Artwork not found
 */
router.get('/:artworkId/reviews', isValidation(artworkIdParamSchema), artworkController.getArtworkReviews);

// Artist's Artworks
/**
 * @swagger
 * /api/artwork/artist/{artistId}:
 *   get:
 *     tags: [Artwork]
 *     summary: Get artworks by artist
 *     description: Get all artworks created by a specific artist
 *     parameters:
 *       - in: path
 *         name: artistId
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, sold, reserved]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Artist artworks retrieved successfully
 *       404:
 *         description: Artist not found
 */
router.get('/artist/:artistId', artworkController.getArtworksByArtist);

// My Artworks (for authenticated artists)
/**
 * @swagger
 * /api/artwork/my-artworks:
 *   get:
 *     tags: [Artwork]
 *     summary: Get my artworks
 *     description: Get all artworks created by the authenticated user
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [available, sold, reserved]
 *     responses:
 *       200:
 *         description: User artworks retrieved successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get('/my-artworks', isAuthenticated, artworkController.getMyArtworks);

export default router;
