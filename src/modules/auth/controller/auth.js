import userModel from "../../../../DB/models/user.model.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { sendEmail } from "../../../utils/sendEmails.js";
import { resetPassword } from "../../../utils/generateHtml.js";
import tokenModel from "../../../../DB/models/token.model.js";
import admin from '../../../utils/firebaseAdmin.js';
import { updateUserFCMToken } from '../../../utils/pushNotifications.js';
import mongoose from "mongoose";
import { ensureDatabaseConnection } from "../../../utils/mongodbUtils.js";

// Helper function to ensure database connection before operations
const ensureConnection = async (next) => {
  try {
    const isConnected = await ensureDatabaseConnection(true);
    if (!isConnected) {
      throw new Error("Database connection failed");
    }
    return true;
  } catch (error) {
    console.error("Database connection error:", error);
    next(new Error("خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا", { cause: 503 }));
    return false;
  }
};

export const register = async (req, res, next) => {
  try {
    // Ensure database connection first
    if (!await ensureConnection(next)) {
      return; // Connection failed, error already sent
    }

    // Extract data from request body
    const { displayName, email, password, phoneNumber } = req.body;
    
    // Check if user already exists with timeout handling
    let existingUser;
    try {
      existingUser = await Promise.race([
        userModel.findOne({ email }).maxTimeMS(5000),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database operation timed out")), 5000)
        )
      ]);
    } catch (findError) {
      console.error("Registration error:", findError);
      if (findError.message.includes("timed out")) {
        return next(new Error("خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا", { cause: 503 }));
      }
      return next(new Error("حدث خطأ أثناء التحقق من البريد الإلكتروني", { cause: 500 }));
    }

    if (existingUser) {
      return next(new Error("البريد الإلكتروني مسجل بالفعل", { cause: 409 }));
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, parseInt(process.env.SALT_ROUND));

    // Create new user with explicit timeout handling
    let newUser;
    try {
      newUser = await Promise.race([
        userModel.create({
          displayName,
          email,
          password: hashedPassword,
          phoneNumber,
          role: "User",
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("User creation timed out")), 5000)
        )
      ]);
    } catch (createError) {
      console.error("User creation error:", createError);
      if (createError.message.includes("timed out")) {
        return next(new Error("خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا", { cause: 503 }));
      }
      return next(new Error("حدث خطأ أثناء إنشاء الحساب", { cause: 500 }));
    }

    // Generate token
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.TOKEN_KEY,
      { expiresIn: "30d" }
    );

    // Return success response
    return res.status(201).json({
      success: true,
      message: "تم إنشاء الحساب بنجاح",
      data: {
        _id: newUser._id,
        displayName: newUser.displayName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        token,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return next(new Error("حدث خطأ أثناء إنشاء الحساب", { cause: 500 }));
  }
};

export const login = async (req, res, next) => {
  try {
    // Ensure database connection first
    if (!await ensureConnection(next)) {
      return; // Connection failed, error already sent
    }

    const { email, password } = req.body;

    // Find user with timeout
    let user;
    try {
      user = await Promise.race([
        userModel.findOne({ email }).select("+password").maxTimeMS(5000),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Database operation timed out")), 5000)
        )
      ]);
    } catch (findError) {
      console.error("Login error:", findError);
      if (findError.message.includes("timed out")) {
        return next(new Error("خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا", { cause: 503 }));
      }
      return next(new Error("حدث خطأ أثناء تسجيل الدخول", { cause: 500 }));
    }
    
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
  
    // Delete previous token with timeout handling
    try {
      await Promise.race([
        tokenModel.findOneAndDelete({ user: user._id }).maxTimeMS(3000),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Token deletion timed out")), 3000)
        )
      ]);
    } catch (tokenError) {
      console.warn("Failed to delete previous token:", tokenError);
      // Continue anyway, this is not critical
    }
  
    // Create new token with timeout handling
    try {
      await Promise.race([
        tokenModel.create({
          token,
          user: user._id,
          agent: req.headers["user-agent"] || "unknown",
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Token creation timed out")), 3000)
        )
      ]);
    } catch (tokenError) {
      console.warn("Failed to create token:", tokenError);
      // Continue anyway, the token is still valid
    }
  
    return res.status(200).json({
      success: true,
      message: "تم تسجيل الدخول بنجاح.",
      data: {
        email: user.email,
        role: user.role,
        job: user.job,
        token,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    
    // Handle database connection errors specifically
    if (error.name === 'MongooseError' && error.message.includes('buffering timed out')) {
      return next(new Error("خطأ في الاتصال بقاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا", { cause: 503 }));
    }
    
    // Handle other database errors
    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return next(new Error("خطأ في قاعدة البيانات، يرجى المحاولة مرة أخرى لاحقًا", { cause: 500 }));
    }
    
    // Pass other errors to the error handler
    return next(error);
  }
};

export const sendForgetCode = asyncHandler(async (req, res, next) => {
  // Ensure database connection first
  if (!await ensureConnection(next)) {
    return; // Connection failed, error already sent
  }

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
      return next(
        new Error("حدث خطأ أثناء إرسال البريد الإلكتروني.", { cause: 500 })
      );
    }

    return res.status(200).json({
      success: true,
      message:
        "إذا كان البريد الإلكتروني صحيحًا، سيتم إرسال رمز إعادة تعيين كلمة المرور.",
    });
  } catch (error) {
    return next(
      new Error("فشل في إرسال البريد الإلكتروني، حاول مرة أخرى.", {
        cause: 500,
      })
    );
  }
});

