import { Router } from 'express';
import * as controller from './review.controller.js';
import { authenticate as isAuthenticated, authenticate as verifyFirebaseToken } from '../../middleware/auth.middleware.js';
import { isValidation } from '../../middleware/validation.middleware.js';
import * as Validators from './review.validation.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: إدارة التقييمات والمراجعات للأعمال الفنية والفنانين
 * 
 * /reviews/artwork:
 *   post:
 *     tags: [Reviews]
 *     summary: إنشاء تقييم جديد لعمل فني
 *     description: |
 *       إضافة تقييم وتعليق مفصل لعمل فني مع إمكانية إضافة تقييمات فرعية ونقاط إيجابية وسلبية
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // مثال على إرسال طلب إنشاء تقييم
 *       final response = await dio.post('/api/reviews/artwork', data: {
 *         'artwork': artworkId,
 *         'rating': 5,
 *         'title': 'عمل فني رائع',
 *         'comment': 'تعليق مفصل...',
 *         'pros': ['تقنية ممتازة', 'ألوان جميلة'],
 *         'cons': ['يحتاج لمزيد من التفاصيل'],
 *         'subRatings': {
 *           'creativity': 5,
 *           'technique': 4,
 *           'composition': 5
 *         },
 *         'isRecommended': true
 *       });
 *       ```
 *     x-screen: ArtworkDetailsScreen, WriteReviewScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArtworkReviewRequest'
 *           examples:
 *             basic_review:
 *               summary: تقييم أساسي
 *               value:
 *                 artwork: "507f1f77bcf86cd799439011"
 *                 rating: 4
 *                 comment: "عمل فني جميل وإبداعي"
 *             detailed_review:
 *               summary: تقييم مفصل
 *               value:
 *                 artwork: "507f1f77bcf86cd799439011"
 *                 rating: 5
 *                 title: "تحفة فنية حقيقية"
 *                 comment: "هذا العمل يظهر مهارة عالية في التقنية والإبداع"
 *                 pros: ["تقنية ممتازة", "ألوان متناسقة", "تكوين متوازن"]
 *                 cons: ["يحتاج لمزيد من التفاصيل في الخلفية"]
 *                 subRatings:
 *                   creativity: 5
 *                   technique: 4
 *                   composition: 5
 *                   originality: 5
 *                   impact: 4
 *                 isRecommended: true
 *     responses:
 *       201:
 *         description: تم إنشاء التقييم بنجاح
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
 *                   example: "تم إضافة التقييم بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/artwork',
  isAuthenticated,
  isValidation(Validators.createArtworkReviewSchema),
  controller.createArtworkReview
);

/**
 * @swagger
 * /reviews/artwork/{reviewId}:
 *   put:
 *     tags: [Reviews]
 *     summary: تحديث تقييم عمل فني موجود
 *     description: |
 *       تحديث تقييم موجود لعمل فني (يمكن للمستخدم تحديث تقييمه فقط)
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // تحديث تقييم موجود
 *       final response = await dio.put('/api/reviews/artwork/$reviewId', data: {
 *         'rating': 4,
 *         'title': 'عنوان محدث',
 *         'comment': 'تعليق محدث...'
 *       });
 *       ```
 *     x-screen: EditReviewScreen, MyReviewsScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف التقييم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArtworkReviewRequest'
 *     responses:
 *       200:
 *         description: تم تحديث التقييم بنجاح
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
 *                   example: "تم تحديث التقييم بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/artwork/:reviewId',
  isAuthenticated,
  isValidation(Validators.reviewIdSchema),
  isValidation(Validators.updateArtworkReviewSchema),
  controller.updateArtworkReview
);

