// NEW VERSION 2025-07-18 - Admin Controller with Cloudinary Organized Folders
// FORCE DEPLOYMENT TRIGGER v1.0.4 - This comment forces Vercel to redeploy
// CLOUDINARY ORGANIZED FOLDERS SYSTEM - UPDATED 2025-07-19
import userModel from '../../../DB/models/user.model.js';
import tokenModel from '../../../DB/models/token.model.js';
import artworkModel from '../../../DB/models/artwork.model.js';
import transactionModel from '../../../DB/models/transaction.model.js';
import specialRequestModel from '../../../DB/models/specialRequest.model.js';
import reviewModel from '../../../DB/models/review.model.js';
import reportModel from '../../../DB/models/report.model.js';
import followModel from '../../../DB/models/follow.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// تسجيل الـ models في Mongoose
import '../../../DB/models/artwork.model.js';
import '../../../DB/models/transaction.model.js';
import '../../../DB/models/review.model.js';
import '../../../DB/models/report.model.js';
import '../../../DB/models/follow.model.js';

/**
 * @desc    Get all admins
 * @route   GET /api/admin/admins
 * @access  Private (SuperAdmin only)
 */
export const getAdmins = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { page = 1, limit = 10, search, role, status } = req.query;
  
  // Build query filter
  const filter = { isDeleted: false };
  
  // Filter by role if specified
  if (role && ['admin', 'superadmin'].includes(role)) {
    filter.role = role;
  } else {
    // Default: show both admin and superadmin
    filter.role = { $in: ['admin', 'superadmin'] };
  }
  
  // Filter by status if specified
  if (status && ['active', 'inactive', 'banned'].includes(status)) {
    filter.isActive = status === 'active';
  }
  
  // Search filter
  if (search) {
    filter.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }
  
  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  // Get admins with pagination
  const admins = await userModel.find(filter)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();
  
  // Get total count for pagination
  const totalAdmins = await userModel.countDocuments(filter);
  
  res.json({
    success: true,
    message: 'تم جلب قائمة الأدمن بنجاح',
    data: {
      admins: admins.map(admin => ({
        _id: admin._id,
        displayName: admin.displayName,
        email: admin.email,
        role: admin.role,
        isActive: admin.isActive,
        profileImage: admin.profileImage,
        createdAt: admin.createdAt,
        lastActive: admin.lastActive
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalAdmins,
        pages: Math.ceil(totalAdmins / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Create new admin
 * @route   POST /api/admin/admins
 * @access  Private (SuperAdmin only)
 */
export const createAdmin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { displayName, email, password, role = 'admin' } = req.body;

  // Check if email already exists
  const existingUser = await userModel.findOne({ email });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'البريد الإلكتروني مستخدم بالفعل',
      data: null
    });
  }

  // Create admin first (password will be hashed by pre-save hook)
  const adminData = {
    displayName,
    email,
    password,
    role,
    isActive: true,
    isVerified: true
  };

  const admin = await userModel.create(adminData);

  // Handle profile image upload - SIMPLE UPLOAD v1.0.6
  let profileImageData = null;
  console.log('🔍 Request file:', req.file);
  
  if (req.file) {
    try {
      console.log('🔄 Uploading image to Cloudinary...');
      
      // استخدام cloudinary مباشرة
      const cloudinary = await import('cloudinary');
      
      // تكوين Cloudinary
      cloudinary.v2.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET
      });
      
      // رفع الصورة مباشرة مع admin._id في الباث
      const { secure_url, public_id } = await cloudinary.v2.uploader.upload(
        req.file.path,
        {
          folder: `arthub/admin-profiles/${admin._id}`
        }
      );
      
      console.log('✅ Image uploaded successfully');
      console.log('🔗 URL:', secure_url);
      console.log('🆔 Public ID:', public_id);
      
      profileImageData = {
        url: secure_url,
        id: public_id,
        
      };
      
      console.log('✅ Profile image processed successfully');
      
      // تحديث الأدمن بالصورة
      admin.profileImage = profileImageData;
      await admin.save();
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      
      return res.status(400).json({
        success: false,
        message: 'فشل في رفع الصورة: ' + error.message,
        data: null
      });
    }
  } else {
    console.log('📸 No file uploaded');
  }

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الأدمن بنجاح',
    data: {
      _id: admin._id,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      profileImage: admin.profileImage,
      createdAt: admin.createdAt
    }
  });
});



/**
 * @desc    Update admin
 * @route   PUT /api/admin/admins/:id
 * @access  Private (SuperAdmin only)
 */
