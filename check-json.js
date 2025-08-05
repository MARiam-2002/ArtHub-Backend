import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  const swaggerPath = path.join(__dirname, 'src', 'swagger', 'arthub-swagger.json');
  const content = fs.readFileSync(swaggerPath, 'utf8');
  const parsed = JSON.parse(content);
  console.log('✅ JSON is valid!');
  console.log(`📄 File size: ${content.length} characters`);
  console.log(`🔗 Number of paths: ${Object.keys(parsed.paths || {}).length}`);
  console.log(`📋 Number of schemas: ${Object.keys(parsed.components?.schemas || {}).length}`);
} catch (error) {
  console.error('❌ JSON Error:', error.message);
} 