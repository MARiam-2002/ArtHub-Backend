import userModel from '../../../DB/models/user.model.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiFeatures } from '../../utils/apiFeatures.js';
import { ensureDatabaseConnection } from '../../utils/mongodbUtils.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

/**
 * @desc    Get all admins
 * @route   GET /api/v1/admin/admins
 * @access  Private (SuperAdmin)
 */
export const getAdmins = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const apiFeatures = new ApiFeatures(
    userModel.find({ role: { $in: ['admin', 'superadmin'] }, isDeleted: false }), 
    req.query
  )
    .paginate()
    .filter()
    .sort()
    .select()
    .search();

  const admins = await apiFeatures.mongooseQuery;
  const total = await userModel.countDocuments({ 
    role: { $in: ['admin', 'superadmin'] },
    isDeleted: false,
    ...apiFeatures.mongooseQuery.getFilter()
  });

  res.success({
    message: 'تم جلب قائمة الأدمن بنجاح',
    data: {
      admins: admins.map(admin => ({
        _id: admin._id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        status: admin.status,
        isActive: admin.isActive,
        isVerified: admin.isVerified,
        lastActive: admin.lastActive,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt
      })),
      total,
      page: apiFeatures.page,
      limit: apiFeatures.limit,
      totalPages: Math.ceil(total / apiFeatures.limit),
    },
  });
});

/**
 * @desc    Create new admin
 * @route   POST /api/v1/admin/admins
 * @access  Private (SuperAdmin)
 */
export const createAdmin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { email, password, displayName, role = 'admin' } = req.body;

  // Check if user already exists
  const existingUser = await userModel.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({
      success: false,
      message: 'البريد الإلكتروني مستخدم بالفعل',
      data: null
    });
  }

  // Validate role
  if (role !== 'admin' && role !== 'superadmin') {
    return res.status(400).json({
      success: false,
      message: 'نوع المستخدم يجب أن يكون admin أو superadmin',
      data: null
    });
  }

  // Create new admin
  const newAdmin = new userModel({
    email: email.toLowerCase(),
    password,
    displayName: displayName || email.split('@')[0],
    status: 'active',
    isActive: true,
    isVerified: true,
    job: role === 'admin' ? 'مدير' : 'مدير عام'
  });

  await newAdmin.save();

  res.status(201).json({
    success: true,
    message: 'تم إنشاء الأدمن بنجاح',
    data: {
      _id: newAdmin._id,
      email: newAdmin.email,
      displayName: newAdmin.displayName,
      role: newAdmin.role,
      status: newAdmin.status,
      isActive: newAdmin.isActive,
      isVerified: newAdmin.isVerified,
      createdAt: newAdmin.createdAt
    }
  });
});

/**
 * @desc    Update admin
 * @route   PUT /api/v1/admin/admins/:id
 * @access  Private (SuperAdmin)
 */
export const updateAdmin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { displayName, status, isActive, role } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف الأدمن غير صالح',
      data: null
    });
  }

  const admin = await userModel.findOne({ 
    _id: id, 
    role: { $in: ['admin', 'superadmin'] },
    isDeleted: false 
  });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Prevent superadmin from being demoted to admin
  if (admin.role === 'superadmin' && role === 'admin') {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن تغيير دور المدير العام',
      data: null
    });
  }

  // Update fields
  if (displayName) admin.displayName = displayName;
  if (status) admin.status = status;
  if (typeof isActive === 'boolean') admin.isActive = isActive;
  if (role && role !== admin.role) admin.role = role;
  if (role === 'admin') admin.job = 'مدير';
  else if (role === 'superadmin') admin.job = 'مدير عام';
  

  await admin.save();

  res.json({
    success: true,
    message: 'تم تحديث بيانات الأدمن بنجاح',
    data: {
      _id: admin._id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      status: admin.status,
      isActive: admin.isActive,
      isVerified: admin.isVerified,
      updatedAt: admin.updatedAt
    }
  });
});

