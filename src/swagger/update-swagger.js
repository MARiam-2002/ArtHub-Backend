import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { adminPaths } from './admin-swagger.js';
import { dashboardPaths } from './dashboard-swagger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// قراءة ملف arthub-swagger.json
const swaggerJsonPath = path.join(__dirname, 'arthub-swagger.json');
const swaggerDocument = JSON.parse(fs.readFileSync(swaggerJsonPath, 'utf8'));

// إضافة المسارات الجديدة
swaggerDocument.paths = {
  ...swaggerDocument.paths,
  ...adminPaths,
  ...dashboardPaths
};

// كتابة الملف المحدث
fs.writeFileSync(swaggerJsonPath, JSON.stringify(swaggerDocument, null, 2), 'utf8');

console.log('✅ تم تحديث ملف arthub-swagger.json بنجاح!');
console.log(`📊 إجمالي المسارات: ${Object.keys(swaggerDocument.paths).length}`);
console.log(`🔧 تم إضافة ${Object.keys(adminPaths).length} مسار من admin-swagger.js`);
console.log(`📈 تم إضافة ${Object.keys(dashboardPaths).length} مسار من dashboard-swagger.js`); 