export const VerifyCode = asyncHandler(async (req, res, next) => {
  if (!req.user || !req.user.forgetCode) {
    return next(
      new Error("من فضلك، أعد إرسال رمز إعادة تعيين كلمة المرور.", {
        cause: 400,
      })
    );
  }

  if (req.user.forgetCode !== req.body.forgetCode) {
    return next(
      new Error("رمز غير صالح! تأكد من إدخال الرمز الصحيح.", { cause: 400 })
    );
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

export const verifyForgetCode = asyncHandler(async (req, res, next) => {
  const { email, forgetCode } = req.body;
  const user = await userModel.findOne({ email });
  if (!user || !user.forgetCode) {
    return res.status(400).json({
      success: false,
      message: "يرجى طلب كود جديد أولاً.",
    });
  }
  if (user.forgetCode !== forgetCode) {
    return res.status(400).json({
      success: false,
      message: "رمز التحقق غير صحيح!",
    });
  }
  user.forgetCode = null;
  user.isForgetCodeVerified = true;
  await user.save();
  return res.status(200).json({
    success: true,
    message: "تم التحقق من الرمز بنجاح. يمكنك الآن إعادة تعيين كلمة المرور.",
  });
});

export const resetPasswordByCode = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;
  const user = await userModel.findOne({ email });
  if (!user || !user.isForgetCodeVerified) {
    return res.status(400).json({
      success: false,
      message: "يرجى التحقق من الكود أولاً.",
    });
  }
  const hashPassword = await bcryptjs.hash(password, Number(process.env.SALT_ROUND));
  user.password = hashPassword;
  user.isForgetCodeVerified = false;
  await user.save();
  await tokenModel.updateMany({ user: user._id }, { isValid: false });
  return res.status(200).json({
    success: true,
    message: "تم تحديث كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.",
  });
});

export const fingerprint = asyncHandler(async (req, res, next) => {
  const { deviceId } = req.body;
  
  if (!deviceId) {
    return next(new Error("معرف الجهاز مطلوب للمصادقة ببصمة الإصبع", { cause: 400 }));
  }
  
  // Check if the device is registered for this user
  const user = await userModel.findById(req.user._id);
  
  if (!user) {
    return next(new Error("المستخدم غير موجود", { cause: 404 }));
  }
  
  // Check if this device is authorized for fingerprint login
  if (!user.authorizedDevices || !user.authorizedDevices.includes(deviceId)) {
    return next(new Error("هذا الجهاز غير مصرح له باستخدام المصادقة ببصمة الإصبع", { cause: 403 }));
  }
  
  // Generate a new token
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.TOKEN_KEY
  );
  
  // Update or create token record
  await tokenModel.findOneAndDelete({ 
    user: user._id,
    agent: req.headers["user-agent"] || "unknown"
  });
  
  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"] || "unknown",
    deviceId
  });
  
  return res.status(200).json({
    success: true,
    message: "تم تسجيل الدخول ببصمة الإصبع بنجاح",
    data: {
      email: user.email,
      userName: user.userName,
      profilePic: user.profilePic,
      role: user.role,
      job: user.job,
      token
    }
  });
});

