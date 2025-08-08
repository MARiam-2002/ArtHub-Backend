import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_USER_ID = process.env.TEST_USER_ID || '6887ed4e870053806f1d2023';

async function checkFCMTokens() {
  try {
    console.log('🔍 Checking FCM Tokens...');
    await ensureDatabaseConnection();
    
    const user = await userModel.findById(TEST_USER_ID).select('fcmTokens displayName email preferredLanguage');
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('👤 User Info:', {
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
    console.error('❌ Error checking FCM tokens:', error);
  }
}

checkFCMTokens();
