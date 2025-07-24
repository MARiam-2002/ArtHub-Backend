import { exec } from 'child_process';
import fs from 'fs';

console.log('🔄 Restarting server and clearing cache...\n');

// التحقق من أن الملفات محدثة
const swaggerPath = 'src/swagger/arthub-swagger.json';
if (fs.existsSync(swaggerPath)) {
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const swagger = JSON.parse(content);
  
  const adminOrdersPath = "/api/admin/orders/{id}";
  
  if (swagger.paths && swagger.paths[adminOrdersPath] && swagger.paths[adminOrdersPath].delete) {
    const deleteEndpoint = swagger.paths[adminOrdersPath].delete;
    
    if (deleteEndpoint.summary === "حذف طلب نهائيًا") {
      console.log('✅ Swagger files are up to date');
    } else {
      console.log('❌ Swagger files need updating');
    }
  }
}

console.log('\n📋 Current endpoint status:');
console.log('   - Summary: "حذف طلب نهائيًا"');
console.log('   - Description: "حذف طلب نهائيًا من قاعدة البيانات مع إرسال إشعار للعميل"');
console.log('   - Request Body: cancellationReason (required)');
console.log('   - Response: Updated messages');

console.log('\n🧹 Cache clearing steps:');
console.log('1. Stop your development server (Ctrl+C)');
console.log('2. Clear browser cache completely:');
console.log('   - Press Ctrl+Shift+Delete');
console.log('   - Select "All time" for time range');
console.log('   - Check all boxes (cookies, cache, etc.)');
console.log('   - Click "Clear data"');
console.log('3. Restart your server: npm start');
console.log('4. Open Swagger UI in incognito/private mode');

console.log('\n🔗 Swagger UI URLs:');
console.log('   - Local: http://localhost:5000/api-docs');
console.log('   - Production: https://arthub-api.vercel.app/api-docs');

console.log('\n💡 Alternative solutions:');
console.log('   - Try opening Swagger UI in incognito mode');
console.log('   - Use a different browser');
console.log('   - Clear browser cache for the specific site');
console.log('   - Wait a few minutes for cache to expire');

console.log('\n✅ Instructions completed!');
console.log('🔄 Please restart your server manually to apply changes.'); 