import mongoose from 'mongoose';
import userModel from '../DB/models/user.model.js';
import { connectDB } from '../DB/connection.js';
import bcrypt from 'bcryptjs';

async function fixAdminPasswords() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    // Find all admin users
    const adminUsers = await userModel.find({ 
      role: { $in: ['admin', 'superadmin'] },
      isDeleted: false 
    }).select('+password');
    
    console.log(`Found ${adminUsers.length} admin users`);
    
    for (const admin of adminUsers) {
      console.log(`\nChecking admin: ${admin.email} (${admin.role})`);
      
      // Check if password is hashed
      if (!admin.password) {
        console.log(`❌ Admin ${admin.email} has no password`);
        continue;
      }
      
      // Try to detect if password is hashed (bcrypt hashes start with $2b$)
      if (!admin.password.startsWith('$2b$')) {
        console.log(`⚠️  Admin ${admin.email} has unhashed password, hashing now...`);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(admin.password, 12);
        admin.password = hashedPassword;
        await admin.save();
        
        console.log(`✅ Password hashed for ${admin.email}`);
      } else {
        console.log(`✅ Admin ${admin.email} has properly hashed password`);
      }
    }
    
    console.log('\n✅ Admin password check completed');
    
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

fixAdminPasswords(); 