export const updateAdmin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { displayName, email, role, isActive, password } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الأدمن غير صالح',
      data: null
    });
  }

  const admin = await userModel.findById(id);
  if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Check if email is already taken by another user
  if (email && email !== admin.email) {
    const existingUser = await userModel.findOne({ email, _id: { $ne: id } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل',
        data: null
      });
    }
  }

  // Handle profile image upload - UPDATE BASED ON EXISTING public_id
  if (req.file) {
    try {
      console.log('🔄 Uploading image to Cloudinary...');
      
      // استخدام cloudinary مباشرة
      const cloudinary = await import('cloudinary');
      
      // تكوين Cloudinary
      cloudinary.v2.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET
      });
      
      // التحقق من وجود صورة سابقة
      if (admin.profileImage && admin.profileImage.id) {
        console.log('📁 Found existing image, updating...');
        console.log('🆔 Existing Public ID:', admin.profileImage.id);
        
        // رفع الصورة مع public_id الموجود
        const { secure_url, public_id } = await cloudinary.v2.uploader.upload(
          req.file.path,
          {
            public_id: admin.profileImage.id, // استخدام الـ public_id الموجود
          }
        );
        
        console.log('✅ Image updated successfully');
        console.log('🔗 New URL:', secure_url);
        console.log('🆔 Updated Public ID:', public_id);
        
        // تحديث بيانات الصورة
        admin.profileImage.url = secure_url;
       
        
      } else {
        console.log('📁 No existing image, creating new one...');
        
        // إنشاء صورة جديدة
        const { secure_url, public_id } = await cloudinary.v2.uploader.upload(
          req.file.path,
          {
            folder: `arthub/admin-profiles/${admin._id}`
          }
        );
        
        console.log('✅ New image uploaded successfully');
        console.log('🔗 URL:', secure_url);
        console.log('🆔 Public ID:', public_id);
        
        // إنشاء بيانات الصورة الجديدة
        admin.profileImage = {
          url: secure_url,
          id: public_id,
        };
      }
      
      console.log('✅ Profile image processed successfully');
      
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      
      return res.status(400).json({
        success: false,
        message: 'فشل في رفع الصورة: ' + error.message,
        data: null
      });
    }
  }

  // Update fields
  if (displayName) admin.displayName = displayName;
  if (email) admin.email = email;
  if (role && ['admin', 'superadmin'].includes(role)) admin.role = role;
  if (typeof isActive === 'boolean') admin.isActive = isActive;
  
  // Update password if provided
  if (password) {
    admin.password = password; // سيتم تشفيرها تلقائياً بواسطة pre-save hook
  }

  await admin.save();

  res.json({
    success: true,
    message: 'تم تحديث الأدمن بنجاح',
    data: {
      _id: admin._id,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      profileImage: admin.profileImage,
      updatedAt: admin.updatedAt
    }
  });
});

/**
 * @desc    Delete admin
 * @route   DELETE /api/admin/admins/:id
 * @access  Private (SuperAdmin only)
 */
export const deleteAdmin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الأدمن غير صالح',
      data: null
    });
  }

  const admin = await userModel.findById(id);
  if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Soft delete
  admin.isDeleted = true;
  admin.isActive = false;
  await admin.save();

  res.json({
    success: true,
    message: 'تم حذف الأدمن بنجاح',
    data: null
  });
});

/**
 * @desc    Admin login
 * @route   POST /api/v1/login
 * @access  Public
 */
export const adminLogin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { email, password } = req.body;

  // Find admin by email
  const admin = await userModel.findOne({ 
    email, 
    role: { $in: ['admin', 'superadmin'] },
    isDeleted: false 
  }).select('+password');

  if (!admin || !admin.isActive) {
    return res.status(401).json({
      success: false,
      message: 'بيانات الدخول غير صحيحة',
      data: null
    });
  }

  // Check password
  if (!admin.password) {
    return res.status(401).json({
      success: false,
      message: 'بيانات الدخول غير صحيحة - كلمة المرور غير موجودة',
      data: null
    });
  }

  const isPasswordValid = await bcrypt.compare(password, admin.password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'بيانات الدخول غير صحيحة',
      data: null
    });
  }

  // Generate tokens
  const accessToken = jwt.sign(
    { 
      id: admin._id, 
      email: admin.email, 
      role: admin.role 
    },
    process.env.TOKEN_KEY,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { id: admin._id, tokenType: 'refresh' },
    process.env.REFRESH_TOKEN_KEY || process.env.TOKEN_KEY,
    { expiresIn: '7d' }
  );

  // Save tokens to database
  await tokenModel.createTokenPair(
    admin._id, 
    accessToken, 
    refreshToken, 
    req.headers['user-agent'] || 'admin-dashboard'
  );

  // Update last login
  admin.lastActive = new Date();
  await admin.save();

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: {
      admin: {
        _id: admin._id,
        displayName: admin.displayName,
        email: admin.email,
        role: admin.role,
        profileImage: admin.profileImage
      },
      tokens: {
        accessToken,
        refreshToken
      }
    }
  });
});

/**
 * @desc    Get admin profile
 * @route   GET /api/admin/profile
 * @access  Private (Admin, SuperAdmin)
 */
export const getAdminProfile = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const adminId = req.user._id;

  const admin = await userModel.findById(adminId)
    .select('-password')    .lean();

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  res.json({
    success: true,
    message: 'تم جلب الملف الشخصي بنجاح',
    data: {
      _id: admin._id,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      profileImage: admin.profileImage,
      isActive: admin.isActive,
      lastActive: admin.lastActive,
      createdAt: admin.createdAt
    }
  });
});

/**
 * @desc    Update admin profile
 * @route   PUT /api/admin/profile
 * @access  Private (Admin, SuperAdmin)
 */
export const updateAdminProfile = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { displayName, email } = req.body;
  const adminId = req.user._id;

  const admin = await userModel.findById(adminId);
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Check if email is already taken by another user
  if (email && email !== admin.email) {
    const existingUser = await userModel.findOne({ email, _id: { $ne: adminId } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'البريد الإلكتروني مستخدم بالفعل',
        data: null
      });
    }
  }

  // Update fields
  if (displayName) admin.displayName = displayName;
  if (email) admin.email = email;

  await admin.save();

  res.json({
    success: true,
    message: 'تم تحديث الملف الشخصي بنجاح',
    data: {
      _id: admin._id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      profileImage: admin.profileImage,
      updatedAt: admin.updatedAt
    }
  });
});

