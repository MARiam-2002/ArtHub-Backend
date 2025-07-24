import fs from 'fs';
import path from 'path';

// قائمة الملفات التي تحتاج إلى تحديث
const filesToUpdate = [
  'src/swagger/arthub-swagger-backup.json',
  'src/swagger/updated-swagger.json',
  'src/swagger/swagger.json'
];

// التحديثات المطلوبة
const updates = {
  summary: "حذف طلب نهائيًا",
  description: "حذف طلب نهائيًا من قاعدة البيانات مع إرسال إشعار للعميل",
  requestBody: {
    required: true,
    content: {
      "application/json": {
        schema: {
          type: "object",
          required: ["cancellationReason"],
          properties: {
            cancellationReason: {
              type: "string",
              minLength: 5,
              description: "سبب إلغاء الطلب من قبل الإدارة",
              example: "تم الإلغاء بسبب مخالفة الشروط"
            }
          }
        }
      }
    }
  },
  responses: {
    "200": {
      description: "تم حذف الطلب نهائيًا وإشعار العميل",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: true
              },
              message: {
                type: "string",
                example: "تم حذف الطلب نهائيًا من قاعدة البيانات وإشعار العميل"
              },
              data: {
                type: "null"
              }
            }
          }
        }
      }
    },
    "400": {
      description: "بيانات غير صحيحة أو سبب الإلغاء مطلوب",
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                example: false
              },
              message: {
                type: "string",
                example: "سبب الإلغاء مطلوب"
              }
            }
          }
        }
      }
    }
  }
};

function updateFile(filePath) {
  try {
    console.log(`Updating ${filePath}...`);
    
    const content = fs.readFileSync(filePath, 'utf8');
    const swagger = JSON.parse(content);
    
    // البحث عن endpoint حذف الطلبات الإدارية
    const adminOrdersPath = "/api/admin/orders/{id}";
    
    if (swagger.paths && swagger.paths[adminOrdersPath] && swagger.paths[adminOrdersPath].delete) {
      const deleteEndpoint = swagger.paths[adminOrdersPath].delete;
      
      // تطبيق التحديثات
      deleteEndpoint.summary = updates.summary;
      deleteEndpoint.description = updates.description;
      deleteEndpoint.requestBody = updates.requestBody;
      deleteEndpoint.responses = { ...deleteEndpoint.responses, ...updates.responses };
      
      // حفظ الملف
      fs.writeFileSync(filePath, JSON.stringify(swagger, null, 2));
      console.log(`✅ Updated ${filePath}`);
    } else {
      console.log(`⚠️  Admin orders delete endpoint not found in ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
  }
}

// تحديث جميع الملفات
console.log('🔄 Updating Swagger files...\n');

filesToUpdate.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    updateFile(filePath);
  } else {
    console.log(`⚠️  File not found: ${filePath}`);
  }
});

console.log('\n✅ Swagger files update completed!');
console.log('💡 You may need to clear your browser cache or restart the server to see the changes.'); 