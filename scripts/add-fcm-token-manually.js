import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_USER_ID = '6887ed4e870053806f1d2023';
const FCM_TOKEN = 'fgY__wRrRHKS0mNmhtqrMg:APA91bHhEYJ8v32KA4nYcQI9ndj...'; // استبدل بـ FCM token الحقيقي

async function addFCMTokenManually() {
  try {
    console.log('🔧 Adding FCM Token Manually...');
    console.log('================================');
    console.log(`👤 User ID: ${TEST_USER_ID}`);
    
    // Step 1: Connect to Database
    console.log('\n1️⃣ Connecting to Database...');
    await ensureDatabaseConnection();
    console.log('✅ Database connected');
    
    // Step 2: Check User
    console.log('\n2️⃣ Checking User...');
    const user = await userModel.findById(TEST_USER_ID).select('fcmTokens displayName email');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User Info:', {
      name: user.displayName,
      email: user.email,
      currentTokens: user.fcmTokens?.length || 0
    });
    
    // Step 3: Add FCM Token
    console.log('\n3️⃣ Adding FCM Token...');
    
    // التحقق من أن Token غير موجود بالفعل
    if (user.fcmTokens && user.fcmTokens.includes(FCM_TOKEN)) {
      console.log('✅ FCM Token already exists');
      return;
    }
    
    // إضافة Token جديد
    const result = await userModel.findByIdAndUpdate(
      TEST_USER_ID,
      { 
        $addToSet: { fcmTokens: FCM_TOKEN } // $addToSet يضيف فقط إذا لم يكن موجود
      },
      { new: true }
    );
    
    console.log('✅ FCM Token added successfully!');
    console.log(`📱 Total FCM tokens: ${result.fcmTokens.length}`);
    
    // Step 4: Verify
    console.log('\n4️⃣ Verifying...');
    const updatedUser = await userModel.findById(TEST_USER_ID).select('fcmTokens');
    console.log(`✅ User now has ${updatedUser.fcmTokens.length} FCM token(s)`);
    
    console.log('\n🎉 FCM Token added successfully!');
    console.log('💡 You can now test notifications using:');
    console.log('   node scripts/test-notifications-final.js');
    
  } catch (error) {
    console.error('❌ Error adding FCM token:', error);
  }
}

// تعليمات للمستخدم
console.log('📋 Instructions:');
console.log('1. Replace FCM_TOKEN with the actual token from Flutter app');
console.log('2. Run this script to add the token manually');
console.log('3. Then test notifications');

addFCMTokenManually();