/**
 * @desc    Change admin password
 * @route   PUT /api/admin/change-password
 * @access  Private (Admin, SuperAdmin)
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { currentPassword, newPassword } = req.body;
  const adminId = req.user._id;

  const admin = await userModel.findById(adminId).select('+password');
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, admin.password);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'كلمة المرور الحالية غير صحيحة',
      data: null
    });
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  admin.password = hashedPassword;
  await admin.save();

  res.json({
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح',
    data: {
      _id: admin._id,
      email: admin.email,
      displayName: admin.displayName,
      profileImage: admin.profileImage,
      updatedAt: admin.updatedAt
    }
  });
});

/**
 * @desc    Change admin password (SuperAdmin only)
 * @route   PUT /api/admin/admins/:id/change-password
 * @access  Private (SuperAdmin only)
 */
export const changeAdminPassword = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { newPassword } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الأدمن غير صالح',
      data: null
    });
  }

  const admin = await userModel.findById(id);
  if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Set new password (will be hashed by pre-save hook)
  admin.password = newPassword;
  await admin.save();

  res.json({
    success: true,
    message: 'تم تغيير كلمة مرور الأدمن بنجاح',
    data: {
      _id: admin._id,
      email: admin.email,
      displayName: admin.displayName,
      updatedAt: admin.updatedAt
    }
  });
});

/**
 * @desc    Get all users (clients and artists) - Frontend handles filtering, sorting, and pagination
 * @route   GET /api/admin/users
 * @access  Private (Admin, SuperAdmin)
 */
export const getUsers = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { page = 1, limit = 10 } = req.query;
  
  // Build query filter
  const filter = { 
    role: { $in: ['user', 'artist'] }, 
    isDeleted: false 
  };
  
  // Check if limit is 'full' to return all users
  const isFullRequest = limit === 'full';
  
  let users;
  let totalUsers;
  
  if (isFullRequest) {
    // Get all users without pagination
    users = await userModel.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    
    totalUsers = users.length;
  } else {
    // Calculate pagination for normal requests
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get users with pagination
    users = await userModel.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    // Get total count for pagination
    totalUsers = await userModel.countDocuments(filter);
  }
  
  // Get basic statistics for all users (not just current page)
  const allUsers = await userModel.find(filter).select('isActive role').lean();
  const activeUsers = allUsers.filter(user => user.isActive).length;
  const bannedUsers = allUsers.filter(user => !user.isActive).length;
  const clients = allUsers.filter(user => user.role === 'user').length;
  const artists = allUsers.filter(user => user.role === 'artist').length;

  // Format users for admin view
  const formattedUsers = users.map(user => ({
    _id: user._id,
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
    // Additional info for admin
    job: user.job,
    location: user.location,
    bio: user.bio
  }));

  res.json({
    success: true,
    message: isFullRequest ? 'تم جلب جميع المستخدمين بنجاح' : 'تم جلب قائمة المستخدمين بنجاح',
    data: {
      users: formattedUsers,
      statistics: {
        totalUsers,
        activeUsers,
        bannedUsers,
        clients,
        artists
      },
      pagination: isFullRequest ? {
        page: 1,
        limit: 'full',
        total: totalUsers,
        pages: 1
      } : {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalUsers,
        pages: Math.ceil(totalUsers / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get user details
 * @route   GET /api/admin/users/:id
 * @access  Private (Admin, SuperAdmin)
 */
export const getUserDetails = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف المستخدم غير صالح',
      data: null
    });
  }

  const user = await userModel.findById(id)
    .select('-password')
    .lean();

  if (!user || ['admin', 'superadmin'].includes(user.role)) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  // Get user statistics and latest orders
  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;
  const reviewModel = (await import('../../../DB/models/review.model.js')).default;

  const [totalOrders, totalSpent, totalReviews, averageRating, latestOrders] = await Promise.all([
    specialRequestModel.countDocuments({ user: id }),
    specialRequestModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]),
    reviewModel.countDocuments({ user: id }),
    reviewModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ]),
    // Get latest 5 orders for overview
    specialRequestModel.find({ user: id })
      .populate('artist', 'displayName profileImage')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  const userDetails = {
    _id: user._id,
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    isVerified: user.isVerified,
    profileImage: user.profileImage,
    coverImages: user.coverImages,
    bio: user.bio,
    job: user.job,
    location: user.location,
    lastActive: user.lastActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    // Statistics
    statistics: {
      totalOrders: totalOrders,
      totalSpent: totalSpent[0]?.total || 0,
      totalReviews: totalReviews,
      averageRating: averageRating[0]?.avg || 0
    },
    // Latest orders for overview
    latestOrders: latestOrders.map(order => ({
      _id: order._id,
      title: order.title,
      description: order.description,
      price: order.price,
      status: order.status,
      artist: order.artist,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }))
  };

  res.json({
    success: true,
    message: 'تم جلب تفاصيل المستخدم بنجاح',
    data: userDetails
  });
});

/**
 * @desc    Block/Unblock user
 * @route   PATCH /api/v1/users/:id/block
 * @access  Private (Admin, SuperAdmin)
 */
