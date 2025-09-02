import mongoose from 'mongoose';

/**
 * Token Schema
 * Handles both access and refresh tokens with proper indexing and expiration
 * 
 * @swagger
 * components:
 *   schemas:
 *     TokenModel:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "60d0fe4f5311236168a109cb"
 *         user:
 *           type: string
 *           example: "60d0fe4f5311236168a109ca"
 *         token:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         refreshToken:
 *           type: string
 *           example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *         userAgent:
 *           type: string
 *           example: "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
 *         isValid:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-05-15T10:30:45.123Z"
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           example: "2023-06-15T10:30:45.123Z"
 */
const tokenSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    token: {
      type: String,
      required: true,
      index: true
    },
    refreshToken: {
      type: String,
      required: false,
      index: true
    },
    userAgent: {
      type: String,
      required: false
    },
    isValid: {
      type: Boolean,
      default: true,
      index: true
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Create TTL index to automatically remove expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Static method to find a valid token by its value
 * @param {string} token - Token to find
 * @returns {Promise<Object|null>} - Token document or null if not found
 */
tokenSchema.statics.findValidToken = async function (token) {
  return this.findOne({
    token,
    isValid: true,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Static method to find a valid refresh token by its value
 * @param {string} refreshToken - Refresh token to find
 * @returns {Promise<Object|null>} - Token document or null if not found
 */
tokenSchema.statics.findValidRefreshToken = async function (refreshToken) {
  return this.findOne({
    refreshToken,
    isValid: true,
    expiresAt: { $gt: new Date() }
  });
};

/**
 * Static method to invalidate a token
 * @param {string} token - Token to invalidate
 * @returns {Promise<Object|null>} - Updated token document or null if not found
 */
tokenSchema.statics.invalidateToken = async function (token) {
  return this.findOneAndUpdate(
    { token },
    { isValid: false },
    { new: true }
  );
};

/**
 * Static method to invalidate all tokens for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Result of update operation
 */
tokenSchema.statics.invalidateAllUserTokens = async function (userId) {
  const result = await this.updateMany(
    { user: userId, isValid: true },
    { isValid: false }
  );
  return { invalidatedCount: result.modifiedCount };
};

/**
 * Static method to create a token pair (access token + refresh token)
 * @param {string} userId - User ID
 * @param {string} accessToken - Access token
 * @param {string} refreshToken - Refresh token
 * @param {string} userAgent - User agent string
 * @returns {Promise<Object>} - Created token document
 */
tokenSchema.statics.createTokenPair = async function (userId, accessToken, refreshToken, userAgent) {
  // Calculate expiration dates
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setUTCMinutes(accessTokenExpiry.getUTCMinutes() + 1); // 2 minutes
  
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setUTCDate(refreshTokenExpiry.getUTCDate() + 30); // 30 days
  
  return this.create({
    user: userId,
    token: accessToken,
    refreshToken,
    userAgent: userAgent || 'unknown',
    isValid: true,
    expiresAt: refreshTokenExpiry // Use refresh token expiry as the document expiry
  });
};

/**
 * Static method to refresh an access token
 * @param {string} refreshToken - Refresh token
 * @param {string} newAccessToken - New access token
 * @returns {Promise<Object|null>} - Updated token document or null if not found
 */
tokenSchema.statics.refreshAccessToken = async function (refreshToken, newAccessToken) {
  // Calculate new access token expiration date
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setHours(accessTokenExpiry.getHours() + 2); // 2 hours
  
  return this.findOneAndUpdate(
    { refreshToken, isValid: true, expiresAt: { $gt: new Date() } },
    { token: newAccessToken },
    { new: true }
  );
};


/**
 * Static method to update a token pair
 * @param {string} tokenId - Token document ID
 * @param {string} newAccessToken - New access token
 * @param {string} newRefreshToken - New refresh token
 * @returns {Promise<Object|null>} - Updated token document or null if not found
 */
tokenSchema.statics.updateTokenPair = async function (tokenId, newAccessToken, newRefreshToken) {
  // Calculate new refresh token expiration date
  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 30); // 30 days
  
  return this.findByIdAndUpdate(
    tokenId,
    { 
      token: newAccessToken, 
      refreshToken: newRefreshToken,
      expiresAt: refreshTokenExpiry,
      isValid: true
    },
    { new: true }
  );
};

const tokenModel = mongoose.model('Token', tokenSchema);

export default tokenModel;
