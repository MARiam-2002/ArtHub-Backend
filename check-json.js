const fs = require('fs');

try {
  const content = fs.readFileSync('swagger.json', 'utf8');
  JSON.parse(content);
  console.log('✅ swagger.json is valid JSON');
} catch (error) {
  console.error('❌ JSON error:', error.message);
  console.error('Position:', error.message.match(/position (\d+)/)?.[1] || 'unknown');
} 