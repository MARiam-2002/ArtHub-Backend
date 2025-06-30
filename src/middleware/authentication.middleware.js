import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import tokenModel from "../../DB/models/token.model.js";
import userModel from "../../DB/models/user.model.js";

export const isAuthenticated = asyncHandler(async (req, res, next) => {
  const token = req.headers["token"];
  if (!token) {
    return next(new Error("يجب تسجيل الدخول أولاً", { cause: 401 }));
  }

  let decode;
  try {
    decode = jwt.verify(token, process.env.TOKEN_KEY);
  } catch (error) {
    return next(new Error("التوكن غير صالح أو منتهي الصلاحية", { cause: 401 }));
  }

  try {
    const tokenDB = await tokenModel.findOne({ token, isValid: true });
    if (!tokenDB) {
      return next(
        new Error("هذا التوكن غير صالح أو تم تسجيل الخروج", { cause: 403 })
      );
    }
  
    const user = await userModel.findById(decode.id);
    if (!user) {
      return next(new Error("المستخدم غير موجود", { cause: 404 }));
    }
    req.user = user;
    return next();
  } catch (error) {
    console.error("Authentication error:", error);
    
    // Handle database connection errors
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
});
