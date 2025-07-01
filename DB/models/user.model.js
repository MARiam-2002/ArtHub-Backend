import mongoose, { Schema, Types, model } from 'mongoose';

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated MongoDB ID
 *         fingerprint:
 *           type: string
 *           description: Device fingerprint for passwordless login
 *         googleId:
 *           type: string
 *           description: Google OAuth ID
 *         facebookId:
 *           type: string
 *           description: Facebook OAuth ID
 *         email:
 *           type: string
 *           format: email
 *           description: User email address (unique)
 *         job:
 *           type: string
 *           description: User job or profession
 *         forgetCode:
 *           type: string
 *           description: Password reset verification code
 *         isForgetCodeVerified:
 *           type: boolean
 *           description: Whether the forget code has been verified
 *         password:
 *           type: string
 *           format: password
 *           description: Hashed password (not returned in queries)
 *         role:
 *           type: string
 *           enum: [user, artist]
 *           description: User role in the system
 *         wishlist:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product IDs in user's wishlist
 *         profileImage:
 *           type: object
 *           properties:
 *             url:
 *               type: string
 *               format: uri
 *             id:
 *               type: string
 *           description: User's profile image details
 *         coverImages:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               url:
 *                 type: string
 *                 format: uri
 *               id:
 *                 type: string
 *           description: User's cover images
 *         firebaseUid:
 *           type: string
 *           description: Firebase user ID for authentication
 *         displayName:
 *           type: string
 *           description: User display name
 *         photoURL:
 *           type: string
 *           format: uri
 *           description: User photo URL from social login
 *         isVerified:
 *           type: boolean
 *           description: Whether the user's account is verified
 *         preferredLanguage:
 *           type: string
 *           enum: [ar, en]
 *           description: User's preferred language
 *         notificationSettings:
 *           type: object
 *           properties:
 *             enablePush:
 *               type: boolean
 *               description: Whether the user wants to receive push notifications
 *             enableEmail:
 *               type: boolean
 *               description: Whether the user wants to receive email notifications
 *             muteChat:
 *               type: boolean
 *               description: Whether the user wants to mute chat notifications
 *         isActive:
 *           type: boolean
 *           description: Whether the user is active
 *         isDeleted:
 *           type: boolean
 *           description: Whether the user is deleted
 *         fcmTokens:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of FCM tokens for push notifications
 *         lastActive:
 *           type: date
 *           description: Last active time of the user
 */
const userSchema = new Schema(
  {
    fingerprint: String,

    googleId: String,
    facebookId: String,

    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'يرجى إدخال بريد إلكتروني صالح']
    },
    job: {
      type: String,
      default: 'مستخدم'
    },

    forgetCode: {
      type: String
    },

    isForgetCodeVerified: {
      type: Boolean,
      default: false
    },

    password: {
      type: String,
      select: false
    },

    role: {
      type: String,
      enum: ['user', 'artist'],
      default: 'user'
    },

    wishlist: [
      {
        type: Types.ObjectId,
        ref: 'Product'
      }
    ],

    profileImage: {
      url: {
        type: String,
        default:
          'https://res.cloudinary.com/dz5dpvxg7/image/upload/v1691521498/ecommerceDefaults/user/png-clipart-user-profile-facebook-passport-miscellaneous-silhouette_aol7vc.png'
      },
      id: {
        type: String,
        default:
          'ecommerceDefaults/user/png-clipart-user-profile-facebook-passport-miscellaneous-silhouette_aol7vc'
      }
    },

    coverImages: [
      {
        url: {
          type: String,
          required: true
        },
        id: {
          type: String,
          required: true
        }
      }
    ],

    firebaseUid: {
      type: String,
      unique: true,
      sparse: true
    },
    displayName: String,
    photoURL: String,

    isVerified: {
      type: Boolean,
      default: false
    },

    preferredLanguage: {
      type: String,
      enum: ['ar', 'en'],
      default: 'ar'
    },

    notificationSettings: {
      enablePush: {
        type: Boolean,
        default: true
      },
      enableEmail: {
        type: Boolean,
        default: true
      },
      muteChat: {
        type: Boolean,
        default: false
      }
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true
    },

    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    },

    fcmTokens: [String],

    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

const userModel = mongoose.models.User || model('User', userSchema);
export default userModel;
