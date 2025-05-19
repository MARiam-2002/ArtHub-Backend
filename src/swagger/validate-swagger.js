import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قراءة ملف Swagger JSON
const swaggerFilePath = path.join(__dirname, 'swagger.json');
console.log(`قراءة ملف Swagger من: ${swaggerFilePath}`);

try {
  const swaggerContent = fs.readFileSync(swaggerFilePath, 'utf8');
  const swaggerObject = JSON.parse(swaggerContent);
  
  // التحقق من وجود البيانات الضرورية
  if (!swaggerObject.openapi) {
    console.error('خطأ: الملف لا يحتوي على إصدار OpenAPI');
    process.exit(1);
  }
  
  // التحقق من وجود Special Requests و Reports
  const hasSpecialRequests = swaggerObject.paths && 
    Object.keys(swaggerObject.paths).some(path => 
      path.includes('special-requests')
    );
  
  const hasReports = swaggerObject.paths && 
    Object.keys(swaggerObject.paths).some(path => 
      path.includes('reports')
    );
  
  console.log(`Special Requests موجودة: ${hasSpecialRequests ? 'نعم' : 'لا'}`);
  console.log(`Reports موجودة: ${hasReports ? 'نعم' : 'لا'}`);
  
  // التحقق من وجود نماذج Special Requests و Reports
  const hasSpecialRequestSchema = swaggerObject.components?.schemas?.SpecialRequest != null;
  const hasReportSchema = swaggerObject.components?.schemas?.Report != null;
  
  console.log(`نموذج Special Request موجود: ${hasSpecialRequestSchema ? 'نعم' : 'لا'}`);
  console.log(`نموذج Report موجود: ${hasReportSchema ? 'نعم' : 'لا'}`);
  
  // إحصائيات
  const pathCount = Object.keys(swaggerObject.paths || {}).length;
  const schemaCount = Object.keys(swaggerObject.components?.schemas || {}).length;
  
  console.log(`عدد المسارات المُوثّقة: ${pathCount}`);
  console.log(`عدد النماذج المُوثّقة: ${schemaCount}`);
  
  console.log('تم التحقق من ملف Swagger JSON بنجاح!');
} catch (error) {
  console.error(`خطأ أثناء قراءة أو تحليل ملف Swagger JSON: ${error.message}`);
  process.exit(1);
} 