export const blockUser = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف المستخدم غير صالح',
      data: null
    });
  }

  const user = await userModel.findById(id);
  if (!user || ['admin', 'superadmin'].includes(user.role)) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  // Toggle user status (block if active, unblock if inactive)
  const wasActive = user.isActive;
  user.isActive = !user.isActive;
  
  if (!user.isActive) {
    // Blocking user
    user.status = 'banned';
    user.blockReason = 'تم الحظر من قبل الإدارة';
    user.blockedAt = new Date();
  } else {
    // Unblocking user
    user.status = 'active';
    user.blockReason = null;
    user.blockedAt = null;
  }

  await user.save();

  res.json({
    success: true,
    message: wasActive ? 'تم حظر المستخدم بنجاح' : 'تم إلغاء حظر المستخدم بنجاح',
    data: {
      _id: user._id,
      displayName: user.displayName,
      isActive: user.isActive,
      status: user.status,
      blockReason: user.blockReason,
      blockedAt: user.blockedAt
    }
  });
});

/**
 * @desc    Send message to user with attachments
 * @route   POST /api/admin/users/:id/message
 * @access  Private (Admin, SuperAdmin)
 */
export const sendMessageToUser = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { message, subject } = req.body;

  // Debug logging
  console.log('🔍 Request body:', req.body);
  console.log('📁 Request files:', req.files);
  console.log('📋 Request headers:', req.headers['content-type']);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف المستخدم غير صالح',
      data: null
    });
  }

  const user = await userModel.findById(id);
  if (!user || ['admin', 'superadmin'].includes(user.role)) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  // معالجة الملفات المرفقة
  let attachments = [];
  if (req.files && req.files.length > 0) {
    try {
      console.log('📎 Processing attachments:', req.files.length, 'files');
      
      const cloudinary = await import('cloudinary');
      cloudinary.v2.config({
        cloud_name: process.env.CLOUD_NAME,
        api_key: process.env.API_KEY,
        api_secret: process.env.API_SECRET
      });

      // رفع جميع الملفات
      const uploadPromises = req.files.map(async (file, index) => {
        try {
          console.log(`📤 Uploading file ${index + 1}:`, file.originalname);
          
          const { secure_url, public_id, format, bytes } = await cloudinary.v2.uploader.upload(
            file.path,
            {
              folder: `arthub/admin-messages/${user._id}/${Date.now()}`,
              resource_type: 'auto', // يدعم جميع أنواع الملفات
              allowed_formats: [
              // صور
              'jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff',
              // مستندات
              'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf',
              // فيديوهات
              'mp4', 'mpeg', 'mov', 'avi', 'wmv', 'webm', 'ogg', '3gp', 'flv',
              // صوت
              'mp3', 'wav', 'aac', 'flac',
              // ملفات مضغوطة
              'zip', 'rar', '7z', 'gz', 'tar',
              // ملفات برمجة
              'js', 'json', 'xml', 'html', 'css', 'py', 'java'
            ]
            }
          );

          console.log(`✅ File ${index + 1} uploaded:`, secure_url);
          
          return {
            originalName: file.originalname,
            url: secure_url,
            id: public_id,
            format: format,
            size: bytes,
            type: file.mimetype
          };
        } catch (error) {
          console.error(`❌ Error uploading file ${index + 1}:`, error);
          throw new Error(`فشل في رفع الملف: ${file.originalname}`);
        }
      });

      attachments = await Promise.all(uploadPromises);
      console.log('✅ All attachments uploaded successfully');
      
    } catch (error) {
      console.error('❌ Error processing attachments:', error);
      return res.status(400).json({
        success: false,
        message: 'فشل في رفع الملفات المرفقة: ' + error.message,
        data: null
      });
    }
  }

  // إنشاء notification من نوع system مع المرفقات
  const notificationModel = (await import('../../../DB/models/notification.model.js')).default;
  
  const notification = await notificationModel.create({
    user: user._id,
    sender: req.user._id, // الأدمن المرسل
    title: {
      ar: subject || 'رسالة من إدارة المنصة',
      en: subject || 'Message from Platform Administration'
    },
    message: {
      ar: message,
      en: message
    },
    type: 'system', // نوع system للإشعارات الإدارية
    data: {
      adminName: req.user.displayName,
      adminRole: req.user.role,
      messageType: 'admin_message',
      platformLogo: 'https://res.cloudinary.com/dz5dpvxg7/image/upload/v1691521498/arthub/logo/art-hub-logo.png',
      attachments: attachments, // إضافة المرفقات
      sentAt: new Date()
    }
  });

  // إرسال push notification إذا كان المستخدم مفعل الإشعارات
  if (user.notificationSettings?.enablePush && user.fcmTokens?.length > 0) {
    try {
      const { sendPushNotification } = await import('../../utils/pushNotifications.js');
      await sendPushNotification({
        tokens: user.fcmTokens,
        title: subject || 'رسالة من إدارة المنصة',
        body: message,
        data: {
          type: 'admin_message',
          notificationId: notification._id.toString(),
          adminId: req.user._id.toString(),
          hasAttachments: attachments.length > 0
        }
      });
    } catch (error) {
      console.error('❌ Error sending push notification:', error);
    }
  }

  // إرسال email إذا كان مفعل
  if (user.notificationSettings?.enableEmail) {
    try {
      const { sendEmail } = await import('../../utils/sendEmails.js');
      await sendEmail({
        to: user.email,
        subject: subject || 'رسالة من إدارة المنصة',
        message: message,
        attachments: attachments // إضافة المرفقات للـ email
      });
    } catch (error) {
      console.error('❌ Error sending email:', error);
    }
  }

  res.json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح',
    data: {
      userId: user._id,
      userName: user.displayName,
      notificationId: notification._id,
      messageType: 'system_notification',
      sentAt: new Date(),
      attachmentsCount: attachments.length,
      attachments: attachments.map(file => ({
        originalName: file.originalName,
        url: file.url,
        format: file.format,
        size: file.size,
        type: file.type
      })),
      notification: {
        _id: notification._id,
        title: notification.title.ar,
        message: notification.message.ar,
        type: notification.type,
        data: notification.data
      }
    }
  });
});

