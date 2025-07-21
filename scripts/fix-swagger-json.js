import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixSwaggerJson() {
  try {
    console.log('🔧 إصلاح ملف swagger.json...');

    const swaggerPath = path.join(__dirname, '../src/swagger/swagger.json');
    
    if (!fs.existsSync(swaggerPath)) {
      console.error('❌ ملف swagger.json غير موجود');
      return;
    }

    // قراءة المحتوى
    let content = fs.readFileSync(swaggerPath, 'utf8');
    
    console.log('📊 حجم الملف:', content.length, 'حرف');
    console.log('📊 عدد الأسطر:', content.split('\n').length);

    // التحقق من صحة JSON
    try {
      JSON.parse(content);
      console.log('✅ ملف JSON صحيح!');
    } catch (error) {
      console.error('❌ خطأ في JSON:', error.message);
      
      // محاولة إصلاح الأخطاء الشائعة
      console.log('🔧 محاولة إصلاح الأخطاء...');
      
      // إزالة الأقواس الإضافية
      content = content.replace(/}\s*}\s*}\s*,/g, '},');
      content = content.replace(/}\s*}\s*}\s*}/g, '}}');
      
      // إزالة الفواصل الزائدة
      content = content.replace(/,(\s*[}\]])/g, '$1');
      
      // إزالة الأسطر الفارغة الزائدة
      content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
      
      // التحقق مرة أخرى
      try {
        JSON.parse(content);
        console.log('✅ تم إصلاح JSON بنجاح!');
        
        // حفظ الملف المصلح
        fs.writeFileSync(swaggerPath, content, 'utf8');
        console.log('💾 تم حفظ الملف المصلح');
        
      } catch (secondError) {
        console.error('❌ فشل في إصلاح JSON:', secondError.message);
        
        // عرض السطور المحيطة بالخطأ
        const lines = content.split('\n');
        const errorLine = parseInt(secondError.message.match(/position (\d+)/)?.[1] || 0);
        
        if (errorLine > 0) {
          const start = Math.max(0, errorLine - 5);
          const end = Math.min(lines.length, errorLine + 5);
          
          console.log('\n🔍 السطور المحيطة بالخطأ:');
          for (let i = start; i < end; i++) {
            const marker = i === errorLine - 1 ? '>>> ' : '    ';
            console.log(`${marker}${i + 1}: ${lines[i]}`);
          }
        }
      }
    }

    // التحقق من notifications endpoint
    if (content.includes('unreadOnly')) {
      console.log('⚠️  تم العثور على unreadOnly في الملف');
    } else {
      console.log('✅ unreadOnly تم إزالته بنجاح');
    }

    console.log('\n🎉 تم الانتهاء من فحص وإصلاح الملف!');

  } catch (error) {
    console.error('❌ خطأ في إصلاح الملف:', error);
  }
}

// تشغيل الإصلاح
fixSwaggerJson(); 