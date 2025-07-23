import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminPaths } from './admin-swagger.js';
import { dashboardPaths } from './dashboard-swagger.js';
import { swaggerDefinition } from './swagger-definition.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  // التحقق من وجود الملفات المطلوبة
  const swaggerJsonPath = path.join(__dirname, 'arthub-swagger.json');
  
  if (!fs.existsSync(swaggerJsonPath)) {
    throw new Error(`الملف غير موجود: ${swaggerJsonPath}`);
  }

  // قراءة ملف arthub-swagger.json
  const swaggerContent = fs.readFileSync(swaggerJsonPath, 'utf8');
  let swaggerDocument;
  
  try {
    swaggerDocument = JSON.parse(swaggerContent);
  } catch (parseError) {
    throw new Error(`خطأ في تحليل JSON: ${parseError.message}`);
  }

  // التحقق من وجود المسارات المطلوبة
  if (!adminPaths) {
    throw new Error('adminPaths غير معرف في admin-swagger.js');
  }
  
  if (!dashboardPaths) {
    throw new Error('dashboardPaths غير معرف في dashboard-swagger.js');
  }

  // إضافة المسارات الجديدة
  swaggerDocument.paths = {
    ...swaggerDocument.paths,
    ...adminPaths,
    ...dashboardPaths
  };

  // بعد دمج المسارات، أضف جميع الـ schemas من swagger-definition.js إلى components.schemas
  if (!swaggerDocument.components) swaggerDocument.components = {};
  if (!swaggerDocument.components.schemas) swaggerDocument.components.schemas = {};
  
  const schemasToAdd = swaggerDefinition.components?.schemas || swaggerDefinition;
  Object.assign(swaggerDocument.components.schemas, schemasToAdd);

  // إضافة schema الـ SpecialRequestCreate إذا لم يكن موجوداً
  if (!swaggerDocument.components.schemas.SpecialRequestCreate) {
    swaggerDocument.components.schemas.SpecialRequestCreate = {
      "type": "object",
      "required": [
        "artist",
        "requestType",
        "description",
        "budget",
        "duration"
      ],
      "properties": {
        "artist": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "description": "معرف الفنان (MongoDB ObjectId)",
          "example": "507f1f77bcf86cd799439011"
        },
        "requestType": {
          "type": "string",
          "enum": [
            "custom_artwork",
            "portrait",
            "logo_design",
            "illustration",
            "ready_artwork",
            "digital_art",
            "traditional_art",
            "animation",
            "graphic_design",
            "character_design",
            "concept_art",
            "other"
          ],
          "description": "نوع العمل المطلوب"
        },
        "description": {
          "type": "string",
          "minLength": 20,
          "maxLength": 2000,
          "description": "وصف تفصيلي للعمل (20-2000 حرف)"
        },
        "budget": {
          "type": "number",
          "minimum": 10,
          "maximum": 100000,
          "description": "الميزانية المقترحة (10-100,000)"
        },
        "duration": {
          "type": "number",
          "minimum": 1,
          "maximum": 365,
          "description": "المدة المطلوبة بالأيام (1-365)"
        },
        "technicalDetails": {
          "type": "string",
          "maxLength": 1000,
          "description": "تفاصيل فنية إضافية (اختياري، أقل من 1000 حرف)"
        },
        "currency": {
          "type": "string",
          "enum": ["SAR", "USD", "EUR", "AED"],
          "default": "SAR",
          "description": "العملة (افتراضي: SAR)"
        },
        "artwork": {
          "type": "string",
          "pattern": "^[0-9a-fA-F]{24}$",
          "description": "معرف العمل الفني (مطلوب فقط إذا كان requestType هو ready_artwork)"
        }
      }
    };
  }

  // تصحيح requestBody للـ endpoint الخاص بإنشاء طلب خاص ليستخدم $ref
  if (
    swaggerDocument.paths &&
    swaggerDocument.paths['/api/special-requests'] &&
    swaggerDocument.paths['/api/special-requests'].post
  ) {
    swaggerDocument.paths['/api/special-requests'].post.requestBody = {
      required: true,
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/SpecialRequestCreate'
          }
        }
      }
    };
  }

  // التحقق من صحة البيانات قبل الكتابة
  const updatedContent = JSON.stringify(swaggerDocument, null, 2);
  
  // كتابة الملف المحدث
  fs.writeFileSync(swaggerJsonPath, updatedContent, 'utf8');

  console.log('✅ تم تحديث ملف arthub-swagger.json بنجاح!');
  console.log(`📊 إجمالي المسارات: ${Object.keys(swaggerDocument.paths).length}`);
  console.log(`🔧 تم إضافة ${Object.keys(adminPaths).length} مسار من admin-swagger.js`);
  console.log(`📈 تم إضافة ${Object.keys(dashboardPaths).length} مسار من dashboard-swagger.js`);
  console.log(`📋 تم إضافة ${Object.keys(schemasToAdd).length} schema جديد`);
  console.log(`🎨 تم إضافة schema SpecialRequestCreate`);

} catch (error) {
  console.error('❌ خطأ في تحديث ملف Swagger:');
  console.error(`   ${error.message}`);
  process.exit(1);
} 