/**
 * @swagger
 * /reviews/artwork/{artworkId}:
 *   get:
 *     tags: [Reviews]
 *     summary: جلب تقييمات عمل فني مع إحصائيات شاملة
 *     description: |
 *       جلب جميع التقييمات لعمل فني معين مع إحصائيات مفصلة وخيارات تصفية وترتيب متقدمة
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // جلب تقييمات عمل فني مع فلترة
 *       final response = await dio.get('/api/reviews/artwork/$artworkId', 
 *         queryParameters: {
 *           'page': 1,
 *           'limit': 10,
 *           'rating': 5, // فلترة حسب التقييم
 *           'verified': true, // المشتريات المعتمدة فقط
 *           'sortBy': 'helpfulVotes', // ترتيب حسب الفائدة
 *           'search': 'رائع' // البحث في التعليقات
 *         }
 *       );
 *       
 *       // عرض الإحصائيات
 *       final stats = response.data['data']['stats'];
 *       print('متوسط التقييم: ${stats['avgRating']}');
 *       print('إجمالي التقييمات: ${stats['totalReviews']}');
 *       ```
 *     x-screen: ArtworkDetailsScreen, ReviewsListScreen
 *     parameters:
 *       - name: artworkId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف العمل الفني
 *         example: "507f1f77bcf86cd799439011"
 *       - $ref: '#/components/parameters/ReviewQueryParams'
 *     responses:
 *       200:
 *         description: تم جلب التقييمات بنجاح
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
 *                   example: "تم جلب التقييمات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         avgRating:
 *                           type: number
 *                           example: 4.2
 *                         totalReviews:
 *                           type: integer
 *                           example: 25
 *                         distribution:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           example: [10, 5, 3, 2, 5]
 *                         verifiedCount:
 *                           type: integer
 *                           example: 15
 *                         recommendedCount:
 *                           type: integer
 *                           example: 20
 *                         recommendationRate:
 *                           type: integer
 *                           example: 80
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/artwork/:artworkId',
  isValidation(Validators.targetIdSchema),
  isValidation(Validators.reviewQuerySchema),
  controller.getArtworkReviews
);

/**
 * @swagger
 * /reviews/artist:
 *   post:
 *     tags: [Reviews]
 *     summary: إنشاء تقييم جديد لفنان
 *     description: |
 *       إضافة تقييم وتعليق لفنان مع إمكانية إضافة نقاط إيجابية وسلبية
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // إنشاء تقييم للفنان
 *       final response = await dio.post('/api/reviews/artist', data: {
 *         'artist': artistId,
 *         'rating': 5,
 *         'title': 'فنان محترف',
 *         'comment': 'تعامل ممتاز وجودة عالية',
 *         'pros': ['سرعة في التنفيذ', 'جودة عالية'],
 *         'cons': ['الأسعار مرتفعة قليلاً'],
 *         'isRecommended': true
 *       });
 *       ```
 *     x-screen: ArtistProfileScreen, WriteReviewScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArtistReviewRequest'
 *     responses:
 *       201:
 *         description: تم إنشاء تقييم الفنان بنجاح
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
 *                   example: "تم إضافة تقييم الفنان بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/artist',
  isAuthenticated,
  isValidation(Validators.createArtistReviewSchema),
  controller.createArtistReview
);

/**
 * @swagger
 * /reviews/artist/{reviewId}:
 *   put:
 *     tags: [Reviews]
 *     summary: تحديث تقييم فنان موجود
 *     description: تحديث تقييم موجود لفنان (يمكن للمستخدم تحديث تقييمه فقط)
 *     x-screen: EditReviewScreen, MyReviewsScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف التقييم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateArtistReviewRequest'
 *     responses:
 *       200:
 *         description: تم تحديث تقييم الفنان بنجاح
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put(
  '/artist/:reviewId',
  isAuthenticated,
  isValidation(Validators.reviewIdSchema),
  isValidation(Validators.updateArtistReviewSchema),
  controller.updateArtistReview
);

/**
 * @swagger
 * /reviews/artist/{artistId}:
 *   get:
 *     tags: [Reviews]
 *     summary: جلب تقييمات فنان مع إحصائيات شاملة
 *     description: |
 *       جلب جميع التقييمات لفنان معين مع إحصائيات مفصلة وخيارات تصفية وترتيب متقدمة
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // جلب تقييمات الفنان
 *       final response = await dio.get('/api/reviews/artist/$artistId', 
 *         queryParameters: {
 *           'page': 1,
 *           'limit': 10,
 *           'recommended': true, // التوصيات فقط
 *           'sortBy': 'createdAt',
 *           'sortOrder': 'desc'
 *         }
 *       );
 *       ```
 *     x-screen: ArtistProfileScreen, ReviewsListScreen
 *     parameters:
 *       - name: artistId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف الفنان
 *         example: "507f1f77bcf86cd799439012"
 *       - $ref: '#/components/parameters/ReviewQueryParams'
 *     responses:
 *       200:
 *         description: تم جلب تقييمات الفنان بنجاح
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
 *                   example: "تم جلب تقييمات الفنان بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         avgRating:
 *                           type: number
 *                           example: 4.5
 *                         totalReviews:
 *                           type: integer
 *                           example: 18
 *                         distribution:
 *                           type: array
 *                           items:
 *                             type: integer
 *                           example: [12, 3, 2, 1, 0]
 *                         verifiedCount:
 *                           type: integer
 *                           example: 10
 *                         recommendedCount:
 *                           type: integer
 *                           example: 15
 *                         recommendationRate:
 *                           type: integer
 *                           example: 83
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.get(
  '/artist/:artistId',
  isValidation(Validators.targetIdSchema),
  isValidation(Validators.reviewQuerySchema),
  controller.getArtistReviews
);

/**
 * @swagger
 * /reviews/{reviewId}:
 *   delete:
 *     tags: [Reviews]
 *     summary: حذف تقييم
 *     description: |
 *       حذف تقييم موجود (يمكن للمستخدم حذف تقييمه فقط)
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // حذف تقييم
 *       final response = await dio.delete('/api/reviews/$reviewId');
 *       if (response.data['success']) {
 *         // إزالة التقييم من القائمة المحلية
 *         setState(() {
 *           reviews.removeWhere((review) => review.id == reviewId);
 *         });
 *       }
 *       ```
 *     x-screen: MyReviewsScreen, ReviewDetailsScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف التقييم
 *     responses:
 *       200:
 *         description: تم حذف التقييم بنجاح
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
 *                   example: "تم حذف التقييم بنجاح"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete(
  '/:reviewId',
  isAuthenticated,
  isValidation(Validators.reviewIdSchema),
  controller.deleteReview
);

/**
 * @swagger
 * /reviews/{reviewId}/helpful:
 *   post:
 *     tags: [Reviews]
 *     summary: تمييز التقييم كمفيد أو إلغاء التمييز
 *     description: |
 *       تمييز تقييم كمفيد أو إلغاء التمييز (لا يمكن تمييز التقييم الخاص بالمستخدم)
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // تمييز التقييم كمفيد
 *       final response = await dio.post('/api/reviews/$reviewId/helpful', 
 *         data: {'helpful': true}
 *       );
 *       
 *       // تحديث واجهة المستخدم
 *       setState(() {
 *         review.helpfulVotes = response.data['data']['helpfulVotes'];
 *         review.isMarkedHelpful = response.data['data']['isMarkedHelpful'];
 *       });
 *       ```
 *     x-screen: ReviewsListScreen, ReviewDetailsScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف التقييم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               helpful:
 *                 type: boolean
 *                 description: true لتمييز كمفيد، false لإلغاء التمييز
 *                 example: true
 *     responses:
 *       200:
 *         description: تم تحديث حالة التمييز بنجاح
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
 *                   example: "تم تمييز التقييم كمفيد"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviewId:
 *                       type: string
 *                       example: "507f1f77bcf86cd799439013"
 *                     helpfulVotes:
 *                       type: integer
 *                       example: 5
 *                     isMarkedHelpful:
 *                       type: boolean
 *                       example: true
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/:reviewId/helpful',
  isAuthenticated,
  isValidation(Validators.reviewIdSchema),
  isValidation(Validators.markHelpfulSchema),
  controller.markReviewAsHelpful
);

/**
 * @swagger
 * /reviews/{reviewId}/report:
 *   post:
 *     tags: [Reviews]
 *     summary: الإبلاغ عن تقييم
 *     description: |
 *       الإبلاغ عن تقييم غير مناسب أو مخالف (لا يمكن الإبلاغ عن التقييم الخاص بالمستخدم)
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // الإبلاغ عن تقييم
 *       final response = await dio.post('/api/reviews/$reviewId/report', 
 *         data: {
 *           'reason': 'inappropriate',
 *           'description': 'يحتوي على محتوى غير مناسب'
 *         }
 *       );
 *       
 *       // إظهار رسالة تأكيد
 *       ScaffoldMessenger.of(context).showSnackBar(
 *         SnackBar(content: Text(response.data['message']))
 *       );
 *       ```
 *     x-screen: ReviewDetailsScreen, ReviewsListScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف التقييم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 enum: [inappropriate, spam, offensive, fake, other]
 *                 description: سبب الإبلاغ
 *                 example: "inappropriate"
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 description: وصف مفصل للمشكلة (اختياري)
 *                 example: "يحتوي على محتوى غير مناسب"
 *     responses:
 *       200:
 *         description: تم الإبلاغ عن التقييم بنجاح
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
 *                   example: "تم الإبلاغ عن التقييم بنجاح"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.post(
  '/:reviewId/report',
  isAuthenticated,
  isValidation(Validators.reviewIdSchema),
  isValidation(Validators.reportReviewSchema),
  controller.reportReview
);

/**
 * @swagger
 * /reviews/my:
 *   get:
 *     tags: [Reviews]
 *     summary: جلب تقييمات المستخدم
 *     description: |
 *       جلب جميع التقييمات التي كتبها المستخدم مع إحصائيات شخصية
 *       
 *       **ملاحظات للتطوير في Flutter:**
 *       ```dart
 *       // جلب تقييمات المستخدم
 *       final response = await dio.get('/api/reviews/my', 
 *         queryParameters: {
 *           'type': 'artwork', // artwork أو artist
 *           'page': 1,
 *           'limit': 10
 *         }
 *       );
 *       
 *       // عرض الإحصائيات الشخصية
 *       final stats = response.data['data']['stats'];
 *       print('متوسط تقييماتي: ${stats['avgRating']}');
 *       print('إجمالي الأصوات المفيدة: ${stats['totalHelpfulVotes']}');
 *       ```
 *     x-screen: MyReviewsScreen, ProfileScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: type
 *         in: query
 *         schema:
 *           type: string
 *           enum: [artwork, artist]
 *         description: نوع التقييمات المطلوبة
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: رقم الصفحة
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: عدد العناصر في الصفحة
 *       - name: sortBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [createdAt, rating, helpfulVotes]
 *           default: createdAt
 *         description: معيار الترتيب
 *       - name: sortOrder
 *         in: query
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: اتجاه الترتيب
 *     responses:
 *       200:
 *         description: تم جلب التقييمات بنجاح
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
 *                   example: "تم جلب تقييماتك بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     reviews:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Review'
 *                     stats:
 *                       type: object
 *                       properties:
 *                         avgRating:
 *                           type: number
 *                           example: 4.3
 *                         totalHelpfulVotes:
 *                           type: integer
 *                           example: 25
 *                         artworkReviews:
 *                           type: integer
 *                           example: 12
 *                         artistReviews:
 *                           type: integer
 *                           example: 8
 *                     pagination:
 *                       $ref: '#/components/schemas/PaginationInfo'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get(
  '/my',
  isAuthenticated,
  isValidation(Validators.reviewQuerySchema),
  controller.getMyReviews
);

/**
 * @swagger
 * /reviews/admin/stats:
 *   get:
 *     tags: [Reviews]
 *     summary: جلب إحصائيات التقييمات (للمدراء)
 *     description: جلب إحصائيات شاملة عن التقييمات في النظام (مخصص للمدراء فقط)
 *     x-screen: AdminDashboardScreen, AdminStatsScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: period
 *         in: query
 *         schema:
 *           type: string
 *           enum: [day, week, month, quarter, year, all]
 *           default: month
 *         description: فترة الإحصائيات
 *       - name: groupBy
 *         in: query
 *         schema:
 *           type: string
 *           enum: [rating, date, verified, recommended]
 *           default: rating
 *         description: معيار التجميع
 *     responses:
 *       200:
 *         description: تم جلب الإحصائيات بنجاح
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
 *                   example: "تم جلب إحصائيات التقييمات بنجاح"
 *                 data:
 *                   type: object
 *                   properties:
 *                     summary:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 1250
 *                         artworkReviews:
 *                           type: integer
 *                           example: 800
 *                         artistReviews:
 *                           type: integer
 *                           example: 450
 *                         avgRating:
 *                           type: number
 *                           example: 4.2
 *                     distribution:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: integer
 *                             example: 5
 *                           count:
 *                             type: integer
 *                             example: 600
 *                     activity:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "2024-01-15"
 *                           count:
 *                             type: integer
 *                             example: 25
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get(
  '/admin/stats',
  isAuthenticated,
  isValidation(Validators.reviewStatsQuerySchema),
  controller.getReviewsStats
);

/**
 * @swagger
 * /reviews/{reviewId}/moderate:
 *   patch:
 *     tags: [Reviews]
 *     summary: إدارة التقييم (للمدراء)
 *     description: تحديث حالة التقييم وإضافة ملاحظات إدارية (مخصص للمدراء فقط)
 *     x-screen: AdminReviewsScreen, AdminModerationScreen
 *     security:
 *       - BearerAuth: []
 *       - FirebaseAuth: []
 *     parameters:
 *       - name: reviewId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: معرف التقييم
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, hidden, reported, deleted]
 *                 description: الحالة الجديدة للتقييم
 *                 example: "hidden"
 *               moderationNotes:
 *                 type: string
 *                 maxLength: 500
 *                 description: ملاحظات الإدارة
 *                 example: "تم إخفاء التقييم لاحتوائه على محتوى غير مناسب"
 *     responses:
 *       200:
 *         description: تم تحديث حالة التقييم بنجاح
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
 *                   example: "تم تحديث حالة التقييم بنجاح"
 *                 data:
 *                   $ref: '#/components/schemas/Review'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.patch(
  '/:reviewId/moderate',
  isAuthenticated,
  isValidation(Validators.reviewIdSchema),
  isValidation(Validators.moderateReviewSchema),
  controller.moderateReview
);

// Firebase Authentication Routes (alternative authentication)
router.post('/artwork', verifyFirebaseToken, isValidation(Validators.createArtworkReviewSchema), controller.createArtworkReview);
router.put('/artwork/:reviewId', verifyFirebaseToken, isValidation(Validators.reviewIdSchema), isValidation(Validators.updateArtworkReviewSchema), controller.updateArtworkReview);
router.post('/artist', verifyFirebaseToken, isValidation(Validators.createArtistReviewSchema), controller.createArtistReview);
router.put('/artist/:reviewId', verifyFirebaseToken, isValidation(Validators.reviewIdSchema), isValidation(Validators.updateArtistReviewSchema), controller.updateArtistReview);
router.delete('/:reviewId', verifyFirebaseToken, isValidation(Validators.reviewIdSchema), controller.deleteReview);
router.post('/:reviewId/helpful', verifyFirebaseToken, isValidation(Validators.reviewIdSchema), isValidation(Validators.markHelpfulSchema), controller.markReviewAsHelpful);
router.post('/:reviewId/report', verifyFirebaseToken, isValidation(Validators.reviewIdSchema), isValidation(Validators.reportReviewSchema), controller.reportReview);
router.get('/my', verifyFirebaseToken, isValidation(Validators.reviewQuerySchema), controller.getMyReviews);
router.get('/admin/stats', verifyFirebaseToken, isValidation(Validators.reviewStatsQuerySchema), controller.getReviewsStats);
router.patch('/:reviewId/moderate', verifyFirebaseToken, isValidation(Validators.reviewIdSchema), isValidation(Validators.moderateReviewSchema), controller.moderateReview);

export default router;
