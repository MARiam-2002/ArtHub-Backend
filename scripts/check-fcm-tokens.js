import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

async function checkFCMTokens() {
  try {
    console.log('🔍 فحص FCM tokens في قاعدة البيانات...');
    await ensureDatabaseConnection();
    
    // Get all users with FCM tokens
    const usersWithTokens = await userModel.find({
      fcmTokens: { $exists: true, $ne: [] }
    }).select('_id email displayName fcmTokens notificationSettings');
    
    console.log(`📊 عدد المستخدمين الذين لديهم FCM tokens: ${usersWithTokens.length}`);
    
    if (usersWithTokens.length === 0) {
      console.log('❌ لا يوجد مستخدمين لديهم FCM tokens');
      console.log('');
      console.log('🔧 الحلول المقترحة:');
      console.log('1. تأكد من أن تطبيق Flutter متصل بالإنترنت');
      console.log('2. تأكد من أن التطبيق طلب إذن الإشعارات');
      console.log('3. تأكد من أن Firebase تم تهيئته بشكل صحيح');
      console.log('4. تحقق من سجلات Flutter للتأكد من عدم وجود أخطاء');
      console.log('5. جرب إعادة تشغيل التطبيق');
      return;
    }
    
    console.log('');
    console.log('👥 المستخدمين الذين لديهم FCM tokens:');
    usersWithTokens.forEach((user, index) => {
      console.log(`${index + 1}. ${user.displayName || user.email}`);
      console.log(`   - FCM Tokens: ${user.fcmTokens.length}`);
      console.log(`   - Notification Settings: ${JSON.stringify(user.notificationSettings)}`);
      console.log('');
    });
    
    // Check specific test user
    const testUser = await userModel.findOne({ email: 'ahmedthemohsen@gmail.com' }).select('_id email displayName fcmTokens notificationSettings');
    if (testUser) {
      console.log('🧪 حالة المستخدم التجريبي:');
      console.log(`   - Email: ${testUser.email}`);
      console.log(`   - Display Name: ${testUser.displayName}`);
      console.log(`   - FCM Tokens: ${testUser.fcmTokens?.length || 0}`);
      console.log(`   - Notification Settings: ${JSON.stringify(testUser.notificationSettings)}`);
      
      if (!testUser.fcmTokens || testUser.fcmTokens.length === 0) {
        console.log('');
        console.log('⚠️  المستخدم التجريبي لا يحتوي على FCM tokens');
        console.log('🔧 يجب على تطبيق Flutter إرسال FCM token إلى الخادم');
      }
    } else {
      console.log('❌ المستخدم التجريبي غير موجود في قاعدة البيانات');
    }
    
  } catch (error) {
    console.error('❌ خطأ في فحص FCM tokens:', error.message);
  }
}

checkFCMTokens();
