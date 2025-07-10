import admin from '../utils/firebaseAdmin.js';
import jwt from 'jsonwebtoken';
import { asyncHandler } from '../utils/asyncHandler.js';
import userModel from '../../DB/models/user.model.js';
import tokenModel from '../../DB/models/token.model.js';

const generateTokens = (user) => {
  const accessToken = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.TOKEN_KEY, { expiresIn: '2h' });
  const refreshToken = jwt.sign({ id: user._id, tokenType: 'refresh' }, process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY, { expiresIn: '30d' });
  return { accessToken, refreshToken };
};

const saveTokenPair = async (userId, accessToken, refreshToken, userAgent) => {
  try {
    return await tokenModel.createTokenPair(userId, accessToken, refreshToken, userAgent);
  } catch (error) {
    console.warn('Failed to save token pair:', error);
    return null;
  }
};

const verifyFirebaseTokenInternal = async (firebaseToken) => {
  const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
  let user = await userModel.findOne({ firebaseUid: decodedToken.uid });
  if (!user && decodedToken.email) {
    user = await userModel.findOne({ email: decodedToken.email });
    if (user) {
      user.firebaseUid = decodedToken.uid;
      await user.save();
    }
  }
  if (!user) {
    user = await userModel.create({
      firebaseUid: decodedToken.uid,
      email: decodedToken.email,
      displayName: decodedToken.name || decodedToken.email?.split('@')[0],
      isVerified: decodedToken.email_verified || false,
    });
  }
  if (!user.isActive || user.isDeleted) throw new Error('Account disabled');
  return user;
};

const verifyJWTToken = async (token) => {
  const decoded = jwt.verify(token, process.env.TOKEN_KEY);
  const tokenDoc = await tokenModel.findValidToken(token);
  if (!tokenDoc) throw new Error('Invalid or revoked token');
  const user = await userModel.findById(decoded.id).select('-password');
  if (!user || !user.isActive || user.isDeleted) throw new Error('User not found or disabled');
  return user;
};

const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next(new Error('Authentication token not provided', { cause: 401 }));
  const token = authHeader.split(' ')[1];
  if (!token) return next(new Error('Invalid authentication token', { cause: 401 }));
  try {
    req.user = await (token.length > 500 ? verifyFirebaseTokenInternal(token) : verifyJWTToken(token));
  } catch (error) {
    return next(new Error('Invalid authentication token', { cause: 401 }));
  }
  next();
});

const optionalAuth = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        req.user = await (token.length > 500 ? verifyFirebaseTokenInternal(token) : verifyJWTToken(token));
      } catch (error) {
        // Ignore errors, just proceed without user
      }
    }
  }
  next();
});

const firebaseToJWT = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return next(new Error('Authentication token not provided', { cause: 401 }));
  const firebaseToken = authHeader.split(' ')[1];
  if (!firebaseToken) return next(new Error('Invalid authentication token', { cause: 401 }));
  const user = await verifyFirebaseTokenInternal(firebaseToken);
  const { accessToken, refreshToken } = generateTokens(user);
  await saveTokenPair(user._id, accessToken, refreshToken, req.headers['user-agent']);
  req.user = { ...user.toObject(), accessToken, refreshToken };
  next();
});

const logout = asyncHandler(async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication token not provided', { cause: 400 }));
    await tokenModel.invalidateToken(token);
    return res.status(200).json({ success: true, message: 'Logout successful' });
});

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'You are not authorized to access this resource' });
  }
  next();
};

const isAuthenticated = authenticate; // Alias for backward compatibility

export {
  generateTokens,
  saveTokenPair,
  verifyFirebaseTokenInternal,
  authenticate,
  optionalAuth,
  firebaseToJWT,
  logout,
  authorize,
  isAuthenticated
};
