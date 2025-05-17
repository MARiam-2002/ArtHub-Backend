
import admin from '../utils/firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';
import jwt from 'jsonwebtoken';
import tokenModel from '../../DB/models/token.model.js';

/**
 * Middleware to verify Firebase ID tokens
 * Supports both Firebase Authentication and custom JWT
 */
export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'لم يتم توفير رمز المصادقة',
      error: 'No token provided'
    });
  }
  
  const token = authHeader.split('Bearer ')[1];
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add user information to the request
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email || '',
      name: decodedToken.name || '',
      picture: decodedToken.picture || '',
      emailVerified: decodedToken.email_verified || false
    };
    
    // Check if user exists in our database
    const user = await userModel.findOne({ 
      $or: [
        { email: req.user.email },
        { googleId: req.user.uid },
        { firebaseUid: req.user.uid }
      ]
    });
    
    // If user exists, add MongoDB ID to req.user
    if (user) {
      req.user._id = user._id;
      req.user.role = user.role;
    } else {
      // Create new user if not exists
      const newUser = await userModel.create({
        email: req.user.email,
        googleId: req.user.uid,
        firebaseUid: req.user.uid,
        displayName: req.user.name,
        photoURL: req.user.picture,
        profileImage: {
          url: req.user.picture || 'https://res.cloudinary.com/dz5dpvxg7/image/upload/v1691521498/ecommerceDefaults/user/png-clipart-user-profile-facebook-passport-miscellaneous-silhouette_aol7vc.png',
          id: 'ecommerceDefaults/user/png-clipart-user-profile-facebook-passport-miscellaneous-silhouette_aol7vc'
        },
        isVerified: req.user.emailVerified,
        job: 'مستخدم'
      });
      
      req.user._id = newUser._id;
      req.user.role = newUser.role;
    }
    
    next();
  } catch (error) {
    // Try to verify it as our custom JWT if Firebase verification fails
    try {
      const decode = jwt.verify(token, process.env.TOKEN_KEY);
      const tokenDB = await tokenModel.findOne({ token, isValid: true });
      
      if (!tokenDB) {
        return res.status(403).json({
          success: false,
          message: 'هذا التوكن غير صالح أو تم تسجيل الخروج',
          error: 'Invalid or expired token'
        });
      }
      
      const user = await userModel.findById(decode.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'المستخدم غير موجود',
          error: 'User not found'
        });
      }
      
      req.user = user;
      return next();
    } catch (jwtError) {
      return res.status(401).json({
        success: false,
        message: 'رمز المصادقة غير صالح أو منتهي الصلاحية',
        error: 'Invalid or expired authentication token'
      });
    }
  }
}

/**
 * Store Firebase FCM token for push notifications
 */
export async function storeFCMToken(req, res, next) {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم توفير رمز الإشعارات',
        error: 'No FCM token provided'
      });
    }
    
    // Update user in database with FCM token
    if (req.user) {
      let user;
      
      if (req.user._id) {
        // User already exists in our database
        user = await userModel.findByIdAndUpdate(
          req.user._id, 
          { fcmToken },
          { new: true }
        );
      } else if (req.user.uid && req.user.email) {
        // Create or update user based on Firebase credentials
        user = await userModel.findOneAndUpdate(
          { 
            $or: [
              { email: req.user.email },
              { googleId: req.user.uid },
              { firebaseUid: req.user.uid }
            ]
          },
          { 
            $set: { 
              email: req.user.email,
              googleId: req.user.uid,
              firebaseUid: req.user.uid,
              fcmToken,
              profileImage: { 
                url: req.user.picture || 'https://res.cloudinary.com/dz5dpvxg7/image/upload/v1691521498/ecommerceDefaults/user/png-clipart-user-profile-facebook-passport-miscellaneous-silhouette_aol7vc.png' 
              },
              job: 'مستخدم',
            }
          },
          { new: true, upsert: true }
        );
      }
      
      if (user) {
        return res.status(200).json({
          success: true,
          message: 'تم تسجيل رمز الإشعارات بنجاح'
        });
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Register FCM token endpoint handler
 */
export const registerFCMToken = async (req, res, next) => {
  try {
    await storeFCMToken(req, res, () => {});
  } catch (error) {
    next(error);
  }
};

/**
 * Verify Firebase phone auth
 */
export async function verifyPhoneAuth(req, res, next) {
  try {
    const { phoneAuthToken } = req.body;
    
    if (!phoneAuthToken) {
      return res.status(400).json({
        success: false,
        message: 'لم يتم توفير رمز التحقق الهاتفي',
        error: 'No phone auth token provided'
      });
    }
    
    const decodedToken = await admin.auth().verifyIdToken(phoneAuthToken);
    
    // Check if the token is for phone authentication
    if (!decodedToken.phone_number) {
      return res.status(400).json({
        success: false,
        message: 'رمز التحقق الهاتفي غير صالح',
        error: 'Invalid phone auth token'
      });
    }
    
    // Add user information to the request
    req.user = {
      uid: decodedToken.uid,
      phoneNumber: decodedToken.phone_number
    };
    
    // Check if user exists in our database
    const user = await userModel.findOne({ 
      $or: [
        { phoneNumber: decodedToken.phone_number },
        { firebaseUid: decodedToken.uid }
      ]
    });
    
    // If user exists, add MongoDB ID to req.user
    if (user) {
      req.user._id = user._id;
    } else {
      // Create new user with phone auth
      const newUser = await userModel.create({
        phoneNumber: decodedToken.phone_number,
        firebaseUid: decodedToken.uid,
        isVerified: true,
        job: 'مستخدم'
      });
      
      req.user._id = newUser._id;
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'رمز التحقق الهاتفي غير صالح أو منتهي الصلاحية',
      error: 'Invalid or expired phone auth token'
    });
  }
}

/**
 * Convert Firebase user to JWT token for standard API endpoints
 */
export async function firebaseToJWT(req, res, next) {
  try {
    // Get the Firebase user
    const user = await userModel.findOne({ _id: req.user._id });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود',
        error: 'User not found'
      });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user._id }, process.env.TOKEN_KEY, {
      expiresIn: '30d'
    });
    
    // Save token to database
    await tokenModel.create({
      token,
      user: user._id,
      agent: req.headers['user-agent']
    });
    
    // Return token and user data
    return res.status(200).json({
      success: true,
      message: 'تم إنشاء رمز JWT بنجاح',
      data: {
        token,
        user: {
          _id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          profileImage: user.profileImage
        }
      }
    });
  } catch (error) {
    next(error);
  }
}
