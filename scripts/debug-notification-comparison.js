import { sendPushNotificationToUser, sendChatMessageNotification } from '../src/utils/pushNotifications.js';
import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_EMAIL = 'ahmedthemohsen@gmail.com';

async function debugNotificationComparison() {
  try {
    console.log('🔍 بدء تحليل مقارنة الإشعارات...');
    await ensureDatabaseConnection();
    
    const user = await userModel.findOne({ email: TEST_EMAIL }).select('_id fcmTokens displayName');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('❌ لا يوجد FCM tokens');
      return;
    }
    
    console.log(`👤 ${user.displayName} - ${user.fcmTokens.length} token(s)`);
    console.log('📱 FCM Tokens:', user.fcmTokens);
    
    // Test 1: Working test notification
    console.log('\n🧪 Test 1: Test Notification (Working)');
    const testResult = await sendPushNotificationToUser(
      user._id.toString(),
      {
        title: {
          ar: 'اختبار سريع',
          en: 'Quick Test'
        },
        body: {
          ar: 'هل تظهر هذه الرسالة؟',
          en: 'Do you see this message?'
        }
      },
      {
        screen: 'HOME',
        type: 'test',
        timestamp: Date.now().toString()
      }
    );
    
    console.log('Test Result:', testResult);
    
    // Test 2: Chat notification (same as chat controller)
    console.log('\n💬 Test 2: Chat Notification (Same as Chat Controller)');
    const chatResult = await sendChatMessageNotification(
      user._id.toString(),
      user._id.toString(),
      'Test Sender',
      'This is a test chat message',
      '507f1f77bcf86cd799439011' // dummy chat ID
    );
    
    console.log('Chat Result:', chatResult);
    
    // Test 3: Admin notification (same as admin controller)
    console.log('\n👨‍💼 Test 3: Admin Notification (Same as Admin Controller)');
    const adminResult = await sendPushNotificationToUser(
      user._id.toString(),
      {
        title: {
          ar: 'رسالة من إدارة المنصة',
          en: 'Message from Platform Administration'
        },
        body: {
          ar: 'هذه رسالة اختبار من الإدارة',
          en: 'This is a test message from administration'
        }
      },
      {
        type: 'admin_message',
        screen: 'NOTIFICATIONS',
        notificationId: '507f1f77bcf86cd799439012',
        adminId: '507f1f77bcf86cd799439013',
        hasAttachments: false,
        timestamp: Date.now().toString()
      }
    );
    
    console.log('Admin Result:', adminResult);
    
    console.log('\n📊 Summary:');
    console.log(`Test Notification: ${testResult.success ? '✅' : '❌'}`);
    console.log(`Chat Notification: ${chatResult.success ? '✅' : '❌'}`);
    console.log(`Admin Notification: ${adminResult.success ? '✅' : '❌'}`);
    
    if (testResult.success && (!chatResult.success || !adminResult.success)) {
      console.log('\n🔍 Analysis: Test works but chat/admin don\'t - checking payload differences...');
      
      console.log('\nTest Payload Structure:');
      console.log('- Title: Multilingual object');
      console.log('- Body: Multilingual object');
      console.log('- Data: screen, type, timestamp');
      
      console.log('\nChat Payload Structure:');
      console.log('- Uses sendChatMessageNotification function');
      console.log('- Includes chatId, senderId, unreadCount');
      
      console.log('\nAdmin Payload Structure:');
      console.log('- Title: Multilingual object');
      console.log('- Body: Multilingual object');
      console.log('- Data: type, screen, notificationId, adminId, hasAttachments');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

debugNotificationComparison();
