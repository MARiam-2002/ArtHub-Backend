import categoryModel from '../../../DB/models/category.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

/**
 * Create a new category
 * @desc Create a new category for artworks
 * @route POST /api/categories
 * @access Private (Admin/Moderator only)
 */
export const createCategory = asyncHandler(async (req, res) => {
  const { name, description, image } = req.body;

  // Check if category with same name already exists
  const existingCategory = await categoryModel.findOne({ 
    name: { $regex: new RegExp(`^${name}$`, 'i') } 
  });

  if (existingCategory) {
    return res.fail(null, 'يوجد تصنيف بنفس هذا الاسم بالفعل', 409);
  }

  const category = await categoryModel.create({ 
    name: name.trim(), 
    description: description?.trim(), 
    image 
  });

  res.success(category, 'تم إنشاء التصنيف بنجاح', 201);
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

  // Check if category exists
  const existingCategory = await categoryModel.findById(id);
  if (!existingCategory) {
    return res.fail(null, 'التصنيف غير موجود', 404);
  }

  // If name is being updated, check for duplicates
  if (updateData.name && updateData.name !== existingCategory.name) {
    const duplicateCategory = await categoryModel.findOne({
      name: { $regex: new RegExp(`^${updateData.name}$`, 'i') },
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

  res.success(category, 'تم تحديث التصنيف بنجاح');
});

/**
 * Delete a category
 * @desc Delete a category by ID
 * @route DELETE /api/categories/:id
 * @access Private (Admin/Moderator only)
 */
export const deleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await categoryModel.findById(id);
  if (!category) {
    return res.fail(null, 'التصنيف غير موجود', 404);
  }

  // TODO: Check if category is being used by any artworks
  // This would require checking the artworks collection
  // For now, we'll proceed with deletion
  
  await categoryModel.findByIdAndDelete(id);
  res.success(null, 'تم حذف التصنيف بنجاح');
});

/**
 * Get all categories with pagination and search
 * @desc Get paginated list of categories with optional search
 * @route GET /api/categories
 * @access Public
 */
export const getCategories = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;

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

  // Get paginated results
  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    sort: { createdAt: -1 }, // Most recent first
    lean: true // Return plain JavaScript objects for better performance
  };

  const result = await categoryModel.paginate(query, options);

  // Format response
  const response = {
    categories: result.docs,
    pagination: {
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      totalItems: result.totalDocs,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage
    }
  };

  res.success(response, 'تم جلب التصنيفات بنجاح');
});

/**
 * Get a single category by ID
 * @desc Get category details by ID
 * @route GET /api/categories/:id
 * @access Public
 */
export const getCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const category = await categoryModel.findById(id).lean();
  if (!category) {
    return res.fail(null, 'التصنيف غير موجود', 404);
  }

  res.success(category, 'تم جلب التصنيف بنجاح');
});

/**
 * Get category statistics
 * @desc Get statistics about categories (count, most used, etc.)
 * @route GET /api/categories/stats
 * @access Public
 */
export const getCategoryStats = asyncHandler(async (req, res) => {
  const totalCategories = await categoryModel.countDocuments();
  
  // TODO: Add more statistics like:
  // - Most used categories (requires artwork collection)
  // - Categories with most artworks
  // - Recent categories
  
  const stats = {
    totalCategories,
    // Add more stats here when artwork integration is ready
  };

  res.success(stats, 'تم جلب إحصائيات التصنيفات بنجاح');
});