/**
 * @desc    Get user orders
 * @route   GET /api/v1/users/:id/orders
 * @access  Private (Admin, SuperAdmin)
 */
export const getUserOrders = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف المستخدم غير صالح',
      data: null
    });
  }

  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;
  
  const orders = await specialRequestModel.find({ user: id })
    .populate('artist', 'displayName profileImage')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    message: 'تم جلب طلبات المستخدم بنجاح',
    data: {
      orders: orders.map(order => ({
        _id: order._id,
        title: order.title,
        description: order.description,
        price: order.price,
        status: order.status,
        artist: order.artist,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      }))
    }
  });
});

/**
 * @desc    Get user reviews
 * @route   GET /api/admin/users/:id/reviews
 * @access  Private (Admin, SuperAdmin)
 */
export const getUserReviews = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف المستخدم غير صالح',
      data: null
    });
  }

  const reviewModel = (await import('../../../DB/models/review.model.js')).default;
  
  const reviews = await reviewModel.find({ user: id })
    .populate('artist', 'displayName profileImage')
    .populate('artwork', 'title image')
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    message: 'تم جلب تقييمات المستخدم بنجاح',
    data: {
      reviews: reviews.map(review => ({
        _id: review._id,
        rating: review.rating,
        comment: review.comment,
        artist: review.artist,
        artwork: review.artwork,
        createdAt: review.createdAt
      }))
    }
  });
});

/**
 * @desc    Get user activity
 * @route   GET /api/v1/users/:id/activity
 * @access  Private (Admin, SuperAdmin)
 */
export const getUserActivity = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف المستخدم غير صالح',
      data: null
    });
  }

  // Get users recent activity from various collections
  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;
  const reviewModel = (await import('../../../DB/models/review.model.js')).default;
  const artworkModel = (await import('../../../DB/models/artwork.model.js')).default;

  const [recentOrders, recentReviews, recentArtworks] = await Promise.all([
    specialRequestModel.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(5)      .lean(),
    reviewModel.find({ user: id })
      .sort({ createdAt: -1 })
      .limit(5)      .lean(),
    artworkModel.find({ artist: id })
      .sort({ createdAt: -1 })
      .limit(5)   .lean()
  ]);

  const activity = [
    ...recentOrders.map(order => ({
      type: 'order',  action: 'created',
      item: order,
      date: order.createdAt
    })),
    ...recentReviews.map(review => ({
      type: 'review',  action: 'created',
      item: review,
      date: review.createdAt
    })),
    ...recentArtworks.map(artwork => ({
      type: 'artwork',  action: 'created',
      item: artwork,
      date: artwork.createdAt
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))
   .slice(0, 10);

  res.json({
    success: true,
    message: 'تم جلب نشاط المستخدم بنجاح',
    data: {
      activity
    }
  });
});

/**
 * @desc    Export users data
 * @route   GET /api/admin/users/export
 * @access  Private (Admin, SuperAdmin)
 */
export const exportUsers = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  // جلب جميع المستخدمين بدون فلاتر
  const users = await userModel.find({ 
    role: { $in: ['user', 'artist'] }, 
    isDeleted: false 
  })
    .select('-password')
    .sort({ createdAt: -1 })
    .lean();

  try {
    const { generateUsersExcel } = await import('../../utils/excelGenerator.js');
    
    const excelBuffer = await generateUsersExcel(users);
    const fileName = `users_export_${new Date().toISOString().split('T')[0]}.xlsx`;

    // إعداد headers للتحميل
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', excelBuffer.length);

    res.send(excelBuffer);

  } catch (error) {
    console.error('❌ Error generating Excel file:', error);
    return res.status(500).json({
      success: false,
      message: 'فشل في إنشاء ملف Excel',
      error: error.message
    });
  }
}); 

/**
 * @desc    Get admin by ID
 * @route   GET /api/admin/admins/:id
 * @access  Private (SuperAdmin only)
 */
export const getAdminById = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الأدمن غير صالح',
      data: null
    });
  }

  const admin = await userModel.findById(id)
    .select('-password')
    .lean();

  if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  res.json({
    success: true,
    message: 'تم جلب بيانات الأدمن بنجاح',
    data: {
      _id: admin._id,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive,
      isVerified: admin.isVerified,
      profileImage: admin.profileImage,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt,
      lastActive: admin.lastActive
    }
  });
}); 

/**
 * @desc    Get artist details for admin dashboard
 * @route   GET /api/admin/artists/:artistId
 * @access  Private (Admin, SuperAdmin)
 */
