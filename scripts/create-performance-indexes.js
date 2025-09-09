const mongoose = require('mongoose');
require('dotenv').config();

/**
 * سكريبت إنشاء فهارس الأداء لتحسين سرعة صفحة الهوم
 * هذا السكريبت ينشئ فهارس محسنة لجميع الجداول المستخدمة في صفحة الهوم
 */

async function createPerformanceIndexes() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    console.log('🚀 Creating performance indexes for home page optimization...');
    
    // ====== فهرسة الأعمال الفنية (artworks) ======
    console.log('📊 Creating indexes for artworks collection...');
    
    // فهرسة أساسية للأداء
    await db.collection('artworks').createIndex({ "isAvailable": 1, "isDeleted": 1 });
    console.log('  ✅ Created index: isAvailable + isDeleted');
    
    await db.collection('artworks').createIndex({ "isFeatured": 1, "isAvailable": 1 });
    console.log('  ✅ Created index: isFeatured + isAvailable');
    
    await db.collection('artworks').createIndex({ "category": 1, "isAvailable": 1 });
    console.log('  ✅ Created index: category + isAvailable');
    
    await db.collection('artworks').createIndex({ "artist": 1, "isAvailable": 1 });
    console.log('  ✅ Created index: artist + isAvailable');
    
    await db.collection('artworks').createIndex({ "likeCount": -1, "viewCount": -1 });
    console.log('  ✅ Created index: likeCount + viewCount (desc)');
    
    await db.collection('artworks').createIndex({ "averageRating": -1, "reviewsCount": -1 });
    console.log('  ✅ Created index: averageRating + reviewsCount (desc)');
    
    await db.collection('artworks').createIndex({ "createdAt": -1 });
    console.log('  ✅ Created index: createdAt (desc)');
    
    await db.collection('artworks').createIndex({ "reviewsCount": 1, "averageRating": -1 });
    console.log('  ✅ Created index: reviewsCount + averageRating');
    
    // فهرسة مركبة للأعمال الفنية
    await db.collection('artworks').createIndex({ 
      "isAvailable": 1, 
      "isFeatured": 1, 
      "likeCount": -1, 
      "viewCount": -1 
    });
    console.log('  ✅ Created compound index: isAvailable + isFeatured + likeCount + viewCount');
    
    await db.collection('artworks').createIndex({ 
      "isAvailable": 1, 
      "reviewsCount": 1, 
      "averageRating": -1 
    });
    console.log('  ✅ Created compound index: isAvailable + reviewsCount + averageRating');
    
    await db.collection('artworks').createIndex({ 
      "category": 1, 
      "isAvailable": 1, 
      "createdAt": -1 
    });
    console.log('  ✅ Created compound index: category + isAvailable + createdAt');
    
    // ====== فهرسة المستخدمين (users) ======
    console.log('👥 Creating indexes for users collection...');
    
    await db.collection('users').createIndex({ "role": 1, "isActive": 1, "isDeleted": 1 });
    console.log('  ✅ Created index: role + isActive + isDeleted');
    
    await db.collection('users').createIndex({ "role": 1, "isActive": 1, "createdAt": -1 });
    console.log('  ✅ Created index: role + isActive + createdAt');
    
    await db.collection('users').createIndex({ "isVerified": 1, "role": 1 });
    console.log('  ✅ Created index: isVerified + role');
    
    // فهرسة مركبة للمستخدمين
    await db.collection('users').createIndex({ 
      "role": 1, 
      "isActive": 1, 
      "isDeleted": 1, 
      "createdAt": -1 
    });
    console.log('  ✅ Created compound index: role + isActive + isDeleted + createdAt');
    
    // ====== فهرسة التقييمات (reviews) ======
    console.log('⭐ Creating indexes for reviews collection...');
    
    await db.collection('reviews').createIndex({ "artist": 1, "status": 1 });
    console.log('  ✅ Created index: artist + status');
    
    await db.collection('reviews').createIndex({ "artwork": 1, "status": 1 });
    console.log('  ✅ Created index: artwork + status');
    
    await db.collection('reviews').createIndex({ "status": 1, "createdAt": -1 });
    console.log('  ✅ Created index: status + createdAt');
    
    await db.collection('reviews').createIndex({ "rating": -1, "status": 1 });
    console.log('  ✅ Created index: rating + status');
    
    // فهرسة مركبة للتقييمات
    await db.collection('reviews').createIndex({ 
      "artist": 1, 
      "status": 1, 
      "createdAt": -1 
    });
    console.log('  ✅ Created compound index: artist + status + createdAt');
    
    await db.collection('reviews').createIndex({ 
      "artwork": 1, 
      "status": 1, 
      "rating": -1 
    });
    console.log('  ✅ Created compound index: artwork + status + rating');
    
    // ====== فهرسة المتابعات (follows) ======
    console.log('👥 Creating indexes for follows collection...');
    
    await db.collection('follows').createIndex({ "follower": 1, "following": 1 });
    console.log('  ✅ Created index: follower + following');
    
    await db.collection('follows').createIndex({ "following": 1 });
    console.log('  ✅ Created index: following');
    
    await db.collection('follows').createIndex({ "follower": 1 });
    console.log('  ✅ Created index: follower');
    
    // ====== فهرسة التصنيفات (categories) ======
    console.log('📂 Creating indexes for categories collection...');
    
    await db.collection('categories').createIndex({ "isActive": 1 });
    console.log('  ✅ Created index: isActive');
    
    await db.collection('categories').createIndex({ "createdAt": -1 });
    console.log('  ✅ Created index: createdAt');
    
    // ====== فهرسة الطلبات الخاصة (specialrequests) ======
    console.log('📋 Creating indexes for specialrequests collection...');
    
    await db.collection('specialrequests').createIndex({ "status": 1, "isDeleted": 1 });
    console.log('  ✅ Created index: status + isDeleted');
    
    await db.collection('specialrequests').createIndex({ "artist": 1, "status": 1 });
    console.log('  ✅ Created index: artist + status');
    
    await db.collection('specialrequests').createIndex({ "createdAt": -1, "status": 1 });
    console.log('  ✅ Created index: createdAt + status');
    
    await db.collection('specialrequests').createIndex({ "status": 1, "createdAt": -1 });
    console.log('  ✅ Created index: status + createdAt');
    
    // فهرسة مركبة للطلبات الخاصة
    await db.collection('specialrequests').createIndex({ 
      "status": 1, 
      "isDeleted": 1, 
      "createdAt": -1 
    });
    console.log('  ✅ Created compound index: status + isDeleted + createdAt');
    
    await db.collection('specialrequests').createIndex({ 
      "artist": 1, 
      "status": 1, 
      "createdAt": -1 
    });
    console.log('  ✅ Created compound index: artist + status + createdAt');
    
    console.log('🎉 All performance indexes created successfully!');
    console.log('📈 Home page performance should be significantly improved now!');
    
    // عرض إحصائيات الفهارس
    console.log('\n📊 Index Statistics:');
    const collections = ['artworks', 'users', 'reviews', 'follows', 'categories', 'specialrequests'];
    
    for (const collectionName of collections) {
      try {
        const indexes = await db.collection(collectionName).indexes();
        console.log(`  ${collectionName}: ${indexes.length} indexes`);
      } catch (error) {
        console.log(`  ${collectionName}: Error getting index count`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating performance indexes:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  createPerformanceIndexes();
}

module.exports = createPerformanceIndexes;
