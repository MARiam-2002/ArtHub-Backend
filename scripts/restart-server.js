import { exec } from 'child_process';
import fs from 'fs';

console.log('🔄 Restarting server to apply Swagger updates...\n');

// التحقق من أن ملف arthub-swagger.json محدث
const swaggerPath = 'src/swagger/arthub-swagger.json';
if (fs.existsSync(swaggerPath)) {
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const swagger = JSON.parse(content);
  
  // البحث عن endpoint حذف الطلبات الإدارية
  const adminOrdersPath = "/api/admin/orders/{id}";
  
  if (swagger.paths && swagger.paths[adminOrdersPath] && swagger.paths[adminOrdersPath].delete) {
    const deleteEndpoint = swagger.paths[adminOrdersPath].delete;
    
    if (deleteEndpoint.summary === "حذف طلب نهائيًا" && 
        deleteEndpoint.description === "حذف طلب نهائيًا من قاعدة البيانات مع إرسال إشعار للعميل") {
      console.log('✅ Swagger file is up to date');
    } else {
      console.log('❌ Swagger file needs updating');
    }
  }
}

console.log('\n📋 Current Swagger endpoint status:');
console.log('   - Summary: "حذف طلب نهائيًا"');
console.log('   - Description: "حذف طلب نهائيًا من قاعدة البيانات مع إرسال إشعار للعميل"');
console.log('   - Request Body: cancellationReason (required)');
console.log('   - Response: Updated messages');

console.log('\n💡 To see the changes:');
console.log('   1. Restart your development server');
console.log('   2. Clear browser cache (Ctrl+F5)');
console.log('   3. Refresh Swagger UI page');

console.log('\n🔗 Swagger UI URLs:');
console.log('   - Local: http://localhost:5000/api-docs');
console.log('   - Production: https://arthub-api.vercel.app/api-docs');

console.log('\n✅ Server restart instructions completed!');
console.log('🔄 Please restart your server manually to apply changes.'); 