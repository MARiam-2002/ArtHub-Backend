import mongoose from 'mongoose';
import userModel from '../DB/models/user.model.js';
import { connectDB } from '../DB/connection.js';
import bcrypt from 'bcrypt';

async function fixAdminIssues() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    console.log('\n🔍 Checking for admin users...');
    
    // Find all admin users
    const adminUsers = await userModel.find({ 
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: false 
    }).select('+password');
    
    console.log(`Found ${adminUsers.length} admin users`);
    
    for (const admin of adminUsers) {
      console.log(`\n📋 Checking admin: ${admin.email} (${admin.role})`);
      
      let needsUpdate = false;
      
      // Check if password exists
      if (!admin.password) {
        console.log(`❌ Admin ${admin.email} has no password`);
        needsUpdate = true;
      } else if (!admin.password.startsWith('$2b$')) {
        console.log(`⚠️  Admin ${admin.email} has unhashed password`);
        needsUpdate = true;
      } else {
        console.log(`✅ Admin ${admin.email} has properly hashed password`);
      }
      
      // Fix issues if needed
      if (needsUpdate) {
        console.log(`🔧 Fixing admin ${admin.email}...`);
        
        // Set a default password if none exists
        if (!admin.password) {
          admin.password = 'Admin123!';
        }
        
        // Re-hash the password properly
        const hashedPassword = await bcrypt.hash(admin.password, 12);
        admin.password = hashedPassword;
        
        await admin.save();
        console.log(`✅ Fixed admin ${admin.email}`);
      }
    }
    
    console.log('\n🧪 Testing admin login...');
    
    // Test with a known admin
    const testEmail = 'newadmin@example.com';
    const testPassword = 'Password123!';
    
    let testAdmin = await userModel.findOne({ 
      email: testEmail, 
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: false 
    }).select('+password');
    
    if (!testAdmin) {
      console.log(`Creating test admin: ${testEmail}`);
      testAdmin = await userModel.create({
        email: testEmail,
        password: testPassword,
        displayName: 'Test Admin',
        role: 'admin',
        isActive: true,
        isVerified: true
      });
    }
    
    // Test password verification
    testAdmin = await userModel.findOne({ 
      email: testEmail, 
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: false 
    }).select('+password');
    
    if (testAdmin && testAdmin.password) {
      const isPasswordValid = await bcrypt.compare(testPassword, testAdmin.password);
      console.log(`Password test result: ${isPasswordValid ? '✅ SUCCESS' : '❌ FAILED'}`);
    } else {
      console.log('❌ Test admin has no password');
    }
    
    console.log('\n✅ Admin issues check completed');
    
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

fixAdminIssues(); 