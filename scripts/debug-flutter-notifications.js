import dotenv from 'dotenv';
import { sendPushNotificationToUser } from '../src/utils/pushNotifications.js';
import userModel from '../DB/models/user.model.js';
import { ensureDatabaseConnection } from '../src/utils/mongodbUtils.js';
import admin from '../src/utils/firebaseAdmin.js';

dotenv.config();

const TEST_USER_ID = process.env.TEST_USER_ID || '6887ed4e870053806f1d2023';

async function debugFlutterNotifications() {
  try {
    console.log('🔍 Debugging Flutter Notifications...');
    console.log('=====================================');
    
    // Step 1: Check Firebase Admin
    console.log('\n1️⃣ Checking Firebase Admin SDK...');
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      console.log(`   Project ID: ${projectId}`);
      console.log(`   Client Email: ${process.env.FIREBASE_CLIENT_EMAIL ? '✅ Set' : '❌ Missing'}`);
      console.log(`   Private Key: ${process.env.FIREBASE_PRIVATE_KEY ? '✅ Set' : '❌ Missing'}`);
      
      if (!admin.apps.length) {
        console.log('❌ Firebase Admin not initialized');
        return;
      }
      console.log('✅ Firebase Admin SDK is ready');
    } catch (error) {
      console.log('❌ Firebase Admin error:', error.message);
      return;
    }
    
    // Step 2: Check Database Connection
    console.log('\n2️⃣ Checking Database Connection...');
    await ensureDatabaseConnection();
    console.log('✅ Database connected');
    
    // Step 3: Check User and FCM Tokens
    console.log('\n3️⃣ Checking User and FCM Tokens...');
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
    
    if (!user.fcmTokens || user.fcmTokens.length === 0) {
      console.log('❌ No FCM tokens found for user');
      console.log('💡 Solution: User needs to register FCM token from Flutter app');
      return;
    }
    
    console.log(`✅ Found ${user.fcmTokens.length} FCM token(s)`);
    
    // Step 4: Test FCM Token Format
    console.log('\n4️⃣ Testing FCM Token Format...');
    const firstToken = user.fcmTokens[0];
    console.log(`   Token Length: ${firstToken.length} characters`);
    console.log(`   Token Format: ${firstToken.includes(':') ? '✅ Valid FCM format' : '❌ Invalid format'}`);
    console.log(`   Token Preview: ${firstToken.substring(0, 50)}...`);
    
    // Step 5: Test Direct FCM Send
    console.log('\n5️⃣ Testing Direct FCM Send...');
    try {
      const message = {
        token: firstToken,
        notification: {
          title: 'اختبار مباشر',
          body: 'هذا اختبار مباشر من Firebase Admin'
        },
        data: {
          type: 'test_direct',
          timestamp: Date.now().toString()
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channel_id: 'arthub_channel'
          }
        }
      };
      
      const response = await admin.messaging().send(message);
      console.log('✅ Direct FCM send successful:', response);
    } catch (error) {
      console.log('❌ Direct FCM send failed:', error.message);
      console.log('💡 This might indicate FCM token is invalid or expired');
    }
    
    // Step 6: Test Backend Notification Function
    console.log('\n6️⃣ Testing Backend Notification Function...');
    try {
      const result = await sendPushNotificationToUser(
        TEST_USER_ID,
        {
          title: 'اختبار من Backend',
          body: 'هذا اختبار من دالة sendPushNotificationToUser'
        },
        {
          type: 'test_backend',
          screen: 'TEST_SCREEN',
          timestamp: Date.now().toString()
        }
      );
      
      console.log('✅ Backend notification function result:', result);
    } catch (error) {
      console.log('❌ Backend notification function failed:', error.message);
    }
    
    // Step 7: Flutter Integration Check
    console.log('\n7️⃣ Flutter Integration Checklist...');
    console.log('📱 Flutter App should have:');
    console.log('   ✅ Firebase Core initialized');
    console.log('   ✅ Firebase Messaging initialized');
    console.log('   ✅ FCM token obtained and sent to backend');
    console.log('   ✅ Local notifications configured');
    console.log('   ✅ Background message handler');
    console.log('   ✅ Foreground message handler');
    console.log('   ✅ Notification tap handler');
    
    // Step 8: Common Issues
    console.log('\n8️⃣ Common Issues to Check:');
    console.log('🔍 Check if:');
    console.log('   - FCM token is being sent to backend correctly');
    console.log('   - Backend is receiving and storing FCM token');
    console.log('   - Notification permissions are granted');
    console.log('   - App is not in battery optimization mode');
    console.log('   - Internet connection is stable');
    console.log('   - Firebase project settings are correct');
    
    console.log('\n🎉 Debug complete!');
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugFlutterNotifications();
