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
});
