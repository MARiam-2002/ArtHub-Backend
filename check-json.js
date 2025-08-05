import fs from 'fs';

try {
  const data = fs.readFileSync('src/swagger/arthub-swagger.json', 'utf8');
  JSON.parse(data);
  console.log('✅ JSON is valid');
} catch (error) {
  console.error('❌ JSON Error:', error.message);
} 