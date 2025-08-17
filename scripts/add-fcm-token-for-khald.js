import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_EMAIL = 'khaldmrym769@gmail.com';

/**
 * إضافة FCM token تجريبي للمستخدم
 */
async function addFCMTokenForKhald() {
  try {
    console.log('🔧 إضافة FCM token تجريبي للمستخدم...');
    await ensureDatabaseConnection();
    
    // البحث عن المستخدم
    const user = await userModel.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log('❌ المستخدم غير موجود');
      return;
    }
    
    console.log('👤 معلومات المستخدم:', {
      id: user._id,
      name: user.displayName,
      email: user.email,
      currentFCMTokens: user.fcmTokens?.length || 0
    });
    
    // FCM token تجريبي (يجب استبداله ب token حقيقي من Flutter)
    const testFCMToken = 'eTOE-LvhQSeQauzOIvPsWP:APA91bF4JkfSCnHM5N1X6Q0BMIC_1234567890_TEST_TOKEN';
    
    // إضافة FCM token جديد
    const updatedUser = await userModel.findByIdAndUpdate(
      user._id,
      {
        $addToSet: { fcmTokens: testFCMToken }
      },
      { new: true }
    );
    
    console.log('✅ تم إضافة FCM token بنجاح!');
    console.log('📱 عدد FCM tokens الحالي:', updatedUser.fcmTokens.length);
    console.log('🔑 FCM Token الجديد:', testFCMToken);
    
    console.log('\n📋 جميع FCM tokens للمستخدم:');
    updatedUser.fcmTokens.forEach((token, index) => {
      console.log(`   ${index + 1}. ${token.substring(0, 50)}...`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في إضافة FCM token:', error);
  }
}

// تشغيل السكريبت
addFCMTokenForKhald();
