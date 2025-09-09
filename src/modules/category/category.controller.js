import categoryModel from '../../../DB/models/category.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { cacheCategories, invalidateCategoryCache } from '../../utils/cacheHelpers.js';

/**
 * Create a new category
 * @desc Create a new category for artworks
 * @route POST /api/categories
 * @access Private (Admin/Moderator only)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  try {
    // Check if category with same name already exists
    const existingCategory = await categoryModel.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (existingCategory) {
      return res.fail(null, 'يوجد تصنيف بنفس هذا الاسم بالفعل', 409);
    }

    const category = await categoryModel.create({ 
      name: name.trim(), 
      description: description?.trim(), 
      image 
    });

    // Invalidate category cache after creation
    await invalidateCategoryCache();

    res.success(category, 'تم إنشاء التصنيف بنجاح', 201);
  } catch (error) {
    console.error('Error creating category:', error);
    res.fail(null, 'حدث خطأ أثناء إنشاء التصنيف', 500);
  }
});

/**
 * Update an existing category
 * @desc Update category details
 * @route PUT /api/categories/:id
 * @access Private (Admin/Moderator only)
 */
export const updateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    // Check if category exists
    const existingCategory = await categoryModel.findById(id);
    if (!existingCategory) {
      return res.fail(null, 'التصنيف غير موجود', 404);
    }

    // If name is being updated, check for duplicates
    if (updateData.name && updateData.name.trim() !== existingCategory.name) {
      const duplicateCategory = await categoryModel.findOne({
        name: { $regex: new RegExp(`^${updateData.name.trim()}$`, 'i') },
        _id: { $ne: id }
      });

      if (duplicateCategory) {
        return res.fail(null, 'يوجد تصنيف بنفس هذا الاسم بالفعل', 409);
      }
    }

    // Trim string fields
    if (updateData.name) updateData.name = updateData.name.trim();
    if (updateData.description) updateData.description = updateData.description.trim();

    const category = await categoryModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    // Invalidate category cache after update
    await invalidateCategoryCache();

    res.success(category, 'تم تحديث التصنيف بنجاح');
  } catch (error) {
    console.error('Error updating category:', error);
    res.fail(null, 'حدث خطأ أثناء تحديث التصنيف', 500);
  }
});

/**
 * Delete a category
 * @desc Delete a category by ID
 * @route DELETE /api/categories/:id
 * @access Private (Admin/Moderator only)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const category = await categoryModel.findById(id);
    if (!category) {
      return res.fail(null, 'التصنيف غير موجود', 404);
    }

    // Check if category is being used by any artworks
    const artworksCount = await artworkModel.countDocuments({ category: id });
    if (artworksCount > 0) {
      return res.fail(
        { artworksCount }, 
        `لا يمكن حذف التصنيف لأنه مرتبط بـ ${artworksCount} عمل فني`, 
        400
      );
    }
    
    await categoryModel.findByIdAndDelete(id);
    
    // Invalidate category cache after deletion
    await invalidateCategoryCache();
    
    res.success(null, 'تم حذف التصنيف بنجاح');
  } catch (error) {
    console.error('Error deleting category:', error);
    res.fail(null, 'حدث خطأ أثناء حذف التصنيف', 500);
  }
});

/**
 * Get all categories
 * @desc Get all categories with optional pagination and search
 * @route GET /api/categories
 * @access Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10, 
    search, 
    includeStats = false 
  } = req.query;

  try {
    console.log('🔍 Fetching categories with params:', { page, limit, search, includeStats });

    // Build search query
    let query = {};
    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    console.log('📝 Query:', JSON.stringify(query));

    // Calculate skip value for pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get total count
    const totalItems = await categoryModel.countDocuments(query);
    console.log('📊 Total items:', totalItems);

    // Get paginated results
    const categories = await categoryModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    console.log('✅ Found categories:', categories.length);

    // Add artwork count for each category if requested
    let categoriesWithStats = categories;
    if (includeStats === 'true') {
      console.log('📈 Adding stats for categories...');
      categoriesWithStats = await Promise.all(
        categories.map(async (category) => {
          try {
            const artworkCount = await artworkModel.countDocuments({ 
              category: category._id 
            });
            return {
              ...category,
              artworkCount
            };
          } catch (error) {
            console.error('❌ Error getting artwork count for category:', category._id, error);
            return {
              ...category,
              artworkCount: 0
            };
          }
        })
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil(totalItems / parseInt(limit));
    const hasNextPage = parseInt(page) < totalPages;
    const hasPrevPage = parseInt(page) > 1;

    // Format response for Flutter
    const response = {
      categories: categoriesWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        totalItems,
        hasNextPage,
        hasPrevPage
      }
    };

    console.log('✅ Sending response with', categoriesWithStats.length, 'categories');
    res.success(response, 'تم جلب التصنيفات بنجاح');
  } catch (error) {
    console.error('❌ Error fetching categories:', error);
    res.fail(null, 'حدث خطأ أثناء جلب التصنيفات', 500);
  }
});

/**
 * Get a single category by ID
 * @desc Get category details by ID with optional artwork count
 * @route GET /api/categories/:id
 * @access Public
 */
