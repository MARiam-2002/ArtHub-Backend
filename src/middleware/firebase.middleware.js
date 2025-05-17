
import admin from '../utils/firebaseAdmin.js';
import userModel from '../../DB/models/user.model.js';

/**
 * Middleware to verify Firebase ID tokens
 */
export async function verifyFirebaseToken(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.fail('No token provided.', 'لم يتم توفير رمز المصادقة', 401);
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
        { googleId: req.user.uid }
      ]
    });
    
    // If user exists, add MongoDB ID to req.user
    if (user) {
      req.user._id = user._id;
    }
    
    next();
  } catch (error) {
    console.error('Firebase token verification error:', error);
    return res.fail(
      'Invalid or expired Firebase token.', 
      'رمز المصادقة غير صالح أو منتهي الصلاحية', 
      401
    );
  }
}

/**
 * Store Firebase FCM token for push notifications
 */
export async function storeFCMToken(req, res, next) {
  try {
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.fail('No FCM token provided', 'لم يتم توفير رمز الإشعارات', 400);
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
              { googleId: req.user.uid } 
            ]
          },
          { 
            $set: { 
              email: req.user.email,
              googleId: req.user.uid,
              fcmToken,
              profileImage: { url: req.user.picture || '' },
              job: 'مستخدم',
            }
          },
          { new: true, upsert: true }
        );
      }
      
      if (user) {
        return res.success(
          { success: true }, 
          'تم تسجيل رمز الإشعارات بنجاح'
        );
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
      return res.fail(
        'No phone auth token provided', 
        'لم يتم توفير رمز التحقق الهاتفي', 
        400
      );
    }
    
    const decodedToken = await admin.auth().verifyIdToken(phoneAuthToken);
    
    // Check if the token is for phone authentication
    if (!decodedToken.phone_number) {
      return res.fail(
        'Invalid phone auth token', 
        'رمز التحقق الهاتفي غير صالح', 
        400
      );
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
        { googleId: decodedToken.uid }
      ]
    });
    
    // If user exists, add MongoDB ID to req.user
    if (user) {
      req.user._id = user._id;
    }
    
    next();
  } catch (error) {
    console.error('Firebase phone auth verification error:', error);
    return res.fail(
      'Invalid or expired phone auth token', 
      'رمز التحقق الهاتفي غير صالح أو منتهي الصلاحية', 
      401
    );
  }
}
