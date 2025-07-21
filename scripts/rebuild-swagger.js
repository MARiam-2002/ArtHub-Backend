import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function rebuildSwagger() {
  try {
    console.log('🔧 إعادة بناء Swagger Documentation...');
    
    // قراءة ملف arthub-swagger.json
    const swaggerPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger.json');
    const swaggerData = JSON.parse(fs.readFileSync(swaggerPath, 'utf8'));
    
    console.log('✅ تم قراءة ملف Swagger بنجاح');
    
    // التحقق من نقطة users/export
    const exportPath = swaggerData.paths?.['/api/admin/users/export'];
    if (exportPath) {
      const parameters = exportPath.get?.parameters || [];
      const parameterNames = parameters.map(p => p.name);
      
      console.log('📊 عدد المعاملات:', parameters.length);
      console.log('📋 المعاملات الموجودة:', parameterNames);
      
      // التحقق من عدم وجود الفلاتر المحذوفة
      const removedFilters = ['type', 'role', 'status', 'dateFrom', 'dateTo'];
      const foundRemovedFilters = removedFilters.filter(filter => parameterNames.includes(filter));
      
      if (foundRemovedFilters.length > 0) {
        console.log('❌ الفلاتر المحذوفة لا تزال موجودة:', foundRemovedFilters);
      } else {
        console.log('✅ تم إزالة جميع الفلاتر المحذوفة بنجاح!');
      }
      
      // التحقق من وجود معامل format فقط
      if (parameterNames.length === 1 && parameterNames[0] === 'format') {
        console.log('✅ نقطة النهاية تحتوي على معامل format فقط');
      } else {
        console.log('❌ نقطة النهاية تحتوي على معاملات إضافية غير مطلوبة');
      }
    }
    
    // حفظ الملف مرة أخرى للتأكد من التحديث
    fs.writeFileSync(swaggerPath, JSON.stringify(swaggerData, null, 2));
    console.log('✅ تم حفظ ملف Swagger محدث');
    
    // إنشاء نسخة احتياطية
    const backupPath = path.join(__dirname, '..', 'src', 'swagger', 'arthub-swagger-backup.json');
    fs.writeFileSync(backupPath, JSON.stringify(swaggerData, null, 2));
    console.log('✅ تم إنشاء نسخة احتياطية');
    
    console.log('\n🎉 تم إنجاز إعادة بناء Swagger!');
    console.log('📋 يمكنك الآن فتح Swagger UI للتحقق من التحديثات');
    
  } catch (error) {
    console.error('❌ خطأ في إعادة بناء Swagger:', error);
  }
}

// تشغيل الإعادة البناء
rebuildSwagger(); 