import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';
import dotenv from 'dotenv';

dotenv.config();

async function debugNotificationSettings() {
  try {
    console.log('🔍 فحص إعدادات الإشعارات...');
    await ensureDatabaseConnection();
    
    // فحص المستخدمين الذين لا يملكون إعدادات إشعارات
    const usersWithoutSettings = await userModel.find({
      $or: [
        { notificationSettings: { $exists: false } },
        { notificationSettings: null }
      ]
    }).select('_id email displayName notificationSettings fcmTokens');
    
    console.log(`📊 وجد ${usersWithoutSettings.length} مستخدم بدون إعدادات إشعارات`);
    
    if (usersWithoutSettings.length > 0) {
      console.log('\n👥 المستخدمين الذين يحتاجون إصلاح:');
      usersWithoutSettings.forEach(user => {
        console.log(`- ${user.displayName} (${user.email}): ${user.fcmTokens?.length || 0} FCM tokens`);
      });
      
      // إصلاح إعدادات الإشعارات
      console.log('\n🔧 إصلاح إعدادات الإشعارات...');
      const updateResult = await userModel.updateMany(
        {
          $or: [
            { notificationSettings: { $exists: false } },
            { notificationSettings: null }
          ]
        },
        {
          $set: {
            notificationSettings: {
              enablePush: true,
              enableEmail: true,
              muteChat: false
            }
          }
        }
      );
      
      console.log(`✅ تم إصلاح ${updateResult.modifiedCount} مستخدم`);
    }
    
    // فحص المستخدمين مع FCM tokens
    const usersWithTokens = await userModel.find({
      fcmTokens: { $exists: true, $ne: [], $size: { $gt: 0 } }
    }).select('_id email displayName notificationSettings fcmTokens');
    
    console.log(`\n📱 وجد ${usersWithTokens.length} مستخدم مع FCM tokens`);
    
    // فحص إعدادات الإشعارات للمستخدمين مع tokens
    const usersWithDisabledPush = usersWithTokens.filter(user => 
      !user.notificationSettings?.enablePush
    );
    
    console.log(`⚠️  ${usersWithDisabledPush.length} مستخدم مع FCM tokens ولكن push notifications معطلة`);
    
    if (usersWithDisabledPush.length > 0) {
      console.log('\n🔧 تفعيل push notifications للمستخدمين مع FCM tokens...');
      const userIds = usersWithDisabledPush.map(u => u._id);
      
      const enableResult = await userModel.updateMany(
        { _id: { $in: userIds } },
        {
          $set: {
            'notificationSettings.enablePush': true
          }
        }
      );
      
      console.log(`✅ تم تفعيل push notifications لـ ${enableResult.modifiedCount} مستخدم`);
    }
    
    // فحص شامل
    const totalUsers = await userModel.countDocuments();
    const usersWithPushEnabled = await userModel.countDocuments({
      'notificationSettings.enablePush': true
    });
    const usersWithFCMTokens = await userModel.countDocuments({
      fcmTokens: { $exists: true, $ne: [], $size: { $gt: 0 } }
    });
    
    console.log('\n📊 إحصائيات شاملة:');
    console.log(`- إجمالي المستخدمين: ${totalUsers}`);
    console.log(`- المستخدمين مع push notifications مفعلة: ${usersWithPushEnabled}`);
    console.log(`- المستخدمين مع FCM tokens: ${usersWithFCMTokens}`);
    
    // اختبار إشعار سريع
    const testUser = await userModel.findOne({
      fcmTokens: { $exists: true, $ne: [], $size: { $gt: 0 } },
      'notificationSettings.enablePush': true
    }).select('_id email displayName fcmTokens notificationSettings');
    
    if (testUser) {
      console.log(`\n🧪 اختبار إشعار سريع للمستخدم: ${testUser.displayName}`);
      
      const { sendPushNotificationToUser } = await import('../src/utils/pushNotifications.js');
      const result = await sendPushNotificationToUser(
        testUser._id.toString(),
        {
          title: {
            ar: 'اختبار إعدادات الإشعارات',
            en: 'Notification Settings Test'
          },
          body: {
            ar: 'إذا وصلتك هذه الرسالة، فالإعدادات تعمل بشكل صحيح',
            en: 'If you received this message, the settings are working correctly'
          }
        },
        {
          type: 'test',
          screen: 'HOME',
          timestamp: Date.now().toString()
        }
      );
      
      if (result.success) {
        console.log('✅ اختبار الإشعار نجح!');
        console.log(`📊 تم إرسال ${result.successCount} إشعار بنجاح`);
      } else {
        console.log('❌ اختبار الإشعار فشل:', result.error);
      }
    } else {
      console.log('⚠️  لا يوجد مستخدمين للاختبار');
    }
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  }
}

debugNotificationSettings();
