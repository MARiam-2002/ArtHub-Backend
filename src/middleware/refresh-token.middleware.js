import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import tokenModel from '../../DB/models/token.model.js';
import userModel from '../../DB/models/user.model.js';

/**
 * Refresh token middleware
 * Generates a new access token using a valid refresh token
 * 
 * @swagger
 * components:
 *   schemas:
 *     RefreshTokenRequest:
 *       type: object
 *       required:
 *         - refreshToken
 *       properties:
 *         refreshToken:
 *           type: string
 *           description: Refresh token received during login
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 */
export const refreshToken = asyncHandler(async (req, res, next) => {
  try {
    const { refreshToken: refreshTokenString } = req.body;

    if (!refreshTokenString) {
      return next(new Error('رمز التحديث مطلوب', { cause: 400 }));
    }

    // Verify refresh token JWT
    let decoded;
    try {
      decoded = jwt.verify(
        refreshTokenString,
        process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY
      );
    } catch (error) {
      return next(new Error('رمز التحديث غير صالح أو منتهي الصلاحية', { cause: 401 }));
    }

    // Check if token type is refresh
    if (decoded.tokenType !== 'refresh') {
      return next(new Error('نوع الرمز غير صحيح', { cause: 401 }));
    }

    // Find token in database
    const tokenDoc = await tokenModel.findValidRefreshToken(refreshTokenString);

    if (!tokenDoc) {
      return next(new Error('رمز التحديث غير موجود أو تم إبطاله', { cause: 401 }));
    }

    // Find user
    const user = await userModel.findById(decoded.id);

    if (!user) {
      return next(new Error('المستخدم غير موجود', { cause: 404 }));
    }

    // Check if user is active
    if (!user.isActive || user.isDeleted) {
      return next(new Error('تم تعطيل هذا الحساب', { cause: 403 }));
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      process.env.TOKEN_KEY,
      { expiresIn: '2h' }
    );

    // Update token in database
    await tokenModel.refreshAccessToken(refreshTokenString, newAccessToken);

    // Return new access token
    return res.status(200).json({
      success: true,
      message: 'تم تحديث رمز الوصول بنجاح',
      data: {
        token: newAccessToken
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    return next(new Error('فشل في تحديث رمز الوصول', { cause: 500 }));
  }
}); 