export const getArtistDetails = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { artistId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الفنان غير صالح',
      data: null
    });
  }

  // جلب بيانات الفنان
  const artist = await userModel.findById(artistId)
    .select('-password')
    .lean();

  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود',
      data: null
    });
  }

  // جلب إحصائيات الفنان
  const [
    artworksCount,
    totalSales,
    completedOrders,
    avgRating,
    reviewsCount,
    reportsCount,
    followersCount
  ] = await Promise.all([
    // عدد الأعمال الفنية
    artworkModel.countDocuments({ artist: new mongoose.Types.ObjectId(artistId) }),
    
    // إجمالي المبيعات من الطلبات الخاصة
    specialRequestModel.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(artistId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$budget'] } } } }
    ]),
    
    // عدد الطلبات المكتملة
    specialRequestModel.countDocuments({ 
      artist: new mongoose.Types.ObjectId(artistId), 
      status: 'completed' 
    }),
    
    // متوسط التقييم
    reviewModel.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(artistId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]),
    
    // عدد التقييمات
    reviewModel.countDocuments({ artist: new mongoose.Types.ObjectId(artistId) }),
    
    // عدد البلاغات
    reportModel.countDocuments({ 
      targetUser: new mongoose.Types.ObjectId(artistId),
      status: { $ne: 'resolved' }
    }),
    
    // عدد المتابعين
    followModel.countDocuments({ following: new mongoose.Types.ObjectId(artistId) })
  ]);

  // جلب الأعمال الفنية مع pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const artworks = await artworkModel.find({ 
    artist: new mongoose.Types.ObjectId(artistId) 
  })
    .select('title price isAvailable images category createdAt isFeatured viewCount')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // جلب البلاغات
  const reports = await reportModel.find({ 
    targetUser: new mongoose.Types.ObjectId(artistId) 
  })
    .populate('reporter', 'displayName email')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // جلب التقييمات
  const reviews = await reviewModel.find({ 
    artist: new mongoose.Types.ObjectId(artistId) 
  })
    .populate('user', 'displayName')
    .populate('artwork', 'title')
    .sort({ createdAt: -1 })
    .limit(10)
    .lean();

  // جلب سجل النشاط
  const activities = await Promise.all([
    // تسجيلات الدخول
    tokenModel.find({ 
      user: new mongoose.Types.ObjectId(artistId),
      type: 'access'
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    
    // الطلبات الخاصة
    specialRequestModel.find({ 
      artist: new mongoose.Types.ObjectId(artistId) 
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean(),
    
    // التقييمات
    reviewModel.find({ 
      artist: new mongoose.Types.ObjectId(artistId) 
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()
  ]);

  // تنسيق سجل النشاط
  const formattedActivities = [
    ...activities[0].map(token => ({
      type: 'login',
      icon: '🔐',
      title: 'تسجيل دخول',
      description: `تم تسجيل الدخول من ${token.ip || 'جهاز غير معروف'}`,
      date: token.createdAt,
      status: 'info'
    })),
    ...activities[1].map(request => ({
      type: 'request',
      icon: request.requestType === 'custom_artwork' ? '🎨' : '🖼️',
      title: request.requestType === 'custom_artwork' 
        ? `طلب خاص #${request._id.toString().slice(-4)}`
        : `طلب عادي #${request._id.toString().slice(-4)}`,
      description: `طلب ${request.requestType === 'custom_artwork' ? 'خاص' : 'عادي'} بقيمة ${request.finalPrice || request.budget} ${request.currency}`,
      date: request.createdAt,
      status: request.status
    })),
    ...activities[2].map(review => ({
      type: 'review',
      icon: '⭐',
      title: 'تقييم جديد',
      description: `تم إرسال تقييم ${review.rating} نجوم للمنتج`,
      date: review.createdAt,
      status: 'new'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))
   .slice(0, 10);

  res.json({
    success: true,
    message: 'تم جلب تفاصيل الفنان بنجاح',
    data: {
      artist: {
        _id: artist._id,
        displayName: artist.displayName,
        email: artist.email,
        phone: artist.phone,
        bio: artist.bio,
        profileImage: artist.profileImage,
        location: artist.location,
        joinDate: artist.createdAt,
        isActive: artist.isActive,
        isVerified: artist.isVerified,
        socialMedia: artist.socialMedia
      },
      stats: {
        artworksCount,
        totalSales: totalSales[0]?.total || 0,
        completedOrders,
        avgRating: avgRating[0]?.avgRating || 0,
        reviewsCount,
        reportsCount,
        followersCount
      },
      artworks: {
        items: artworks.map(artwork => ({
          _id: artwork._id,
          title: artwork.title,
          price: artwork.price,
          isAvailable: artwork.isAvailable,
          isFeatured: artwork.isFeatured,
          viewCount: artwork.viewCount,
          images: artwork.images,
          category: artwork.category,
          createdAt: artwork.createdAt
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: artworksCount,
          pages: Math.ceil(artworksCount / parseInt(limit))
        }
      },
      reports: reports.map(report => ({
        _id: report._id,
        reporter: report.reporter,
        type: report.type,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt
      })),
      reviews: reviews.map(review => ({
        _id: review._id,
        user: review.user,
        artwork: review.artwork,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      })),
      activities: formattedActivities
    }
  });
});

/**
 * @desc    Get all artists for admin dashboard
 * @route   GET /api/admin/artists
 * @access  Private (Admin, SuperAdmin)
 */
export const getAllArtists = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // بناء الفلتر
  const filter = { 
    role: 'artist', 
    isDeleted: false 
  };

  if (status && ['active', 'inactive', 'banned'].includes(status)) {
    filter.isActive = status === 'active';
  }

  if (search) {
    filter.$or = [
      { displayName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  // حساب الـ pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);

  // جلب الفنانين مع الإحصائيات
  const artists = await userModel.find(filter)
    .select('-password')
    .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // جلب الإحصائيات لكل فنان
  const artistsWithStats = await Promise.all(
    artists.map(async (artist) => {
      const [
        artworksCount,
        totalSales,
        avgRating,
        reviewsCount,
        reportsCount
      ] = await Promise.all([
        artworkModel.countDocuments({ 
          artist: artist._id 
        }),
        specialRequestModel.aggregate([
          { $match: { artist: artist._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$budget'] } } } }
        ]),
        reviewModel.aggregate([
          { $match: { artist: artist._id } },
          { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]),
        reviewModel.countDocuments({ artist: artist._id }),
        reportModel.countDocuments({ 
          targetUser: artist._id,
          status: { $ne: 'resolved' }
        })
      ]);

      return {
        _id: artist._id,
        displayName: artist.displayName,
        email: artist.email,
        phone: artist.phone,
        profileImage: artist.profileImage,
        location: artist.location,
        isActive: artist.isActive,
        isVerified: artist.isVerified,
        joinDate: artist.createdAt,
        stats: {
          artworksCount,
          totalSales: totalSales[0]?.total || 0,
          avgRating: avgRating[0]?.avgRating || 0,
          reviewsCount,
          reportsCount
        }
      };
    })
  );

  // إجمالي عدد الفنانين
  const totalArtists = await userModel.countDocuments(filter);

  res.json({
    success: true,
    message: 'تم جلب قائمة الفنانين بنجاح',
    data: {
      artists: artistsWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalArtists,
        pages: Math.ceil(totalArtists / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Update artist status (activate/deactivate/ban)
 * @route   PATCH /api/admin/artists/:artistId/status
 * @access  Private (Admin, SuperAdmin)
 */
export const updateArtistStatus = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { artistId } = req.params;
  const { status, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الفنان غير صالح',
      data: null
    });
  }

  if (!['active', 'inactive', 'banned'].includes(status)) {
    return res.status(400).json({
      success: false,
      message: 'حالة غير صالحة',
      data: null
    });
  }

  const artist = await userModel.findById(artistId);
  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود',
      data: null
    });
  }

  // تحديث حالة الفنان
  artist.isActive = status === 'active';
  if (status === 'banned') {
    artist.isBanned = true;
    artist.banReason = reason;
  } else {
    artist.isBanned = false;
    artist.banReason = null;
  }

  await artist.save();

  res.json({
    success: true,
    message: `تم تحديث حالة الفنان بنجاح إلى ${status}`,
    data: {
      _id: artist._id,
      displayName: artist.displayName,
      isActive: artist.isActive,
      isBanned: artist.isBanned,
      banReason: artist.banReason,
      updatedAt: artist.updatedAt
    }
  });
}); 

/**
 * @desc    Get artist basic info and stats
 * @route   GET /api/admin/artists/:artistId/info
 * @access  Private (Admin, SuperAdmin)
 */
export const getArtistInfo = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { artistId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الفنان غير صالح',
      data: null
    });
  }

  // جلب بيانات الفنان
  const artist = await userModel.findById(artistId)
    .select('-password')
    .lean();

  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود',
      data: null
    });
  }

  // جلب إحصائيات الفنان
  const [
    artworksCount,
    totalSales,
    completedOrders,
    avgRating,
    reviewsCount,
    reportsCount,
    followersCount
  ] = await Promise.all([
    artworkModel.countDocuments({ artist: new mongoose.Types.ObjectId(artistId) }),
    specialRequestModel.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(artistId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: { $ifNull: ['$finalPrice', '$budget'] } } } }
    ]),
    specialRequestModel.countDocuments({ 
      artist: new mongoose.Types.ObjectId(artistId), 
      status: 'completed' 
    }),
    reviewModel.aggregate([
      { $match: { artist: new mongoose.Types.ObjectId(artistId) } },
      { $group: { _id: null, avgRating: { $avg: '$rating' } } }
    ]),
    reviewModel.countDocuments({ artist: new mongoose.Types.ObjectId(artistId) }),
    reportModel.countDocuments({ 
      targetUser: new mongoose.Types.ObjectId(artistId),
      status: { $ne: 'resolved' }
    }),
    followModel.countDocuments({ following: new mongoose.Types.ObjectId(artistId) })
  ]);

  res.json({
    success: true,
    message: 'تم جلب معلومات الفنان بنجاح',
    data: {
      artist: {
        _id: artist._id,
        displayName: artist.displayName,
        email: artist.email,
        phone: artist.phone,
        bio: artist.bio,
        profileImage: artist.profileImage,
        location: artist.location,
        joinDate: artist.createdAt,
        isActive: artist.isActive,
        isVerified: artist.isVerified,
        socialMedia: artist.socialMedia
      },
      stats: {
        artworksCount,
        totalSales: totalSales[0]?.total || 0,
        completedOrders,
        avgRating: avgRating[0]?.avgRating || 0,
        reviewsCount,
        reportsCount,
        followersCount
      }
    }
  });
});

