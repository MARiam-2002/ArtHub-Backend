import { Router } from "express";
import * as Validators from "./auth.validation.js";
import { isValidation } from "../../middleware/validation.middleware.js";
import * as userController from "./controller/auth.js";
import { isAuthenticated } from "../../middleware/authentication.middleware.js";
import jwt from "jsonwebtoken";
import { filterObject, fileUpload } from "../../utils/multer.js";
import { verifyFirebaseToken } from '../../middleware/firebase.middleware.js';
const router = Router();

router.post(
  "/register",
  isValidation(Validators.registerSchema),
  userController.register
);

router.post(
  "/login",
  isValidation(Validators.loginSchema),
  userController.login
);

router.post(
  "/login-with-fingerprint",
  isAuthenticated,
  isValidation(Validators.fingerprintLoginSchema),
  userController.fingerprint
);

router.post(
  "/register-device-fingerprint",
  isAuthenticated,
  isValidation(Validators.registerDeviceSchema),
  userController.registerDeviceForFingerprint
);

router.post(
  "/remove-device-fingerprint",
  isAuthenticated,
  isValidation(Validators.removeDeviceSchema),
  userController.removeDeviceFingerprint
);

router.patch(
  "/forgetCode",
  isValidation(Validators.forgetCode),
  userController.sendForgetCode
);

router.patch(
  "/resetPassword",
  isAuthenticated,
  isValidation(Validators.resetPassword),
  userController.resetPasswordByCode
);
router.patch(
  "/VerifyCode",
  isAuthenticated,
  isValidation(Validators.verify),
  userController.VerifyCode
);

router.post(
  "/verifyForgetCode",
  isValidation(Validators.verifyForgetCode),
  userController.verifyForgetCode
);

router.post(
  "/resetPasswordByCode",
  isValidation(Validators.resetPasswordByCode),
  userController.resetPasswordByCode
);

router.post(
  "/social-login",
  verifyFirebaseToken,
  userController.socialLogin
);

router.post(
  "/update-fcm-token",
  isAuthenticated,
  isValidation(Validators.fcmTokenSchema),
  userController.updateFCMToken
);

// router.put(
//   "/redHeart/:productId",
//   isAuthenticated,
// userController.redHeart
// );
// router.get("/wishlist", isAuthenticated, userController.wishlist);
export default router;