/**
 * @desc    Delete admin (soft delete)
 * @route   DELETE /api/v1/admin/admins/:id
 * @access  Private (SuperAdmin)
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

  const admin = await userModel.findOne({ 
    _id: id, 
    role: { $in: ['admin', 'superadmin'] },
    isDeleted: false 
  });

  if (!admin) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Prevent deleting superadmin
  if (admin.role === 'superadmin') {
    return res.status(400).json({
      success: false,
      message: 'لا يمكن حذف المدير العام',
      data: null
    });
  }

  // Soft delete
  admin.isDeleted = true;
  admin.isActive = false;
  admin.status = 'inactive';
  await admin.save();

  res.json({
    success: true,
    message: 'تم حذف الأدمن بنجاح',
    data: {
      _id: admin._id,
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      status: admin.status,
      isActive: admin.isActive,
      deletedAt: admin.updatedAt
    }
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

  // Check if user exists and is admin
  const admin = await userModel.findOne({ 
    email: email.toLowerCase(),
    role: { $in: ['admin', 'superadmin'] },
    isDeleted: false
  });

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'بيانات الدخول غير صحيحة',
      data: null
    });
  }

  // Check if admin is active
  if (!admin.isActive) {
    return res.status(401).json({
      success: false,
      message: 'الحساب غير نشط',
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

  // Update last active
  admin.lastActive = new Date();
  await admin.save();

  // Generate tokens
  const accessToken = admin.generateAccessToken();
  const refreshToken = admin.generateRefreshToken();

  res.json({
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: {
      admin: {
        _id: admin._id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role,
        status: admin.status,
        isActive: admin.isActive,
        isVerified: admin.isVerified,
        lastActive: admin.lastActive
      },
      accessToken,
      refreshToken
    }
  });
});

/**
 * @desc    Change admin password
 * @route   PATCH /api/v1/admin/change-password
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
  const activeUsers = users.filter(user => user.status === 'active').length;
  const bannedUsers = users.filter(user => user.status === 'banned').length;
  const clients = users.filter(user => user.role === 'user').length;
  const artists = users.filter(user => user.role === 'artist').length;

  // Format users for admin view
  const formattedUsers = users.map(user => ({
    _id: user._id,
    displayName: user.displayName,
    email: user.email,
    phoneNumber: user.phoneNumber,
    role: user.role,
    status: user.status,
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

  if (!user || user.role === 'admin' || user.role === 'superadmin') {
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
    status: user.status,
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
  if (!user || user.role === 'admin' || user.role === 'superadmin') {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  // Update user status
  if (action === 'block') {
    user.status = 'banned';
    user.isActive = false;
    user.blockReason = reason;
    user.blockedAt = new Date();
    user.blockedBy = req.user._id;
  } else if (action === 'unblock') {
    user.status = 'active';
    user.isActive = true;
    user.blockReason = undefined;
    user.blockedAt = undefined;
    user.blockedBy = undefined;
  }

  await user.save();

  res.json({
    success: true,
    message: action === 'block' ? 'تم حظر المستخدم بنجاح' : 'تم إلغاء حظر المستخدم بنجاح',
    data: {
      _id: user._id,
      status: user.status,
      isActive: user.isActive,
      blockReason: user.blockReason,
      blockedAt: user.blockedAt
    }
  });
});

/**
 * @desc    Send message to user
 * @route   POST /api/v1/admin/users/:id/send-message
 * @access  Private (Admin, SuperAdmin)
 */
