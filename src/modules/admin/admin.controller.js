// NEW VERSION 2025-07-18 - Admin Controller with Cloudinary Organized Folders
// FORCE DEPLOYMENT TRIGGER v1.0.4 - This comment forces Vercel to redeploy
// CLOUDINARY ORGANIZED FOLDERS SYSTEM - UPDATED 2025-07-19
import userModel from '../../../DB/models/user.model.js';
import tokenModel from '../../../DB/models/token.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

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
  
  // Get all users (clients and artists) - frontend will handle filtering, sorting, and pagination
  const users = await userModel.find({ 
    role: { $in: ['user', 'artist'] }, 
    isDeleted: false 
  })
  .select('-password')
  .lean();

  // Get basic statistics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.isActive).length;
  const bannedUsers = users.filter(user => !user.isActive).length;
  const clients = users.filter(user => user.role === 'user').length;
  const artists = users.filter(user => user.role === 'artist').length;

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
    message: 'تم جلب قائمة المستخدمين بنجاح',
    data: {
      users: formattedUsers,
      statistics: {
        totalUsers,
        activeUsers,
        bannedUsers,
        clients,
        artists
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
  const { action, reason } = req.body;

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

  // Update user status
  if (action === 'block') {
    user.isActive = false;
    user.blockReason = reason;
    user.blockedAt = new Date();
  } else if (action === 'unblock') {
    user.isActive = true;
    user.blockReason = null;
    user.blockedAt = null;
  }

  await user.save();

  res.json({
    success: true,
    message: action === 'block' ? 'تم حظر المستخدم بنجاح' : 'تم إلغاء حظر المستخدم بنجاح',
    data: {
      _id: user._id,
      displayName: user.displayName,
      isActive: user.isActive,
      blockReason: user.blockReason,
      blockedAt: user.blockedAt
    }
  });
});

/**
 * @desc    Send message to user
 * @route   POST /api/admin/users/:id/message
 * @access  Private (Admin, SuperAdmin)
 */
export const sendMessageToUser = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { message, type = 'email' } = req.body;

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

  if (type === 'email') {
    // Send email message
    const { sendEmail } = await import('../../utils/sendEmails.js');
    await sendEmail({
      to: user.email,
      subject: 'رسالة من إدارة المنصة',
      message: message
    });
  } else if (type === 'chat') {
    // Send chat message (implement chat functionality)
    const chatModel = (await import('../../../DB/models/chat.model.js')).default;
    const messageModel = (await import('../../../DB/models/message.model.js')).default;
    
    // Create or find chat between admin and user
    let chat = await chatModel.findOne({
      participants: [req.user._id, user._id]
    });

    if (!chat) {
      chat = await chatModel.create({
        participants: [req.user._id, user._id],
        type: 'admin'
      });
    }

    // Send message
    await messageModel.create({
      chat: chat._id,
      sender: req.user._id,
      content: message,
      type: 'text'
    });
  }

  res.json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح',
    data: {
      userId: user._id,
      messageType: type,
      sentAt: new Date()
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
  
  const users = await userModel.find({ 
    role: { $in: ['user', 'artist'] }, 
    isDeleted: false 
  })
  .select('-password')
  .lean();

  const csvData = users.map(user => ({
    ID: user._id,
    Name: user.displayName,
    Email: user.email,
    Phone: user.phoneNumber || '',   Role: user.role,
    Status: user.isActive ? 'Active' : 'Inactive',
    Verified: user.isVerified ? 'Yes' : 'No',
    Created: user.createdAt,
    LastActive: user.lastActive || ''
  }));

  res.json({
    success: true,
    message: 'تم تصدير بيانات المستخدمين بنجاح',
    data: {
      totalUsers: users.length,
      csvData
    }
  });
}); 