export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { includeStats = false } = req.query;

  try {
    const category = await categoryModel.findById(id).lean();
    if (!category) {
      return res.fail(null, 'التصنيف غير موجود', 404);
    }

    // Add artwork count if requested
    if (includeStats === 'true') {
      const artworkCount = await artworkModel.countDocuments({ 
        category: id 
      });
      category.artworkCount = artworkCount;

      // Get recent artworks in this category
      const recentArtworks = await artworkModel
        .find({ category: id })
        .select('title images price artist')
        .populate('artist', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      category.recentArtworks = recentArtworks;
    }

    res.success(category, 'تم جلب التصنيف بنجاح');
  } catch (error) {
    console.error('Error fetching category:', error);
    res.fail(null, 'حدث خطأ أثناء جلب التصنيف', 500);
  }
});

/**
 * Get category statistics
 * @desc Get comprehensive statistics about categories
 * @route GET /api/categories/stats
 * @access Public
 */
export const getCategoryStats = asyncHandler(async (req, res) => {
  try {
    // Get basic stats
    const totalCategories = await categoryModel.countDocuments();
    
    // Get categories with artwork counts
    const categoriesWithStats = await categoryModel.aggregate([
      {
        $lookup: {
          from: 'artworks',
          localField: '_id',
          foreignField: 'category',
          as: 'artworks'
        }
      },
      {
        $addFields: {
          artworkCount: { $size: '$artworks' }
        }
      },
      {
        $project: {
          name: 1,
          artworkCount: 1,
          createdAt: 1
        }
      },
      {
        $sort: { artworkCount: -1 }
      }
    ]);

    // Get most popular categories (top 5)
    const mostPopularCategories = categoriesWithStats.slice(0, 5);

    // Get categories with no artworks
    const emptyCategoriesCount = categoriesWithStats.filter(
      cat => cat.artworkCount === 0
    ).length;

    // Get recent categories (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentCategoriesCount = await categoryModel.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    const stats = {
      totalCategories,
      emptyCategoriesCount,
      recentCategoriesCount,
      mostPopularCategories,
      averageArtworksPerCategory: totalCategories > 0 
        ? Math.round(
            categoriesWithStats.reduce((sum, cat) => sum + cat.artworkCount, 0) / totalCategories
          )
        : 0
    };

    res.success(stats, 'تم جلب إحصائيات التصنيفات بنجاح');
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.fail(null, 'حدث خطأ أثناء جلب إحصائيات التصنيفات', 500);
  }
});

/**
 * Get popular categories for mobile home screen
 * @desc Get top categories with artwork counts for mobile display
 * @route GET /api/categories/popular
 * @access Public
 */
export const getPopularCategories = asyncHandler(async (req, res) => {
  const { limit = 8 } = req.query;

  try {
    // Use cached data with fallback to database
    const popularCategories = await cacheCategories(async () => {
      return await categoryModel.aggregate([
      {
        $lookup: {
          from: 'artworks',
          localField: '_id',
          foreignField: 'category',
          as: 'artworks'
        }
      },
      {
        $addFields: {
          artworkCount: { $size: '$artworks' }
        }
      },
      {
        $match: {
          artworkCount: { $gt: 0 } // Only categories with artworks
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          image: 1,
          artworkCount: 1
        }
      },
      {
        $sort: { artworkCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);
    }, { limit: parseInt(limit), includeStats: true });

    res.success(popularCategories, 'تم جلب التصنيفات الشائعة بنجاح');
  } catch (error) {
    console.error('Error fetching popular categories:', error);
    res.fail(null, 'حدث خطأ أثناء جلب التصنيفات الشائعة', 500);
  }
});
