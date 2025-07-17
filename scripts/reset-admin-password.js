import mongoose from 'mongoose';
import userModel from '../DB/models/user.model.js';
import { connectDB } from '../DB/connection.js';

async function resetAdminPassword() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const adminEmail = 'newadmin@example.com';
    const newPassword = 'Password123!';
    
    console.log(`\n🔧 Resetting password for admin: ${adminEmail}`);
    
    // Find the admin user
    const admin = await userModel.findOne({ 
      email: adminEmail, 
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: false 
    });
    
    if (!admin) {
      console.log(`❌ Admin with email ${adminEmail} not found`);
      return;
    }
    
    console.log(`✅ Found admin: ${admin.email} (${admin.role})`);
    
    // Reset the password (will be hashed by pre-save hook)
    admin.password = newPassword;
    await admin.save();
    
    console.log(`✅ Password reset successfully for ${admin.email}`);
    console.log(`New password: ${newPassword}`);
    
    // Verify the password was hashed correctly
    const updatedAdmin = await userModel.findOne({ 
      email: adminEmail, 
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: false 
    }).select('+password');
    
    if (updatedAdmin && updatedAdmin.password && updatedAdmin.password.startsWith('$2b$')) {
      console.log('✅ Password was properly hashed');
    } else {
      console.log('❌ Password was not hashed properly');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    try {
      await mongoose.connection.close();
      console.log('✅ MongoDB connection closed');
    } catch (closeError) {
      console.log('⚠️ Error closing connection:', closeError.message);
    }
  }
}

resetAdminPassword(); 