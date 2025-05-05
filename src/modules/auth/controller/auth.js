import userModel from "../../../../DB/models/user.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../utils/sendEmails.js";
import { resetPassword } from "../../../utils/generateHtml.js";
import tokenModel from "../../../../DB/models/token.model.js";

export const register = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const isUser = await userModel.findOne({
    email: email,
  });

  if (isUser) {
    return res
      .status(400)
      .json({ success: false, message: "Email already exists!" });
  }

  const hashPassword = bcryptjs.hashSync(
    password,
    Number(process.env.SALT_ROUND)
  );

  const user = await userModel.create({
    email,
    password: hashPassword,
  });

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.TOKEN_KEY
  );

  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"],
  });

  return res.status(201).json({
    success: true,
    message: "Registration successful!",
    data: {
      email: user.email,
      role: user.role,
      token,
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({
    email,
  });

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found. Please register.",
    });
  }

  const isPasswordValid = bcryptjs.compareSync(password, user.password);
  if (!isPasswordValid) {
    return next(
      new Error("Invalid Password. Please try again.", { cause: 400 })
    );
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      userName: user.userName,
      role: user.role,
    },
    process.env.TOKEN_KEY
  );

  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"] || "unknown",
  });

  user.status = "online";
  await user.save();

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      email: user.email,
      userName: user.userName,
      phone: user.phoneNumber,
      country: user.country,
      role: user.role,
      token,
    },
  });
});

//send forget Code

export const sendForgetCode = asyncHandler(async (req, res, next) => {
  // const user = await userModel.findOne({ email: req.body.email });

  // if (!user) {
  //   return next(new Error("Invalid email!", { cause: 400 }));
  // }

  const code = crypto.randomInt(1000, 9999).toString();

  req.user.forgetCode = code;
  await req.user.save();

  return (await sendEmail({
    to: req.body.email,
    subject: "Reset Password",
    html: resetPassword(code),
  }))
    ? res.status(200).json({ success: true, message: "check you email!" })
    : next(new Error("Something went wrong!", { cause: 400 }));
});

export const VerifyCode = asyncHandler(async (req, res, next) => {
  if (!req.user.forgetCode) {
    return next(new Error("Please resend the forget code.", { status: 400 }));
  }

  if (req.user.forgetCode !== req.body.forgetCode) {
    return next(new Error("Invalid code!", { status: 400 }));
  }

  await userModel.updateOne(
    {
      $or: [{ email: req.user.email }, { username: req.user.userNme }],
    },
    { $unset: { forgetCode: 1 } }
  );
  return res.status(200).json({
    success: true,
    message: "Go to reset new password",
  });
});

export const resetPasswordByCode = asyncHandler(async (req, res, next) => {
  if (req.user.forgetCode) {
    return next(new Error("Please verify code first!", { status: 400 }));
  }
  const newPassword = bcryptjs.hashSync(
    req.body.password,
    +process.env.SALT_ROUND
  );
  await userModel.findOneAndUpdate(
    {
      _id: req.user._id,
    },
    { password: newPassword }
  );

  //invalidate tokens
  const tokens = await tokenModel.find({ user: req.user._id });

  tokens.forEach(async (token) => {
    token.isValid = false;
    await token.save();
  });
  return res.status(200).json({ success: true, message: "Try to login!" });
});

export const fingerprint = asyncHandler(async (req, res) => {
  const { isFingerprintAuth } = req.body;

  if (isFingerprintAuth) {
    return res.status(200).json({
      success: true,
      message: "Login with your fingerprint successful.",
      data: {
        email: req.user.email,
        userName: req.user.userName,
        phone: req.user.phoneNumber,
        country: req.user.country,
        role: req.user.role,
        token: req.headers["token"],
      },
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid fingerprint authentication.",
    });
  }
});

// export const redHeart = asyncHandler(async (req, res, next) => {
//   const { productId } = req.params;

//   // Fetch product
//   const product = await productModel.findById(productId);
//   if (!product) {
//     return res.status(404).json({ success: false, message: "Product not found" });
//   }

//   // Fetch user
//   const user = await userModel.findById(req.user._id);
//   if (!user) {
//     return res.status(404).json({ success: false, message: "User not found" });
//   }

//   // Ensure wishlist is an array
//   user.wishlist = user.wishlist || [];

//   // Check if product is already in the wishlist
//   const isLike = user.wishlist.includes(productId);

//   // Update wishlist
//   const updatedUser = await userModel.findByIdAndUpdate(
//     req.user._id,
//     {
//       [isLike ? "$pull" : "$addToSet"]: { wishlist: productId },
//     },
//     { new: true }
//   );

//   return res.status(200).json({
//     success: true,
//     status: 200,
//     message: isLike
//       ? "This product has been removed from the wishlist"
//       : "This product has been added to the wishlist",
//   });
// });

// export const wishlist = asyncHandler(async (req, res, next) => {

//   // Fetch the user with populated fields
//   let user = await userModel.findById(req.user._id).populate("wishlist");

//   if (!user) {
//     return next(new Error("User not found", { status: 404 }));
//   }

//   return res.status(200).json({
//     success: true,
//     status: 200,
//     message: "These are all the products that you added to the wishlist",
//     data: user.wishlist,
//   });
// });
