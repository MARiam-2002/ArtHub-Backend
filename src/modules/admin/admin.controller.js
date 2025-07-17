import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

/**
 * @desc    Get all admins
 * @route   GET /api/v1/admin/admins
 * @access  Private (SuperAdmin only)
 */
export const getAdmins = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const admins = await userModel.find({ 
    role: { $in: ['admin', 'superadmin'] }, 
    isDeleted: false 
  })
  .select('-password')
  .lean();

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
      }))
    }
  });
});

/**
 * @desc    Create new admin
 * @route   POST /api/v1/admin/admins
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

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);
  // Create admin
  const admin = await userModel.create({
    displayName,
    email,
    password: hashedPassword,
    role,
    isActive: true,
    isVerified: true
  });

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الأدمن بنجاح',
    data: {
      _id: admin._id,
      displayName: admin.displayName,
      email: admin.email,
      role: admin.role,
      createdAt: admin.createdAt
    }
  });
});

/**
 * @desc    Update admin
 * @route   PUT /api/v1/admin/admins/:id
 * @access  Private (SuperAdmin only)
 */
export const updateAdmin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { displayName, email, role, isActive } = req.body;

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

  // Update fields
  if (displayName) admin.displayName = displayName;
  if (email) admin.email = email;
  if (role && ['admin', 'superadmin'].includes(role)) admin.role = role;
  if (typeof isActive === 'boolean') admin.isActive = isActive;

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
      updatedAt: admin.updatedAt
    }
  });
});

/**
 * @desc    Delete admin
 * @route   DELETE /api/v1/admin/admins/:id
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
  });

  if (!admin || !admin.isActive) {
    return res.status(401).json({
      success: false,
      message: 'بيانات الدخول غير صحيحة',
      data: null
    });
  }

  // Check password
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
      userId: admin._id, 
      email: admin.email, 
      role: admin.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: admin._id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
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
 * @route   GET /api/v1/admin/profile
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
 * @route   PUT /api/v1/admin/profile
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
 * @route   PUT /api/v1/admin/change-password
 * @access  Private (Admin, SuperAdmin)
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { newPassword } = req.body;
  const adminId = req.user._id;

  const admin = await userModel.findById(adminId);
  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
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
 * @route   PUT /api/v1/admin/admins/:id/change-password
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

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  admin.password = hashedPassword;
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
 * @desc    Get all users (clients and artists) - Simple version for frontend filtering
 * @route   GET /api/v1/users
 * @access  Private (Admin, SuperAdmin)
 */
export const getUsers = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  // Get all users (clients and artists) without pagination - frontend will handle filtering
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
 * @route   GET /api/v1/admin/users/:id
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
    .select('-password')    .lean();

  if (!user || ['admin', 'superadmin'].includes(user.role)) {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  // Get user statistics
  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;
  const reviewModel = (await import('../../../DB/models/review.model.js')).default;

  const [totalOrders, totalSpent, totalReviews, averageRating] = await Promise.all([
    specialRequestModel.countDocuments({ user: id }),
    specialRequestModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$price' } } }
    ]),
    reviewModel.countDocuments({ user: id }),
    reviewModel.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: null, avg: { $avg: '$rating' } } }
    ])
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
    }
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
 * @route   POST /api/v1/admin/users/:id/message
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
 * @route   GET /api/v1/admin/users/:id/reviews
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
 * @route   GET /api/v1/admin/users/export
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