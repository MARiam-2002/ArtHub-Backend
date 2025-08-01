import { Router } from 'express';
import * as artworkController from './controller/artwork.js';
import { authenticate as isAuthenticated } from '../../middleware/auth.middleware.js';
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
import { fileUpload, filterObject } from '../../utils/multer.js';

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
 * /artworks:
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
/**
 * @swagger
 * /api/artworks/featured:
 *   get:
 *     summary: جلب الأعمال المميزة
 *     tags: [Artwork]
 *     description: |
 *       جلب الأعمال الفنية المميزة (isFeatured: true).
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
 *           default: 12
 *         description: عدد الأعمال في الصفحة
 *         example: 12
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
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *     x-screen: FeaturedArtworksScreen
 */
router.get('/featured', artworkController.getFeaturedArtworks);

router.get('/', isValidation(getArtworksQuerySchema), artworkController.getAllArtworks);

/**
 * @swagger
 * /artworks/search:
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
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *     responses:
 *       200:
 *         description: A list of artworks matching the search criteria
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     artworks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Artwork'
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationMeta'
 *       400:
 *         description: Invalid search query
 */
router.get('/search', isValidation(searchArtworksQuerySchema), artworkController.searchArtworks);

/**
 * @swagger
 * /artworks/{id}:
 *   get:
 *     tags: [Artwork]
 *     summary: Get a single artwork by ID
 *     description: Get detailed information about a specific artwork
 *     parameters:
 *       - in: path
 *         name: id
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
 *       500:
 *         description: Internal server error
 */
router.get('/:id', isValidation(artworkIdParamSchema), artworkController.getArtworkById);

/**
 * @swagger
 * /artworks:
 *   post:
 *     tags: [Artwork]
 *     summary: Create new artwork
 *     description: |
 *       Create a new artwork with image uploads (artists only).
 *       Supports up to 5 images with parallel upload to Cloudinary.
 *       Images are automatically optimized and organized in folders.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - price
 *               - category
 *             properties:
 *               title:
 *                 type: string
 *                 description: عنوان العمل الفني
 *                 example: "لوحة فنية زهرية زرقاء مرسومة يدويا"
 *                 minLength: 3
 *                 maxLength: 100
 *               price:
 *                 type: number
 *                 description: سعر العمل الفني
 *                 example: 100.00
 *                 minimum: 1
 *                 maximum: 1000000
 *               category:
 *                 type: string
 *                 description: معرف الفئة
 *                 example: "60d0fe4f5311236168a109ca"
 *                 pattern: '^[0-9a-fA-F]{24}$'
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: |
 *                   صور العمل الفني (1-5 صور).
 *                   الصيغ المدعومة: jpg, jpeg, png, gif, webp, svg, bmp, tiff.
 *                   سيتم تحسين الصور تلقائياً إلى 1920x1080.
 *                   يتم التحقق من نوع الملف تلقائياً.
 *                 maxItems: 5
 *                 minItems: 1
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
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       description: معرف العمل الفني
 *                       example: "60d0fe4f5311236168a109ca"
 *                     title:
 *                       type: string
 *                       description: عنوان العمل الفني
 *                       example: "لوحة فنية زهرية زرقاء مرسومة يدويا"
 *                     price:
 *                       type: number
 *                       description: سعر العمل الفني
 *                       example: 100
 *                     images:
 *                       type: array
 *                       description: صور العمل الفني
 *                       items:
 *                         type: object
 *                         properties:
 *                           originalName:
 *                             type: string
 *                             description: اسم الملف الأصلي
 *                             example: "artwork1.jpg"
 *                           url:
 *                             type: string
 *                             description: رابط الصورة في Cloudinary
 *                             example: "https://res.cloudinary.com/example/image1.jpg"
 *                           id:
 *                             type: string
 *                             description: معرف الصورة في Cloudinary
 *                             example: "arthub/artworks/artist_id/timestamp/image1"
 *                           format:
 *                             type: string
 *                             description: صيغة الملف
 *                             example: "jpg"
 *                           size:
 *                             type: number
 *                             description: حجم الملف بالبايت
 *                             example: 1024000
 *                           type:
 *                             type: string
 *                             description: نوع MIME
 *                             example: "image/jpeg"
 *                           uploadedAt:
 *                             type: string
 *                             format: date-time
 *                             description: تاريخ رفع الصورة
 *                             example: "2025-01-18T10:30:00.000Z"
 *                     category:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: معرف الفئة
 *                           example: "60d0fe4f5311236168a109ca"
 *                         name:
 *                           type: string
 *                           description: اسم الفئة
 *                           example: "رسم"
 *                     artist:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: معرف الفنان
 *                           example: "60d0fe4f5311236168a109ca"
 *                         displayName:
 *                           type: string
 *                           description: اسم الفنان
 *                           example: "أحمد محمد"
 *                         profileImage:
 *                           type: string
 *                           description: صورة البروفايل
 *                           example: "https://res.cloudinary.com/example/profile.jpg"
 *                     status:
 *                       type: string
 *                       description: حالة العمل الفني
 *                       example: "available"
 *                       enum: [available, sold, reserved]
 *                     viewCount:
 *                       type: number
 *                       description: عدد المشاهدات
 *                       example: 0
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                       description: تاريخ الإنشاء
 *                       example: "2025-01-18T10:30:00.000Z"
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "يمكن إضافة 5 صور على الأكثر"
 *                 data:
 *                   type: null
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Only artists can create artworks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "فقط الفنانين يمكنهم إنشاء أعمال فنية"
 *                 data:
 *                   type: null
 *       413:
 *         description: File too large
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "حجم الملف كبير جداً"
 *                 data:
 *                   type: null
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "فشل في رفع الصور"
 *                 data:
 *                   type: null
 */
