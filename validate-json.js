import fs from 'fs';

try {
  const data = fs.readFileSync('src/swagger/arthub-swagger.json', 'utf8');
  const parsed = JSON.parse(data);
  
  // التحقق من وجود paths
  if (parsed.paths) {
    console.log('✅ JSON is valid');
    console.log('✅ Paths section exists');
    console.log(`📊 Number of paths: ${Object.keys(parsed.paths).length}`);
    
    // عرض أول 5 مسارات
    const paths = Object.keys(parsed.paths);
    console.log('🔍 First 5 paths:');
    paths.slice(0, 5).forEach(path => {
      console.log(`  - ${path}`);
    });
  } else {
    console.log('❌ No paths section found');
  }
} catch (error) {
  console.error('❌ JSON Error:', error.message);
  console.error('📍 Error position:', error.message.match(/position (\d+)/)?.[1] || 'unknown');
} 