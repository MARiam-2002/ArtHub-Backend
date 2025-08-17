import { sendPushNotificationToUser } from '../src/utils/pushNotifications.js';
import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_EMAIL = 'ahmedthemohsen@gmail.com';

async function quickTest() {
  try {
    console.log('🚀 اختبار سريع للإشعارات...');
    await ensureDatabaseConnection();
    
    const user = await userModel.findOne({ email: TEST_EMAIL }).select('_id fcmTokens displayName');
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('❌ لا يوجد FCM tokens');
      return;
    }
    
    console.log(`👤 ${user.displayName} - ${user.fcmTokens.length} token(s)`);
    
    const result = await sendPushNotificationToUser(
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
    
    if (result.success) {
      console.log('✅ تم الإرسال بنجاح!');
      console.log('📱 تحقق من تطبيق Flutter الآن');
    } else {
      console.log('❌ فشل في الإرسال:', result.error);
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

quickTest();