router.post('/',
  isAuthenticated,
  fileUpload(filterObject.image).array('images', 5), // تحديث ليطابق الصورة: 5 صور كحد أقصى مع validation للصور
  isValidation(createArtworkSchema),
  artworkController.createArtwork
);

/**
 * @swagger
 * /artworks/{id}:
 *   put:
 *     tags: [Artwork]
 *     summary: Update artwork
 *     description: Update an existing artwork (owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       500:
 *         description: Internal server error
 */
router.put('/:id', isAuthenticated, isValidation(updateArtworkSchema), artworkController.updateArtwork);

/**
 * @swagger
 * /artworks/{id}:
 *   delete:
 *     tags: [Artwork]
 *     summary: Delete artwork
 *     description: Delete an artwork (owner only)
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', isAuthenticated, isValidation(artworkIdParamSchema), artworkController.deleteArtwork);

// Move these two routes up to avoid conflicts
router.get('/artist/:artistId', artworkController.getArtworksByArtist);
router.get('/my-artworks', isAuthenticated, artworkController.getMyArtworks);

// Artwork Interactions
/**
 * @swagger
 * /artworks/{id}/favorite:
 *   post:
 *     tags: [Artwork]
 *     summary: Add artwork to favorites
 *     description: Add artwork to user's favorites
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       500:
 *         description: Internal server error
 *   delete:
 *     tags: [Artwork]
 *     summary: Remove artwork from favorites
 *     description: Remove artwork from user's favorites
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       500:
 *         description: Internal server error
 */
router.post('/:id/favorite', isAuthenticated, isValidation(toggleFavoriteSchema), artworkController.toggleFavorite);
router.delete('/:id/favorite', isAuthenticated, isValidation(toggleFavoriteSchema), artworkController.toggleFavorite);

/**
 * @swagger
 * /artworks/{id}/reviews:
 *   post:
 *     tags: [Artwork]
 *     summary: Add artwork review
 *     description: Add a review and rating for an artwork
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *       500:
 *         description: Internal server error
 */
// router.post('/:id/reviews', isAuthenticated, isValidation(addReviewSchema), artworkController.addReviewToArtwork);

/**
 * @swagger
 * /artworks/{id}/reviews:
 *   get:
 *     tags: [Artwork]
 *     summary: Get artwork reviews
 *     description: Get all reviews for a specific artwork
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id/reviews', isValidation(artworkIdParamSchema), artworkController.getArtworkReviews);

export default router;
