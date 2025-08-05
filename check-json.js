import fs from 'fs';

try {
  const content = fs.readFileSync('src/swagger/arthub-swagger.json', 'utf8');
  JSON.parse(content);
  console.log('✅ JSON is valid');
} catch (error) {
  console.error('❌ JSON error:', error.message);
} 