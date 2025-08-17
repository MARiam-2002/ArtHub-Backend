import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_EMAIL = 'ahmedthemohsen@gmail.com';

async function checkSpecificUser() {
  try {
    console.log('🔍 Checking specific user...');
    await ensureDatabaseConnection();
    
    const user = await userModel.findOne({ email: TEST_EMAIL }).select('fcmTokens displayName email preferredLanguage _id');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User Info:', {
      id: user._id,
      name: user.displayName,
      email: user.email,
      language: user.preferredLanguage
    });
    
    console.log('\n📱 FCM Tokens:');
    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('❌ No FCM tokens found');
    } else {
      console.log(`✅ Found ${user.fcmTokens.length} FCM token(s):`);
      user.fcmTokens.forEach((token, index) => {
        console.log(`   ${index + 1}. ${token.substring(0, 50)}...`);
      });
    }
    
    // Check token format
    if (user.fcmTokens && user.fcmTokens.length > 0) {
      const firstToken = user.fcmTokens[0];
      console.log('\n🔍 Token Analysis:');
      console.log(`   Length: ${firstToken.length} characters`);
      console.log(`   Format: ${firstToken.includes(':') ? 'Valid FCM format' : 'Invalid format'}`);
      console.log(`   Starts with: ${firstToken.substring(0, 20)}...`);
    }
    
  } catch (error) {
    console.error('❌ Error checking user:', error);
  }
}

checkSpecificUser();
