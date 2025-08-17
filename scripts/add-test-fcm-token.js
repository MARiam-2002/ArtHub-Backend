import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_EMAIL = 'ahmedthemohsen@gmail.com';
const TEST_FCM_TOKEN = 'test-fcm-token-' + Date.now(); // This is just for testing

async function addTestFCMToken() {
  try {
    console.log('🔧 إضافة FCM token تجريبي...');
    await ensureDatabaseConnection();
    
    const user = await userModel.findOne({ email: TEST_EMAIL });
    if (!user) {
      console.log('❌ المستخدم غير موجود');
      return;
    }
    
    console.log(`👤 المستخدم: ${user.displayName} (${user.email})`);
    console.log(`📱 FCM Tokens الحالية: ${user.fcmTokens?.length || 0}`);
    
    // Add test FCM token
    if (!user.fcmTokens) {
      user.fcmTokens = [];
    }
    
    // Remove any existing test tokens
    user.fcmTokens = user.fcmTokens.filter(token => !token.startsWith('test-fcm-token-'));
    
    // Add new test token
    user.fcmTokens.push(TEST_FCM_TOKEN);
    
    await user.save();
    
    console.log('✅ تم إضافة FCM token تجريبي بنجاح');
    console.log(`📱 إجمالي FCM Tokens: ${user.fcmTokens.length}`);
    console.log('');
    console.log('🔧 ملاحظة: هذا token تجريبي فقط. يجب على تطبيق Flutter إرسال token حقيقي.');
    console.log('📱 تأكد من أن تطبيق Flutter متصل بالإنترنت ويقوم بإرسال FCM token.');
    
  } catch (error) {
    console.error('❌ خطأ في إضافة FCM token:', error.message);
  }
}

addTestFCMToken();
