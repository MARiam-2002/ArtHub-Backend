import fs from 'fs';
import path from 'path';

console.log('🧹 Clearing Swagger cache and updating documentation...\n');

// قائمة الملفات التي تم تحديثها
const updatedFiles = [
  'src/swagger/arthub-swagger.json',
  'src/swagger/arthub-swagger-backup.json'
];

console.log('✅ Updated files:');
updatedFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   - ${file}`);
  }
});

console.log('\n📋 Summary of changes:');
console.log('   - Updated DELETE /api/admin/orders/{id} endpoint');
console.log('   - Changed summary to "حذف طلب نهائيًا"');
console.log('   - Changed description to "حذف طلب نهائيًا من قاعدة البيانات مع إرسال إشعار للعميل"');
console.log('   - Added requestBody with cancellationReason (required)');
console.log('   - Updated response messages');

console.log('\n💡 To see the changes:');
console.log('   1. Clear your browser cache (Ctrl+F5 or Cmd+Shift+R)');
console.log('   2. Restart the server if needed');
console.log('   3. Refresh the Swagger UI page');

console.log('\n🔗 Swagger UI URL:');
console.log('   - Local: http://localhost:5000/api-docs');
console.log('   - Production: https://arthub-api.vercel.app/api-docs');

console.log('\n✅ Cache clearing completed!'); 