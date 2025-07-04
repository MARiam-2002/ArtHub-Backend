import mongoose, { Schema, Types, model } from 'mongoose';

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
