
import { asyncHandler } from "../utils/asyncHandler.js";
import admin from "../utils/firebaseAdmin.js";
import userModel from "../../DB/models/user.model.js";

/**
 * Middleware to verify Firebase ID token and attach user to request
 * Optimized for Flutter Firebase Authentication
 */
export const verifyFirebaseToken = asyncHandler(async (req, res, next) => {
  try {
    // Check for Firebase token in Authorization header
    const firebaseToken = req.headers.authorization?.split("Bearer ")[1];
    
    if (!firebaseToken) {
      return next(new Error("No Firebase token provided", { cause: 401 }));
    }
    
    // Verify the token with Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    
    if (!decodedToken) {
      return next(new Error("Invalid Firebase token", { cause: 401 }));
    }
    
    // Find or create user based on Firebase UID
    let user = await userModel.findOne({ firebaseUid: decodedToken.uid });
    
    if (!user) {
      // Create new user if first time login with Firebase
      user = await userModel.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email || `user_${decodedToken.uid}@firebase.com`,
        displayName: decodedToken.name || 'مستخدم جديد',
        photoURL: decodedToken.picture || '',
        isVerified: decodedToken.email_verified || false,
        role: "user"
      });
    } else {
      // Update user data from Firebase if needed
      const updateData = {};
      
      if (decodedToken.name && !user.displayName) {
        updateData.displayName = decodedToken.name;
      }
      
      if (decodedToken.picture && !user.photoURL) {
        updateData.photoURL = decodedToken.picture;
      }
      
      if (decodedToken.email_verified !== undefined && user.isVerified !== decodedToken.email_verified) {
        updateData.isVerified = decodedToken.email_verified;
      }
      
      if (Object.keys(updateData).length > 0) {
        await userModel.updateOne({ _id: user._id }, updateData);
      }
    }
    
    // Attach the user to the request object
    req.user = user;
    req.firebaseUser = decodedToken;
    
    next();
  } catch (error) {
    console.error("Firebase auth error:", error);
    return next(new Error("Authentication failed", { cause: 401 }));
  }
});

/**
 * Optional Firebase authentication
 * Allows requests without authentication but attaches user if token is valid
 */
export const optionalFirebaseAuth = asyncHandler(async (req, res, next) => {
  try {
    const firebaseToken = req.headers.authorization?.split("Bearer ")[1];
    
    if (!firebaseToken) {
      return next(); // Continue without authentication
    }
    
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken)
      .catch(err => {
        console.log("Optional auth token invalid:", err.message);
        return null;
      });
    
    if (decodedToken) {
      // Find user by Firebase UID
      const user = await userModel.findOne({ firebaseUid: decodedToken.uid });
      if (user) {
        req.user = user;
        req.firebaseUser = decodedToken;
      }
    }
    
    next();
  } catch (error) {
    // Just continue if optional auth fails
    next();
  }
});

export default { verifyFirebaseToken, optionalFirebaseAuth };
