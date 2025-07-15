import fs from 'fs';

// Read the swagger file
const filePath = 'src/swagger/arthub-swagger.json';
let content = fs.readFileSync(filePath, 'utf8');

// Remove trailing whitespace and ensure proper ending
content = content.trim();

// Try to parse and re-stringify to ensure valid JSON
try {
  const parsed = JSON.parse(content);
  const fixedContent = JSON.stringify(parsed, null, 2);
  
  // Write back the fixed content
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  console.log('✅ Swagger JSON file fixed successfully!');
  
  // Verify it's valid
  JSON.parse(fs.readFileSync(filePath, 'utf8'));
  console.log('✅ JSON validation passed!');
} catch (error) {
  console.error('❌ Error fixing JSON:', error.message);
} 