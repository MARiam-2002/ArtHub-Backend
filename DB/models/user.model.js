import mongoose, { Schema, Types, model } from "mongoose";

const userSchema = new Schema(
  {
    fingerprint: { type: String },

    googleId: String,
    facebookId: String,
    email: {
      type: String,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
    },

    role: {
      type: String,
      enum: ["user", "photographer", "painter", "visual_artist"],
      default: "user",
    },
    wishlist: [
      {
        type: Types.ObjectId,
        ref: "Product", // تأكد من أن لديك موديل "Product"
      },
    ],

    profileImage: {
      url: {
        type: String,
        default:
          "https://res.cloudinary.com/dz5dpvxg7/image/upload/v1691521498/ecommerceDefaults/user/png-clipart-user-profile-facebook-passport-miscellaneous-silhouette_aol7vc.png",
      },
      id: {
        type: String,
        default:
          "ecommerceDefaults/user/png-clipart-user-profile-facebook-passport-miscellaneous-silhouette_aol7vc",
      },
    },
    coverImages: [
      {
        url: {
          type: String,
          required: true,
        },
        id: {
          type: String,
          required: true,
        },
      },
    ],
  },
  { timestamps: true }
);

const userModel = mongoose.models.userModel || model("User", userSchema);
export default userModel;
