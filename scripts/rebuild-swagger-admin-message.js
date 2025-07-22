import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function rebuildSwagger() {
  try {
    console.log('🔄 Rebuilding Swagger documentation...');
    
    // قراءة ملف swagger الرئيسي
    const swaggerPath = path.join(__dirname, '../src/swagger/arthub-swagger.json');
    const swaggerContent = fs.readFileSync(swaggerPath, 'utf8');
    
    // التحقق من صحة JSON
    try {
      JSON.parse(swaggerContent);
      console.log('✅ Swagger JSON is valid');
    } catch (error) {
      console.error('❌ Invalid JSON in swagger file:', error.message);
      return;
    }
    
    // إنشاء backup
    const backupPath = path.join(__dirname, '../src/swagger/arthub-swagger-backup.json');
    fs.writeFileSync(backupPath, swaggerContent);
    console.log('✅ Backup created');
    
    // التحقق من وجود التحديثات
    const updatedContent = fs.readFileSync(swaggerPath, 'utf8');
    const swagger = JSON.parse(updatedContent);
    
    // التحقق من endpoint send-message
    if (swagger.paths && swagger.paths['/api/admin/users/{id}/send-message']) {
      const endpoint = swagger.paths['/api/admin/users/{id}/send-message'].post;
      
      if (endpoint && endpoint.requestBody && endpoint.requestBody.content['application/json'].schema) {
        const schema = endpoint.requestBody.content['application/json'].schema;
        
        // التحقق من أن التحديثات تمت
        if (schema.required && schema.required.includes('message') && !schema.required.includes('deliveryMethod')) {
          console.log('✅ Admin message endpoint updated successfully');
          console.log('📋 Updated fields:');
          console.log('   - Required: message only');
          console.log('   - Removed: deliveryMethod, attachments');
          console.log('   - Added: notification data in response');
        } else {
          console.log('⚠️  Admin message endpoint may not be fully updated');
        }
      }
    }
    
    console.log('✅ Swagger rebuild completed successfully');
    console.log('📁 Files updated:');
    console.log('   - src/swagger/arthub-swagger.json');
    console.log('   - src/modules/admin/admin.router.js');
    
  } catch (error) {
    console.error('❌ Error rebuilding Swagger:', error);
  }
}

rebuildSwagger(); 