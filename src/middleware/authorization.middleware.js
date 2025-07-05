import { asyncHandler } from '../utils/asyncHandler.js';

export const isAuthorized = (...roles) =>
  asyncHandler(async (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new Error('You are not authorized', { cause: 403 }));
    }
    return next();
  });
