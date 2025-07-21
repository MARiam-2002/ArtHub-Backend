import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function validateJson() {
  try {
    console.log('🔍 التحقق من صحة JSON...');

    const swaggerPath = path.join(__dirname, '../src/swagger/swagger.json');
    
    if (!fs.existsSync(swaggerPath)) {
      console.error('❌ ملف swagger.json غير موجود');
      return;
    }

    // قراءة المحتوى
    const content = fs.readFileSync(swaggerPath, 'utf8');
    
    try {
      JSON.parse(content);
      console.log('✅ ملف JSON صحيح!');
      console.log('📊 حجم الملف:', content.length, 'حرف');
      console.log('📊 عدد الأسطر:', content.split('\n').length);
      
      // التحقق من notifications endpoint
      if (content.includes('unreadOnly')) {
        console.log('⚠️  تم العثور على unreadOnly في الملف');
      } else {
        console.log('✅ unreadOnly تم إزالته بنجاح');
      }
      
    } catch (error) {
      console.error('❌ خطأ في JSON:', error.message);
    }

  } catch (error) {
    console.error('❌ خطأ في التحقق:', error);
  }
}

// تشغيل التحقق
validateJson(); 