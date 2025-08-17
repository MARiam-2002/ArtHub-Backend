import dotenv from 'dotenv';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';

dotenv.config();

const TEST_EMAIL = 'ahmedthemohsen@gmail.com';

async function debugUserFCM() {
  try {
    console.log('🔍 التحقق التفصيلي من FCM tokens...');
    await ensureDatabaseConnection();
    
    // البحث عن المستخدم بجميع الحقول
    const user = await userModel.findOne({ email: TEST_EMAIL });
    
    if (!user) {
      console.log('❌ المستخدم غير موجود');
      return;
    }
    
    console.log('👤 معلومات المستخدم الكاملة:', {
      id: user._id,
      name: user.displayName,
      email: user.email,
      language: user.preferredLanguage,
      fcmTokens: user.fcmTokens,
      fcmTokensCount: user.fcmTokens?.length || 0,
      fcmTokensType: typeof user.fcmTokens,
      fcmTokensIsArray: Array.isArray(user.fcmTokens)
    });
    
    // التحقق من جميع الحقول في المستخدم
    console.log('\n📋 جميع الحقول في المستخدم:');
    Object.keys(user._doc).forEach(key => {
      const value = user._doc[key];
      console.log(`   ${key}: ${typeof value} = ${JSON.stringify(value).substring(0, 100)}...`);
    });
    
    // البحث عن المستخدم بطريقة أخرى
    console.log('\n🔍 البحث بطريقة أخرى...');
    const userById = await userModel.findById(user._id);
    console.log('FCM Tokens من البحث بالـ ID:', userById.fcmTokens);
    
    // البحث عن جميع المستخدمين الذين لديهم FCM tokens
    console.log('\n🔍 البحث عن جميع المستخدمين الذين لديهم FCM tokens...');
    const usersWithFCM = await userModel.find({
      fcmTokens: { $exists: true, $ne: [] }
    }).select('email fcmTokens');
    
    console.log(`✅ وجد ${usersWithFCM.length} مستخدم(ين) لديهم FCM tokens:`);
    usersWithFCM.forEach((u, index) => {
      console.log(`   ${index + 1}. ${u.email}: ${u.fcmTokens.length} token(s)`);
    });
    
  } catch (error) {
    console.error('❌ خطأ في التحقق:', error);
  }
}

debugUserFCM();
