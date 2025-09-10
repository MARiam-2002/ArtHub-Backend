import mongoose, { Schema, Types, model } from 'mongoose';
import bcrypt from 'bcrypt';

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
    bio: {
      type: String,
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
      enum: ['user', 'artist', 'admin', 'superadmin'],
      default: 'user'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'banned'],
      default: 'active',
      index: true
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
          'https://res.cloudinary.com/dgzucjqgi/image/upload/v1755218681/WhatsApp_Image_2025-07-22_at_05.04.10_fcc150e2_aswz5i.jpg'
      },
      id: {
        type: String,
        default:
          'https://asset.cloudinary.com/dgzucjqgi/554357d17f851fe8249797db949e1766'
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
    },

    isOnline: {
      type: Boolean,
      default: false
    },

    lastSeen: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const userModel = mongoose.models.User || model('User', userSchema);
export default userModel;
