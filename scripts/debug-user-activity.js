import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function debugUserActivity() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Use the same connection method as the main app
    const { connectDB } = await import('../DB/connection.js');
    await connectDB();
    console.log('✅ Connected to database');

    const userId = '6872c6eb501ee86cc3c5b77c';
    console.log(`🔍 Checking data for user: ${userId}`);

    // Import models
    const userModel = (await import('../DB/models/user.model.js')).default;
    const specialRequestModel = (await import('../DB/models/specialRequest.model.js')).default;
    const reviewModel = (await import('../DB/models/review.model.js')).default;
    const tokenModel = (await import('../DB/models/token.model.js')).default;

    // Check user exists
    const user = await userModel.findById(userId).lean();
    console.log('\n👤 User Info:');
    console.log('User exists:', !!user);
    if (user) {
      console.log('Name:', user.displayName);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('Created:', user.createdAt);
    }

    // Check tokens (logins)
    console.log('\n🔐 Checking login tokens...');
    const tokens = await tokenModel.find({ 
      user: new mongoose.Types.ObjectId(userId), 
      type: 'access' 
    }).sort({ createdAt: -1 }).lean();
    console.log('Login tokens found:', tokens.length);
    tokens.forEach((token, index) => {
      console.log(`  ${index + 1}. Date: ${token.createdAt}, IP: ${token.ip || 'N/A'}`);
    });

    // Check special requests (using sender field - FIXED)
    console.log('\n🛒 Checking special requests (sender field)...');
    const requests = await specialRequestModel.find({ 
      sender: new mongoose.Types.ObjectId(userId) 
    }).sort({ createdAt: -1 }).lean();
    console.log('Special requests found:', requests.length);
    requests.forEach((request, index) => {
      console.log(`  ${index + 1}. Type: ${request.requestType}, Status: ${request.status}, Date: ${request.createdAt}`);
    });

    // Check reviews
    console.log('\n⭐ Checking reviews...');
    const reviews = await reviewModel.find({ 
      user: new mongoose.Types.ObjectId(userId) 
    }).sort({ createdAt: -1 }).lean();
    console.log('Reviews found:', reviews.length);
    reviews.forEach((review, index) => {
      console.log(`  ${index + 1}. Rating: ${review.rating}, Date: ${review.createdAt}`);
    });

    // Check if user is actually a sender in special requests
    console.log('\n🔍 Checking if user is sender in special requests...');
    const senderRequests = await specialRequestModel.find({ 
      sender: new mongoose.Types.ObjectId(userId) 
    }).sort({ createdAt: -1 }).lean();
    console.log('Requests where user is sender:', senderRequests.length);
    senderRequests.forEach((request, index) => {
      console.log(`  ${index + 1}. Type: ${request.requestType}, Status: ${request.status}, Date: ${request.createdAt}`);
    });

    console.log('\n📊 Summary:');
    console.log(`- Login tokens: ${tokens.length}`);
    console.log(`- Special requests (sender field): ${requests.length}`);
    console.log(`- Special requests (sender field): ${senderRequests.length}`);
    console.log(`- Reviews: ${reviews.length}`);

    // Test the actual query that the endpoint uses (FIXED)
    console.log('\n🧪 Testing the exact queries from the endpoint...');
    
    const [recentLogins, recentOrders, recentReviews] = await Promise.all([
      tokenModel.find({ user: new mongoose.Types.ObjectId(userId), type: 'access' })
        .sort({ createdAt: -1 })
        .lean(),
      specialRequestModel.find({ sender: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean(),
      reviewModel.find({ user: new mongoose.Types.ObjectId(userId) })
        .sort({ createdAt: -1 })
        .lean()
    ]);

    console.log('Results from endpoint queries:');
    console.log('- Recent logins:', recentLogins.length);
    console.log('- Recent orders:', recentOrders.length);
    console.log('- Recent reviews:', recentReviews.length);

    // Format activities like the endpoint does
    const formattedActivities = [
      ...recentLogins.map(token => ({
        type: 'login',
        icon: '🔐',
        title: 'تسجيل دخول',
        description: `تم تسجيل الدخول من ${token.ip || 'جهاز غير معروف'}`,
        date: token.createdAt,
        status: 'info'
      })),
      ...recentOrders.map(order => ({
        type: 'request',
        icon: order.requestType === 'custom_artwork' ? '🎨' : '🛒',
        title: order.requestType === 'custom_artwork' 
          ? `طلب خاص #${order._id.toString().slice(-4)}`
          : `طلب عادي #${order._id.toString().slice(-4)}`,
        description: `طلب ${order.requestType === 'custom_artwork' ? 'خاص' : 'عادي'} بقيمة ${order.finalPrice || order.budget} ${order.currency}`,
        date: order.createdAt,
        status: order.status
      })),
      ...recentReviews.map(review => ({
        type: 'review',
        icon: '⭐',
        title: 'تقييم جديد',
        description: `تم إرسال تقييم ${review.rating} نجوم للمنتج`,
        date: review.createdAt,
        status: 'new'
      }))
    ].sort((a, b) => new Date(b.date) - new Date(a.date));

    console.log('\n🎯 Final formatted activities:', formattedActivities.length);
    formattedActivities.forEach((activity, index) => {
      console.log(`  ${index + 1}. ${activity.title} - ${activity.description} - ${activity.date}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
}

debugUserActivity().catch(console.error); 