export const sendMessageToUser = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { id } = req.params;
  const { subject, message, deliveryMethod, attachments } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({
      success: false,
      message: 'معرف المستخدم غير صالح',
      data: null
    });
  }

  const user = await userModel.findById(id);
  if (!user || user.role === 'admin' || user.role === 'superadmin') {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  // Create message record
  const messageData = {
    from: req.user._id,
    to: user._id,
    subject,
    message,
    deliveryMethod,
    attachments: attachments || [],
    sentAt: new Date(),
    status: 'sent'
  };

  // Send via email if requested
  if (deliveryMethod === 'email' || deliveryMethod === 'both') {
    try {
      const { sendEmail } = await import('../../utils/sendEmails.js');
      await sendEmail({
        to: user.email,
        subject: `رسالة من إدارة المنصة: ${subject}`,
        html: `
          <h2>مرحباً ${user.displayName}</h2>
          <p>${message}</p>
          <hr>
          <p><small>هذه رسالة من إدارة منصة ArtHub</small></p>
        `
      });
      messageData.emailSent = true;
    } catch (error) {
      console.error('Email sending failed:', error);
      messageData.emailSent = false;
    }
  }

  // Send via chat if requested
  if (deliveryMethod === 'chat' || deliveryMethod === 'both') {
    try {
      const messageModel = (await import('../../../DB/models/message.model.js')).default;
      const chatModel = (await import('../../../DB/models/chat.model.js')).default;

      // Find or create admin-user chat
      let chat = await chatModel.findOne({
        participants: [req.user._id, user._id]
      });

      if (!chat) {
        chat = new chatModel({
          participants: [req.user._id, user._id],
          type: 'admin',
          createdBy: req.user._id
        });
        await chat.save();
      }

      // Create message
      const chatMessage = new messageModel({
        chat: chat._id,
        sender: req.user._id,
        content: message,
        messageType: 'text',
        isAdminMessage: true
      });
      await chatMessage.save();

      messageData.chatSent = true;
      messageData.chatId = chat._id;
    } catch (error) {
      console.error('Chat message sending failed:', error);
      messageData.chatSent = false;
    }
  }

  res.json({
    success: true,
    message: 'تم إرسال الرسالة بنجاح',
    data: {
      userId: user._id,
      deliveryMethod,
      emailSent: messageData.emailSent,
      chatSent: messageData.chatSent,
      sentAt: messageData.sentAt
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

  const user = await userModel.findById(id);
  if (!user || user.role === 'admin' || user.role === 'superadmin') {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  const specialRequestModel = (await import('../../../DB/models/specialRequest.model.js')).default;

  // Get all orders for this user
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
        artist: order.artist ? {
          _id: order.artist._id,
          displayName: order.artist.displayName,
          profileImage: order.artist.profileImage
        } : null,
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

  const user = await userModel.findById(id);
  if (!user || user.role === 'admin' || user.role === 'superadmin') {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  const reviewModel = (await import('../../../DB/models/review.model.js')).default;

  // Get all reviews by this user
  const reviews = await reviewModel.find({ user: id })
    .populate('artwork', 'title image')
    .populate('artist', 'displayName profileImage')
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
        artwork: review.artwork ? {
          _id: review.artwork._id,
          title: review.artwork.title,
          image: review.artwork.image
        } : null,
        artist: review.artist ? {
          _id: review.artist._id,
          displayName: review.artist.displayName,
          profileImage: review.artist.profileImage
        } : null,
        createdAt: review.createdAt
      }))
    }
  });
});

/**
 * @desc    Get user activity log
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

  const user = await userModel.findById(id);
  if (!user || user.role === 'admin' || user.role === 'superadmin') {
    return res.status(404).json({
      success: false,
      message: 'المستخدم غير موجود',
      data: null
    });
  }

  // Create sample activity log (in real implementation, you'd have an activity log model)
  const activities = [
    {
      _id: new mongoose.Types.ObjectId(),
      type: 'login',
      description: 'تم تسجيل الدخول',
      timestamp: new Date(),
      metadata: {
        ip: '192.168.1.1',
        location: 'القاهرة'
      }
    },
    {
      _id: new mongoose.Types.ObjectId(),
      type: 'order',
      description: 'تم إنشاء طلب جديد',
      timestamp: new Date(Date.now() - 86400000),
      metadata: {
        orderId: '1234',
        amount: 250
      }
    }
  ];

  res.json({
    success: true,
    message: 'تم جلب سجل نشاط المستخدم بنجاح',
    data: {
      activities: activities
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
  
  const { format = 'csv', role = 'all', status = 'all', dateFrom, dateTo } = req.query;

  // Build query
  let query = { 
    role: { $in: ['user', 'artist'] }, 
    isDeleted: false 
  };

  if (role !== 'all') query.role = role;
  if (status !== 'all') query.status = status;

  if (dateFrom || dateTo) {
    query.createdAt = {};
    if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
    if (dateTo) query.createdAt.$lte = new Date(dateTo);
  }

  const users = await userModel.find(query)
    .select('-password')    .lean();

  // Format data for export
  const exportData = users.map(user => ({
    ID: user._id.toString(),
    Name: user.displayName,
    Email: user.email,
    Phone: user.phoneNumber || '',
    Role: user.role === 'user' ? 'عميل' : 'فنان',
    Status: user.status === 'active' ? 'نشط' : user.status === 'banned' ? 'محظور' : 'غير نشط',
    'Join Date': user.createdAt.toISOString().split('T')[0],
    'Last Active': user.lastActive ? user.lastActive.toISOString().split('T')[0] : ''
  }));

  if (format === 'csv') {
    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=users-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } else {
    // For Excel, you'd use a library like xlsx
    res.json({
      success: true,
      message: 'تم تصدير بيانات المستخدمين بنجاح',
      data: exportData
    });
  }
}); 