import mongoose from 'mongoose';
import userModel from '../DB/models/user.model.js';
import { connectDB } from '../DB/connection.js';

async function createSuperAdmin() {
  try {
    console.log('🔄 Connecting to database...');
    await connectDB();
    
    const superAdminData = {
      email: 'superadmin@arthub.com',
      password: 'SuperAdmin123!',
      displayName: 'مدير عام',
      role: 'superadmin',
      status: 'active',
      isActive: true,
      isVerified: true,
      job: 'مدير عام'
    };
    
    // Check if superadmin already exists
    const existingSuperAdmin = await userModel.findOne({ 
      email: superAdminData.email,
      role: 'superadmin'
    });
    
    if (existingSuperAdmin) {
      console.log('⚠️  SuperAdmin already exists');
      console.log(`Email: ${existingSuperAdmin.email}`);
      console.log(`Role: ${existingSuperAdmin.role}`);
      return;
    }
    
    // Create superadmin
    const superAdmin = new userModel(superAdminData);
    await superAdmin.save();
    
    console.log('✅ SuperAdmin created successfully');
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Password: ${superAdminData.password}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log('\n📝 You can now login to the admin dashboard with these credentials');
    
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

createSuperAdmin(); 