import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugSwaggerJson() {
  try {
    console.log('🔍 تشخيص ملف swagger.json...');

    const swaggerPath = path.join(__dirname, '../src/swagger/swagger.json');
    
    if (!fs.existsSync(swaggerPath)) {
      console.error('❌ ملف swagger.json غير موجود');
      return;
    }

    // قراءة المحتوى
    const content = fs.readFileSync(swaggerPath, 'utf8');
    const lines = content.split('\n');
    
    console.log('📊 حجم الملف:', content.length, 'حرف');
    console.log('📊 عدد الأسطر:', lines.length);

    // البحث عن المشكلة في الموضع المحدد
    const errorPosition = 323784;
    console.log(`🔍 البحث حول الموضع ${errorPosition}...`);
    
    // حساب السطر التقريبي
    const charsBeforeError = content.substring(0, errorPosition);
    const linesBeforeError = charsBeforeError.split('\n').length;
    
    console.log(`📍 السطر التقريبي للخطأ: ${linesBeforeError}`);
    
    // عرض السطور المحيطة
    const start = Math.max(0, linesBeforeError - 10);
    const end = Math.min(lines.length, linesBeforeError + 10);
    
    console.log('\n🔍 السطور المحيطة بالخطأ:');
    for (let i = start; i < end; i++) {
      const marker = i === linesBeforeError - 1 ? '>>> ' : '    ';
      console.log(`${marker}${i + 1}: ${lines[i]}`);
    }

    // البحث عن الأقواس غير المتوازنة
    console.log('\n🔍 فحص الأقواس...');
    let braceCount = 0;
    let bracketCount = 0;
    
    for (let i = 0; i < content.length; i++) {
      const char = content[i];
      if (char === '{') braceCount++;
      if (char === '}') braceCount--;
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      
      if (braceCount < 0) {
        console.log(`❌ إغلاق } بدون فتح في الموضع ${i}`);
        break;
      }
      if (bracketCount < 0) {
        console.log(`❌ إغلاق ] بدون فتح في الموضع ${i}`);
        break;
      }
    }
    
    console.log(`📊 عدد الأقواس المفتوحة: ${braceCount}`);
    console.log(`📊 عدد الأقواس المربعة المفتوحة: ${bracketCount}`);

    // محاولة إصلاح تلقائي
    if (braceCount !== 0 || bracketCount !== 0) {
      console.log('\n🔧 محاولة إصلاح تلقائي...');
      
      let fixedContent = content;
      
      // إزالة الأقواس الإضافية في النهاية
      while (fixedContent.endsWith('}\n}') || fixedContent.endsWith('}\n}\n')) {
        fixedContent = fixedContent.slice(0, -2);
      }
      
      // إزالة الفواصل الزائدة
      fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1');
      
      try {
        JSON.parse(fixedContent);
        console.log('✅ تم إصلاح JSON بنجاح!');
        
        // حفظ الملف المصلح
        fs.writeFileSync(swaggerPath, fixedContent, 'utf8');
        console.log('💾 تم حفظ الملف المصلح');
        
      } catch (fixError) {
        console.error('❌ فشل في الإصلاح التلقائي:', fixError.message);
      }
    } else {
      console.log('✅ الأقواس متوازنة');
    }

    // التحقق من notifications endpoint
    if (content.includes('unreadOnly')) {
      console.log('⚠️  تم العثور على unreadOnly في الملف');
    } else {
      console.log('✅ unreadOnly تم إزالته بنجاح');
    }

    console.log('\n🎉 تم الانتهاء من التشخيص!');

  } catch (error) {
    console.error('❌ خطأ في التشخيص:', error);
  }
}

// تشغيل التشخيص
debugSwaggerJson(); 