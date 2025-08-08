import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

async function getUserFCMToken() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await ensureDatabaseConnection();
    console.log('✅ MongoDB connected successfully');

    // User ID المحدد
    const userId = '6887ed4e870053806f1d2023';
    
    console.log(`🎯 Getting FCM token for user: ${userId}`);

    const user = await userModel.findById(userId).select('fcmTokens displayName email');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log('👤 User Info:', {
      name: user.displayName,
      email: user.email
    });

    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('❌ No FCM tokens found for user');
      return;
    }

    console.log('📱 FCM Tokens:');
    user.fcmTokens.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token}`);
    });

    // إرجاع أول token للاستخدام
    console.log('\n🔑 Full FCM Token for testing:');
    console.log(user.fcmTokens[0]);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('🔍 Stack:', error.stack);
  }
}

getUserFCMToken();