/**
 * @desc    Get artist artworks with pagination
 * @route   GET /api/admin/artists/:artistId/artworks
 * @access  Private (Admin, SuperAdmin)
 */
export const getArtistArtworks = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { artistId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الفنان غير صالح',
      data: null
    });
  }

  // التحقق من وجود الفنان
  const artist = await userModel.findById(artistId).select('displayName');
  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود',
      data: null
    });
  }

  // جلب الأعمال الفنية مع pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const artworks = await artworkModel.find({ 
    artist: new mongoose.Types.ObjectId(artistId) 
  })
    .select('title price isAvailable images category createdAt isFeatured viewCount')
    .populate('category', 'name')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // إجمالي عدد الأعمال
  const totalArtworks = await artworkModel.countDocuments({ 
    artist: new mongoose.Types.ObjectId(artistId) 
  });

  res.json({
    success: true,
    message: 'تم جلب أعمال الفنان بنجاح',
    data: {
      artist: {
        _id: artist._id,
        displayName: artist.displayName
      },
      artworks: artworks.map(artwork => ({
        _id: artwork._id,
        title: artwork.title,
        price: artwork.price,
        isAvailable: artwork.isAvailable,
        isFeatured: artwork.isFeatured,
        viewCount: artwork.viewCount,
        images: artwork.images,
        category: artwork.category,
        createdAt: artwork.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalArtworks,
        pages: Math.ceil(totalArtworks / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get artist reports
 * @route   GET /api/admin/artists/:artistId/reports
 * @access  Private (Admin, SuperAdmin)
 */
export const getArtistReports = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { artistId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الفنان غير صالح',
      data: null
    });
  }

  // التحقق من وجود الفنان
  const artist = await userModel.findById(artistId).select('displayName');
  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود',
      data: null
    });
  }

  // جلب البلاغات مع pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const reports = await reportModel.find({ 
    targetUser: new mongoose.Types.ObjectId(artistId) 
  })
    .populate('reporter', 'displayName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // إجمالي عدد البلاغات
  const totalReports = await reportModel.countDocuments({ 
    targetUser: new mongoose.Types.ObjectId(artistId) 
  });

  res.json({
    success: true,
    message: 'تم جلب بلاغات الفنان بنجاح',
    data: {
      artist: {
        _id: artist._id,
        displayName: artist.displayName
      },
      reports: reports.map(report => ({
        _id: report._id,
        reporter: report.reporter,
        type: report.type,
        description: report.description,
        status: report.status,
        createdAt: report.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReports,
        pages: Math.ceil(totalReports / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get artist reviews
 * @route   GET /api/admin/artists/:artistId/reviews
 * @access  Private (Admin, SuperAdmin)
 */
export const getArtistReviews = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { artistId } = req.params;
  const { page = 1, limit = 10 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الفنان غير صالح',
      data: null
    });
  }

  // التحقق من وجود الفنان
  const artist = await userModel.findById(artistId).select('displayName');
  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود',
      data: null
    });
  }

  // جلب التقييمات مع pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const reviews = await reviewModel.find({ 
    artist: new mongoose.Types.ObjectId(artistId) 
  })
    .populate('user', 'displayName')
    .populate('artwork', 'title')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit))
    .lean();

  // إجمالي عدد التقييمات
  const totalReviews = await reviewModel.countDocuments({ 
    artist: new mongoose.Types.ObjectId(artistId) 
  });

  res.json({
    success: true,
    message: 'تم جلب تقييمات الفنان بنجاح',
    data: {
      artist: {
        _id: artist._id,
        displayName: artist.displayName
      },
      reviews: reviews.map(review => ({
        _id: review._id,
        user: review.user,
        artwork: review.artwork,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalReviews,
        pages: Math.ceil(totalReviews / parseInt(limit))
      }
    }
  });
});

