import userModel from "../../../../DB/models/user.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../utils/sendEmails.js";
import { resetPassword } from "../../../utils/generateHtml.js";
import tokenModel from "../../../../DB/models/token.model.js";

export const register = asyncHandler(async (req, res, next) => {
  const { email, password, role } = req.body;

  const user = await userModel.findOne({ email });

  const invalidMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

  if (user) {
    return next(new Error(invalidMessage, { cause: 400 }));
  }

  const hashPassword = await bcryptjs.hash(
    password,
    Number(process.env.SALT_ROUND)
  );

  const newUser = await userModel.create({
    email,
    password: hashPassword,
    role: role || "user",
  });

  const token = jwt.sign(
    {
      id: newUser._id,
      email: newUser.email,
      role: newUser.role,
    },
    process.env.TOKEN_KEY
  );

  await tokenModel.findOneAndDelete({ user: newUser._id });

  await tokenModel.create({
    token,
    user: newUser._id,
    agent: req.headers["user-agent"],
  });

  return res.status(201).json({
    success: true,
    message: "تم التسجيل بنجاح!",
    data: {
      email: newUser.email,
      role: newUser.role,
      token,
    },
  });
});

export const login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });

  const invalidMessage = "البريد الإلكتروني أو كلمة المرور غير صحيحة.";

  if (!user) {
    return next(new Error(invalidMessage, { cause: 400 }));
  }

  const isPasswordValid = await bcryptjs.compare(password, user.password);
  if (!isPasswordValid) {
    return next(new Error(invalidMessage, { cause: 400 }));
  }

  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    process.env.TOKEN_KEY
  );

  await tokenModel.findOneAndDelete({ user: user._id });

  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"] || "unknown",
  });

  return res.status(200).json({
    success: true,
    message: "تم تسجيل الدخول بنجاح.",
    data: {
      email: user.email,
      role: user.role,
      token,
    },
  });
});


export const sendForgetCode = asyncHandler(async (req, res, next) => {

  const user = await userModel.findOne({ email: req.body.email });
  
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "البريد الإلكتروني غير مسجل لدينا.",
    });
  }

  user.forgetCode = null;

  const code = crypto.randomInt(1000, 9999).toString();
  user.forgetCode = code;

  await user.save();   

  try {
    const emailSent = await sendEmail({
      to: req.body.email,
      subject: "إعادة تعيين كلمة المرور",
      html: resetPassword(code),
    });

    if (!emailSent) {
      return next(new Error("حدث خطأ أثناء إرسال البريد الإلكتروني.", { cause: 500 }));
    }

    return res.status(200).json({
      success: true,
      message: "إذا كان البريد الإلكتروني صحيحًا، سيتم إرسال رمز إعادة تعيين كلمة المرور.",
    });
  } catch (error) {
    return next(new Error("فشل في إرسال البريد الإلكتروني، حاول مرة أخرى.", { cause: 500 }));
  }
});


export const VerifyCode = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.forgetCode) {
    return next(new Error("من فضلك، أعد إرسال رمز إعادة تعيين كلمة المرور.", { cause: 400 }));
  }

  if (req.user.forgetCode !== req.body.forgetCode) {
    return next(new Error("رمز غير صالح! تأكد من إدخال الرمز الصحيح.", { cause: 400 }));
  }

  await userModel.updateOne(
    { email: req.user.email },
    { $unset: { forgetCode: 1 } }
  );

  return res.status(200).json({
    success: true,
    message: "الرمز صحيح، يمكنك الآن إعادة تعيين كلمة المرور.",
  });
});


export const resetPasswordByCode = asyncHandler(async (req, res, next) => {
  if (!req.user || req.user.forgetCode) {
    return next(
      new Error("الرجاء التحقق من الرمز أولاً قبل إعادة تعيين كلمة المرور.", {
        status: 400,
      })
    );
  }

  const newPassword = bcryptjs.hashSync(
    req.body.password,
    +process.env.SALT_ROUND
  );

  await userModel.findByIdAndUpdate(req.user._id, {
    password: newPassword,
    $unset: { forgetCode: 1 },
  });

  const tokens = await tokenModel.find({ user: req.user._id });
  for (const token of tokens) {
    token.isValid = false;
    await token.save();
  }

  return res.status(200).json({
    success: true,
    message: "تم تعيين كلمة المرور بنجاح. يرجى تسجيل الدخول.",
  });
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
