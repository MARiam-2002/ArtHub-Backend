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
    role,
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
  if (role && role !== admin.role) {
    admin.role = role;
    admin.job = role === 'admin' ? 'مدير' : 'مدير عام';
  }

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

  // Prevent superadmin from being deleted
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
    data: null
  });
});

/**
 * @desc    Change admin password
 * @route   PUT /api/v1/admin/admins/:id/change-password
 * @access  Private (SuperAdmin)
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

  // Update password
  admin.password = newPassword;
  await admin.save();

  res.json({
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح',
    data: null
  });
});

/**
 * @desc    Admin login
 * @route   POST /api/v1/admin/login
 * @access  Public
 */
export const adminLogin = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { email, password } = req.body;

  // Find admin by email
  const admin = await userModel.findOne({ 
    email: email.toLowerCase(),
    role: { $in: ['admin', 'superadmin'] },
    isDeleted: false,
    isActive: true
  }).select('+password');

  if (!admin) {
    return res.status(401).json({
      success: false,
      message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      data: null
    });
  }

  // Check password
  const isPasswordValid = await admin.comparePassword(password);
  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
      data: null
    });
  }

  // Check if admin is active
  if (admin.status !== 'active') {
    return res.status(401).json({
      success: false,
      message: 'الحساب غير نشط',
      data: null
    });
  }

  // Update last active
  admin.lastActive = new Date();
  await admin.save();

  // Generate tokens (using the same logic as regular auth)
  const authController = await import('../auth/controller/auth.js');
  const { generateTokens } = authController;

  const tokens = await generateTokens(admin._id);

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
      tokens
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
  
  const admin = await userModel.findById(req.user._id).select('-password');

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
      email: admin.email,
      displayName: admin.displayName,
      role: admin.role,
      status: admin.status,
      isActive: admin.isActive,
      isVerified: admin.isVerified,
      lastActive: admin.lastActive,
      createdAt: admin.createdAt,
      updatedAt: admin.updatedAt
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
  
  const { displayName } = req.body;

  const admin = await userModel.findById(req.user._id);

  if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  if (displayName) {
    admin.displayName = displayName;
  }

  await admin.save();

  res.json({
    success: true,
    message: 'تم تحديث البيانات بنجاح',
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
 * @desc    Change own password
 * @route   PUT /api/v1/admin/change-password
 * @access  Private (Admin, SuperAdmin)
 */
export const changePassword = asyncHandler(async (req, res, next) => {
  await ensureDatabaseConnection();
  
  const { currentPassword, newPassword } = req.body;

  const admin = await userModel.findById(req.user._id).select('+password');

  if (!admin || !['admin', 'superadmin'].includes(admin.role)) {
    return res.status(404).json({
      success: false,
      message: 'الأدمن غير موجود',
      data: null
    });
  }

  // Verify current password
  const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'كلمة المرور الحالية غير صحيحة',
      data: null
    });
  }

  // Update password
  admin.password = newPassword;
  await admin.save();

  res.json({
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح',
    data: null
  });
}); 