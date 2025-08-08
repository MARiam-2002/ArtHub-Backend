import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

async function checkUsers() {
  try {
    console.log('🔍 Checking Available Users...');
    await ensureDatabaseConnection();
    
    const users = await userModel.find({}).select('_id displayName email fcmTokens').limit(10);
    
    if (users.length === 0) {
      console.log('❌ No users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} users:`);
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.displayName} (${user.email})`);
      console.log(`      ID: ${user._id}`);
      console.log(`      FCM Tokens: ${user.fcmTokens?.length || 0}`);
    });
    
    // Find users with FCM tokens
    const usersWithTokens = users.filter(user => user.fcmTokens && user.fcmTokens.length > 0);
    console.log(`\n📱 Users with FCM tokens: ${usersWithTokens.length}`);
    
    if (usersWithTokens.length > 0) {
      console.log('Use one of these IDs for testing:');
      usersWithTokens.forEach(user => {
        console.log(`   ${user._id} - ${user.displayName}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

checkUsers();