/**
 * @desc    Get artist activity log
 * @route   GET /api/admin/artists/:artistId/activity
 * @access  Private (Admin, SuperAdmin)
 */
export const getArtistActivity = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { artistId } = req.params;
  const { limit = 20 } = req.query;

  if (!mongoose.Types.ObjectId.isValid(artistId)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الفنان غير صالح',
      data: null
    });
  }

  // التحقق من وجود الفنان
  const artist = await userModel.findById(artistId).select('displayName');
  if (!artist || artist.role !== 'artist') {
    return res.status(404).json({
      success: false,
      message: 'الفنان غير موجود',
      data: null
    });
  }

  // جلب سجل النشاط
  const activities = await Promise.all([
    // تسجيلات الدخول
    tokenModel.find({ 
      user: new mongoose.Types.ObjectId(artistId),
      type: 'access'
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 3)
      .lean(),
    
    // الطلبات الخاصة
    specialRequestModel.find({ 
      artist: new mongoose.Types.ObjectId(artistId) 
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 3)
      .lean(),
    
    // التقييمات
    reviewModel.find({ 
      artist: new mongoose.Types.ObjectId(artistId) 
    })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit) / 3)
      .lean()
  ]);

  // تنسيق سجل النشاط
  const formattedActivities = [
    ...activities[0].map(token => ({
      type: 'login',
      icon: '🔐',
      title: 'تسجيل دخول',
      description: `تم تسجيل الدخول من ${token.ip || 'جهاز غير معروف'}`,
      date: token.createdAt,
      status: 'info'
    })),
    ...activities[1].map(request => ({
      type: 'request',
      icon: request.requestType === 'custom_artwork' ? '🎨' : '🖼️',
      title: request.requestType === 'custom_artwork' 
        ? `طلب خاص #${request._id.toString().slice(-4)}`
        : `طلب عادي #${request._id.toString().slice(-4)}`,
      description: `طلب ${request.requestType === 'custom_artwork' ? 'خاص' : 'عادي'} بقيمة ${request.finalPrice || request.budget} ${request.currency}`,
      date: request.createdAt,
      status: request.status
    })),
    ...activities[2].map(review => ({
      type: 'review',
      icon: '⭐',
      title: 'تقييم جديد',
      description: `تم إرسال تقييم ${review.rating} نجوم للمنتج`,
      date: review.createdAt,
      status: 'new'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date))
   .slice(0, parseInt(limit));

  res.json({
    success: true,
    message: 'تم جلب سجل نشاط الفنان بنجاح',
    data: {
      artist: {
        _id: artist._id,
        displayName: artist.displayName
      },
      activities: formattedActivities,
      totalActivities: formattedActivities.length
    }
  });
}); 