import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     Token:
 *       type: object
 *       required:
 *         - token
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         token:
 *           type: string
 *           description: JWT token string
 *         user:
 *           type: string
 *           description: Reference to the user ID
 *         isValid:
 *           type: boolean
 *           description: Whether the token is still valid
 *           default: true
 *         agent:
 *           type: string
 *           description: User agent string from the device that created the token
 *         expiredAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the token expires
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the token was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the token was last updated
 */
const tokenSchema = new Schema(
  {
    token: {
      type: String,
      required: true,
      index: true
    },
    user: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    isValid: {
      type: Boolean,
      default: true
    },
    agent: String,
    expiredAt: {
      type: Date,
      default: function() {
        // Default expiration is 30 days from creation
        const now = new Date();
        return new Date(now.setDate(now.getDate() + 30));
      }
    }
  },
  { timestamps: true }
);

// Add index for faster token lookup and expiration checks
tokenSchema.index({ token: 1, isValid: 1 });
tokenSchema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

// Static method to find a valid token
tokenSchema.statics.findValidToken = async function(tokenString) {
  return this.findOne({
    token: tokenString,
    isValid: true,
    expiredAt: { $gt: new Date() }
  });
};

// Static method to invalidate all tokens for a user
tokenSchema.statics.invalidateAllUserTokens = async function(userId) {
  return this.updateMany(
    { user: userId, isValid: true },
    { isValid: false }
  );
};

const tokenModel = mongoose.models.Token || model('Token', tokenSchema);
export default tokenModel;
