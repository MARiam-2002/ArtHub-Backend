import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiFeatures } from '../../utils/apiFeatures.js';

/**
 * @desc    Get all users
 * @route   GET /api/v1/admin/users
 * @access  Private (Admin, SuperAdmin)
 */
export const getUsers = asyncHandler(async (req, res, next) => {
  const apiFeatures = new ApiFeatures(userModel.find(), req.query)
    .paginate()
    .filter()
    .sort()
    .select()
    .search();

  const users = await apiFeatures.mongooseQuery;
  const total = await userModel.countDocuments(apiFeatures.mongooseQuery.getFilter());

  res.success({
    message: 'Users fetched successfully',
    data: {
      users,
      total,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      totalPages: Math.ceil(total / apiFeatures.limit),
    },
  });
}); 