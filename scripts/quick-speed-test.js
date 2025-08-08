import { MongoClient } from 'mongodb';
import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import dotenv from 'dotenv';

dotenv.config();

// تهيئة Firebase Admin
let serviceAccount;
try {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} catch (error) {
  console.error('❌ خطأ في FIREBASE_SERVICE_ACCOUNT');
  process.exit(1);
}

initializeApp({
  credential: cert(serviceAccount)
});

const admin = getMessaging();
const client = new MongoClient(process.env.MONGODB_URI);
const TEST_USER_ID = '6887ed4e870053806f1d2023';

async function quickSpeedTest() {
  console.log('🚀 اختبار سرعة الإشعارات...\n');
  
  try {
    await client.connect();
    const db = client.db('arthub');
    const user = await db.collection('users').findOne({ _id: TEST_USER_ID });
    
    if (!user || !user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('❌ لا توجد FCM tokens');
      return;
    }

    console.log(`✅ المستخدم: ${user.displayName}`);
    console.log(`📱 عدد FCM tokens: ${user.fcmTokens.length}`);

    // اختبار سريع
    const startTime = Date.now();
    
    const message = {
      token: user.fcmTokens[0],
      notification: {
        title: 'اختبار السرعة ⚡',
        body: 'هذا اختبار لقياس سرعة الإشعارات',
      },
      android: {
        priority: 'high',
        notification: {
          channelId: 'arthub_channel',
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
          icon: '@mipmap/ic_launcher',
          color: '#2196F3',
        },
      },
      data: {
        type: 'speed_test',
        timestamp: Date.now().toString(),
      },
    };

    const result = await admin.send(message);
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`\n📊 النتائج:`);
    console.log(`   ✅ تم الإرسال بنجاح!`);
    console.log(`   ⏱️  الوقت: ${duration}ms`);
    console.log(`   🆔 Message ID: ${result}`);
    
    if (duration < 1000) {
      console.log(`   🚀 ممتاز! سرعة عالية (${duration}ms)`);
    } else if (duration < 3000) {
      console.log(`   ✅ جيد! سرعة مقبولة (${duration}ms)`);
    } else {
      console.log(`   ⚠️  بطيء! يحتاج تحسين (${duration}ms)`);
    }

  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await client.close();
    console.log('\n🏁 انتهى الاختبار');
  }
}

quickSpeedTest();
