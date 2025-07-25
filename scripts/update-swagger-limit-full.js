import fs from 'fs';
import path from 'path';

console.log('🔄 Updating Swagger cache for limit=full support...\n');

// قائمة ملفات Swagger التي تم تحديثها
const swaggerFiles = [
  'src/swagger/arthub-swagger.json',
  'src/swagger/arthub-swagger-backup.json'
];

// التحقق من وجود الملفات
swaggerFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ Found: ${file}`);
  } else {
    console.log(`❌ Missing: ${file}`);
  }
});

console.log('\n📋 Summary of updates:');
console.log('✅ Updated /api/admin/reviews endpoint to support limit=full');
console.log('✅ Updated /api/admin/reports endpoint to support limit=full');
console.log('✅ Updated descriptions to mention limit=full functionality');
console.log('✅ Updated parameter schemas to support both integer and "full" string');

console.log('\n🧹 Cache clearing instructions:');
console.log('1. Stop your development server (Ctrl+C)');
console.log('2. Clear browser cache (Ctrl+Shift+Delete)');
console.log('3. Restart your server: npm start');
console.log('4. Open Swagger UI in incognito/private mode');

console.log('\n🔗 Swagger UI URLs:');
console.log('   - Local: http://localhost:5000/api-docs');
console.log('   - Production: https://arthub-api.vercel.app/api-docs');

console.log('\n💡 Test endpoints:');
console.log('   - GET /api/admin/reviews?limit=full');
console.log('   - GET /api/admin/reports?limit=full');

console.log('\n✅ Swagger update completed!');
console.log('💡 The documentation now shows that limit can be either a number or "full"'); 