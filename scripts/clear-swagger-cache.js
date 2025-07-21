import fetch from 'node-fetch';

const BASE_URL = 'https://art-hub-backend.vercel.app';

async function clearSwaggerCache() {
  try {
    console.log('🧹 إجبار تحديث Swagger Cache...');
    
    // إرسال طلب مع headers لمنع cache
    console.log('\n📝 إرسال طلب مع headers لمنع cache...');
    const response = await fetch(`${BASE_URL}/api-docs`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (response.ok) {
      const htmlText = await response.text();
      console.log('✅ تم جلب Swagger HTML مع headers لمنع cache');
      
      // البحث عن الفلاتر المحذوفة
      const removedFilters = ['type', 'role', 'status', 'dateFrom', 'dateTo'];
      const foundRemovedFilters = removedFilters.filter(filter => htmlText.includes(filter));
      
      if (foundRemovedFilters.length > 0) {
        console.log('❌ الفلاتر المحذوفة لا تزال موجودة:', foundRemovedFilters);
        console.log('💡 هذا يعني أن Swagger UI يستخدم cache أو أن هناك ملف آخر');
      } else {
        console.log('✅ تم إزالة جميع الفلاتر المحذوفة بنجاح!');
      }
      
      // البحث عن معامل format
      if (htmlText.includes('format')) {
        console.log('✅ معامل format موجود في HTML');
      } else {
        console.log('❌ معامل format غير موجود في HTML');
      }
      
    } else {
      console.log('❌ فشل في جلب Swagger HTML:', response.status);
    }
    
    // اختبار جلب Swagger JSON مباشرة
    console.log('\n📝 جلب Swagger JSON مباشرة...');
    const jsonResponse = await fetch(`${BASE_URL}/api-docs/swagger.json`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (jsonResponse.ok) {
      const jsonText = await jsonResponse.text();
      
      // البحث عن الفلاتر المحذوفة في JSON
      const removedFilters = ['"type"', '"role"', '"status"', '"dateFrom"', '"dateTo"'];
      const foundRemovedFilters = removedFilters.filter(filter => jsonText.includes(filter));
      
      if (foundRemovedFilters.length > 0) {
        console.log('❌ الفلاتر المحذوفة موجودة في JSON:', foundRemovedFilters);
      } else {
        console.log('✅ تم إزالة جميع الفلاتر المحذوفة من JSON بنجاح!');
      }
      
    } else {
      console.log('❌ فشل في جلب Swagger JSON:', jsonResponse.status);
    }
    
    console.log('\n🎉 تم إنجاز إجبار تحديث cache!');
    console.log('📋 يمكنك الآن فتح Swagger UI للتحقق من التحديثات');
    console.log('💡 إذا كانت الفلاتر لا تزال موجودة، قد تحتاج إلى تحديث الصفحة يدوياً');
    
  } catch (error) {
    console.error('❌ خطأ في إجبار تحديث cache:', error);
  }
}

// تشغيل إجبار تحديث cache
clearSwaggerCache(); 