export const registerDeviceForFingerprint = asyncHandler(async (req, res, next) => {
  const { deviceId, deviceName } = req.body;
  
  if (!deviceId) {
    return next(new Error("معرف الجهاز مطلوب لتسجيل بصمة الإصبع", { cause: 400 }));
  }
  
  const user = await userModel.findById(req.user._id);
  
  if (!user) {
    return next(new Error("المستخدم غير موجود", { cause: 404 }));
  }
  
  // Initialize authorizedDevices array if it doesn't exist
  if (!user.authorizedDevices) {
    user.authorizedDevices = [];
  }
  
  // Check if device is already registered
  if (user.authorizedDevices.includes(deviceId)) {
    return res.status(200).json({
      success: true,
      message: "الجهاز مسجل بالفعل لاستخدام بصمة الإصبع"
    });
  }
  
  // Add device to authorized devices
  user.authorizedDevices.push(deviceId);
  
  if (deviceName) {
    if (!user.deviceNames) {
      user.deviceNames = {};
    }
    user.deviceNames[deviceId] = deviceName;
  }
  
  await user.save();
  
  return res.status(200).json({
    success: true,
    message: "تم تسجيل الجهاز بنجاح لاستخدام بصمة الإصبع"
  });
});

export const removeDeviceFingerprint = asyncHandler(async (req, res, next) => {
  const { deviceId } = req.body;
  
  if (!deviceId) {
    return next(new Error("معرف الجهاز مطلوب لإلغاء تسجيل بصمة الإصبع", { cause: 400 }));
  }
  
  const user = await userModel.findById(req.user._id);
  
  if (!user || !user.authorizedDevices) {
    return next(new Error("المستخدم غير موجود أو لا توجد أجهزة مسجلة", { cause: 404 }));
  }
  
  // Remove device from authorized devices
  user.authorizedDevices = user.authorizedDevices.filter(id => id !== deviceId);
  
  // Remove device name if exists
  if (user.deviceNames && user.deviceNames[deviceId]) {
    delete user.deviceNames[deviceId];
  }
  
  await user.save();
  
  // Invalidate any tokens for this device
  await tokenModel.updateMany(
    { user: user._id, deviceId },
    { isValid: false }
  );
  
  return res.status(200).json({
    success: true,
    message: "تم إلغاء تسجيل الجهاز لاستخدام بصمة الإصبع بنجاح"
  });
});

export const updateFCMToken = asyncHandler(async (req, res, next) => {
  const { fcmToken } = req.body;
  
  if (!fcmToken) {
    return next(new Error("رمز الإشعارات مطلوب", { cause: 400 }));
  }
  
  const user = await userModel.findById(req.user._id);
  
  if (!user) {
    return next(new Error("المستخدم غير موجود", { cause: 404 }));
  }
  
  // Update the FCM token
  user.fcmToken = fcmToken;
  await user.save();
  
  // Use the function directly from imported utilities
  const updated = await updateUserFCMToken(user._id, fcmToken);
  
  if (!updated) {
    console.warn(`Warning: Failed to update FCM token for user ${user._id} in notification system`);
  }
  
  return res.status(200).json({
    success: true,
    message: "تم تحديث رمز الإشعارات بنجاح"
  });
});

export const socialLogin = asyncHandler(async (req, res, next) => {
  const { email, name, picture, uid, provider } = req.user;
  let user = await userModel.findOne({ email });
  
  if (!user) {
    // Create new user if they don't exist
    user = await userModel.create({
      email,
      userName: name || email.split('@')[0],
      profilePic: picture || undefined,
      socialId: uid,
      socialProvider: provider || 'firebase',
      isVerified: true, // Social auth users are considered verified
      job: 'مستخدم' // Default job title
    });
  } else if (!user.socialId) {
    // If user exists but doesn't have socialId (registered via email), link accounts
    user.socialId = uid;
    user.socialProvider = provider || 'firebase';
    if (!user.profilePic && picture) {
      user.profilePic = picture;
    }
    await user.save();
  }

  // Generate JWT token
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role
    },
    process.env.TOKEN_KEY
  );

  // Remove old tokens and create new one
  await tokenModel.findOneAndDelete({ user: user._id });
  
  await tokenModel.create({
    token,
    user: user._id,
    agent: req.headers["user-agent"] || "unknown"
  });

  return res.status(200).json({
    success: true,
    message: "تم تسجيل الدخول بنجاح بواسطة " + (provider || 'حساب خارجي'),
    data: {
      email: user.email,
      userName: user.userName,
      profilePic: user.profilePic,
      role: user.role,
      job: user.job,
      token
    }
  });
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
