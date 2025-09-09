const mongoose = require('mongoose');
require('dotenv').config();

/**
 * سكريبت مراقبة أداء قاعدة البيانات لصفحة الهوم
 * هذا السكريبت يراقب استخدام الفهارس وأداء الاستعلامات
 */

async function monitorPerformance() {
  try {
    console.log('🚀 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB successfully!');
    
    const db = mongoose.connection.db;
    
    console.log('📊 Monitoring database performance...\n');
    
    // ====== مراقبة استخدام الفهارس ======
    console.log('🔍 Index Usage Statistics:');
    console.log('========================');
    
    const collections = ['artworks', 'users', 'reviews', 'follows', 'categories', 'specialrequests'];
    
    for (const collectionName of collections) {
      try {
        console.log(`\n📂 Collection: ${collectionName}`);
        const indexStats = await db.collection(collectionName).aggregate([
          { $indexStats: {} }
        ]).toArray();
        
        if (indexStats.length > 0) {
          indexStats.forEach(index => {
            const usage = index.accesses?.ops || 0;
            const name = index.name;
            const key = JSON.stringify(index.key);
            console.log(`  📈 ${name}: ${usage} operations`);
            console.log(`     Key: ${key}`);
          });
        } else {
          console.log('  ⚠️  No index statistics available');
        }
      } catch (error) {
        console.log(`  ❌ Error getting index stats for ${collectionName}: ${error.message}`);
      }
    }
    
    // ====== تحليل أداء الاستعلامات الرئيسية ======
    console.log('\n\n🔍 Query Performance Analysis:');
    console.log('==============================');
    
    // تحليل استعلام الأعمال المميزة
    console.log('\n📊 Featured Artworks Query:');
    try {
      const featuredQuery = await db.collection('artworks').find({ 
        isAvailable: true, 
        isFeatured: true 
      }).explain("executionStats");
      
      console.log(`  ⏱️  Execution Time: ${featuredQuery.executionStats.executionTimeMillis}ms`);
      console.log(`  📖 Documents Examined: ${featuredQuery.executionStats.totalDocsExamined}`);
      console.log(`  📄 Documents Returned: ${featuredQuery.executionStats.totalDocsReturned}`);
      console.log(`  🔍 Index Used: ${featuredQuery.executionStats.executionStages.indexName || 'Collection Scan'}`);
    } catch (error) {
      console.log(`  ❌ Error analyzing featured artworks query: ${error.message}`);
    }
    
    // تحليل استعلام الفنانين المميزين
    console.log('\n👥 Featured Artists Query:');
    try {
      const artistsQuery = await db.collection('users').find({ 
        role: 'artist', 
        isActive: true, 
        isDeleted: false 
      }).explain("executionStats");
      
      console.log(`  ⏱️  Execution Time: ${artistsQuery.executionStats.executionTimeMillis}ms`);
      console.log(`  📖 Documents Examined: ${artistsQuery.executionStats.totalDocsExamined}`);
      console.log(`  📄 Documents Returned: ${artistsQuery.executionStats.totalDocsReturned}`);
      console.log(`  🔍 Index Used: ${artistsQuery.executionStats.executionStages.indexName || 'Collection Scan'}`);
    } catch (error) {
      console.log(`  ❌ Error analyzing featured artists query: ${error.message}`);
    }
    
    // تحليل استعلام التصنيفات
    console.log('\n📂 Categories Query:');
    try {
      const categoriesQuery = await db.collection('categories').find({}).explain("executionStats");
      
      console.log(`  ⏱️  Execution Time: ${categoriesQuery.executionStats.executionTimeMillis}ms`);
      console.log(`  📖 Documents Examined: ${categoriesQuery.executionStats.totalDocsExamined}`);
      console.log(`  📄 Documents Returned: ${categoriesQuery.executionStats.totalDocsReturned}`);
      console.log(`  🔍 Index Used: ${categoriesQuery.executionStats.executionStages.indexName || 'Collection Scan'}`);
    } catch (error) {
      console.log(`  ❌ Error analyzing categories query: ${error.message}`);
    }
    
    // ====== إحصائيات قاعدة البيانات العامة ======
    console.log('\n\n📊 Database Statistics:');
    console.log('======================');
    
    try {
      const serverStatus = await db.runCommand({ serverStatus: 1 });
      console.log(`  🖥️  Server Version: ${serverStatus.version}`);
      console.log(`  📊 Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
      console.log(`  💾 Memory Usage: ${Math.round(serverStatus.mem.resident / 1024)} MB`);
      console.log(`  🔗 Connections: ${serverStatus.connections.current}/${serverStatus.connections.available}`);
    } catch (error) {
      console.log(`  ❌ Error getting server status: ${error.message}`);
    }
    
    // ====== تحليل حجم البيانات ======
    console.log('\n📏 Data Size Analysis:');
    console.log('=====================');
    
    for (const collectionName of collections) {
      try {
        const stats = await db.collection(collectionName).stats();
        console.log(`  📂 ${collectionName}:`);
        console.log(`     📄 Documents: ${stats.count.toLocaleString()}`);
        console.log(`     💾 Size: ${Math.round(stats.size / 1024 / 1024 * 100) / 100} MB`);
        console.log(`     📊 Avg Document Size: ${Math.round(stats.avgObjSize)} bytes`);
      } catch (error) {
        console.log(`  ❌ Error getting stats for ${collectionName}: ${error.message}`);
      }
    }
    
    // ====== توصيات التحسين ======
    console.log('\n\n💡 Performance Recommendations:');
    console.log('==============================');
    
    console.log('  🚀 For optimal home page performance:');
    console.log('     • Ensure all indexes are created and being used');
    console.log('     • Monitor slow queries and optimize them');
    console.log('     • Use Redis caching for frequently accessed data');
    console.log('     • Consider data archiving for old records');
    console.log('     • Monitor memory usage and scale if needed');
    
    console.log('\n  📈 To improve query performance:');
    console.log('     • Use compound indexes for complex queries');
    console.log('     • Avoid full collection scans');
    console.log('     • Use projection to limit returned fields');
    console.log('     • Consider aggregation pipelines for complex operations');
    
  } catch (error) {
    console.error('❌ Error monitoring performance:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// تشغيل السكريبت
if (require.main === module) {
  monitorPerformance();
}

module.exports = monitorPerformance;
